import React, { useState } from 'react';
import { FiX, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi';

const VehicleFinanceLedgerEntryForm = ({ accounts, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        vf_ledger_accounts_id: '',
        category: '',
        subcategory: '',
        entryType: 'CREDIT',
        amount: '',
        description: '',
        payment_date: new Date().toISOString().split('T')[0],
        reference_id: '',
        reference_type: '',
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

        if (!formData.vf_ledger_accounts_id) {
            newErrors.vf_ledger_accounts_id = 'Payment method is required';
        }
        if (!formData.category || formData.category.trim() === '') {
            newErrors.category = 'Category is required';
        }
        if (!formData.entryType) {
            newErrors.entryType = 'Select Credit or Debit';
        }
        const amountValue = Math.abs(parseFloat(formData.amount));
        if (!formData.amount || !Number.isFinite(amountValue) || amountValue === 0) {
            newErrors.amount = 'Valid amount is required';
        }
        if (!formData.payment_date) {
            newErrors.payment_date = 'Payment date is required';
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
            const absoluteAmount = Math.abs(parseFloat(formData.amount));
            // Credit = positive (CR), Debit = negative (DB) — matches ledger table
            const signedAmount = formData.entryType === 'DEBIT'
                ? -absoluteAmount
                : absoluteAmount;

            const result = await onSuccess({
                vf_ledger_accounts_id: formData.vf_ledger_accounts_id,
                category: formData.category.trim(),
                subcategory: formData.subcategory.trim() || null,
                amount: signedAmount,
                description: formData.description.trim() || null,
                payment_date: formData.payment_date,
                reference_id: formData.reference_id.trim() || null,
                reference_type: formData.reference_type.trim() || null,
            });

            if (!result.success) {
                setErrors({ submit: result.error || 'Failed to create entry' });
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
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Create Ledger Entry</h2>
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

                    {/* Payment Method (Ledger Account) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method *
                        </label>
                        <select
                            name="vf_ledger_accounts_id"
                            value={formData.vf_ledger_accounts_id}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.vf_ledger_accounts_id ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Select Payment Method</option>
                            {accounts.map(account => (
                                <option key={account.id} value={account.id}>
                                    {account.account_name} (Balance: ₹{parseFloat(account.current_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                </option>
                            ))}
                        </select>
                        {errors.vf_ledger_accounts_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.vf_ledger_accounts_id}</p>
                        )}
                        {(!accounts || accounts.length === 0) && (
                            <p className="mt-1 text-xs text-amber-600">
                                No ledger accounts found. Create an account under Ledger first.
                            </p>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category *
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.category ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Select Category</option>
                            <option value="Expense">Expense</option>
                            <option value="Income">Income</option>
                            <option value="Transfer">Transfer</option>
                            <option value="Other">Other</option>
                        </select>
                        {errors.category && (
                            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                        )}
                    </div>

                    {/* Subcategory */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subcategory
                        </label>
                        <input
                            type="text"
                            name="subcategory"
                            value={formData.subcategory}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="e.g., Principal, Interest, Office Rent"
                        />
                    </div>

                    {/* Credit / Debit */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Entry Type *
                        </label>
                        <div className="flex flex-wrap gap-6">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="entryType"
                                    value="CREDIT"
                                    checked={formData.entryType === 'CREDIT'}
                                    onChange={handleChange}
                                    className="text-green-600 focus:ring-green-500"
                                />
                                <span className="text-sm font-medium text-green-700">Credit (CR)</span>
                            </label>
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="entryType"
                                    value="DEBIT"
                                    checked={formData.entryType === 'DEBIT'}
                                    onChange={handleChange}
                                    className="text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm font-medium text-red-700">Debit (DB)</span>
                            </label>
                        </div>
                        {errors.entryType && (
                            <p className="mt-1 text-sm text-red-600">{errors.entryType}</p>
                        )}
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiDollarSign className="inline w-4 h-4 mr-1" />
                            Amount (₹) *
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.amount ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter amount"
                        />
                        {errors.amount && (
                            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Enter a positive amount. Credit posts to CR; Debit posts to DB.
                        </p>
                    </div>

                    {/* Payment Date */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiCalendar className="inline w-4 h-4 mr-1" />
                            Payment Date *
                        </label>
                        <input
                            type="date"
                            name="payment_date"
                            value={formData.payment_date}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                                errors.payment_date ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.payment_date && (
                            <p className="mt-1 text-sm text-red-600">{errors.payment_date}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FiFileText className="inline w-4 h-4 mr-1" />
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Optional description for this entry"
                        />
                    </div>

                    {/* Reference (Optional) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reference Type
                            </label>
                            <select
                                name="reference_type"
                                value={formData.reference_type}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            >
                                <option value="">None</option>
                                <option value="loan_disbursement">Loan Disbursement</option>
                                <option value="collection">Collection</option>
                                <option value="receipt">Receipt</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reference ID
                            </label>
                            <input
                                type="text"
                                name="reference_id"
                                value={formData.reference_id}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="e.g., loan ID, receipt ID"
                            />
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
                            {isLoading ? 'Creating...' : 'Create Entry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehicleFinanceLedgerEntryForm;
