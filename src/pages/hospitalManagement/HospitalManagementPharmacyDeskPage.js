import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useUserContext } from '../../context/user_context';
import { useHhClinicalStream } from '../../components/hospitalManagement/useHhClinicalStream';
import { useHhBasePath } from '../../components/hospitalManagement/hospitalManagementMenuItems';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const paymentModeFromAccount = (account) => {
  const type = String(account?.account_type || account?.accountType || '').toUpperCase();
  if (['CASH', 'UPI', 'CARD', 'BANK'].includes(type)) return type;
  const name = String(account?.name || account?.account_name || account?.accountName || '').toUpperCase();
  if (name.includes('UPI')) return 'UPI';
  if (name.includes('CARD')) return 'CARD';
  if (name.includes('BANK')) return 'BANK';
  if (name.includes('CASH')) return 'CASH';
  return 'CASH';
};
const accountLabel = (account) => account?.name || account?.account_name || account?.accountName || 'Account';

const DESK_STATUSES = ['PENDING', 'PICKED_UP', 'PACKING', 'READY', 'BILLED', 'PAID'];
const STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-800',
  PICKED_UP: 'bg-violet-100 text-violet-800',
  PACKING: 'bg-sky-100 text-sky-800',
  READY: 'bg-teal-100 text-teal-800',
  BILLED: 'bg-indigo-100 text-indigo-800',
  PAID: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};
const STATUS_LABEL = {
  PENDING: 'Waiting',
  PICKED_UP: 'Picked up',
  PACKING: 'Preparing',
  READY: 'Ready to collect',
  BILLED: 'Billed',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
};
const typeLabel = (value) => {
  const raw = String(value || 'OPD').toUpperCase().replace(/_/g, ' ');
  if (raw === 'OPD' || raw === 'OPD VISIT' || raw === 'DOCTOR') return 'Doctor Rx';
  if (raw === 'IPD WARD' || raw === 'IPD') return 'Ward';
  return raw;
};
const medicineNames = (order) => orderItems(order)
  .map((item) => item.medicine_name || item.medicineName || item.name)
  .filter(Boolean);
const timeLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const orderType = (o) => String(o.order_type || o.orderType || o.source || 'OPD').toUpperCase();
const orderItems = (o) => {
  if (Array.isArray(o?.items)) return o.items;
  if (Array.isArray(o?.order_items)) return o.order_items;
  if (Array.isArray(o?.orderItems)) return o.orderItems;
  return [];
};
const asOrderList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.orders)) return data.orders;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};
const isDoctorPrescription = (order) => {
  const source = String(order?.source || order?.order_type || order?.orderType || '').toUpperCase();
  if (source === 'IPD_WARD' || source === 'IPD' || source === 'WARD') return false;
  if (source === 'OPD' || source === 'OPD_VISIT' || source === 'DOCTOR') return true;
  return Boolean(order?.visit_id || order?.visitId);
};

