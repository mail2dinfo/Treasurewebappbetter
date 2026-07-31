/**
 * Frontend mirror of backend plLoanScheduleUtils for Step-2 preview.
 * Amounts are rounded to 2 decimals; any residual gap is adjusted on the final installment.
 */

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Round to nearest rupee (common EMI display/collection practice). */
const roundRupee = (n) => Math.round(Number(n) + Number.EPSILON);

const clampDueDate = (date, dueDay) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const day = Math.min(Math.max(parseInt(dueDay, 10) || 1, 1), lastDay);
    d.setDate(day);
    return d.toISOString().slice(0, 10);
};

const addMonths = (isoDate, months) => {
    const d = new Date(isoDate);
    d.setMonth(d.getMonth() + months);
    return d;
};

/**
 * Ensure sum(principal) === original principal by adjusting the last installment.
 * Also refreshes last.total. Returns { rows, adjusted: boolean, principalGap }.
 */
const applyFinalAdjustment = (rows, originalPrincipal) => {
    if (!rows.length) return { rows, adjusted: false, principalGap: 0 };

    const sumP = round2(rows.reduce((s, r) => s + (r.principal || 0), 0));
    const principalGap = round2(originalPrincipal - sumP);
    const last = rows[rows.length - 1];

    if (Math.abs(principalGap) >= 0.01) {
        last.principal = round2(last.principal + principalGap);
        if (last.principal < 0) last.principal = 0;
        last.total = round2(last.principal + (last.interest || 0));
        last.adjusted = true;
        return { rows, adjusted: true, principalGap };
    }

    last.total = round2(last.principal + (last.interest || 0));
    return { rows, adjusted: false, principalGap: 0 };
};

/**
 * Collection due day options: exactly 5 days in the month AFTER disbursement,
 * after one full month has matured.
 *
 * Examples:
 *   Apr 5  → May 6,7,8,9,10  (day after anniversary, then 5 days)
 *   Apr 30 → May 1,2,3,4,5   (not enough room after day 30 → first 5 days of next month)
 */
const parseLocalYmd = (disbursedDate) => {
    const [year, month, day] = String(disbursedDate || '').slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return null;
    return { year, month, day };
};

const formatGbDate = (d) =>
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/** Add N calendar months to a YYYY-MM-DD date (clamps day to month length). */
const addCalendarMonths = (ymd, monthsToAdd) => {
    const p = parseLocalYmd(ymd);
    if (!p) return null;
    const totalMonths = (p.year * 12 + (p.month - 1)) + monthsToAdd;
    const year = Math.floor(totalMonths / 12);
    const monthIndex = totalMonths % 12;
    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    return new Date(year, monthIndex, Math.min(p.day, lastDay));
};

/**
 * INTEREST_ONLY interest period for the Nth interest receivable (0-based),
 * based on disbursement anniversaries — not collection due day.
 * index 0 → disbursement → +1 month; index 1 → +1 → +2 months; etc.
 */
export const getBulletInterestPeriod = (disbursedDate, interestIndex) => {
    const idx = parseInt(interestIndex, 10);
    if (!disbursedDate || Number.isNaN(idx) || idx < 0) return null;
    const from = addCalendarMonths(disbursedDate, idx);
    const to = addCalendarMonths(disbursedDate, idx + 1);
    if (!from || !to) return null;
    return { from, to, fromLabel: formatGbDate(from), toLabel: formatGbDate(to) };
};

/**
 * First INTEREST_ONLY due date: always the due day in the month AFTER disbursement,
 * mirroring buildInterestDueDates on the backend.
 */
export const getFirstInterestDueDate = (disbursedDate, dueDay) => {
    const day = parseInt(dueDay, 10);
    if (!disbursedDate || !day || day < 1 || day > 31) return null;

    const [year, month] = String(disbursedDate).slice(0, 10).split('-').map(Number);
    if (!year || !month) return null;

    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, lastDay));
};

/**
 * Returns 5 allowed collection due-day options for the month after disbursement.
 * Each item: { day, date (Date), label }.
 */
export const getCollectionDueDayOptions = (disbursedDate) => {
    const p = parseLocalYmd(disbursedDate);
    if (!p) return [];

    // Month after disbursement (Date month index = p.month for next calendar month)
    const daysInNext = new Date(p.year, p.month + 1, 0).getDate();
    const startCandidate = p.day + 1;

    let days;
    if (startCandidate + 4 <= daysInNext) {
        days = [
            startCandidate,
            startCandidate + 1,
            startCandidate + 2,
            startCandidate + 3,
            startCandidate + 4,
        ];
    } else {
        // Not enough consecutive days after anniversary in next month
        // (e.g. Apr 30 → use May 1–5)
        days = [1, 2, 3, 4, 5].filter((d) => d <= daysInNext);
    }

    return days.map((day) => {
        const date = new Date(p.year, p.month, day);
        return {
            day,
            date,
            label: formatGbDate(date),
            value: String(day),
        };
    });
};

/** @deprecated use getCollectionDueDayOptions — kept for any leftover callers */
export const getMinCollectionDueDay = (disbursedDate) => {
    const opts = getCollectionDueDayOptions(disbursedDate);
    return opts.length ? opts[0].day : null;
};

