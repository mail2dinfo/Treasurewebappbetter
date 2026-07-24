import React, { useEffect, useMemo, useState } from 'react';
import { FiX, FiDollarSign, FiCalendar, FiCreditCard } from 'react-icons/fi';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../../context/user_context';

const INSTALLMENT_MODES = ['EMI', 'PRINCIPAL_INTEREST', 'FLAT_INTEREST'];

const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(amount || 0);

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Allocate received amount: interest first, then principal. */
const allocatePayment = (received, principalDue, interestDue) => {
    const r = parseFloat(received) || 0;
    const pDue = parseFloat(principalDue) || 0;
    const iDue = parseFloat(interestDue) || 0;
    const interestPaid = Math.min(r, iDue);
    const principalPaid = Math.min(Math.max(r - interestPaid, 0), pDue);
    return {
        principalPaid: round2(principalPaid),
        interestPaid: round2(interestPaid),
        totalDue: round2(pDue + iDue),
    };
};

const PersonalLoanLoanCollectionForm = ({ loan, onClose, onSuccess }) => {
    const { collectPayment, fetchReceivablesByLoan, fetchLedgerAccounts } = usePersonalLoanContext();
    const { user } = useUserContext();
    const [isLoading, setIsLoading] = useState(false);
    const [receivables, setReceivables] = useState([]);
    const [errors, setErrors] = useState({});
    const [ledgerAccounts, setLedgerAccounts] = useState([]);

    const isInstallmentMode = INSTALLMENT_MODES.includes(loan?.loan_mode);
    const isBulletMode = loan?.loan_mode === 'INTEREST_ONLY';

    const [formData, setFormData] = useState({
        receivableId: '',
        installmentNo: '',
        receivedAmount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: '',
        ledgerAccountId: '',
    });

    useEffect(() => {
        loadReceivables();
        loadLedgerAccounts();
    }, [loan]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadReceivables = async () => {
        const result = await fetchReceivablesByLoan(loan.id);
        if (result.success) {
            const pendingReceivables = result.data.filter((r) => r.status !== 'PAID' && parseFloat(r.due_amount) > 0);
            setReceivables(pendingReceivables);

            if (INSTALLMENT_MODES.includes(loan?.loan_mode)) {
                const firstInst = pendingReceivables
                    .map((r) => r.installment_no)
                    .filter((n) => n != null)
                    .sort((a, b) => a - b)[0];
                if (firstInst != null) {
                    setFormData((prev) => ({ ...prev, installmentNo: String(firstInst) }));
                }
            } else if (!isBulletMode && pendingReceivables.length > 0) {
                setFormData((prev) => ({ ...prev, receivableId: pendingReceivables[0].id }));
            }
        }
    };

    const loadLedgerAccounts = async () => {
        try {
            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            const res = await fetch(`${API_BASE_URL}/pl/ledger/accounts?parent_membership_id=${membershipId}`, {
                headers: { Authorization: `Bearer ${user.results.token}` },
            });
            const data = await res.json();
            if (data.results) setLedgerAccounts(data.results);
        } catch (error) {
            console.error('Error loading ledger accounts:', error);
        }
    };

    const bulletSummary = useMemo(() => {
        if (!isBulletMode) return null;
        const principalDue = round2(
            receivables
                .filter((r) => r.due_type === 'PRINCIPAL')
                .reduce((s, r) => s + (parseFloat(r.due_amount) || 0), 0)
        );
        const pendingInterest = round2(
            receivables
                .filter((r) => r.due_type === 'INTEREST')
                .reduce((s, r) => s + (parseFloat(r.due_amount) || 0), 0)
        );
        const rate = parseFloat(loan.interest_rate) || 0;
        const monthlyInterest = round2(principalDue * (rate / 100));
        // For tiny residual principal (< ₹1), do not force projected interest — just clear principal
        const isResidual = principalDue > 0 && principalDue < 1;
        const interestDue = isResidual
            ? pendingInterest
            : (pendingInterest > 0 ? pendingInterest : monthlyInterest);
        return {
            principalDue,
            interestDue,
            monthlyInterest,
            pendingInterest,
            rate,
            isResidual,
            closeAmount: round2(principalDue + interestDue),
        };
    }, [isBulletMode, receivables, loan]);

    const installments = useMemo(() => {
        if (!isInstallmentMode) return [];
        const map = new Map();
        receivables.forEach((r) => {
            if (r.installment_no == null) return;
            const key = r.installment_no;
            if (!map.has(key)) {
                map.set(key, {
                    installmentNo: key,
                    dueDate: r.due_date,
                    principalDue: 0,
                    interestDue: 0,
                    principalReceivableId: null,
                    interestReceivableId: null,
                });
            }
            const row = map.get(key);
            const amt = parseFloat(r.due_amount) || 0;
            if (r.due_type === 'PRINCIPAL') {
                row.principalDue += amt;
                row.principalReceivableId = r.id;
            } else if (r.due_type === 'INTEREST') {
                row.interestDue += amt;
                row.interestReceivableId = r.id;
            }
            if (r.due_date) row.dueDate = r.due_date;
        });
        return Array.from(map.values())
            .map((row) => ({
                ...row,
                totalDue: round2(row.principalDue + row.interestDue),
            }))
            .filter((row) => row.totalDue > 0)
            .sort((a, b) => a.installmentNo - b.installmentNo);
    }, [receivables, isInstallmentMode]);

    const selectedInstallment = installments.find(
        (i) => String(i.installmentNo) === String(formData.installmentNo)
    );
    const selectedReceivable = receivables.find((r) => r.id === formData.receivableId);

    const allocation = useMemo(() => {
        if (isBulletMode && bulletSummary) {
            return allocatePayment(
                formData.receivedAmount,
                bulletSummary.principalDue,
                bulletSummary.interestDue
            );
        }
        if (isInstallmentMode && selectedInstallment) {
            return allocatePayment(
                formData.receivedAmount,
                selectedInstallment.principalDue,
                selectedInstallment.interestDue
            );
        }
        if (selectedReceivable) {
            if (selectedReceivable.due_type === 'PRINCIPAL') {
                return allocatePayment(formData.receivedAmount, selectedReceivable.due_amount, 0);
            }
            return allocatePayment(formData.receivedAmount, 0, selectedReceivable.due_amount);
        }
        return { principalPaid: 0, interestPaid: 0, totalDue: 0 };
    }, [
        isBulletMode,
        bulletSummary,
        isInstallmentMode,
        selectedInstallment,
        selectedReceivable,
        formData.receivedAmount,
    ]);

    // Default received amount
    useEffect(() => {
        if (isBulletMode && bulletSummary) {
            // Residual leftover → default to full close; otherwise default to interest
            const defaultAmt = bulletSummary.isResidual || bulletSummary.principalDue < 1
                ? bulletSummary.closeAmount
                : bulletSummary.interestDue;
            setFormData((prev) => ({
                ...prev,
                receivedAmount: defaultAmt.toFixed(2),
            }));
        } else if (isInstallmentMode && selectedInstallment) {
            setFormData((prev) => ({
                ...prev,
                receivedAmount: selectedInstallment.totalDue.toFixed(2),
            }));
        } else if (!isBulletMode && !isInstallmentMode && selectedReceivable) {
            setFormData((prev) => ({
                ...prev,
                receivedAmount: parseFloat(selectedReceivable.due_amount).toFixed(2),
            }));
        }
    }, [
        isBulletMode,
        bulletSummary?.interestDue,
        bulletSummary?.closeAmount,
        bulletSummary?.isResidual,
        isInstallmentMode,
        formData.installmentNo,
        formData.receivableId,
        selectedInstallment?.totalDue,
        selectedReceivable?.id,
    ]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'paymentMode') updated.ledgerAccountId = value;
            return updated;
        });
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const maxReceivable = isBulletMode
        ? (bulletSummary?.closeAmount || 0)
        : isInstallmentMode
            ? (selectedInstallment?.totalDue || 0)
            : (selectedReceivable ? parseFloat(selectedReceivable.due_amount) : 0);

    const validate = () => {
        const newErrors = {};
        if (isInstallmentMode) {
            if (!formData.installmentNo) newErrors.installmentNo = 'Installment is required';
        } else if (!isBulletMode && !formData.receivableId) {
            newErrors.receivableId = 'Receivable is required';
        }
        if (!formData.receivedAmount || parseFloat(formData.receivedAmount) <= 0) {
            newErrors.receivedAmount = 'Valid received amount is required';
        }
        if (!formData.paymentDate) newErrors.paymentDate = 'Payment date is required';
        if (!formData.paymentMode) newErrors.paymentMode = 'Payment method (Ledger Account) is required';

        const received = parseFloat(formData.receivedAmount || 0);
        if (received > maxReceivable + 0.01) {
            newErrors.receivedAmount = `Amount cannot exceed ${maxReceivable.toFixed(2)} (principal + interest due)`;
        }

        const splitTotal = allocation.principalPaid + allocation.interestPaid;
        if (Math.abs(splitTotal - received) > 0.01 && received > 0) {
            newErrors.receivedAmount = 'Could not allocate payment across principal and interest';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            const selectedAccount = ledgerAccounts.find((a) => a.id === formData.paymentMode);
            const paymentModeName = selectedAccount ? selectedAccount.account_name : '';

            const payload = {
                loanId: loan.id,
                receivedAmount: formData.receivedAmount,
                principalPaid: allocation.principalPaid,
                interestPaid: allocation.interestPaid,
                paymentDate: formData.paymentDate,
                paymentMode: paymentModeName,
                pl_ledger_accounts_id: formData.paymentMode,
            };

            if (isBulletMode) {
                payload.bulletFlexible = true;
            } else if (isInstallmentMode) {
                payload.installmentNo = parseInt(formData.installmentNo, 10);
            } else {
                payload.receivableId = formData.receivableId;
            }

            const result = await collectPayment(payload);
            if (result.success) {
                await fetchLedgerAccounts();
                if (onSuccess) onSuccess(result.data);
                if (onClose) onClose();
            } else {
                setErrors({ submit: result.error || 'Failed to collect payment' });
            }
        } catch (error) {
            setErrors({ submit: error.message || 'An error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Collect Payment</h2>
                        {isBulletMode && (
                            <p className="text-sm text-gray-500 mt-0.5">
                                Bullet loan: interest first, then any extra reduces principal
                            </p>
                        )}
                        {isInstallmentMode && (
                            <p className="text-sm text-gray-500 mt-0.5">
                                EMI-style: collect Interest + Principal for the installment in one payment
                            </p>
                        )}
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {errors.submit}
                        </div>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Loan Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p className="text-gray-600">Subscriber:</p>
                                <p className="font-medium">{loan.subscriber?.pl_cust_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Mode:</p>
                                <p className="font-medium">{loan.loan_mode}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Outstanding Principal:</p>
                                <p className="font-medium text-red-600">
                                    {formatCurrency(
                                        isBulletMode
                                            ? bulletSummary?.principalDue
                                            : loan.outstanding_principal
                                    )}
                                </p>
                            </div>
                            {isBulletMode && bulletSummary ? (
                                <div>
                                    <p className="text-gray-600">Monthly interest ({bulletSummary.rate}%):</p>
                                    <p className="font-medium text-orange-600">
                                        {formatCurrency(bulletSummary.monthlyInterest)}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-gray-600">Outstanding Interest:</p>
                                    <p className="font-medium text-orange-600">
                                        {formatCurrency(loan.outstanding_interest)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {isBulletMode && bulletSummary && (
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 space-y-3 text-sm text-indigo-950">
                            <p className="font-semibold">Bullet collection rules</p>
                            {bulletSummary.isResidual && (
                                <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 text-xs">
                                    Only a small residual principal of {formatCurrency(bulletSummary.principalDue)} is left
                                    (likely rounding). Collect {formatCurrency(bulletSummary.closeAmount)} to close this loan.
                                </div>
                            )}
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Interest is settled first from the received amount.</li>
                                <li>Any leftover amount reduces outstanding principal.</li>
                                <li>Next month’s interest is calculated on the new principal.</li>
                                <li>
                                    To close now, collect{' '}
                                    <strong>{formatCurrency(bulletSummary.closeAmount)}</strong>
                                    {' '}(principal + interest due).
                                </li>
                            </ul>
                            <div className="grid grid-cols-3 gap-2 pt-1">
                                <div className="rounded-lg bg-white/80 p-2">
                                    <p className="text-xs text-gray-500">Interest due</p>
                                    <p className="font-bold text-orange-700">{formatCurrency(bulletSummary.interestDue)}</p>
                                </div>
                                <div className="rounded-lg bg-white/80 p-2">
                                    <p className="text-xs text-gray-500">Principal due</p>
                                    <p className="font-bold text-red-700">{formatCurrency(bulletSummary.principalDue)}</p>
                                </div>
                                <div className="rounded-lg bg-white/80 p-2">
                                    <p className="text-xs text-gray-500">Close amount</p>
                                    <p className="font-bold text-gray-900">{formatCurrency(bulletSummary.closeAmount)}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormData((p) => ({
                                        ...p,
                                        receivedAmount: bulletSummary.interestDue.toFixed(2),
                                    }))}
                                    className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100"
                                >
                                    Interest only
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData((p) => ({
                                        ...p,
                                        receivedAmount: bulletSummary.closeAmount.toFixed(2),
                                    }))}
                                    className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50"
                                >
                                    Close loan (P + I)
                                </button>
                            </div>
                        </div>
                    )}

                    {isInstallmentMode ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Installment (EMI due) *
                            </label>
                            <select
                                name="installmentNo"
                                value={formData.installmentNo}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                    errors.installmentNo ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Select Installment</option>
                                {installments.map((inst) => (
                                    <option key={inst.installmentNo} value={inst.installmentNo}>
                                        Inst. {inst.installmentNo}
                                        {inst.dueDate ? ` · Due ${new Date(inst.dueDate).toLocaleDateString('en-IN')}` : ''}
                                        {' — Total '}{formatCurrency(inst.totalDue)}
                                        {' (P '}{formatCurrency(inst.principalDue)}
                                        {' + I '}{formatCurrency(inst.interestDue)}{')'}
                                    </option>
                                ))}
                            </select>
                            {errors.installmentNo && (
                                <p className="mt-1 text-sm text-red-600">{errors.installmentNo}</p>
                            )}
                        </div>
                    ) : !isBulletMode ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Receivable *
                            </label>
                            <select
                                name="receivableId"
                                value={formData.receivableId}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                    errors.receivableId ? 'border-red-500' : 'border-gray-300'
                                }`}
                            >
                                <option value="">Select Receivable</option>
                                {receivables.map((receivable) => (
                                    <option key={receivable.id} value={receivable.id}>
                                        {receivable.due_type}
                                        {receivable.due_date ? ` · Due ${new Date(receivable.due_date).toLocaleDateString('en-IN')}` : ''}
                                        {' - '}{formatCurrency(receivable.due_amount)}
                                    </option>
                                ))}
                            </select>
                            {errors.receivableId && (
                                <p className="mt-1 text-sm text-red-600">{errors.receivableId}</p>
                            )}
                        </div>
                    ) : null}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiDollarSign className="inline w-4 h-4 mr-1" />
                            {isBulletMode
                                ? 'Received Amount (₹) *'
                                : isInstallmentMode
                                    ? 'Received Amount (Total EMI) (₹) *'
                                    : 'Received Amount (₹) *'}
                        </label>
                        <input
                            type="number"
                            name="receivedAmount"
                            value={formData.receivedAmount}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            max={maxReceivable || undefined}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.receivedAmount ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter amount received"
                        />
                        {errors.receivedAmount && (
                            <p className="mt-1 text-sm text-red-600">{errors.receivedAmount}</p>
                        )}
                        {isBulletMode && (
                            <p className="mt-1 text-xs text-gray-500">
                                Example: ₹50,000 with ₹1,000 interest due → ₹1,000 interest + ₹49,000 principal reduction.
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Payment Split (auto)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <div>
                                <p className="text-gray-500">Total Received</p>
                                <p className="font-semibold">{formatCurrency(formData.receivedAmount || 0)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">→ Interest</p>
                                <p className="font-semibold text-orange-700">{formatCurrency(allocation.interestPaid)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">→ Principal</p>
                                <p className="font-semibold text-blue-700">{formatCurrency(allocation.principalPaid)}</p>
                            </div>
                        </div>
                        {isBulletMode && allocation.principalPaid > 0 && bulletSummary && (
                            <p className="mt-3 text-xs text-gray-600">
                                After this payment, principal ≈{' '}
                                <strong>
                                    {formatCurrency(
                                        Math.max(0, bulletSummary.principalDue - allocation.principalPaid)
                                    )}
                                </strong>
                                ; next monthly interest ≈{' '}
                                <strong>
                                    {formatCurrency(
                                        round2(
                                            Math.max(0, bulletSummary.principalDue - allocation.principalPaid)
                                            * (bulletSummary.rate / 100)
                                        )
                                    )}
                                </strong>
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiCalendar className="inline w-4 h-4 mr-1" />
                            Payment Date *
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiCreditCard className="inline w-4 h-4 mr-1" />
                            Payment Method (Ledger Account) *
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
                                    {account.account_name} (Balance: ₹{parseFloat(account.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                </option>
                            ))}
                        </select>
                        {errors.paymentMode && (
                            <p className="mt-1 text-sm text-red-600">{errors.paymentMode}</p>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                        >
                            {isLoading ? 'Processing...' : 'Collect Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PersonalLoanLoanCollectionForm;
