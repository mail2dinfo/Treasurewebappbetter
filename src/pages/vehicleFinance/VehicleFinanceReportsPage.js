import React, { useMemo, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useVfPermission } from '../../components/vehicleFinance/useVfPermission';
import { FiDownload, FiFileText } from 'react-icons/fi';
import VehicleFinanceLoanSummaryPDF from '../../components/vehicleFinance/PDF/VehicleFinanceLoanSummaryPDF';
import VehicleFinanceLoanWiseOutstandingDuePDF from '../../components/vehicleFinance/PDF/VehicleFinanceLoanWiseOutstandingDuePDF';
import VehicleFinanceSubscriberWiseOutstandingDuePDF from '../../components/vehicleFinance/PDF/VehicleFinanceSubscriberWiseOutstandingDuePDF';
import VehicleFinanceProfitReportPDF from '../../components/vehicleFinance/PDF/VehicleFinanceProfitReportPDF';
import VehicleFinanceVehicleReportPDF from '../../components/vehicleFinance/PDF/VehicleFinanceVehicleReportPDF';

const REPORT_TYPES = [
    {
        id: 'loan-summary',
        label: 'Loan Wise Summary',
        featureKey: 'vf_report_loan_summary',
    },
    {
        id: 'loan-wise-outstanding-due',
        label: 'Loan Wise Outstanding Due',
        featureKey: 'vf_report_loan_summary',
    },
    {
        id: 'subscriber-wise-outstanding-due',
        label: 'Subscriber Wise Outstanding Due',
        featureKey: 'vf_report_loan_summary',
    },
    {
        id: 'profit-report',
        label: 'Profit Report',
        featureKey: 'vf_report_financial_summary',
    },
    {
        id: 'vehicle-report',
        label: 'Vehicle Report',
        featureKey: 'vf_report_loan_summary',
    },
];

const OUTSTANDING_COLUMNS = [
    { key: 'loanId', label: 'Loan No' },
    { key: 'customerName', label: 'Customer' },
    { key: 'vehicle', label: 'Vehicle' },
    { key: 'loanAmount', label: 'Loan Amt', money: true },
    { key: 'interest', label: 'Interest', money: true },
    { key: 'tenure', label: 'Tenure' },
    { key: 'emi', label: 'EMI', money: true },
    { key: 'totalPaid', label: 'Paid', money: true },
    { key: 'totalOutstanding', label: 'Outstanding', money: true },
    { key: 'status', label: 'Status' },
];

const DUE_COLUMNS = [
    { key: 'loanId', label: 'Loan Number' },
    { key: 'customerName', label: 'Customer Name' },
    { key: 'customerPhone', label: 'Phone Number' },
    { key: 'loanAmount', label: 'Loan Amount', money: true },
    { key: 'disbursedDate', label: 'Loan Disbursed Date' },
    { key: 'totalDue', label: 'Total Due (upto date)', money: true },
    { key: 'totalPaid', label: 'Total Paid', money: true },
    { key: 'totalOutstanding', label: 'Total Outstanding', money: true },
    { key: 'loanProgress', label: 'Loan Progress' },
];

const SUBSCRIBER_DUE_COLUMNS = [
    { key: 'subscriberName', label: 'Subscriber Name' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'totalDue', label: 'Total Due', money: true },
    { key: 'progress', label: 'Progress' },
];

const PROFIT_COLUMNS = [
    { key: 'loanId', label: 'Loan No' },
    { key: 'customerName', label: 'Customer' },
    { key: 'principalDisbursed', label: 'Principal Disbursed', money: true },
    { key: 'interestEarned', label: 'Interest Earned', money: true },
    { key: 'penaltyEarned', label: 'Penalty Earned', money: true },
    { key: 'balanceOutstanding', label: 'Balance Outstanding', money: true },
];

const VEHICLE_COLUMNS = [
    { key: 'vehicleNo', label: 'Vehicle No' },
    { key: 'engineNo', label: 'Engine No' },
    { key: 'chassisNo', label: 'Chassis No' },
    { key: 'model', label: 'Model' },
    { key: 'customerName', label: 'Customer' },
    { key: 'loanStatus', label: 'Loan Status' },
];

const sumField = (rows, key) =>
    rows.reduce((sum, row) => sum + (parseFloat(row?.[key]) || 0), 0);

