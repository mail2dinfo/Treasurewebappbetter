# Personal Loan App - Partial Payment & Foreclosure Features 📊

This document provides detailed examples of **Partial Payment** and **Loan Foreclosure** features for all 3 payment types.

---

## 🔑 Key Features

1. **Partial Payment** - Borrower can pay less than `total_due` amount
   - Unpaid amount (`carry_forward`) is added to next installment
   - Works for all 3 payment types: INTEREST_FREE, INTEREST_ONLY, INTEREST_PRINCIPAL

2. **Loan Foreclosure** - Borrower can pay entire loan early
   - Interest calculated only up to foreclosure date (for INTEREST_ONLY and INTEREST_PRINCIPAL)
   - All remaining receivables marked as paid
   - Loan status set to CLOSED
   - Works for all 3 payment types

---

## 📋 Table Schema Updates

### **pl_receivable** - Added Field:

```sql
carry_forward DECIMAL(12, 2) DEFAULT 0 COMMENT 'Unpaid amount carried to next installment'
```

This field stores the unpaid portion when a partial payment is made.

---

## 💰 Partial Payment Examples

### **Example 1: INTEREST_FREE Loan - Partial Payment**

**Loan:** `pl-loan-001` (INTEREST_FREE, ₹100,000, 12 months, ₹8,333.33/month)

**Scenario:** Borrower pays only ₹5,000 for 3rd installment (due ₹8,333.33)

#### Before Payment:
| id | installment_number | due_date | principal_due | interest_due | total_due | is_paid | paid_amount | carry_forward |
|----|-------------------|----------|---------------|--------------|-----------|---------|-------------|---------------|
| `pl-rec-003` | 3 | 2026-04-10 | 8333.33 | 0.00 | 8333.33 | ❌ false | 0.00 | 0.00 |
| `pl-rec-004` | 4 | 2026-05-10 | 8333.33 | 0.00 | 8333.33 | ❌ false | 0.00 | 0.00 |

#### Payment Made: ₹5,000 on 2026-04-10

**Calculation:**
- `paid_amount = 5000.00`
- `carry_forward = 8333.33 - 5000.00 = 3333.33`
- `principal_paid = 5000.00` (100% of payment goes to principal)
- `interest_paid = 0.00`

#### After Payment:
| id | installment_number | due_date | principal_due | interest_due | total_due | is_paid | paid_amount | carry_forward |
|----|-------------------|----------|---------------|--------------|-----------|---------|-------------|---------------|
| `pl-rec-003` | 3 | 2026-04-10 | 8333.33 | 0.00 | 8333.33 | ❌ false | 5000.00 | 3333.33 |
| `pl-rec-004` | 4 | 2026-05-10 | 8333.33 | 0.00 | **11666.66** | ❌ false | 0.00 | 0.00 |

**Note:** 
- `pl-rec-003`: Still `is_paid = false` because full amount not paid
- `pl-rec-004`: `total_due` increased to `8333.33 + 3333.33 = 11666.66`

#### Receipt Created:
| id | receivable_id | paid_amount | principal_paid | interest_paid | payment_date |
|----|---------------|-------------|----------------|---------------|--------------|
| `pl-rcpt-007` | `pl-rec-003` | 5000.00 | 5000.00 | 0.00 | 2026-04-10 |

#### Loan Updated:
- `outstanding_balance = 91666.67 - 5000.00 = 86666.67`
- `total_principal_paid = 16666.67 + 5000.00 = 21666.67`
- `status = ACTIVE` (still has outstanding)

---

### **Example 2: INTEREST_ONLY Loan - Partial Payment**

**Loan:** `pl-loan-002` (INTEREST_ONLY, ₹200,000, 12% annual, ₹2,000/month interest)

**Scenario:** Borrower pays only ₹1,500 for 3rd installment (due ₹2,000)

