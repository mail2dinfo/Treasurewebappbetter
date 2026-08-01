import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCoffee, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import { useUserContext } from '../../context/user_context';

const SLOT_OPTIONS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'juices', label: 'Juices' },
  { id: 'custom', label: 'Custom' },
];

const HostelManagementMealMenuPage = () => {
  const { user } = useUserContext();
  const {
    fetchMealMenu,
    createMealCategory,
    deleteMealCategory,
    createMealItem,
    deleteMealItem,
  } = useHostelManagement();

  const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '', slotKey: 'custom' });
  const [itemForm, setItemForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!membershipId) return;
    setLoading(true);
    const result = await fetchMealMenu(membershipId);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error || 'Failed to load meal menu');
      return;
    }
    const cats = result.data?.categories || [];
    setCategories(cats);
    if (!selectedCategoryId && cats[0]?.id) {
      setSelectedCategoryId(cats[0].id);
    } else if (selectedCategoryId && !cats.some((c) => c.id === selectedCategoryId) && cats[0]?.id) {
      setSelectedCategoryId(cats[0].id);
    }
  };

  useEffect(() => {
    load();
  }, [membershipId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const addCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    setSaving(true);
    const result = await createMealCategory({
      parentMembershipId: membershipId,
      name: categoryForm.name.trim(),
      slotKey: categoryForm.slotKey,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || 'Failed to add category');
      return;
    }
    toast.success('Category added');
    setCategoryForm({ name: '', slotKey: 'custom' });
    await load();
    if (result.data?.id) setSelectedCategoryId(result.data.id);
  };

  const removeCategory = async (cat) => {
    if (cat.is_system) {
      toast.error('Default categories cannot be deleted');
      return;
    }
    if (!window.confirm(`Delete category "${cat.name}" and its items?`)) return;
    const result = await deleteMealCategory(cat.id);
    if (!result.success) {
      toast.error(result.error || 'Failed to delete category');
      return;
    }
    toast.success('Category deleted');
    if (selectedCategoryId === cat.id) setSelectedCategoryId('');
    await load();
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      toast.error('Select a category first');
      return;
    }
    if (!itemForm.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    setSaving(true);
    const result = await createMealItem({
      parentMembershipId: membershipId,
      categoryId: selectedCategoryId,
      name: itemForm.name.trim(),
      description: itemForm.description.trim() || null,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || 'Failed to add item');
      return;
    }
    toast.success('Item added');
    setItemForm({ name: '', description: '' });
    await load();
  };

  const removeItem = async (item) => {
    if (!window.confirm(`Delete item "${item.name}"?`)) return;
    const result = await deleteMealItem(item.id);
    if (!result.success) {
      toast.error(result.error || 'Failed to delete item');
      return;
    }
    toast.success('Item deleted');
    await load();
  };

  if (!membershipId) {
    return <p className="text-sm text-gray-500 p-4">Membership not found.</p>;
  }

  return (
    <div className="space-y-5 p-2 sm:p-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#d62828]">
          <FiCoffee className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Meal menu</h2>
          <p className="text-sm text-gray-500">
            Breakfast / Lunch / Dinner items are used in week meal availability.
            Juices and other categories are for resident special orders.
            New memberships get Breakfast, Lunch, Dinner, and Juices by default.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading meal menu…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Categories</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2 flex items-center justify-between gap-2 ${
                      selectedCategoryId === cat.id
                        ? 'border-red-400 bg-red-50'
                        : 'border-gray-200 hover:border-red-200'
                    }`}
                  >
                    <span>
                      <span className="font-medium text-gray-900">{cat.name}</span>
                      <span className="ml-2 text-[11px] uppercase text-gray-400">{cat.slot_key}</span>
                      {cat.is_system && (
                        <span className="ml-2 text-[10px] font-semibold text-blue-700">DEFAULT</span>
                      )}
                      <span className="block text-xs text-gray-500">
                        {(cat.items || []).length} item{(cat.items || []).length === 1 ? '' : 's'}
                      </span>
                    </span>
                    {!cat.is_system && (
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete category"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCategory(cat);
                        }}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <form onSubmit={addCategory} className="border-t pt-3 space-y-2">
              <p className="text-xs font-semibold uppercase text-gray-500">Add category</p>
              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Category name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
              />
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={categoryForm.slotKey}
                onChange={(e) => setCategoryForm((p) => ({ ...p, slotKey: e.target.value }))}
              >
                {SLOT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-3 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                <FiPlus /> Add category
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-gray-200 p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">
              Items{selectedCategory ? ` · ${selectedCategory.name}` : ''}
            </h3>
            {!selectedCategory ? (
              <p className="text-sm text-gray-500">Select a category to manage items.</p>
            ) : (
              <>
                <ul className="space-y-2 max-h-72 overflow-y-auto">
                  {(selectedCategory.items || []).length === 0 && (
                    <li className="text-sm text-gray-500">No items yet — add what you prepare.</li>
                  )}
                  {(selectedCategory.items || []).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2"
                    >
                      <span>
                        <span className="font-medium text-gray-900">{item.name}</span>
                        {item.description && (
                          <span className="block text-xs text-gray-500">{item.description}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={() => removeItem(item)}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>

                <form onSubmit={addItem} className="border-t pt-3 space-y-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">Add item</p>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Item name (e.g. Idli)"
                    value={itemForm.name}
                    onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder="Short note (optional)"
                    value={itemForm.description}
                    onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-3 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                  >
                    <FiPlus /> Add item
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HostelManagementMealMenuPage;
