import { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import { FiTag, FiPlus } from 'react-icons/fi';
import { useUserContext } from '../context/user_context';
import { useLedgerCategoryContext } from '../context/ledgerCategory_context';
import { usePlatformAccess } from '../context/platformAccess_context';
import loadingImage from '../images/preloader.gif';
import Alert from './Alert';

function LedgerCategories() {
  const { user } = useUserContext();
  const platform = usePlatformAccess();
  const enforceAccess = platform?.isAvailable && !platform.isOwner;
  const canAddCategory = !enforceAccess || platform.hasPermission('chit_ledger_add_entry');
  const canDeleteCategory = !enforceAccess || platform.hasPermission('chit_ledger_add_entry');
  const {
    categories,
    isLoading,
    addLedgerCategory,
    deleteLedgerCategory,
    fetchLedgerCategories,
  } = useLedgerCategoryContext();

  const userAccounts = user?.results?.userAccounts || [];
  const parentMembershipId = platform?.activeContext?.parentMembershipId
    ?? userAccounts.find((account) => account?.parent_membership_id)?.parent_membership_id
    ?? userAccounts.find((account) => account?.membershipId)?.membershipId
    ?? userAccounts[0]?.membershipId;

  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });
  const [list] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.results?.token) fetchLedgerCategories();
  }, [user?.results?.token]);

  const showAlert = (show = false, type = '', msg = '') => {
    setAlert({ show, type, msg });
  };

  const removeItem = async (item) => {
    if (!canDeleteCategory) {
      showAlert(true, 'danger', 'Delete permission is required');
      return;
    }
    if (item.is_system) {
      showAlert(true, 'danger', 'System categories cannot be deleted');
      return;
    }
    const result = await deleteLedgerCategory(item.id);
    showAlert(true, result.success ? 'success' : 'danger', result.message);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canAddCategory) {
      showAlert(true, 'danger', 'Add permission is required');
      return;
    }
    if (!categoryName.trim()) {
      showAlert(true, 'danger', 'Please enter a category name');
      return;
    }
    if (!parentMembershipId) {
      showAlert(true, 'danger', 'Membership context is missing. Please re-open Chit Fund from Hub.');
      return;
    }

    setIsSaving(true);
    const result = await addLedgerCategory({
      categoryName: categoryName.trim(),
      parentMembershipId,
    });
    setIsSaving(false);

    if (result.success) {
      showAlert(true, 'success', result.message || 'Category added successfully');
      setCategoryName('');
      fetchLedgerCategories();
    } else {
      showAlert(true, 'danger', result.message || 'Unable to add category');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5">
      <div className="mb-5">
        <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
          <FiTag /> Ledger Categories
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mt-1">Categories</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage ledger categories for Add Entry. Categories are scoped to your company.
        </p>
      </div>

      {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}

      {canAddCategory ? (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5 mb-5">
          <label className="block text-sm font-semibold text-gray-800 mb-2" htmlFor="new-category-input">
            + Add New Category
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="new-category-input"
              type="text"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
              placeholder="e.g. Maintenance"
              name="categoryName"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
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
        {isLoading ? (
          <div className="flex justify-center py-12">
            <img src={loadingImage} alt="Loading..." className="w-12 h-12" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-gray-500 py-10 text-sm">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {categories.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 capitalize">{item.category_name}</p>
                  {item.is_system && (
                    <p className="text-xs text-gray-500 mt-0.5">System category (used for group entries)</p>
                  )}
                </div>
                {canDeleteCategory && !item.is_system ? (
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
}

export default LedgerCategories;
