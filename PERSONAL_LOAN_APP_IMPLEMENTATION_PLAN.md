# Personal Loan App - Implementation Plan 📋

## 📌 Overview

This document outlines the step-by-step implementation plan for the **Personal Loan App** - a new finance module similar to the existing Daily Collection App, with key differences in loan disbursement and payment calculations.

---

## 🎯 Objectives

1. **Create a parallel Personal Loan App** alongside the existing Daily Collection App
2. **Zero impact on existing applications** - completely isolated data and code
3. **Implement 3 loan payment types:**
   - Interest-free loans (0% interest)
   - Interest-only payment (only interest paid per period)
   - Interest + Principal payment (EMI-like structure)
4. **Support Partial Payments** - Allow borrowers to pay less than total_due amount
5. **Support Loan Foreclosure** - Allow borrowers to pay entire loan early (with interest recalculation)
6. **Follow the same architecture pattern** as Daily Collection App for consistency

---

## 🏗️ Architecture Overview

### Current Daily Collection App Structure:
```
Daily Collection (dc_*)
├── dc_company
├── dc_subscriber (app-specific)
├── dc_product
├── dc_loan
├── dc_receivable
├── dc_receipt
├── dc_ledger_account
└── dc_ledger_entry
```

### Personal Loan App Structure:
```
Personal Loan (pl_*)
├── pl_company
├── pl_subscriber (app-specific)
├── pl_loan (with 3 payment types)
├── pl_receivable
├── pl_receipt
├── pl_ledger_account
└── pl_ledger_entry
```

**Key Differences:**
- ✅ All tables prefixed with `pl_` instead of `dc_`
- ✅ **No product table** - loans are directly disbursed with interest rate
- ✅ **pl_loan has payment_type enum** (INTEREST_FREE, INTEREST_ONLY, INTEREST_PRINCIPAL)
- ✅ **Interest calculation logic** differs based on payment type

---

## 🗄️ Database Schema Design

### **Table 1: pl_company** (Companies)

```sql
CREATE TABLE pl_company (
    id VARCHAR(40) PRIMARY KEY,
    parent_membership_id INTEGER NOT NULL REFERENCES membership(id),
    company_name VARCHAR(255) NOT NULL,
    company_logo TEXT,
    contact_no VARCHAR(15),
    address TEXT,
    created_by VARCHAR(40),
    updated_by VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT pl_company_membership_fk 
        FOREIGN KEY (parent_membership_id) 
        REFERENCES membership(id) ON DELETE RESTRICT
);

CREATE INDEX pl_company_membership_idx ON pl_company(parent_membership_id);
```

**Fields:**
- `id` - UUID primary key
- `parent_membership_id` - Multi-tenant isolation
- `company_name` - Company name
- `company_logo` - S3 URL for logo
- `contact_no` - Contact number
- `address` - Company address
- Standard audit fields (created_by, updated_by, timestamps)

---

### **Table 2: pl_subscriber** (Subscribers - App-Specific)

```sql
CREATE TABLE pl_subscriber (
    pl_cust_id VARCHAR(40) PRIMARY KEY,
    parent_membership_id INTEGER NOT NULL REFERENCES membership(id),
    pl_cust_name VARCHAR(255) NOT NULL,
    pl_cust_phone VARCHAR(15),
    pl_cust_email VARCHAR(255),
    pl_cust_dob DATE,
    pl_cust_age INTEGER,
    pl_cust_photo TEXT,
    pl_cust_address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    pl_cust_aadhaar_no VARCHAR(12),
    pl_cust_aadhaar_frontside TEXT,
    pl_cust_aadhaar_backside TEXT,
    pl_nominee_name VARCHAR(255),
    pl_nominee_phone VARCHAR(15),
    pl_nominee_relation VARCHAR(50),
    created_by VARCHAR(40),
    updated_by VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT pl_subscriber_membership_fk 
        FOREIGN KEY (parent_membership_id) 
        REFERENCES membership(id) ON DELETE RESTRICT
);

CREATE INDEX pl_subscriber_membership_idx ON pl_subscriber(parent_membership_id);
CREATE INDEX pl_subscriber_phone_idx ON pl_subscriber(pl_cust_phone);
```

**Fields:**
- `pl_cust_id` - Primary key (UUID)
- `parent_membership_id` - Multi-tenant isolation
- Customer information fields (name, phone, email, DOB, age, photo, address)
- Location fields (latitude, longitude)
- KYC fields (Aadhaar number, front/back images)
- Nominee fields (name, phone, relation)
- Standard audit fields

---

### **Table 3: pl_loan** (Loans - Core Table)

```sql
CREATE TYPE enum_pl_loan_payment_type AS ENUM(
    'INTEREST_FREE',      -- No interest charged
    'INTEREST_ONLY',      -- Only interest paid per period
    'INTEREST_PRINCIPAL'  -- Both interest and principal paid (EMI)
);

CREATE TYPE enum_pl_loan_loan_mode AS ENUM('DAILY', 'WEEKLY', 'MONTHLY');

CREATE TYPE enum_pl_loan_status AS ENUM('ACTIVE', 'CLOSED', 'OVERDUE', 'CANCELLED');

CREATE TABLE pl_loan (
    id VARCHAR(40) PRIMARY KEY,
    parent_membership_id INTEGER NOT NULL REFERENCES membership(id),
    subscriber_id VARCHAR(40) NOT NULL REFERENCES pl_subscriber(pl_cust_id),
    
    -- Loan Amount Details
    principal_amount DECIMAL(12, 2) NOT NULL,
    disbursed_amount DECIMAL(12, 2) NOT NULL COMMENT 'Actual amount given to borrower',
    
    -- Interest Details
    interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'Annual interest rate percentage',
    payment_type enum_pl_loan_payment_type NOT NULL COMMENT 'INTEREST_FREE, INTEREST_ONLY, or INTEREST_PRINCIPAL',
    
    -- Loan Terms
    loan_mode enum_pl_loan_loan_mode NOT NULL COMMENT 'DAILY, WEEKLY, or MONTHLY',
    total_installments INTEGER NOT NULL COMMENT 'Total number of payment cycles',
    installment_amount DECIMAL(12, 2) NOT NULL COMMENT 'Amount per installment (calculated)',
    
    -- Payment Method
    payment_method VARCHAR(50) NOT NULL COMMENT 'Payment method used for loan disbursement',
    
    -- Important Dates
    loan_disbursement_date DATE NOT NULL COMMENT 'Actual date when loan was disbursed',
    loan_due_start_date DATE NOT NULL COMMENT 'Date when first payment is due',
    loan_maturity_date DATE COMMENT 'Expected loan closure date',
    
    -- Balance Tracking
    outstanding_balance DECIMAL(12, 2) NOT NULL DEFAULT 0 COMMENT 'Current outstanding principal balance',
    total_interest_paid DECIMAL(12, 2) NOT NULL DEFAULT 0 COMMENT 'Total interest paid so far',
    total_principal_paid DECIMAL(12, 2) NOT NULL DEFAULT 0 COMMENT 'Total principal paid so far',
    
    -- Status & Metadata
    status enum_pl_loan_status NOT NULL DEFAULT 'ACTIVE',
    loan_agreement_doc TEXT COMMENT 'Signed loan agreement document (S3 URL)',
    remarks TEXT COMMENT 'Additional notes',
    
    created_by VARCHAR(40),
    updated_by VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT pl_loan_membership_fk 
        FOREIGN KEY (parent_membership_id) 
        REFERENCES membership(id) ON DELETE RESTRICT,
    CONSTRAINT pl_loan_subscriber_fk 
        FOREIGN KEY (subscriber_id) 
        REFERENCES pl_subscriber(pl_cust_id) ON DELETE RESTRICT
);

CREATE INDEX pl_loan_membership_idx ON pl_loan(parent_membership_id);
CREATE INDEX pl_loan_subscriber_idx ON pl_loan(subscriber_id);
CREATE INDEX pl_loan_status_idx ON pl_loan(status);
CREATE INDEX pl_loan_payment_type_idx ON pl_loan(payment_type);
CREATE INDEX pl_loan_disbursement_date_idx ON pl_loan(loan_disbursement_date);
```

**Key Fields:**
- `payment_type` - **NEW ENUM** with 3 options:
  - `INTEREST_FREE` - No interest charged
  - `INTEREST_ONLY` - Only interest paid per period, principal remains same
  - `INTEREST_PRINCIPAL` - EMI-like: both interest and principal paid
- `interest_rate` - Annual interest rate percentage
- `installment_amount` - Calculated amount per installment (varies by payment_type)
- `outstanding_balance` - Current principal balance (reduces only for INTEREST_PRINCIPAL)
- `total_interest_paid` - Cumulative interest paid
- `total_principal_paid` - Cumulative principal paid

**Calculation Logic:**
1. **INTEREST_FREE**: 
   - `installment_amount = principal_amount / total_installments`
   - `interest_rate = 0`
   - Only principal is paid

2. **INTEREST_ONLY**: 
   - `monthly_interest = (principal_amount * interest_rate / 100) / 12`
   - `installment_amount = monthly_interest` (adjusted for loan_mode)
   - Principal remains same throughout
   - Only interest is paid each period

3. **INTEREST_PRINCIPAL**: 
   - Use EMI formula: `P * r * (1+r)^n / ((1+r)^n - 1)`
   - `installment_amount = EMI` (fixed for all installments)
   - Both interest and principal components in each payment
   - Principal reduces over time

---

### **Table 4: pl_receivable** (Payment Schedules)

```sql
CREATE TABLE pl_receivable (
    id VARCHAR(40) PRIMARY KEY,
    loan_id VARCHAR(40) NOT NULL REFERENCES pl_loan(id) ON DELETE CASCADE,
    parent_membership_id INTEGER NOT NULL REFERENCES membership(id),
    
    installment_number INTEGER NOT NULL COMMENT 'Installment sequence (1, 2, 3, ...)',
    due_date DATE NOT NULL,
    
    -- Balance Details
    opening_principal_balance DECIMAL(12, 2) NOT NULL COMMENT 'Principal balance at start of period',
    principal_due DECIMAL(12, 2) NOT NULL DEFAULT 0 COMMENT 'Principal amount due this period',
    interest_due DECIMAL(12, 2) NOT NULL DEFAULT 0 COMMENT 'Interest amount due this period',
    total_due DECIMAL(12, 2) NOT NULL COMMENT 'Total amount due (principal_due + interest_due)',
    closing_principal_balance DECIMAL(12, 2) NOT NULL COMMENT 'Principal balance after this payment',
    
    -- Payment Status
    is_paid BOOLEAN DEFAULT FALSE,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    paid_date DATE,
    carry_forward DECIMAL(12, 2) DEFAULT 0 COMMENT 'Unpaid amount carried to next installment (for partial payments)',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    
    CONSTRAINT pl_receivable_loan_fk 
        FOREIGN KEY (loan_id) 
        REFERENCES pl_loan(id) ON DELETE CASCADE,
    CONSTRAINT pl_receivable_membership_fk 
        FOREIGN KEY (parent_membership_id) 
        REFERENCES membership(id) ON DELETE RESTRICT
);

CREATE INDEX pl_receivable_loan_idx ON pl_receivable(loan_id);
CREATE INDEX pl_receivable_due_date_idx ON pl_receivable(due_date);
CREATE INDEX pl_receivable_is_paid_idx ON pl_receivable(is_paid);
```

**Key Fields:**
- `installment_number` - Sequence number (1, 2, 3, ...)
- `principal_due` - Principal portion due (0 for INTEREST_ONLY)
- `interest_due` - Interest portion due (0 for INTEREST_FREE)
- `total_due` - Total amount due (sum of principal_due + interest_due)
- `opening_principal_balance` - Principal balance at period start
- `closing_principal_balance` - Principal balance after payment (same for INTEREST_ONLY)

**Calculation per Payment Type:**
1. **INTEREST_FREE**: 
   - `principal_due = principal_amount / total_installments`
   - `interest_due = 0`
   - `closing_balance = opening_balance - principal_due`

