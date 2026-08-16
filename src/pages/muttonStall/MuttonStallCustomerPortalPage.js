import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FiCheck, FiClock, FiPackage, FiTruck, FiMapPin, FiShoppingBag, FiRefreshCw,
  FiMinus, FiPlus,
} from 'react-icons/fi';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { useMsOrdersStream } from '../../components/muttonStall/useMsOrdersStream';
import { MS_CUSTOMER_BASE_PATH } from '../../components/muttonStall/muttonStallMenuItems';
import { formatUnitLabel, isCountUnit, unitMeta } from '../../utils/msProductUnits';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const STATUS_FLOW = ['NEW', 'PICKED', 'PREPARING', 'ARRIVAL', 'DELIVERED'];

const STATUS_META = {
  NEW: { label: 'Received', hint: 'Stall got your order', Icon: FiClock, tone: 'amber' },
  PICKED: { label: 'Picked', hint: 'Items picked for you', Icon: FiPackage, tone: 'indigo' },
  PREPARING: { label: 'Preparing', hint: 'Being packed', Icon: FiShoppingBag, tone: 'sky' },
  ARRIVAL: { label: 'Ready', hint: 'Ready for pickup / on the way', Icon: FiMapPin, tone: 'violet' },
  DELIVERED: { label: 'Delivered', hint: 'Completed', Icon: FiCheck, tone: 'emerald' },
  CANCELLED: { label: 'Cancelled', hint: 'This order was cancelled', Icon: FiClock, tone: 'stone' },
};

const toneClass = {
  amber: { chip: 'bg-amber-100 text-amber-900 ring-amber-200', bar: 'bg-amber-500', soft: 'from-amber-50 to-white' },
  indigo: { chip: 'bg-indigo-100 text-indigo-900 ring-indigo-200', bar: 'bg-indigo-500', soft: 'from-indigo-50 to-white' },
  sky: { chip: 'bg-sky-100 text-sky-900 ring-sky-200', bar: 'bg-sky-500', soft: 'from-sky-50 to-white' },
  violet: { chip: 'bg-violet-100 text-violet-900 ring-violet-200', bar: 'bg-violet-500', soft: 'from-violet-50 to-white' },
  emerald: { chip: 'bg-emerald-100 text-emerald-900 ring-emerald-200', bar: 'bg-emerald-500', soft: 'from-emerald-50 to-white' },
  stone: { chip: 'bg-stone-200 text-stone-700 ring-stone-300', bar: 'bg-stone-400', soft: 'from-stone-50 to-white' },
};