#### Before Payment:
| id | installment_number | due_date | principal_due | interest_due | total_due | is_paid | paid_amount | carry_forward |
|----|-------------------|----------|---------------|--------------|-----------|---------|-------------|---------------|
| `pl-rec-015` | 3 | 2026-04-15 | 0.00 | 2000.00 | 2000.00 | ❌ false | 0.00 | 0.00 |
| `pl-rec-016` | 4 | 2026-05-15 | 0.00 | 2000.00 | 2000.00 | ❌ false | 0.00 | 0.00 |

#### Payment Made: ₹1,500 on 2026-04-15

**Calculation:**
- `paid_amount = 1500.00`
- `carry_forward = 2000.00 - 1500.00 = 500.00`
- `principal_paid = 0.00` (no principal payment)
- `interest_paid = 1500.00` (100% of payment goes to interest)

#### After Payment:
| id | installment_number | due_date | principal_due | interest_due | total_due | is_paid | paid_amount | carry_forward |
|----|-------------------|----------|---------------|--------------|-----------|---------|-------------|---------------|
| `pl-rec-015` | 3 | 2026-04-15 | 0.00 | 2000.00 | 2000.00 | ❌ false | 1500.00 | 500.00 |
| `pl-rec-016` | 4 | 2026-05-15 | 0.00 | 2000.00 | **2500.00** | ❌ false | 0.00 | 0.00 |

**Note:**
- `pl-rec-016`: `total_due` increased to `2000.00 + 500.00 = 2500.00`
- Principal balance remains ₹200,000 (unchanged)

#### Receipt Created:
| id | receivable_id | paid_amount | principal_paid | interest_paid | payment_date |
|----|---------------|-------------|----------------|---------------|--------------|
| `pl-rcpt-008` | `pl-rec-015` | 1500.00 | 0.00 | 1500.00 | 2026-04-15 |

#### Loan Updated:
- `outstanding_balance = 200000.00` (unchanged - no principal paid)
- `total_interest_paid = 4000.00 + 1500.00 = 5500.00`
- `status = ACTIVE`

---

### **Example 3: INTEREST_PRINCIPAL (EMI) Loan - Partial Payment**

**Loan:** `pl-loan-003` (INTEREST_PRINCIPAL, ₹500,000, 10.5% annual, EMI ₹23,236.67/month)

**Scenario:** Borrower pays only ₹18,000 for 3rd installment (due ₹23,236.67)

#### Before Payment:
| id | installment_number | due_date | opening_balance | principal_due | interest_due | total_due | is_paid | paid_amount |
|----|-------------------|----------|-----------------|---------------|--------------|-----------|---------|-------------|
| `pl-rec-027` | 3 | 2026-04-20 | 462111.79 | 19193.13 | 4043.54 | 23236.67 | ❌ false | 0.00 |
| `pl-rec-028` | 4 | 2026-05-20 | 442918.66 | 19361.53 | 3875.14 | 23236.67 | ❌ false | 0.00 |

#### Payment Made: ₹18,000 on 2026-04-20

**Calculation:**
- `paid_amount = 18000.00`
- `carry_forward = 23236.67 - 18000.00 = 5236.67`
- Split payment proportionally:
  - Principal ratio = `19193.13 / 23236.67 = 0.8263`
  - Interest ratio = `4043.54 / 23236.67 = 0.1737`
  - `principal_paid = 18000.00 * 0.8263 = 14873.40`
  - `interest_paid = 18000.00 * 0.1737 = 3126.60`

#### After Payment:
| id | installment_number | due_date | opening_balance | principal_due | interest_due | total_due | is_paid | paid_amount | carry_forward |
|----|-------------------|----------|-----------------|---------------|--------------|-----------|---------|-------------|---------------|
| `pl-rec-027` | 3 | 2026-04-20 | 462111.79 | 19193.13 | 4043.54 | 23236.67 | ❌ false | 18000.00 | 5236.67 |
| `pl-rec-028` | 4 | 2026-05-20 | 447238.39 | 19361.53 | 3875.14 | **28473.34** | ❌ false | 0.00 | 0.00 |

