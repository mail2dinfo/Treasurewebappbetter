/**
 * Personal Loan repayment / collection modes.
 * INTEREST_ONLY = Interest only during term + principal at end (bullet).
 */

export const PL_LOAN_MODES = {
    INTEREST_FREE: {
        id: 'INTEREST_FREE',
        label: 'Interest-Free',
        shortLabel: 'Interest-Free',
        needsInterest: false,
        needsTenure: false,
        rateLabel: null,
        summary: 'No interest is charged. Customer repays principal only.',
        collection: 'Collect principal as agreed. No monthly interest dues.',
        details: null,
    },
    EMI: {
        id: 'EMI',
        label: 'EMI (Equated Monthly Installment)',
        shortLabel: 'EMI',
        needsInterest: true,
        needsTenure: true,
        rateLabel: 'Annual interest rate (%)',
        summary: 'Same amount every month. Early EMIs have more interest; later EMIs have more principal. Most common bank model.',
        collection: 'Collect fixed EMI each month (interest + principal). Outstanding balance reduces over tenure.',
        details: {
            title: 'EMI (Equated Monthly Installment) — Most Common',
            points: [
                'Customer pays the same amount every month.',
                'Each EMI has Interest + Principal.',
                'Beginning: more interest, less principal.',
                'Towards the end: less interest, more principal.',
            ],
            exampleTitle: 'Example — Loan ₹1,00,000 · 12% per year · 12 months',
            exampleNote: 'Monthly EMI ≈ ₹8,885',
            table: {
                headers: ['Month', 'EMI', 'Interest', 'Principal', 'Balance'],
                rows: [
                    ['1', '8,885', '1,000', '7,885', '92,115'],
                    ['2', '8,885', '921', '7,964', '84,151'],
                ],
            },
            footer: 'This is the model used by most banks.',
        },
    },
    PRINCIPAL_INTEREST: {
        id: 'PRINCIPAL_INTEREST',
        label: 'Principal + Interest (Reducing Balance)',
        shortLabel: 'Principal + Interest',
        needsInterest: true,
        needsTenure: true,
        rateLabel: 'Annual interest rate (%)',
        summary: 'Fixed principal every month; interest falls as balance reduces. Total payment decreases each month.',
        collection: 'Collect fixed principal share + interest on remaining balance each month.',
        details: {
            title: 'Principal + Interest (Reducing Balance)',
            points: [
                'Principal installment is fixed every month.',
                'Interest is charged on outstanding balance, so it decreases over time.',
                'Total monthly payment decreases every month.',
            ],
            exampleTitle: 'Example — Loan ₹1,20,000 · 12 months',
            exampleNote: 'Principal every month = ₹10,000',
            table: {
                headers: ['Month', 'Principal', 'Interest', 'Total'],
                rows: [
                    ['1', '10,000', '1,200', '11,200'],
                    ['2', '10,000', '1,100', '11,100'],
                ],
            },
            footer: 'Payments decrease every month as interest reduces.',
        },
    },
    INTEREST_ONLY: {
        id: 'INTEREST_ONLY',
        label: 'Interest Only + Principal at End (Bullet)',
        shortLabel: 'Interest Only + Principal at End',
        needsInterest: true,
        needsTenure: false,
        rateLabel: 'Monthly interest rate (%)',
        summary: 'No fixed tenure. Pay monthly interest on outstanding principal while the loan is open. Principal can be repaid anytime to reduce or close the loan.',
        collection: 'Collect monthly interest first; any extra amount reduces principal. Pay principal + interest anytime to close.',
        details: {
            title: 'Interest Only + Principal at End (Bullet Loan)',
            points: [
                'No fixed installment timeline — loan stays open while principal is outstanding.',
                'Monthly interest = outstanding principal × monthly rate (e.g. ₹1,00,000 × 1% = ₹1,000).',
                'Subscriber can keep paying only interest as long as they hold the principal.',
                'Any payment: interest is settled first; leftover amount reduces principal.',
                'Example: pay ₹50,000 when interest due is ₹1,000 → ₹1,000 interest + ₹49,000 principal; new principal ₹51,000; next monthly interest = ₹510.',
                'To close anytime: pay outstanding principal + current interest due (e.g. ₹1,01,000).',
            ],
            exampleTitle: 'Example — Loan ₹1,00,000 · 1% per month',
            exampleNote: 'Interest for one month from disbursement date to the same date next month = ₹1,000.',
            table: {
                headers: ['Action', 'Result'],
                rows: [
                    ['Pay ₹1,000', 'Interest only — principal stays ₹1,00,000'],
                    ['Pay ₹50,000', '₹1,000 interest + ₹49,000 principal → principal ₹51,000'],
                    ['Pay ₹1,01,000', 'Interest + full principal → loan closed'],
                ],
            },
            footer: 'Interest always recalculates on the remaining outstanding principal.',
        },
    },
    FLAT_INTEREST: {
        id: 'FLAT_INTEREST',
        label: 'Flat Interest',
        shortLabel: 'Flat Interest',
        needsInterest: true,
        needsTenure: true,
        rateLabel: 'Annual flat interest rate (%)',
        summary: 'Interest is calculated on the original loan amount for the full period, then split into equal monthly payments.',
        collection: 'Collect equal monthly installment of (principal + flat interest) / tenure.',
        details: {
            title: 'Flat Interest Loan',
            points: [
                'Interest is calculated on the original loan amount for the whole period.',
                'Repayments do not reduce the interest base.',
                'Simple to calculate, but usually costs more than reducing-balance methods.',
            ],
            exampleTitle: 'Example — Loan ₹1,00,000 · 12% for one year',
            exampleNote: 'Interest = ₹12,000 · Total payable = ₹1,12,000 · Monthly ≈ ₹9,333',
            table: null,
            footer: 'Simple, but generally higher total interest than reducing balance.',
        },
    },
};

export const PL_LOAN_MODE_OPTIONS = Object.values(PL_LOAN_MODES);

export const getPlLoanMode = (modeId) =>
    PL_LOAN_MODES[modeId] || PL_LOAN_MODES.INTEREST_FREE;

export const getPlLoanModeLabel = (modeId) =>
    getPlLoanMode(modeId).shortLabel;

export const plLoanModeNeedsInterest = (modeId) =>
    Boolean(getPlLoanMode(modeId).needsInterest);

export const plLoanModeNeedsTenure = (modeId) =>
    Boolean(getPlLoanMode(modeId).needsTenure);