const HospitalManagementPharmacyDeskPage = () => {
  const {
    pharmacyOrders,
    membershipId,
    fetchPharmacyOrders,
    getPharmacyOrder,
    updatePharmacyOrderStatus,
    updatePharmacyOrderItems,
    billPharmacyOrder,
    payPharmacyOrder,
    ledgerAccounts,
    fetchLedgerAccounts,
  } = useHospitalManagement();
  const { user } = useUserContext();
  const location = useLocation();
  const basePath = useHhBasePath();
  const doctorRxView = new URLSearchParams(location.search).get('view') === 'doctor-prescriptions';
  const authToken = user?.results?.token || localStorage.getItem('token') || '';
  const seenPendingRef = useRef(new Set());
  const initializedRef = useRef(false);

  const [busyId, setBusyId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [medicineSummary, setMedicineSummary] = useState([]);
  const [billMeta, setBillMeta] = useState({ billNo: null, bill: null });
  const [priceDraft, setPriceDraft] = useState({});
  const [ledgerAccountId, setLedgerAccountId] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [queueTab, setQueueTab] = useState('queue');

  const reload = useCallback(async ({ silent = false } = {}) => {
    if (!membershipId) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    await fetchPharmacyOrders();
    if (!silent) setLoading(false);
  }, [membershipId, fetchPharmacyOrders]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    fetchLedgerAccounts();
  }, [fetchLedgerAccounts]);

  const selectedLedgerAccount = useMemo(
    () => (ledgerAccounts || []).find((account) => String(account.id) === String(ledgerAccountId)) || null,
    [ledgerAccounts, ledgerAccountId]
  );
  const payMode = paymentModeFromAccount(selectedLedgerAccount);

  useEffect(() => {
    if (!ledgerAccountId && ledgerAccounts?.length) {
      setLedgerAccountId(String(ledgerAccounts[0].id));
    }
  }, [ledgerAccountId, ledgerAccounts]);

  const incomingRxIdRef = useRef(null);
  const autoOpenedRef = useRef(false);

  const orders = useMemo(() => {
    const list = asOrderList(pharmacyOrders)
      .filter((o) => DESK_STATUSES.includes(String(o.status || '').toUpperCase()))
      .filter((o) => (doctorRxView ? isDoctorPrescription(o) : true))
      .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
    return list;
  }, [pharmacyOrders, doctorRxView]);

  const queueOrders = useMemo(
    () => orders.filter((o) => ['PENDING', 'PICKED_UP', 'PACKING', 'READY', 'BILLED'].includes(String(o.status || '').toUpperCase())),
    [orders]
  );
  const doneOrders = useMemo(
    () => orders.filter((o) => String(o.status || '').toUpperCase() === 'PAID'),
    [orders]
  );
  const visibleOrders = queueTab === 'done' ? doneOrders : queueOrders;

  const syncDraftFromItems = (items) => {
    const draft = {};
    (items || []).forEach((it) => {
      if (!it.id) return;
      const prescribed = Number(it.prescribed_qty ?? it.prescribedQty ?? it.qty ?? 1);
      const dispensed = Number(it.dispensed_qty ?? it.dispensedQty ?? it.qty ?? prescribed);
      draft[it.id] = {
        unitPrice: String(it.unit_price ?? it.unitPrice ?? ''),
        prescribedQty: String(prescribed),
        dispensedQty: String(dispensed),
      };
    });
    setPriceDraft(draft);
  };

  const applyDetailPayload = (raw) => {
    const order = raw.order || raw;
    const items = raw.items || orderItems(order);
    const summary = Array.isArray(raw.medicine_summary) ? raw.medicine_summary : [];
    setDetail({ ...order, items });
    setMedicineSummary(summary);
    setBillMeta({
      billNo: raw.bill_no || raw.bill?.bill_no || order.bill_no || null,
      bill: raw.bill || null,
    });
    syncDraftFromItems(items.length ? items : summary);
  };

  const loadDetail = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      setMedicineSummary([]);
      setBillMeta({ billNo: null, bill: null });
      setPriceDraft({});
      return;
    }
    setExpandedId(id);
    const result = await getPharmacyOrder(id);
    if (result.success) applyDetailPayload(result.data || {});
    else toast.error(result.error || 'Failed to load order');
  };

  const refreshExpanded = async (orderId) => {
    const refreshed = await getPharmacyOrder(orderId);
    if (refreshed.success) applyDetailPayload(refreshed.data || {});
  };

  const openOrder = useCallback(async (id) => {
    if (!id) return;
    setExpandedId(id);
    const result = await getPharmacyOrder(id);
    if (result.success) applyDetailPayload(result.data || {});
  }, [getPharmacyOrder]);

  const onStreamEvent = useCallback(async (evt) => {
    if (evt?.action === 'connected') {
      await reload({ silent: true });
      return;
    }
    if (String(evt?.type || '') === 'pharmacy_order' && evt?.id) {
      const action = String(evt.action || '').toLowerCase();
      const status = String(evt.status || '').toUpperCase();
      if (action === 'created' || status === 'PENDING') {
        incomingRxIdRef.current = evt.id;
      }
    }
    await reload({ silent: true });
    const orderId = incomingRxIdRef.current;
    if (orderId) {
      incomingRxIdRef.current = null;
      await openOrder(orderId);
    }
  }, [reload, openOrder]);

  useHhClinicalStream({
    enabled: Boolean(authToken && membershipId),
    streamPath: '/hh/pharmacy/orders/stream',
    parentMembershipId: membershipId,
    token: authToken,
    onEvent: onStreamEvent,
  });

  useEffect(() => {
    asOrderList(pharmacyOrders).forEach((o) => {
      if (String(o.status || '').toUpperCase() === 'PENDING') seenPendingRef.current.add(o.id);
    });
    initializedRef.current = true;
  }, [pharmacyOrders]);

  useEffect(() => {
    if (!doctorRxView || autoOpenedRef.current || !queueOrders.length) return;
    const first = queueOrders.find((o) => String(o.status || '').toUpperCase() === 'PENDING') || queueOrders[0];
    if (!first?.id) return;
    autoOpenedRef.current = true;
    openOrder(first.id);
  }, [doctorRxView, queueOrders, openOrder]);

  const buildPriceLines = () => Object.entries(priceDraft).map(([id, row]) => ({
    id,
    unitPrice: Number(row.unitPrice) || 0,
    dispensedQty: Number(row.dispensedQty) || 0,
    qty: Number(row.dispensedQty) || 0,
  }));

  const draftTotal = useMemo(() => (
    Object.values(priceDraft).reduce((sum, row) => {
      const qty = Number(row.dispensedQty) || 0;
      const price = Number(row.unitPrice) || 0;
      return sum + qty * price;
    }, 0)
  ), [priceDraft]);

  const runAction = async (order, fn, successMsg) => {
    setBusyId(order.id);
    const result = await fn();
    setBusyId(null);
    if (result.success) {
      const billNo = result.data?.bill_no || result.data?.bill?.bill_no;
      if (billNo) {
        toast.success(`${successMsg} — Bill ${billNo}`);
        setBillMeta({ billNo, bill: result.data?.bill || null });
      } else {
        toast.success(result.message || successMsg);
      }
      await reload();
      if (expandedId === order.id) await refreshExpanded(order.id);
    } else {
      toast.error(result.error || 'Action failed');
    }
    return result;
  };

  const onSavePrices = async (order) => {
    const lines = buildPriceLines();
    if (!lines.length) return toast.error('Open order items first');
    if (lines.some((l) => !(l.unitPrice > 0))) return toast.error('Enter unit price for every medicine');
    if (lines.some((l) => !(l.dispensedQty > 0))) return toast.error('Enter dispense qty for every medicine');
    for (const line of lines) {
      const prescribed = Number(priceDraft[line.id]?.prescribedQty) || 0;
      if (prescribed > 0 && line.dispensedQty > prescribed) {
        return toast.error('Dispense qty cannot exceed prescribed qty');
      }
    }
    await runAction(order, () => updatePharmacyOrderItems(order.id, lines), 'Prices & dispense qty saved');
  };

  const onCreateBill = async (order) => {
    const type = orderType(order);
    const isWard = type === 'IPD_WARD' || type === 'IPD';
    if (!isWard) {
      return openPaymentConfirmation(order);
    }
    const lines = buildPriceLines();
    if (!lines.length) {
      await loadDetail(order.id);
      return toast.info('Open the order, set dispense qty & prices, then bill to ward');
    }
    if (lines.some((l) => !(l.unitPrice > 0))) {
      return toast.error('Enter unit price for each medicine before billing to ward');
    }
    if (lines.some((l) => !(l.dispensedQty > 0))) {
      return toast.error('Enter dispense qty for each medicine before billing to ward');
    }
    await runAction(
      order,
      () => billPharmacyOrder(order.id, { items: lines }),
      'Charged to ward account'
    );
  };

  const openPaymentConfirmation = async (order) => {
    const lines = buildPriceLines();
    if (expandedId === order.id && lines.length) {
      if (lines.some((l) => !(l.unitPrice > 0))) {
        return toast.error('Enter unit price for each medicine before collecting payment');
      }
      if (lines.some((l) => !(l.dispensedQty > 0))) {
        return toast.error('Enter dispense qty for each medicine before collecting payment');
      }
    }
    const result = await getPharmacyOrder(order.id);
    if (!result.success) return toast.error(result.error || 'Could not load medicine summary');
    applyDetailPayload(result.data || {});
    setExpandedId(order.id);
    setPaymentOrder({
      ...order,
      ...(result.data?.order || {}),
      bill: result.data?.bill || null,
      medicineSummary: result.data?.medicine_summary || [],
    });
  };

  const confirmPayment = async () => {
    if (!paymentOrder) return;
    if (!ledgerAccountId) return toast.error('Select a payment method from your ledger accounts');
    const lines = buildPriceLines();
    const result = await runAction(
      paymentOrder,
      () => payPharmacyOrder(paymentOrder.id, {
        paymentMethod: payMode,
        ledgerAccountId,
        transactionNumber: transactionRef.trim() || null,
        items: lines,
      }),
      'Payment collected — bill created and medicines delivered'
    );
    if (result.success) {
      setPaymentOrder(null);
      setTransactionRef('');
    }
  };

  const renderActions = (order) => {
    const status = String(order.status || '').toUpperCase();
    const type = orderType(order);
    const isWard = type === 'IPD_WARD' || type === 'IPD';
    const canCollect = !isWard && ['READY', 'BILLED'].includes(status);
    const canBillWard = isWard && ['PENDING', 'PICKED_UP', 'PACKING', 'READY'].includes(status);

    return (
      <div className="flex flex-wrap gap-2">
        {status === 'PENDING' && (
          <button
            type="button"
            disabled={busyId === order.id}
            onClick={() => runAction(order, () => updatePharmacyOrderStatus(order.id, 'PICKED_UP'), 'Order picked up')}
            className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
          >
            Pick up order
          </button>
        )}
        {status === 'PICKED_UP' && (
          <button
            type="button"
            disabled={busyId === order.id}
            onClick={() => runAction(order, () => updatePharmacyOrderStatus(order.id, 'PACKING'), 'Preparing medicines')}
            className="rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
          >
            Start preparing
          </button>
        )}
        {status === 'PACKING' && (
          <button
            type="button"
            disabled={busyId === order.id}
            onClick={() => runAction(order, () => updatePharmacyOrderStatus(order.id, 'READY'), 'Ready to collect')}
            className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            Ready to collect
          </button>
        )}
        {canBillWard && (
          <button
            type="button"
            disabled={busyId === order.id}
            onClick={() => onCreateBill(order)}
            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-60"
          >
            Bill to ward
          </button>
        )}
        {canCollect && (
          <button
            type="button"
            disabled={busyId === order.id}
            onClick={() => openPaymentConfirmation(order)}
            className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
          >
            Collect payment
          </button>
        )}
      </div>
    );
  };

  const canEditPrices = (status) => ['PENDING', 'PICKED_UP', 'PACKING', 'READY'].includes(status);

  const summaryRows = medicineSummary.length
    ? medicineSummary
    : (detail?.items || []).map((it) => ({
      medicine_name: it.medicine_name || it.medicineName,
      prescribed_qty: it.prescribed_qty ?? it.prescribedQty ?? it.qty,
      dispensed_qty: it.dispensed_qty ?? it.dispensedQty ?? it.qty,
      unit_price: it.unit_price ?? it.unitPrice,
      line_total: it.line_amount ?? it.lineAmount ?? it.line_total,
      dosage: it.dosage,
    }));

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-5">
      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-indigo-700 to-cyan-700 px-5 py-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">Pharmacy</p>
              <h1 className="mt-1 text-2xl font-bold">{doctorRxView ? 'Doctor prescriptions' : 'Pharmacy desk'}</h1>
              <p className="mt-1 text-sm text-indigo-100">
                {doctorRxView ? 'Pack medicines, collect payment, then the bill is created' : 'Pack prescriptions, collect payment, then the bill is created'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`${basePath}/pharmacy`}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                POS
              </Link>
              {!doctorRxView && (
                <Link
                  to={`${basePath}/pharmacy-desk?view=doctor-prescriptions`}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50"
                >
                  Doctor Rx
                </Link>
              )}
              <button
                type="button"
                onClick={() => reload()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                <FiRefreshCw /> Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4">
          {[
            ['Waiting', queueOrders.filter((o) => String(o.status).toUpperCase() === 'PENDING').length, 'text-amber-700'],
            ['Picked up', queueOrders.filter((o) => String(o.status).toUpperCase() === 'PICKED_UP').length, 'text-violet-700'],
            ['Preparing', queueOrders.filter((o) => String(o.status).toUpperCase() === 'PACKING').length, 'text-sky-700'],
            ['Ready', queueOrders.filter((o) => ['READY', 'BILLED'].includes(String(o.status).toUpperCase())).length, 'text-indigo-700'],
          ].map(([label, count, color]) => (
            <div key={label} className="px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
              <p className={`mt-1 text-xl font-bold ${color}`}>{count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setQueueTab('queue')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${queueTab === 'queue' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          Active queue ({queueOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setQueueTab('done')}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${queueTab === 'done' ? 'bg-indigo-700 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          Completed ({doneOrders.length})
        </button>
      </div>

      {loading && !visibleOrders.length ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Loading prescriptions…</div>
      ) : !visibleOrders.length ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-gray-900">
            {queueTab === 'done' ? 'No paid prescriptions yet' : 'No doctor prescriptions waiting'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {queueTab === 'done' ? 'Paid orders will move here after collection.' : 'New prescriptions appear here as soon as a doctor sends them.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleOrders.map((o) => {
            const status = String(o.status || '').toUpperCase();
            const type = orderType(o);
            const patient = o.patient_name || o.patientName || 'Patient';
            const expanded = expandedId === o.id;
            const items = expanded && detail?.id === o.id ? orderItems(detail) : orderItems(o);
            const names = medicineNames(o);
            const total = expanded && detail?.id === o.id ? draftTotal : (o.total_amount ?? o.totalAmount ?? 0);
            const shownBillNo = expanded && detail?.id === o.id
              ? (billMeta.billNo || detail.bill_no)
              : (o.bill_no || o.billNo);
            const initial = String(patient).trim().slice(0, 1).toUpperCase() || 'P';

            return (
              <article key={o.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${expanded ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-200'}`}>
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-800">
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-bold text-gray-900">{patient}</h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABEL[status] || status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {typeLabel(type)}
                        {timeLabel(o.created_at || o.createdAt) ? ` · ${timeLabel(o.created_at || o.createdAt)}` : ''}
                        {shownBillNo ? ` · Bill ${shownBillNo}` : ''}
                      </p>
                      {names.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {names.slice(0, 4).map((name) => (
                            <span key={name} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {name}
                            </span>
                          ))}
                          {names.length > 4 && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">+{names.length - 4}</span>
                          )}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-gray-400">{o.item_count || 0} medicine{(o.item_count || 0) === 1 ? '' : 's'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
                    <p className="text-right text-xl font-bold text-gray-900">{rs(total)}</p>
                    {renderActions(o)}
                    <button
                      type="button"
                      onClick={() => loadDetail(o.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      {expanded ? <>Hide medicines <FiChevronUp /></> : <>View medicines <FiChevronDown /></>}
                    </button>
                  </div>
                </div>

                  {expanded && (
                    <div className="space-y-3 border-t border-gray-100 bg-slate-50 px-4 py-4">
                      {(billMeta.billNo || detail?.bill_no) && (
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
                          Bill number: <span className="font-semibold">{billMeta.billNo || detail.bill_no}</span>
                        </div>
                      )}

                      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-3 py-2.5 font-semibold">Medicine</th>
                              <th className="px-3 py-2.5 font-semibold">Type</th>
                              <th className="px-3 py-2.5 font-semibold">Dosage</th>
                              <th className="px-3 py-2.5 font-semibold">Prescribed</th>
                              <th className="px-3 py-2.5 font-semibold">Dispense</th>
                              <th className="px-3 py-2.5 font-semibold">Unit ₹</th>
                              <th className="px-3 py-2.5 text-right font-semibold">Line</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(items.length ? items : summaryRows).map((row, idx) => {
                              const id = row.id;
                              const draft = id ? (priceDraft[id] || {}) : {};
                              const prescribed = Number(draft.prescribedQty ?? row.prescribed_qty ?? row.prescribedQty ?? row.qty ?? 0);
                              const dispensed = Number(draft.dispensedQty ?? row.dispensed_qty ?? row.dispensedQty ?? row.qty ?? 0);
                              const unit = Number(draft.unitPrice ?? row.unit_price ?? row.unitPrice ?? 0);
                              const line = dispensed * unit;
                              const editable = canEditPrices(status) && id;
                              return (
                                <tr key={id || `${row.medicine_name}-${idx}`}>
                                  <td className="px-3 py-2.5 font-medium text-gray-900">
                                    {row.medicine_name || row.medicineName || row.name || '—'}
                                  </td>
                                  <td className="px-3 py-2.5 text-gray-600">{String(row.item_type || row.itemType || 'MEDICINE')}</td>
                                  <td className="px-3 py-2.5 text-gray-700">{row.dosage || '—'}</td>
                                  <td className="px-3 py-2.5">{prescribed}</td>
                                  <td className="px-3 py-2.5">
                                    {editable ? (
                                      <input
                                        type="number"
                                        min="0.01"
                                        step="1"
                                        max={prescribed || undefined}
                                        className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                                        value={draft.dispensedQty ?? ''}
                                        onChange={(e) => setPriceDraft((current) => ({
                                          ...current,
                                          [id]: { ...current[id], dispensedQty: e.target.value },
                                        }))}
                                      />
                                    ) : (
                                      <>
                                        {dispensed}
                                        {prescribed > dispensed ? <span className="ml-1 text-xs text-amber-700">(partial)</span> : null}
                                      </>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    {editable ? (
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                                        placeholder="Price"
                                        value={draft.unitPrice ?? ''}
                                        onChange={(e) => setPriceDraft((current) => ({
                                          ...current,
                                          [id]: { ...current[id], unitPrice: e.target.value },
                                        }))}
                                      />
                                    ) : rs(unit)}
                                  </td>
                                  <td className="px-3 py-2.5 text-right font-semibold">{rs(line)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50">
                              <td colSpan={6} className="px-3 py-2.5 text-right font-semibold text-gray-600">Total</td>
                              <td className="px-3 py-2.5 text-right text-base font-bold text-indigo-900">{rs(draftTotal)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {canEditPrices(status) && (
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="w-full text-xs text-gray-500">You can dispense less than the prescribed quantity.</p>
                          <button
                            type="button"
                            disabled={busyId === o.id}
                            onClick={() => onSavePrices(o)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                          >
                            Save qty & prices
                          </button>
                          <button
                            type="button"
                            disabled={busyId === o.id}
                            onClick={() => (orderType(o) === 'IPD_WARD' || orderType(o) === 'IPD' ? onCreateBill(o) : openPaymentConfirmation(o))}
                            className="rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800"
                          >
                            {orderType(o) === 'IPD_WARD' || orderType(o) === 'IPD' ? 'Bill to ward' : 'Collect payment'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </article>
            );
          })}
        </div>
      )}

      {paymentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Collect payment & issue bill</h2>
              <p className="text-xs text-gray-500">
                {paymentOrder.patient_name || paymentOrder.patientName || 'Patient'}
                {' · '}
                {paymentOrder.bill?.bill_no || billMeta.billNo
                  ? `Bill ${paymentOrder.bill?.bill_no || billMeta.billNo}`
                  : 'Bill number is created after payment'}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Medicine</th>
                    <th className="px-3 py-2 font-medium">Prescribed</th>
                    <th className="px-3 py-2 font-medium">Dispensed</th>
                    <th className="px-3 py-2 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(paymentOrder.medicineSummary || []).map((row, index) => (
                    <tr key={row.id || index} className="border-t border-gray-100">
                      <td className="px-3 py-2">{row.medicine_name || row.medicineName || '—'}</td>
                      <td className="px-3 py-2">{Number(row.prescribed_qty ?? row.prescribedQty ?? 0)}</td>
                      <td className="px-3 py-2">{Number(row.dispensed_qty ?? row.dispensedQty ?? 0)}</td>
                      <td className="px-3 py-2 text-right">
                        {rs(row.line_total ?? row.line_amount ?? 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500">Amount to collect</p>
              <p className="text-xl font-bold text-cyan-900">
                {rs(paymentOrder.bill?.total_amount ?? paymentOrder.total_amount ?? draftTotal)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block sm:col-span-2">
                <span className="text-xs font-medium text-gray-700">Payment method *</span>
                {(ledgerAccounts || []).length ? (
                  <select
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    value={ledgerAccountId}
                    onChange={(e) => setLedgerAccountId(e.target.value)}
                  >
                    <option value="">Select account</option>
                    {(ledgerAccounts || []).map((account) => (
                      <option key={account.id} value={account.id}>
                        {accountLabel(account)}
                        {' · '}{rs(account.current_balance ?? account.currentBalance)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    No ledger accounts yet.{' '}
                    <Link to={`${basePath}/ledger`} className="font-semibold underline">Add accounts in Ledger</Link>
                    {' '}first, then collect payment here.
                  </p>
                )}
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-gray-700">
                Transaction reference {payMode === 'CASH' ? '(optional)' : ''}
              </span>
              <input
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="UPI / card / bank reference"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
              />
            </label>

            <p className="text-xs text-gray-500">
              Payment creates the bill, a CREDIT ledger entry, and marks medicines as delivered.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentOrder(null)}
                className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700"
              >
                Back
              </button>
              <button
                type="button"
                disabled={busyId === paymentOrder.id}
                onClick={confirmPayment}
                className="px-4 py-2 text-sm rounded-lg bg-cyan-700 text-white hover:bg-cyan-800 disabled:opacity-60"
              >
                Confirm payment & create bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagementPharmacyDeskPage;
