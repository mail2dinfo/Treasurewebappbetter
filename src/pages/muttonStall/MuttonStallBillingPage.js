import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useMuttonStall } from '../../context/muttonStall/MuttonStallContext';
import { useMsPermission } from '../../components/muttonStall/useMsPermission';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const toDate = (d) => d.toISOString().slice(0, 10);

const MuttonStallBillingPage = () => {
  const {
    bills,
    orders,
    customers,
    fetchBills,
    createBill,
    fetchOrders,
    fetchCustomers,
  } = useMuttonStall();
  const { can } = useMsPermission();
  const canCreate = can('ms_billing_create');

  const [form, setForm] = useState({
    orderId: '',
    customerId: '',
    customerName: '',
    totalAmount: '',
    paidAmount: '',
    paymentMethod: 'CASH',
    billDate: toDate(new Date()),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBills();
    fetchOrders({ status: 'DELIVERED' });
    fetchCustomers();
  }, [fetchBills, fetchOrders, fetchCustomers]);

  const onOrderPick = (orderId) => {
    const order = (orders || []).find((o) => String(o.id) === String(orderId));
    setForm((f) => ({
      ...f,
      orderId,
      customerId: order?.customer_id || order?.customerId || '',
      customerName: order?.customer_name || order?.customerName || '',
      totalAmount: String(order?.total_amount ?? order?.totalAmount ?? ''),
      paidAmount: String(order?.total_amount ?? order?.totalAmount ?? ''),
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!Number(form.totalAmount)) return toast.error('Enter amount');
    setSaving(true);
    const result = await createBill({
      orderId: form.orderId || null,
      customerId: form.customerId || null,
      customerName: form.customerName.trim() || null,
      totalAmount: Number(form.totalAmount),
      paidAmount: Number(form.paidAmount || form.totalAmount),
      paymentMethod: form.paymentMethod,
      billDate: form.billDate,
      status: 'PAID',
    });
    setSaving(false);
    if (result.success) {
      toast.success('Bill created');
      setForm({
        orderId: '',
        customerId: '',
        customerName: '',
        totalAmount: '',
        paidAmount: '',
        paymentMethod: 'CASH',
        billDate: toDate(new Date()),
      });
    } else toast.error(result.error || 'Failed');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Stall Billing</h1>
        <p className="text-sm text-gray-500">Create bills from delivered orders or counter sales</p>
      </div>

      {canCreate && (
        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">New bill</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.orderId}
              onChange={(e) => onOrderPick(e.target.value)}
            >
              <option value="">Counter / no order</option>
              {(orders || []).map((o) => (
                <option key={o.id} value={o.id}>
                  {(o.customer_name || o.customerName || 'Order')} · {rs(o.total_amount ?? o.totalAmount)} · {String(o.order_date || '').slice(0, 10)}
                </option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.customerId}
              onChange={(e) => {
                const c = (customers || []).find((x) => String(x.id) === String(e.target.value));
                setForm((f) => ({
                  ...f,
                  customerId: e.target.value,
                  customerName: c?.name || f.customerName,
                }));
              }}
            >
              <option value="">Walk-in customer</option>
              {(customers || []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Customer name"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
            />
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.billDate}
              onChange={(e) => setForm((f) => ({ ...f, billDate: e.target.value }))}
            />
            <input
              type="number"
              step="0.01"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Total amount"
              value={form.totalAmount}
              onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value, paidAmount: e.target.value }))}
            />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="bg-rose-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-rose-900 disabled:opacity-60">
            Create bill
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Recent bills</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Customer</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(bills || []).map((b) => (
                <tr key={b.id}>
                  <td className="px-3 py-2">{String(b.bill_date || b.billDate || '').slice(0, 10)}</td>
                  <td className="px-3 py-2">{b.customer_name || b.customerName || '—'}</td>
                  <td className="px-3 py-2">{b.payment_method || b.paymentMethod || '—'}</td>
                  <td className="px-3 py-2 tabular-nums font-medium">{rs(b.total_amount ?? b.totalAmount)}</td>
                  <td className="px-3 py-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                      {b.status || 'PAID'}
                    </span>
                  </td>
                </tr>
              ))}
              {!(bills || []).length && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">No bills yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MuttonStallBillingPage;
