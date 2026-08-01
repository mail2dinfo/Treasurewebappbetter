import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';

const toDate = (d) => d.toISOString().slice(0, 10);

const STATUS_STYLE = {
  NEW: 'bg-amber-100 text-amber-800',
  IN_PROCESS: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
};

const MEAL_SLOT_KEYS = new Set(['breakfast', 'lunch', 'dinner']);

const emptyForm = {
  mealSlot: 'LUNCH',
  mealDate: toDate(new Date()),
  itemId: '',
  itemName: '',
  notes: '',
  quantity: '1',
};

/**
 * Resident places special kitchen orders (juices / extras from meal menu) and tracks status.
 */
const HostelManagementResidentSpecialOrdersPage = () => {
  const {
    myResidentProfile,
    createSpecialOrder,
    mySpecialOrders,
    fetchMealMenu,
  } = useHostelManagement();
  const [resident, setResident] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const specialItems = useMemo(() => {
    const rows = [];
    (menuCategories || []).forEach((cat) => {
      const slot = String(cat.slot_key || 'custom').toLowerCase();
      if (MEAL_SLOT_KEYS.has(slot)) return;
      (cat.items || [])
        .filter((it) => it.status !== 0)
        .forEach((it) => {
          rows.push({
            id: it.id,
            name: it.name,
            categoryName: cat.name,
            slotKey: slot,
          });
        });
    });
    return rows;
  }, [menuCategories]);

  const load = async () => {
    setLoading(true);
    try {
      const profile = await myResidentProfile();
      if (profile.success) {
        setResident(profile.data);
        const menu = await fetchMealMenu(profile.data?.parent_membership_id);
        if (menu.success) setMenuCategories(menu.data?.categories || []);
      }
      const list = await mySpecialOrders();
      if (list.success) setOrders(list.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onItemPick = (itemId) => {
    const picked = specialItems.find((it) => it.id === itemId);
    setForm((prev) => ({
      ...prev,
      itemId,
      itemName: picked ? picked.name : '',
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const name = form.itemName.trim();
    if (!name) return toast.error('Select an item from the menu');
    setSubmitting(true);
    try {
      const result = await createSpecialOrder({
        mealSlot: form.mealSlot,
        mealDate: form.mealDate,
        itemName: name,
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
          Order juices and other extras from the hostel menu. Breakfast / Lunch / Dinner stay under week meal availability.
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
          <option value="BREAKFAST">With Breakfast</option>
          <option value="LUNCH">With Lunch</option>
          <option value="DINNER">With Dinner</option>
        </select>
        <input
          type="date"
          className="border rounded-lg px-3 py-2"
          required
          value={form.mealDate}
          onChange={(e) => setForm({ ...form, mealDate: e.target.value })}
        />
        <select
          className="border rounded-lg px-3 py-2 md:col-span-2"
          required
          value={form.itemId}
          onChange={(e) => onItemPick(e.target.value)}
        >
          <option value="">Select juice / extra item *</option>
          {specialItems.map((it) => (
            <option key={it.id} value={it.id}>
              {it.categoryName} — {it.name}
            </option>
          ))}
        </select>
        {specialItems.length === 0 && (
          <p className="md:col-span-2 text-xs text-amber-700">
            No special-order items yet. Ask the hostel to add Juices or other categories under Admin Settings → Meal menu.
          </p>
        )}
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
          disabled={submitting || specialItems.length === 0}
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
