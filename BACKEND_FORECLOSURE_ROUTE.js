// Backend Route Implementation for Personal Loan Foreclosure
// File: src/routes/plRoutes.js
// Update your existing route to include the new foreclosure endpoint

const express = require('express');
const router = express.Router();
const plLoanController = require('../controllers/plLoanController');
const { verifyToken } = require('../middleware/auth');

// ... existing routes ...

// Foreclose loan route
router.post('/loans/:loanId/foreclose', verifyToken, plLoanController.forecloseLoan);

// ... other routes ...

module.exports = router;
