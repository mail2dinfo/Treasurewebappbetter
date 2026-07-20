import React, { useState, useEffect } from 'react';
import { FiX, FiDollarSign, FiCalendar, FiCreditCard } from 'react-icons/fi';
import { useVehicleFinanceContext } from '../../context/vehicleFinance/VehicleFinanceContext';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../../context/user_context';

const VehicleFinanceLoanCollectionForm = ({ loan, onClose, onSuccess }) => {
    const { collectPayment, fetchReceivablesByLoan, fetchLedgerAccounts } = useVehicleFinanceContext();
    const { user } = useUserContext();
    const [isLoading, setIsLoading] = useState(false);
    const [receivables, setReceivables] = useState([]);
    const [errors, setErrors] = useState({});
    const [ledgerAccounts, setLedgerAccounts] = useState([]);

    const [formData, setFormData] = useState({
        receivableId: '',
        receivedAmount: '',
        principalPaid: '',
        interestPaid: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: '', // Will be ledger account ID
        ledgerAccountId: '',
    });

    useEffect(() => {
        loadReceivables();
        loadLedgerAccounts();
    }, [loan]);

    const loadReceivables = async () => {
        const result = await fetchReceivablesByLoan(loan.id);
        if (result.success) {
            const pendingReceivables = result.data.filter((r) => !r.is_paid && String(r.status || '').toUpperCase() !== 'PAID');
            setReceivables(pendingReceivables);
            if (pendingReceivables.length > 0) {
                setFormData(prev => ({ ...prev, receivableId: pendingReceivables[0].id }));
            }
        }
    };

    const loadLedgerAccounts = async () => {
        try {
            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            const res = await fetch(`${API_BASE_URL}/vf/ledger/accounts?parent_membership_id=${membershipId}`, {
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                },
            });
            const data = await res.json();
            if (data.results) {
                setLedgerAccounts(data.results);
            }
        } catch (error) {
            console.error('Error loading ledger accounts:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = {
                ...prev,
                [name]: value
            };
            // If paymentMode (ledger account ID) changes, also update ledgerAccountId
            if (name === 'paymentMode') {
                updated.ledgerAccountId = value;
                // Store the account name for paymentMode display
                const selectedAccount = ledgerAccounts.find(a => a.id === value);
                if (selectedAccount) {
                    // We'll use the account name when submitting
                }
            }
            return updated;
        });
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const selectedReceivable = receivables.find(r => r.id === formData.receivableId);

    // Auto-calculate principal and interest based on receivable type
    useEffect(() => {
        if (selectedReceivable && formData.receivedAmount) {
            const received = parseFloat(formData.receivedAmount) || 0;
            if (selectedReceivable.due_type === 'PRINCIPAL') {
                setFormData(prev => ({
                    ...prev,
                    principalPaid: received.toFixed(2),
                    interestPaid: '0'
                }));
            } else if (selectedReceivable.due_type === 'INTEREST') {
                setFormData(prev => ({
                    ...prev,
                    principalPaid: '0',
                    interestPaid: received.toFixed(2)
                }));
            }
        }
    }, [selectedReceivable, formData.receivedAmount]);

    const validate = () => {
        const newErrors = {};

        if (!formData.receivableId) {
            newErrors.receivableId = 'Receivable is required';
        }
        if (!formData.receivedAmount || parseFloat(formData.receivedAmount) <= 0) {
            newErrors.receivedAmount = 'Valid received amount is required';
        }
        if (!formData.paymentDate) {
            newErrors.paymentDate = 'Payment date is required';
        }
        if (!formData.paymentMode) {
            newErrors.paymentMode = 'Payment method (Ledger Account) is required';
        }

        // Validate amount doesn't exceed receivable
        if (selectedReceivable && formData.receivedAmount) {
            const received = parseFloat(formData.receivedAmount);
            const due = parseFloat(selectedReceivable.due_amount);
            if (received > due) {
                newErrors.receivedAmount = `Amount cannot exceed receivable amount (${due.toFixed(2)})`;
            }
        }

        // Validate principal + interest = received
        const principal = parseFloat(formData.principalPaid || 0);
        const interest = parseFloat(formData.interestPaid || 0);
        const received = parseFloat(formData.receivedAmount || 0);
        if (Math.abs(principal + interest - received) > 0.01) {
            newErrors.principalPaid = 'Principal + Interest must equal received amount';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        setIsLoading(true);

        try {
            // Get the selected ledger account name for paymentMode
            const selectedAccount = ledgerAccounts.find(a => a.id === formData.paymentMode);
            const paymentModeName = selectedAccount ? selectedAccount.account_name : '';

            const result = await collectPayment({
                loanId: loan.id,
                receivableId: formData.receivableId,
                receivedAmount: formData.receivedAmount,
                principalPaid: formData.principalPaid || 0,
                interestPaid: formData.interestPaid || 0,
                paymentDate: formData.paymentDate,
                paymentMode: paymentModeName, // Store the ledger account name
                vf_ledger_accounts_id: formData.paymentMode, // Store the ledger account ID
            });

            if (result.success) {
                const paymentType = result.data?.paymentType;
                const remainingAmount = result.data?.remainingAmount;
                if (paymentType === 'partial' && remainingAmount > 0) {
                    alert(
                        `Partial payment collected! Remaining ₹${Number(remainingAmount).toLocaleString('en-IN')} stays pending. Ledger entry recorded.`
                    );
                } else {
                    alert('Full payment collected! Receivable closed and ledger entry recorded.');
                }
                // Refresh ledger accounts to update balances
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Collect Payment</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Error Message */}
                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {errors.submit}
                        </div>
                    )}

                    {/* Loan Info */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Loan Information</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p className="text-gray-600">Subscriber:</p>
                                <p className="font-medium">{loan.subscriber?.vf_cust_name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Principal:</p>
                                <p className="font-medium">{formatCurrency(loan.loan_amount ?? loan.principal_amount)}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Outstanding Principal:</p>
                                <p className="font-medium text-red-600">{formatCurrency(loan.outstanding_principal)}</p>
                            </div>
                            {loan.loan_mode === 'INTEREST_ONLY' && (
                                <div>
                                    <p className="text-gray-600">Outstanding Interest:</p>
                                    <p className="font-medium text-orange-600">{formatCurrency(loan.outstanding_interest)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Receivable Selection */}
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
                            {receivables.map(receivable => (
                                <option key={receivable.id} value={receivable.id}>
                                    {receivable.due_type} - {formatCurrency(receivable.due_amount)} 
                                    {receivable.due_date && ` (Due: ${new Date(receivable.due_date).toLocaleDateString()})`}
                                </option>
                            ))}
                        </select>
                        {errors.receivableId && (
                            <p className="mt-1 text-sm text-red-600">{errors.receivableId}</p>
                        )}
                        {selectedReceivable && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm">
                                    <strong>Type:</strong> {selectedReceivable.due_type} | 
                                    <strong> Due Amount:</strong> {formatCurrency(selectedReceivable.due_amount)} |
                                    <strong> Status:</strong> {selectedReceivable.status}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Received Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiDollarSign className="inline w-4 h-4 mr-1" />
                            Received Amount (₹) *
                        </label>
                        <input
                            type="number"
                            name="receivedAmount"
                            value={formData.receivedAmount}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            max={selectedReceivable ? selectedReceivable.due_amount : undefined}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.receivedAmount ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter amount received"
                        />
                        {errors.receivedAmount && (
                            <p className="mt-1 text-sm text-red-600">{errors.receivedAmount}</p>
                        )}
                    </div>

                    {/* Principal Paid */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Principal Paid (₹)
                        </label>
                        <input
                            type="number"
                            name="principalPaid"
                            value={formData.principalPaid}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.principalPaid ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Principal portion"
                        />
                        {errors.principalPaid && (
                            <p className="mt-1 text-sm text-red-600">{errors.principalPaid}</p>
                        )}
                    </div>

                    {/* Interest Paid */}
                    {loan.loan_mode === 'INTEREST_ONLY' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Interest Paid (₹)
                            </label>
                            <input
                                type="number"
                                name="interestPaid"
                                value={formData.interestPaid}
                                onChange={handleChange}
                                step="0.01"
                                min="0"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="Interest portion"
                            />
                        </div>
                    )}

                    {/* Payment Date */}
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

                    {/* Payment Method (Ledger Account) */}
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
                            {ledgerAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.account_name} (Balance: ₹{parseFloat(account.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                </option>
                            ))}
                        </select>
                        {errors.paymentMode && (
                            <p className="mt-1 text-sm text-red-600">{errors.paymentMode}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Select the ledger account where the payment will be deposited. Only accounts created by you are shown.
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Payment Summary</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Total Received:</strong> {formatCurrency(formData.receivedAmount || 0)}</p>
                            <p><strong>Principal Paid:</strong> {formatCurrency(formData.principalPaid || 0)}</p>
                            {loan.loan_mode === 'INTEREST_ONLY' && (
                                <p><strong>Interest Paid:</strong> {formatCurrency(formData.interestPaid || 0)}</p>
                            )}
                            <p><strong>Payment Method:</strong> {ledgerAccounts.find(a => a.id === formData.paymentMode)?.account_name || 'Not selected'}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Processing...' : 'Collect Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehicleFinanceLoanCollectionForm;
