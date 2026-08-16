import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useMuttonStall } from '../../context/muttonStall/MuttonStallContext';
import { useMsPermission } from '../../components/muttonStall/useMsPermission';
import { useMsOrdersStream } from '../../components/muttonStall/useMsOrdersStream';
import { useUserContext } from '../../context/user_context';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const toDate = (d) => d.toISOString().slice(0, 10);

const STATUS_FLOW = ['NEW', 'PICKED', 'PREPARING', 'ARRIVAL', 'DELIVERED'];
const STATUS_STYLE = {
  NEW: 'bg-amber-100 text-amber-800',
  PICKED: 'bg-indigo-100 text-indigo-800',
  PREPARING: 'bg-blue-100 text-blue-800',
  ARRIVAL: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

const NEXT_ACTION = {
  NEW: { status: 'PICKED', label: 'Mark picked' },
  PICKED: { status: 'PREPARING', label: 'Start preparing' },
  PREPARING: { status: 'ARRIVAL', label: 'Mark arrival' },
  ARRIVAL: { status: 'DELIVERED', label: 'Mark delivered' },
};

const MuttonStallOrdersPage = () => {
  const {
    orders,
    fetchOrders,
    updateOrderStatus,
    cancelOrder,
    membershipId,
  } = useMuttonStall();
  const { user } = useUserContext();
  const { can, enforceAccess, roleCode } = useMsPermission();
  const canUpdate = can('ms_orders_update');
  const isSalesman = String(roleCode || '').toUpperCase() === 'SALESMAN' || (enforceAccess && roleCode === 'SALESMAN');
  const authToken = user?.results?.token || localStorage.getItem('token') || '';

  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState(null);

  const reloadOrders = useCallback(() => {
    if (!membershipId) return;
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (isSalesman) {
      params.from_date = toDate(new Date());
    }
    fetchOrders(params);
  }, [membershipId, statusFilter, isSalesman, fetchOrders]);

  useEffect(() => {
    reloadOrders();
  }, [reloadOrders]);

  useMsOrdersStream({
    enabled: Boolean(authToken && membershipId),
    scope: 'membership',
    parentMembershipId: membershipId,
    token: authToken,
    onEvent: reloadOrders,
  });

  const filtered = useMemo(() => {
    let rows = orders || [];
    if (isSalesman) {
      const today = toDate(new Date());
      rows = rows.filter((o) => {
        const d = String(o.order_date || o.orderDate || '').slice(0, 10);
        return !d || d >= today;
      });
    }
    if (statusFilter) {
      rows = rows.filter((o) => String(o.status).toUpperCase() === statusFilter);
    }
    return rows;
  }, [orders, isSalesman, statusFilter]);

  const advance = async (order) => {
    const next = NEXT_ACTION[String(order.status || '').toUpperCase()];
    if (!next) return;
    setBusyId(order.id);
    const result = await updateOrderStatus(order.id, next.status);
    setBusyId(null);
    if (result.success) {
      toast.success(`Order → ${next.status}`);
      reloadOrders();
    } else toast.error(result.error || 'Failed');
  };

  const onCancel = async (order) => {
    if (!window.confirm('Cancel this order?')) return;
    setBusyId(order.id);
    const result = await cancelOrder(order.id);
    setBusyId(null);
    if (result.success) {
      toast.success('Order cancelled');
      reloadOrders();
    } else toast.error(result.error || 'Failed');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">
            {isSalesman ? 'Today and future orders · live updates' : 'Queue with live status updates'}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setStatusFilter('')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${!statusFilter ? 'bg-rose-800 text-white border-rose-800' : 'bg-white text-gray-600 border-gray-200'}`}
          >
            All
          </button>
          {[...STATUS_FLOW, 'CANCELLED'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${statusFilter === s ? 'bg-rose-800 text-white border-rose-800' : 'bg-white text-gray-600 border-gray-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((order) => {
          const status = String(order.status || 'NEW').toUpperCase();
          const next = NEXT_ACTION[status];
          const items = order.items || order.order_items || [];
          return (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {order.customer_name || order.customerName || 'Walk-in'}
                    {order.customer_phone || order.customerPhone ? (
                      <span className="text-gray-500 font-normal text-sm ml-2">{order.customer_phone || order.customerPhone}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {String(order.order_date || order.orderDate || '').slice(0, 10)}
                    {order.source ? ` · ${order.source}` : ''}
                    {order.notes ? ` · ${order.notes}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-700'}`}>
                    {status}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-gray-900">{rs(order.total_amount ?? order.totalAmount)}</span>
                </div>
              </div>
              {items.length > 0 && (
                <ul className="mt-2 text-sm text-gray-600 space-y-0.5">
                  {items.map((line) => (
                    <li key={line.id || `${line.product_id}-${line.name}`}>
                      {line.product_name || line.name} × {line.qty || line.quantity}
                      {' '}({rs(line.line_total ?? line.lineTotal ?? (Number(line.unit_price || line.unitPrice || 0) * Number(line.qty || line.quantity || 0)))})
                    </li>
                  ))}
                </ul>
              )}
              {canUpdate && status !== 'DELIVERED' && status !== 'CANCELLED' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {next && (
                    <button
                      type="button"
                      disabled={busyId === order.id}
                      onClick={() => advance(order)}
                      className="bg-rose-800 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-rose-900 disabled:opacity-60"
                    >
                      {next.label}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === order.id}
                    onClick={() => onCancel(order)}
                    className="border border-gray-300 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {!filtered.length && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-sm">
            No orders in this view
          </div>
        )}
      </div>
    </div>
  );
};

export default MuttonStallOrdersPage;
