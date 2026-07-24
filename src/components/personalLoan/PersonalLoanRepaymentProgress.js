import React, { useMemo } from 'react';
import { getPlLoanModeLabel } from '../../utils/personalLoanModes';

const formatCurrency = (value) =>
    `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const statusBadge = (status) => {
    if (status === 'PAID') return 'bg-green-100 text-green-800';
    if (status === 'PARTIAL') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
};

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Clear repayment progress: completed vs pending + installment / bullet dues.
 */
const PersonalLoanRepaymentProgress = ({ loan }) => {
    const summary = loan?.repayment_summary || {};
    const schedule = summary.installment_schedule || [];
    const isBullet = loan?.loan_mode === 'INTEREST_ONLY';
    const totalPayable = Number(summary.total_payable || 0);
    const totalPaid = Number(summary.total_paid || 0);
    const totalPending = Number(summary.total_pending || loan?.total_outstanding || 0);
    const completedPct = Number(summary.completed_percent || 0);

    const principalPending = Number(
        summary.principal_pending != null
            ? summary.principal_pending
            : loan?.outstanding_principal || 0
    );
    const interestPending = Number(
        summary.interest_pending != null
            ? summary.interest_pending
            : loan?.outstanding_interest || 0
    );
    const rate = parseFloat(loan?.interest_rate) || 0;
    const monthlyInterest = Number(
        summary.monthly_interest != null
            ? summary.monthly_interest
            : round2(principalPending * (rate / 100))
    );
    const interestDue = interestPending > 0 ? interestPending : monthlyInterest;
    const closeAmount = Number(
        summary.close_amount != null
            ? summary.close_amount
            : round2(principalPending + interestDue)
    );

    /** Bullet dues from receivables (principal + interest lines). */
    const bulletDues = useMemo(() => {
        if (!isBullet) return [];
        const rows = (loan?.receivables || [])
            .map((r) => ({
                id: r.id,
                due_type: r.due_type,
                due_date: r.due_date,
                original: parseFloat(r.original_amount != null ? r.original_amount : r.due_amount || 0),
                pending: r.status === 'PAID' ? 0 : parseFloat(r.due_amount || 0),
                status: r.status,
            }))
            .sort((a, b) => {
                if (a.due_type !== b.due_type) {
                    return a.due_type === 'INTEREST' ? -1 : 1;
                }
                return String(a.due_date || '').localeCompare(String(b.due_date || ''));
            });

        // If no interest receivable yet, show projected monthly interest row
        const hasInterest = rows.some((r) => r.due_type === 'INTEREST' && r.pending > 0);
        if (!hasInterest && principalPending > 0 && monthlyInterest > 0) {
            rows.push({
                id: 'projected-monthly-interest',
                due_type: 'INTEREST',
                due_date: null,
                original: monthlyInterest,
                pending: monthlyInterest,
                status: 'PENDING',
                projected: true,
            });
        }
        return rows;
    }, [isBullet, loan?.receivables, principalPending, monthlyInterest]);

    return (
        <div className="space-y-5 mb-6">
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Repayment Progress</h3>
                    <span className="text-sm font-medium text-gray-600">
                        {getPlLoanModeLabel(loan?.loan_mode)}
                    </span>
                </div>

                {isBullet ? (
                    <p className="mb-2 text-sm text-gray-700">
                        Open-ended bullet loan — no fixed installment schedule. Interest is monthly on outstanding principal.
                    </p>
                ) : (
                    summary.installments_total > 0 && (
                        <p className="mb-2 text-sm font-semibold text-gray-800">
                            <span className="text-green-700">{summary.installments_paid || 0} Paid</span>
                            <span className="text-gray-400"> / </span>
                            <span className="text-red-600">{summary.installments_pending || 0} Pending</span>
                            <span className="ml-2 text-xs font-normal text-gray-500">
                                of {summary.installments_total} installments
                            </span>
                        </p>
                    )
                )}

                <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${completedPct}%` }}
                    />
                </div>
                <p className="mt-1 text-xs text-gray-500">{completedPct}% completed</p>
            </div>

            {isBullet ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase">Outstanding principal</p>
                        <p className="mt-1 text-xl font-bold text-red-700">{formatCurrency(principalPending)}</p>
                    </div>
                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                        <p className="text-xs font-medium text-orange-700 uppercase">Monthly interest ({rate}%)</p>
                        <p className="mt-1 text-xl font-bold text-orange-700">{formatCurrency(monthlyInterest)}</p>
                    </div>
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                        <p className="text-xs font-medium text-green-700 uppercase">Paid so far</p>
                        <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                        <p className="text-xs text-green-700 mt-1">
                            P {formatCurrency(summary.principal_paid || 0)}
                            {(summary.interest_paid || 0) > 0 && (
                                <> · I {formatCurrency(summary.interest_paid)}</>
                            )}
                        </p>
                    </div>
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                        <p className="text-xs font-medium text-indigo-700 uppercase">Pay to close now</p>
                        <p className="mt-1 text-xl font-bold text-indigo-800">{formatCurrency(closeAmount)}</p>
                        <p className="text-xs text-indigo-700 mt-1">Principal + interest due</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-4">
                        <p className="text-xs font-medium text-gray-500 uppercase">Total payable</p>
                        <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(totalPayable)}</p>
                    </div>
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                        <p className="text-xs font-medium text-green-700 uppercase">Completed / Paid</p>
                        <p className="mt-1 text-xl font-bold text-green-700">{formatCurrency(totalPaid)}</p>
                        <p className="text-xs text-green-700 mt-1">
                            Principal {formatCurrency(summary.principal_paid || 0)}
                            {(summary.interest_paid || 0) > 0 && (
                                <> · Interest {formatCurrency(summary.interest_paid)}</>
                            )}
                        </p>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-xs font-medium text-red-700 uppercase">Pending</p>
                        <p className="mt-1 text-xl font-bold text-red-700">{formatCurrency(totalPending)}</p>
                        <p className="text-xs text-red-700 mt-1">
                            Principal {formatCurrency(principalPending)}
                            {interestPending > 0 && (
                                <> · Interest {formatCurrency(interestPending)}</>
                            )}
                        </p>
                    </div>
                </div>
            )}

            {/* Bullet: outstanding dues (not installment schedule) */}
            {isBullet && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Outstanding dues</h4>
                    <p className="text-xs text-gray-500 mb-2">
                        No fixed tenure. Interest accrues monthly on remaining principal; principal can be repaid anytime.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Type</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Due date</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Original</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Pending</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {bulletDues.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                                            No outstanding dues
                                        </td>
                                    </tr>
                                ) : (
                                    bulletDues.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    row.due_type === 'PRINCIPAL'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {row.due_type}
                                                    {row.projected ? ' (this month)' : ''}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {row.projected ? 'Current month' : formatDate(row.due_date)}
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-800">
                                                {formatCurrency(row.original)}
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold text-red-600">
                                                {formatCurrency(row.pending)}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(row.status)}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-200">
                                <tr>
                                    <td className="px-3 py-2 text-xs font-semibold text-gray-600" colSpan={3}>
                                        Amount to close (principal + interest due)
                                    </td>
                                    <td className="px-3 py-2 text-right text-sm font-bold text-indigo-800">
                                        {formatCurrency(closeAmount)}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* EMI-style installment schedule */}
            {!isBullet && schedule.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Installment schedule</h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Due date</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Principal</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Interest</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Pending</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {schedule.map((row) => (
                                    <tr key={row.key} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-700">
                                            {row.installment_no || '—'}
                                        </td>
                                        <td className="px-3 py-2 text-gray-700">{formatDate(row.due_date)}</td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                            {formatCurrency(row.principal_original)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                            {formatCurrency(row.interest_original)}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                            {formatCurrency(row.total_original)}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-red-600">
                                            {formatCurrency(row.total_pending)}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadge(row.status)}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalLoanRepaymentProgress;
