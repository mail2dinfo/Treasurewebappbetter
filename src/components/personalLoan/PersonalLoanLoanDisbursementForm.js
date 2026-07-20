import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiDollarSign, FiCalendar, FiPercent, FiInfo } from 'react-icons/fi';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';

const PersonalLoanLoanDisbursementForm = ({ onClose, onSuccess }) => {
    const { subscribers, disburseLoan, fetchSubscribers, ledgerAccounts, fetchLedgerAccounts } = usePersonalLoanContext();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        subscriberId: '',
        loanMode: 'INTEREST_FREE',
        principalAmount: '',
        interestRate: '',
        interestDueDay: '',
        disbursedDate: new Date().toISOString().split('T')[0],
        ledgerAccountId: '',
    });

    useEffect(() => {
        if (subscribers.length === 0) {
            fetchSubscribers();
        }
        if (ledgerAccounts.length === 0) {
            fetchLedgerAccounts();
        }
    }, [subscribers.length, fetchSubscribers, ledgerAccounts.length, fetchLedgerAccounts]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.subscriberId) {
            newErrors.subscriberId = 'Subscriber is required';
        }
        if (!formData.principalAmount || parseFloat(formData.principalAmount) <= 0) {
            newErrors.principalAmount = 'Valid principal amount is required';
        }
        if (!formData.disbursedDate) {
            newErrors.disbursedDate = 'Disbursement date is required';
        }
        if (!formData.ledgerAccountId) {
            newErrors.ledgerAccountId = 'Ledger account is required';
        }

        if (formData.loanMode === 'INTEREST_ONLY') {
            if (!formData.interestRate || parseFloat(formData.interestRate) <= 0) {
                newErrors.interestRate = 'Interest rate is required for INTEREST_ONLY mode';
            }
            if (!formData.interestDueDay || parseInt(formData.interestDueDay) < 1 || parseInt(formData.interestDueDay) > 31) {
                newErrors.interestDueDay = 'Valid interest due day (1-31) is required';
            }
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
            const result = await disburseLoan({
                subscriberId: formData.subscriberId,
                loanMode: formData.loanMode,
                principalAmount: formData.principalAmount,
                interestRate: formData.loanMode === 'INTEREST_ONLY' ? formData.interestRate : null,
                interestDueDay: formData.loanMode === 'INTEREST_ONLY' ? formData.interestDueDay : null,
                disbursedDate: formData.disbursedDate,
                pl_ledger_accounts_id: formData.ledgerAccountId,
            });

            if (result.success) {
                // Refresh ledger accounts to update balances
                await fetchLedgerAccounts();
                if (onSuccess) onSuccess(result.data);
                if (onClose) onClose();
            } else {
                setErrors({ submit: result.error || 'Failed to disburse loan' });
            }
        } catch (error) {
            setErrors({ submit: error.message || 'An error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    const selectedSubscriber = subscribers.find(s => s.pl_cust_id === formData.subscriberId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Disburse New Loan</h2>
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

                    {/* Subscriber Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiUser className="inline w-4 h-4 mr-1" />
                            Subscriber *
                        </label>
                        <select
                            name="subscriberId"
                            value={formData.subscriberId}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.subscriberId ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Select Subscriber</option>
                            {subscribers.map(subscriber => (
                                <option key={subscriber.pl_cust_id} value={subscriber.pl_cust_id}>
                                    {subscriber.pl_cust_name} - {subscriber.pl_cust_phone}
                                </option>
                            ))}
                        </select>
                        {errors.subscriberId && (
                            <p className="mt-1 text-sm text-red-600">{errors.subscriberId}</p>
                        )}
                        {selectedSubscriber && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <strong>Phone:</strong> {selectedSubscriber.pl_cust_phone}
                                </p>
                                {selectedSubscriber.pl_cust_address && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        <strong>Address:</strong> {selectedSubscriber.pl_cust_address}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Loan Mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiInfo className="inline w-4 h-4 mr-1" />
                            Loan Mode *
                        </label>
                        <select
                            name="loanMode"
                            value={formData.loanMode}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        >
                            <option value="INTEREST_FREE">Interest-Free Loan</option>
                            <option value="INTEREST_ONLY">Interest-Only Loan</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            {formData.loanMode === 'INTEREST_FREE' 
                                ? 'No interest will be charged on this loan'
                                : 'Interest will be calculated monthly on outstanding principal'}
                        </p>
                    </div>

                    {/* Principal Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiDollarSign className="inline w-4 h-4 mr-1" />
                            Principal Amount (₹) *
                        </label>
                        <input
                            type="number"
                            name="principalAmount"
                            value={formData.principalAmount}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.principalAmount ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter loan amount"
                        />
                        {errors.principalAmount && (
                            <p className="mt-1 text-sm text-red-600">{errors.principalAmount}</p>
                        )}
                    </div>

                    {/* Interest Rate (Mode-2 only) */}
                    {formData.loanMode === 'INTEREST_ONLY' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FiPercent className="inline w-4 h-4 mr-1" />
                                    Monthly Interest Rate (%) *
                                </label>
                                <input
                                    type="number"
                                    name="interestRate"
                                    value={formData.interestRate}
                                    onChange={handleChange}
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                        errors.interestRate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="e.g., 2.5"
                                />
                                {errors.interestRate && (
                                    <p className="mt-1 text-sm text-red-600">{errors.interestRate}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FiCalendar className="inline w-4 h-4 mr-1" />
                                    Interest Due Day (1-31) *
                                </label>
                                <input
                                    type="number"
                                    name="interestDueDay"
                                    value={formData.interestDueDay}
                                    onChange={handleChange}
                                    min="1"
                                    max="31"
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                        errors.interestDueDay ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="e.g., 15 (15th of each month)"
                                />
                                {errors.interestDueDay && (
                                    <p className="mt-1 text-sm text-red-600">{errors.interestDueDay}</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Disbursement Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiCalendar className="inline w-4 h-4 mr-1" />
                            Disbursement Date *
                        </label>
                        <input
                            type="date"
                            name="disbursedDate"
                            value={formData.disbursedDate}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.disbursedDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.disbursedDate && (
                            <p className="mt-1 text-sm text-red-600">{errors.disbursedDate}</p>
                        )}
                    </div>

                    {/* Ledger Account Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiDollarSign className="inline w-4 h-4 mr-1" />
                            Ledger Account (Disbursement Source) *
                        </label>
                        <select
                            name="ledgerAccountId"
                            value={formData.ledgerAccountId}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.ledgerAccountId ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Select Ledger Account</option>
                            {ledgerAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.account_name} (Balance: ₹{parseFloat(account.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                </option>
                            ))}
                        </select>
                        {errors.ledgerAccountId && (
                            <p className="mt-1 text-sm text-red-600">{errors.ledgerAccountId}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Select the account from which the loan amount will be disbursed
                        </p>
                    </div>

                    {/* Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">Loan Summary</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Subscriber:</strong> {selectedSubscriber?.pl_cust_name || 'Not selected'}</p>
                            <p><strong>Mode:</strong> {formData.loanMode === 'INTEREST_FREE' ? 'Interest-Free' : 'Interest-Only'}</p>
                            <p><strong>Principal:</strong> ₹{formData.principalAmount || '0'}</p>
                            {formData.loanMode === 'INTEREST_ONLY' && (
                                <>
                                    <p><strong>Interest Rate:</strong> {formData.interestRate || '0'}% per month</p>
                                    <p><strong>Interest Due Day:</strong> {formData.interestDueDay || 'Not set'}</p>
                                </>
                            )}
                            <p><strong>Disbursement Date:</strong> {formData.disbursedDate || 'Not set'}</p>
                            <p><strong>Disbursement Account:</strong> {ledgerAccounts.find(a => a.id === formData.ledgerAccountId)?.account_name || 'Not selected'}</p>
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
                            className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Disbursing...' : 'Disburse Loan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PersonalLoanLoanDisbursementForm;