**Note:**
- `pl-rec-028`: `total_due` increased to `23236.67 + 5236.67 = 28473.34`
- Outstanding balance reduced: `462111.79 - 14873.40 = 447238.39`

#### Receipt Created:
| id | receivable_id | paid_amount | principal_paid | interest_paid | payment_date |
|----|---------------|-------------|----------------|---------------|--------------|
| `pl-rcpt-009` | `pl-rec-027` | 18000.00 | 14873.40 | 3126.60 | 2026-04-20 |

#### Loan Updated:
- `outstanding_balance = 462111.79 - 14873.40 = 447238.39`
- `total_principal_paid = 37888.21 + 14873.40 = 52761.61`
- `total_interest_paid = 8298.13 + 3126.60 = 11424.73`
- `status = ACTIVE`

---

## 🏁 Loan Foreclosure Examples

### **Example 1: INTEREST_FREE Loan - Foreclosure**

**Loan:** `pl-loan-001` (INTEREST_FREE, ₹100,000, 12 months)
**Current Status:** 3 payments made, 9 installments remaining
**Foreclosure Date:** 2026-05-15

#### Before Foreclosure:
- `outstanding_balance = 75000.00` (3 installments paid: 8333.33 * 3 = 25000.00)
- Remaining installments: 9 x ₹8,333.33 = ₹75,000.00

#### Foreclosure Calculation:
- **INTEREST_FREE:** No interest calculation needed
- **Outstanding Amount = ₹75,000.00** (only principal)

#### Foreclosure Payment: ₹75,000.00

#### After Foreclosure:

**Loan Updated:**
- `outstanding_balance = 0.00`
- `total_principal_paid = 100000.00`
- `total_interest_paid = 0.00`
- `status = CLOSED`
- `loan_maturity_date = 2026-05-15`

**Receivables Updated:**
All remaining 9 receivables marked as paid:
| id | installment_number | is_paid | paid_amount | paid_date |
|----|-------------------|---------|-------------|-----------|
| `pl-rec-004` | 4 | ✅ true | 8333.33 | 2026-05-15 |
| `pl-rec-005` | 5 | ✅ true | 8333.33 | 2026-05-15 |
| ... | ... | ✅ true | 8333.33 | 2026-05-15 |
| `pl-rec-012` | 12 | ✅ true | 8333.33 | 2026-05-15 |

**Receipt Created:**
| id | loan_id | paid_amount | principal_paid | interest_paid | payment_date | remarks |
|----|---------|-------------|----------------|---------------|--------------|---------|
| `pl-rcpt-010` | `pl-loan-001` | 75000.00 | 75000.00 | 0.00 | 2026-05-15 | Loan foreclosure |

---

### **Example 2: INTEREST_ONLY Loan - Foreclosure**

**Loan:** `pl-loan-002` (INTEREST_ONLY, ₹200,000, 12% annual)
**Current Status:** 3 payments made, 9 installments remaining
**Foreclosure Date:** 2026-05-20
**Last Payment Date:** 2026-03-15
**Days since last payment:** 66 days

#### Before Foreclosure:
- `outstanding_balance = 200000.00` (principal unchanged)
- `total_interest_paid = 6000.00` (3 payments x ₹2,000)

#### Foreclosure Calculation:
- **Outstanding Principal = ₹200,000.00**
- **Interest Calculation (only up to foreclosure date):**
  - Annual interest rate = 12%
  - Daily interest rate = 12% / 365 = 0.03288%
  - Interest for 66 days = ₹200,000 × 0.03288% × 66 = ₹4,340.16
- **Total Outstanding = ₹200,000.00 + ₹4,340.16 = ₹204,340.16**

**Note:** Interest calculated only for 66 days, NOT for remaining 9 months!

#### Foreclosure Payment: ₹204,340.16

#### After Foreclosure:

