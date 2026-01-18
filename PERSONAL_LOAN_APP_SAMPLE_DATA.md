   # Personal Loan App - Sample Data Examples 📊

This document provides realistic sample data for all 7 tables to help validate the schema design and understand data relationships.

---

## 📋 Table Structure Overview

```
pl_company (1) → pl_subscriber (many)
                    ↓
                pl_loan (many)
                    ↓
            pl_receivable (many per loan)
                    ↓
            pl_receipt (many per receivable)
                    ↓
    pl_ledger_account ← pl_ledger_entry (many)
```

---

## 1️⃣ pl_company (Companies)

**Purpose:** Companies/Organizations that provide personal loans

### Sample Data:

| id | parent_membership_id | company_name | company_logo | contact_no | address | created_by | created_at |
|----|---------------------|--------------|--------------|------------|---------|------------|------------|
| `pl-comp-001` | 1001 | ABC Finance Pvt Ltd | `https://s3.../logo1.png` | 9876543210 | 123 MG Road, Mumbai | `user-001` | 2026-01-01 10:00:00 |
| `pl-comp-002` | 1001 | XYZ Money Lenders | `https://s3.../logo2.png` | 9876543211 | 456 Brigade Road, Bangalore | `user-001` | 2026-01-02 11:00:00 |
| `pl-comp-003` | 1002 | Quick Loans Inc | `https://s3.../logo3.png` | 9876543212 | 789 Park Street, Kolkata | `user-002` | 2026-01-03 12:00:00 |

**Notes:**
- Each membership can have multiple companies
- `parent_membership_id = 1001` means all companies belong to the same organization
- Companies are used for organization/reporting purposes

---

## 2️⃣ pl_subscriber (Subscribers/Borrowers)

**Purpose:** Individual borrowers who take personal loans

### Sample Data:

| pl_cust_id | parent_membership_id | pl_cust_name | pl_cust_phone | pl_cust_email | pl_cust_dob | pl_cust_age | pl_cust_photo | pl_cust_address | latitude | longitude | pl_cust_aadhaar_no | pl_nominee_name | pl_nominee_phone | created_by | created_at |
|------------|---------------------|--------------|---------------|---------------|-------------|-------------|---------------|-----------------|----------|-----------|-------------------|-----------------|------------------|------------|------------|
| `pl-sub-001` | 1001 | Rajesh Kumar | 9876543201 | rajesh@email.com | 1985-05-15 | 38 | `https://s3.../photo1.jpg` | 101, MG Road, Mumbai | 19.0760 | 72.8777 | 123456789012 | Priya Kumar | 9876543202 | `user-001` | 2026-01-05 09:00:00 |
| `pl-sub-002` | 1001 | Priya Sharma | 9876543203 | priya@email.com | 1990-08-22 | 33 | `https://s3.../photo2.jpg` | 202, Brigade Road, Bangalore | 12.9716 | 77.5946 | 234567890123 | Ramesh Sharma | 9876543204 | `user-001` | 2026-01-06 10:00:00 |
| `pl-sub-003` | 1001 | Amit Singh | 9876543205 | amit@email.com | 1988-12-10 | 35 | `https://s3.../photo3.jpg` | 303, Park Street, Kolkata | 22.5726 | 88.3639 | 345678901234 | Sunita Singh | 9876543206 | `user-001` | 2026-01-07 11:00:00 |
| `pl-sub-004` | 1002 | Suresh Patel | 9876543207 | suresh@email.com | 1987-03-25 | 36 | `https://s3.../photo4.jpg` | 404, Connaught Place, Delhi | 28.6139 | 77.2090 | 456789012345 | Meera Patel | 9876543208 | `user-002` | 2026-01-08 12:00:00 |

**Notes:**
- Each subscriber belongs to a specific membership
- App-specific table (separate from main subscribers table)
- Contains KYC information (Aadhaar, nominee details)
- Location coordinates for field collection

---

## 3️⃣ pl_loan (Loans)

**Purpose:** Personal loan records with 3 payment types

### Sample Data - INTEREST_FREE Loan:

| id | parent_membership_id | subscriber_id | principal_amount | disbursed_amount | interest_rate | payment_type | loan_mode | total_installments | installment_amount | payment_method | loan_disbursement_date | loan_due_start_date | loan_maturity_date | outstanding_balance | total_interest_paid | total_principal_paid | status | created_by | created_at |
|----|---------------------|---------------|------------------|------------------|---------------|--------------|-----------|-------------------|-------------------|----------------|----------------------|-------------------|-------------------|-------------------|-------------------|-------------------|--------|------------|------------|
| `pl-loan-001` | 1001 | `pl-sub-001` | 100000.00 | 100000.00 | 0.00 | `INTEREST_FREE` | MONTHLY | 12 | 8333.33 | CASH | 2026-01-10 | 2026-02-10 | 2027-01-10 | 91666.67 | 0.00 | 8333.33 | ACTIVE | `user-001` | 2026-01-10 14:00:00 |

**Calculation:**
- `installment_amount = 100000 / 12 = 8333.33`
- No interest charged
- After 1 payment: `outstanding_balance = 100000 - 8333.33 = 91666.67`

---

### Sample Data - INTEREST_ONLY Loan:

| id | parent_membership_id | subscriber_id | principal_amount | disbursed_amount | interest_rate | payment_type | loan_mode | total_installments | installment_amount | payment_method | loan_disbursement_date | loan_due_start_date | loan_maturity_date | outstanding_balance | total_interest_paid | total_principal_paid | status | created_by | created_at |
|----|---------------------|---------------|------------------|------------------|---------------|--------------|-----------|-------------------|-------------------|----------------|----------------------|-------------------|-------------------|-------------------|-------------------|-------------------|--------|------------|------------|
| `pl-loan-002` | 1001 | `pl-sub-002` | 200000.00 | 200000.00 | 12.00 | `INTEREST_ONLY` | MONTHLY | 12 | 2000.00 | BANK_TRANSFER | 2026-01-15 | 2026-02-15 | 2027-01-15 | 200000.00 | 4000.00 | 0.00 | ACTIVE | `user-001` | 2026-01-15 15:00:00 |

**Calculation:**
- Monthly interest = `200000 * 12% / 12 = 2000`
- `installment_amount = 2000.00` (interest only)
- Principal remains same: `outstanding_balance = 200000.00` (unchanged)
- After 2 payments: `total_interest_paid = 2000 * 2 = 4000`
- Principal will be paid at end (separate payment)

---

### Sample Data - INTEREST_PRINCIPAL (EMI) Loan:

| id | parent_membership_id | subscriber_id | principal_amount | disbursed_amount | interest_rate | payment_type | loan_mode | total_installments | installment_amount | payment_method | loan_disbursement_date | loan_due_start_date | loan_maturity_date | outstanding_balance | total_interest_paid | total_principal_paid | status | created_by | created_at |
|----|---------------------|---------------|------------------|------------------|---------------|--------------|-----------|-------------------|-------------------|----------------|----------------------|-------------------|-------------------|-------------------|-------------------|-------------------|--------|------------|------------|
| `pl-loan-003` | 1001 | `pl-sub-003` | 500000.00 | 500000.00 | 10.50 | `INTEREST_PRINCIPAL` | MONTHLY | 24 | 23236.67 | UPI | 2026-01-20 | 2026-02-20 | 2028-01-20 | 478750.62 | 11483.25 | 10753.38 | ACTIVE | `user-001` | 2026-01-20 16:00:00 |

**Calculation (EMI Formula):**
- Principal (P) = 500000
- Rate per month (r) = 10.5% / 12 = 0.875% = 0.00875
- Number of months (n) = 24
- EMI = `P * r * (1+r)^n / ((1+r)^n - 1)`
- EMI = `500000 * 0.00875 * (1.00875)^24 / ((1.00875)^24 - 1)`
- EMI = `23236.67` (fixed for all 24 installments)

**After 1st Payment:**
- Interest for 1st month = `500000 * 0.00875 = 4375.00`
- Principal component = `23236.67 - 4375.00 = 18861.67`
- Outstanding balance = `500000 - 18861.67 = 481138.33`
- (In sample: `outstanding_balance = 478750.62` after some payments)

**After Multiple Payments:**
- `total_principal_paid = 10753.38` (sum of principal components)
- `total_interest_paid = 11483.25` (sum of interest components)
- Outstanding reduces each month

---

### Sample Data - DAILY Loan (INTEREST_FREE):

| id | parent_membership_id | subscriber_id | principal_amount | disbursed_amount | interest_rate | payment_type | loan_mode | total_installments | installment_amount | payment_method | loan_disbursement_date | loan_due_start_date | loan_maturity_date | outstanding_balance | total_interest_paid | total_principal_paid | status | created_by | created_at |
|----|---------------------|---------------|------------------|------------------|---------------|--------------|-----------|-------------------|-------------------|----------------|----------------------|-------------------|-------------------|-------------------|-------------------|-------------------|--------|------------|------------|
| `pl-loan-004` | 1002 | `pl-sub-004` | 50000.00 | 50000.00 | 0.00 | `INTEREST_FREE` | DAILY | 100 | 500.00 | CASH | 2026-01-25 | 2026-01-26 | 2026-05-05 | 45000.00 | 0.00 | 5000.00 | ACTIVE | `user-002` | 2026-01-25 17:00:00 |

**Calculation:**
- Daily installment = `50000 / 100 = 500.00`
- After 10 payments: `outstanding_balance = 50000 - 5000 = 45000`

---

## 4️⃣ pl_receivable (Payment Schedule)

**Purpose:** Scheduled payments for each loan (one row per installment)

### Sample Data for Loan `pl-loan-001` (INTEREST_FREE, 12 months):

| id | loan_id | parent_membership_id | installment_number | due_date | opening_principal_balance | principal_due | interest_due | total_due | closing_principal_balance | is_paid | paid_amount | paid_date | created_at |
|----|---------|---------------------|-------------------|----------|-------------------------|---------------|--------------|-----------|-------------------------|---------|-------------|-----------|------------|
| `pl-rec-001` | `pl-loan-001` | 1001 | 1 | 2026-02-10 | 100000.00 | 8333.33 | 0.00 | 8333.33 | 91666.67 | ✅ true | 8333.33 | 2026-02-10 | 2026-01-10 14:00:00 |
| `pl-rec-002` | `pl-loan-001` | 1001 | 2 | 2026-03-10 | 91666.67 | 8333.33 | 0.00 | 8333.33 | 83333.34 | ✅ true | 8333.33 | 2026-03-10 | 2026-01-10 14:00:00 |
| `pl-rec-003` | `pl-loan-001` | 1001 | 3 | 2026-04-10 | 83333.34 | 8333.34 | 0.00 | 8333.34 | 75000.00 | ❌ false | 0.00 | null | 2026-01-10 14:00:00 |
| `pl-rec-004` | `pl-loan-001` | 1001 | 4 | 2026-05-10 | 75000.00 | 8333.33 | 0.00 | 8333.33 | 66666.67 | ❌ false | 0.00 | null | 2026-01-10 14:00:00 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| `pl-rec-012` | `pl-loan-001` | 1001 | 12 | 2027-01-10 | 8333.33 | 8333.33 | 0.00 | 8333.33 | 0.00 | ❌ false | 0.00 | null | 2026-01-10 14:00:00 |

**Notes:**
- All 12 receivables created when loan is disbursed
- `principal_due = 8333.33` (equal installments)
- `interest_due = 0.00` (interest-free loan)
- `total_due = principal_due + interest_due`
- `closing_balance` reduces each period
- 2 payments made (installments 1 & 2), rest pending

---

### Sample Data for Loan `pl-loan-002` (INTEREST_ONLY, 12 months):

| id | loan_id | parent_membership_id | installment_number | due_date | opening_principal_balance | principal_due | interest_due | total_due | closing_principal_balance | is_paid | paid_amount | paid_date | created_at |
|----|---------|---------------------|-------------------|----------|-------------------------|---------------|--------------|-----------|-------------------------|---------|-------------|-----------|------------|
| `pl-rec-013` | `pl-loan-002` | 1001 | 1 | 2026-02-15 | 200000.00 | 0.00 | 2000.00 | 2000.00 | 200000.00 | ✅ true | 2000.00 | 2026-02-15 | 2026-01-15 15:00:00 |
| `pl-rec-014` | `pl-loan-002` | 1001 | 2 | 2026-03-15 | 200000.00 | 0.00 | 2000.00 | 2000.00 | 200000.00 | ✅ true | 2000.00 | 2026-03-15 | 2026-01-15 15:00:00 |
| `pl-rec-015` | `pl-loan-002` | 1001 | 3 | 2026-04-15 | 200000.00 | 0.00 | 2000.00 | 2000.00 | 200000.00 | ❌ false | 0.00 | null | 2026-01-15 15:00:00 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| `pl-rec-024` | `pl-loan-002` | 1001 | 12 | 2027-01-15 | 200000.00 | 0.00 | 2000.00 | 2000.00 | 200000.00 | ❌ false | 0.00 | null | 2026-01-15 15:00:00 |

**Notes:**
- `principal_due = 0.00` (no principal payment)
- `interest_due = 2000.00` (monthly interest)
- `closing_balance = 200000.00` (principal unchanged)
- `opening_balance = closing_balance` (same throughout)
- Principal paid separately at end (or full payment later)

---

### Sample Data for Loan `pl-loan-003` (INTEREST_PRINCIPAL/EMI, 24 months):

| id | loan_id | parent_membership_id | installment_number | due_date | opening_principal_balance | principal_due | interest_due | total_due | closing_principal_balance | is_paid | paid_amount | paid_date | created_at |
|----|---------|---------------------|-------------------|----------|-------------------------|---------------|--------------|-----------|-------------------------|---------|-------------|-----------|------------|
| `pl-rec-025` | `pl-loan-003` | 1001 | 1 | 2026-02-20 | 500000.00 | 18861.67 | 4375.00 | 23236.67 | 481138.33 | ✅ true | 23236.67 | 2026-02-20 | 2026-01-20 16:00:00 |
| `pl-rec-026` | `pl-loan-003` | 1001 | 2 | 2026-03-20 | 481138.33 | 19026.54 | 4210.13 | 23236.67 | 462111.79 | ✅ true | 23236.67 | 2026-03-20 | 2026-01-20 16:00:00 |
| `pl-rec-027` | `pl-loan-003` | 1001 | 3 | 2026-04-20 | 462111.79 | 19193.13 | 4043.54 | 23236.67 | 442918.66 | ❌ false | 0.00 | null | 2026-01-20 16:00:00 |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |
| `pl-rec-048` | `pl-loan-003` | 1001 | 24 | 2028-01-20 | 23042.15 | 23042.15 | 194.52 | 23236.67 | 0.00 | ❌ false | 0.00 | null | 2026-01-20 16:00:00 |

**Notes:**
- `total_due = 23236.67` (fixed EMI for all installments)
- **1st Installment:**
  - `interest_due = 500000 * 10.5% / 12 = 4375.00`
  - `principal_due = 23236.67 - 4375.00 = 18861.67`
  - `closing_balance = 500000 - 18861.67 = 481138.33`
- **2nd Installment:**
  - `interest_due = 481138.33 * 10.5% / 12 = 4209.96` (lower than 1st)
  - `principal_due = 23236.67 - 4209.96 = 19026.71` (higher than 1st)
  - Interest decreases, principal increases over time
- **Last Installment (24th):**
  - Principal component is larger
  - Interest component is minimal
  - Balance becomes 0.00

---

## 5️⃣ pl_receipt (Payment Records)

**Purpose:** Actual payment records linked to receivables

### Sample Data for Loan `pl-loan-001` (INTEREST_FREE):

| id | receivable_id | loan_id | parent_membership_id | paid_amount | principal_paid | interest_paid | payment_date | payment_method | remarks | created_by | created_at |
|----|---------------|---------|---------------------|-------------|----------------|---------------|--------------|----------------|---------|------------|------------|
| `pl-rcpt-001` | `pl-rec-001` | `pl-loan-001` | 1001 | 8333.33 | 8333.33 | 0.00 | 2026-02-10 | CASH | On time payment | `user-001` | 2026-02-10 10:00:00 |
| `pl-rcpt-002` | `pl-rec-002` | `pl-loan-001` | 1001 | 8333.33 | 8333.33 | 0.00 | 2026-03-10 | UPI | Paid via UPI | `user-001` | 2026-03-10 11:00:00 |

**Notes:**
- One receipt per receivable payment
- `principal_paid = paid_amount` (interest-free)
- `interest_paid = 0.00`

---

### Sample Data for Loan `pl-loan-002` (INTEREST_ONLY):

| id | receivable_id | loan_id | parent_membership_id | paid_amount | principal_paid | interest_paid | payment_date | payment_method | remarks | created_by | created_at |
|----|---------------|---------|---------------------|-------------|----------------|---------------|--------------|----------------|---------|------------|------------|
| `pl-rcpt-003` | `pl-rec-013` | `pl-loan-002` | 1001 | 2000.00 | 0.00 | 2000.00 | 2026-02-15 | BANK_TRANSFER | Interest payment | `user-001` | 2026-02-15 12:00:00 |
| `pl-rcpt-004` | `pl-rec-014` | `pl-loan-002` | 1001 | 2000.00 | 0.00 | 2000.00 | 2026-03-15 | BANK_TRANSFER | Interest payment | `user-001` | 2026-03-15 13:00:00 |

