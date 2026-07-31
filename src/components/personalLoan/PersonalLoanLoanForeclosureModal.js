import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiAlertTriangle, FiDollarSign, FiCalendar, FiCreditCard } from 'react-icons/fi';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(amount || 0);

const formatDate = (dateString) => {
    if (!dateString) return '—';
    const raw = String(dateString).slice(0, 10);
    const [y, m, d] = raw.split('-').map(Number);
    if (y && m && d) {
        return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const PersonalLoanLoanForeclosureModal = ({ loan, onClose, onSuccess }) => {
    const { forecloseLoan, getForeclosurePreview, fetchLedgerAccounts } = usePersonalLoanContext();
    const { user } = useUserContext();
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [error, setError] = useState('');
    const [ledgerAccounts, setLedgerAccounts] = useState([]);
    const [settlement, setSettlement] = useState(null);
    const [formData, setFormData] = useState({
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: '',
    });
    const [errors, setErrors] = useState({});

    const loadLedgerAccounts = async () => {
        try {
            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            const res = await fetch(`${API_BASE_URL}/pl/ledger/accounts?parent_membership_id=${membershipId}`, {
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                },
            });
            const data = await res.json();
            if (data.results) {
                setLedgerAccounts(data.results);
            }
        } catch (loadError) {
            console.error('Error loading ledger accounts:', loadError);
        }
    };

    const loadPreview = useCallback(async (paymentDate) => {
        if (!loan?.id || !paymentDate) return;
        setIsPreviewLoading(true);
        setError('');
        try {
            const result = await getForeclosurePreview(loan.id, paymentDate);
            if (result.success) {
                setSettlement(result.data?.settlement || null);
            } else {
                setSettlement(null);
                setError(result.error || 'Failed to load settlement');
            }
        } catch (previewError) {
            setSettlement(null);
            setError(previewError.message || 'Failed to load settlement');
        } finally {
            setIsPreviewLoading(false);
        }
        // getForeclosurePreview is recreated each render from context — intentionally omit
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loan?.id]);

    useEffect(() => {
        loadLedgerAccounts();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        loadPreview(formData.paymentDate);
    }, [formData.paymentDate, loadPreview]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.paymentDate) {
            newErrors.paymentDate = 'Payment date is required';
        }
        if (!formData.paymentMode) {
            newErrors.paymentMode = 'Payment method (Ledger Account) is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const totalClose = Number(settlement?.total_foreclosure_amount || 0);

    const handleForeclose = async () => {
        if (!validate()) {
            return;
        }

        if (!window.confirm(
            `Foreclose this loan for ${formatCurrency(totalClose)}? `
            + 'All pending dues will be settled and no further interest dues will be created.'
        )) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const selectedAccount = ledgerAccounts.find((a) => a.id === formData.paymentMode);
            const paymentModeName = selectedAccount ? selectedAccount.account_name : '';

            const result = await forecloseLoan({
                loanId: loan.id,
                paymentDate: formData.paymentDate,
                paymentMode: paymentModeName,
                pl_ledger_accounts_id: formData.paymentMode,
            });

            if (result.success) {
                await fetchLedgerAccounts();
                if (onSuccess) onSuccess(result.data);
                if (onClose) onClose();
            } else {
                setError(result.error || 'Failed to foreclose loan');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center">
                        <FiAlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                        <h2 className="text-2xl font-bold text-gray-900">Foreclose Loan</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <div className="mb-4 bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subscriber</span>
                            <span className="font-medium">{loan.subscriber?.pl_cust_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Original principal</span>
                            <span className="font-medium">{formatCurrency(loan.principal_amount)}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiCalendar className="inline w-4 h-4 mr-1" />
                            Closing date *
                        </label>
                        <input
                            type="date"
                            name="paymentDate"
                            value={formData.paymentDate}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.paymentDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.paymentDate && (
                            <p className="mt-1 text-sm text-red-600">{errors.paymentDate}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Settlement recalculates when you change this date (includes pro-rata days to close).
                        </p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiCreditCard className="inline w-4 h-4 mr-1" />
                            Payment method (Ledger Account) *
                        </label>
                        <select
                            name="paymentMode"
                            value={formData.paymentMode}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.paymentMode ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Select Payment Method (Ledger Account)</option>
                            {ledgerAccounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.account_name} (Balance: ₹
                                    {parseFloat(account.current_balance || 0).toLocaleString('en-IN', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}
                                    )
                                </option>
                            ))}
                        </select>
                        {errors.paymentMode && (
                            <p className="mt-1 text-sm text-red-600">{errors.paymentMode}</p>
                        )}
                    </div>

                    <div className="rounded-xl border border-red-200 bg-red-50/40 mb-4 overflow-hidden">
                        <div className="px-4 py-3 border-b border-red-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Settlement split</h3>
                            {isPreviewLoading && (
                                <span className="text-xs text-gray-500">Calculating…</span>
                            )}
                        </div>

                        {!settlement && !isPreviewLoading ? (
                            <p className="px-4 py-6 text-sm text-gray-500 text-center">
                                Settlement details unavailable.
                            </p>
                        ) : settlement ? (
                            <div className="p-4 space-y-4 text-sm">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                                        1. Principal
                                    </p>
                                    <div className="flex justify-between rounded-lg bg-white border border-gray-200 px-3 py-2">
                                        <span className="text-gray-700">Outstanding principal</span>
                                        <span className="font-semibold text-red-700">
                                            {formatCurrency(settlement.principal?.amount)}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                                        2. Pending interest dues
                                    </p>
                                    {(settlement.dues || []).length === 0 ? (
                                        <p className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-500">
                                            No billed interest dues pending
                                        </p>
                                    ) : (
                                        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left">Collection date</th>
                                                        <th className="px-3 py-2 text-left">Interest period</th>
                                                        <th className="px-3 py-2 text-left">Inst #</th>
                                                        <th className="px-3 py-2 text-right">Pending</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {settlement.dues.map((due) => (
                                                        <tr key={due.id}>
                                                            <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                                                {formatDate(due.due_date)}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-600">
                                                                {due.period_from && due.period_to
                                                                    ? `${formatDate(due.period_from)} → ${formatDate(due.period_to)}`
                                                                    : '—'}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-500">
                                                                {due.installment_no != null ? due.installment_no : '—'}
                                                            </td>
                                                            <td className="px-3 py-2 text-right font-medium text-orange-700">
                                                                {formatCurrency(due.pending_amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-gray-50 border-t border-gray-200">
                                                    <tr>
                                                        <td className="px-3 py-2 font-semibold text-gray-700" colSpan={3}>
                                                            All dues total
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-bold text-orange-800">
                                                            {formatCurrency(settlement.dues_total)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                                        3. Pro-rata (from last interest anniversary → close)
                                    </p>
                                    {settlement.prorata ? (
                                        <div className="rounded-lg bg-white border border-orange-200 px-3 py-3 space-y-1">
                                            <div className="flex justify-between gap-3">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-0.5">Interest period</p>
                                                    <span className="text-gray-800 font-medium">
                                                        {formatDate(settlement.prorata.period_from || settlement.prorata.from_date)}
                                                        {' → '}
                                                        {formatDate(settlement.prorata.period_to || settlement.prorata.to_date)}
                                                    </span>
                                                </div>
                                                <span className="font-semibold text-orange-700 whitespace-nowrap">
                                                    {formatCurrency(settlement.prorata.amount)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {settlement.prorata.days_held}/{settlement.prorata.cycle_days} days
                                                {' '}of monthly interest {formatCurrency(settlement.prorata.monthly_interest)}
                                                {' '}on outstanding principal (based on disbursement month, not collection day).
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="rounded-lg bg-white border border-gray-200 px-3 py-2 text-gray-500">
                                            {settlement.loan_mode === 'INTEREST_FREE'
                                                ? 'Interest-free loan — no pro-rata'
                                                : 'No pending days — closing on/after last due with no extra hold period'}
                                        </p>
                                    )}
                                </div>

                                {(settlement.waived || []).length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                                            4. Future interest waived (not collected)
                                        </p>
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left">Collection date</th>
                                                        <th className="px-3 py-2 text-left">Interest period</th>
                                                        <th className="px-3 py-2 text-left">Inst #</th>
                                                        <th className="px-3 py-2 text-right">Waived</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 bg-white">
                                                    {settlement.waived.map((due) => (
                                                        <tr key={due.id}>
                                                            <td className="px-3 py-2 text-slate-700 whitespace-nowrap">
                                                                {formatDate(due.due_date)}
                                                            </td>
                                                            <td className="px-3 py-2 text-slate-600">
                                                                {due.period_from && due.period_to
                                                                    ? `${formatDate(due.period_from)} → ${formatDate(due.period_to)}`
                                                                    : '—'}
                                                            </td>
                                                            <td className="px-3 py-2 text-slate-500">
                                                                {due.installment_no != null ? due.installment_no : '—'}
                                                            </td>
                                                            <td className="px-3 py-2 text-right font-medium text-slate-600 line-through">
                                                                {formatCurrency(due.pending_amount)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-slate-100 border-t border-slate-200">
                                                    <tr>
                                                        <td className="px-3 py-2 font-semibold text-slate-700" colSpan={3}>
                                                            Waived total (status: WAIVED)
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-bold text-slate-800">
                                                            {formatCurrency(settlement.waived_total)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500">
                                            These rows are marked WAIVED — not paid by the subscriber and not in the receipt.
                                        </p>
                                    </div>
                                )}

                                <div className="rounded-lg border-2 border-red-300 bg-white px-4 py-3 space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Principal</span>
                                        <span>{formatCurrency(settlement.principal?.amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>+ All dues (collected)</span>
                                        <span>{formatCurrency(settlement.dues_total)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>+ Pro-rata</span>
                                        <span>{formatCurrency(settlement.prorata?.amount || 0)}</span>
                                    </div>
                                    {(settlement.waived_total || 0) > 0 && (
                                        <div className="flex justify-between text-slate-500">
                                            <span>− Future interest waived</span>
                                            <span>{formatCurrency(settlement.waived_total)} (not charged)</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-red-200">
                                        <span className="font-bold text-gray-900">
                                            Total foreclosure amount
                                        </span>
                                        <span className="font-bold text-lg text-red-700">
                                            {formatCurrency(settlement.total_foreclosure_amount)}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-gray-500">
                                    After foreclosure the loan is FORECLOSED. Collected amounts appear on the receipt;
                                    waived future interest stays on the loan as status WAIVED for reporting.
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleForeclose}
                            disabled={isLoading || isPreviewLoading || totalClose <= 0}
                            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                'Processing...'
                            ) : (
                                <>
                                    <FiDollarSign className="w-5 h-5 mr-2" />
                                    Settle {formatCurrency(totalClose)}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalLoanLoanForeclosureModal;
