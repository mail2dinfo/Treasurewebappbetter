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