**Notes:**
- `principal_paid = 0.00` (no principal payment)
- `interest_paid = paid_amount` (only interest)
- Principal will be paid separately (full payment or at maturity)

---

### Sample Data for Loan `pl-loan-003` (INTEREST_PRINCIPAL/EMI):

| id | receivable_id | loan_id | parent_membership_id | paid_amount | principal_paid | interest_paid | payment_date | payment_method | remarks | created_by | created_at |
|----|---------------|---------|---------------------|-------------|----------------|---------------|--------------|----------------|---------|------------|------------|
| `pl-rcpt-005` | `pl-rec-025` | `pl-loan-003` | 1001 | 23236.67 | 18861.67 | 4375.00 | 2026-02-20 | UPI | EMI payment - 1st installment | `user-001` | 2026-02-20 14:00:00 |
| `pl-rcpt-006` | `pl-rec-026` | `pl-loan-003` | 1001 | 23236.67 | 19026.54 | 4210.13 | 2026-03-20 | UPI | EMI payment - 2nd installment | `user-001` | 2026-03-20 15:00:00 |

**Notes:**
- `paid_amount = principal_paid + interest_paid`
- **1st Payment:** `interest_paid = 4375.00`, `principal_paid = 18861.67`
- **2nd Payment:** `interest_paid = 4210.13` (decreased), `principal_paid = 19026.54` (increased)
- Both components tracked separately

---

## 6️⃣ pl_ledger_account (Ledger Accounts)

**Purpose:** Chart of accounts for tracking money flow

### Sample Data:

| id | parent_membership_id | account_name | opening_balance | current_balance | created_by | created_at |
|----|---------------------|--------------|-----------------|-----------------|------------|------------|
| `pl-acc-001` | 1001 | Cash Account | 500000.00 | 580000.00 | `user-001` | 2026-01-01 09:00:00 |
| `pl-acc-002` | 1001 | Bank Account - HDFC | 1000000.00 | 995000.00 | `user-001` | 2026-01-01 09:00:00 |
| `pl-acc-003` | 1001 | Interest Income Account | 0.00 | 10375.13 | `user-001` | 2026-01-01 09:00:00 |
| `pl-acc-004` | 1001 | Loan Disbursement Account | 0.00 | -850000.00 | `user-001` | 2026-01-01 09:00:00 |

**Notes:**
- `Cash Account`: Physical cash on hand (increased by collections, decreased by disbursements)
- `Bank Account`: Bank balance
- `Interest Income Account`: Tracks interest earned
- `Loan Disbursement Account`: Tracks loans given (negative balance = liability)
- `current_balance` updated when ledger entries are created

---

## 7️⃣ pl_ledger_entry (Ledger Entries)

**Purpose:** All financial transactions tracked in ledger

### Sample Data - Loan Disbursement:

| id | pl_ledger_accounts_id | parent_membership_id | category | subcategory | amount | description | reference_id | reference_type | payment_date | created_by | created_at |
|----|----------------------|---------------------|----------|-------------|--------|-------------|--------------|----------------|--------------|------------|------------|
| `pl-entry-001` | `pl-acc-001` | 1001 | LOAN_DISBURSEMENT | New Loans | -100000.00 | Loan disbursed to Rajesh Kumar (pl-loan-001) | `pl-loan-001` | loan_disbursement | 2026-01-10 | `user-001` | 2026-01-10 14:00:00 |
| `pl-entry-002` | `pl-acc-004` | 1001 | LOAN_DISBURSEMENT | New Loans | 100000.00 | Loan liability created (pl-loan-001) | `pl-loan-001` | loan_disbursement | 2026-01-10 | `user-001` | 2026-01-10 14:00:00 |

**Notes:**
- Double-entry bookkeeping
- Cash account decreases (debit)
- Loan account increases (credit/liability)
- Both entries reference `pl-loan-001`

---

### Sample Data - Collection (INTEREST_FREE):

| id | pl_ledger_accounts_id | parent_membership_id | category | subcategory | amount | description | reference_id | reference_type | payment_date | created_by | created_at |
|----|----------------------|---------------------|----------|-------------|--------|-------------|--------------|----------------|--------------|------------|------------|
| `pl-entry-003` | `pl-acc-001` | 1001 | COLLECTION | Loan Payments | 8333.33 | Payment received from Rajesh Kumar - Installment 1 (pl-loan-001) | `pl-rcpt-001` | collection | 2026-02-10 | `user-001` | 2026-02-10 10:00:00 |
| `pl-entry-004` | `pl-acc-004` | 1001 | COLLECTION | Loan Payments | -8333.33 | Principal repaid (pl-loan-001) | `pl-rcpt-001` | collection | 2026-02-10 | `user-001` | 2026-02-10 10:00:00 |

