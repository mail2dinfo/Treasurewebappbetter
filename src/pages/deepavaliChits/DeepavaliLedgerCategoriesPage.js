import React, { useState } from 'react';
import { FiPlus, FiTag } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';

const DeepavaliLedgerCategoriesPage = ({ embedded = false }) => {
    const { categories, saveCategory, loading } = useDeepavali();
    const [name, setName] = useState('');
    const [type, setType] = useState('ASSET');
    const [saving, setSaving] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Enter a category name');
            return;
        }
        setSaving(true);
        try {
            await saveCategory({ category_name: name.trim(), category_type: type });
            toast.success('Category added');
            setName('');
            setType('ASSET');
        } catch (err) {
            toast.error(err.message || 'Could not save category');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={embedded ? '' : 'p-4 sm:p-6 lg:p-8'}>
            <div className={embedded ? '' : 'max-w-3xl mx-auto'}>
                {!embedded && (
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Ledger categories</h1>
                    <p className="text-sm text-gray-600 mt-1">Add categories used when you post ledger entries.</p>
                </div>
                )}

                <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4 mb-6">
                    <div className="flex items-center gap-2">
                        <FiTag className="text-red-600" />
                        <h2 className="font-semibold text-gray-900">Add category</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Category name
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder="e.g. Collection"
                                required
                            />
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Type
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="ASSET">Asset</option>
                                <option value="LIABILITY">Liability</option>
                                <option value="INCOME">Income</option>
                                <option value="EXPENSE">Expense</option>
                            </select>
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={saving || loading}
                        className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg font-semibold disabled:opacity-50"
                    >
                        <FiPlus className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Add category'}
                    </button>
                </form>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">{categories.length} categor{categories.length === 1 ? 'y' : 'ies'}</h2>
                    </div>
                    {!categories.length && !loading && (
                        <p className="px-5 py-8 text-sm text-gray-500 text-center">No categories yet. Add one above.</p>
                    )}
                    {categories.length > 0 && (
                        <ul className="divide-y divide-gray-100">
                            {categories.map((row) => (
                                <li key={row.id} className="px-5 py-3 flex items-center justify-between gap-3">
                                    <p className="font-medium text-gray-900">{row.category_name}</p>
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                                        {row.category_type || '—'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeepavaliLedgerCategoriesPage;
