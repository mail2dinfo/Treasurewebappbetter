import React, { useCallback, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FiPlus,
    FiTrash2,
    FiRefreshCw,
} from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';

const PersonalFinanceCategoriesPage = () => {
    const { user } = useUserContext();
    const token = user?.results?.token;
    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id
        || user?.results?.userAccounts?.[0]?.membershipId;

    const [income, setIncome] = useState([]);
    const [expense, setExpense] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newIncome, setNewIncome] = useState('');
    const [newExpense, setNewExpense] = useState('');

    const fetchCategories = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const qs = membershipId ? `?parent_membership_id=${membershipId}` : '';
            const res = await fetch(`${API_BASE_URL}/pf/categories${qs}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to load categories');
            }
            setIncome(data.results?.income || []);
            setExpense(data.results?.expense || []);
        } catch (error) {
            toast.error(error.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    }, [token, membershipId]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const addCategory = async (categoryType, name, clearFn) => {
        const trimmed = String(name || '').trim();
        if (!trimmed) {
            toast.error('Enter a category name');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/pf/categories`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category_type: categoryType,
                    name: trimmed,
                    membershipId,
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to add category');
            }
            toast.success(data.message || 'Category added');
            clearFn('');
            await fetchCategories();
        } catch (error) {
            toast.error(error.message || 'Failed to add category');
        } finally {
            setSaving(false);
        }
    };

    const removeCategory = async (category) => {
        if (!window.confirm(`Remove "${category.name}" from your list?`)) return;
        setSaving(true);
        try {
            const qs = membershipId ? `?parent_membership_id=${membershipId}` : '';
            const res = await fetch(`${API_BASE_URL}/pf/categories/${category.id}${qs}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to remove category');
            }
            toast.success(data.message || 'Category removed');
            await fetchCategories();
        } catch (error) {
            toast.error(error.message || 'Failed to remove category');
        } finally {
            setSaving(false);
        }
    };

    const CategoryColumn = ({ title, tone, items, value, onChange, onAdd, type }) => (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className={`px-5 py-4 border-b ${tone === 'income' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                <h2 className={`text-lg font-semibold ${tone === 'income' ? 'text-emerald-800' : 'text-rose-800'}`}>
                    {title}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                    Defaults included — add or remove to match your needs
                </p>
            </div>

            <div className="p-4 border-b border-gray-100 flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onAdd();
                    }}
                    placeholder={`Add ${type.toLowerCase()} category`}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={saving}
                />
                <button
                    type="button"
                    onClick={onAdd}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                    <FiPlus className="w-4 h-4" />
                    Add
                </button>
            </div>

            <ul className="divide-y divide-gray-100 max-h-[28rem] overflow-y-auto">
                {items.length === 0 ? (
                    <li className="px-5 py-8 text-sm text-gray-500 text-center">No categories yet</li>
                ) : (
                    items.map((item) => (
                        <li key={item.id} className="px-5 py-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                {item.is_system ? (
                                    <p className="text-[11px] text-gray-400">Default</p>
                                ) : (
                                    <p className="text-[11px] text-gray-400">Custom</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => removeCategory(item)}
                                disabled={saving}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                                aria-label={`Remove ${item.name}`}
                                title="Remove"
                            >
                                <FiTrash2 className="w-4 h-4" />
                            </button>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );

    return (
        <div>
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Every user starts with standard income &amp; expense categories. Customise yours anytime.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchCategories}
                        disabled={loading || saving}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CategoryColumn
                            title="Income"
                            tone="income"
                            type="INCOME"
                            items={income}
                            value={newIncome}
                            onChange={setNewIncome}
                            onAdd={() => addCategory('INCOME', newIncome, setNewIncome)}
                        />
                        <CategoryColumn
                            title="Expense"
                            tone="expense"
                            type="EXPENSE"
                            items={expense}
                            value={newExpense}
                            onChange={setNewExpense}
                            onAdd={() => addCategory('EXPENSE', newExpense, setNewExpense)}
                        />
                    </div>
                )}
            </main>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default PersonalFinanceCategoriesPage;
