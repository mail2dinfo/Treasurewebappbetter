import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import HostelSelector from '../../components/hostelManagement/HostelSelector';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';

const toDate = (d) => d.toISOString().slice(0, 10);

const STATUS_STYLE = {
  NEW: 'bg-amber-100 text-amber-800',
  IN_PROCESS: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
};

/**
 * Admin / Receptionist: place special orders for residents + view hostel queue.
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
  } = useHostelManagement();
  const { can } = useHmPermission();
  const canCreate = can('hm_meals_view') || can('hm_resident_view') || can('hm_resident_create');

  const [form, setForm] = useState({
    residentId: '',
    mealSlot: 'LUNCH',
    mealDate: toDate(new Date()),
    itemName: '',
    notes: '',
    quantity: '1',
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedHostelId) fetchResidents(selectedHostelId);
  }, [selectedHostelId]);

  useEffect(() => {
    if (!membershipId) return;
    fetchSpecialOrders({
      parent_membership_id: membershipId,
      hostel_id: selectedHostelId || undefined,
      status: statusFilter || undefined,
    });
  }, [membershipId, selectedHostelId, statusFilter]);

  const activeResidents = useMemo(
    () => (residents || []).filter((r) => r.status === 'ACTIVE'),
    [residents]
  );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHostelId) return toast.error('Select hostel');
    if (!form.residentId) return toast.error('Select resident');
    if (!form.itemName.trim()) return toast.error('Enter item name');
    setSubmitting(true);
    try {
      const result = await createSpecialOrder({
        parentMembershipId: membershipId,
        hostelId: selectedHostelId,
        residentId: form.residentId,
        mealSlot: form.mealSlot,
        mealDate: form.mealDate,
        itemName: form.itemName.trim(),
        notes: form.notes.trim() || null,
        quantity: Number(form.quantity) || 1,
        source: 'ADMIN',
      });
      if (result.success) {
        toast.success('Special order created');
        setForm((prev) => ({ ...prev, itemName: '', notes: '', quantity: '1' }));
        fetchSpecialOrders({
          parent_membership_id: membershipId,
          hostel_id: selectedHostelId || undefined,
          status: statusFilter || undefined,
        });
      } else toast.error(result.error || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Special Orders</h1>
          <p className="text-sm text-gray-500">Place kitchen orders for residents; kitchen staff will process them.</p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="NEW">NEW</option>
            <option value="IN_PROCESS">IN PROCESS</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>
          <HostelSelector />
        </div>
      </div>

      {canCreate && (
        <form onSubmit={onSubmit} className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
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
            value={form.mealSlot}
            onChange={(e) => setForm({ ...form, mealSlot: e.target.value })}
          >
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="DINNER">Dinner</option>
          </select>
          <input
            type="date"
            className="border rounded-lg px-3 py-2"
            required
            value={form.mealDate}
            onChange={(e) => setForm({ ...form, mealDate: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2 md:col-span-2"
            placeholder="Item / dish *"
            required
            value={form.itemName}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2"
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-2 bg-[#d62828] text-white rounded-lg py-2.5 font-semibold disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Create special order'}
          </button>
        </form>
      )}

      <div className="space-y-3">
        {(specialOrders || []).map((o) => (
          <article key={o.id} className="bg-white border rounded-xl p-4 flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{o.item_name}</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {o.resident_name} · {o.hostel_name || 'Hostel'} · {o.stay_label || '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {o.meal_slot} · {o.meal_date} · Qty {o.quantity} · via {o.source}
                {o.notes ? ` · ${o.notes}` : ''}
              </p>
            </div>
            <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[o.status] || 'bg-gray-100'}`}>
              {o.status === 'IN_PROCESS' ? 'IN PROCESS' : o.status}
            </span>
          </article>
        ))}
        {(!specialOrders || specialOrders.length === 0) && (
          <p className="text-gray-500 text-sm">No special orders for this filter.</p>
        )}
      </div>
    </div>
  );
};

export default HostelManagementSpecialOrdersPage;
