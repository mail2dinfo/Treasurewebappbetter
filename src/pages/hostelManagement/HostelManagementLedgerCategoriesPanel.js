import React, { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { FiTag, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';

/**
 * Admin Settings → Categories (ledger), scoped by parent_membership_id.
 * Same pattern as Chit Fund Ledger Categories.
 */
const HostelManagementLedgerCategoriesPanel = () => {
  const {
    ledgerCategories,
    fetchLedgerCategories,
    createLedgerCategory,
    deleteLedgerCategory,
  } = useHostelManagement();
  const { can } = useHmPermission();
  const canAdd = can('hm_ledger_create') || can('hm_ledger_manage');
  const canDelete = can('hm_ledger_delete') || can('hm_ledger_manage') || canAdd;

  const [categoryName, setCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchLedgerCategories().finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canAdd) return toast.error('Add permission is required');
    if (!categoryName.trim()) return toast.error('Please enter a category name');
    setIsSaving(true);
    try {
      const result = await createLedgerCategory({ categoryName: categoryName.trim() });
      if (result.success) {
        toast.success(result.message || 'Category added successfully');
        setCategoryName('');
      } else toast.error(result.error || 'Unable to add category');
    } finally {
      setIsSaving(false);
    }
  };

  const removeItem = async (item) => {
    if (!canDelete) return toast.error('Delete permission is required');
    if (item.is_system) return toast.error('System categories cannot be deleted');
    const result = await deleteLedgerCategory(item.id);
    if (result.success) toast.success(result.message || 'Category deleted');
    else toast.error(result.error || 'Unable to delete');
  };

  return (
    <div className="max-w-3xl mx-auto px-2 py-2">
      <div className="mb-5">
        <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
          <FiTag /> Ledger Categories
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mt-1">Categories</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage ledger categories for Add Entry. Categories are scoped to your company (parent membership).
        </p>
      </div>

      {canAdd ? (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5 mb-5">
          <label className="block text-sm font-semibold text-gray-800 mb-2" htmlFor="hm-new-category-input">
            + Add New Category
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="hm-new-category-input"
              type="text"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              placeholder="e.g. Maintenance"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm"
            >
              <FiPlus className="w-5 h-5" />
              {isSaving ? 'Adding…' : '+ Add Category'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm mb-5">
          You can view categories, but add permission is not assigned.
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-500 py-10 text-sm">Loading…</p>
        ) : (ledgerCategories || []).length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
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
                {canDelete && !item.is_system ? (
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

export default HostelManagementLedgerCategoriesPanel;