2. **INTEREST_ONLY**: 
   - `principal_due = 0`
   - `interest_due = (opening_balance * interest_rate / 100) / periods_per_year`
   - `closing_balance = opening_balance` (no change)

3. **INTEREST_PRINCIPAL**: 
   - `total_due = EMI` (fixed amount)
   - `interest_due = opening_balance * interest_rate / 100 / periods_per_year`
   - `principal_due = total_due - interest_due`
   - `closing_balance = opening_balance - principal_due`

---

### **Table 5: pl_receipt** (Payment Records)

```sql
CREATE TABLE pl_receipt (
    id VARCHAR(40) PRIMARY KEY,
    receivable_id VARCHAR(40) NOT NULL REFERENCES pl_receivable(id) ON DELETE CASCADE,
    loan_id VARCHAR(40) NOT NULL REFERENCES pl_loan(id),
    parent_membership_id INTEGER NOT NULL REFERENCES membership(id),
    
    paid_amount DECIMAL(12, 2) NOT NULL,
    principal_paid DECIMAL(12, 2) NOT NULL DEFAULT 0 COMMENT 'Principal portion of payment',
    interest_paid DECIMAL(12, 2) NOT NULL DEFAULT 0 COMMENT 'Interest portion of payment',
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL COMMENT 'CASH, UPI, BANK_TRANSFER, CHEQUE, etc.',
    remarks TEXT,
    
    created_by VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT pl_receipt_receivable_fk 
        FOREIGN KEY (receivable_id) 
        REFERENCES pl_receivable(id) ON DELETE CASCADE,
    CONSTRAINT pl_receipt_loan_fk 
        FOREIGN KEY (loan_id) 
        REFERENCES pl_loan(id) ON DELETE RESTRICT,
    CONSTRAINT pl_receipt_membership_fk 
        FOREIGN KEY (parent_membership_id) 
        REFERENCES membership(id) ON DELETE RESTRICT
);

CREATE INDEX pl_receipt_receivable_idx ON pl_receipt(receivable_id);
CREATE INDEX pl_receipt_loan_idx ON pl_receipt(loan_id);
CREATE INDEX pl_receipt_payment_date_idx ON pl_receipt(payment_date);
CREATE INDEX pl_receipt_payment_method_idx ON pl_receipt(payment_method);
```

**Key Fields:**
- `principal_paid` - Principal portion of payment
- `interest_paid` - Interest portion of payment
- `paid_amount` - Total payment (`principal_paid + interest_paid`)
- Standard payment tracking fields

---

### **Table 6: pl_ledger_account** (Ledger Accounts)

```sql
CREATE TABLE pl_ledger_account (
    id VARCHAR(40) PRIMARY KEY,
    parent_membership_id INTEGER NOT NULL REFERENCES membership(id),
    account_name VARCHAR(255) NOT NULL,
    opening_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    created_by VARCHAR(40) NOT NULL,
    deleted_by VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    CONSTRAINT pl_ledger_account_membership_fk 
        FOREIGN KEY (parent_membership_id) 
        REFERENCES membership(id) ON DELETE RESTRICT
);

CREATE INDEX pl_ledger_account_membership_idx ON pl_ledger_account(parent_membership_id);
```

**Fields:** Same structure as `dc_ledger_account`

---

### **Table 7: pl_ledger_entry** (Ledger Entries)

