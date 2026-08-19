import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useUserContext } from '../../context/user_context';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';
import { useHhClinicalStream } from '../../components/hospitalManagement/useHhClinicalStream';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-800',
  PREPARING: 'bg-blue-100 text-blue-800',
  SERVED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const HospitalManagementKitchenDeskPage = () => {
  const {
    membershipId,
    kitchenProducts,
    kitchenOrders,
    fetchKitchenProducts,
    createKitchenProduct,
    updateKitchenProduct,
    fetchKitchenOrders,
    updateKitchenOrderStatus,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canMenu = can('hh_kitchen_menu');
  const canDesk = can('hh_kitchen_desk');
  const { user } = useUserContext();
  const authToken = user?.results?.token || localStorage.getItem('token') || '';
  const [tab, setTab] = useState('orders');
  const [busyId, setBusyId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'REGULAR',
    unitPrice: '',
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const seenRef = useRef(new Set());
  const initRef = useRef(false);

  const reload = useCallback(() => {
    if (!membershipId) return;
    fetchKitchenOrders();
    fetchKitchenProducts({ activeOnly: false });
  }, [membershipId, fetchKitchenOrders, fetchKitchenProducts]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onStreamEvent = useCallback((evt) => {
    if (evt?.action === 'connected') {
      reload();
      return;
    }
    if (evt?.id) seenRef.current.add(evt.id);
    reload();
  }, [reload]);

  useHhClinicalStream({
    enabled: Boolean(authToken && membershipId && canDesk),
    streamPath: '/hh/kitchen/orders/stream',
    parentMembershipId: membershipId,
    token: authToken,
    onEvent: onStreamEvent,
  });

  useEffect(() => {
    (kitchenOrders || []).forEach((o) => seenRef.current.add(o.id));
    initRef.current = true;
  }, [kitchenOrders]);

  const openOrders = useMemo(() => (
    (kitchenOrders || [])
      .filter((o) => ['PENDING', 'PREPARING'].includes(String(o.status || '').toUpperCase()))
      .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))
  ), [kitchenOrders]);

  const recentOrders = useMemo(() => (
    (kitchenOrders || [])
      .filter((o) => ['SERVED', 'CANCELLED'].includes(String(o.status || '').toUpperCase()))
      .slice(0, 20)
  ), [kitchenOrders]);

  const setStatus = async (order, status) => {
    setBusyId(order.id);
    const result = await updateKitchenOrderStatus(order.id, { status });
    setBusyId(null);
    if (result.success) {
      toast.success(status === 'SERVED' ? 'Served — charged to IPD account' : `Marked ${status}`);
      reload();
    } else toast.error(result.error || 'Failed');
  };

  const onAddProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim()) return toast.error('Name required');
    setSavingProduct(true);
    const result = await createKitchenProduct({
      name: productForm.name.trim(),
      category: productForm.category,
      unitPrice: Number(productForm.unitPrice) || 0,
    });
    setSavingProduct(false);
    if (result.success) {
      toast.success('Menu item added');
      setProductForm({ name: '', category: 'REGULAR', unitPrice: '' });
      fetchKitchenProducts({ activeOnly: false });
    } else toast.error(result.error || 'Failed');
  };

  const toggleProduct = async (p) => {
    const next = Number(p.status) === 1 ? 0 : 1;
    const result = await updateKitchenProduct(p.id, { status: next });
    if (result.success) {
      toast.success(next ? 'Activated' : 'Deactivated');
      fetchKitchenProducts({ activeOnly: false });
    } else toast.error(result.error || 'Failed');
  };

  const itemsOf = (o) => o.items || o.order_items || o.orderItems || [];

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Kitchen desk</h1>
        <p className="text-sm text-gray-600">Ward / special food orders — served items charge the inpatient IPD account.</p>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setTab('orders')} className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'orders' ? 'bg-cyan-700 text-white' : 'bg-white border border-gray-200'}`}>Orders</button>
        {canMenu && (
          <button type="button" onClick={() => setTab('menu')} className={`px-3 py-1.5 rounded-lg text-sm ${tab === 'menu' ? 'bg-cyan-700 text-white' : 'bg-white border border-gray-200'}`}>Menu & prices</button>
        )}
      </div>

      {tab === 'orders' && (
        <div className="space-y-4">
          <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Open orders</h2>
            {!openOrders.length && <p className="text-sm text-gray-500">No pending kitchen orders.</p>}
            {openOrders.map((o) => (
              <div key={o.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {String(o.order_type || o.orderType || 'WARD')} · {rs(o.total_amount || o.totalAmount)}
                    </p>
                    <p className="text-xs text-gray-500">Admission {o.admission_id || o.admissionId} · Patient {o.patient_id || o.patientId}</p>
                    {(o.special_request || o.specialRequest) && (
                      <p className="text-xs text-amber-800 mt-1">Special: {o.special_request || o.specialRequest}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLE[String(o.status).toUpperCase()] || 'bg-gray-100'}`}>{o.status}</span>
                </div>
                <ul className="text-sm text-gray-700 space-y-1">
                  {itemsOf(o).map((it) => (
                    <li key={it.id}>{it.product_name || it.productName} × {it.qty} — {rs(it.line_amount || it.lineAmount)}</li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {String(o.status).toUpperCase() === 'PENDING' && (
                    <button type="button" disabled={busyId === o.id} onClick={() => setStatus(o, 'PREPARING')} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-60">Start preparing</button>
                  )}
                  {['PENDING', 'PREPARING'].includes(String(o.status).toUpperCase()) && (
                    <button type="button" disabled={busyId === o.id} onClick={() => setStatus(o, 'SERVED')} className="bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg disabled:opacity-60">Mark served (charge IPD)</button>
                  )}
                  {['PENDING', 'PREPARING'].includes(String(o.status).toUpperCase()) && (
                    <button type="button" disabled={busyId === o.id} onClick={() => setStatus(o, 'CANCELLED')} className="border border-gray-300 text-xs px-3 py-1.5 rounded-lg disabled:opacity-60">Cancel</button>
                  )}
                </div>
              </div>
            ))}
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
            <h2 className="text-sm font-semibold text-gray-900">Recent</h2>
            {recentOrders.map((o) => (
              <div key={o.id} className="flex justify-between text-sm border-b border-gray-50 py-2">
                <span>{String(o.order_type || 'WARD')} · {rs(o.total_amount)} · {o.charged ? 'Charged' : '—'}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[String(o.status).toUpperCase()] || ''}`}>{o.status}</span>
              </div>
            ))}
          </section>
        </div>
      )}

      {tab === 'menu' && canMenu && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form onSubmit={onAddProduct} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Add menu item</h2>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Item name *" value={productForm.name} onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))} />
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={productForm.category} onChange={(e) => setProductForm((f) => ({ ...f, category: e.target.value }))}>
              {['REGULAR', 'SPECIAL', 'BEVERAGE', 'SNACK', 'OTHER'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" type="number" placeholder="Price (₹) *" value={productForm.unitPrice} onChange={(e) => setProductForm((f) => ({ ...f, unitPrice: e.target.value }))} />
            <button type="submit" disabled={savingProduct} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">Add to menu</button>
          </form>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
            <h2 className="text-sm font-semibold text-gray-900">Menu</h2>
            {(kitchenProducts || []).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 border-b border-gray-50 py-2 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.category} · {rs(p.unit_price || p.unitPrice)}/unit</p>
                </div>
                <button type="button" onClick={() => toggleProduct(p)} className="text-xs text-cyan-800 hover:underline">
                  {Number(p.status) === 1 ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
            {!kitchenProducts?.length && <p className="text-sm text-gray-500">No menu items yet.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagementKitchenDeskPage;
