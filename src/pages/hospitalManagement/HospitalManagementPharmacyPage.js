import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const toDate = (d) => d.toISOString().slice(0, 10);
const num = (obj, ...keys) => {
  for (const k of keys) {
    if (obj?.[k] != null && obj[k] !== '') return Number(obj[k]);
  }
  return 0;
};
const str = (obj, ...keys) => {
  for (const k of keys) {
    if (obj?.[k] != null && obj[k] !== '') return String(obj[k]);
  }
  return '';
};

const TABS = [
  { id: 'pos', label: 'POS (Sell)' },
  { id: 'medicines', label: 'Medicines' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'bills', label: 'Bills' },
  { id: 'alerts', label: 'Alerts' },
];

const PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'BANK', 'CREDIT'];
const UNIT_OPTIONS = ['TABLET', 'SYRUP', 'INJECTION', 'CAPSULE', 'CREAM', 'DROPS', 'OTHER'];

const emptyMed = {
  name: '',
  unit: 'TABLET',
  stockQty: '',
  minStockQty: '',
  unitPrice: '',
  barcode: '',
  hsnCode: '',
  gstPercent: '',
  mrp: '',
  purchasePrice: '',
  manufacturer: '',
};

const emptySupplier = { name: '', phone: '', email: '', address: '', gstNo: '' };

const emptyPurchaseLine = () => ({
  medicineId: '',
  batchNo: '',
  expiryDate: '',
  qty: '',
  purchasePrice: '',
  mrp: '',
  gstPercent: '',
  salePrice: '',
});

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white';
const btnPrimary = 'bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60';
const btnSecondary = 'text-xs px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-800 hover:bg-cyan-100';

const isLowStock = (m) => {
  const qty = num(m, 'stock_qty', 'stockQty');
  const reorder = num(m, 'min_stock_qty', 'minStockQty', 'reorder_level', 'reorderLevel');
  return reorder > 0 && qty <= reorder;
};