export const validateCollectionDueDay = (disbursedDate, dueDay) => {
    if (!disbursedDate) {
        return 'Select disbursement date first';
    }
    const day = parseInt(dueDay, 10);
    if (!day) {
        return 'Please select a collection due day';
    }
    const options = getCollectionDueDayOptions(disbursedDate);
    if (!options.length) {
        return 'No collection days available for this disbursement date';
    }
    if (!options.some((o) => o.day === day)) {
        const labels = options.map((o) => o.label).join(', ');
        return `Collection due day must be one of: ${labels}`;
    }
    return null;
};

export const buildPersonalLoanSchedulePreview = ({
    loanMode,
    principal,
    interestRate,
    tenureMonths,
    disbursedDate,
    dueDay,
}) => {
    const P = round2(parseFloat(principal));
    if (!P || P <= 0) return [];

    if (loanMode === 'INTEREST_FREE') {
        return [{
            installmentNo: 1,
            dueDate: null,
            principal: P,
            interest: 0,
            total: P,
        }];
    }

    if (loanMode === 'INTEREST_ONLY') {
        const monthlyInterest = round2(P * ((parseFloat(interestRate) || 0) / 100));
        return [{
            installmentNo: 1,
            dueDate: null,
            principal: P,
            interest: monthlyInterest,
            total: round2(P + monthlyInterest),
            monthlyInterest,
            note: 'Open-ended bullet loan. Monthly interest on outstanding principal; principal repayable anytime.',
        }];
    }

    const n = parseInt(tenureMonths, 10);
    if (!n || n < 1) return [];
    const annual = parseFloat(interestRate) || 0;
    const r = annual / 12 / 100;
    const start = disbursedDate || new Date().toISOString().slice(0, 10);
    let rows = [];

    if (loanMode === 'EMI') {
        let emiRaw;
        if (r === 0) emiRaw = P / n;
        else emiRaw = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        // Round EMI to nearest rupee for clean collection amounts
        const emi = roundRupee(emiRaw);
        let balance = P;

        for (let i = 1; i <= n; i += 1) {
            const interest = round2(balance * r);
            let principalPart;
            if (i === n) {
                // Final installment: clear remaining principal (absorbs rounding gap)
                principalPart = round2(balance);
            } else {
                principalPart = round2(emi - interest);
                if (principalPart > balance) principalPart = round2(balance);
                if (principalPart < 0) principalPart = 0;
            }
            balance = round2(balance - principalPart);
            rows.push({
                installmentNo: i,
                dueDate: clampDueDate(addMonths(start, i), dueDay),
                principal: principalPart,
                interest,
                total: round2(principalPart + interest),
                emiTarget: emi,
            });
        }
    } else if (loanMode === 'PRINCIPAL_INTEREST') {
        const fixedPrincipal = round2(P / n);
        let balance = P;
        for (let i = 1; i <= n; i += 1) {
            const interest = round2(balance * r);
            let principalPart = i === n ? round2(balance) : fixedPrincipal;
            if (principalPart > balance) principalPart = round2(balance);
            balance = round2(balance - principalPart);
            rows.push({
                installmentNo: i,
                dueDate: clampDueDate(addMonths(start, i), dueDay),
                principal: principalPart,
                interest,
                total: round2(principalPart + interest),
            });
        }
    } else if (loanMode === 'FLAT_INTEREST') {
        const years = n / 12;
        const totalInterest = round2(P * (annual / 100) * years);
        const principalPart = round2(P / n);
        const interestPart = round2(totalInterest / n);
        let principalLeft = P;
        let interestLeft = totalInterest;
        for (let i = 1; i <= n; i += 1) {
            const p = i === n ? round2(principalLeft) : principalPart;
            const intAmt = i === n ? round2(interestLeft) : interestPart;
            principalLeft = round2(principalLeft - p);
            interestLeft = round2(interestLeft - intAmt);
            rows.push({
                installmentNo: i,
                dueDate: clampDueDate(addMonths(start, i), dueDay),
                principal: p,
                interest: intAmt,
                total: round2(p + intAmt),
            });
        }
    } else {
        return [];
    }

    const { rows: adjustedRows } = applyFinalAdjustment(rows, P);
    return adjustedRows;
};

export const summarizeSchedule = (rows = []) => {
    const totalPrincipal = round2(rows.reduce((s, r) => s + (r.principal || 0), 0));
    const totalInterest = round2(rows.reduce((s, r) => s + (r.interest || 0), 0));
    const last = rows[rows.length - 1];
    const firstTotal = rows[0]?.total;
    const lastAdjusted =
        rows.length > 1
        && last
        && (last.adjusted || (firstTotal != null && Math.abs(round2(last.total - firstTotal)) >= 0.01));

    return {
        count: rows.length,
        totalPrincipal,
        totalInterest,
        totalPayable: round2(totalPrincipal + totalInterest),
        monthlyInterest: rows[0]?.monthlyInterest != null ? rows[0].monthlyInterest : null,
        lastAdjusted: !!lastAdjusted,
        lastInstallmentTotal: last ? last.total : 0,
    };
};
