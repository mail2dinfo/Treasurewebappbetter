import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import HostelSelector from '../../components/hostelManagement/HostelSelector';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';
import { useUserContext } from '../../context/user_context';
import { useHmSpecialOrdersStream } from '../../components/hostelManagement/useHmSpecialOrdersStream';
import { HM_NAV_ANY } from '../../utils/hmPermissionCatalog';

const toDate = (d) => d.toISOString().slice(0, 10);
const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_STYLE = {
  NEW: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-indigo-100 text-indigo-800',
  ORDER_PICKED_UP: 'bg-purple-100 text-purple-800',
  IN_PROCESS: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
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
 * Special orders for Owner / Manager / Receptionist / Kitchen Staff:
 * view full queue + place orders on behalf of residents + advance status.
 */
const HostelManagementSpecialOrdersPage = () => {
  const {
    selectedHostelId,
    residents,
    fetchResidents,
    membershipId,
    createSpecialOrder,
    fetchSpecialOrders,
    specialOrders,
    fetchMealMenu,
    updateSpecialOrderStatus,
  } = useHostelManagement();
  const { user } = useUserContext();
  const authToken = user?.results?.token || localStorage.getItem('token') || '';
  const { can, canAny, enforceAccess, isHmOpsRole, roleCode } = useHmPermission();
  // Owner (USER) + Manager / Receptionist / Kitchen Staff can place on behalf + change status
  const canManageOrders = !enforceAccess
    || isHmOpsRole
    || can('hm_special_orders_view')
    || can('hm_special_orders_update')
    || canAny(HM_NAV_ANY.specialOrders)
    || String(roleCode || '').toUpperCase() === 'KITCHEN_STAFF';
  const canCreate = canManageOrders;
  const canUpdate = canManageOrders;

  const [form, setForm] = useState({
    residentId: '',
    mealDate: toDate(new Date()),
    categoryId: '',
    itemId: '',
    itemName: '',
    unitPrice: 0,
    notes: '',
    quantity: '1',
    transactionRef: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [menuCategories, setMenuCategories] = useState([]);

  const categories = useMemo(
    () => (menuCategories || []).filter((cat) => cat.status !== 0),
    [menuCategories]
  );

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === form.categoryId) || null,
    [categories, form.categoryId]
  );

  const categoryItems = useMemo(
    () => (selectedCategory?.items || []).filter((it) => it.status !== 0),
    [selectedCategory]
  );

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

  useEffect(() => {
    if (selectedHostelId) fetchResidents(selectedHostelId);
  }, [selectedHostelId]);

  // Always load full membership queue (all hostels + all statuses)
  const reloadOrders = useCallback(() => {
    if (!membershipId) return;
    fetchSpecialOrders({
      parent_membership_id: membershipId,
    });
  }, [membershipId, fetchSpecialOrders]);

  useEffect(() => {
    if (!membershipId) return;
    reloadOrders();
    fetchMealMenu(membershipId).then((result) => {
      if (result.success) setMenuCategories(result.data?.categories || []);
    });
  }, [membershipId]);

  useHmSpecialOrdersStream({
    enabled: Boolean(authToken && membershipId),
    scope: 'membership',
    parentMembershipId: membershipId,
    token: authToken,
    onEvent: reloadOrders,
  });

  const activeResidents = useMemo(
    () => (residents || []).filter((r) => r.status === 'ACTIVE'),
    [residents]
  );

  const onCategoryPick = (categoryId) => {
    setForm((prev) => ({ ...prev, categoryId, itemId: '', itemName: '', unitPrice: 0 }));
  };

  const onItemPick = (itemId) => {
    const picked = categoryItems.find((it) => it.id === itemId);
    setForm((prev) => ({
      ...prev,
      itemId,
      itemName: picked ? picked.name : '',
      unitPrice: picked ? Number(picked.price) || 0 : 0,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHostelId) return toast.error('Select hostel');
    if (!form.residentId) return toast.error('Select resident');
    if (!form.categoryId) return toast.error('Select a category');
    if (!form.itemName.trim()) return toast.error('Select an item');
    setSubmitting(true);
    try {
      const result = await createSpecialOrder({
        parentMembershipId: membershipId,
        hostelId: selectedHostelId,
        residentId: form.residentId,
        mealSlot: 'SPECIAL',
        mealDate: form.mealDate,
        mealItemId: form.itemId || null,
        itemName: selectedCategory
          ? `${selectedCategory.name} — ${form.itemName.trim()}`
          : form.itemName.trim(),
        unitPrice: form.unitPrice,
        notes: form.notes.trim() || null,
        quantity: Number(form.quantity) || 1,
        transactionRef: form.transactionRef.trim() || null,
        source: 'ADMIN',
      });
      if (result.success) {
        toast.success('Order placed for resident');
        setForm((prev) => ({
          ...prev,
          categoryId: '',
          itemId: '',
          itemName: '',
          unitPrice: 0,
          notes: '',
          quantity: '1',
          transactionRef: '',
        }));
        reloadOrders();
      } else toast.error(result.error || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const advance = async (group) => {
    const next = NEXT_ACTION[group.status];
    if (!next) return;
    setBusyId(group.key);
    try {
      const groupId = group.lines.find((l) => l.order_group_id)?.order_group_id || null;
      const result = await updateSpecialOrderStatus(group.seedId, next.status, {
        ...(groupId ? { orderGroupId: groupId } : {}),
      });
      if (result.success) {
        toast.success(`Order → ${statusLabel(next.status)}`);
        reloadOrders();
      } else toast.error(result.error || 'Update failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Special Orders</h1>
        <p className="text-sm text-gray-500">
          Full queue across all hostels and statuses. Residents can order in the app, or call you.
          Owner, Manager, Receptionist, and Kitchen Staff can place an order for a resident and update status
          (NEW → Order picked up → In process → Delivered).
        </p>
      </div>

      {canCreate && (
        <form onSubmit={onSubmit} className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <p className="md:col-span-2 text-xs font-semibold uppercase text-gray-500">
            Place order on behalf of resident (phone / desk)
          </p>
          <div className="md:col-span-2">
            <HostelSelector className="w-full" />
          </div>
          <select
            className="border rounded-lg px-3 py-2 md:col-span-2"
            required
            value={form.residentId}
            onChange={(e) => setForm({ ...form, residentId: e.target.value })}
          >
            <option value="">Select resident *</option>
            {activeResidents.map((r) => (
              <option key={r.id} value={r.id}>{r.name} · {r.phone || '—'}</option>
            ))}
          </select>
          <select
            className="border rounded-lg px-3 py-2"
            required
            value={form.categoryId}
            onChange={(e) => onCategoryPick(e.target.value)}
          >
            <option value="">Select category *</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select
            className="border rounded-lg px-3 py-2"
            required
            disabled={!form.categoryId}
            value={form.itemId}
            onChange={(e) => onItemPick(e.target.value)}
          >
            <option value="">{form.categoryId ? 'Select item *' : 'Select category first'}</option>
            {categoryItems.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name} · ₹{Number(it.price || 0).toLocaleString('en-IN')}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="border rounded-lg px-3 py-2"
            required
            value={form.mealDate}
            onChange={(e) => setForm({ ...form, mealDate: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2"
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2 md:col-span-2"
            placeholder="Transaction / UTR (if resident already paid)"
            value={form.transactionRef}
            onChange={(e) => setForm({ ...form, transactionRef: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2 md:col-span-2"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          {form.itemId && (
            <p className="md:col-span-2 text-sm text-gray-700">
              Line total: <strong>{rs(form.unitPrice * (Number(form.quantity) || 1))}</strong>
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || categories.length === 0}
            className="md:col-span-2 bg-[#d62828] text-white rounded-lg py-2.5 font-semibold disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Place order for resident'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {groupedOrders.map((g) => {
          const next = NEXT_ACTION[g.status];
          return (
            <article key={g.key} className="bg-white border rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{g.resident_name} · {rs(g.total)}</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {g.hostel_name || 'Hostel'} · {g.stay_label || '—'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {g.meal_date}
                    {g.transaction_ref ? ` · Txn ${g.transaction_ref}` : ''}
                    {g.source ? ` · ${g.source}` : ''}
                  </p>
                </div>
                <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[g.status] || 'bg-gray-100 text-gray-700'}`}>
                  {statusLabel(g.status)}
                </span>
              </div>
              <ul className="space-y-1 text-sm text-gray-700">
                {g.lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-2">
                    <span>{line.item_name} × {line.quantity}</span>
                    <span>{rs(line.line_total || (Number(line.unit_price || 0) * Number(line.quantity || 0)))}</span>
                  </li>
                ))}
              </ul>
              {g.notes && <p className="text-xs text-gray-500">Note: {g.notes}</p>}
              {next && canUpdate && (
                <button
                  type="button"
                  disabled={busyId === g.key}
                  onClick={() => advance(g)}
                  className="bg-[#d62828] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-60"
                >
                  {busyId === g.key ? 'Updating…' : next.label}
                </button>
              )}
            </article>
          );
        })}
        {groupedOrders.length === 0 && (
          <p className="text-gray-500 text-sm">No special orders yet.</p>
        )}
      </div>
    </div>
  );
};

export default HostelManagementSpecialOrdersPage;
