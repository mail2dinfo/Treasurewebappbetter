import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';
import { useUserContext } from '../../context/user_context';
import { useHmSpecialOrdersStream } from '../../components/hostelManagement/useHmSpecialOrdersStream';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_STYLE = {
  NEW: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  ORDER_PICKED_UP: 'bg-purple-100 text-purple-800 border-purple-200',
  IN_PROCESS: 'bg-blue-100 text-blue-800 border-blue-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const NEXT_ACTION = {
  NEW: { status: 'ORDER_PICKED_UP', label: 'Order picked up' },
  CONFIRMED: { status: 'ORDER_PICKED_UP', label: 'Order picked up' },
  ORDER_PICKED_UP: { status: 'IN_PROCESS', label: 'Start processing' },
  IN_PROCESS: { status: 'DELIVERED', label: 'Mark delivered' },
};

const statusLabel = (s) => {
  if (s === 'IN_PROCESS') return 'IN PROCESS';
  if (s === 'ORDER_PICKED_UP') return 'ORDER PICKED UP';
  return s || '—';
};

/**
 * Kitchen / staff queue.
 * NEW → Order picked up (locks resident cancel) → In process → Delivered.
 */
const HostelManagementKitchenOrdersPage = () => {
  const {
    membershipId,
    specialOrders,
    fetchSpecialOrders,
    updateSpecialOrderStatus,
  } = useHostelManagement();
  const { user } = useUserContext();
  const authToken = user?.results?.token || localStorage.getItem('token') || '';
  const { can, roleCode } = useHmPermission();
  const canUpdate = String(roleCode || '').toUpperCase() === 'KITCHEN_STAFF'
    || can('hm_special_orders_update')
    || can('hm_special_orders_view');
  const [statusFilter, setStatusFilter] = useState('NEW');
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState(null);

  const groupedOrders = useMemo(() => {
    const map = new Map();
    (specialOrders || []).forEach((row) => {
      const key = row.order_group_id || row.id;
      if (!map.has(key)) {
        map.set(key, {
          key,
          status: row.status,
          meal_date: row.meal_date,
          transaction_ref: row.transaction_ref,
          notes: row.notes,
          resident_name: row.resident_name,
          hostel_name: row.hostel_name,
          stay_label: row.stay_label,
          source: row.source,
          seedId: row.id,
          lines: [],
        });
      }
      const group = map.get(key);
      group.lines.push(row);
      group.status = row.status;
    });
    return [...map.values()].map((g) => ({
      ...g,
      total: g.lines.reduce((s, l) => s + Number(l.line_total || (Number(l.unit_price || 0) * Number(l.quantity || 0))), 0),
    }));
  }, [specialOrders]);

  const reload = useCallback(async (status = statusFilter) => {
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
  }, [membershipId, statusFilter, fetchSpecialOrders]);

  const softReload = useCallback(async () => {
    if (!membershipId) return;
    await fetchSpecialOrders({
      parent_membership_id: membershipId,
      status: statusFilter || undefined,
    });
  }, [membershipId, statusFilter, fetchSpecialOrders]);

  useEffect(() => {
    reload(statusFilter);
  }, [membershipId, statusFilter]);

  useHmSpecialOrdersStream({
    enabled: Boolean(authToken && membershipId),
    scope: 'membership',
    parentMembershipId: membershipId,
    token: authToken,
    onEvent: softReload,
  });

  const advance = async (group) => {
    const next = NEXT_ACTION[group.status];
    if (!next) return;
    setBusyKey(group.key);
    try {
      const groupId = group.lines.find((l) => l.order_group_id)?.order_group_id || null;
      const result = await updateSpecialOrderStatus(group.seedId, next.status, {
        ...(groupId ? { orderGroupId: groupId } : {}),
      });
      if (result.success) {
        toast.success(`Order → ${statusLabel(next.status)}`);
        // Reload current filter; also briefly switch to target status so staff sees the result
        if (statusFilter && statusFilter !== next.status) {
          setStatusFilter(next.status);
        } else {
          reload(statusFilter);
        }
      } else toast.error(result.error || 'Update failed');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Special Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mark Order picked up to lock cancel → Process → Delivered.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['', 'NEW', 'ORDER_PICKED_UP', 'IN_PROCESS', 'DELIVERED', 'CANCELLED'].map((s) => (
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
              {s === '' ? 'All' : statusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading orders…</p>}

      <div className="space-y-3">
        {groupedOrders.map((g) => {
          const next = NEXT_ACTION[g.status];
          return (
            <article key={g.key} className="bg-white border rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {g.resident_name || 'Resident'} · {rs(g.total)}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    Txn: <strong>{g.transaction_ref || '—'}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {g.hostel_name} · {g.stay_label || '—'} · {g.meal_date}
                    {' · '}via {g.source}
                  </p>
                </div>
                <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[g.status] || 'bg-gray-100'}`}>
                  {statusLabel(g.status)}
                </span>
              </div>
              <ul className="space-y-1 border-t pt-2">
                {g.lines.map((line) => (
                  <li key={line.id} className="flex justify-between text-sm text-gray-700">
                    <span>{line.item_name} × {line.quantity}</span>
                    <span>{rs(line.line_total || (Number(line.unit_price || 0) * Number(line.quantity || 0)))}</span>
                  </li>
                ))}
              </ul>
              {g.notes && <p className="text-sm text-gray-600">Note: {g.notes}</p>}
              {next && canUpdate && (
                <button
                  type="button"
                  disabled={busyKey === g.key}
                  onClick={() => advance(g)}
                  className="bg-[#d62828] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60"
                >
                  {busyKey === g.key ? 'Updating…' : next.label}
                </button>
              )}
            </article>
          );
        })}
        {!loading && groupedOrders.length === 0 && (
          <p className="text-gray-500">No orders in this view.</p>
        )}
      </div>
    </div>
  );
};

export default HostelManagementKitchenOrdersPage;
