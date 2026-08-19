import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const toDate = (d) => d.toISOString().slice(0, 10);

const patientLabel = (patients, id) => {
  const p = (patients || []).find((x) => String(x.id) === String(id));
  return p?.name || '—';
};

const HospitalManagementBillingPage = () => {
  const {
    receivables,
    patients,
    ledgerAccounts,
    fetchReceivables,
    fetchPatients,
    fetchLedgerAccounts,
    createReceivable,
    recordPayment,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_billing_manage');
  const [billForm, setBillForm] = useState({
    patientId: '',
    amountDue: '',
    billType: 'OPD',
    billDate: toDate(new Date()),
    description: '',
    paymentMethod: 'CASH',
    ledgerAccountId: '',
  });
  const [payForm, setPayForm] = useState({
    receivableId: '',
    amount: '',
    paymentMethod: 'CASH',
    paymentDate: toDate(new Date()),
    notes: '',
    ledgerAccountId: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReceivables();
    fetchPatients();
    fetchLedgerAccounts();
  }, [fetchReceivables, fetchPatients, fetchLedgerAccounts]);

  const enrichedReceivables = useMemo(
    () =>
      (receivables || []).map((r) => {
        const due = Number(r.amount_due ?? r.amountDue ?? r.amount ?? 0);
        const paid = Number(r.amount_paid ?? r.amountPaid ?? 0);
        const balance = Number(r.balance_amount ?? Math.max(0, due - paid));
        return {
          ...r,
          amount_due: due,
          amount_paid: paid,
          balance_amount: balance,
          patient_name: r.patient_name || r.patientName || patientLabel(patients, r.patient_id || r.patientId),
        };
      }),
    [receivables, patients]
  );

  const openReceivables = enrichedReceivables.filter((r) => {
    const status = String(r.status || 'DUE').toUpperCase();
    return r.balance_amount > 0 || status === 'DUE' || status === 'PARTIAL';
  });

  const onReceivablePick = (receivableId) => {
    const rec = openReceivables.find((r) => String(r.id) === String(receivableId));
    setPayForm((f) => ({
      ...f,
      receivableId,
      amount: String(rec?.balance_amount || ''),
    }));
  };

  const onCreateBill = async (e) => {
    e.preventDefault();
    if (!billForm.patientId) return toast.error('Select patient');
    if (!Number(billForm.amountDue)) return toast.error('Enter amount');
    if (!billForm.ledgerAccountId) return toast.error('Select the ledger account receiving this payment');
    setSaving(true);
    const created = await createReceivable({
      patientId: billForm.patientId,
      amountDue: Number(billForm.amountDue),
      billType: billForm.billType,
      billDate: billForm.billDate,
      description: billForm.description.trim() || null,
    });
    if (!created.success) {
      setSaving(false);
      return toast.error(created.error || 'Failed');
    }
    const receivableId = created.data?.id || created.data?.receivable?.id;
    const paid = await recordPayment({
      receivableId,
      amount: Number(billForm.amountDue),
      paymentMethod: billForm.paymentMethod,
      paymentDate: billForm.billDate,
      ledgerAccountId: billForm.ledgerAccountId,
      description: billForm.description.trim() || null,
    });
    setSaving(false);
    if (paid.success) {
      toast.success('Payment collected — bill created and logged in ledger');
      setBillForm({
        patientId: '',
        amountDue: '',
        billType: 'OPD',
        billDate: toDate(new Date()),
        description: '',
        paymentMethod: 'CASH',
        ledgerAccountId: billForm.ledgerAccountId,
      });
    } else toast.error(paid.error || 'Payment failed');
  };

  const onRecordPayment = async (e) => {
    e.preventDefault();
    if (!payForm.receivableId) return toast.error('Select receivable');
    if (!Number(payForm.amount)) return toast.error('Enter amount');
    if (!payForm.ledgerAccountId) return toast.error('Select the ledger account receiving this payment');
    setSaving(true);
    const result = await recordPayment({
      receivableId: payForm.receivableId,
      amount: Number(payForm.amount),
      paymentMethod: payForm.paymentMethod,
      paymentDate: payForm.paymentDate,
      description: payForm.notes.trim() || null,
      ledgerAccountId: payForm.ledgerAccountId,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Payment recorded');
      setPayForm({
        receivableId: '',
        amount: '',
        paymentMethod: 'CASH',
        paymentDate: toDate(new Date()),
        notes: '',
        ledgerAccountId: payForm.ledgerAccountId,
      });
    } else toast.error(result.error || 'Failed');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Hospital Billing</h1>
        <p className="text-sm text-gray-500">Bills are issued only after payment. Both payment and refunds are logged in ledger.</p>
      </div>

      {canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form onSubmit={onCreateBill} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Collect payment & create bill</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
                value={billForm.patientId}
                onChange={(e) => setBillForm((f) => ({ ...f, patientId: e.target.value }))}
              >
                <option value="">Patient *</option>
                {(patients || []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Amount *"
                type="number"
                value={billForm.amountDue}
                onChange={(e) => setBillForm((f) => ({ ...f, amountDue: e.target.value }))}
              />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={billForm.billType}
                onChange={(e) => setBillForm((f) => ({ ...f, billType: e.target.value }))}
              >
                <option value="OPD">OPD</option>
                <option value="IPD">IPD</option>
                <option value="PHARMACY">Pharmacy</option>
                <option value="ADHOC">Ad hoc</option>
              </select>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={billForm.paymentMethod}
                onChange={(e) => setBillForm((f) => ({ ...f, paymentMethod: e.target.value }))}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK">Bank transfer</option>
              </select>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
                value={billForm.ledgerAccountId}
                onChange={(e) => setBillForm((f) => ({ ...f, ledgerAccountId: e.target.value }))}
              >
                <option value="">Ledger account *</option>
                {(ledgerAccounts || []).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name || account.account_name} · {rs(account.current_balance ?? account.currentBalance)}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={billForm.billDate}
                onChange={(e) => setBillForm((f) => ({ ...f, billDate: e.target.value }))}
              />
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Description"
                value={billForm.description}
                onChange={(e) => setBillForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
              {saving ? 'Saving…' : 'Collect payment'}
            </button>
          </form>

          <form onSubmit={onRecordPayment} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Record payment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
                value={payForm.receivableId}
                onChange={(e) => onReceivablePick(e.target.value)}
              >
                <option value="">Select receivable *</option>
                {openReceivables.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.patient_name} · {rs(r.balance_amount)} · {r.bill_type || r.billType || 'OPD'}
                  </option>
                ))}
              </select>
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Amount *"
                type="number"
                value={payForm.amount}
                onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={payForm.paymentMethod}
                onChange={(e) => setPayForm((f) => ({ ...f, paymentMethod: e.target.value }))}
              >
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="BANK">Bank transfer</option>
              </select>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={payForm.paymentDate}
                onChange={(e) => setPayForm((f) => ({ ...f, paymentDate: e.target.value }))}
              />
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white sm:col-span-2"
                value={payForm.ledgerAccountId}
                onChange={(e) => setPayForm((f) => ({ ...f, ledgerAccountId: e.target.value }))}
              >
                <option value="">Ledger account *</option>
                {(ledgerAccounts || []).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name || account.account_name} · {rs(account.current_balance ?? account.currentBalance)}
                  </option>
                ))}
              </select>
              <input
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Notes"
                value={payForm.notes}
                onChange={(e) => setPayForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
              {saving ? 'Saving…' : 'Record receipt'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Patient</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Balance</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {enrichedReceivables.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2">{r.patient_name}</td>
                <td className="px-4 py-2">{r.description || r.bill_type || r.billType || '—'}</td>
                <td className="px-4 py-2 tabular-nums">{rs(r.amount_due)}</td>
                <td className="px-4 py-2 tabular-nums">{rs(r.balance_amount)}</td>
                <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">{r.status || 'DUE'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!enrichedReceivables.length && <p className="text-center text-gray-500 py-8 text-sm">No receivables.</p>}
      </div>
    </div>
  );
};

export default HospitalManagementBillingPage;
