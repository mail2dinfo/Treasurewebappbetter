# Personal Loan App - Flexible Payment Flow (Updated) 🔄

## ✅ Updated Requirement

**User Request:** For FLEXIBLE_PAYMENT mode, **generate receivables for remaining due amount** after each payment.

---

## 🔄 Flow Explanation

### **Initial Loan Creation (FLEXIBLE_PAYMENT):**

**Loan Created:**
- `principal_amount = 12000`
- `outstanding_balance = 12000`
- `payment_mode = FLEXIBLE_PAYMENT`
- **No receivables created initially**

---

### **Payment Flow:**

#### **Step 1: First Payment (₹9,000)**

**1.1. Create/Get Receivable for Current Outstanding:**
- Check if unpaid receivable exists (none initially)
- If none, create receivable for current outstanding balance (₹12,000)
- Receivable: `total_due = 12000`, `principal_due = 12000`, `interest_due = 0`

**1.2. Create Receipt:**
- Receipt linked to receivable
- `paid_amount = 9000`
- `principal_paid = 9000`
- `interest_paid = 0`

**1.3. Update Receivable:**
- `paid_amount = 9000`
- `is_paid = false` (partial payment, ₹3,000 remaining)
- `closing_principal_balance = 3000`

**1.4. Update Loan:**
- `outstanding_balance = 12000 - 9000 = 3000`
- `total_principal_paid = 9000`

**1.5. Create New Receivable for Remaining:**
- Since ₹3,000 still outstanding, create new receivable
- Receivable: `total_due = 3000`, `principal_due = 3000`, `due_date = today` (or next day)
- This receivable will be paid in next payment

---

#### **Step 2: Second Payment (₹3,000)**

**2.1. Get Existing Receivable:**
- Find unpaid receivable (₹3,000 receivable from Step 1.5)

**2.2. Create Receipt:**
- Receipt linked to receivable
- `paid_amount = 3000`
- `principal_paid = 3000`
- `interest_paid = 0`

**2.3. Update Receivable:**
- `paid_amount = 3000`
- `is_paid = true` (fully paid)
- `paid_date = payment_date`

**2.4. Update Loan:**
- `outstanding_balance = 3000 - 3000 = 0`
- `total_principal_paid = 12000`
- `status = CLOSED`
- `loan_maturity_date = payment_date`

**2.5. No New Receivable:**
- Loan fully paid, no new receivable created

---

## 📊 Data Flow Example

### **Loan Creation:**
```
Loan: pl-loan-005
├── principal_amount: 12000.00
├── outstanding_balance: 12000.00
├── payment_mode: FLEXIBLE_PAYMENT
└── Receivables: [] (empty)
```

---

### **After First Payment (₹9,000):**
```
Loan: pl-loan-005
├── outstanding_balance: 3000.00
├── total_principal_paid: 9000.00
└── Receivables:
    ├── pl-rec-050 (created dynamically)
    │   ├── total_due: 12000.00
    │   ├── paid_amount: 9000.00
    │   ├── is_paid: false (partial)
    │   └── Receipt: pl-rcpt-013 (₹9,000)
    │
    └── pl-rec-051 (created for remaining)
        ├── total_due: 3000.00
        ├── paid_amount: 0.00
        └── is_paid: false (pending)
```

---

### **After Second Payment (₹3,000):**
```
Loan: pl-loan-005
├── outstanding_balance: 0.00
├── total_principal_paid: 12000.00
├── status: CLOSED
└── Receivables:
    ├── pl-rec-050 (completed)
    │   ├── total_due: 12000.00
    │   ├── paid_amount: 9000.00
    │   └── is_paid: false (partial, but closed)
    │
    └── pl-rec-051 (paid)
        ├── total_due: 3000.00
        ├── paid_amount: 3000.00
        ├── is_paid: true
        └── Receipt: pl-rcpt-014 (₹3,000)
```

---

## 💻 Updated Implementation Code