const appendCumulativeRow = (rows, reportId) => {
    if (!Array.isArray(rows) || rows.length === 0) return rows;

    if (reportId === 'loan-summary') {
        return [
            ...rows,
            {
                isCumulative: true,
                loanId: 'Cumulative',
                customerName: '',
                vehicle: '',
                loanAmount: sumField(rows, 'loanAmount'),
                interest: sumField(rows, 'interest'),
                tenure: '',
                emi: sumField(rows, 'emi'),
                totalPaid: sumField(rows, 'totalPaid'),
                totalOutstanding: sumField(rows, 'totalOutstanding'),
                status: '',
            },
        ];
    }

    if (reportId === 'loan-wise-outstanding-due') {
        return [
            ...rows,
            {
                isCumulative: true,
                loanId: 'Cumulative',
                customerName: '',
                customerPhone: '',
                loanAmount: sumField(rows, 'loanAmount'),
                disbursedDate: '',
                totalDue: sumField(rows, 'totalDue'),
                totalPaid: sumField(rows, 'totalPaid'),
                totalOutstanding: sumField(rows, 'totalOutstanding'),
                paidDueCount: sumField(rows, 'paidDueCount'),
                dueCount: sumField(rows, 'dueCount'),
                loanProgress: '',
            },
        ];
    }

    if (reportId === 'subscriber-wise-outstanding-due') {
        return [
            ...rows,
            {
                isCumulative: true,
                subscriberId: 'cumulative',
                subscriberName: 'Total due',
                phoneNumber: '',
                totalDue: sumField(rows, 'totalDue'),
                totalPaid: sumField(rows, 'totalPaid'),
                totalOutstanding: sumField(rows, 'totalOutstanding'),
                paidDueCount: sumField(rows, 'paidDueCount'),
                pendingDueCount: sumField(rows, 'pendingDueCount'),
                progress: '',
            },
        ];
    }

    if (reportId === 'profit-report') {
        return [
            ...rows,
            {
                isCumulative: true,
                loanId: 'Cumulative',
                customerName: '',
                principalDisbursed: sumField(rows, 'principalDisbursed'),
                interestEarned: sumField(rows, 'interestEarned'),
                penaltyEarned: sumField(rows, 'penaltyEarned'),
                balanceOutstanding: sumField(rows, 'balanceOutstanding'),
            },
        ];
    }

    return rows;
};

const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const shortLoanId = (id) => {
    if (!id) return '—';
    const str = String(id);
    return str.length > 16 ? `${str.slice(0, 8)}…${str.slice(-4)}` : str;
};

const toDateOnly = (value) => {
    if (!value) return '';
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return '';
};

const formatDisplayDate = (value) => {
    const dateOnly = toDateOnly(value);
    if (!dateOnly) return '—';
    const [year, month, day] = dateOnly.split('-');
    if (!year || !month || !day) return dateOnly;
    return `${day}/${month}/${year}`;
};

const resolveLoanAmount = (loan) => {
    if (!loan || typeof loan !== 'object') return 0;
    const candidates = [
        loan.loan_amount,
        loan.loanAmount,
        loan.principal_amount,
        loan.principalAmount,
        loan.cash_in_hand,
        loan.cashInHand,
    ];
    for (const candidate of candidates) {
        if (candidate == null || candidate === '') continue;
        const amount = parseFloat(candidate);
        if (Number.isFinite(amount)) return amount;
    }
    return 0;
};

const resolveDisbursedDate = (loan) => {
    if (!loan || typeof loan !== 'object') return null;
    return (
        loan.loan_disbursement_date
        || loan.loanDisbursementDate
        || loan.disbursed_date
        || loan.disbursedDate
        || null
    );
};

const firstPresent = (...values) => {
    for (const value of values) {
        if (value !== null && value !== undefined && value !== '') return value;
    }
    return null;
};

const coalesceLoan = (baseLoan, detailLoan) => {
    if (!detailLoan || typeof detailLoan !== 'object') return { ...(baseLoan || {}) };
    const merged = { ...(baseLoan || {}) };
    Object.entries(detailLoan).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            merged[key] = value;
        }
    });
    if (detailLoan.subscriber) {
        merged.subscriber = detailLoan.subscriber;
    }
    return merged;
};

const formatVehicleType = (loan, fallbackLoan) => {
    const source = loan || {};
    const fallback = fallbackLoan || {};
    const makeModel = [
        firstPresent(source.vehicle_make, source.vehicleMake, fallback.vehicle_make),
        firstPresent(source.vehicle_model, source.vehicleModel, fallback.vehicle_model),
    ].filter(Boolean).join(' ').trim();
    const vehicleNumber = firstPresent(
        source.vehicle_number,
        source.vehicleNumber,
        fallback.vehicle_number
    );
    if (makeModel && vehicleNumber) return `${makeModel} (${vehicleNumber})`;
    if (makeModel) return makeModel;
    if (vehicleNumber) return String(vehicleNumber);

    const productName = firstPresent(
        source.product?.product_name,
        fallback.product?.product_name
    );
    if (productName) return productName;

    const type = firstPresent(
        source.vehicle_type,
        source.vehicleType,
        fallback.vehicle_type,
        fallback.vehicleType
    );
    if (!type) return '—';
    const normalized = String(type).toUpperCase();
    if (normalized === 'TWO_WHEELER') return 'Two Wheeler';
    if (normalized === 'FOUR_WHEELER') return 'Four Wheeler';
    if (normalized === 'OTHER') return 'Other';
    return String(type).replace(/_/g, ' ');
};