**Loan Updated:**
- `outstanding_balance = 0.00`
- `total_principal_paid = 200000.00`
- `total_interest_paid = 6000.00 + 4340.16 = 10340.16`
- `status = CLOSED`
- `loan_maturity_date = 2026-05-20`

**Receivables Updated:**
All remaining 9 receivables marked as paid:
- Principal portions: All ₹0.00 (already reflected in outstanding_balance)
- Interest portions: Interest only up to foreclosure date, not full remaining interest

**Receipt Created:**
| id | loan_id | paid_amount | principal_paid | interest_paid | payment_date | remarks |
|----|---------|-------------|----------------|---------------|--------------|---------|
| `pl-rcpt-011` | `pl-loan-002` | 204340.16 | 200000.00 | 4340.16 | 2026-05-20 | Loan foreclosure - Interest for 66 days |

---

### **Example 3: INTEREST_PRINCIPAL (EMI) Loan - Foreclosure**

**Loan:** `pl-loan-003` (INTEREST_PRINCIPAL, ₹500,000, 10.5% annual, EMI ₹23,236.67)
**Current Status:** 3 payments made, 21 installments remaining
**Foreclosure Date:** 2026-06-15
**Last Payment Date:** 2026-03-20
**Days since last payment:** 87 days
**Current Outstanding Balance:** ₹442,918.66

#### Before Foreclosure:
- `outstanding_balance = 442918.66`
- `total_principal_paid = 57081.34`
- `total_interest_paid = 12628.67`

#### Foreclosure Calculation:
- **Outstanding Principal = ₹442,918.66**
- **Interest Calculation (only up to foreclosure date):**
  - Annual interest rate = 10.5%
  - Daily interest rate = 10.5% / 365 = 0.02877%
  - Interest for 87 days = ₹442,918.66 × 0.02877% × 87 = ₹11,070.89
- **Total Outstanding = ₹442,918.66 + ₹11,070.89 = ₹453,989.55**

**Note:** 
- Interest calculated only for 87 days
- NOT for remaining 21 months of EMIs
- Borrower saves significant interest by foreclosing early

#### Foreclosure Payment: ₹453,989.55

#### After Foreclosure:

**Loan Updated:**
- `outstanding_balance = 0.00`
- `total_principal_paid = 500000.00`
- `total_interest_paid = 12628.67 + 11070.89 = 23699.56`
- `status = CLOSED`
- `loan_maturity_date = 2026-06-15`

**Interest Savings:**
- Original total interest (24 months): ~₹57,680.08
- Actual interest paid: ₹23,699.56
- **Savings: ₹33,980.52** (by foreclosing early)

**Receivables Updated:**
All remaining 21 receivables marked as paid:
| id | installment_number | is_paid | paid_amount | paid_date |
|----|-------------------|---------|-------------|-----------|
| `pl-rec-028` | 4 | ✅ true | 23236.67 | 2026-06-15 |
| ... | ... | ✅ true | 23236.67 | 2026-06-15 |
| `pl-rec-048` | 24 | ✅ true | 23236.67 | 2026-06-15 |

**Receipt Created:**
| id | loan_id | paid_amount | principal_paid | interest_paid | payment_date | remarks |
|----|---------|-------------|----------------|---------------|--------------|---------|
| `pl-rcpt-012` | `pl-loan-003` | 453989.55 | 442918.66 | 11070.89 | 2026-06-15 | Loan foreclosure - Interest for 87 days |

---

## 🔄 Business Logic Summary

### **Partial Payment Logic:**

