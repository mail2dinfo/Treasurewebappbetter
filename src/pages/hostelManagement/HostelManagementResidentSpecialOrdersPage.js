import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';

const toDate = (d) => d.toISOString().slice(0, 10);

const STATUS_STYLE = {
  NEW: 'bg-amber-100 text-amber-800',
  IN_PROCESS: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
};

const emptyForm = {
  mealSlot: 'LUNCH',
  mealDate: toDate(new Date()),
  itemName: '',
  notes: '',
  quantity: '1',
};

/**
 * Resident places special kitchen orders and tracks status.
 */
const HostelManagementResidentSpecialOrdersPage = () => {
  const { myResidentProfile, createSpecialOrder, mySpecialOrders } = useHostelManagement();
  const [resident, setResident] = useState(null);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const profile = await myResidentProfile();
      if (profile.success) setResident(profile.data);
      const list = await mySpecialOrders();
      if (list.success) setOrders(list.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.itemName.trim()) return toast.error('Enter item / dish name');
    setSubmitting(true);
    try {
      const result = await createSpecialOrder({
        mealSlot: form.mealSlot,
        mealDate: form.mealDate,
        itemName: form.itemName.trim(),
        notes: form.notes.trim() || null,
        quantity: Number(form.quantity) || 1,
        source: 'RESIDENT',
      });
      if (result.success) {
        toast.success('Special order placed');
        setForm({ ...emptyForm, mealDate: form.mealDate });
        load();
      } else toast.error(result.error || 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Special orders</h1>
        <p className="text-sm text-gray-500 mt-1">
          Request extras from the kitchen. Track NEW → In process → Delivered.
        </p>
        {resident && (
          <p className="text-xs text-gray-400 mt-1">
            {[resident.floor_name, resident.room_number ? `Room ${resident.room_number}` : null, resident.bed_label ? `Bed ${resident.bed_label}` : null]
              .filter(Boolean)
              .join(' · ') || 'Stay details on file'}
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
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
          step="1"
          placeholder="Qty"
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
          className="md:col-span-2 bg-[#d62828] text-white rounded-lg py-2.5 font-semibold hover:bg-red-700 disabled:opacity-60"
        >
          {submitting ? 'Placing…' : 'Place special order'}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-800">Your orders</h2>
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {!loading && orders.length === 0 && (
          <p className="text-sm text-gray-500">No special orders yet.</p>
        )}
        {orders.map((o) => (
          <article key={o.id} className="bg-white border rounded-xl p-4 flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{o.item_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {o.meal_slot} · {o.meal_date} · Qty {o.quantity}
                {o.notes ? ` · ${o.notes}` : ''}
              </p>
            </div>
            <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[o.status] || 'bg-gray-100 text-gray-700'}`}>
              {o.status === 'IN_PROCESS' ? 'IN PROCESS' : o.status}
            </span>
          </article>
        ))}
      </section>
    </div>
  );
};

export default HostelManagementResidentSpecialOrdersPage;