const formatWhen = (order) => {
  const raw = order.order_date || order.created_at || '';
  const d = raw ? new Date(String(raw).length <= 10 ? `${raw}T12:00:00` : raw) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatTime = (order) => {
  const raw = order.status_updated_at || order.created_at;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Logged-in customer ordering — common /mutton-stall/customer path for all customers.
 */
const MuttonStallCustomerPortalPage = () => {
  const location = useLocation();
  const history = useHistory();
  const { user } = useUserContext();
  const platform = usePlatformAccess();
  const token = user?.results?.token || localStorage.getItem('token') || '';
  const membershipId = platform?.activeContext?.parentMembershipId
    || user?.results?.userAccounts?.[0]?.parent_membership_id
    || localStorage.getItem('ms_parent_membership_id')
    || '';

  const isOrdersRoute = (location.pathname || '').endsWith('/orders');
  const [catalog, setCatalog] = useState({ stall: null, categories: [], products: [], customer: null });
  const [myOrders, setMyOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [liveFlash, setLiveFlash] = useState(false);
  const [orderFilter, setOrderFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState('');

  const api = useCallback(async (path, options = {}) => {
    if (!token) return { success: false, error: 'Please log in' };
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      return { success: false, error: data.message || data.error || 'Request failed', data };
    }
    return { success: true, data: data.results ?? data.data ?? data };
  }, [token]);

  const membershipQs = membershipId ? `?parent_membership_id=${membershipId}` : '';

  const loadCatalog = useCallback(async () => {
    const result = await api(`/ms/me/catalog${membershipQs}`);
    if (result.success) {
      const payload = result.data || {};
      setCatalog({
        stall: payload.stall || null,
        categories: payload.categories || [],
        products: payload.products || [],
        customer: payload.customer || null,
      });
      if (payload.stall?.parent_membership_id || payload.customer) {
        try {
          const mid = payload.stall?.parent_membership_id
            || (await api(`/ms/me${membershipQs}`))?.data?.parent_membership_id;
          if (mid) localStorage.setItem('ms_parent_membership_id', String(mid));
        } catch {
          // ignore
        }
      }
      setError('');
    } else {
      setError(result.error || 'Customer profile not found for this login');
    }
  }, [api, membershipQs]);

  const loadOrders = useCallback(async () => {
    const result = await api(`/ms/me/orders${membershipQs}`);
    if (result.success) setMyOrders(result.data || []);
  }, [api, membershipQs]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCatalog(), loadOrders()]).finally(() => setLoading(false));
  }, [loadCatalog, loadOrders]);

  useMsOrdersStream({
    enabled: Boolean(token),
    scope: 'customer',
    parentMembershipId: membershipId || undefined,
    token,
    onEvent: (payload) => {
      if (payload?.action && payload.action !== 'connected') {
        setLiveFlash(true);
        setTimeout(() => setLiveFlash(false), 1200);
      }
      loadOrders();
    },
  });

  const productsByCategory = useMemo(() => {
    const map = new Map();
    (catalog.products || []).forEach((p) => {
      if (p.is_active === false) return;
      const key = p.category_id || p.categoryId || 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    return map;
  }, [catalog.products]);

  const cartLines = useMemo(() => Object.entries(cart)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([productId, qty]) => {
      const product = (catalog.products || []).find((p) => String(p.id) === String(productId));
      const price = Number(product?.selling_price ?? product?.sellingPrice ?? 0);
      return {
        productId,
        name: product?.name || 'Item',
        unit: product?.unit || 'kg',
        qty: Number(qty),
        unitPrice: price,
        lineTotal: price * Number(qty),
      };
    }), [cart, catalog.products]);

  const cartTotal = cartLines.reduce((s, l) => s + l.lineTotal, 0);

  const categoryTabs = useMemo(() => {
    const cats = (catalog.categories || []).filter((c) => (productsByCategory.get(c.id) || []).length > 0);
    return [{ id: 'all', name: 'All' }, ...cats.map((c) => ({ id: c.id, name: c.name }))];
  }, [catalog.categories, productsByCategory]);

  const visibleCategories = useMemo(() => {
    const cats = catalog.categories || [];
    if (categoryFilter === 'all') return cats;
    return cats.filter((c) => String(c.id) === String(categoryFilter));
  }, [catalog.categories, categoryFilter]);

  const uncategorizedProducts = useMemo(() => {
    if ((catalog.categories || []).length) return [];
    return catalog.products || [];
  }, [catalog.categories, catalog.products]);

  const filteredOrders = useMemo(() => {
    const rows = myOrders || [];
    if (orderFilter === 'all') return rows;
    if (orderFilter === 'done') {
      return rows.filter((o) => ['DELIVERED', 'CANCELLED'].includes(String(o.status || '').toUpperCase()));
    }
    return rows.filter((o) => !['DELIVERED', 'CANCELLED'].includes(String(o.status || '').toUpperCase()));
  }, [myOrders, orderFilter]);

  const activeCount = (myOrders || []).filter(
    (o) => !['DELIVERED', 'CANCELLED'].includes(String(o.status || '').toUpperCase())
  ).length;

  const setQty = (productId, qty) => {
    const n = Math.max(0, Number(qty) || 0);
    setCart((prev) => {
      const next = { ...prev };
      if (n <= 0) delete next[productId];
      else next[productId] = n;
      return next;
    });
  };

  const placeOrder = async () => {
    if (!cartLines.length) return toast.error('Add items to cart');
    setSubmitting(true);
    const result = await api(`/ms/me/orders`, {
      method: 'POST',
      body: JSON.stringify({
        parentMembershipId: membershipId || undefined,
        notes: notes.trim() || null,
        items: cartLines.map((l) => {
          const count = isCountUnit(l.unit);
          return {
            productId: l.productId,
            qty: count ? Math.max(1, Math.round(l.qty)) : l.qty,
            unitPrice: l.unitPrice,
          };
        }),
      }),
    });
    setSubmitting(false);
    if (result.success) {
      toast.success('Order placed');
      setCart({});
      setNotes('');
      history.push(`${MS_CUSTOMER_BASE_PATH}/orders`);
      loadOrders();
    } else toast.error(result.error || 'Failed to place order');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const stallName = catalog.stall?.name || 'Mutton Stall';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-stone-500">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center shadow-sm">
          <h1 className="text-lg font-bold text-stone-900">Stall access not found</h1>
          <p className="mt-2 text-sm text-stone-600">{error}</p>
          <p className="mt-3 text-xs text-stone-500">
            Ask the stall owner to add your phone as a customer, then log in again.
          </p>
        </div>
      </div>
    );
  }

  /* ─── Orders route: dedicated tracking UI ─── */
  if (isOrdersRoute) {
    return (
      <div className="min-h-[calc(100vh-112px)] bg-[radial-gradient(ellipse_at_top,_#faf6f3_0%,_#f5f5f4_55%)]">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-10 space-y-5">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-800/80">
                Live tracking
              </p>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-0.5">My orders</h1>
              <p className="text-sm text-stone-500 mt-1">
                {catalog.customer?.name ? `Hi ${catalog.customer.name} · ` : ''}
                {stallName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                  liveFlash
                    ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
                    : 'bg-white text-stone-600 ring-stone-200'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${liveFlash ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'}`} />
                Live
              </span>
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                title="Refresh"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </header>

          {activeCount > 0 && (
            <div className="rounded-2xl bg-gradient-to-r from-rose-900 to-stone-900 text-white px-4 py-3.5 shadow-md">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <FiTruck className="w-5 h-5 text-rose-100" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {activeCount} active order{activeCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-rose-100/90 mt-0.5">
                    Status updates automatically as the stall progresses your order
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="inline-flex rounded-xl bg-white/80 border border-stone-200 p-1 shadow-sm">
            {[
              { id: 'active', label: 'In progress' },
              { id: 'done', label: 'Completed' },
              { id: 'all', label: 'All' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setOrderFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  orderFilter === f.id
                    ? 'bg-rose-800 text-white shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <OrderTrackCard key={order.id} order={order} />
            ))}
            {!filteredOrders.length && (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-800">
                  <FiClipboardIcon />
                </div>
                <h2 className="text-base font-semibold text-stone-900">
                  {orderFilter === 'active' ? 'No orders in progress' : 'No orders here yet'}
                </h2>
                <p className="mt-1 text-sm text-stone-500 max-w-xs mx-auto">
                  {orderFilter === 'active'
                    ? 'Place an order from the menu — you’ll see live status here.'
                    : 'Your past orders will show up in this list.'}
                </p>
                <Link
                  to={`${MS_CUSTOMER_BASE_PATH}/order`}
                  className="inline-flex items-center gap-2 mt-5 bg-rose-800 hover:bg-rose-900 text-white rounded-xl px-4 py-2.5 text-sm font-semibold"
                >
                  <FiShoppingBag className="w-4 h-4" />
                  Order now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Menu / order placement — left menu, right summary ─── */
  const summaryPanel = (
    <aside className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden flex flex-col max-h-[min(70vh,640px)] lg:max-h-[calc(100vh-10rem)]">
      <div className="px-4 py-3.5 border-b border-stone-100 bg-gradient-to-r from-rose-900 to-stone-900 text-white">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-100/90">
              Your order
            </p>
            <h2 className="text-base font-bold mt-0.5">Order summary</h2>
          </div>
          {cartLines.length > 0 && (
            <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg bg-white/15 px-2 text-sm font-bold tabular-nums">
              {cartLines.length}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-[8rem]">
        {!cartLines.length && (
          <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
            <FiShoppingBag className="w-6 h-6 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-600">Nothing added yet</p>
            <p className="text-xs text-stone-400 mt-1">
              Add kg / qty from the menu on the left
            </p>
          </div>
        )}
        {cartLines.map((line) => (
          <div
            key={line.productId}
            className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">{line.name}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {rs(line.unitPrice)} / {formatUnitLabel(line.unit)}
                </p>
              </div>
              <span className="text-sm font-bold tabular-nums text-stone-900 shrink-0">
                {rs(line.lineTotal)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-stone-500">
                {Number(line.qty)} {formatUnitLabel(line.unit)}
              </span>
              <QtyStepper
                qty={line.qty}
                unit={line.unit}
                onQty={(q) => setQty(line.productId, q)}
                compact
              />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-stone-100 px-3 py-3 space-y-2.5 bg-white">
        <input
          className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm bg-stone-50 focus:outline-none focus:ring-2 focus:ring-rose-800/20 focus:border-rose-300"
          placeholder="Notes for the stall (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex items-center justify-between px-0.5">
          <span className="text-sm text-stone-500">Total</span>
          <span className="text-lg font-bold tabular-nums text-stone-900">{rs(cartTotal)}</span>
        </div>
        <button
          type="button"
          disabled={submitting || !cartLines.length}
          onClick={placeOrder}
          className="w-full inline-flex items-center justify-center gap-2 bg-rose-800 text-white rounded-xl py-3 text-sm font-semibold hover:bg-rose-900 disabled:opacity-50 shadow-sm"
        >
          <FiShoppingBag className="w-4 h-4" />
          {submitting ? 'Placing…' : cartLines.length ? `Place order · ${rs(cartTotal)}` : 'Add items to order'}
        </button>
        <p className="text-center text-[11px] text-stone-400">
          You’ll track status after placing
        </p>
      </div>
    </aside>
  );

  return (
    <div className="bg-[radial-gradient(ellipse_at_top,_#faf6f3_0%,_#f5f5f4_55%)] min-h-[calc(100vh-112px)] pb-10">
      <div className="max-w-6xl mx-auto px-4 pt-5 space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-800/80">
              Order online
            </p>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-0.5 truncate">
              {stallName}
            </h1>
            <p className="text-sm text-stone-500 mt-1">
              {catalog.customer?.name ? `Hi ${catalog.customer.name} · ` : ''}
              Pick items on the left — summary stays on the right
            </p>
          </div>
          <Link
            to={`${MS_CUSTOMER_BASE_PATH}/orders`}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 shadow-sm"
          >
            <FiTruck className="w-3.5 h-3.5 text-rose-800" />
            Track{activeCount ? ` · ${activeCount}` : ''}
          </Link>
        </header>

        {activeCount > 0 && (
          <Link
            to={`${MS_CUSTOMER_BASE_PATH}/orders`}
            className="block rounded-2xl bg-gradient-to-r from-rose-900 to-stone-900 text-white px-4 py-3.5 shadow-md hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <FiClock className="w-5 h-5 text-rose-100" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {activeCount} order{activeCount > 1 ? 's' : ''} in progress
                </p>
                <p className="text-xs text-rose-100/90 mt-0.5">Tap to track live status</p>
              </div>
              <span className="text-rose-100 text-lg leading-none">›</span>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Left — menu / qty entry */}
          <div className="space-y-4 min-w-0 order-2 lg:order-1">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <h2 className="text-sm font-bold text-stone-900">Menu</h2>
              <span className="text-[11px] text-stone-400">Enter kg / qty</span>
            </div>

            {categoryTabs.length > 1 && (
              <div className="sticky top-[7rem] z-20 -mx-1 px-1 py-1.5 bg-[#f7f4f1]/90 backdrop-blur-sm">
                <div className="flex gap-2 overflow-x-auto pb-0.5">
                  {categoryTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategoryFilter(tab.id)}
                      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                        String(categoryFilter) === String(tab.id)
                          ? 'bg-rose-800 text-white shadow-sm'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-5">
              {visibleCategories.map((cat) => {
                const items = productsByCategory.get(cat.id) || [];
                if (!items.length) return null;
                return (
                  <section key={cat.id} className="space-y-2.5">
                    <div className="flex items-end justify-between gap-2 px-0.5">
                      <h3 className="text-sm font-bold text-stone-900 tracking-tight">{cat.name}</h3>
                      <span className="text-[11px] font-medium text-stone-400">{items.length} items</span>
                    </div>
                    <ul className="space-y-2.5">
                      {items.map((p) => (
                        <ProductCard key={p.id} product={p} qty={cart[p.id] || 0} onQty={(q) => setQty(p.id, q)} />
                      ))}
                    </ul>
                  </section>
                );
              })}

              {uncategorizedProducts.length > 0 && (
                <section className="space-y-2.5">
                  <ul className="space-y-2.5">
                    {uncategorizedProducts.map((p) => (
                      <ProductCard key={p.id} product={p} qty={cart[p.id] || 0} onQty={(q) => setQty(p.id, q)} />
                    ))}
                  </ul>
                </section>
              )}

              {!(catalog.products || []).length && (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-14 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-800">
                    <FiShoppingBag className="w-6 h-6" />
                  </div>
                  <h2 className="text-base font-semibold text-stone-900">Menu coming soon</h2>
                  <p className="mt-1 text-sm text-stone-500 max-w-xs mx-auto">
                    The stall hasn’t listed products yet. Check back shortly.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right — live summary (top on mobile so it’s always visible first) */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-[7.5rem]">
            {summaryPanel}
          </div>
        </div>
      </div>
    </div>
  );
};

const FiClipboardIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const OrderTrackCard = ({ order }) => {
  const status = String(order.status || 'NEW').toUpperCase();
  const meta = STATUS_META[status] || STATUS_META.NEW;
  const tones = toneClass[meta.tone] || toneClass.amber;
  const Icon = meta.Icon;
  const cancelled = status === 'CANCELLED';
  const stepIndex = STATUS_FLOW.indexOf(status);
  const items = order.items || [];
  const updated = formatTime(order);

  return (
    <article
      className={`rounded-2xl border border-stone-200/80 bg-gradient-to-b ${tones.soft} shadow-sm overflow-hidden transition-shadow hover:shadow-md`}
    >
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${tones.chip}`}>
              <Icon className="w-3.5 h-3.5" />
              {meta.label}
            </span>
            <span className="text-xs text-stone-500">{formatWhen(order)}</span>
          </div>
          <p className="mt-1.5 text-xs text-stone-500">{meta.hint}{updated ? ` · ${updated}` : ''}</p>
        </div>
        <p className="text-lg font-bold tabular-nums text-stone-900 shrink-0">
          {rs(order.total_amount ?? order.totalAmount)}
        </p>
      </div>

      {!cancelled && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1">
            {STATUS_FLOW.map((step, idx) => {
              const done = stepIndex >= 0 && idx <= stepIndex;
              const current = step === status;
              return (
                <React.Fragment key={step}>
                  {idx > 0 && (
                    <div className={`h-0.5 flex-1 rounded-full ${done ? tones.bar : 'bg-stone-200'}`} />
                  )}
                  <div
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      done ? tones.bar : 'bg-stone-200'
                    } ${current ? 'ring-4 ring-offset-0 ring-rose-200/60 scale-110' : ''}`}
                    title={STATUS_META[step]?.label || step}
                  />
                </React.Fragment>
              );
            })}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-medium text-stone-400 px-0.5">
            <span>New</span>
            <span>Ready</span>
            <span>Done</span>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <ul className="mx-4 mb-3 rounded-xl bg-white/80 border border-stone-100 divide-y divide-stone-100">
          {items.map((line) => (
            <li key={line.id || `${line.product_name}-${line.quantity}`} className="px-3 py-2 flex justify-between gap-2 text-sm">
              <span className="text-stone-800 min-w-0 truncate">
                {line.product_name || line.name}
                <span className="text-stone-400 text-xs ml-1">
                  × {Number(line.quantity ?? line.qty ?? 0)} {line.unit || ''}
                </span>
              </span>
              <span className="tabular-nums text-stone-700 font-medium shrink-0">
                {rs(line.line_total ?? line.lineTotal)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {order.notes && (
        <p className="px-4 pb-4 text-xs text-stone-500">
          Note: <span className="text-stone-700">{order.notes}</span>
        </p>
      )}
      {!order.notes && items.length === 0 && <div className="h-2" />}
    </article>
  );
};

const QtyStepper = ({ qty, unit, onQty, compact = false }) => {
  const meta = unitMeta(unit);
  const count = isCountUnit(unit);
  const step = count ? 1 : (meta?.qtyStep ?? 0.5);
  const btn = compact
    ? 'w-7 h-7 rounded-lg'
    : 'w-9 h-9 rounded-xl';
  const inputW = compact ? 'w-12' : 'w-14';

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onQty(Math.max(0, Number((Number(qty) || 0) - step).toFixed(3)))}
        className={`${btn} inline-flex items-center justify-center border border-stone-200 bg-white text-stone-700 hover:bg-stone-50`}
        aria-label="Decrease"
      >
        <FiMinus className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </button>
      <input
        type="number"
        step={count ? '1' : '0.1'}
        min="0"
        className={`${inputW} border border-stone-200 rounded-lg px-1 py-1.5 text-sm text-center tabular-nums bg-white focus:outline-none focus:ring-2 focus:ring-rose-800/20`}
        value={qty || ''}
        onChange={(e) => onQty(e.target.value)}
        placeholder="0"
      />
      <button
        type="button"
        onClick={() => onQty(Number((Number(qty) || 0) + step).toFixed(3))}
        className={`${btn} inline-flex items-center justify-center border border-stone-200 bg-white text-stone-700 hover:bg-stone-50`}
        aria-label="Increase"
      >
        <FiPlus className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      </button>
    </div>
  );
};

const ProductCard = ({ product, qty, onQty }) => {
  const price = Number(product.selling_price ?? product.sellingPrice ?? 0);
  const unit = String(product.unit || 'kg').toLowerCase();
  const unitLabel = formatUnitLabel(unit);
  const count = isCountUnit(unit);
  const step = count ? 1 : (unitMeta(unit)?.qtyStep ?? 0.5);
  const inCart = Number(qty) > 0;
  const lineTotal = price * Number(qty || 0);

  return (
    <li
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-shadow ${
        inCart ? 'border-rose-200 ring-1 ring-rose-100' : 'border-stone-200/80 hover:shadow-md'
      }`}
    >
      <div className="px-4 py-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2.5">
            <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              inCart ? 'bg-rose-800 text-white' : 'bg-stone-100 text-stone-500'
            }`}>
              <FiPackage className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 leading-snug">{product.name}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                <span className="font-semibold text-stone-800 tabular-nums">{rs(price)}</span>
                {' '}
                <span className="text-stone-400">/ {unitLabel}</span>
              </p>
              {inCart && (
                <p className="text-[11px] font-medium text-rose-800 mt-1 tabular-nums">
                  Line · {rs(lineTotal)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          {!inCart ? (
            <button
              type="button"
              onClick={() => onQty(step)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-800 hover:bg-rose-900 text-white px-3.5 py-2 text-xs font-semibold shadow-sm"
            >
              <FiPlus className="w-3.5 h-3.5" />
              Add
            </button>
          ) : (
            <QtyStepper qty={qty} unit={unit} onQty={onQty} />
          )}
        </div>
      </div>
    </li>
  );
};

export default MuttonStallCustomerPortalPage;
