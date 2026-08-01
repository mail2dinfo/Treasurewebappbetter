import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiMinus, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import { useUserContext } from '../../context/user_context';
import { useHmSpecialOrdersStream } from '../../components/hostelManagement/useHmSpecialOrdersStream';

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

const statusLabel = (s) => {
  if (s === 'IN_PROCESS') return 'IN PROCESS';
  if (s === 'ORDER_PICKED_UP') return 'ORDER PICKED UP';
  if (s === 'CONFIRMED') return 'CONFIRMED';
  return s || '—';
};

/**
 * Resident: place own special orders (pay + UTR), or call hostel staff
 * (Owner / Manager / Receptionist / Kitchen) to place on their behalf.
 * Cancel allowed while NEW. Locked after staff marks Order picked up.
 */
const HostelManagementResidentSpecialOrdersPage = () => {
  const {
    myResidentProfile,
    createSpecialOrder,
    mySpecialOrders,
    fetchMealMenu,
    cancelSpecialOrder,
  } = useHostelManagement();
  const { user } = useUserContext();
  const authToken = user?.results?.token || localStorage.getItem('token') || '';
  const [resident, setResident] = useState(null);
  const [hostelPay, setHostelPay] = useState(null);
  const [orders, setOrders] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [cart, setCart] = useState([]);
  const [mealDate, setMealDate] = useState(toDate(new Date()));
  const [notes, setNotes] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const categories = useMemo(
    () => (menuCategories || []).filter((cat) => cat.status !== 0),
    [menuCategories]
  );

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === selectedCategoryId) || categories[0] || null,
    [categories, selectedCategoryId]
  );

  const categoryItems = useMemo(
    () => (selectedCategory?.items || []).filter((it) => it.status !== 0),
    [selectedCategory]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, row) => sum + Number(row.unitPrice || 0) * Number(row.quantity || 0), 0),
    [cart]
  );

  const groupedOrders = useMemo(() => {
    const map = new Map();
    const rank = {
      NEW: 1,
      CONFIRMED: 2,
      ORDER_PICKED_UP: 3,
      IN_PROCESS: 4,
      DELIVERED: 5,
      CANCELLED: 0,
    };
    (orders || []).forEach((row) => {
      const key = row.order_group_id || row.id;
      if (!map.has(key)) {
        map.set(key, {
          key,
          status: row.status,
          meal_date: row.meal_date,
          transaction_ref: row.transaction_ref,
          notes: row.notes,
          created_at: row.created_at,
          lines: [],
        });
      }
      const group = map.get(key);
      group.lines.push(row);
      // Prefer the furthest progressed status among lines (so Delivered wins over In process)
      const cur = String(group.status || '').toUpperCase();
      const next = String(row.status || '').toUpperCase();
      if ((rank[next] || 0) >= (rank[cur] || 0)) group.status = next;
    });
    return [...map.values()].map((g) => ({
      ...g,
      total: g.lines.reduce((s, l) => s + Number(l.line_total || (Number(l.unit_price || 0) * Number(l.quantity || 0))), 0),
      seedId: g.lines[0]?.id,
    }));
  }, [orders]);

  const load = async () => {
    setLoading(true);
    try {
      const profile = await myResidentProfile();
      if (profile.success) {
        setResident(profile.data);
        setHostelPay(profile.data?.hostel || {
          phonepe_number: profile.data?.phonepe_number,
          upi_id: profile.data?.upi_id,
          payment_qr_url: profile.data?.payment_qr_url,
          payment_qr_url_s3_image: profile.data?.payment_qr_url_s3_image,
          hostel_name: profile.data?.hostel?.hostel_name,
        });
        const menu = await fetchMealMenu(profile.data?.parent_membership_id);
        if (menu.success) {
          const cats = menu.data?.categories || [];
          setMenuCategories(cats);
          if (!selectedCategoryId && cats[0]?.id) setSelectedCategoryId(cats[0].id);
        }
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

  const refreshOrders = useCallback(async () => {
    if (document.visibilityState === 'hidden') return;
    const list = await mySpecialOrders();
    if (list.success) setOrders(list.data || []);
  }, [mySpecialOrders]);

  // Live status updates from kitchen (SSE); light refresh on tab focus / reconnect
  useHmSpecialOrdersStream({
    enabled: Boolean(authToken),
    scope: 'resident',
    token: authToken,
    onEvent: refreshOrders,
  });

  useEffect(() => {
    const onFocus = () => refreshOrders();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refreshOrders]);

  const addToCart = (item) => {
    if (!selectedCategory || !item?.id) return;
    const unitPrice = Number(item.price) || 0;
    setCart((prev) => {
      const existing = prev.find((row) => row.itemId === item.id);
      if (existing) {
        return prev.map((row) => (
          row.itemId === item.id
            ? { ...row, quantity: Number(row.quantity) + 1 }
            : row
        ));
      }
      return [
        ...prev,
        {
          itemId: item.id,
          categoryId: selectedCategory.id,
          categoryName: selectedCategory.name,
          itemName: item.name,
          unitPrice,
          quantity: 1,
        },
      ];
    });
  };

  const setCartQty = (itemId, quantity) => {
    const qty = Math.max(1, Number(quantity) || 1);
    setCart((prev) => prev.map((row) => (row.itemId === itemId ? { ...row, quantity: qty } : row)));
  };

  const bumpQty = (itemId, delta) => {
    setCart((prev) => prev.map((row) => {
      if (row.itemId !== itemId) return row;
      return { ...row, quantity: Math.max(1, Number(row.quantity) + delta) };
    }));
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((row) => row.itemId !== itemId));
  };

  const openPayModal = () => {
    if (cart.length === 0) return toast.error('Add at least one item to your order');
    if (!mealDate) return toast.error('Select order date');
    setTransactionRef('');
    setPayOpen(true);
  };

  const confirmOrder = async () => {
    if (!transactionRef.trim()) return toast.error('Enter transaction / UTR number after payment');
    setSubmitting(true);
    try {
      const result = await createSpecialOrder({
        mealDate,
        mealSlot: 'SPECIAL',
        notes: notes.trim() || null,
        transactionRef: transactionRef.trim(),
        source: 'RESIDENT',
        items: cart.map((row) => ({
          mealItemId: row.itemId,
          itemName: `${row.categoryName} — ${row.itemName}`,
          quantity: Number(row.quantity) || 1,
          unitPrice: Number(row.unitPrice) || 0,
        })),
      });
      if (result.success) {
        toast.success(`Order confirmed · Total ${rs(result.data?.order_total ?? cartTotal)}`);
        setCart([]);
        setNotes('');
        setTransactionRef('');
        setPayOpen(false);
        load();
      } else toast.error(result.error || 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async (group) => {
    if (group.status !== 'NEW') {
      toast.error('Cannot cancel after order is picked up');
      return;
    }
    if (!window.confirm('Cancel this order?')) return;
    setCancellingId(group.seedId);
    try {
      const result = await cancelSpecialOrder(group.seedId);
      if (result.success) {
        toast.success('Order cancelled');
        load();
      } else toast.error(result.error || 'Cancel failed');
    } finally {
      setCancellingId(null);
    }
  };

  const qrSrc = hostelPay?.payment_qr_url_s3_image || hostelPay?.payment_qr_url || null;
  const hostelPhone = hostelPay?.contact_phone || resident?.contact_phone || null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 w-full">
        <div className="min-w-0 flex-1 pr-2">
          <h1 className="text-2xl font-bold text-gray-900">Special orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Order here yourself (pay + enter transaction number), or call the hostel desk /
            kitchen and staff will place the order for you. You can cancel until staff marks
            Order picked up.
          </p>
          {hostelPhone && (
            <p className="text-sm text-gray-700 mt-1">
              Call:{' '}
              <a className="font-semibold text-[#d62828] hover:underline" href={`tel:${String(hostelPhone).replace(/\s/g, '')}`}>
                {hostelPhone}
              </a>
            </p>
          )}
          {resident && (
            <p className="text-xs text-gray-400 mt-1">
              {[resident.floor_name, resident.room_number ? `Room ${resident.room_number}` : null, resident.bed_label ? `Bed ${resident.bed_label}` : null]
                .filter(Boolean)
                .join(' · ') || 'Stay details on file'}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={cart.length === 0 || categories.length === 0}
          onClick={openPayModal}
          className="ml-auto shrink-0 self-start bg-[#d62828] text-white rounded-lg px-4 py-2.5 font-semibold hover:bg-red-700 disabled:opacity-60 whitespace-nowrap"
        >
          {`Place order${cart.length ? ` · ${rs(cartTotal)}` : ''}`}
        </button>
      </div>

      {categories.length === 0 && !loading && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          No menu categories yet. Ask the hostel to add them under Admin Settings → Meal menu.
        </p>
      )}

      {categories.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <section className="lg:col-span-3 bg-white border rounded-xl p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                    selectedCategory?.id === cat.id
                      ? 'bg-red-50 border-red-400 text-red-800'
                      : 'border-gray-200 text-gray-700 hover:border-red-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {categoryItems.map((item) => {
                const inCart = cart.find((row) => row.itemId === item.id);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {item.name}
                        <span className="ml-2 text-gray-800 font-semibold">{rs(item.price)}</span>
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-500">{item.description}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-white bg-[#d62828] hover:bg-red-700 rounded-lg px-3 py-1.5"
                    >
                      <FiPlus className="h-4 w-4" />
                      {inCart ? `Add (${inCart.quantity})` : 'Add'}
                    </button>
                  </div>
                );
              })}
              {categoryItems.length === 0 && (
                <p className="text-sm text-gray-500">No items in this category yet.</p>
              )}
            </div>
          </section>

          <section className="lg:col-span-2 bg-white border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-gray-900">Your order</h2>
              <span className="text-sm font-bold text-gray-900">{rs(cartTotal)}</span>
            </div>

            <label className="block text-xs text-gray-600">
              Order date
              <input
                type="date"
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={mealDate}
                onChange={(e) => setMealDate(e.target.value)}
              />
            </label>

            {cart.length === 0 ? (
              <p className="text-sm text-gray-500 py-6 text-center border border-dashed rounded-lg">
                Add items from the menu
              </p>
            ) : (
              <ul className="space-y-2">
                {cart.map((row) => (
                  <li key={row.itemId} className="border rounded-lg p-2.5 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{row.itemName}</p>
                        <p className="text-[11px] text-gray-500">
                          {row.categoryName} · {rs(row.unitPrice)} each
                        </p>
                      </div>
                      <button
                        type="button"
                        className="text-red-600 p-1"
                        title="Remove"
                        onClick={() => removeFromCart(row.itemId)}
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button type="button" className="border rounded p-1" onClick={() => bumpQty(row.itemId, -1)}>
                          <FiMinus className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          className="w-14 border rounded px-2 py-1 text-sm text-center"
                          value={row.quantity}
                          onChange={(e) => setCartQty(row.itemId, e.target.value)}
                        />
                        <button type="button" className="border rounded p-1" onClick={() => bumpQty(row.itemId, 1)}>
                          <FiPlus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">{rs(row.unitPrice * row.quantity)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t pt-2 flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>{rs(cartTotal)}</span>
            </div>

            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Notes for kitchen (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </section>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold text-gray-800">Your orders</h2>
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        {!loading && groupedOrders.length === 0 && (
          <p className="text-sm text-gray-500">No special orders yet.</p>
        )}
        {groupedOrders.map((g) => (
          <article key={g.key} className="bg-white border rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="text-sm text-gray-500">
                  {g.meal_date}
                  {g.transaction_ref ? ` · Txn ${g.transaction_ref}` : ''}
                </p>
                <p className="font-bold text-gray-900 mt-0.5">Total {rs(g.total)}</p>
              </div>
              <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[g.status] || 'bg-gray-100 text-gray-700'}`}>
                {statusLabel(g.status)}
              </span>
            </div>
            <ul className="space-y-1">
              {g.lines.map((line) => (
                <li key={line.id} className="flex justify-between text-sm text-gray-700">
                  <span>{line.item_name} × {line.quantity}</span>
                  <span>{rs(line.line_total || (Number(line.unit_price || 0) * Number(line.quantity || 0)))}</span>
                </li>
              ))}
            </ul>
            {g.notes && <p className="text-xs text-gray-500">Note: {g.notes}</p>}
            {g.status === 'NEW' && (
              <button
                type="button"
                disabled={cancellingId === g.seedId}
                onClick={() => onCancel(g)}
                className="text-sm font-semibold text-red-700 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-60"
              >
                {cancellingId === g.seedId ? 'Cancelling…' : 'Cancel order'}
              </button>
            )}
            {g.status !== 'NEW' && g.status !== 'CANCELLED' && (
              <p className="text-xs text-gray-500">Order picked up — cancellation is no longer available.</p>
            )}
          </article>
        ))}
      </section>

      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="font-bold text-gray-900">Pay &amp; confirm order</h2>
              <button type="button" className="p-1 text-gray-500" onClick={() => !submitting && setPayOpen(false)}>
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 space-y-1">
                <p className="text-sm font-semibold text-gray-900">Amount to pay: {rs(cartTotal)}</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  {cart.map((row) => (
                    <li key={row.itemId} className="flex justify-between gap-2">
                      <span>{row.itemName} × {row.quantity}</span>
                      <span>{rs(row.unitPrice * row.quantity)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border p-3 space-y-2 text-sm">
                <p className="font-semibold text-gray-900">Scan &amp; pay</p>
                <p>PhonePe: <strong>{hostelPay?.phonepe_number || '—'}</strong></p>
                <p>UPI: <strong>{hostelPay?.upi_id || '—'}</strong></p>
                {qrSrc ? (
                  <div className="flex justify-center pt-2">
                    <img src={qrSrc} alt="Hostel payment QR" className="w-44 h-44 object-contain border rounded-lg bg-white" />
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">QR not set for this hostel. Use PhonePe / UPI above.</p>
                )}
              </div>

              <label className="block text-xs text-gray-600">
                Transaction / UTR number *
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter after payment"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  autoFocus
                />
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setPayOpen(false)}
                  className="flex-1 border rounded-lg py-2.5 text-sm font-semibold text-gray-700"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={confirmOrder}
                  className="flex-1 bg-[#d62828] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {submitting ? 'Confirming…' : `Confirm order · ${rs(cartTotal)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostelManagementResidentSpecialOrdersPage;
