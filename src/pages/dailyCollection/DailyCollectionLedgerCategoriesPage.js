import { useState, useEffect, useCallback } from 'react';
import { FaTrash } from 'react-icons/fa';
import { FiTag, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useDcLedgerContext } from '../../context/dailyCollection/dcLedgerContext';
import Loading from '../../components/Loading';

const DailyCollectionLedgerCategoriesPage = ({ embedded = false }) => {
    const {
        ledgerCategories,
        isLoading,
        fetchLedgerCategories,
        createLedgerCategory,
        deleteLedgerCategory,
    } = useDcLedgerContext();
    const [categoryName, setCategoryName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const load = useCallback(() => {
        fetchLedgerCategories();
    }, [fetchLedgerCategories]);

    useEffect(() => {
        load();
    }, [load]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!categoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }
        setIsSaving(true);
        try {
            const result = await createLedgerCategory({ category_name: categoryName.trim() });
            if (!result.success) {
                toast.error(result.message || result.error || 'Unable to add category');
                return;
            }
            toast.success(result.message || 'Category added successfully');
            setCategoryName('');
        } catch (err) {
            toast.error(err.message || 'Unable to add category');
        } finally {
            setIsSaving(false);
        }
    };

    const removeItem = async (item) => {
        if (item.is_system) {
            toast.error('System categories cannot be deleted');
            return;
        }
        const result = await deleteLedgerCategory(item.id);
        if (result.success) {
            toast.success(result.message || 'Category deleted');
        } else {
            toast.error(result.message || result.error || 'Failed to delete category');
        }
    };

    return (
        <div className={embedded ? '' : 'max-w-3xl mx-auto px-4 py-5'}>
            {!embedded && (
                <div className="mb-5">
                    <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
                        <FiTag /> Ledger Categories
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mt-1">Categories</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage ledger categories for Add Entry. Categories are scoped to your company.
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5 mb-5">
                <label className="block text-sm font-semibold text-gray-800 mb-2" htmlFor="dc-new-category-input">
                    Add New Category
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        id="dc-new-category-input"
                        type="text"
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                        placeholder="e.g. Maintenance"
                        value={categoryName}
                        onChange={(event) => setCategoryName(event.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm"
                    >
                        <FiPlus className="w-5 h-5" />
                        {isSaving ? 'Adding…' : 'Add Category'}
                    </button>
                </div>
            </form>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {isLoading && !(ledgerCategories || []).length ? (
                    <div className="flex justify-start py-12 px-4">
                        <Loading />
                    </div>
                ) : !(ledgerCategories || []).length ? (
                    <p className="text-center text-gray-500 py-10 text-sm">No categories yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-100 list-none p-0 m-0">
                        {(ledgerCategories || []).map((item) => (
                            <li
                                key={item.id}
                                className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 capitalize">{item.category_name}</p>
                                    {item.is_system && (
                                        <p className="text-xs text-gray-500 mt-0.5">System category</p>
                                    )}
                                </div>
                                {!item.is_system ? (
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item)}
                                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-red-600 hover:bg-red-50"
                                        title="Delete category"
                                    >
                                        <FaTrash className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default DailyCollectionLedgerCategoriesPage;
