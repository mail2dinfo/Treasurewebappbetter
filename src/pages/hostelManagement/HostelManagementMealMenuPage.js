import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiCoffee, FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
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
    updateMealItem,
    deleteMealItem,
  } = useHostelManagement();

  const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', slotKey: 'custom' });
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '' });
  const [editingItemId, setEditingItemId] = useState('');
  const [editForm, setEditForm] = useState({ name: '', description: '', price: '' });
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
    toast.success('Category created — now add items under it');
    setCategoryForm({ name: '', slotKey: 'custom' });
    setShowAddCategory(false);
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
      toast.error('Choose a category first');
      return;
    }
    if (!itemForm.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (itemForm.price === '' || Number(itemForm.price) < 0) {
      toast.error('Enter a valid price');
      return;
    }
    setSaving(true);
    const result = await createMealItem({
      parentMembershipId: membershipId,
      categoryId: selectedCategoryId,
      name: itemForm.name.trim(),
      description: itemForm.description.trim() || null,
      price: Number(itemForm.price) || 0,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || 'Failed to add item');
      return;
    }
    toast.success(`Item added under ${selectedCategory?.name || 'category'}`);
    setItemForm({ name: '', description: '', price: '' });
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
    if (editingItemId === item.id) {
      setEditingItemId('');
      setEditForm({ name: '', description: '', price: '' });
    }
    await load();
  };

  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setEditForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price != null ? String(item.price) : '0',
    });
  };

  const cancelEditItem = () => {
    setEditingItemId('');
    setEditForm({ name: '', description: '', price: '' });
  };

  const saveEditItem = async (e) => {
    e.preventDefault();
    if (!editingItemId) return;
    if (!editForm.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (editForm.price === '' || Number.isNaN(Number(editForm.price)) || Number(editForm.price) < 0) {
      toast.error('Enter a valid price');
      return;
    }
    setSaving(true);
    const result = await updateMealItem(editingItemId, {
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
      price: Number(editForm.price) || 0,
    });
    setSaving(false);
    if (!result.success) {
      toast.error(result.error || 'Failed to update item');
      return;
    }
    toast.success('Item updated');
    cancelEditItem();
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
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading meal menu…</p>
      ) : (
        <div className="space-y-4">
          {/* Step 1 */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 normal-case">Step 1: Choose a category</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategory((v) => !v)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#d62828] border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50"
              >
                <FiPlus className="h-4 w-4" />
                {showAddCategory ? 'Close' : 'New category'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      cancelEditItem();
                    }}
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                      active
                        ? 'border-[#d62828] bg-red-50 text-red-800 ring-2 ring-red-100'
                        : 'border-gray-200 text-gray-700 hover:border-red-200'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[11px] rounded-full px-1.5 py-0.5 ${active ? 'bg-white text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                      {(cat.items || []).length}
                    </span>
                  </button>
                );
              })}
              {categories.length === 0 && (
                <p className="text-sm text-gray-500">No categories yet — create one below.</p>
              )}
            </div>

            {showAddCategory && (
              <form onSubmit={addCategory} className="rounded-lg border border-dashed border-red-200 bg-red-50/40 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  className="border rounded-lg px-3 py-2 text-sm bg-white sm:col-span-1"
                  placeholder="Category name (e.g. Snacks)"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                  autoFocus
                />
                <select
                  className="border rounded-lg px-3 py-2 text-sm bg-white"
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
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white px-3 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  <FiPlus /> Create category
                </button>
              </form>
            )}
          </section>

          {/* Step 2 */}
          <section className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 normal-case">
                  {selectedCategory
                    ? `Step 2: Choose an item under “${selectedCategory.name}”`
                    : 'Step 2: Choose an item'}
                </h3>
                {selectedCategory && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add new items or edit price for existing ones in this category.
                  </p>
                )}
              </div>
              {selectedCategory && !selectedCategory.is_system && (
                <button
                  type="button"
                  onClick={() => removeCategory(selectedCategory)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
                >
                  <FiTrash2 className="h-3.5 w-3.5" /> Delete category
                </button>
              )}
            </div>

            {!selectedCategory ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                Step 1 first — choose a category above.
              </div>
            ) : (
              <>
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {(selectedCategory.items || []).length === 0 && (
                    <li className="rounded-lg border border-dashed border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                      No items in <strong>{selectedCategory.name}</strong> yet — add the first dish/price below.
                    </li>
                  )}
                  {(selectedCategory.items || []).map((item) => (
                    <li
                      key={item.id}
                      className="rounded-lg border border-gray-100 px-3 py-2.5"
                    >
                      {editingItemId === item.id ? (
                        <form onSubmit={saveEditItem} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            className="border rounded-lg px-3 py-2 text-sm"
                            value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Item name"
                            autoFocus
                          />
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₹</span>
                            <input
                              className="w-full border rounded-lg pl-7 pr-3 py-2 text-sm"
                              type="number"
                              min="0"
                              step="0.01"
                              value={editForm.price}
                              onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                              placeholder="Price"
                              required
                            />
                          </div>
                          <input
                            className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
                            value={editForm.description}
                            onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                            placeholder="Short note (optional)"
                          />
                          <div className="sm:col-span-2 flex flex-wrap gap-2">
                            <button
                              type="submit"
                              disabled={saving}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 text-white px-3 py-1.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                              <FiCheck className="h-4 w-4" /> Save
                            </button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={cancelEditItem}
                              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <FiX className="h-4 w-4" /> Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span>
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="ml-2 text-sm font-semibold text-gray-800">
                              ₹{Number(item.price || 0).toLocaleString('en-IN')}
                            </span>
                            {item.description && (
                              <span className="block text-xs text-gray-500">{item.description}</span>
                            )}
                          </span>
                          <span className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              className="text-gray-600 hover:text-[#d62828] p-1.5"
                              onClick={() => startEditItem(item)}
                              title="Edit name / price"
                            >
                              <FiEdit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-800 p-1.5"
                              onClick={() => removeItem(item)}
                              title="Delete item"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                <form
                  onSubmit={addItem}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  <p className="sm:col-span-2 text-xs font-semibold text-gray-600">
                    New item in <span className="text-[#d62828]">{selectedCategory.name}</span>
                  </p>
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                    placeholder="Item name (e.g. Idli)"
                    value={itemForm.name}
                    onChange={(e) => setItemForm((p) => ({ ...p, name: e.target.value }))}
                  />
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price (₹) *"
                    value={itemForm.price}
                    onChange={(e) => setItemForm((p) => ({ ...p, price: e.target.value }))}
                    required
                  />
                  <input
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
                    placeholder="Short note (optional)"
                    value={itemForm.description}
                    onChange={(e) => setItemForm((p) => ({ ...p, description: e.target.value }))}
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white px-3 py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                  >
                    <FiPlus /> Add item to {selectedCategory.name}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default HostelManagementMealMenuPage;
