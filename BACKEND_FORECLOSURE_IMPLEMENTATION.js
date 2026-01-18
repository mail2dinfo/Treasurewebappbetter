// Backend Implementation for Personal Loan Foreclosure with Payment Mode and Ledger Integration
// File: src/controllers/plLoanController.js
// Add this method to your existing plLoanController.js

const forecloseLoan = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    
    try {
        const { loanId } = req.params;
        const { paymentDate, paymentMode, pl_ledger_accounts_id, membershipId } = req.body;

        // Validate required fields
        if (!paymentDate) {
            await transaction.rollback();
            return responseUtils.failure(res, "Payment date is required", 400);
        }

        if (!pl_ledger_accounts_id) {
            await transaction.rollback();
            return responseUtils.failure(res, "Ledger account is required", 400);
        }

        // Find the loan
        const loan = await db.plLoan.findOne({
            where: { id: loanId },
            include: [
                {
                    model: db.plSubscriber,
                    as: 'subscriber'
                },
                {
                    model: db.plReceivable,
                    as: 'receivables',
                    where: { status: { [db.Sequelize.Op.ne]: 'PAID' } },
                    required: false
                }
            ],
            transaction
        });

        if (!loan) {
            await transaction.rollback();
            return responseUtils.failure(res, "Loan not found", 404);
        }

        if (loan.status === 'FORECLOSED' || loan.status === 'CLOSED') {
            await transaction.rollback();
            return responseUtils.failure(res, "Loan is already closed or foreclosed", 400);
        }

        // Verify ledger account exists and belongs to the membership
        const ledgerAccount = await db.plLedgerAccount.findOne({
            where: {
                id: pl_ledger_accounts_id,
                parent_membership_id: membershipId
            },
            transaction
        });

        if (!ledgerAccount) {
            await transaction.rollback();
            return responseUtils.failure(res, "Ledger account not found or access denied", 404);
        }

        // Calculate outstanding amounts
        const outstandingPrincipal = parseFloat(loan.outstanding_principal || 0);
        const outstandingInterest = parseFloat(loan.outstanding_interest || 0);
        const totalOutstanding = outstandingPrincipal + outstandingInterest;

        // Get all unpaid receivables
        const unpaidReceivables = await db.plReceivable.findAll({
            where: {
                loan_id: loanId,
                status: { [db.Sequelize.Op.ne]: 'PAID' }
            },
            transaction
        });

        // Mark all receivables as paid
        for (const receivable of unpaidReceivables) {
            await receivable.update({
                status: 'PAID',
                paid_amount: receivable.due_amount
            }, { transaction });
        }

        // Create foreclosure receipt
        const receipt = await db.plReceipt.create({
            loan_id: loanId,
            receivable_id: unpaidReceivables.length > 0 ? unpaidReceivables[0].id : null,
            received_amount: totalOutstanding,
            principal_paid: outstandingPrincipal,
            interest_paid: outstandingInterest,
            payment_date: paymentDate,
            payment_mode: paymentMode,
            parent_membership_id: membershipId,
        }, { transaction });

        // Create ledger entry for the foreclosure payment (credit to ledger account)
        const ledgerEntry = await db.plLedgerEntry.create({
            pl_ledger_accounts_id: pl_ledger_accounts_id,
            parent_membership_id: membershipId,
            category: 'LOAN_FORECLOSURE',
            subcategory: 'PAYMENT_RECEIVED',
            amount: totalOutstanding, // Positive amount (credit)
            description: `Loan foreclosure payment - ${loan.subscriber?.pl_cust_name || 'N/A'} - Loan ID: ${loanId}`,
            reference_id: receipt.id,
            reference_type: 'PL_RECEIPT',
            payment_date: paymentDate,
        }, { transaction });

        // Update ledger account balance (add the payment amount)
        await ledgerAccount.update({
            current_balance: db.sequelize.literal(`current_balance + ${totalOutstanding}`)
        }, { transaction });

        // Update loan status
        await loan.update({
            status: 'FORECLOSED',
            outstanding_principal: 0,
            outstanding_interest: 0,
        }, { transaction });

        await transaction.commit();

        // Fetch updated loan with all relations
        const updatedLoan = await db.plLoan.findOne({
            where: { id: loanId },
            include: [
                {
                    model: db.plSubscriber,
                    as: 'subscriber'
                },
                {
                    model: db.plReceivable,
                    as: 'receivables'
                },
                {
                    model: db.plReceipt,
                    as: 'receipts'
                }
            ]
        });

        return responseUtils.success(res, updatedLoan, "Loan foreclosed successfully");
    } catch (error) {
        await transaction.rollback();
        console.error('Error foreclosing loan:', error);
        return responseUtils.failure(res, error.message || "Failed to foreclose loan", 500);
    }
};

// Export the function
module.exports = {
    // ... other exports
    forecloseLoan
};