```sql
CREATE TABLE pl_ledger_entry (
    id VARCHAR(40) PRIMARY KEY,
    pl_ledger_accounts_id VARCHAR(40) NOT NULL REFERENCES pl_ledger_account(id),
    parent_membership_id INTEGER NOT NULL REFERENCES membership(id),
    
    category VARCHAR(100) NOT NULL COMMENT 'LOAN_DISBURSEMENT, COLLECTION, INTEREST_INCOME, EXPENSE, etc.',
    subcategory VARCHAR(100) COMMENT 'Loan Payments, New Loans, etc.',
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    
    reference_id VARCHAR(40) COMMENT 'Reference to loan_id, receivable_id, receipt_id, etc.',
    reference_type VARCHAR(50) COMMENT 'loan_disbursement, collection, interest_income, etc.',
    payment_date DATE NOT NULL COMMENT 'Payment date chosen by user',
    
    created_by VARCHAR(40) NOT NULL,
    deleted_by VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    CONSTRAINT pl_ledger_entry_account_fk 
        FOREIGN KEY (pl_ledger_accounts_id) 
        REFERENCES pl_ledger_account(id) ON DELETE RESTRICT,
    CONSTRAINT pl_ledger_entry_membership_fk 
        FOREIGN KEY (parent_membership_id) 
        REFERENCES membership(id) ON DELETE RESTRICT
);

CREATE INDEX pl_ledger_entry_account_idx ON pl_ledger_entry(pl_ledger_accounts_id);
CREATE INDEX pl_ledger_entry_membership_idx ON pl_ledger_entry(parent_membership_id);
CREATE INDEX pl_ledger_entry_reference_idx ON pl_ledger_entry(reference_id, reference_type);
CREATE INDEX pl_ledger_entry_payment_date_idx ON pl_ledger_entry(payment_date);
CREATE INDEX pl_ledger_entry_category_idx ON pl_ledger_entry(category);
```

**Fields:** Same structure as `dc_ledger_entry` with `pl_` prefix

---

## 🔄 Business Logic & Calculations

### **Loan Disbursement Flow:**

1. **User Input:**
   - Subscriber ID
   - Principal Amount
   - Interest Rate
   - Payment Type (INTEREST_FREE, INTEREST_ONLY, INTEREST_PRINCIPAL)
   - Loan Mode (DAILY, WEEKLY, MONTHLY)
   - Total Installments
   - Disbursement Date
   - First Due Date
   - Payment Method

2. **Calculate Installment Amount:**
   
   ```javascript
   function calculateInstallmentAmount(principal, interestRate, paymentType, loanMode, totalInstallments) {
       const periodsPerYear = {
           'DAILY': 365,
           'WEEKLY': 52,
           'MONTHLY': 12
       };
       
       const periods = periodsPerYear[loanMode];
       const ratePerPeriod = interestRate / 100 / periods;
       
       switch(paymentType) {
           case 'INTEREST_FREE':
               return principal / totalInstallments;
               
           case 'INTEREST_ONLY':
               return principal * ratePerPeriod;
               
           case 'INTEREST_PRINCIPAL':
               // EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
               const r = ratePerPeriod;
               const n = totalInstallments;
               if (r === 0) {
                   return principal / n; // If interest is 0, equal installments
               }
               const emi = principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
               return emi;
       }
   }
   ```

3. **Generate Receivables:**
   
   ```javascript
   function generateReceivables(loan) {
       const receivables = [];
       let openingBalance = loan.principal_amount;
       const periodsPerYear = getPeriodsPerYear(loan.loan_mode);
       const ratePerPeriod = loan.interest_rate / 100 / periodsPerYear;
       
       for (let i = 1; i <= loan.total_installments; i++) {
           const dueDate = calculateDueDate(loan.loan_due_start_date, loan.loan_mode, i);
           
           let principalDue = 0;
           let interestDue = 0;
           
           if (loan.payment_type === 'INTEREST_FREE') {
               principalDue = loan.principal_amount / loan.total_installments;
               interestDue = 0;
           } else if (loan.payment_type === 'INTEREST_ONLY') {
               principalDue = 0;
               interestDue = openingBalance * ratePerPeriod;
           } else if (loan.payment_type === 'INTEREST_PRINCIPAL') {
               interestDue = openingBalance * ratePerPeriod;
               principalDue = loan.installment_amount - interestDue;
           }
           
           const closingBalance = openingBalance - principalDue;
           const totalDue = principalDue + interestDue;
           
           receivables.push({
               installment_number: i,
               due_date: dueDate,
               opening_principal_balance: openingBalance,
               principal_due: principalDue,
               interest_due: interestDue,
               total_due: totalDue,
               closing_principal_balance: closingBalance
           });
           
           openingBalance = closingBalance;
       }
       
       return receivables;
   }
   ```

### **Payment Collection Flow:**

1. **User selects receivable and pays amount**
2. **Update Receivable:**
   - `is_paid = true`
   - `paid_amount = payment_amount`
   - `paid_date = payment_date`

3. **Create Receipt:**
   - Record payment details
   - Split into `principal_paid` and `interest_paid`

4. **Update Loan:**
   - `outstanding_balance -= principal_paid`
   - `total_principal_paid += principal_paid`
   - `total_interest_paid += interest_paid`
   - Update `status` if fully paid

5. **Create Ledger Entry:**
   - Category: 'COLLECTION'
   - Amount: `paid_amount`
   - Reference: `receipt_id`

---

## 📋 Implementation Phases

### **Phase 1: Database Setup** ✅

**Goal:** Create all 7 database tables with proper structure

**Tasks:**
1. Create SQL migration file: `create-pl-tables.sql`
2. Create all 7 tables with proper fields, constraints, indexes
3. Create ENUM types for `payment_type`, `loan_mode`, `status`
4. Test table creation in development database
5. Document table structure

**Deliverables:**
- ✅ SQL migration file
- ✅ Table creation script
- ✅ Index documentation

---

### **Phase 2: Sequelize Models** ✅

**Goal:** Create Sequelize models for all 7 tables

**Tasks:**
1. Create model files in `src/models/`:
   - `plCompany.js`
   - `plSubscriber.js`
   - `plLoan.js`
   - `plReceivable.js`
   - `plReceipt.js`
   - `plLedgerAccount.js`
   - `plLedgerEntry.js`
2. Define all fields with proper data types
3. Configure associations in `associate()` methods:
   - `plLoan.belongsTo(plSubscriber)`
   - `plReceivable.belongsTo(plLoan)`
   - `plReceipt.belongsTo(plReceivable)`
   - `plReceipt.belongsTo(plLoan)`
   - `plLedgerEntry.belongsTo(plLedgerAccount)`
4. Update `src/models/index.js` to include all PL models
5. Test model associations

**Deliverables:**
- ✅ 7 model files
- ✅ Updated `index.js`
- ✅ Association tests

---

### **Phase 3: Backend Controllers** ✅

**Goal:** Create controllers for all operations

**Tasks:**
1. Create controller files in `src/controllers/`:
   - `plCompanyController.js` - Company CRUD
   - `plSubscriberController.js` - Subscriber CRUD
   - `plLoanController.js` - Loan operations (disburse, list, get, close, delete)
   - `plCollectionsController.js` - Receivable listing and payment collection
   - `plReceiptController.js` - Receipt operations
   - `plLedgerController.js` - Ledger account & entry operations
   - `plDashboardController.js` - Dashboard stats
   - `plReportsController.js` - Reports generation

2. **Key Controller Methods:**

   **plLoanController.js:**
   - `disburseLoan()` - Create loan + generate receivables
   - `getAllLoans()` - List loans with filters
   - `getLoanById()` - Get loan with receivables and receipts
   - `closeLoan()` - Close active loan (regular closure)
   - `forecloseLoan()` - **Foreclose loan early (with interest recalculation)**
   - `deleteLoan()` - Delete loan (cascade delete receivables/receipts)
   - `calculateInstallmentAmount()` - Calculate based on payment_type
   - `generateReceivables()` - Generate payment schedule
   - `calculateForeclosureAmount()` - Calculate outstanding amount for foreclosure
   - `recalculateInterestForForeclosure()` - Calculate interest only up to foreclosure date

   **plCollectionsController.js:**
   - `getAllReceivables()` - List receivables with filters
   - `collectPayment()` - Record payment (supports partial and full payments) + update loan + create receipt + ledger entry
   - `collectPartialPayment()` - Handle partial payment logic with carry_forward
   - `collectFullPayment()` - Handle full payment logic

   **plLedgerController.js:**
   - `getAllLedgerAccounts()` - List accounts
   - `createLedgerAccount()` - Create account
   - `getAllLedgerEntries()` - List entries with filters
   - `createLedgerEntry()` - Create entry
   - `getLedgerSummary()` - Get summary stats

