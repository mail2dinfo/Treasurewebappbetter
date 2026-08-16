import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useMuttonStall } from '../../context/muttonStall/MuttonStallContext';
import { useMsPermission } from '../../components/muttonStall/useMsPermission';
import { MS_PRODUCT_UNITS, formatUnitLabel, isCountUnit, unitMeta } from '../../utils/msProductUnits';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const emptyProduct = {
  name: '',
  categoryId: '',
  unit: 'kg',
  sellingPrice: '',
  stockQty: '0',
  lowStockAt: '',
};

const MuttonStallStockPage = () => {
  const {
    categories,
    products,
    fetchCategories,
    createCategory,
    fetchProducts,
    createProduct,
    updateProduct,
    createStockMovement,
    isLoading,
  } = useMuttonStall();
  const { can } = useMsPermission();
  const canUpdate = can('ms_stock_update');

  const [categoryName, setCategoryName] = useState('');
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [movement, setMovement] = useState({ productId: '', type: 'IN', qty: '', note: '' });
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchCategories, fetchProducts]);

  const filtered = useMemo(() => {
    if (!filterCategory) return products || [];
    return (products || []).filter((p) => String(p.category_id || p.categoryId) === String(filterCategory));
  }, [products, filterCategory]);

  const formUnit = unitMeta(productForm.unit);
  const movementProduct = (products || []).find((p) => String(p.id) === String(movement.productId));
  const movementUnit = unitMeta(movementProduct?.unit);

  const onSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return toast.error('Category name required');
    setSaving(true);
    const result = await createCategory({ name: categoryName.trim() });
    setSaving(false);
    if (result.success) {
      toast.success('Category added');
      setCategoryName('');
    } else toast.error(result.error || 'Failed');
  };

  const onSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) return toast.error('Product name required');
    const unit = formatUnitLabel(productForm.unit || 'kg');
    const count = isCountUnit(unit);
    setSaving(true);
    const payload = {
      name: productForm.name.trim(),
      categoryId: productForm.categoryId || null,
      unit,
      sellingPrice: Number(productForm.sellingPrice) || 0,
      stockQty: count
        ? Math.max(0, Math.round(Number(productForm.stockQty) || 0))
        : Number(productForm.stockQty) || 0,
      lowStockAt: productForm.lowStockAt === ''
        ? null
        : (count
          ? Math.max(0, Math.round(Number(productForm.lowStockAt) || 0))
          : Number(productForm.lowStockAt)),
    };
    const result = editingId
      ? await updateProduct(editingId, payload)
      : await createProduct(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editingId ? 'Product updated' : 'Product added');
      setProductForm(emptyProduct);
      setEditingId(null);
    } else toast.error(result.error || 'Failed');
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setProductForm({
      name: p.name || '',
      categoryId: p.category_id || p.categoryId || '',
      unit: formatUnitLabel(p.unit || 'kg'),
      sellingPrice: String(p.selling_price ?? p.sellingPrice ?? ''),
      stockQty: String(p.stock_qty ?? p.stockQty ?? '0'),
      lowStockAt: p.low_stock_at != null ? String(p.low_stock_at) : (p.lowStockAt != null ? String(p.lowStockAt) : ''),
    });
  };

  const onMovement = async (e) => {
    e.preventDefault();
    if (!movement.productId) return toast.error('Select product');
    if (!Number(movement.qty)) return toast.error('Enter quantity');
    const count = isCountUnit(movementProduct?.unit);
    const qty = count
      ? Math.max(1, Math.round(Number(movement.qty) || 0))
      : Number(movement.qty);
    setSaving(true);
    const result = await createStockMovement({
      productId: movement.productId,
      movementType: movement.type,
      qty,
      note: movement.note || null,
    });
    setSaving(false);
    if (result.success) {
      toast.success(`Stock ${movement.type}`);
      setMovement({ productId: '', type: 'IN', qty: '', note: '' });
    } else toast.error(result.error || 'Failed');
  };

  const categoryNameOf = (id) => {
    const cat = (categories || []).find((c) => String(c.id) === String(id));
    return cat?.name || '—';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Stock</h1>
        <p className="text-sm text-gray-500">
          Use <span className="font-medium text-gray-700">kg</span> for meat by weight;
          use <span className="font-medium text-gray-700">nos</span> for counted items (leg, head, etc.)
        </p>
      </div>

      {canUpdate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <form onSubmit={onSaveCategory} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Add category</h2>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. Mutton cuts"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <button type="submit" disabled={saving} className="w-full bg-rose-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-rose-900 disabled:opacity-60">
              Add category
            </button>
          </form>

          <form onSubmit={onSaveProduct} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-900">{editingId ? 'Edit product' : 'Add product'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Product name (e.g. Mutton, Mutton Leg, Mutton Head)"
                value={productForm.name}
                onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))}
              />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={productForm.categoryId}
                onChange={(e) => setProductForm((p) => ({ ...p, categoryId: e.target.value }))}
              >
                <option value="">No category</option>
                {(categories || []).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <label className="text-sm">
                <span className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">Unit</span>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                  value={formatUnitLabel(productForm.unit)}
                  onChange={(e) => setProductForm((p) => ({ ...p, unit: e.target.value }))}
                >
                  {MS_PRODUCT_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">
                  Selling price (per {formatUnitLabel(productForm.unit)})
                </span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Price"
                  value={productForm.sellingPrice}
                  onChange={(e) => setProductForm((p) => ({ ...p, sellingPrice: e.target.value }))}
                />
              </label>
              {!editingId && (
                <label className="text-sm">
                  <span className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">Opening stock</span>
                  <input
                    type="number"
                    step={formUnit.step}
                    min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder={isCountUnit(productForm.unit) ? 'e.g. 10' : 'e.g. 25.5'}
                    value={productForm.stockQty}
                    onChange={(e) => setProductForm((p) => ({ ...p, stockQty: e.target.value }))}
                  />
                </label>
              )}
              <label className="text-sm">
                <span className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">Low stock at</span>
                <input
                  type="number"
                  step={formUnit.step}
                  min="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder={isCountUnit(productForm.unit) ? 'e.g. 2' : 'e.g. 5'}
                  value={productForm.lowStockAt}
                  onChange={(e) => setProductForm((p) => ({ ...p, lowStockAt: e.target.value }))}
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-rose-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-rose-900 disabled:opacity-60">
                {editingId ? 'Update' : 'Add product'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setProductForm(emptyProduct); }}
                  className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {canUpdate && (
        <form onSubmit={onMovement} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Stock movement</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
              value={movement.productId}
              onChange={(e) => setMovement((m) => ({ ...m, productId: e.target.value }))}
            >
              <option value="">Select product</option>
              {(products || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatUnitLabel(p.unit)})
                </option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={movement.type}
              onChange={(e) => setMovement((m) => ({ ...m, type: e.target.value }))}
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
            <input
              type="number"
              step={movementUnit.step}
              min={isCountUnit(movementProduct?.unit) ? '1' : '0.001'}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder={movementProduct ? `Qty (${formatUnitLabel(movementProduct.unit)})` : 'Qty'}
              value={movement.qty}
              onChange={(e) => setMovement((m) => ({ ...m, qty: e.target.value }))}
            />
            <button type="submit" disabled={saving} className="bg-stone-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-stone-900 disabled:opacity-60">
              Apply
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Products {isLoading ? '…' : `(${filtered.length})`}</h2>
          <select
            className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm bg-white"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {(categories || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Unit</th>
                <th className="px-3 py-2">Price</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Low at</th>
                {canUpdate && <th className="px-3 py-2">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => {
                const qty = Number(p.stock_qty ?? p.stockQty ?? 0);
                const low = Number(p.low_stock_at ?? p.lowStockAt ?? 0);
                const unit = formatUnitLabel(p.unit);
                const isLow = low > 0 && qty <= low;
                const displayQty = isCountUnit(unit) ? Math.round(qty) : qty;
                return (
                  <tr key={p.id} className={isLow ? 'bg-amber-50/60' : ''}>
                    <td className="px-3 py-2 font-medium text-gray-900">{p.name}</td>
                    <td className="px-3 py-2 text-gray-600">{categoryNameOf(p.category_id || p.categoryId)}</td>
                    <td className="px-3 py-2 text-gray-700 font-medium">{unit}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {rs(p.selling_price ?? p.sellingPrice)}
                      <span className="text-xs text-gray-500"> / {unit}</span>
                    </td>
                    <td className={`px-3 py-2 tabular-nums ${isLow ? 'text-amber-700 font-semibold' : ''}`}>
                      {displayQty} {unit}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-gray-500">{low || '—'}</td>
                    {canUpdate && (
                      <td className="px-3 py-2">
                        <button type="button" onClick={() => startEdit(p)} className="text-rose-800 hover:underline text-xs font-medium">
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={canUpdate ? 7 : 6} className="px-3 py-8 text-center text-gray-500">No products yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MuttonStallStockPage;
