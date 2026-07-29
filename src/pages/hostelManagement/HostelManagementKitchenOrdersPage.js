import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';

const STATUS_STYLE = {
  NEW: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_PROCESS: 'bg-blue-100 text-blue-800 border-blue-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
};

const NEXT_ACTION = {
  NEW: { status: 'IN_PROCESS', label: 'Start (In process)' },
  IN_PROCESS: { status: 'DELIVERED', label: 'Mark delivered' },
};

/**
 * Kitchen Staff queue — NEW → IN_PROCESS → DELIVERED across all hostels.
 */
const HostelManagementKitchenOrdersPage = () => {
  const {
    membershipId,
    specialOrders,
    fetchSpecialOrders,
    updateSpecialOrderStatus,
  } = useHostelManagement();
  const { can, roleCode } = useHmPermission();
  const canUpdate = String(roleCode || '').toUpperCase() === 'KITCHEN_STAFF'
    || can('hm_special_orders_update')
    || can('hm_special_orders_view');
  const [statusFilter, setStatusFilter] = useState('NEW');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const reload = async (status = statusFilter) => {
    if (!membershipId) return;
    setLoading(true);
    try {
      await fetchSpecialOrders({
        parent_membership_id: membershipId,
        status: status || undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload(statusFilter);
  }, [membershipId, statusFilter]);

  const advance = async (order) => {
    const next = NEXT_ACTION[order.status];
    if (!next) return;
    setBusyId(order.id);
    try {
      const result = await updateSpecialOrderStatus(order.id, next.status);
      if (result.success) {
        toast.success(`Order → ${next.status === 'IN_PROCESS' ? 'In process' : 'Delivered'}`);
        reload(statusFilter);
      } else toast.error(result.error || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Special Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Queue from residents & admin. Advance: NEW → In process → Delivered.
          </p>
        </div>
        <div className="flex gap-2">
          {['', 'NEW', 'IN_PROCESS', 'DELIVERED'].map((s) => (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`text-sm px-3 py-1.5 rounded-lg border font-medium ${
                statusFilter === s
                  ? 'bg-red-50 text-red-800 border-red-100'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'All' : s === 'IN_PROCESS' ? 'In process' : s}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading orders…</p>}

      <div className="space-y-3">
        {(specialOrders || []).map((o) => {
          const next = NEXT_ACTION[o.status];
          return (
            <article key={o.id} className="bg-white border rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{o.item_name}</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {o.resident_name || 'Resident'} · Qty {o.quantity}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {o.hostel_name} · {o.stay_label || '—'} · {o.meal_slot} · {o.meal_date}
                    {' · '}via {o.source}
                  </p>
                  {o.notes && <p className="text-sm text-gray-600 mt-2">Note: {o.notes}</p>}
                </div>
                <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[o.status] || 'bg-gray-100'}`}>
                  {o.status === 'IN_PROCESS' ? 'IN PROCESS' : o.status}
                </span>
              </div>
              {next && canUpdate && (
                <button
                  type="button"
                  disabled={busyId === o.id}
                  onClick={() => advance(o)}
                  className="bg-[#d62828] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60"
                >
                  {busyId === o.id ? 'Updating…' : next.label}
                </button>
              )}
            </article>
          );
        })}
        {!loading && (!specialOrders || specialOrders.length === 0) && (
          <p className="text-gray-500">No orders in this view.</p>
        )}
      </div>
    </div>
  );
};

export default HostelManagementKitchenOrdersPage;