```javascript
async function collectFlexiblePayment(loan, paymentAmount, paymentDate, paymentMethod, userId) {
    const transaction = await db.sequelize.transaction();
    
    try {
        // Validation
        if (loan.payment_mode !== 'FLEXIBLE_PAYMENT') {
            throw new Error('Loan is not in flexible payment mode');
        }
        
        if (loan.outstanding_balance <= 0) {
            throw new Error('Loan already closed');
        }
        
        // Calculate actual payment (cannot exceed outstanding)
        const actualPayment = Math.min(paymentAmount, loan.outstanding_balance);
        
        // Find or create receivable for current outstanding balance
        let receivable = await db.plReceivable.findOne({
            where: {
                loan_id: loan.id,
                is_paid: false
            },
            order: [['created_at', 'DESC']],
            transaction
        });
        
        // If no unpaid receivable exists, create one for current outstanding balance
        if (!receivable) {
            const installmentNumber = await getNextInstallmentNumber(loan.id, transaction);
            
            receivable = await db.plReceivable.create({
                id: uuidv4(),
                loan_id: loan.id,
                parent_membership_id: loan.parent_membership_id,
                installment_number: installmentNumber,
                due_date: paymentDate,
                opening_principal_balance: loan.outstanding_balance,
                principal_due: loan.outstanding_balance,
                interest_due: 0,
                total_due: loan.outstanding_balance,
                closing_principal_balance: loan.outstanding_balance - actualPayment,
                is_paid: false,
                paid_amount: 0,
                carry_forward: 0
            }, { transaction });
        }
        
        // Create receipt linked to receivable
        const receipt = await db.plReceipt.create({
            id: uuidv4(),
            loan_id: loan.id,
            receivable_id: receivable.id,
            parent_membership_id: loan.parent_membership_id,
            paid_amount: actualPayment,
            principal_paid: actualPayment,
            interest_paid: 0,
            payment_date: paymentDate,
            payment_method: paymentMethod,
            remarks: 'Flexible payment',
            created_by: userId
        }, { transaction });
        
        // Update receivable
        receivable.paid_amount += actualPayment;
        receivable.closing_principal_balance = loan.outstanding_balance - actualPayment;
        receivable.updated_at = new Date();
        
        // Check if receivable is fully paid
        if (receivable.paid_amount >= receivable.total_due) {
            receivable.is_paid = true;
            receivable.paid_date = paymentDate;
        } else {
            receivable.carry_forward = receivable.total_due - receivable.paid_amount;
        }
        
        await receivable.save({ transaction });
        
        // Update loan
        loan.outstanding_balance -= actualPayment;
        loan.total_principal_paid += actualPayment;
        loan.updated_at = new Date();
        
        if (loan.outstanding_balance <= 0) {
            loan.status = 'CLOSED';
            loan.loan_maturity_date = paymentDate;
        }
        
        await loan.save({ transaction });
        
        // If there's still outstanding balance, create new receivable for remaining amount
        if (loan.outstanding_balance > 0) {
            const nextInstallmentNumber = await getNextInstallmentNumber(loan.id, transaction);
            
            await db.plReceivable.create({
                id: uuidv4(),
                loan_id: loan.id,
                parent_membership_id: loan.parent_membership_id,
                installment_number: nextInstallmentNumber,
                due_date: paymentDate, // Or add 1 day: nextDay(paymentDate)
                opening_principal_balance: loan.outstanding_balance,
                principal_due: loan.outstanding_balance,
                interest_due: 0,
                total_due: loan.outstanding_balance,
                closing_principal_balance: 0, // Will be calculated when paid
                is_paid: false,
                paid_amount: 0,
                carry_forward: 0
            }, { transaction });
        }
        
        // Create ledger entry
        await createLedgerEntry({
            pl_ledger_accounts_id: ledgerAccountId,
            parent_membership_id: loan.parent_membership_id,
            category: 'COLLECTION',
            subcategory: 'Flexible Payment',
            amount: actualPayment,
            description: `Flexible payment for loan ${loan.id}`,
            reference_id: receipt.id,
            reference_type: 'collection',
            payment_date: paymentDate,
            created_by: userId
        }, { transaction });
        
        await transaction.commit();
        
        return {
            receipt,
            receivable,
            loan,
            remainingBalance: loan.outstanding_balance
        };
        
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function getNextInstallmentNumber(loanId, transaction) {
    const maxReceivable = await db.plReceivable.findOne({
        where: { loan_id: loanId },
        order: [['installment_number', 'DESC']],
        transaction
    });
    
    return maxReceivable ? maxReceivable.installment_number + 1 : 1;
}
```

---

## 📋 Key Points

1. **Receivables Created Dynamically:**
   - First receivable created when first payment is made
   - New receivable created for remaining balance after each payment
   - Receivables represent "remaining due" not "fixed installments"

2. **Payment Tracking:**
   - All receipts linked to receivables
   - Maintains consistent structure with FIXED_INSTALLMENT mode
   - Easy to query and report

3. **Benefits:**
   - ✅ Flexible payment amounts (₹9,000, ₹3,000, etc.)
   - ✅ Receivables track remaining balance
   - ✅ Consistent data structure
   - ✅ Easy to query outstanding receivables
   - ✅ Works with existing receivable/receipt system

---

## ✅ Updated Implementation Summary

### **Changes:**

1. **Loan Creation (FLEXIBLE_PAYMENT):**
   - No receivables created initially
   - Receivables created dynamically on first payment

2. **Payment Collection:**
   - Create/get receivable for current outstanding balance
   - Link receipt to receivable
   - Update receivable
   - Create new receivable for remaining balance (if any)

3. **Receivable Structure:**
   - Receivables represent "remaining due" after each payment
   - Not fixed installments
   - Amount = remaining outstanding balance

---

**Status:** ✅ Updated with Dynamic Receivable Generation  
**Next Step:** Confirm this approach and update implementation plan