```javascript
function processPartialPayment(receivable, paymentAmount) {
    const carryForward = receivable.total_due - paymentAmount;
    
    // Calculate proportional split
    const principalRatio = receivable.principal_due / receivable.total_due;
    const interestRatio = receivable.interest_due / receivable.total_due;
    
    const principalPaid = paymentAmount * principalRatio;
    const interestPaid = paymentAmount * interestRatio;
    
    // Update current receivable
    receivable.paid_amount = paymentAmount;
    receivable.carry_forward = carryForward;
    receivable.is_paid = false; // Still pending
    
    // Update next receivable
    const nextReceivable = getNextReceivable(receivable.loan_id);
    if (nextReceivable) {
        nextReceivable.total_due += carryForward;
    }
    
    // Update loan
    loan.outstanding_balance -= principalPaid;
    loan.total_principal_paid += principalPaid;
    loan.total_interest_paid += interestPaid;
}
```

### **Foreclosure Logic:**

```javascript
function processForeclosure(loan, foreclosureDate) {
    const daysSinceLastPayment = calculateDays(loan.last_payment_date, foreclosureDate);
    const outstandingPrincipal = loan.outstanding_balance;
    
    let totalOutstanding = outstandingPrincipal;
    let foreclosureInterest = 0;
    
    if (loan.payment_type === 'INTEREST_ONLY' || loan.payment_type === 'INTEREST_PRINCIPAL') {
        // Calculate interest only up to foreclosure date
        const dailyRate = (loan.interest_rate / 100) / 365;
        foreclosureInterest = outstandingPrincipal * dailyRate * daysSinceLastPayment;
        totalOutstanding = outstandingPrincipal + foreclosureInterest;
    }
    // INTEREST_FREE: No interest calculation needed
    
    // Mark all remaining receivables as paid
    const unpaidReceivables = getUnpaidReceivables(loan.id);
    unpaidReceivables.forEach(rec => {
        rec.is_paid = true;
        rec.paid_amount = rec.principal_due + rec.interest_due;
        rec.paid_date = foreclosureDate;
    });
    
    // Update loan
    loan.outstanding_balance = 0;
    loan.total_principal_paid = loan.principal_amount;
    loan.total_interest_paid += foreclosureInterest;
    loan.status = 'CLOSED';
    loan.loan_maturity_date = foreclosureDate;
    
    // Create foreclosure receipt
    createReceipt({
        loan_id: loan.id,
        paid_amount: totalOutstanding,
        principal_paid: outstandingPrincipal,
        interest_paid: foreclosureInterest,
        payment_date: foreclosureDate,
        remarks: 'Loan foreclosure'
    });
}
```

---

## ✅ Implementation Requirements

### **Database Changes:**
1. ✅ Add `carry_forward` field to `pl_receivable` table
2. ✅ Ensure `paid_amount` can be less than `total_due`

### **API Endpoints:**
1. ✅ `POST /api/v1/pl/collections/pay` - Supports partial payment (already exists)
2. ✅ `POST /api/v1/pl/loans/:loanId/foreclose` - New endpoint for foreclosure

### **Business Logic:**
1. ✅ Partial payment calculation with carry_forward
2. ✅ Proportional split of partial payment (principal vs interest)
3. ✅ Foreclosure amount calculation (interest only up to date)
4. ✅ Mark all receivables as paid on foreclosure
5. ✅ Update loan status and balances

### **Frontend Requirements:**
1. ✅ Payment form allows entering amount less than total_due
2. ✅ Show carry_forward amount when partial payment made
3. ✅ Show next installment with increased amount
4. ✅ Foreclosure button on loan details page
5. ✅ Show foreclosure amount (outstanding + interest up to date)
6. ✅ Confirmation dialog for foreclosure

---

## 📊 Benefits

### **Partial Payment:**
- ✅ Flexible payment options for borrowers
- ✅ Better cash flow management
- ✅ Reduced default risk
- ✅ Maintains loan schedule with adjustments

### **Loan Foreclosure:**
- ✅ Early loan closure option
- ✅ Interest savings for borrowers (only pay interest up to foreclosure date)
- ✅ Improved cash recovery for lenders
- ✅ Clear foreclosure calculation (transparent)

---

**Document Status:** ✅ Complete  
**Next Step:** Review and approve, then implement in code
