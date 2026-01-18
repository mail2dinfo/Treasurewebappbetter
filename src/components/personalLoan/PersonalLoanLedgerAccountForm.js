import React, { useState } from 'react';
import { FiX, FiDollarSign } from 'react-icons/fi';

const PersonalLoanLedgerAccountForm = ({ onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        account_name: '',
        opening_balance: '0',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.account_name || formData.account_name.trim() === '') {
            newErrors.account_name = 'Account name is required';
        }

        if (formData.opening_balance === '' || isNaN(parseFloat(formData.opening_balance))) {
            newErrors.opening_balance = 'Valid opening balance is required';
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
            const result = await onSuccess({
                account_name: formData.account_name.trim(),
                opening_balance: parseFloat(formData.opening_balance),
            });

            if (!result.success) {
                setErrors({ submit: result.error || 'Failed to create account' });
            } else {
                if (onClose) onClose();
            }
        } catch (error) {
            setErrors({ submit: error.message || 'An error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Create Ledger Account</h2>
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

                    {/* Account Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account Name *
                        </label>
                        <input
                            type="text"
                            name="account_name"
                            value={formData.account_name}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.account_name ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="e.g., Cash, Bank Account, UPI"
                        />
                        {errors.account_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.account_name}</p>
                        )}
                    </div>

                    {/* Opening Balance */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiDollarSign className="inline w-4 h-4 mr-1" />
                            Opening Balance (₹) *
                        </label>
                        <input
                            type="number"
                            name="opening_balance"
                            value={formData.opening_balance}
                            onChange={handleChange}
                            step="0.01"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.opening_balance ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="0.00"
                        />
                        {errors.opening_balance && (
                            <p className="mt-1 text-sm text-red-600">{errors.opening_balance}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Initial balance when the account is created
                        </p>
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
                            {isLoading ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PersonalLoanLedgerAccountForm;
