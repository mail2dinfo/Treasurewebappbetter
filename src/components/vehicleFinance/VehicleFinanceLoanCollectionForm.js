import React, { useState, useEffect, useCallback } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FiX, FiCheck, FiDownload } from 'react-icons/fi';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../../context/user_context';
import VehicleFinanceCollectionReceiptPDF from './PDF/VehicleFinanceCollectionReceiptPDF';

/**
 * Same auth resolution as VehicleFinanceCollectionsPage so Loans collect
 * uses the identical API path that already works on /collections.
 */
const VehicleFinanceLoanCollectionForm = ({ loan, onClose, onSuccess }) => {
    const { user } = useUserContext();
    const token = user?.results?.token;
    const membershipId =
        user?.userAccounts?.[0]?.parent_membership_id
        || user?.results?.userAccounts?.[0]?.parent_membership_id
        || null;

    const [isLoading, setIsLoading] = useState(false);
    const [isDownloadingBill, setIsDownloadingBill] = useState(false);
    const [receivables, setReceivables] = useState([]);
    const [ledgerAccounts, setLedgerAccounts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [errors, setErrors] = useState({});
    const [receiptData, setReceiptData] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);

    const [formData, setFormData] = useState({
        receivableId: '',
        amount: '',
        paymentMethod: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const companyData = companies[0] || null;
    const selectedReceivable = receivables.find((r) => r.id === formData.receivableId);

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);

    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const loadReceivables = useCallback(async () => {
        if (!token || !membershipId || !loan?.id) return;
        try {
            const res = await fetch(
                `${API_BASE_URL}/vf/receivables/loan/${loan.id}?parent_membership_id=${membershipId}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || 'Failed to load receivables');
            }
            const list = Array.isArray(data.results) ? data.results : [];
            const pendingReceivables = list.filter(
                (r) => !r.is_paid && String(r.status || '').toUpperCase() !== 'PAID'
            );
            setReceivables(pendingReceivables);
            if (pendingReceivables.length > 0) {
                const first = pendingReceivables[0];
                setFormData((prev) => ({
                    ...prev,
                    receivableId: first.id,
                    amount: first.due_amount || first.amount || '',
                }));
            }
        } catch (error) {
            console.error('Error loading receivables:', error);
            setErrors((prev) => ({
                ...prev,
                submit: error.message || 'Failed to load receivables',
            }));
        }
    }, [token, membershipId, loan?.id]);

    const loadLedgerAccounts = useCallback(async () => {
        if (!token || !membershipId) return;
        try {
            const res = await fetch(
                `${API_BASE_URL}/vf/ledger/accounts?parent_membership_id=${membershipId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json().catch(() => ({}));
            if (data.results) setLedgerAccounts(data.results);
        } catch (error) {
            console.error('Error loading ledger accounts:', error);
        }
    }, [token, membershipId]);

    const loadCompanies = useCallback(async () => {
        if (!token || !membershipId) return;
        try {
            const res = await fetch(
                `${API_BASE_URL}/vf/companies?parent_membership_id=${membershipId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.ok) {
                const data = await res.json();
                setCompanies(data.results || []);
            }
        } catch (error) {
            console.error('Error loading companies:', error);
        }
    }, [token, membershipId]);

    useEffect(() => {
        loadReceivables();
        loadLedgerAccounts();
        loadCompanies();
    }, [loadReceivables, loadLedgerAccounts, loadCompanies]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === 'receivableId') {
                const receivable = receivables.find((r) => r.id === value);
                if (receivable) {
                    updated.amount = receivable.due_amount || receivable.amount || '';
                }
            }
            return updated;
        });
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.receivableId) {
            newErrors.receivableId = 'Please select a receivable';
        }
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            newErrors.amount = 'Please enter the amount';
        }
        if (!formData.paymentMethod) {
            newErrors.paymentMethod = 'Choose the payment method';
        }
        if (selectedReceivable && formData.amount) {
            const received = parseFloat(formData.amount);
            const due = parseFloat(selectedReceivable.due_amount || selectedReceivable.amount || 0);
            if (received > due) {
                newErrors.amount = `Amount cannot exceed due amount (${due.toFixed(2)})`;
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleClose = () => {
        if (receiptData && typeof onSuccess === 'function') {
            onSuccess(receiptData);
        }
        if (typeof onClose === 'function') {
            onClose();
        }
    };

    // Validate then show confirmation (do not pay yet)
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        if (!token || !membershipId) {
            setErrors({ submit: 'Authentication or membership not found. Please sign in again.' });
            return;
        }
        setErrors({});
        setIsConfirming(true);
    };

    // Confirmed — collect payment (same request as Collections)
    const handleConfirmPayment = async () => {
        if (!token || !membershipId) {
            setErrors({ submit: 'Authentication or membership not found. Please sign in again.' });
            setIsConfirming(false);
            return;
        }

        setIsLoading(true);
        setErrors({});
        try {
            const payload = {
                receivableId: formData.receivableId,
                amount: parseFloat(formData.amount),
                paymentMethod: formData.paymentMethod,
                paymentDate: formData.paymentDate,
                notes: formData.notes || '',
                membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/vf/collections/pay`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const result = await res.json();
                const paymentType = result.results?.paymentType;
                const remainingAmount = Number(result.results?.remainingAmount || 0);
                const receipt = result.results?.receipt || {};
                const subscriber = loan.subscriber || {};
                const amountPaid = parseFloat(formData.amount);
                const dueAmountBefore = parseFloat(
                    selectedReceivable?.due_amount || selectedReceivable?.amount || 0
                );
                const closingBefore = parseFloat(loan.closing_balance ?? loan.total_outstanding ?? 0);
                const vehicleParts = [loan.vehicle_make, loan.vehicle_model].filter(Boolean);
                const vehicleLabel =
                    vehicleParts.join(' ')
                    || loan.product?.product_name
                    || loan.vehicle_type
                    || 'Vehicle Finance';

                setIsConfirming(false);
                setReceiptData({
                    billNumber: receipt.bill_number ?? receipt.billNumber ?? receipt.id,
                    receiptId: receipt.id,
                    subscriberName:
                        subscriber.vf_cust_name
                        || subscriber.name
                        || subscriber.firstname
                        || 'Subscriber',
                    subscriberPhone: subscriber.vf_cust_phone || subscriber.phone || '',
                    vehicleLabel,
                    vehicleNumber: loan.vehicle_number || '',
                    loanAmount: loan.loan_amount ?? loan.principal_amount,
                    interestAmount: loan.interest_amount,
                    totalRepayAmount: loan.total_repay_amount,
                    repaymentMode: loan.repayment_mode || loan.tenure_mode || '',
                    disbursedDate: formatDisplayDate(loan.loan_disbursement_date || loan.disbursed_date),
                    outstandingAfter: Math.max(0, closingBefore - amountPaid),
                    dueDate: formatDisplayDate(selectedReceivable?.due_date),
                    dueAmount: dueAmountBefore,
                    amountPaid,
                    paymentType: paymentType === 'partial' ? 'Partial' : 'Full',
                    paymentMethod: formData.paymentMethod,
                    paymentDate: formData.paymentDate,
                    paymentDateFormatted: formatDisplayDate(formData.paymentDate),
                    remainingAmount,
                    notes: formData.notes || '',
                });

                window.dispatchEvent(new CustomEvent('vfCollectionPaid', {
                    detail: { paymentType, remainingAmount },
                }));
            } else {
                const errBody = await res.json().catch(() => ({}));
                throw new Error(errBody.message || 'Payment failed');
            }
        } catch (error) {
            setIsConfirming(false);
            setErrors({
                submit: error?.message || 'Payment failed',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {receiptData ? (
                    <div className="p-6 space-y-5">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                                <FiCheck className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Payment Successful!</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {receiptData.paymentType === 'Partial'
                                    ? `Partial payment collected. Remaining: ${formatCurrency(receiptData.remainingAmount)}`
                                    : 'Full payment collected and receivable closed.'}
                            </p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Bill No</span>
                                <span className="font-semibold text-right">{receiptData.billNumber}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Subscriber</span>
                                <span className="font-semibold text-right">{receiptData.subscriberName}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Vehicle / Loan</span>
                                <span className="font-semibold text-right">{receiptData.vehicleLabel}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Due Date</span>
                                <span className="font-semibold">{receiptData.dueDate}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Due Amount</span>
                                <span className="font-semibold">{formatCurrency(receiptData.dueAmount)}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Amount Paid</span>
                                <span className="font-semibold text-green-700">{formatCurrency(receiptData.amountPaid)}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Payment Method</span>
                                <span className="font-semibold">{receiptData.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Payment Date</span>
                                <span className="font-semibold">{receiptData.paymentDateFormatted}</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <PDFDownloadLink
                                key={`vf-loan-bill-${receiptData.billNumber}`}
                                document={
                                    <VehicleFinanceCollectionReceiptPDF
                                        receiptData={receiptData}
                                        companyData={companyData}
                                    />
                                }
                                fileName={`VF-Receipt-${receiptData.subscriberName || 'bill'}-${Date.now()}.pdf`}
                                className="flex-1"
                                onClick={() => {
                                    setIsDownloadingBill(true);
                                    setTimeout(() => setIsDownloadingBill(false), 2500);
                                }}
                            >
                                {({ loading: pdfLoading }) => (
                                    <button
                                        type="button"
                                        className="w-full py-2.5 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FiDownload className="w-4 h-4" />
                                        {pdfLoading || isDownloadingBill ? 'Preparing Bill...' : 'Download Bill'}
                                    </button>
                                )}
                            </PDFDownloadLink>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 py-2.5 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <FiX className="w-4 h-4" />
                                Close
                            </button>
                        </div>
                    </div>
                ) : isConfirming ? (
                    <div className="p-6 space-y-5">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-800">Confirm Payment</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Please review the details before collecting payment.
                            </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Subscriber</span>
                                <span className="font-semibold text-right">
                                    {loan.subscriber?.vf_cust_name || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Due Date</span>
                                <span className="font-semibold">
                                    {formatDisplayDate(selectedReceivable?.due_date)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Due Amount</span>
                                <span className="font-semibold">
                                    {formatCurrency(selectedReceivable?.due_amount || selectedReceivable?.amount)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Amount to Collect</span>
                                <span className="font-semibold text-green-700">
                                    {formatCurrency(formData.amount)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Payment Method</span>
                                <span className="font-semibold">{formData.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                                <span className="text-gray-600">Payment Date</span>
                                <span className="font-semibold">
                                    {formatDisplayDate(formData.paymentDate)}
                                </span>
                            </div>
                            {formData.notes ? (
                                <div className="flex justify-between gap-3">
                                    <span className="text-gray-600">Notes</span>
                                    <span className="font-semibold text-right">{formData.notes}</span>
                                </div>
                            ) : null}
                        </div>

                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {errors.submit}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsConfirming(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                disabled={isLoading}
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmPayment}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <FiCheck className="w-4 h-4" />
                                {isLoading ? 'Collecting...' : 'Confirm & Collect'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">Collect Payment</h2>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {errors.submit && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {errors.submit}
                                </div>
                            )}

                            <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="text-sm text-blue-800">
                                    <strong>Subscriber:</strong> {loan.subscriber?.vf_cust_name || 'N/A'}
                                </div>
                                <div className="text-sm text-blue-800 mt-1">
                                    <strong>Outstanding:</strong>{' '}
                                    {formatCurrency(loan.closing_balance ?? loan.total_outstanding)}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                    Enter less than due for partial payment. Full payment closes the receivable.
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Receivable
                                </label>
                                <select
                                    name="receivableId"
                                    value={formData.receivableId}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.receivableId ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select Receivable</option>
                                    {receivables.map((receivable) => (
                                        <option key={receivable.id} value={receivable.id}>
                                            {formatCurrency(receivable.due_amount || receivable.amount)}
                                            {receivable.due_date
                                                ? ` · Due ${new Date(receivable.due_date).toLocaleDateString('en-GB')}`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.receivableId && (
                                    <p className="mt-1 text-sm text-red-600">{errors.receivableId}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    step="0.01"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.amount ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                />
                                {errors.amount && (
                                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <select
                                    name="paymentMethod"
                                    value={formData.paymentMethod}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                        errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select Payment Method</option>
                                    {ledgerAccounts.map((account) => (
                                        <option key={account.id} value={account.account_name}>
                                            {account.account_name} (Balance: ₹
                                            {Number(account.current_balance || 0).toLocaleString('en-IN')})
                                        </option>
                                    ))}
                                </select>
                                {ledgerAccounts.length === 0 && (
                                    <p className="mt-1 text-xs text-amber-600">
                                        No ledger accounts found. Create an account under Ledger first.
                                    </p>
                                )}
                                {errors.paymentMethod && (
                                    <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Date
                                </label>
                                <input
                                    type="date"
                                    name="paymentDate"
                                    value={formData.paymentDate}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    placeholder="Optional notes"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                                >
                                    {isLoading ? 'Collecting...' : 'Collect Payment'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default VehicleFinanceLoanCollectionForm;
