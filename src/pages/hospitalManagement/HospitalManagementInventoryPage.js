import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const emptyItem = { name: '', sku: '', unit: 'UNIT', stockQty: '', reorderLevel: '', unitCost: '' };

const HospitalManagementInventoryPage = () => {
  const {
    inventoryItems,
    inventoryTransactions,
    inventoryAlerts,
    fetchInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    fetchInventoryTransactions,
    createInventoryTransaction,
    fetchInventoryAlerts,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_inventory_manage');

  const [itemForm, setItemForm] = useState(emptyItem);
  const [editId, setEditId] = useState(null);
  const [txnForm, setTxnForm] = useState({ itemId: '', txnType: 'IN', quantity: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventoryItems();
    fetchInventoryTransactions();
    fetchInventoryAlerts();
  }, [fetchInventoryItems, fetchInventoryTransactions, fetchInventoryAlerts]);

  const lowStock = inventoryAlerts?.length ? inventoryAlerts : (inventoryItems || []).filter((m) => {
    const qty = Number(m.stock_qty ?? m.stockQty ?? 0);
    const reorder = Number(m.reorder_level ?? m.reorderLevel ?? 0);
    return reorder > 0 && qty <= reorder;
  });

  const onItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) return toast.error('Item name required');
    setSaving(true);
    const payload = {
      name: itemForm.name.trim(),
      sku: itemForm.sku.trim() || null,
      unit: itemForm.unit,
      stockQty: Number(itemForm.stockQty) || 0,
      reorderLevel: Number(itemForm.reorderLevel) || 0,
      unitCost: Number(itemForm.unitCost) || 0,
    };
    const result = editId ? await updateInventoryItem(editId, payload) : await createInventoryItem(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editId ? 'Item updated' : 'Item added');
      setItemForm(emptyItem);
      setEditId(null);
      fetchInventoryAlerts();
    } else toast.error(result.error || 'Failed');
  };

  const onTxnSubmit = async (e) => {
    e.preventDefault();
    if (!txnForm.itemId) return toast.error('Select item');
    if (!Number(txnForm.quantity)) return toast.error('Enter quantity');
    setSaving(true);
    const result = await createInventoryTransaction({
      itemId: txnForm.itemId,
      txnType: txnForm.txnType,
      quantity: Number(txnForm.quantity),
      notes: txnForm.notes.trim() || null,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Transaction recorded');
      setTxnForm({ itemId: '', txnType: 'IN', quantity: '', notes: '' });
    } else toast.error(result.error || 'Failed');
  };

  const itemName = (id) => (inventoryItems || []).find((x) => String(x.id) === String(id))?.name || `#${id}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500">Stock items, transactions & alerts</p>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">Low stock alert — {lowStock.length} item(s)</p>
          <p className="text-xs text-amber-800 mt-1">{lowStock.slice(0, 5).map((m) => m.name).join(', ')}{lowStock.length > 5 ? '…' : ''}</p>
        </div>
      )}

      {canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form onSubmit={onItemSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">{editId ? 'Edit item' : 'Add item'}</h2>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" value={itemForm.name} onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="SKU" value={itemForm.sku} onChange={(e) => setItemForm((f) => ({ ...f, sku: e.target.value }))} />
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Unit" value={itemForm.unit} onChange={(e) => setItemForm((f) => ({ ...f, unit: e.target.value }))} />
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Stock qty" value={itemForm.stockQty} onChange={(e) => setItemForm((f) => ({ ...f, stockQty: e.target.value }))} />
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Reorder level" value={itemForm.reorderLevel} onChange={(e) => setItemForm((f) => ({ ...f, reorderLevel: e.target.value }))} />
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" placeholder="Unit cost" value={itemForm.unitCost} onChange={(e) => setItemForm((f) => ({ ...f, unitCost: e.target.value }))} />
            </div>
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium">{editId ? 'Update' : 'Add item'}</button>
          </form>

          <form onSubmit={onTxnSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Stock transaction</h2>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={txnForm.itemId} onChange={(e) => setTxnForm((f) => ({ ...f, itemId: e.target.value }))} required>
              <option value="">Select item *</option>
              {(inventoryItems || []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={txnForm.txnType} onChange={(e) => setTxnForm((f) => ({ ...f, txnType: e.target.value }))}>
                <option value="IN">IN</option>
                <option value="OUT">OUT</option>
              </select>
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Quantity *" value={txnForm.quantity} onChange={(e) => setTxnForm((f) => ({ ...f, quantity: e.target.value }))} />
            </div>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Notes" value={txnForm.notes} onChange={(e) => setTxnForm((f) => ({ ...f, notes: e.target.value }))} />
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium">Record transaction</button>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Items</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">SKU</th><th className="px-4 py-2">Stock</th><th className="px-4 py-2">Reorder</th>{canManage && <th className="px-4 py-2">Action</th>}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(inventoryItems || []).map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2">{m.name}</td>
                <td className="px-4 py-2">{m.sku || '—'}</td>
                <td className="px-4 py-2">{m.stock_qty ?? m.stockQty ?? 0}</td>
                <td className="px-4 py-2">{m.reorder_level ?? m.reorderLevel ?? '—'}</td>
                {canManage && (
                  <td className="px-4 py-2">
                    <button type="button" onClick={() => { setEditId(m.id); setItemForm({ name: m.name || '', sku: m.sku || '', unit: m.unit || 'UNIT', stockQty: String(m.stock_qty ?? m.stockQty ?? ''), reorderLevel: String(m.reorder_level ?? m.reorderLevel ?? ''), unitCost: String(m.unit_cost ?? m.unitCost ?? '') }); }} className="text-cyan-700 text-xs font-medium">Edit</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-900">Recent transactions</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Item</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Qty</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(inventoryTransactions || []).slice(0, 20).map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2">{t.txn_date || t.txnDate || t.created_at || '—'}</td>
                <td className="px-4 py-2">{itemName(t.item_id ?? t.itemId)}</td>
                <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded text-xs ${(t.txn_type || t.txnType) === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{t.txn_type || t.txnType}</span></td>
                <td className="px-4 py-2">{t.quantity ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HospitalManagementInventoryPage;