**Notes:**
- Cash account increases (debit)
- Loan liability decreases (credit)
- Reference: `pl-rcpt-001` (receipt ID)

---

### Sample Data - Collection (INTEREST_ONLY):

| id | pl_ledger_accounts_id | parent_membership_id | category | subcategory | amount | description | reference_id | reference_type | payment_date | created_by | created_at |
|----|----------------------|---------------------|----------|-------------|--------|-------------|--------------|----------------|--------------|------------|------------|
| `pl-entry-005` | `pl-acc-002` | 1001 | COLLECTION | Interest Payments | 2000.00 | Interest payment received from Priya Sharma - Installment 1 (pl-loan-002) | `pl-rcpt-003` | collection | 2026-02-15 | `user-001` | 2026-02-15 12:00:00 |
| `pl-entry-006` | `pl-acc-003` | 1001 | INTEREST_INCOME | Interest Income | 2000.00 | Interest income earned (pl-loan-002) | `pl-rcpt-003` | interest_income | 2026-02-15 | `user-001` | 2026-02-15 12:00:00 |

**Notes:**
- Bank account increases (debit)
- Interest income account increases (credit)
- Principal balance unchanged (loan liability stays same)

---

### Sample Data - Collection (INTEREST_PRINCIPAL/EMI):

| id | pl_ledger_accounts_id | parent_membership_id | category | subcategory | amount | description | reference_id | reference_type | payment_date | created_by | created_at |
|----|----------------------|---------------------|----------|-------------|--------|-------------|--------------|----------------|--------------|------------|------------|
| `pl-entry-007` | `pl-acc-001` | 1001 | COLLECTION | EMI Payments | 23236.67 | EMI payment received from Amit Singh - Installment 1 (pl-loan-003) | `pl-rcpt-005` | collection | 2026-02-20 | `user-001` | 2026-02-20 14:00:00 |
| `pl-entry-008` | `pl-acc-003` | 1001 | INTEREST_INCOME | Interest Income | 4375.00 | Interest portion of EMI (pl-loan-003) | `pl-rcpt-005` | interest_income | 2026-02-20 | `user-001` | 2026-02-20 14:00:00 |
| `pl-entry-009` | `pl-acc-004` | 1001 | COLLECTION | Principal Repayment | -18861.67 | Principal portion of EMI (pl-loan-003) | `pl-rcpt-005` | collection | 2026-02-20 | `user-001` | 2026-02-20 14:00:00 |

**Notes:**
- **3 entries** for one EMI payment:
  1. Cash received (total EMI amount)
  2. Interest income recognized
  3. Principal liability reduced
- Total: `23236.67 = 4375.00 + 18861.67`
- Loan balance reduces by principal amount

---

## 🔄 Data Flow Example

### Complete Flow for INTEREST_PRINCIPAL Loan:

```
1. LOAN DISBURSEMENT (pl-loan-003):
   ├─ Create pl_loan record
   ├─ Generate 24 pl_receivable records
   ├─ Create 2 pl_ledger_entry:
   │   ├─ Cash Account: -500000.00 (debit)
   │   └─ Loan Account: +500000.00 (credit)
   └─ Update pl_ledger_account balances

2. FIRST PAYMENT (pl-rec-025):
   ├─ Create pl_receipt (pl-rcpt-005)
   │   ├─ principal_paid: 18861.67
   │   └─ interest_paid: 4375.00
   ├─ Update pl_receivable:
   │   ├─ is_paid: true
   │   └─ paid_amount: 23236.67
   ├─ Update pl_loan:
   │   ├─ outstanding_balance: 481138.33
   │   ├─ total_principal_paid: 18861.67
   │   └─ total_interest_paid: 4375.00
   ├─ Create 3 pl_ledger_entry:
   │   ├─ Cash: +23236.67
   │   ├─ Interest Income: +4375.00
   │   └─ Loan Account: -18861.67
   └─ Update pl_ledger_account balances

3. SECOND PAYMENT (pl-rec-026):
   ├─ Similar flow as first payment
   ├─ Interest component: 4210.13 (lower)
   └─ Principal component: 19026.54 (higher)

4. Continue until 24th payment...

5. LOAN CLOSURE:
   ├─ All receivables paid
   ├─ Update pl_loan:
   │   ├─ status: CLOSED
   │   ├─ outstanding_balance: 0.00
   │   ├─ total_principal_paid: 500000.00
   │   └─ total_interest_paid: 57480.08 (sum of all interest)
   └─ Loan fully settled
```

---

## 📊 Summary Statistics

### Example Calculations:

**Loan `pl-loan-001` (INTEREST_FREE):**
- Principal: 100,000
- Total Interest: 0
- Total Repayment: 100,000
- Installments: 12 x 8,333.33

**Loan `pl-loan-002` (INTEREST_ONLY):**
- Principal: 200,000
- Monthly Interest: 2,000
- Total Interest (12 months): 24,000
- Total Repayment: 224,000 (200,000 principal + 24,000 interest)
- Installments: 12 x 2,000 (interest only) + 200,000 (principal at end)

**Loan `pl-loan-003` (INTEREST_PRINCIPAL/EMI):**
- Principal: 500,000
- Monthly EMI: 23,236.67 (fixed)
- Total Repayment: 557,680.08 (500,000 principal + 57,680.08 interest)
- Installments: 24 x 23,236.67
- Total Interest: 57,680.08 (calculated from EMI formula)

---

---

## 💰 Partial Payment Examples

### **Example 1: INTEREST_FREE - Partial Payment**

**Loan:** `pl-loan-001` (INTEREST_FREE, ₹100,000, ₹8,333.33/month)

**Scenario:** Borrower pays only ₹5,000 for 3rd installment (due ₹8,333.33)

#### Receivable Before Payment:
| id | installment_number | total_due | is_paid | paid_amount | carry_forward |
|----|-------------------|-----------|---------|-------------|---------------|
| `pl-rec-003` | 3 | 8333.33 | ❌ false | 0.00 | 0.00 |

#### Payment Made: ₹5,000

#### Receivable After Payment:
| id | installment_number | total_due | is_paid | paid_amount | carry_forward |
|----|-------------------|-----------|---------|-------------|---------------|
| `pl-rec-003` | 3 | 8333.33 | ❌ false | 5000.00 | 3333.33 |

#### Next Receivable Updated:
| id | installment_number | total_due (before) | total_due (after) | carry_forward |
|----|-------------------|-------------------|------------------|---------------|
| `pl-rec-004` | 4 | 8333.33 | **11666.66** | 0.00 |

**Notes:**
- `carry_forward = 8333.33 - 5000.00 = 3333.33`
- Next receivable: `total_due = 8333.33 + 3333.33 = 11666.66`
- `is_paid` remains `false` until full amount paid

---

### **Example 2: INTEREST_ONLY - Partial Payment**

**Loan:** `pl-loan-002` (INTEREST_ONLY, ₹200,000, ₹2,000/month interest)

**Scenario:** Borrower pays only ₹1,500 for 3rd installment (due ₹2,000)

#### Receivable After Payment:
| id | installment_number | total_due | is_paid | paid_amount | carry_forward |
|----|-------------------|-----------|---------|-------------|---------------|
| `pl-rec-015` | 3 | 2000.00 | ❌ false | 1500.00 | 500.00 |

#### Next Receivable Updated:
| id | installment_number | total_due (before) | total_due (after) |
|----|-------------------|-------------------|------------------|
| `pl-rec-016` | 4 | 2000.00 | **2500.00** |

**Notes:**
- `carry_forward = 500.00` (unpaid interest)
- Next receivable includes carry_forward: `2000.00 + 500.00 = 2500.00`
- Principal balance remains unchanged

---

### **Example 3: INTEREST_PRINCIPAL (EMI) - Partial Payment**

**Loan:** `pl-loan-003` (INTEREST_PRINCIPAL, EMI ₹23,236.67/month)

**Scenario:** Borrower pays only ₹18,000 for 3rd installment (due ₹23,236.67)

**Calculation:**
- Principal ratio = 19193.13 / 23236.67 = 82.63%
- Interest ratio = 4043.54 / 23236.67 = 17.37%
- `principal_paid = 18000 × 82.63% = 14873.40`
- `interest_paid = 18000 × 17.37% = 3126.60`

#### Receivable After Payment:
| id | installment_number | total_due | is_paid | paid_amount | carry_forward |
|----|-------------------|-----------|---------|-------------|---------------|
| `pl-rec-027` | 3 | 23236.67 | ❌ false | 18000.00 | 5236.67 |