**Deliverables:**
- ✅ 8 controller files
- ✅ All CRUD operations
- ✅ Business logic implementation

---

### **Phase 4: API Routes** ✅

**Goal:** Create API endpoints for all operations

**Tasks:**
1. Create `src/routes/plRoutes.js`:
   - Company routes: POST, PUT, GET, GET/:id, DELETE/:id
   - Subscriber routes: POST, PUT, GET, GET/:id, DELETE/:id
   - Loan routes: POST /disburse, GET, GET/:id, PUT /:id/close, DELETE/:id
   - Collections routes: GET /receivables, POST /collections/pay
   - Receipt routes: GET, GET/:id
   - Ledger routes: GET /ledger/accounts, POST /ledger/accounts, GET /ledger/entries, POST /ledger/entries, GET /ledger/summary
   - Dashboard routes: GET /dashboard
   - Reports routes: GET /reports, POST /reports/generate

2. Update `src/routes/index.js`:
   - Add `app.use('/api/v1/pl', plRoutes);`

3. Add JWT authentication middleware (`verifyToken`)
4. Add permission checks if needed (`checkPermission`)

**Deliverables:**
- ✅ `plRoutes.js` file
- ✅ Updated `index.js`
- ✅ All endpoints documented

---

### **Phase 5: Business Logic - Loan Calculations** ✅

**Goal:** Implement calculation logic for 3 payment types

**Tasks:**
1. Create utility file: `src/utils/plLoanCalculations.js`
   - `calculateInstallmentAmount()` - Based on payment_type
   - `generateReceivables()` - Generate payment schedule
   - `calculateInterestDue()` - Calculate interest for period
   - `calculatePrincipalDue()` - Calculate principal for period
   - `getPeriodsPerYear()` - Helper for loan_mode conversion

2. Test calculations:
   - INTEREST_FREE: Equal installments
   - INTEREST_ONLY: Only interest, principal unchanged
   - INTEREST_PRINCIPAL: EMI calculation, principal reduces

3. Edge cases:
   - Zero interest rate
   - Single installment
   - Large number of installments

**Deliverables:**
- ✅ Calculation utility file
- ✅ Unit tests for calculations
- ✅ Edge case handling

---

### **Phase 6: Testing & Validation** ✅

**Goal:** Test all functionality

**Tasks:**
1. Test company CRUD operations
2. Test subscriber CRUD operations
3. Test loan disbursement for all 3 payment types:
   - Create loan
   - Verify receivables generation
   - Verify calculations
4. Test payment collection:
   - Record payment
   - Verify loan balance update
   - Verify receipt creation
   - Verify ledger entry
5. Test ledger operations
6. Test loan closure
7. Test loan deletion (cascade)

**Deliverables:**
- ✅ Test results document
- ✅ Bug fixes
- ✅ Validation complete

---

## 🔑 Key Technical Considerations

### **1. Payment Type Logic:**

- **INTEREST_FREE:**
  - `interest_rate` stored but not used in calculations
  - All installments are equal: `principal / installments`
  - Principal reduces each period
  - No interest component

- **INTEREST_ONLY:**
  - Interest calculated per period: `principal * rate / periods_per_year`
  - Principal remains same throughout loan
  - Only interest is paid each period
  - Principal paid in full at end (or separately)

- **INTEREST_PRINCIPAL (EMI):**
  - Use standard EMI formula
  - Fixed installment amount
  - Interest portion decreases over time
  - Principal portion increases over time
  - Principal reduces each period

### **2. Data Isolation:**

- All tables use `parent_membership_id` for multi-tenant isolation
- All queries filter by `parent_membership_id`
- No cross-membership data access

### **3. Audit Trail:**

- All tables have `created_by`, `updated_by` fields
- Ledger entries track all financial transactions
- Receipts linked to receivables and loans
- Payment history maintained

### **4. Cascade Deletes:**

- `pl_receivable` → cascade delete on `pl_loan` deletion
- `pl_receipt` → cascade delete on `pl_receivable` deletion
- Ledger entries → soft delete (paranoid)

### **5. Status Management:**

