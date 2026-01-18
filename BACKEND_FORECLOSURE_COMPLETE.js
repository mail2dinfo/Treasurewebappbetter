// ============================================
// COMPLETE BACKEND IMPLEMENTATION FOR FORECLOSURE
// ============================================
// Copy this code to your backend repository
// Location: C:\Users\mail2\OneDrive\Desktop\Mani\Treasure Artifacts\Treasureservice\Latest from Github\treasure-service-main (1)

// ============================================
// 1. CONTROLLER METHOD
// File: src/controllers/plLoanController.js
// Add or update the forecloseLoan method
// ============================================

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

        if (!membershipId) {
            await transaction.rollback();
            return responseUtils.failure(res, "Membership ID is required", 400);
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

        if (totalOutstanding <= 0) {
            await transaction.rollback();
            return responseUtils.failure(res, "Loan has no outstanding amount to foreclose", 400);
        }

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
                paid_amount: receivable.due_amount || 0
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
            payment_mode: paymentMode || 'Foreclosure',
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
        const newBalance = parseFloat(ledgerAccount.current_balance || 0) + totalOutstanding;
        await ledgerAccount.update({
            current_balance: newBalance
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

// Export the function (add to your existing exports)
module.exports = {
    // ... your existing exports
    forecloseLoan
};

// ============================================
// 2. ROUTE DEFINITION
// File: src/routes/plRoutes.js
// Add this route to your existing routes
// ============================================

// Add this import at the top if not already present
const plLoanController = require('../controllers/plLoanController');
const { verifyToken } = require('../middleware/auth'); // Adjust path as needed

// Add this route (usually after other loan routes)
router.post('/loans/:loanId/foreclose', verifyToken, plLoanController.forecloseLoan);

// Example of full route file structure:
/*
const express = require('express');
const router = express.Router();
const plLoanController = require('../controllers/plLoanController');
const { verifyToken } = require('../middleware/auth');

// Other routes...
router.get('/loans', verifyToken, plLoanController.getAllLoans);
router.get('/loans/:loanId', verifyToken, plLoanController.getLoanById);
router.post('/loans/disburse', verifyToken, plLoanController.disburseLoan);

// Add foreclosure route
router.post('/loans/:loanId/foreclose', verifyToken, plLoanController.forecloseLoan);

module.exports = router;
*/

// ============================================
// 3. INTEGRATION STEPS
// ============================================
/*
STEP 1: Open your backend project
   Location: C:\Users\mail2\OneDrive\Desktop\Mani\Treasure Artifacts\Treasureservice\Latest from Github\treasure-service-main (1)

STEP 2: Update plLoanController.js
   - Open: src/controllers/plLoanController.js
   - Find the existing forecloseLoan method (if it exists) and replace it
   - OR add the new forecloseLoan method to your exports

STEP 3: Update plRoutes.js
   - Open: src/routes/plRoutes.js
   - Add the foreclosure route: router.post('/loans/:loanId/foreclose', verifyToken, plLoanController.forecloseLoan);

STEP 4: Verify database models
   Make sure these models exist and are properly configured:
   - db.plLoan
   - db.plSubscriber
   - db.plReceivable
   - db.plReceipt
   - db.plLedgerAccount
   - db.plLedgerEntry

STEP 5: Test the endpoint
   - Start your backend server
   - Test with Postman or your frontend
   - Verify that:
     * Receipt is created
     * Ledger entry is created
     * Ledger account balance is updated
     * Loan status changes to FORECLOSED
     * All receivables are marked as PAID
*/

// ============================================
// 4. API TESTING EXAMPLE
// ============================================
/*
POST http://localhost:YOUR_PORT/api/v1/pl/loans/{loanId}/foreclose
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json

Body:
{
  "paymentDate": "2024-01-15",
  "paymentMode": "Cash Account",
  "pl_ledger_accounts_id": "uuid-of-ledger-account",
  "membershipId": "uuid-of-membership"
}

Expected Response:
{
  "success": true,
  "results": {
    // Updated loan object with all relations
  },
  "message": "Loan foreclosed successfully"
}
*/

// ============================================
// 5. NOTES
// ============================================
/*
- All operations are wrapped in a database transaction for atomicity
- If any step fails, the entire transaction is rolled back
- The ledger entry amount is positive (credit) since it's money received
- The ledger account balance is increased by the foreclosure amount
- All unpaid receivables are automatically marked as PAID
- The loan status is set to FORECLOSED
- Outstanding amounts are cleared (set to 0)
*/
