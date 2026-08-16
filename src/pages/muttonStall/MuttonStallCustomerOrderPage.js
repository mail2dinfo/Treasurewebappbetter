import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useMsOrdersStream } from '../../components/muttonStall/useMsOrdersStream';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_STYLE = {
  NEW: 'bg-amber-100 text-amber-800',
  PICKED: 'bg-indigo-100 text-indigo-800',
  PREPARING: 'bg-blue-100 text-blue-800',
  ARRIVAL: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

/**
 * Public customer order page — token-based, no login required.
 */
const MuttonStallCustomerOrderPage = () => {
  const { orderToken } = useParams();
  const [catalog, setCatalog] = useState({ stall: null, categories: [], products: [] });
  const [myOrders, setMyOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('menu');
  const [error, setError] = useState('');

  const publicApi = useCallback(async (path, options = {}) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      return { success: false, error: data.message || data.error || 'Request failed', data };
    }
    return { success: true, data: data.results ?? data.data ?? data };
  }, []);

  const loadCatalog = useCallback(async () => {
    if (!orderToken) return;
    const result = await publicApi(`/ms/public/${encodeURIComponent(orderToken)}/catalog`);
    if (result.success) {
      const payload = result.data || {};
      setCatalog({
        stall: payload.stall || payload,
        categories: payload.categories || [],
        products: payload.products || payload.items || [],
      });
      setError('');
    } else {
      setError(result.error || 'Invalid or expired order link');
    }
  }, [orderToken, publicApi]);

  const loadOrders = useCallback(async () => {
    if (!orderToken) return;
    const result = await publicApi(`/ms/public/${encodeURIComponent(orderToken)}/orders`);
    if (result.success) setMyOrders(result.data || []);
  }, [orderToken, publicApi]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCatalog(), loadOrders()]).finally(() => setLoading(false));
  }, [loadCatalog, loadOrders]);

  useMsOrdersStream({
    enabled: Boolean(orderToken),
    scope: 'public',
    orderToken,
    onEvent: loadOrders,
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

  const cartLines = useMemo(() => {
    return Object.entries(cart)
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
      });
  }, [cart, catalog.products]);

  const cartTotal = cartLines.reduce((s, l) => s + l.lineTotal, 0);

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
    const result = await publicApi(`/ms/public/${encodeURIComponent(orderToken)}/orders`, {
      method: 'POST',
      body: JSON.stringify({
        notes: notes.trim() || null,
        items: cartLines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          unitPrice: l.unitPrice,
        })),
      }),
    });
    setSubmitting(false);
    if (result.success) {
      toast.success('Order placed');
      setCart({});
      setNotes('');
      setTab('orders');
      loadOrders();
    } else toast.error(result.error || 'Failed to place order');
  };

  const stallName = catalog.stall?.name || 'Mutton Stall';

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center text-sm text-gray-500">
        Loading menu…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md text-center shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Order link unavailable</h1>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-950 via-stone-900 to-stone-100">
      <header className="sticky top-0 z-40 bg-rose-950/95 backdrop-blur border-b border-white/10 text-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-rose-200">Order online</p>
            <h1 className="text-lg font-bold truncate">{stallName}</h1>
          </div>
          <div className="inline-flex bg-white/10 rounded-lg p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setTab('menu')}
              className={`px-3 py-1.5 rounded-md ${tab === 'menu' ? 'bg-white text-rose-950' : 'text-rose-100'}`}
            >
              Menu
            </button>
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`px-3 py-1.5 rounded-md ${tab === 'orders' ? 'bg-white text-rose-950' : 'text-rose-100'}`}
            >
              My orders
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 pb-28 space-y-4">
        {tab === 'menu' && (
          <>
            {(catalog.categories || []).length === 0 && (catalog.products || []).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  {(catalog.products || []).map((p) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      qty={cart[p.id] || 0}
                      onQty={(q) => setQty(p.id, q)}
                    />
                  ))}
                </ul>
              </div>
            )}
            {(catalog.categories || []).map((cat) => {
              const items = productsByCategory.get(cat.id) || [];
              if (!items.length) return null;
              return (
                <div key={cat.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-100 bg-stone-50">
                    <h2 className="text-sm font-semibold text-gray-900">{cat.name}</h2>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {items.map((p) => (
                      <ProductRow
                        key={p.id}
                        product={p}
                        qty={cart[p.id] || 0}
                        onQty={(q) => setQty(p.id, q)}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
            {!(catalog.products || []).length && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
                No products available right now
              </div>
            )}
          </>
        )}

        {tab === 'orders' && (
          <div className="space-y-3">
            {(myOrders || []).map((order) => {
              const status = String(order.status || 'NEW').toUpperCase();
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {String(order.order_date || order.created_at || '').slice(0, 10) || 'Order'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{order.notes || '—'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLE[status] || 'bg-gray-100'}`}>
                        {status}
                      </span>
                      <p className="text-sm font-bold tabular-nums mt-1">{rs(order.total_amount ?? order.totalAmount)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {!(myOrders || []).length && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
                No orders yet — pick from the menu
              </div>
            )}
          </div>
        )}
      </main>

      {tab === 'menu' && cartLines.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-3xl mx-auto px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{cartLines.length} item(s)</span>
              <span className="font-bold tabular-nums text-gray-900">{rs(cartTotal)}</span>
            </div>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Notes for the stall (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              type="button"
              disabled={submitting}
              onClick={placeOrder}
              className="w-full bg-rose-800 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-rose-900 disabled:opacity-60"
            >
              {submitting ? 'Placing…' : 'Place order'}
            </button>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={2500} />
    </div>
  );
};

const ProductRow = ({ product, qty, onQty }) => {
  const price = Number(product.selling_price ?? product.sellingPrice ?? 0);
  return (
    <li className="px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {rs(price)} / {product.unit || 'kg'}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onQty(qty - 0.5)}
          className="w-8 h-8 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          −
        </button>
        <input
          type="number"
          step="0.1"
          min="0"
          className="w-14 border border-gray-300 rounded-lg px-1 py-1.5 text-sm text-center tabular-nums"
          value={qty || ''}
          onChange={(e) => onQty(e.target.value)}
          placeholder="0"
        />
        <button
          type="button"
          onClick={() => onQty((Number(qty) || 0) + 0.5)}
          className="w-8 h-8 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          +
        </button>
      </div>
    </li>
  );
};

export default MuttonStallCustomerOrderPage;