- Loan status: ACTIVE → CLOSED/OVERDUE/CANCELLED
- Receivable status: `is_paid` boolean
- Update loan status when all receivables paid

---

## 📊 Comparison with Daily Collection App

| Feature | Daily Collection (dc) | Personal Loan (pl) |
|---------|----------------------|-------------------|
| **Company Table** | ✅ dc_company | ✅ pl_company |
| **Subscriber Table** | ✅ dc_subscriber (app-specific) | ✅ pl_subscriber (app-specific) |
| **Product Table** | ✅ dc_product | ❌ **NOT NEEDED** |
| **Loan Table** | ✅ dc_loan | ✅ pl_loan (with payment_type) |
| **Interest Calculation** | Simple (fixed rate) | **3 types: Free, Only, EMI** |
| **Receivable Table** | ✅ dc_receivable | ✅ pl_receivable (with principal/interest split) |
| **Receipt Table** | ✅ dc_receipt | ✅ pl_receipt (with principal/interest split) |
| **Ledger Account** | ✅ dc_ledger_account | ✅ pl_ledger_account |
| **Ledger Entry** | ✅ dc_ledger_entry | ✅ pl_ledger_entry |

**Key Differences:**
1. ❌ **No Product Table** - Loans disbursed directly with interest rate
2. ✅ **Payment Type Enum** - 3 options for interest handling
3. ✅ **Split Principal/Interest** - Receivables and receipts track separately
4. ✅ **EMI Calculation** - Standard formula for INTEREST_PRINCIPAL type
5. ✅ **Interest Tracking** - Separate fields for interest paid/due

---

## 🚀 Step-by-Step Implementation Order

### **Step 1: Database Tables**
1. Create SQL migration file
2. Create all 7 tables
3. Test table creation

### **Step 2: Models**
1. Create all 7 Sequelize models
2. Configure associations
3. Update index.js

### **Step 3: Company & Subscriber (Foundation)**
1. Create plCompanyController
2. Create plSubscriberController
3. Create routes
4. Test CRUD operations

### **Step 4: Loan Core Logic**
1. Create calculation utilities
2. Create plLoanController (disburse, list, get)
3. Test loan disbursement for all 3 payment types
4. Verify receivables generation

### **Step 5: Collections & Receipts**
1. Create plCollectionsController
2. Create plReceiptController
3. Test payment collection
4. Verify loan balance updates

### **Step 6: Ledger**
1. Create plLedgerController
2. Integrate ledger entries with loan operations
3. Test ledger operations

### **Step 7: Dashboard & Reports**
1. Create plDashboardController
2. Create plReportsController
3. Add summary stats

### **Step 8: Integration & Testing**
1. End-to-end testing
2. Fix bugs
3. Performance optimization
4. Documentation

---

## ✅ Success Criteria

1. ✅ All 7 tables created and tested
2. ✅ All models and associations working
3. ✅ All controllers implemented
4. ✅ All routes configured
5. ✅ Loan disbursement works for all 3 payment types
6. ✅ Receivables generated correctly
7. ✅ Payment collection updates balances correctly
8. ✅ Ledger entries created properly
9. ✅ No impact on existing Daily Collection App
10. ✅ Data isolation maintained (parent_membership_id)
11. ✅ Calculations accurate for all scenarios
12. ✅ Edge cases handled

---

## 📝 Notes

- **No changes to existing app** - All PL code is completely separate
- **Follow Daily Collection pattern** - Maintain consistency
- **Test thoroughly** - Especially calculation logic
- **Document calculations** - For future reference
- **Consider performance** - Index all foreign keys and frequently queried fields
- **Data migration** - Not needed (new app, no existing data)

---

## 🎯 Next Steps (After Analysis Approval)

1. **Confirm approach** - Review and approve this plan
2. **Start with Step 1** - Database table creation
3. **Iterative development** - One phase at a time
4. **Testing at each phase** - Validate before moving forward
5. **Frontend development** - After backend is complete (separate task)

---

**Document Version:** 1.0  
**Date:** January 11, 2026  
**Status:** 📋 Planning - Awaiting Approval