#### Next Receivable Updated:
| id | installment_number | total_due (before) | total_due (after) |
|----|-------------------|-------------------|------------------|
| `pl-rec-028` | 4 | 23236.67 | **28473.34** |

**Notes:**
- Payment split proportionally (principal vs interest)
- `carry_forward = 5236.67` added to next installment

---

## 🏁 Loan Foreclosure Examples

### **Example 1: INTEREST_FREE - Foreclosure**

**Loan:** `pl-loan-001` (INTEREST_FREE, ₹100,000)
**Current Status:** 3 payments made (₹25,000 paid), 9 installments remaining
**Foreclosure Date:** 2026-05-15

#### Before Foreclosure:
- `outstanding_balance = 75000.00`
- Remaining: 9 × ₹8,333.33 = ₹75,000

#### Foreclosure Amount:
- **Outstanding = ₹75,000.00** (principal only, no interest)

#### After Foreclosure:
**Loan Updated:**
- `outstanding_balance = 0.00`
- `total_principal_paid = 100000.00`
- `status = CLOSED`
- `loan_maturity_date = 2026-05-15`

**All Remaining Receivables:**
- All 9 receivables marked as `is_paid = true`
- `paid_amount = 8333.33` each
- `paid_date = 2026-05-15`

---

### **Example 2: INTEREST_ONLY - Foreclosure**

**Loan:** `pl-loan-002` (INTEREST_ONLY, ₹200,000, 12% annual)
**Current Status:** 3 payments made, 9 installments remaining
**Foreclosure Date:** 2026-05-20
**Last Payment:** 2026-03-15 (66 days ago)

#### Before Foreclosure:
- `outstanding_balance = 200000.00` (principal unchanged)

#### Foreclosure Calculation:
- **Outstanding Principal = ₹200,000.00**
- **Interest (66 days) = ₹200,000 × 12% / 365 × 66 = ₹4,340.16**
- **Total Outstanding = ₹204,340.16**

#### After Foreclosure:
**Loan Updated:**
- `outstanding_balance = 0.00`
- `total_principal_paid = 200000.00`
- `total_interest_paid = 6000.00 + 4340.16 = 10340.16`
- `status = CLOSED`

**Note:** Interest calculated only for 66 days, NOT for remaining 9 months!

---

### **Example 3: INTEREST_PRINCIPAL (EMI) - Foreclosure**

**Loan:** `pl-loan-003` (INTEREST_PRINCIPAL, ₹500,000, 10.5% annual)
**Current Status:** 3 payments made, 21 installments remaining
**Foreclosure Date:** 2026-06-15
**Last Payment:** 2026-03-20 (87 days ago)
**Current Outstanding:** ₹442,918.66

#### Before Foreclosure:
- `outstanding_balance = 442918.66`
- Original total interest (24 months): ~₹57,680

#### Foreclosure Calculation:
- **Outstanding Principal = ₹442,918.66**
- **Interest (87 days) = ₹442,918.66 × 10.5% / 365 × 87 = ₹11,070.89**
- **Total Outstanding = ₹453,989.55**

#### After Foreclosure:
**Loan Updated:**
- `outstanding_balance = 0.00`
- `total_principal_paid = 500000.00`
- `total_interest_paid = 12628.67 + 11070.89 = 23699.56`
- `status = CLOSED`

**Interest Savings:**
- Original total interest: ₹57,680.08
- Actual interest paid: ₹23,699.56
- **Savings: ₹33,980.52** (by foreclosing early!)

---

## ✅ Features Summary

### **Partial Payment:**
- ✅ Works for all 3 payment types
- ✅ Unpaid amount (`carry_forward`) added to next installment
- ✅ Payment split proportionally (principal vs interest)
- ✅ Loan balance updates correctly

### **Loan Foreclosure:**
- ✅ Works for all 3 payment types
- ✅ INTEREST_FREE: Only principal amount
- ✅ INTEREST_ONLY & INTEREST_PRINCIPAL: Interest calculated only up to foreclosure date
- ✅ All remaining receivables marked as paid
- ✅ Loan status set to CLOSED
- ✅ Borrower saves interest by foreclosing early

---

**Document Status:** ✅ Updated with Partial Payment & Foreclosure Examples  
**See Also:** `PERSONAL_LOAN_APP_PARTIAL_PAYMENT_AND_FORECLOSURE.md` for detailed logic
