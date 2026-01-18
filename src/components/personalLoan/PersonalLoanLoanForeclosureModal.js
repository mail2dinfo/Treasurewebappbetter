import React, { useState, useEffect } from 'react';
import { FiX, FiAlertTriangle, FiDollarSign, FiCalendar, FiCreditCard } from 'react-icons/fi';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';

const PersonalLoanLoanForeclosureModal = ({ loan, onClose, onSuccess }) => {
    const { forecloseLoan, fetchLedgerAccounts } = usePersonalLoanContext();
    const { user } = useUserContext();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [ledgerAccounts, setLedgerAccounts] = useState([]);
    const [formData, setFormData] = useState({
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: '', // Will be ledger account ID
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadLedgerAccounts();
    }, []);

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
        } catch (error) {
            console.error('Error loading ledger accounts:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        }).format(amount || 0);
    };

    const totalOutstanding = (parseFloat(loan.outstanding_principal || 0) + parseFloat(loan.outstanding_interest || 0));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
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

    const handleForeclose = async () => {
        if (!validate()) {
            return;
        }

        if (!window.confirm(`Are you sure you want to foreclose this loan? This will mark all outstanding receivables as paid.`)) {
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Get the selected ledger account name for paymentMode
            const selectedAccount = ledgerAccounts.find(a => a.id === formData.paymentMode);
            const paymentModeName = selectedAccount ? selectedAccount.account_name : '';

            const result = await forecloseLoan({
                loanId: loan.id,
                paymentDate: formData.paymentDate,
                paymentMode: paymentModeName,
                pl_ledger_accounts_id: formData.paymentMode,
            });

            if (result.success) {
                // Refresh ledger accounts to update balances
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
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <FiAlertTriangle className="w-6 h-6 text-red-600 mr-2" />
                        <h2 className="text-2xl font-bold text-gray-900">Foreclose Loan</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <p className="text-gray-700 mb-4">
                            This action will foreclose the loan and mark all outstanding receivables as paid. 
                            This cannot be undone.
                        </p>

                        {/* Loan Info */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Loan Details</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subscriber:</span>
                                    <span className="font-medium">{loan.subscriber?.pl_cust_name || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Principal Amount:</span>
                                    <span className="font-medium">{formatCurrency(loan.principal_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Outstanding Principal:</span>
                                    <span className="font-medium text-red-600">{formatCurrency(loan.outstanding_principal)}</span>
                                </div>
                                {loan.loan_mode === 'INTEREST_ONLY' && loan.outstanding_interest > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Outstanding Interest:</span>
                                        <span className="font-medium text-orange-600">{formatCurrency(loan.outstanding_interest)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-gray-200">
                                    <span className="text-gray-900 font-semibold">Total Outstanding:</span>
                                    <span className="text-red-600 font-bold text-lg">{formatCurrency(totalOutstanding)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Note:</strong> After foreclosure, the loan status will be changed to FORECLOSED 
                                and all pending receivables will be marked as PAID.
                            </p>
                        </div>
                    </div>

                    {/* Payment Date */}
                    <div className="mb-4">
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
                    <div className="mb-4">
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
                            Select the ledger account where the foreclosure payment will be deposited. Only accounts created by you are shown.
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Foreclosure Summary</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Total Outstanding:</strong> {formatCurrency(totalOutstanding)}</p>
                            <p><strong>Payment Date:</strong> {new Date(formData.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            <p><strong>Payment Method:</strong> {ledgerAccounts.find(a => a.id === formData.paymentMode)?.account_name || 'Not selected'}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleForeclose}
                            disabled={isLoading || totalOutstanding <= 0}
                            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                'Processing...'
                            ) : (
                                <>
                                    <FiDollarSign className="w-5 h-5 mr-2" />
                                    Foreclose Loan
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
