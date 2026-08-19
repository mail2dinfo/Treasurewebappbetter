import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiChevronDown, FiChevronUp, FiPlus, FiSearch, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';
import { useHhBasePath } from '../../components/hospitalManagement/hospitalManagementMenuItems';
import HhSearchableSelect from '../../components/hospitalManagement/HhSearchableSelect';

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
  { id: 'pos', label: 'Sell' },
  { id: 'medicines', label: 'Medicines' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'bills', label: 'Bills' },
  { id: 'alerts', label: 'Alerts' },
];

const PAYMENT_MODES = ['CASH', 'UPI', 'CARD', 'BANK'];
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

const inputCls = 'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm';
const btnPrimary = 'inline-flex items-center justify-center rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60';
const btnGhost = 'inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50';
const btnSecondary = 'rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100';
const labelCls = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500';

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
    pharmacyOrders,
    fetchPharmacyOrders,
    ledgerAccounts,
    ledgerCategories,
    fetchLedgerAccounts,
    fetchLedgerCategories,
  } = useHospitalManagement();

  const { can, nav } = useHhPermission();
  const basePath = useHhBasePath();
  const canView = can('hh_pharmacy_view') || can('hh_pharmacy_manage');
  const canManage = can('hh_pharmacy_manage');

  const [tab, setTab] = useState('pos');
  const [saving, setSaving] = useState(false);
  const [medQuery, setMedQuery] = useState('');

  // POS state
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState([]);
  const [posPatientId, setPosPatientId] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [ledgerAccountId, setLedgerAccountId] = useState('');
  const [ledgerCategoryId, setLedgerCategoryId] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [showCheckoutConfirmation, setShowCheckoutConfirmation] = useState(false);
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
  const [returnLedgerAccountId, setReturnLedgerAccountId] = useState('');
  const [medicinesReceived, setMedicinesReceived] = useState(false);
  const [returnBillMeta, setReturnBillMeta] = useState(null);

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
    fetchPharmacyOrders();
    fetchLedgerAccounts();
    fetchLedgerCategories();
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
    fetchPharmacyOrders,
    fetchLedgerAccounts,
    fetchLedgerCategories,
  ]);

  useEffect(() => {
    if (!ledgerAccountId && ledgerAccounts?.length) {
      setLedgerAccountId(String(ledgerAccounts[0].id));
    }
  }, [ledgerAccountId, ledgerAccounts]);

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

  const onCheckout = () => {
    if (!cart.length) return toast.error('Cart is empty');
    if (!ledgerAccountId) {
      return toast.error('Select the ledger account receiving the payment');
    }
    setShowCheckoutConfirmation(true);
  };

  const confirmCheckout = async () => {
    if (!cart.length) return setShowCheckoutConfirmation(false);
    if (!ledgerAccountId) {
      return toast.error('Select the ledger account receiving the payment');
    }
    setSaving(true);
    const result = await pharmacyPosCheckout({
      patientId: posPatientId || null,
      paymentMode,
      ledgerAccountId,
      categoryId: ledgerCategoryId || null,
      transactionNumber: transactionRef.trim() || null,
      discount: Number(discount) || 0,
      notes: posNotes.trim() || null,
      items: cart.map((line) => ({
        medicineId: line.medicineId,
        batchId: line.batchId || null,
        qty: line.qty,
        unitPrice: line.unitPrice,
        gstPercent: line.gstPercent,
      })),
      payNow: true,
    });
    setSaving(false);
    if (result.success) {
      const billNo =
        str(result.data?.bill, 'billNo', 'bill_no', 'billNumber', 'bill_number')
        || result.data?.bill?.id
        || '';
      toast.success(billNo ? `Bill #${billNo} created` : 'Checkout successful');
      setShowCheckoutConfirmation(false);
      setCart([]);
      setPosPatientId('');
      setDiscount('');
      setPosNotes('');
      setPaymentMode('CASH');
      setLedgerCategoryId('');
      setTransactionRef('');
    } else {
      toast.error(result.error || 'Checkout failed');
    }
  };

  const onMedSubmit = async (e) => {
    e.preventDefault();
    if (!medForm.name.trim()) return toast.error('Medicine name required');
    if (medForm.unitPrice === '' || Number.isNaN(Number(medForm.unitPrice))) {
      return toast.error('Enter a valid unit price (use 0 if free)');
    }
    setSaving(true);
    const payload = {
      name: medForm.name.trim(),
      unit: medForm.unit,
      stockQty: Number(medForm.stockQty) || 0,
      minStockQty: Number(medForm.minStockQty) || 0,
      unitPrice: Number(medForm.unitPrice),
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
      toast.success(editMedId ? 'Medicine price/details updated' : 'Medicine added');
      setMedForm(emptyMed);
      setEditMedId(null);
      fetchLowStock();
    } else toast.error(result.error || 'Failed to save medicine');
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

  const startReturn = async (billId, bill) => {
    const status = String(bill?.status || '').toUpperCase();
    if (status && !['PAID', 'PARTIAL'].includes(status)) {
      return toast.error('Only paid bills can be returned');
    }
    setReturnBillId(String(billId));
    setReturnReason('');
    setMedicinesReceived(false);
    const result = await getPharmacyBill(billId);
    if (!result.success) return toast.error(result.error || 'Could not load bill to recheck medicines');
    const detail = result.data || {};
    const lines = detail.lines || detail.items || [];
    setReturnBillMeta({
      billNo: str(detail, 'bill_no', 'billNo') || str(bill, 'bill_no', 'billNo'),
      patient: detail.patient_name || bill?.patient_name || 'Walk-in',
      total: num(detail, 'total_amount', 'totalAmount', 'grand_total', 'grandTotal'),
    });
    setReturnLedgerAccountId(
      String(detail.ledger_account_id || bill?.ledger_account_id || ledgerAccountId || ledgerAccounts?.[0]?.id || '')
    );
    setReturnLines(lines.map((l) => {
      const billedQty = num(l, 'billed_qty', 'dispensed_qty', 'qty', 'quantity');
      const alreadyReturned = num(l, 'returned_qty');
      const remainingQty = num(l, 'remaining_qty') || Math.max(0, billedQty - alreadyReturned);
      const unitPrice = num(l, 'unit_price', 'unitPrice');
      return {
        saleLineId: l.id ?? l.saleLineId ?? l.sale_line_id,
        name: str(l, 'medicine_name', 'medicineName', 'name'),
        billedQty,
        alreadyReturned,
        remainingQty,
        unitPrice,
        returnQty: '',
      };
    }));
    setTab('bills');
  };

  const returnRefundTotal = returnLines.reduce((sum, line) => {
    const qty = Number(line.returnQty) || 0;
    return sum + qty * (Number(line.unitPrice) || 0);
  }, 0);

  const onReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnBillId) return toast.error('Select a bill');
    if (!medicinesReceived) return toast.error('Recheck and receive the medicines from the patient first');
    if (!returnLedgerAccountId) return toast.error('Select the ledger account to pay the refund from');
    const invalid = returnLines.find((l) => Number(l.returnQty) > Number(l.remainingQty));
    if (invalid) return toast.error(`${invalid.name} return qty is more than billed remaining qty`);
    const items = returnLines
      .filter((l) => Number(l.returnQty) > 0)
      .map((l) => ({ saleLineId: l.saleLineId, qty: Number(l.returnQty) }));
    if (!items.length) return toast.error('Enter how many billed medicines were received back');
    setSaving(true);
    const result = await createPharmacyReturn({
      saleBillId: returnBillId,
      reason: returnReason.trim() || null,
      items,
      medicinesReceived: true,
      ledgerAccountId: returnLedgerAccountId,
    });
    setSaving(false);
    if (result.success) {
      const refund = Number(result.data?.refund_amount ?? returnRefundTotal);
      const newBal = result.data?.account_balance_after;
      toast.success(
        newBal != null
          ? `₹${refund.toFixed(2)} returned to patient. Ledger balance is now ₹${Number(newBal).toFixed(2)}`
          : `₹${refund.toFixed(2)} returned to patient and logged in ledger`
      );
      setReturnBillId('');
      setReturnReason('');
      setReturnLines([]);
      setMedicinesReceived(false);
      setReturnBillMeta(null);
      fetchLedgerAccounts();
    } else toast.error(result.error || 'Return failed');
  };

  const pendingDoctorRx = useMemo(() => (
    (Array.isArray(pharmacyOrders) ? pharmacyOrders : [])
      .filter((order) => ['PENDING', 'PICKED_UP', 'PACKING', 'READY'].includes(String(order.status || '').toUpperCase()))
      .filter((order) => {
        const source = String(order.source || order.order_type || '').toUpperCase();
        if (source === 'IPD_WARD' || source === 'IPD') return false;
        return source === 'OPD' || order.visit_id || order.visitId;
      })
      .sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))
  ), [pharmacyOrders]);
  const filteredMedicines = useMemo(() => {
    const term = medQuery.trim().toLowerCase();
    const list = medicines || [];
    if (!term) return list;
    return list.filter((m) => (
      String(m.name || '').toLowerCase().includes(term)
      || String(str(m, 'barcode')).toLowerCase().includes(term)
      || String(str(m, 'manufacturer')).toLowerCase().includes(term)
    ));
  }, [medicines, medQuery]);
  const supplierName = (id) => (pharmacySuppliers || []).find((s) => String(s.id) === String(id))?.name || '—';
  const patientName = (id) => (patients || []).find((p) => String(p.id) === String(id))?.name || 'Walk-in';
  const billNoOf = (b) => str(b, 'bill_no', 'billNo');
  const shortDate = (value) => {
    const raw = String(value || '').slice(0, 10);
    if (!raw) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (!canView) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-center text-gray-500">
        You do not have permission to view pharmacy.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-5">
      <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-indigo-700 to-cyan-700 px-5 py-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">Pharmacy</p>
              <h1 className="mt-1 text-2xl font-bold">Walk-in POS</h1>
              <p className="mt-1 text-sm text-indigo-100">Sell medicines, manage stock, purchases and bills</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to={`${basePath}/pharmacy-desk?view=doctor-prescriptions`}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-800 hover:bg-indigo-50"
              >
                Doctor Rx
              </Link>
              {nav.ledger && (
                <Link
                  to={`${basePath}/ledger`}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Ledger
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4">
          {[
            ['Cart', cart.length, 'text-indigo-700'],
            ['Doctor Rx', pendingDoctorRx.length, 'text-sky-700'],
            ['Low stock', lowStock.length, 'text-amber-700'],
            ['Expiry', (expiryAlerts || []).length, 'text-rose-700'],
          ].map(([label, count, color]) => (
            <div key={label} className="px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
              <p className={`mt-1 text-xl font-bold ${color}`}>{count}</p>
            </div>
          ))}
        </div>
      </div>

      {pendingDoctorRx.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-950">
              {pendingDoctorRx.length} doctor prescription{pendingDoctorRx.length === 1 ? '' : 's'} waiting
            </p>
            <p className="mt-1 text-sm text-indigo-800">
              {pendingDoctorRx.slice(0, 3).map((order) => order.patient_name || order.patientName || 'Patient').join(' · ')}
            </p>
          </div>
          <Link
            to={`${basePath}/pharmacy-desk?view=doctor-prescriptions`}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800"
          >
            Open desk
          </Link>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
              tab === t.id ? 'bg-indigo-700 text-white' : 'border border-gray-200 bg-white text-gray-600'
            }`}
          >
            {t.label}
            {t.id === 'alerts' && (lowStock.length + (expiryAlerts || []).length) > 0
              ? ` (${lowStock.length + (expiryAlerts || []).length})`
              : ''}
          </button>
        ))}
      </div>

      <div>
          {/* ── POS TAB ── */}
          {tab === 'pos' && (
            <div>
              {!canManage ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-sm text-gray-500">
                  View-only — checkout requires manage permission.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-12">
                  <div className="space-y-3 lg:col-span-7">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <label className={labelCls}>Search medicine</label>
                      <div className="relative">
                        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          className={`${inputCls} pl-9`}
                          placeholder="Name or barcode — Enter to add the first match"
                          value={searchQ}
                          onChange={(e) => setSearchQ(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchResults.length === 1) addToCart(searchResults[0]);
                          }}
                        />
                      </div>
                      {searching && <p className="mt-2 text-xs text-gray-400">Searching…</p>}
                      {searchResults.length > 0 && (
                        <ul className="mt-3 divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200">
                          {searchResults.map((item) => {
                            const stock = num(item, 'stock_qty', 'stockQty');
                            return (
                              <li key={item.id ?? item.medicineId}>
                                <button
                                  type="button"
                                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-indigo-50"
                                  onClick={() => addToCart(item)}
                                >
                                  <span>
                                    <span className="block text-sm font-semibold text-gray-900">{item.name}</span>
                                    <span className="text-xs text-gray-500">{rs(num(item, 'unit_price', 'unitPrice'))}</span>
                                  </span>
                                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${stock <= 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {stock} in stock
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {cart.length ? (
                      <div className="space-y-2">
                        {cart.map((line) => {
                          const lineSub = line.qty * line.unitPrice;
                          const lineTotal = lineSub + lineSub * (line.gstPercent / 100);
                          return (
                            <article key={line.key} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="text-sm font-bold text-gray-900">{line.name}</h3>
                                <button
                                  type="button"
                                  onClick={() => removeCartLine(line.key)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800"
                                >
                                  <FiTrash2 /> Remove
                                </button>
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <label>
                                  <span className={labelCls}>Batch</span>
                                  {line.batches?.length ? (
                                    <select
                                      className={inputCls}
                                      value={line.batchId}
                                      onChange={(e) => updateCartLine(line.key, 'batchId', e.target.value)}
                                    >
                                      {line.batches.map((b) => (
                                        <option key={b.id ?? b.batchId} value={b.id ?? b.batchId}>
                                          {str(b, 'batch_no', 'batchNo') || 'Batch'}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <p className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-400">—</p>
                                  )}
                                </label>
                                <label>
                                  <span className={labelCls}>Qty</span>
                                  <input
                                    type="number"
                                    min="1"
                                    className={inputCls}
                                    value={line.qty}
                                    onChange={(e) => updateCartLine(line.key, 'qty', e.target.value)}
                                  />
                                </label>
                                <label>
                                  <span className={labelCls}>Unit ₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className={inputCls}
                                    value={line.unitPrice}
                                    onChange={(e) => updateCartLine(line.key, 'unitPrice', e.target.value)}
                                  />
                                </label>
                                <label>
                                  <span className={labelCls}>GST %</span>
                                  <input
                                    type="number"
                                    min="0"
                                    className={inputCls}
                                    value={line.gstPercent}
                                    onChange={(e) => updateCartLine(line.key, 'gstPercent', e.target.value)}
                                  />
                                </label>
                              </div>
                              <p className="mt-3 text-right text-base font-bold text-gray-900">{rs(lineTotal)}</p>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                        <FiShoppingCart className="mx-auto text-2xl text-gray-300" />
                        <p className="mt-2 text-base font-semibold text-gray-900">Cart is empty</p>
                        <p className="mt-1 text-sm text-gray-500">Search a medicine to start a walk-in sale.</p>
                      </div>
                    )}
                  </div>

                  <aside className="lg:col-span-5">
                    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
                      <h2 className="text-sm font-bold text-gray-900">Checkout</h2>
                      <HhSearchableSelect
                        label="Patient"
                        placeholder="Walk-in or search patient"
                        value={posPatientId}
                        options={patients || []}
                        onChange={(id) => setPosPatientId(id)}
                      />
                      {posPatientId && (
                        <button type="button" onClick={() => setPosPatientId('')} className="text-xs font-semibold text-indigo-700">
                          Use walk-in instead
                        </button>
                      )}
                      <label>
                        <span className={labelCls}>Payment</span>
                        <select className={inputCls} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                          {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className={labelCls}>Discount ₹</span>
                        <input
                          className={inputCls}
                          type="number"
                          min="0"
                          placeholder="0.00"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                        />
                      </label>
                      <label>
                        <span className={labelCls}>Notes</span>
                        <input
                          className={inputCls}
                          placeholder="Optional"
                          value={posNotes}
                          onChange={(e) => setPosNotes(e.target.value)}
                        />
                      </label>
                      <div className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
                        <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="tabular-nums">{rs(cartTotals.subtotal)}</span></div>
                        <div className="flex justify-between text-gray-600"><span>GST</span><span className="tabular-nums">{rs(cartTotals.gstTotal)}</span></div>
                        <div className="flex justify-between text-gray-600"><span>Discount</span><span className="tabular-nums">−{rs(cartTotals.discount)}</span></div>
                        <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                          <span>Total</span><span className="tabular-nums">{rs(cartTotals.grandTotal)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button type="button" disabled={saving || !cart.length} onClick={onCheckout} className={btnPrimary}>
                          Checkout & pay
                        </button>
                        <button type="button" onClick={() => setCart([])} className={btnGhost}>
                          Clear cart
                        </button>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          )}

          {/* ── MEDICINES TAB ── */}
          {tab === 'medicines' && (
            <div className="space-y-4">
              {canManage && (
                <form onSubmit={onMedSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900">{editMedId ? 'Edit medicine' : 'Add medicine'}</h2>
                  <label>
                    <span className={labelCls}>Name *</span>
                    <input className={inputCls} placeholder="Paracetamol 500" value={medForm.name} onChange={(e) => setMedForm((f) => ({ ...f, name: e.target.value }))} />
                  </label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <label>
                      <span className={labelCls}>Unit</span>
                      <select className={inputCls} value={medForm.unit} onChange={(e) => setMedForm((f) => ({ ...f, unit: e.target.value }))}>
                        {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className={labelCls}>Barcode</span>
                      <input className={inputCls} value={medForm.barcode} onChange={(e) => setMedForm((f) => ({ ...f, barcode: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>HSN</span>
                      <input className={inputCls} value={medForm.hsnCode} onChange={(e) => setMedForm((f) => ({ ...f, hsnCode: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>Manufacturer</span>
                      <input className={inputCls} value={medForm.manufacturer} onChange={(e) => setMedForm((f) => ({ ...f, manufacturer: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>Stock</span>
                      <input className={inputCls} type="number" value={medForm.stockQty} onChange={(e) => setMedForm((f) => ({ ...f, stockQty: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>Reorder</span>
                      <input className={inputCls} type="number" value={medForm.minStockQty} onChange={(e) => setMedForm((f) => ({ ...f, minStockQty: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>Unit price *</span>
                      <input className={inputCls} type="number" step="0.01" value={medForm.unitPrice} onChange={(e) => setMedForm((f) => ({ ...f, unitPrice: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>MRP</span>
                      <input className={inputCls} type="number" step="0.01" value={medForm.mrp} onChange={(e) => setMedForm((f) => ({ ...f, mrp: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>Purchase ₹</span>
                      <input className={inputCls} type="number" step="0.01" value={medForm.purchasePrice} onChange={(e) => setMedForm((f) => ({ ...f, purchasePrice: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>GST %</span>
                      <input className={inputCls} type="number" value={medForm.gstPercent} onChange={(e) => setMedForm((f) => ({ ...f, gstPercent: e.target.value }))} />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className={btnPrimary}>{editMedId ? 'Update' : 'Add medicine'}</button>
                    {editMedId && (
                      <button type="button" onClick={() => { setEditMedId(null); setMedForm(emptyMed); }} className={btnGhost}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative mb-3">
                  <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className={`${inputCls} pl-9`}
                    placeholder="Filter by name, barcode or manufacturer"
                    value={medQuery}
                    onChange={(e) => setMedQuery(e.target.value)}
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Medicine</th>
                        <th className="px-3 py-2.5 font-semibold">Stock</th>
                        <th className="px-3 py-2.5 font-semibold">Price</th>
                        <th className="px-3 py-2.5 font-semibold">MRP</th>
                        {canManage && <th className="px-3 py-2.5 font-semibold" />}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredMedicines.map((m) => (
                        <tr key={m.id}>
                          <td className="px-3 py-3">
                            <p className="font-semibold text-gray-900">{m.name}</p>
                            <p className="text-xs text-gray-500">{str(m, 'barcode') || m.unit}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isLowStock(m) ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                              {num(m, 'stock_qty', 'stockQty')} {m.unit}
                            </span>
                          </td>
                          <td className="px-3 py-3 tabular-nums">{rs(num(m, 'unit_price', 'unitPrice'))}</td>
                          <td className="px-3 py-3 tabular-nums text-gray-600">{rs(num(m, 'mrp'))}</td>
                          {canManage && (
                            <td className="px-3 py-3 text-right">
                              <button type="button" onClick={() => onEditMed(m)} className={btnSecondary}>Edit</button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!filteredMedicines.length && <p className="py-8 text-center text-sm text-gray-500">No medicines match.</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── PURCHASE TAB ── */}
          {tab === 'purchase' && (
            <div className="space-y-4">
              {canManage ? (
                <form onSubmit={onPurchaseSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900">Record purchase</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label>
                      <span className={labelCls}>Supplier *</span>
                      <select className={inputCls} value={purchaseForm.supplierId} onChange={(e) => setPurchaseForm((f) => ({ ...f, supplierId: e.target.value }))} required>
                        <option value="">Select supplier</option>
                        {(pharmacySuppliers || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className={labelCls}>Invoice no</span>
                      <input className={inputCls} value={purchaseForm.invoiceNo} onChange={(e) => setPurchaseForm((f) => ({ ...f, invoiceNo: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>Date</span>
                      <input type="date" className={inputCls} value={purchaseForm.purchaseDate} onChange={(e) => setPurchaseForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>Notes</span>
                      <input className={inputCls} value={purchaseForm.notes} onChange={(e) => setPurchaseForm((f) => ({ ...f, notes: e.target.value }))} />
                    </label>
                  </div>

                  <div className="space-y-3">
                    {purchaseLines.map((line, idx) => (
                      <div key={idx} className="space-y-3 rounded-xl border border-gray-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Line {idx + 1}</p>
                          {purchaseLines.length > 1 && (
                            <button type="button" onClick={() => setPurchaseLines((rows) => rows.filter((_, i) => i !== idx))} className="text-xs font-semibold text-rose-600">
                              Remove
                            </button>
                          )}
                        </div>
                        <label>
                          <span className={labelCls}>Medicine</span>
                          <select
                            className={inputCls}
                            value={line.medicineId}
                            onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, medicineId: e.target.value } : r)))}
                          >
                            <option value="">Select medicine</option>
                            {(medicines || []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        </label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          <label>
                            <span className={labelCls}>Batch</span>
                            <input className={inputCls} value={line.batchNo} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, batchNo: e.target.value } : r)))} />
                          </label>
                          <label>
                            <span className={labelCls}>Expiry</span>
                            <input type="date" className={inputCls} value={line.expiryDate} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, expiryDate: e.target.value } : r)))} />
                          </label>
                          <label>
                            <span className={labelCls}>Qty</span>
                            <input className={inputCls} type="number" value={line.qty} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, qty: e.target.value } : r)))} />
                          </label>
                          <label>
                            <span className={labelCls}>GST %</span>
                            <input className={inputCls} type="number" value={line.gstPercent} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, gstPercent: e.target.value } : r)))} />
                          </label>
                          <label>
                            <span className={labelCls}>Purchase ₹</span>
                            <input className={inputCls} type="number" step="0.01" value={line.purchasePrice} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, purchasePrice: e.target.value } : r)))} />
                          </label>
                          <label>
                            <span className={labelCls}>MRP</span>
                            <input className={inputCls} type="number" step="0.01" value={line.mrp} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, mrp: e.target.value } : r)))} />
                          </label>
                          <label className="sm:col-span-2">
                            <span className={labelCls}>Sale ₹</span>
                            <input className={inputCls} type="number" step="0.01" value={line.salePrice} onChange={(e) => setPurchaseLines((rows) => rows.map((r, i) => (i === idx ? { ...r, salePrice: e.target.value } : r)))} />
                          </label>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => setPurchaseLines((rows) => [...rows, emptyPurchaseLine()])} className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                      <FiPlus /> Add line
                    </button>
                  </div>

                  <button type="submit" disabled={saving} className={btnPrimary}>Submit purchase</button>
                </form>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
                  View-only — recording purchases requires manage permission.
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-4 py-3">
                  <h3 className="text-sm font-bold text-gray-900">Recent purchases</h3>
                </div>
                {(pharmacyPurchases || []).length ? (
                  <ul className="divide-y divide-gray-100">
                    {(pharmacyPurchases || []).slice(0, 20).map((p) => (
                      <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{p.supplier_name || p.supplierName || supplierName(p.supplier_id || p.supplierId)}</p>
                          <p className="text-xs text-gray-500">
                            {shortDate(str(p, 'purchase_date', 'purchaseDate') || p.created_at)}
                            {str(p, 'invoice_no', 'invoiceNo') ? ` · Invoice ${str(p, 'invoice_no', 'invoiceNo')}` : ''}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {(p.items || p.lines || []).length || p.item_count || p.itemCount || 0} items
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">No purchases yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ── SUPPLIERS TAB ── */}
          {tab === 'suppliers' && (
            <div className="space-y-4">
              {canManage && (
                <form onSubmit={onSupplierSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900">{editSupplierId ? 'Edit supplier' : 'Add supplier'}</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label>
                      <span className={labelCls}>Name *</span>
                      <input className={inputCls} value={supplierForm.name} onChange={(e) => setSupplierForm((f) => ({ ...f, name: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>Phone</span>
                      <input className={inputCls} value={supplierForm.phone} onChange={(e) => setSupplierForm((f) => ({ ...f, phone: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>Email</span>
                      <input className={inputCls} value={supplierForm.email} onChange={(e) => setSupplierForm((f) => ({ ...f, email: e.target.value }))} />
                    </label>
                    <label>
                      <span className={labelCls}>GST no</span>
                      <input className={inputCls} value={supplierForm.gstNo} onChange={(e) => setSupplierForm((f) => ({ ...f, gstNo: e.target.value }))} />
                    </label>
                    <label className="sm:col-span-2">
                      <span className={labelCls}>Address</span>
                      <input className={inputCls} value={supplierForm.address} onChange={(e) => setSupplierForm((f) => ({ ...f, address: e.target.value }))} />
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving} className={btnPrimary}>{editSupplierId ? 'Update' : 'Add supplier'}</button>
                    {editSupplierId && (
                      <button type="button" onClick={() => { setEditSupplierId(null); setSupplierForm(emptySupplier); }} className={btnGhost}>Cancel</button>
                    )}
                  </div>
                </form>
              )}

              {(pharmacySuppliers || []).length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(pharmacySuppliers || []).map((s) => (
                    <article key={s.id} className="flex items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex min-w-0 gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-bold text-indigo-800">
                          {String(s.name || 'S').slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">{s.name}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {[str(s, 'phone'), str(s, 'email')].filter(Boolean).join(' · ') || 'No contact'}
                          </p>
                          {str(s, 'gst_no', 'gstNo') ? <p className="mt-1 text-xs text-gray-400">GST {str(s, 'gst_no', 'gstNo')}</p> : null}
                        </div>
                      </div>
                      {canManage && (
                        <button type="button" onClick={() => onEditSupplier(s)} className={btnSecondary}>Edit</button>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">No suppliers yet.</div>
              )}
            </div>
          )}

          {/* ── BILLS TAB ── */}
          {tab === 'bills' && (
            <div className="space-y-4">
              {(pharmacyBills || []).length ? (
                <div className="space-y-3">
                  {(pharmacyBills || []).map((b) => {
                    const expanded = expandedBillId === b.id;
                    const shownNo = billNoOf(b);
                    const patient = b.patient_name || b.patientName || patientName(b.patient_id || b.patientId);
                    return (
                      <article key={b.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${expanded ? 'border-indigo-200' : 'border-gray-200'}`}>
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-gray-900">{patient || 'Walk-in'}</h3>
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">
                                {str(b, 'payment_mode', 'paymentMode') || '—'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              {shownNo ? `Bill ${shownNo}` : 'Walk-in sale'}
                              {shortDate(str(b, 'bill_date', 'billDate', 'created_at')) ? ` · ${shortDate(str(b, 'bill_date', 'billDate', 'created_at'))}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                            <p className="text-lg font-bold text-gray-900">{rs(num(b, 'grand_total', 'grandTotal', 'total_amount', 'totalAmount'))}</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => loadBillDetail(b.id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                {expanded ? <>Hide <FiChevronUp /></> : <>View <FiChevronDown /></>}
                              </button>
                              {canManage && ['PAID', 'PARTIAL'].includes(String(b.status || '').toUpperCase()) && (
                                <button type="button" onClick={() => startReturn(b.id, b)} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                                  Return
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        {expanded && billDetail && (
                          <div className="border-t border-gray-100 bg-slate-50 px-4 py-3">
                            <table className="w-full text-sm">
                              <thead className="text-left text-[11px] uppercase tracking-wide text-gray-500">
                                <tr>
                                  <th className="py-1.5 font-semibold">Medicine</th>
                                  <th className="py-1.5 font-semibold">Qty</th>
                                  <th className="py-1.5 font-semibold">Price</th>
                                  <th className="py-1.5 text-right font-semibold">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(billDetail.lines || billDetail.items || []).map((l) => (
                                  <tr key={l.id} className="border-t border-gray-100">
                                    <td className="py-2 font-medium text-gray-900">{str(l, 'medicine_name', 'medicineName', 'name')}</td>
                                    <td className="py-2">{num(l, 'qty', 'quantity')}</td>
                                    <td className="py-2 tabular-nums">{rs(num(l, 'unit_price', 'unitPrice'))}</td>
                                    <td className="py-2 text-right font-semibold tabular-nums">{rs(num(l, 'line_total', 'lineTotal', 'line_amount', 'lineAmount'))}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
                  <p className="text-base font-semibold text-gray-900">No bills yet</p>
                  <p className="mt-1 text-sm text-gray-500">Walk-in sales will appear here after checkout.</p>
                </div>
              )}

              {canManage && returnBillId && (
                <form onSubmit={onReturnSubmit} className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Return against bill</h3>
                    <p className="mt-1 text-sm text-amber-900">
                      Recheck medicines against {returnBillMeta?.billNo ? `bill ${returnBillMeta.billNo}` : 'this bill'}
                      {returnBillMeta?.patient ? ` · ${returnBillMeta.patient}` : ''}.
                      Receive them, then refund the billed amount.
                    </p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white">
                    <table className="min-w-full text-sm">
                      <thead className="bg-amber-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-3 py-2.5 font-semibold">Medicine on bill</th>
                          <th className="px-3 py-2.5 font-semibold">Billed</th>
                          <th className="px-3 py-2.5 font-semibold">Already returned</th>
                          <th className="px-3 py-2.5 font-semibold">Remaining</th>
                          <th className="px-3 py-2.5 font-semibold">Received back</th>
                          <th className="px-3 py-2.5 text-right font-semibold">Refund</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnLines.map((l) => {
                          const qty = Number(l.returnQty) || 0;
                          const refund = qty * (Number(l.unitPrice) || 0);
                          const over = qty > Number(l.remainingQty);
                          return (
                            <tr key={l.saleLineId} className="border-t border-gray-100">
                              <td className="px-3 py-2.5 font-medium text-gray-900">{l.name}</td>
                              <td className="px-3 py-2.5">{l.billedQty}</td>
                              <td className="px-3 py-2.5 text-gray-500">{l.alreadyReturned}</td>
                              <td className="px-3 py-2.5">{l.remainingQty}</td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="number"
                                  min="0"
                                  max={l.remainingQty}
                                  className={`w-24 rounded-lg border px-2 py-1.5 text-sm ${over ? 'border-rose-400' : 'border-gray-300'}`}
                                  value={l.returnQty}
                                  disabled={!(l.remainingQty > 0)}
                                  onChange={(e) => setReturnLines((rows) => rows.map((r) => (
                                    r.saleLineId === l.saleLineId ? { ...r, returnQty: e.target.value } : r
                                  )))}
                                />
                              </td>
                              <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{rs(refund)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-white px-4 py-3">
                    <p className="text-sm text-gray-600">Amount to give patient</p>
                    <p className="text-xl font-bold text-gray-900">{rs(returnRefundTotal)}</p>
                  </div>
                  <label>
                    <span className={labelCls}>Pay refund from ledger account *</span>
                    <select
                      className={inputCls}
                      value={returnLedgerAccountId}
                      onChange={(e) => setReturnLedgerAccountId(e.target.value)}
                    >
                      <option value="">Select account</option>
                      {(ledgerAccounts || []).map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name || account.account_name || account.accountName}
                          {' · current '}{rs(account.current_balance ?? account.currentBalance)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className={labelCls}>Reason</span>
                    <input className={inputCls} value={returnReason} onChange={(e) => setReturnReason(e.target.value)} />
                  </label>
                  <label className="flex items-start gap-2 rounded-xl bg-white px-3 py-3 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={medicinesReceived}
                      onChange={(e) => setMedicinesReceived(e.target.checked)}
                    />
                    <span>Medicines were rechecked against the bill and received back from the patient. Refund only this billed amount.</span>
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" disabled={saving || !medicinesReceived || returnRefundTotal <= 0} className={btnPrimary}>
                      Give refund to patient
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReturnBillId('');
                        setReturnLines([]);
                        setMedicinesReceived(false);
                        setReturnBillMeta(null);
                      }}
                      className={btnGhost}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {(pharmacyReturns || []).length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <h3 className="text-sm font-bold text-gray-900">Recent returns</h3>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    {(pharmacyReturns || []).slice(0, 10).map((r) => (
                      <li key={r.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                        <span className="text-gray-800">
                          {rs(r.total_amount ?? r.totalAmount)} returned
                          {str(r, 'reason') ? ` · ${str(r, 'reason')}` : ''}
                        </span>
                        <span className="text-xs text-gray-500">{shortDate(r.created_at || r.return_date)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── ALERTS TAB ── */}
          {tab === 'alerts' && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
                <div className="bg-amber-50 px-4 py-3">
                  <h3 className="text-sm font-bold text-amber-900">Low stock ({lowStock.length})</h3>
                </div>
                {lowStock.length ? (
                  <ul className="divide-y divide-gray-100">
                    {lowStock.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                          {num(m, 'stock_qty', 'stockQty')} left
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">All medicines are above reorder level.</p>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
                <div className="bg-rose-50 px-4 py-3">
                  <h3 className="text-sm font-bold text-rose-900">Expiry ({(expiryAlerts || []).length})</h3>
                </div>
                {(expiryAlerts || []).length ? (
                  <ul className="divide-y divide-gray-100">
                    {(expiryAlerts || []).map((a, i) => (
                      <li key={a.id ?? i} className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{str(a, 'medicine_name', 'medicineName', 'name')}</p>
                        <p className="mt-1 text-xs text-rose-800">
                          {str(a, 'batch_no', 'batchNo') ? `Batch ${str(a, 'batch_no', 'batchNo')} · ` : ''}
                          Exp {shortDate(str(a, 'expiry_date', 'expiryDate'))}
                          {' · '}{num(a, 'qty', 'stock_qty', 'stockQty')} left
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-gray-500">No expiry alerts.</p>
                )}
              </div>
            </div>
          )}
      </div>

      {showCheckoutConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Confirm sale</h2>
              <p className="mt-1 text-sm text-gray-500">Check medicines before generating the bill and collecting payment.</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Medicine</th>
                    <th className="px-3 py-2.5 font-semibold">Qty</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Price</th>
                    <th className="px-3 py-2.5 text-right font-semibold">GST</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cart.map((line) => {
                    const subtotal = Number(line.qty) * Number(line.unitPrice);
                    const gst = subtotal * (Number(line.gstPercent) / 100);
                    return (
                      <tr key={line.key}>
                        <td className="px-3 py-2.5 font-medium text-gray-900">{line.name}</td>
                        <td className="px-3 py-2.5">{line.qty}</td>
                        <td className="px-3 py-2.5 text-right">{rs(line.unitPrice)}</td>
                        <td className="px-3 py-2.5 text-right">{rs(gst)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{rs(subtotal + gst)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{rs(cartTotals.subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>GST</span><span>{rs(cartTotals.gstTotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Discount</span><span>−{rs(cartTotals.discount)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                <span>Amount payable</span><span>{rs(cartTotals.grandTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label>
                <span className={labelCls}>Payment type *</span>
                <select className={inputCls} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                  {PAYMENT_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                </select>
              </label>
              <label>
                <span className={labelCls}>Ledger account *</span>
                <select
                  className={inputCls}
                  value={ledgerAccountId}
                  onChange={(e) => setLedgerAccountId(e.target.value)}
                >
                  <option value="">Select account</option>
                  {(ledgerAccounts || []).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name || account.account_name || account.accountName}
                      {' · '}{rs(account.current_balance ?? account.currentBalance)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelCls}>Ledger category</span>
                <select
                  className={inputCls}
                  value={ledgerCategoryId}
                  onChange={(e) => setLedgerCategoryId(e.target.value)}
                >
                  <option value="">No category</option>
                  {(ledgerCategories || []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name || category.category_name || category.categoryName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelCls}>Transaction reference</span>
                <input
                  className={inputCls}
                  placeholder="UPI / card / bank reference"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowCheckoutConfirmation(false)}
                className={btnGhost}
              >
                Back to cart
              </button>
              <button type="button" disabled={saving} onClick={confirmCheckout} className={btnPrimary}>
                {saving ? 'Processing…' : 'Confirm & pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagementPharmacyPage;