const HospitalManagementPharmacyPage = () => {
  const {
    medicines,
    patients,
    lowStockMedicines,
    pharmacySuppliers,
    pharmacyPurchases,
    pharmacyBills,
    pharmacyReturns,
    expiryAlerts,
    fetchMedicines,
    fetchPatients,
    fetchLowStock,
    fetchExpiryAlerts,
    createMedicine,
    updateMedicine,
    fetchPharmacySuppliers,
    createPharmacySupplier,
    updatePharmacySupplier,
    fetchPharmacyPurchases,
    createPharmacyPurchase,
    fetchMedicineBatches,
    searchPharmacyPos,
    pharmacyPosCheckout,
    fetchPharmacyBills,
    getPharmacyBill,
    createPharmacyReturn,
    fetchPharmacyReturns,
  } = useHospitalManagement();

  const { can } = useHhPermission();
  const canView = can('hh_pharmacy_view') || can('hh_pharmacy_manage');
  const canManage = can('hh_pharmacy_manage');

  const [tab, setTab] = useState('pos');
  const [saving, setSaving] = useState(false);

  // POS state
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState([]);
  const [posPatientId, setPosPatientId] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [discount, setDiscount] = useState('');
  const [posNotes, setPosNotes] = useState('');

  // Medicines state
  const [medForm, setMedForm] = useState(emptyMed);
  const [editMedId, setEditMedId] = useState(null);

  // Purchase state
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    invoiceNo: '',
    purchaseDate: toDate(new Date()),
    notes: '',
  });
  const [purchaseLines, setPurchaseLines] = useState([emptyPurchaseLine()]);

  // Supplier state
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [editSupplierId, setEditSupplierId] = useState(null);

  // Bills state
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [billDetail, setBillDetail] = useState(null);
  const [returnBillId, setReturnBillId] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnLines, setReturnLines] = useState([]);

  useEffect(() => {
    if (!canView) return;
    fetchMedicines();
    fetchPatients();
    fetchLowStock();
    fetchExpiryAlerts();
    fetchPharmacySuppliers();
    fetchPharmacyPurchases();
    fetchPharmacyBills();
    fetchPharmacyReturns();
  }, [
    canView,
    fetchMedicines,
    fetchPatients,
    fetchLowStock,
    fetchExpiryAlerts,
    fetchPharmacySuppliers,
    fetchPharmacyPurchases,
    fetchPharmacyBills,
    fetchPharmacyReturns,
  ]);

  useEffect(() => {
    if (!searchQ.trim() || tab !== 'pos') {
      setSearchResults([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const result = await searchPharmacyPos(searchQ.trim());
      setSearching(false);
      if (result.success) {
        setSearchResults(Array.isArray(result.data) ? result.data : []);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQ, tab, searchPharmacyPos]);

  const lowStock = useMemo(() => {
    if (lowStockMedicines?.length) return lowStockMedicines;
    return (medicines || []).filter(isLowStock);
  }, [lowStockMedicines, medicines]);

  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let gstTotal = 0;
    cart.forEach((line) => {
      const lineSub = line.qty * line.unitPrice;
      const lineGst = lineSub * (line.gstPercent / 100);
      subtotal += lineSub;
      gstTotal += lineGst;
    });
    const disc = Number(discount) || 0;
    const grandTotal = Math.max(0, subtotal + gstTotal - disc);
    return { subtotal, gstTotal, discount: disc, grandTotal };
  }, [cart, discount]);

  const addToCart = useCallback(async (item) => {
    const medicineId = item.id ?? item.medicineId ?? item.medicine_id;
    const name = str(item, 'name', 'medicineName', 'medicine_name') || 'Medicine';
    const unitPrice = num(item, 'unit_price', 'unitPrice', 'salePrice', 'sale_price', 'mrp');
    const gstPercent = num(item, 'gst_percent', 'gstPercent');
    const stockQty = num(item, 'stock_qty', 'stockQty');

    let batches = [];
    const batchResult = await fetchMedicineBatches(medicineId);
    if (batchResult.success && Array.isArray(batchResult.data)) {
      batches = batchResult.data;
    }

    const existing = cart.find((c) => String(c.medicineId) === String(medicineId));
    if (existing && !batches.length) {
      setCart((prev) => prev.map((c) => (
        String(c.medicineId) === String(medicineId)
          ? { ...c, qty: c.qty + 1 }
          : c
      )));
      setSearchQ('');
      setSearchResults([]);
      return;
    }

    const firstBatch = batches[0];
    setCart((prev) => [
      ...prev,
      {
        key: `${medicineId}-${Date.now()}`,
        medicineId,
        name,
        batches,
        batchId: firstBatch ? str(firstBatch, 'id', 'batchId', 'batch_id') : '',
        qty: 1,
        unitPrice: firstBatch ? num(firstBatch, 'sale_price', 'salePrice', 'unit_price', 'unitPrice') || unitPrice : unitPrice,
        gstPercent: firstBatch ? num(firstBatch, 'gst_percent', 'gstPercent') || gstPercent : gstPercent,
        stockQty,
      },
    ]);
    setSearchQ('');
    setSearchResults([]);
  }, [cart, fetchMedicineBatches]);

  const updateCartLine = (key, field, value) => {
    setCart((prev) => prev.map((line) => {
      if (line.key !== key) return line;
      const updated = { ...line, [field]: value };
      if (field === 'batchId' && line.batches?.length) {
        const batch = line.batches.find((b) => String(b.id ?? b.batchId) === String(value));
        if (batch) {
          updated.unitPrice = num(batch, 'sale_price', 'salePrice', 'unit_price', 'unitPrice') || line.unitPrice;
          updated.gstPercent = num(batch, 'gst_percent', 'gstPercent') || line.gstPercent;
        }
      }
      if (field === 'qty') updated.qty = Math.max(1, Number(value) || 1);
      if (field === 'unitPrice') updated.unitPrice = Math.max(0, Number(value) || 0);
      if (field === 'gstPercent') updated.gstPercent = Math.max(0, Number(value) || 0);
      return updated;
    }));
  };

  const removeCartLine = (key) => setCart((prev) => prev.filter((l) => l.key !== key));

  const onCheckout = async () => {
    if (!cart.length) return toast.error('Cart is empty');
    setSaving(true);
    const result = await pharmacyPosCheckout({
      patientId: posPatientId || null,
      paymentMode,
      discount: Number(discount) || 0,
      notes: posNotes.trim() || null,
      items: cart.map((line) => ({
        medicineId: line.medicineId,
        batchId: line.batchId || null,
        qty: line.qty,
        unitPrice: line.unitPrice,
        gstPercent: line.gstPercent,
      })),
      payNow: paymentMode !== 'CREDIT',
    });
    setSaving(false);
    if (result.success) {
      const billNo = str(result.data, 'billNo', 'bill_no', 'billNumber', 'bill_number') || result.data?.id || '';
      toast.success(billNo ? `Bill #${billNo} created` : 'Checkout successful');
      setCart([]);
      setPosPatientId('');
      setDiscount('');
      setPosNotes('');
      setPaymentMode('CASH');
    } else {
      toast.error(result.error || 'Checkout failed');
    }
  };

  const onMedSubmit = async (e) => {
    e.preventDefault();
    if (!medForm.name.trim()) return toast.error('Medicine name required');
    setSaving(true);
    const payload = {
      name: medForm.name.trim(),
      unit: medForm.unit,
      stockQty: Number(medForm.stockQty) || 0,
      minStockQty: Number(medForm.minStockQty) || 0,
      unitPrice: Number(medForm.unitPrice) || 0,
      barcode: medForm.barcode.trim() || null,
      hsnCode: medForm.hsnCode.trim() || null,
      gstPercent: Number(medForm.gstPercent) || 0,
      mrp: Number(medForm.mrp) || 0,
      purchasePrice: Number(medForm.purchasePrice) || 0,
      manufacturer: medForm.manufacturer.trim() || null,
    };
    const result = editMedId ? await updateMedicine(editMedId, payload) : await createMedicine(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editMedId ? 'Medicine updated' : 'Medicine added');
      setMedForm(emptyMed);
      setEditMedId(null);
      fetchLowStock();
    } else toast.error(result.error || 'Failed');
  };

  const onEditMed = (m) => {
    setEditMedId(m.id);
    setMedForm({
      name: m.name || '',
      unit: m.unit || 'TABLET',
      stockQty: String(num(m, 'stock_qty', 'stockQty') || ''),
      minStockQty: String(num(m, 'min_stock_qty', 'minStockQty', 'reorder_level', 'reorderLevel') || ''),
      unitPrice: String(num(m, 'unit_price', 'unitPrice') || ''),
      barcode: str(m, 'barcode'),
      hsnCode: str(m, 'hsn_code', 'hsnCode'),
      gstPercent: String(num(m, 'gst_percent', 'gstPercent') || ''),
      mrp: String(num(m, 'mrp') || ''),
      purchasePrice: String(num(m, 'purchase_price', 'purchasePrice') || ''),
      manufacturer: str(m, 'manufacturer'),
    });
  };

  const onPurchaseSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseForm.supplierId) return toast.error('Select supplier');
    const items = purchaseLines
      .filter((l) => l.medicineId && Number(l.qty))
      .map((l) => ({
        medicineId: l.medicineId,
        batchNo: l.batchNo.trim() || null,
        expiryDate: l.expiryDate || null,
        qty: Number(l.qty),
        purchasePrice: Number(l.purchasePrice) || 0,
        mrp: Number(l.mrp) || 0,
        gstPercent: Number(l.gstPercent) || 0,
        salePrice: Number(l.salePrice) || 0,
      }));
    if (!items.length) return toast.error('Add at least one purchase line');
    setSaving(true);
    const result = await createPharmacyPurchase({
      supplierId: purchaseForm.supplierId,
      invoiceNo: purchaseForm.invoiceNo.trim() || null,
      purchaseDate: purchaseForm.purchaseDate,
      notes: purchaseForm.notes.trim() || null,
      items,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Purchase recorded — stock updated');
      setPurchaseForm({ supplierId: '', invoiceNo: '', purchaseDate: toDate(new Date()), notes: '' });
      setPurchaseLines([emptyPurchaseLine()]);
    } else toast.error(result.error || 'Failed');
  };

  const onSupplierSubmit = async (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return toast.error('Supplier name required');
    setSaving(true);
    const payload = {
      name: supplierForm.name.trim(),
      phone: supplierForm.phone.trim() || null,
      email: supplierForm.email.trim() || null,
      address: supplierForm.address.trim() || null,
      gstNo: supplierForm.gstNo.trim() || null,
    };
    const result = editSupplierId
      ? await updatePharmacySupplier(editSupplierId, payload)
      : await createPharmacySupplier(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editSupplierId ? 'Supplier updated' : 'Supplier added');
      setSupplierForm(emptySupplier);
      setEditSupplierId(null);
    } else toast.error(result.error || 'Failed');
  };

  const onEditSupplier = (s) => {
    setEditSupplierId(s.id);
    setSupplierForm({
      name: s.name || '',
      phone: str(s, 'phone'),
      email: str(s, 'email'),
      address: str(s, 'address'),
      gstNo: str(s, 'gst_no', 'gstNo'),
    });
  };

  const loadBillDetail = async (billId) => {
    if (expandedBillId === billId) {
      setExpandedBillId(null);
      setBillDetail(null);
      return;
    }
    setExpandedBillId(billId);
    const result = await getPharmacyBill(billId);
    if (result.success) setBillDetail(result.data);
    else toast.error(result.error || 'Failed to load bill');
  };

  const startReturn = async (billId) => {
    setReturnBillId(String(billId));
    setReturnReason('');
    const result = await getPharmacyBill(billId);
    if (result.success) {
      const lines = result.data?.lines || result.data?.items || [];
      setReturnLines(lines.map((l) => ({
        saleLineId: l.id ?? l.saleLineId ?? l.sale_line_id,
        name: str(l, 'medicine_name', 'medicineName', 'name'),
        maxQty: num(l, 'qty', 'quantity'),
        returnQty: '',
      })));
    }
  };

  const onReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnBillId) return toast.error('Select a bill');
    const items = returnLines
      .filter((l) => Number(l.returnQty) > 0)
      .map((l) => ({ saleLineId: l.saleLineId, qty: Number(l.returnQty) }));
    if (!items.length) return toast.error('Enter return quantities');
    setSaving(true);
    const result = await createPharmacyReturn({
      saleBillId: returnBillId,
      reason: returnReason.trim() || null,
      items,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Return processed');
      setReturnBillId('');
      setReturnReason('');
      setReturnLines([]);
    } else toast.error(result.error || 'Return failed');
  };

  const supplierName = (id) => (pharmacySuppliers || []).find((s) => String(s.id) === String(id))?.name || '—';
  const patientName = (id) => (patients || []).find((p) => String(p.id) === String(id))?.name || '—';

  if (!canView) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500">
        You do not have permission to view pharmacy.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Pharmacy POS</h1>
        <p className="text-sm text-gray-500">Point of sale, stock, purchases & billing</p>
      </div>

      {(lowStock.length > 0 || (expiryAlerts || []).length > 0) && tab !== 'alerts' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-wrap gap-3 justify-between items-start">
          {lowStock.length > 0 && (
            <p className="text-sm text-amber-900">
              <span className="font-semibold">{lowStock.length} low stock</span>
              {' — '}
              {lowStock.slice(0, 3).map((m) => m.name).join(', ')}
              {lowStock.length > 3 ? '…' : ''}
            </p>
          )}
          {(expiryAlerts || []).length > 0 && (
            <p className="text-sm text-red-800">
              <span className="font-semibold">{expiryAlerts.length} expiry alert(s)</span>
            </p>
          )}
          <button type="button" onClick={() => setTab('alerts')} className="text-xs text-cyan-700 font-medium">View alerts</button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-cyan-700 text-cyan-700 bg-cyan-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* ── POS TAB ── */}
          {tab === 'pos' && (
            <div className="space-y-4">
              {canManage && (
                <>
                  <div className="relative">
                    <input
                      className={inputCls}
                      placeholder="Search medicine by name or barcode…"
                      value={searchQ}
                      onChange={(e) => setSearchQ(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchResults.length === 1) addToCart(searchResults[0]);
                      }}
                    />
                    {searching && <p className="text-xs text-gray-400 mt-1">Searching…</p>}
                    {searchResults.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((item) => (
                          <li key={item.id ?? item.medicineId}>
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-cyan-50 flex justify-between"
                              onClick={() => addToCart(item)}
                            >
                              <span>{item.name}</span>
                              <span className="text-gray-500 tabular-nums">
                                {rs(num(item, 'unit_price', 'unitPrice'))} · {num(item, 'stock_qty', 'stockQty')} left
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {cart.length > 0 ? (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-3 py-2">Item</th>
                            <th className="px-3 py-2">Batch</th>
                            <th className="px-3 py-2">Qty</th>
                            <th className="px-3 py-2">Price</th>
                            <th className="px-3 py-2">GST%</th>
                            <th className="px-3 py-2 text-right">Total</th>
                            <th className="px-3 py-2" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {cart.map((line) => {
                            const lineSub = line.qty * line.unitPrice;
                            const lineTotal = lineSub + lineSub * (line.gstPercent / 100);
                            return (
                              <tr key={line.key}>
                                <td className="px-3 py-2 font-medium">{line.name}</td>
                                <td className="px-3 py-2">
                                  {line.batches?.length ? (
                                    <select
                                      className="border border-gray-300 rounded px-2 py-1 text-xs w-full max-w-[120px]"
                                      value={line.batchId}
                                      onChange={(e) => updateCartLine(line.key, 'batchId', e.target.value)}
                                    >
                                      {line.batches.map((b) => (
                                        <option key={b.id ?? b.batchId} value={b.id ?? b.batchId}>
                                          {str(b, 'batch_no', 'batchNo') || `#${b.id}`}
                                        </option>
                                      ))}
                                    </select>
                                  ) : '—'}
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="1"
                                    className="border border-gray-300 rounded px-2 py-1 text-xs w-16"
                                    value={line.qty}
                                    onChange={(e) => updateCartLine(line.key, 'qty', e.target.value)}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="border border-gray-300 rounded px-2 py-1 text-xs w-20"
                                    value={line.unitPrice}
                                    onChange={(e) => updateCartLine(line.key, 'unitPrice', e.target.value)}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    className="border border-gray-300 rounded px-2 py-1 text-xs w-14"
                                    value={line.gstPercent}
                                    onChange={(e) => updateCartLine(line.key, 'gstPercent', e.target.value)}
                                  />
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">{rs(lineTotal)}</td>
                                <td className="px-3 py-2">
                                  <button type="button" onClick={() => removeCartLine(line.key)} className="text-red-600 text-xs">Remove</button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-6">Search and add medicines to cart</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <select className={inputCls} value={posPatientId} onChange={(e) => setPosPatientId(e.target.value)}>
                      <option value="">Patient (optional)</option>
                      {(patients || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className={inputCls} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                      {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <input
                      className={inputCls}
                      type="number"
                      min="0"
                      placeholder="Discount"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                    <input
                      className={inputCls}
                      placeholder="Notes"
                      value={posNotes}
                      onChange={(e) => setPosNotes(e.target.value)}
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="tabular-nums">{rs(cartTotals.subtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">GST</span><span className="tabular-nums">{rs(cartTotals.gstTotal)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Discount</span><span className="tabular-nums">−{rs(cartTotals.discount)}</span></div>
                    <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Grand total</span><span className="tabular-nums">{rs(cartTotals.grandTotal)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button type="button" disabled={saving || !cart.length} onClick={onCheckout} className={btnPrimary}>
                      Checkout {paymentMode === 'CREDIT' ? '(Credit)' : '& Pay'}
                    </button>
                    <button type="button" onClick={() => setCart([])} className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Clear cart
                    </button>
                  </div>
                </>
              )}
              {!canManage && <p className="text-sm text-gray-500">View-only — checkout requires manage permission.</p>}
            </div>
          )}

          {/* ── MEDICINES TAB ── */}
          {tab === 'medicines' && (
            <div className="space-y-4">
              {canManage && (
                <form onSubmit={onMedSubmit} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <h2 className="text-sm font-semibold text-gray-900">{editMedId ? 'Edit medicine' : 'Add medicine'}</h2>
                  <input className={inputCls} placeholder="Name *" value={medForm.name} onChange={(e) => setMedForm((f) => ({ ...f, name: e.target.value }))} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    <select className={inputCls} value={medForm.unit} onChange={(e) => setMedForm((f) => ({ ...f, unit: e.target.value }))}>
                      {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input className={inputCls} placeholder="Barcode" value={medForm.barcode} onChange={(e) => setMedForm((f) => ({ ...f, barcode: e.target.value }))} />
                    <input className={inputCls} placeholder="HSN code" value={medForm.hsnCode} onChange={(e) => setMedForm((f) => ({ ...f, hsnCode: e.target.value }))} />
                    <input className={inputCls} placeholder="Manufacturer" value={medForm.manufacturer} onChange={(e) => setMedForm((f) => ({ ...f, manufacturer: e.target.value }))} />
                    <input className={inputCls} type="number" placeholder="Stock qty" value={medForm.stockQty} onChange={(e) => setMedForm((f) => ({ ...f, stockQty: e.target.value }))} />
                    <input className={inputCls} type="number" placeholder="Reorder level" value={medForm.minStockQty} onChange={(e) => setMedForm((f) => ({ ...f, minStockQty: e.target.value }))} />
                    <input className={inputCls} type="number" step="0.01" placeholder="Unit price" value={medForm.unitPrice} onChange={(e) => setMedForm((f) => ({ ...f, unitPrice: e.target.value }))} />
                    <input className={inputCls} type="number" step="0.01" placeholder="MRP" value={medForm.mrp} onChange={(e) => setMedForm((f) => ({ ...f, mrp: e.target.value }))} />
                    <input className={inputCls} type="number" step="0.01" placeholder="Purchase price" value={medForm.purchasePrice} onChange={(e) => setMedForm((f) => ({ ...f, purchasePrice: e.target.value }))} />
                    <input className={inputCls} type="number" placeholder="GST %" value={medForm.gstPercent} onChange={(e) => setMedForm((f) => ({ ...f, gstPercent: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className={btnPrimary}>{editMedId ? 'Update' : 'Add medicine'}</button>
                    {editMedId && (
                      <button type="button" onClick={() => { setEditMedId(null); setMedForm(emptyMed); }} className="border border-gray-300 rounded-lg px-4 py-2 text-sm">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Stock</th>
                      <th className="px-3 py-2">Unit price</th>
                      <th className="px-3 py-2">MRP</th>
                      <th className="px-3 py-2">GST%</th>
                      <th className="px-3 py-2">Barcode</th>
                      {canManage && <th className="px-3 py-2">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(medicines || []).map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-2">
                          <span className="font-medium">{m.name}</span>
                          {isLowStock(m) && (
                            <span className="ml-2 text-[10px] uppercase font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Low</span>
                          )}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{num(m, 'stock_qty', 'stockQty')} {m.unit}</td>
                        <td className="px-3 py-2 tabular-nums">{rs(num(m, 'unit_price', 'unitPrice'))}</td>
                        <td className="px-3 py-2 tabular-nums">{rs(num(m, 'mrp'))}</td>
                        <td className="px-3 py-2">{num(m, 'gst_percent', 'gstPercent') || '—'}</td>
                        <td className="px-3 py-2 text-xs">{str(m, 'barcode') || '—'}</td>
                        {canManage && (
                          <td className="px-3 py-2">
                            <button type="button" onClick={() => onEditMed(m)} className={btnSecondary}>Edit</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!(medicines || []).length && <p className="text-center text-gray-500 py-6 text-sm">No medicines.</p>}
              </div>
            </div>
          )}

          {/* ── PURCHASE TAB ── */}
          {tab === 'purchase' && (
            <div className="space-y-4">
              {canManage ? (
                <form onSubmit={onPurchaseSubmit} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <h2 className="text-sm font-semibold text-gray-900">Record purchase (stock IN)</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    <select className={inputCls} value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm((f) => ({ ...f, supplierId: e.target.value }))} required>
                      <option value="">Supplier *</option>
                      {(pharmacySuppliers || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input className={inputCls} placeholder="Invoice no" value={purchaseForm.invoiceNo} onChange={(e) => setPurchaseForm((f) => ({ ...f, invoiceNo: e.target.value }))} />
                    <input type="date" className={inputCls} value={purchaseForm.purchaseDate} onChange={(e) => setPurchaseForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
                    <input className={inputCls} placeholder="Notes" value={purchaseForm.notes} onChange={(e) => setPurchaseForm((f) => ({ ...f, notes: e.target.value }))} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Line items</p>
                    {purchaseLines.map((line, idx) => (
                      <div key={idx} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 items-end">
                        <select
                          className={inputCls}
                          value={line.medicineId}
                          onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, medicineId: e.target.value } : r)))}
                        >
                          <option value="">Medicine</option>
                          {(medicines || []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <input className={inputCls} placeholder="Batch no" value={line.batchNo} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, batchNo: e.target.value } : r)))} />
                        <input type="date" className={inputCls} value={line.expiryDate} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, expiryDate: e.target.value } : r)))} />
                        <input className={inputCls} type="number" placeholder="Qty" value={line.qty} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, qty: e.target.value } : r)))} />
                        <input className={inputCls} type="number" step="0.01" placeholder="Purchase ₹" value={line.purchasePrice} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, purchasePrice: e.target.value } : r)))} />
                        <input className={inputCls} type="number" step="0.01" placeholder="MRP" value={line.mrp} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, mrp: e.target.value } : r)))} />
                        <input className={inputCls} type="number" placeholder="GST%" value={line.gstPercent} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, gstPercent: e.target.value } : r)))} />
                        <div className="flex gap-1">
                          <input className={`${inputCls} flex-1`} type="number" step="0.01" placeholder="Sale ₹" value={line.salePrice} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, salePrice: e.target.value } : r)))} />
                          {purchaseLines.length > 1 && (
                            <button type="button" onClick={() => setPurchaseLines((rows) => rows.filter((_, i) => i !== idx))} className="text-red-600 text-xs px-2">×</button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => setPurchaseLines((rows) => [...rows, emptyPurchaseLine()])} className="text-sm text-cyan-700 font-medium">
                      + Add line
                    </button>
                  </div>

                  <button type="submit" disabled={saving} className={btnPrimary}>Submit purchase</button>
                </form>
              ) : (
                <p className="text-sm text-gray-500">View-only — recording purchases requires manage permission.</p>
              )}

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-900">Recent purchases</h3>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Supplier</th>
                      <th className="px-3 py-2">Invoice</th>
                      <th className="px-3 py-2">Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(pharmacyPurchases || []).slice(0, 20).map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2">{String(str(p, 'purchase_date', 'purchaseDate') || p.created_at || '').slice(0, 10)}</td>
                        <td className="px-3 py-2">{p.supplier_name || p.supplierName || supplierName(p.supplier_id || p.supplierId)}</td>
                        <td className="px-3 py-2">{str(p, 'invoice_no', 'invoiceNo') || '—'}</td>
                        <td className="px-3 py-2">{(p.items || p.lines || []).length || p.item_count || p.itemCount || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!(pharmacyPurchases || []).length && <p className="text-center text-gray-500 py-6 text-sm">No purchases yet.</p>}
              </div>
            </div>
          )}

          {/* ── SUPPLIERS TAB ── */}
          {tab === 'suppliers' && (
            <div className="space-y-4">
              {canManage && (
                <form onSubmit={onSupplierSubmit} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <h2 className="text-sm font-semibold text-gray-900">{editSupplierId ? 'Edit supplier' : 'Add supplier'}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input className={inputCls} placeholder="Name *" value={supplierForm.name} onChange={(e) => setSupplierForm((f) => ({ ...f, name: e.target.value }))} />
                    <input className={inputCls} placeholder="Phone" value={supplierForm.phone} onChange={(e) => setSupplierForm((f) => ({ ...f, phone: e.target.value }))} />
                    <input className={inputCls} placeholder="Email" value={supplierForm.email} onChange={(e) => setSupplierForm((f) => ({ ...f, email: e.target.value }))} />
                    <input className={inputCls} placeholder="GST no" value={supplierForm.gstNo} onChange={(e) => setSupplierForm((f) => ({ ...f, gstNo: e.target.value }))} />
                    <input className={`${inputCls} sm:col-span-2`} placeholder="Address" value={supplierForm.address} onChange={(e) => setSupplierForm((f) => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className={btnPrimary}>{editSupplierId ? 'Update' : 'Add supplier'}</button>
                    {editSupplierId && (
                      <button type="button" onClick={() => { setEditSupplierId(null); setSupplierForm(emptySupplier); }} className="border border-gray-300 rounded-lg px-4 py-2 text-sm">Cancel</button>
                    )}
                  </div>
                </form>
              )}

              <ul className="divide-y divide-gray-100 border border-gray-200 rounded-lg">
                {(pharmacySuppliers || []).map((s) => (
                  <li key={s.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">
                        {[str(s, 'phone'), str(s, 'email'), str(s, 'gst_no', 'gstNo')].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                    {canManage && (
                      <button type="button" onClick={() => onEditSupplier(s)} className={btnSecondary}>Edit</button>
                    )}
                  </li>
                ))}
              </ul>
              {!(pharmacySuppliers || []).length && <p className="text-center text-gray-500 py-6 text-sm">No suppliers.</p>}
            </div>
          )}

          {/* ── BILLS TAB ── */}
          {tab === 'bills' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Bill #</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Patient</th>
                      <th className="px-3 py-2">Payment</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(pharmacyBills || []).map((b) => (
                      <React.Fragment key={b.id}>
                        <tr>
                          <td className="px-3 py-2 font-medium">{str(b, 'bill_no', 'billNo') || `#${b.id}`}</td>
                          <td className="px-3 py-2">{String(str(b, 'bill_date', 'billDate', 'created_at') || '').slice(0, 10)}</td>
                          <td className="px-3 py-2">{b.patient_name || b.patientName || patientName(b.patient_id || b.patientId) || 'Walk-in'}</td>
                          <td className="px-3 py-2">{str(b, 'payment_mode', 'paymentMode') || '—'}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{rs(num(b, 'grand_total', 'grandTotal', 'total_amount', 'totalAmount'))}</td>
                          <td className="px-3 py-2 space-x-2">
                            <button type="button" onClick={() => loadBillDetail(b.id)} className="text-cyan-700 text-xs font-medium">
                              {expandedBillId === b.id ? 'Hide' : 'View'}
                            </button>
                            {canManage && (
                              <button type="button" onClick={() => startReturn(b.id)} className="text-amber-700 text-xs font-medium">Return</button>
                            )}
                          </td>
                        </tr>
                        {expandedBillId === b.id && billDetail && (
                          <tr>
                            <td colSpan={6} className="px-3 py-3 bg-gray-50">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-gray-500 uppercase">
                                    <th className="text-left py-1">Medicine</th>
                                    <th className="text-left py-1">Qty</th>
                                    <th className="text-left py-1">Price</th>
                                    <th className="text-right py-1">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(billDetail.lines || billDetail.items || []).map((l) => (
                                    <tr key={l.id}>
                                      <td className="py-1">{str(l, 'medicine_name', 'medicineName', 'name')}</td>
                                      <td className="py-1">{num(l, 'qty', 'quantity')}</td>
                                      <td className="py-1 tabular-nums">{rs(num(l, 'unit_price', 'unitPrice'))}</td>
                                      <td className="py-1 text-right tabular-nums">{rs(num(l, 'line_total', 'lineTotal', 'line_amount', 'lineAmount'))}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
                {!(pharmacyBills || []).length && <p className="text-center text-gray-500 py-6 text-sm">No bills yet.</p>}
              </div>

              {canManage && returnBillId && (
                <form onSubmit={onReturnSubmit} className="border border-amber-200 bg-amber-50/50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Process return — Bill #{returnBillId}</h3>
                  <input className={inputCls} placeholder="Reason" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
                  <div className="space-y-2">
                    {returnLines.map((l) => (
                      <div key={l.saleLineId} className="flex items-center gap-3 text-sm">
                        <span className="flex-1">{l.name}</span>
                        <span className="text-gray-500 text-xs">max {l.maxQty}</span>
                        <input
                          type="number"
                          min="0"
                          max={l.maxQty}
                          className="border border-gray-300 rounded px-2 py-1 w-20 text-sm"
                          placeholder="Return qty"
                          value={l.returnQty}
                          onChange={(e) => setReturnLines((rows) => rows.map((r) => (
                            r.saleLineId === l.saleLineId ? { ...r, returnQty: e.target.value } : r
                          )))}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className={btnPrimary}>Submit return</button>
                    <button type="button" onClick={() => { setReturnBillId(''); setReturnLines([]); }} className="border border-gray-300 rounded-lg px-4 py-2 text-sm">Cancel</button>
                  </div>
                </form>
              )}

              {(pharmacyReturns || []).length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Recent returns</h3>
                  </div>
                  <ul className="divide-y divide-gray-100 text-sm">
                    {(pharmacyReturns || []).slice(0, 10).map((r) => (
                      <li key={r.id} className="px-4 py-2 flex justify-between">
                        <span>Bill {str(r, 'sale_bill_id', 'saleBillId')} — {str(r, 'reason') || 'No reason'}</span>
                        <span className="text-gray-500 text-xs">{String(r.created_at || r.return_date || '').slice(0, 10)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── ALERTS TAB ── */}
          {tab === 'alerts' && (
            <div className="space-y-4">
              <div className="border border-amber-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
                  <h3 className="text-sm font-semibold text-amber-900">Low stock ({lowStock.length})</h3>
                </div>
                {lowStock.length ? (
                  <ul className="divide-y divide-gray-100">
                    {lowStock.map((m) => (
                      <li key={m.id} className="px-4 py-3 flex justify-between text-sm">
                        <span className="font-medium">{m.name}</span>
                        <span className="text-amber-800 tabular-nums">
                          {num(m, 'stock_qty', 'stockQty')} / reorder {num(m, 'min_stock_qty', 'minStockQty', 'reorder_level', 'reorderLevel')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500 py-6 text-sm">All medicines above reorder level.</p>
                )}
              </div>

              <div className="border border-red-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-red-50 border-b border-red-200">
                  <h3 className="text-sm font-semibold text-red-900">Expiry alerts ({(expiryAlerts || []).length})</h3>
                </div>
                {(expiryAlerts || []).length ? (
                  <ul className="divide-y divide-gray-100">
                    {(expiryAlerts || []).map((a, i) => (
                      <li key={a.id ?? i} className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                        <span className="font-medium">{str(a, 'medicine_name', 'medicineName', 'name')}</span>
                        <span className="text-red-800 text-xs">
                          Batch {str(a, 'batch_no', 'batchNo') || '—'} · Exp {String(str(a, 'expiry_date', 'expiryDate') || '').slice(0, 10)} · Qty {num(a, 'qty', 'stock_qty', 'stockQty')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-500 py-6 text-sm">No expiry alerts.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalManagementPharmacyPage;