const formatTenure = (loan, fallbackLoan, receivableCount = 0) => {
    const source = loan || {};
    const fallback = fallbackLoan || {};
    const countRaw = firstPresent(
        source.total_installments,
        source.totalInstallments,
        fallback.total_installments,
        fallback.totalInstallments,
        receivableCount > 0 ? receivableCount : null
    );
    const count = parseInt(countRaw, 10);
    const mode = String(
        firstPresent(
            source.repayment_mode,
            source.repaymentMode,
            source.tenure_mode,
            source.tenureMode,
            source.loan_mode,
            source.loanMode,
            fallback.repayment_mode,
            fallback.tenure_mode,
            fallback.loan_mode
        ) || ''
    ).trim();
    const modeLabel = mode
        ? mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase()
        : '';
    if (Number.isFinite(count) && count > 0 && modeLabel) return `${count} ${modeLabel}`;
    if (Number.isFinite(count) && count > 0) return String(count);
    if (modeLabel) return modeLabel;
    return '—';
};

const resolveInterest = (loan, fallbackLoan, loanAmount = 0) => {
    const source = loan || {};
    const fallback = fallbackLoan || {};
    const direct = parseFloat(
        firstPresent(
            source.interest_amount,
            source.interestAmount,
            fallback.interest_amount,
            fallback.interestAmount
        )
    );
    if (Number.isFinite(direct)) return direct;

    const totalRepay = parseFloat(
        firstPresent(source.total_repay_amount, source.totalRepayAmount, fallback.total_repay_amount)
    );
    if (Number.isFinite(totalRepay) && loanAmount > 0) {
        return Math.max(0, totalRepay - loanAmount);
    }
    return 0;
};

const resolveEmi = (loan, fallbackLoan, receivables = []) => {
    const source = loan || {};
    const fallback = fallbackLoan || {};
    const direct = parseFloat(
        firstPresent(
            source.installment_amount,
            source.installmentAmount,
            fallback.installment_amount,
            fallback.installmentAmount
        )
    );
    if (Number.isFinite(direct) && direct > 0) return direct;

    const firstDue = receivables.find((item) => parseFloat(item?.due_amount || 0) > 0);
    const fromReceivable = parseFloat(firstDue?.due_amount || 0);
    return Number.isFinite(fromReceivable) ? fromReceivable : 0;
};

const getStoredPlatformMembershipId = () => {
    try {
        const stored = JSON.parse(localStorage.getItem('platform_active_context') || 'null');
        return stored?.parentMembershipId ?? null;
    } catch {
        return null;
    }
};

const todayDateOnly = () => new Date().toISOString().split('T')[0];

const VehicleFinanceReportsPage = () => {
    const { user } = useUserContext();
    const { canAccess } = useVfPermission();
    const allowedReports = useMemo(
        () => REPORT_TYPES.filter((report) => (
            canAccess(report.featureKey)
            || canAccess('vf_reports')
            || canAccess('vf_report_loan_summary')
        )),
        [canAccess]
    );

    const [reportType, setReportType] = useState(allowedReports[0]?.id || 'loan-summary');
    const [asOfDate, setAsOfDate] = useState(todayDateOnly());
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const userAccounts = user?.results?.userAccounts || [];
    const ownerAccount = userAccounts.find(
        (account) => String(account?.accountName || '').toLowerCase() === 'user'
    );
    const account =
        userAccounts.find((item) => item?.parent_membership_id != null)
        || userAccounts[0];
    const membershipId = getStoredPlatformMembershipId()
        ?? ownerAccount?.parent_membership_id
        ?? account?.parent_membership_id
        ?? account?.membershipId
        ?? account?.membership_id
        ?? user?.results?.membershipId
        ?? null;

    const selectedMeta = REPORT_TYPES.find((item) => item.id === reportType) || REPORT_TYPES[0];
    const isLoanDueReport = reportType === 'loan-wise-outstanding-due';
    const isSubscriberDueReport = reportType === 'subscriber-wise-outstanding-due';
    const isProfitReport = reportType === 'profit-report';
    const isVehicleReport = reportType === 'vehicle-report';
    const isDueReport = isLoanDueReport || isSubscriberDueReport;
    const dataRows = useMemo(() => {
        if (isSubscriberDueReport) {
            return Array.isArray(report?.data?.subscribers) ? report.data.subscribers : [];
        }
        return Array.isArray(report?.data?.loans) ? report.data.loans : [];
    }, [report, isSubscriberDueReport]);
    const rows = useMemo(
        () => appendCumulativeRow(dataRows, reportType),
        [dataRows, reportType]
    );
    const columns = isVehicleReport
        ? VEHICLE_COLUMNS
        : isProfitReport
            ? PROFIT_COLUMNS
            : isSubscriberDueReport
                ? SUBSCRIBER_DUE_COLUMNS
                : (isLoanDueReport ? DUE_COLUMNS : OUTSTANDING_COLUMNS);
    const totals = report?.data?.totals || {};

    const fetchLoans = async (token, membershipIdValue) => {
        const loansRes = await fetch(
            `${API_BASE_URL}/vf/loans?parent_membership_id=${membershipIdValue}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        const loansData = await loansRes.json().catch(() => ({}));
        if (!loansRes.ok) {
            throw new Error(loansData?.message || 'Failed to load loans');
        }
        const list = Array.isArray(loansData.results)
            ? loansData.results
            : (loansData.results?.loans || []);
        return list.map((loan) => ({
            ...loan,
            loan_amount: resolveLoanAmount(loan),
            loan_disbursement_date: resolveDisbursedDate(loan),
        }));
    };

    const fetchLoanDetails = async (token, membershipIdValue, loanId) => {
        const detailRes = await fetch(
            `${API_BASE_URL}/vf/loans/${loanId}?parent_membership_id=${membershipIdValue}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        if (!detailRes.ok) return { loan: null, receivables: [] };
        const detailData = await detailRes.json().catch(() => ({}));
        const results = detailData.results || {};
        return {
            loan: results.loan || null,
            receivables: Array.isArray(results.receivables) ? results.receivables : [],
        };
    };

    const fetchReceivablesForLoan = async (token, membershipIdValue, loanId) => {
        const recvRes = await fetch(
            `${API_BASE_URL}/vf/receivables/loan/${loanId}?parent_membership_id=${membershipIdValue}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        if (!recvRes.ok) return [];
        const recvData = await recvRes.json().catch(() => ({}));
        return Array.isArray(recvData.results) ? recvData.results : [];
    };

    const buildLoanWiseOutstandingRows = async (token, membershipIdValue) => {
        const loans = await fetchLoans(token, membershipIdValue);

        return Promise.all(
            loans.map(async (listLoan) => {
                const details = await fetchLoanDetails(token, membershipIdValue, listLoan.id);
                const loan = coalesceLoan(listLoan, details.loan);
                let receivables = Array.isArray(details.receivables) ? details.receivables : [];
                if (!receivables.length) {
                    receivables = await fetchReceivablesForLoan(token, membershipIdValue, listLoan.id);
                }

                const loanAmount = resolveLoanAmount(loan) || resolveLoanAmount(listLoan);
                const interest = resolveInterest(loan, listLoan, loanAmount);
                const emi = resolveEmi(loan, listLoan, receivables);
                const totalDue = parseFloat(
                    firstPresent(loan.total_repay_amount, listLoan.total_repay_amount, loanAmount + interest)
                ) || (loanAmount + interest);
                const totalOutstanding = parseFloat(
                    firstPresent(
                        loan.closing_balance,
                        loan.total_outstanding,
                        listLoan.closing_balance,
                        listLoan.total_outstanding,
                        0
                    )
                ) || 0;
                const totalPaid = Math.max(0, totalDue - totalOutstanding);

                return {
                    loanId: loan.id || listLoan.id,
                    customerName: loan.subscriber?.vf_cust_name || listLoan.subscriber?.vf_cust_name || 'N/A',
                    vehicle: formatVehicleType(loan, listLoan),
                    loanAmount,
                    interest,
                    tenure: formatTenure(loan, listLoan, receivables.length),
                    emi,
                    totalPaid,
                    totalOutstanding,
                    status: firstPresent(loan.status, listLoan.status) || '—',
                    totalDue,
                };
            })
        );
    };

    /**
     * Dues with due_date <= asOfDate only.
     * Supposed = paid so far on that installment + remaining due.
     * Collected = receipt totals (or full supposed if marked paid with no receipt split).
     * Pending = remaining due on unpaid/partial installments.
     * Progress = paid dues / dues due by as-of date (e.g. 5/5 due).
     */
    const buildLoanWiseOutstandingDueRows = async (token, membershipIdValue, reportAsOfDate) => {
        const asOf = toDateOnly(reportAsOfDate) || todayDateOnly();
        const loans = await fetchLoans(token, membershipIdValue);

        const rowsBuilt = await Promise.all(
            loans.map(async (listLoan) => {
                const details = await fetchLoanDetails(token, membershipIdValue, listLoan.id);
                const loan = coalesceLoan(listLoan, details.loan);

                let list = details.receivables;
                if (!list.length) {
                    list = await fetchReceivablesForLoan(token, membershipIdValue, listLoan.id);
                }

                const dueByDate = list.filter((r) => toDateOnly(r.due_date) && toDateOnly(r.due_date) <= asOf);

                let totalDue = 0;
                let totalPaid = 0;
                let totalOutstanding = 0;
                let paidDueCount = 0;

                dueByDate.forEach((receivable) => {
                    const receipts = Array.isArray(receivable.receipts) ? receivable.receipts : [];
                    const receiptsPaid = receipts.reduce(
                        (sum, receipt) => sum + (parseFloat(receipt.paid_amount || 0) || 0),
                        0
                    );
                    const remaining = receivable.is_paid
                        ? 0
                        : (parseFloat(receivable.due_amount || 0) || 0);

                    // What this installment was supposed to collect
                    let scheduled = receiptsPaid + remaining;
                    if (scheduled <= 0 && receivable.is_paid) {
                        scheduled = parseFloat(loan.installment_amount || 0) || 0;
                    }

                    const paidForThis = receivable.is_paid
                        ? (receiptsPaid > 0 ? receiptsPaid : scheduled)
                        : receiptsPaid;

                    totalDue += scheduled;
                    totalPaid += paidForThis;
                    totalOutstanding += remaining;
                    if (receivable.is_paid || remaining <= 0.009) {
                        paidDueCount += 1;
                    }
                });

                totalOutstanding = Math.max(0, totalDue - totalPaid);

                const dueCount = dueByDate.length;

                return {
                    loanId: loan.id || listLoan.id,
                    customerName: loan.subscriber?.vf_cust_name || listLoan.subscriber?.vf_cust_name || 'N/A',
                    customerPhone: loan.subscriber?.vf_cust_phone || listLoan.subscriber?.vf_cust_phone || '—',
                    loanAmount: resolveLoanAmount(loan) || resolveLoanAmount(listLoan),
                    disbursedDate: formatDisplayDate(
                        resolveDisbursedDate(loan) || resolveDisbursedDate(listLoan)
                    ),
                    totalDue,
                    totalPaid,
                    totalOutstanding,
                    loanProgress: `${paidDueCount} / ${dueCount} due`,
                    paidDueCount,
                    dueCount,
                    status: loan.status || listLoan.status,
                };
            })
        );

        // Include loans with at least one due by as-of date (or all loans for visibility)
        return rowsBuilt.filter((row) => row.dueCount > 0 || row.totalDue > 0 || row.totalPaid > 0);
    };

    /**
     * Aggregate dues by subscriber as of date.
     * Progress example: "Total due 5. Due paid 4. Due outstanding 1"
     * Total Due (money) = remaining outstanding amount for dues due by as-of date.
     */
    const buildSubscriberWiseOutstandingDueRows = async (token, membershipIdValue, reportAsOfDate) => {
        const asOf = toDateOnly(reportAsOfDate) || todayDateOnly();
        const loans = await fetchLoans(token, membershipIdValue);
        const bySubscriber = new Map();

        await Promise.all(
            loans.map(async (listLoan) => {
                const details = await fetchLoanDetails(token, membershipIdValue, listLoan.id);
                const loan = coalesceLoan(listLoan, details.loan);

                let list = details.receivables;
                if (!list.length) {
                    list = await fetchReceivablesForLoan(token, membershipIdValue, listLoan.id);
                }

                const dueByDate = list.filter(
                    (r) => toDateOnly(r.due_date) && toDateOnly(r.due_date) <= asOf
                );
                if (!dueByDate.length) return;

                const subscriberId = firstPresent(
                    loan.subscriber_id,
                    loan.subscriber?.vf_cust_id,
                    listLoan.subscriber_id,
                    listLoan.subscriber?.vf_cust_id,
                    listLoan.id
                );
                const subscriberName = firstPresent(
                    loan.subscriber?.vf_cust_name,
                    listLoan.subscriber?.vf_cust_name,
                    'N/A'
                );
                const phoneNumber = firstPresent(
                    loan.subscriber?.vf_cust_phone,
                    listLoan.subscriber?.vf_cust_phone,
                    '—'
                );

                if (!bySubscriber.has(subscriberId)) {
                    bySubscriber.set(subscriberId, {
                        subscriberId,
                        subscriberName,
                        phoneNumber,
                        totalDue: 0,
                        totalPaid: 0,
                        totalOutstanding: 0,
                        paidDueCount: 0,
                        pendingDueCount: 0,
                    });
                }

                const bucket = bySubscriber.get(subscriberId);

                dueByDate.forEach((receivable) => {
                    const receipts = Array.isArray(receivable.receipts) ? receivable.receipts : [];
                    const receiptsPaid = receipts.reduce(
                        (sum, receipt) => sum + (parseFloat(receipt.paid_amount || 0) || 0),
                        0
                    );
                    const remaining = receivable.is_paid
                        ? 0
                        : (parseFloat(receivable.due_amount || 0) || 0);

                    let scheduled = receiptsPaid + remaining;
                    if (scheduled <= 0 && receivable.is_paid) {
                        scheduled = parseFloat(loan.installment_amount || listLoan.installment_amount || 0) || 0;
                    }

                    const paidForThis = receivable.is_paid
                        ? (receiptsPaid > 0 ? receiptsPaid : scheduled)
                        : receiptsPaid;

                    const isPaidDue = receivable.is_paid || remaining <= 0.009;

                    bucket.totalDue += scheduled;
                    bucket.totalPaid += paidForThis;
                    bucket.totalOutstanding += remaining;
                    if (isPaidDue) bucket.paidDueCount += 1;
                    else bucket.pendingDueCount += 1;
                });
            })
        );

        return Array.from(bySubscriber.values())
            .map((row) => {
                const outstanding = Math.max(0, row.totalDue - row.totalPaid);
                const totalDueCount = row.paidDueCount + row.pendingDueCount;
                return {
                    subscriberId: row.subscriberId,
                    subscriberName: row.subscriberName,
                    phoneNumber: row.phoneNumber,
                    // Outstanding due amount as of now
                    totalDue: outstanding > 0 ? outstanding : Math.max(0, row.totalOutstanding),
                    totalPaid: row.totalPaid,
                    totalOutstanding: outstanding,
                    paidDueCount: row.paidDueCount,
                    pendingDueCount: row.pendingDueCount,
                    totalDueCount,
                    progress: `Total due ${totalDueCount}. Due paid ${row.paidDueCount}. Due outstanding ${row.pendingDueCount}`,
                };
            })
            .filter((row) => row.paidDueCount > 0 || row.pendingDueCount > 0 || row.totalDue > 0)
            .sort((a, b) => String(a.subscriberName).localeCompare(String(b.subscriberName)));
    };

    const buildProfitReportRows = async (token, membershipIdValue) => {
        const loans = await fetchLoans(token, membershipIdValue);

        return Promise.all(
            loans.map(async (listLoan) => {
                const details = await fetchLoanDetails(token, membershipIdValue, listLoan.id);
                const loan = coalesceLoan(listLoan, details.loan);
                let receivables = Array.isArray(details.receivables) ? details.receivables : [];
                if (!receivables.length) {
                    receivables = await fetchReceivablesForLoan(token, membershipIdValue, listLoan.id);
                }

                const principalDisbursed = resolveLoanAmount(loan) || resolveLoanAmount(listLoan);
                const interestAmount = resolveInterest(loan, listLoan, principalDisbursed);
                const totalRepay = parseFloat(
                    firstPresent(
                        loan.total_repay_amount,
                        listLoan.total_repay_amount,
                        principalDisbursed + interestAmount
                    )
                ) || (principalDisbursed + interestAmount);
                const balanceOutstanding = parseFloat(
                    firstPresent(
                        loan.closing_balance,
                        loan.total_outstanding,
                        listLoan.closing_balance,
                        listLoan.total_outstanding,
                        0
                    )
                ) || 0;

                // Interest earned = interest portion already recovered from total repay
                const interestShare = totalRepay > 0 ? (interestAmount / totalRepay) : 0;
                const interestOutstanding = balanceOutstanding * interestShare;
                const interestEarned = Math.max(0, interestAmount - interestOutstanding);

                // Penalty: from loan/receipt fields when present (VF has no dedicated penalty yet)
                const penaltyFromLoan = parseFloat(
                    firstPresent(
                        loan.penalty_amount,
                        loan.penalty_earned,
                        loan.penaltyEarned,
                        listLoan.penalty_amount,
                        0
                    )
                ) || 0;
                const penaltyFromReceipts = receivables.reduce((sum, receivable) => {
                    const receipts = Array.isArray(receivable.receipts) ? receivable.receipts : [];
                    return sum + receipts.reduce((receiptSum, receipt) => (
                        receiptSum
                        + (parseFloat(receipt.penalty_amount || receipt.penalty || 0) || 0)
                    ), 0);
                }, 0);
                const penaltyEarned = penaltyFromLoan + penaltyFromReceipts;

                return {
                    loanId: loan.id || listLoan.id,
                    customerName: loan.subscriber?.vf_cust_name || listLoan.subscriber?.vf_cust_name || 'N/A',
                    principalDisbursed,
                    interestEarned,
                    penaltyEarned,
                    balanceOutstanding,
                };
            })
        );
    };

    const buildVehicleReportRows = async (token, membershipIdValue) => {
        const loans = await fetchLoans(token, membershipIdValue);

        return Promise.all(
            loans.map(async (listLoan) => {
                const details = await fetchLoanDetails(token, membershipIdValue, listLoan.id);
                const loan = coalesceLoan(listLoan, details.loan);
                const make = firstPresent(loan.vehicle_make, loan.vehicleMake, listLoan.vehicle_make);
                const modelName = firstPresent(loan.vehicle_model, loan.vehicleModel, listLoan.vehicle_model);
                const model = [make, modelName].filter(Boolean).join(' ').trim()
                    || formatVehicleType(loan, listLoan);

                return {
                    loanId: loan.id || listLoan.id,
                    vehicleNo: firstPresent(
                        loan.vehicle_number,
                        loan.vehicleNumber,
                        listLoan.vehicle_number
                    ) || '—',
                    engineNo: firstPresent(
                        loan.engine_number,
                        loan.engineNumber,
                        loan.engine_no,
                        listLoan.engine_number,
                        listLoan.engineNumber
                    ) || '—',
                    chassisNo: firstPresent(
                        loan.chassis_number,
                        loan.chassisNumber,
                        listLoan.chassis_number
                    ) || '—',
                    model: model || '—',
                    customerName: loan.subscriber?.vf_cust_name
                        || listLoan.subscriber?.vf_cust_name
                        || 'N/A',
                    loanStatus: firstPresent(loan.status, listLoan.status) || '—',
                };
            })
        );
    };

    const generate = async () => {
        if (!user?.results?.token) return;
        if (!membershipId) {
            setError('Membership not found for this login.');
            return;
        }
        if (!allowedReports.some((item) => item.id === reportType)) {
            setError('You do not have permission for this report.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const token = user.results.token;

            if (reportType === 'subscriber-wise-outstanding-due') {
                const subscriberRows = await buildSubscriberWiseOutstandingDueRows(
                    token,
                    membershipId,
                    asOfDate
                );
                const supposed = subscriberRows.reduce(
                    (sum, row) => sum + (row.totalPaid + row.totalOutstanding),
                    0
                );
                const collected = subscriberRows.reduce((sum, row) => sum + row.totalPaid, 0);
                const pending = subscriberRows.reduce((sum, row) => sum + row.totalDue, 0);
                setReport({
                    title: selectedMeta.label,
                    generatedAt: new Date().toISOString(),
                    asOfDate: toDateOnly(asOfDate) || todayDateOnly(),
                    data: {
                        subscribers: subscriberRows,
                        totals: { supposed, collected, pending },
                    },
                });
            } else if (reportType === 'loan-wise-outstanding-due') {
                const loanRows = await buildLoanWiseOutstandingDueRows(token, membershipId, asOfDate);
                const supposed = loanRows.reduce((sum, row) => sum + row.totalDue, 0);
                const collected = loanRows.reduce((sum, row) => sum + row.totalPaid, 0);
                const pending = loanRows.reduce((sum, row) => sum + row.totalOutstanding, 0);
                setReport({
                    title: selectedMeta.label,
                    generatedAt: new Date().toISOString(),
                    asOfDate: toDateOnly(asOfDate) || todayDateOnly(),
                    data: {
                        loans: loanRows,
                        totals: { supposed, collected, pending },
                    },
                });
            } else if (reportType === 'profit-report') {
                const loanRows = await buildProfitReportRows(token, membershipId);
                setReport({
                    title: selectedMeta.label,
                    generatedAt: new Date().toISOString(),
                    data: {
                        loans: loanRows,
                        totals: {
                            supposed: sumField(loanRows, 'principalDisbursed'),
                            collected: sumField(loanRows, 'interestEarned') + sumField(loanRows, 'penaltyEarned'),
                            pending: sumField(loanRows, 'balanceOutstanding'),
                        },
                    },
                });
            } else if (reportType === 'vehicle-report') {
                const loanRows = await buildVehicleReportRows(token, membershipId);
                setReport({
                    title: selectedMeta.label,
                    generatedAt: new Date().toISOString(),
                    data: {
                        loans: loanRows,
                        totals: {},
                    },
                });
            } else {
                const loanRows = await buildLoanWiseOutstandingRows(token, membershipId);
                setReport({
                    title: selectedMeta.label,
                    generatedAt: new Date().toISOString(),
                    data: {
                        loans: loanRows,
                        totals: {
                            supposed: loanRows.reduce((sum, row) => sum + row.totalDue, 0),
                            collected: loanRows.reduce((sum, row) => sum + row.totalPaid, 0),
                            pending: loanRows.reduce((sum, row) => sum + row.totalOutstanding, 0),
                        },
                    },
                });
            }
        } catch (generateError) {
            setError(generateError.message || 'Failed to generate report');
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    if (!allowedReports.length) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-2">Reports</h1>
                <p className="text-gray-500">No report permissions are assigned to this login.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Loan, subscriber, vehicle, outstanding due and profit reports.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
                {allowedReports.map((item) => {
                    const selected = reportType === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                setReportType(item.id);
                                setReport(null);
                                setError('');
                            }}
                            className={`text-left rounded-xl border p-4 transition-all ${
                                selected
                                    ? 'border-red-500 bg-red-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-red-200 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`mt-0.5 rounded-lg p-2 ${selected ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                    <FiFileText />
                                </span>
                                <span>
                                    <span className="block font-semibold text-gray-900">{item.label}</span>
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white border rounded-xl p-4 sm:p-6 mb-6 flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
                <div className="flex-1 space-y-3">
                    <div>
                        <p className="font-semibold text-gray-900">{selectedMeta?.label}</p>
                    </div>
                    {isDueReport && (
                        <div className="max-w-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                As of date
                            </label>
                            <input
                                type="date"
                                value={asOfDate}
                                onChange={(e) => setAsOfDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={generate}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 w-full lg:w-auto"
                >
                    {loading ? 'Generating…' : 'Generate Report'}
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {report && (
                <div className="bg-white border rounded-xl overflow-hidden">
                    <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="font-semibold text-gray-900">{report.title || selectedMeta.label}</h2>
                            <p className="text-xs text-gray-500 mt-1">
                                {isDueReport && report.asOfDate
                                    ? `As of ${report.asOfDate} · `
                                    : ''}
                                {report.generatedAt
                                    ? `Generated ${new Date(report.generatedAt).toLocaleString('en-IN')}`
                                    : ''}
                            </p>
                        </div>
                        {rows.length > 0 && (
                            isSubscriberDueReport ? (
                                <PDFDownloadLink
                                    key={`subscriber-due-pdf-${report.generatedAt || rows.length}`}
                                    document={
                                        <VehicleFinanceSubscriberWiseOutstandingDuePDF
                                            subscribers={rows}
                                            generatedAt={report.generatedAt}
                                            asOfDate={report.asOfDate}
                                            totals={totals}
                                        />
                                    }
                                    fileName={`subscriber-wise-outstanding-due-${report.asOfDate || todayDateOnly()}.pdf`}
                                    className="inline-flex"
                                >
                                    {({ loading: pdfLoading }) => (
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                        >
                                            <FiDownload className="w-4 h-4" />
                                            {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            ) : isLoanDueReport ? (
                                <PDFDownloadLink
                                    key={`due-pdf-${report.generatedAt || rows.length}`}
                                    document={
                                        <VehicleFinanceLoanWiseOutstandingDuePDF
                                            loans={rows}
                                            generatedAt={report.generatedAt}
                                            asOfDate={report.asOfDate}
                                            totals={totals}
                                        />
                                    }
                                    fileName={`loan-wise-outstanding-due-${report.asOfDate || todayDateOnly()}.pdf`}
                                    className="inline-flex"
                                >
                                    {({ loading: pdfLoading }) => (
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                        >
                                            <FiDownload className="w-4 h-4" />
                                            {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            ) : isProfitReport ? (
                                <PDFDownloadLink
                                    key={`profit-pdf-${report.generatedAt || rows.length}`}
                                    document={
                                        <VehicleFinanceProfitReportPDF
                                            loans={rows}
                                            generatedAt={report.generatedAt}
                                        />
                                    }
                                    fileName={`profit-report-${todayDateOnly()}.pdf`}
                                    className="inline-flex"
                                >
                                    {({ loading: pdfLoading }) => (
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                        >
                                            <FiDownload className="w-4 h-4" />
                                            {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            ) : isVehicleReport ? (
                                <PDFDownloadLink
                                    key={`vehicle-pdf-${report.generatedAt || rows.length}`}
                                    document={
                                        <VehicleFinanceVehicleReportPDF
                                            loans={rows}
                                            generatedAt={report.generatedAt}
                                        />
                                    }
                                    fileName={`vehicle-report-${todayDateOnly()}.pdf`}
                                    className="inline-flex"
                                >
                                    {({ loading: pdfLoading }) => (
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                        >
                                            <FiDownload className="w-4 h-4" />
                                            {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            ) : (
                                <PDFDownloadLink
                                    key={`outstanding-pdf-${report.generatedAt || rows.length}`}
                                    document={
                                        <VehicleFinanceLoanSummaryPDF
                                            loans={rows}
                                            generatedAt={report.generatedAt}
                                        />
                                    }
                                    fileName={`loan-wise-summary-${todayDateOnly()}.pdf`}
                                    className="inline-flex"
                                >
                                    {({ loading: pdfLoading }) => (
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                                        >
                                            <FiDownload className="w-4 h-4" />
                                            {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            )
                        )}
                    </div>

                    {isDueReport && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-b bg-gray-50">
                            <div className="rounded-lg border bg-white p-3">
                                <p className="text-xs text-gray-500">Supposed to be collected</p>
                                <p className="text-lg font-bold text-gray-900 mt-1">{formatMoney(totals.supposed)}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                                <p className="text-xs text-gray-500">Collected</p>
                                <p className="text-lg font-bold text-green-700 mt-1">{formatMoney(totals.collected)}</p>
                            </div>
                            <div className="rounded-lg border bg-white p-3">
                                <p className="text-xs text-gray-500">Pending</p>
                                <p className="text-lg font-bold text-red-700 mt-1">{formatMoney(totals.pending)}</p>
                            </div>
                        </div>
                    )}

                    {rows.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {columns.map((column) => (
                                            <th
                                                key={column.key}
                                                className="p-3 text-left font-medium text-gray-700 whitespace-nowrap uppercase text-xs tracking-wide"
                                            >
                                                {column.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr
                                            key={row.subscriberId || row.loanId || index}
                                            className={`border-t ${row.isCumulative ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}
                                        >
                                            {columns.map((column) => {
                                                const value = row[column.key];
                                                return (
                                                    <td
                                                        key={column.key}
                                                        className={`p-3 whitespace-nowrap ${row.isCumulative ? 'text-gray-900' : 'text-gray-700'}`}
                                                    >
                                                        {column.key === 'loanId'
                                                            ? (
                                                                row.isCumulative
                                                                    ? 'Cumulative'
                                                                    : (
                                                                        <span title={String(value || '')}>
                                                                            {shortLoanId(value)}
                                                                        </span>
                                                                    )
                                                            )
                                                            : column.money
                                                                ? formatMoney(value)
                                                                : (value ?? '—')}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="p-6 text-gray-500 text-center">No data for this report</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default VehicleFinanceReportsPage;
