# Backend Integration Instructions for Foreclosure Feature

## Quick Integration Guide

### Step 1: Locate Your Backend Files

Your backend is located at:
```
C:\Users\mail2\OneDrive\Desktop\Mani\Treasure Artifacts\Treasureservice\Latest from Github\treasure-service-main (1)
```

### Step 2: Update Controller

**File:** `src/controllers/plLoanController.js`

1. Open the file
2. Find the existing `forecloseLoan` method (if it exists)
3. Replace it with the code from `BACKEND_FORECLOSURE_COMPLETE.js` (section 1)
4. OR add the new method to your exports

**Example:**
```javascript
// In plLoanController.js

// ... existing code ...

const forecloseLoan = async (req, res) => {
    // Copy the complete method from BACKEND_FORECLOSURE_COMPLETE.js
    // ... (see the file for full code)
};

module.exports = {
    // ... existing exports
    disburseLoan,
    getAllLoans,
    getLoanById,
    forecloseLoan, // Add this
    // ... other exports
};
```

### Step 3: Update Routes

**File:** `src/routes/plRoutes.js`

1. Open the file
2. Add the foreclosure route after other loan routes

**Example:**
```javascript
const express = require('express');
const router = express.Router();
const plLoanController = require('../controllers/plLoanController');
const { verifyToken } = require('../middleware/auth');

// Existing routes...
router.get('/loans', verifyToken, plLoanController.getAllLoans);
router.get('/loans/:loanId', verifyToken, plLoanController.getLoanById);
router.post('/loans/disburse', verifyToken, plLoanController.disburseLoan);

// ADD THIS LINE:
router.post('/loans/:loanId/foreclose', verifyToken, plLoanController.forecloseLoan);

module.exports = router;
```

### Step 4: Verify Dependencies

Make sure these are available in your controller:
- `db` - Your Sequelize database instance
- `responseUtils` - Your response utility functions
- Models: `plLoan`, `plSubscriber`, `plReceivable`, `plReceipt`, `plLedgerAccount`, `plLedgerEntry`

### Step 5: Test

1. Start your backend server
2. Test the endpoint using Postman or your frontend
3. Verify:
   - ✅ Receipt is created
   - ✅ Ledger entry is created
   - ✅ Ledger account balance increases
   - ✅ Loan status changes to FORECLOSED
   - ✅ All receivables are marked as PAID

## Common Issues & Solutions

### Issue: "db is not defined"
**Solution:** Make sure you're importing/requiring your database instance correctly:
```javascript
const db = require('../models'); // Adjust path as needed
```

### Issue: "responseUtils is not defined"
**Solution:** Import your response utility:
```javascript
const responseUtils = require('../utils/responseUtils'); // Adjust path as needed
```

### Issue: "Model associations not working"
**Solution:** Verify your model associations are set up correctly in `src/models/index.js`

### Issue: "Transaction rollback error"
**Solution:** Make sure you're using the same transaction instance throughout the method

## API Endpoint Details

**Method:** POST  
**URL:** `/api/v1/pl/loans/:loanId/foreclose`  
**Auth:** Required (Bearer Token)

**Request Body:**
```json
{
  "paymentDate": "2024-01-15",
  "paymentMode": "Cash Account",
  "pl_ledger_accounts_id": "uuid-here",
  "membershipId": "uuid-here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "results": {
    // Updated loan object
  },
  "message": "Loan foreclosed successfully"
}
```

**Error Response (400/404/500):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Need Help?

If you encounter any issues:
1. Check the console logs for detailed error messages
2. Verify all model associations are correct
3. Ensure the database tables exist and have the required columns
4. Check that the middleware (verifyToken) is working correctly
