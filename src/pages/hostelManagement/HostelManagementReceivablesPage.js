import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaWhatsapp } from 'react-icons/fa';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import HostelSelector from '../../components/hostelManagement/HostelSelector';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';

const HostelManagementReceivablesPage = () => {
  const {
    selectedHostelId, receivables, ledgerAccounts, residents,
    fetchReceivables, generateReceivables, createAdhocReceivable, recordPayment,
    fetchLedgerAccounts, fetchResidents, confirmPaymentSubmission, rejectPaymentSubmission,
  } = useHostelManagement();
  const { can } = useHmPermission();
  const canCreate = can('hm_receivable_create') || can('hm_receivable_manage');
  const canPay = can('hm_payment_record') || can('hm_receivable_manage');
  const canVerify = can('hm_payment_verify') || can('hm_receivable_manage');
  const [payingId, setPayingId] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'CASH', ledgerAccountId: '', transactionRef: '' });
  const [reviewSubmission, setReviewSubmission] = useState(null);
  const [reviewForm, setReviewForm] = useState({ ledgerAccountId: '', paymentMethod: 'PHONEPE' });
  const [reviewing, setReviewing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [adhocForm, setAdhocForm] = useState({ residentId: '', amount: '', dueDate: '' });
  const [creatingAdhoc, setCreatingAdhoc] = useState(false);
  const [monthModalOpen, setMonthModalOpen] = useState(false);
  const [billingMonth, setBillingMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    fetchLedgerAccounts();
  }, []);

  useEffect(() => {
    if (selectedHostelId) {
      fetchReceivables(selectedHostelId);
      fetchResidents(selectedHostelId);
    }
  }, [selectedHostelId]);

  const adhocResidents = useMemo(
    () => (residents || []).filter((r) => r.status === 'ACTIVE' && r.rent_plan === 'ADHOC'),
    [residents]
  );

  const monthlyResidents = useMemo(
    () => (residents || []).filter((r) => r.status === 'ACTIVE' && r.rent_plan === 'MONTHLY'),
    [residents]
  );

  const monthLabel = useMemo(() => {
    if (!billingMonth || !/^\d{4}-\d{2}$/.test(billingMonth)) return '';
    const [y, m] = billingMonth.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  }, [billingMonth]);

  const openMonthlyModal = () => {
    if (!selectedHostelId) return toast.error('Select hostel first');
    const d = new Date();
    setBillingMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setMonthModalOpen(true);
  };

  const confirmMonthlyReceivables = async () => {
    if (!selectedHostelId) return toast.error('Select hostel first');
    if (!billingMonth || !/^\d{4}-\d{2}$/.test(billingMonth)) {
      return toast.error('Select a billing month');
    }
    const billingDate = `${billingMonth}-01`;
    setGenerating(true);
    try {
      const result = await generateReceivables({
        hostelId: selectedHostelId,
        rentPlan: 'MONTHLY',
        billingDate,
      });
      if (result.success) {
        toast.success(result.message || `Monthly receivables created for ${monthLabel}`);
        setMonthModalOpen(false);
        fetchReceivables(selectedHostelId);
      } else toast.error(result.error);
    } finally {
      setGenerating(false);
    }
  };

  const createDailyReceivables = async () => {
    if (!selectedHostelId) return toast.error('Select hostel first');
    setGenerating(true);
    try {
      const result = await generateReceivables({
        hostelId: selectedHostelId,
        rentPlan: 'DAILY',
      });
      if (result.success) {
        toast.success(result.message || 'Daily receivables created');
        fetchReceivables(selectedHostelId);
      } else toast.error(result.error);
    } finally {
      setGenerating(false);
    }
  };

  const submitAdhoc = async (e) => {
    e.preventDefault();
    if (!selectedHostelId) return toast.error('Select hostel first');
    if (!adhocForm.residentId) return toast.error('Select adhoc resident');
    setCreatingAdhoc(true);
    try {
      const result = await createAdhocReceivable({
        hostelId: selectedHostelId,
        residentId: adhocForm.residentId,
        amount: Number(adhocForm.amount) || undefined,
        dueDate: adhocForm.dueDate || undefined,
      });
      if (result.success) {
        toast.success('Adhoc receivable created');
        setAdhocForm({ residentId: '', amount: '', dueDate: '' });
        fetchReceivables(selectedHostelId);
      } else toast.error(result.error);
    } finally {
      setCreatingAdhoc(false);
    }
  };

  const onAdhocResidentChange = (residentId) => {
    const r = adhocResidents.find((x) => x.id === residentId);
    setAdhocForm({
      residentId,
      amount: r?.adhoc_amount ? String(r.adhoc_amount) : '',
      dueDate: adhocForm.dueDate,
    });
  };

  const openPay = (row) => {
    setPayingId(row.id);
    setPayForm({
      amount: String(row.balance),
      method: 'CASH',
      ledgerAccountId: ledgerAccounts[0]?.id || '',
      transactionRef: '',
    });
  };

  const submitPay = async () => {
    const result = await recordPayment({
      receivableId: payingId,
      paymentAmount: Number(payForm.amount),
      paymentMethod: payForm.method,
      ledgerAccountId: payForm.ledgerAccountId || null,
      transactionRef: payForm.transactionRef || null,
    });
    if (result.success) {
      toast.success(`Paid. Bill ${result.data?.receipt?.bill_number || ''}`);
      setPayingId(null);
      fetchReceivables(selectedHostelId);
    } else toast.error(result.error);
  };

  const openReview = (row) => {
    const sub = row.pending_submission;
    if (!sub) return;
    setReviewSubmission({ ...sub, row });
    setReviewForm({
      ledgerAccountId: ledgerAccounts[0]?.id || '',
      paymentMethod: 'PHONEPE',
    });
  };

  const confirmResidentPayment = async () => {
    if (!reviewSubmission) return;
    setReviewing(true);
    try {
      const result = await confirmPaymentSubmission(reviewSubmission.id, {
        ledgerAccountId: reviewForm.ledgerAccountId || null,
        paymentMethod: reviewForm.paymentMethod,
      });
      if (result.success) {
        toast.success(`Confirmed. Bill ${result.data?.receipt?.bill_number || ''}`);
        setReviewSubmission(null);
        fetchReceivables(selectedHostelId);
      } else toast.error(result.error);
    } finally {
      setReviewing(false);
    }
  };

  const rejectResidentPayment = async () => {
    if (!reviewSubmission) return;
    setReviewing(true);
    try {
      const result = await rejectPaymentSubmission(reviewSubmission.id, 'Not found in bank account');
      if (result.success) {
        toast.info('Payment submission rejected');
        setReviewSubmission(null);
        fetchReceivables(selectedHostelId);
      } else toast.error(result.error);
    } finally {
      setReviewing(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const refreshReceivables = async () => {
    if (!selectedHostelId) return toast.error('Select hostel first');
    setRefreshing(true);
    try {
      const result = await fetchReceivables(selectedHostelId);
      if (result.success) toast.success('Updated');
      else toast.error(result.error || 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  const shareWhatsApp = (row) => {
    const phone = String(row.resident_phone || '').replace(/\D/g, '');
    const msg = [
      'Hostel Rent Receipt',
      `Resident: ${row.resident_name}`,
      `Due: ₹${row.amount_due}`,
      `Paid: ₹${row.amount_paid}`,
      `Balance: ₹${row.balance}`,
      `Status: ${row.status}`,
      'Thank you.',
    ].join('\n');
    const url = phone
      ? `https://api.whatsapp.com/send?phone=${phone.length === 10 ? `91${phone}` : phone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Receivables</h1>
          <p className="text-sm text-gray-500">
            Monthly/Daily one-click dues, or create Adhoc charges per resident.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={refreshReceivables}
            disabled={refreshing || !selectedHostelId}
            className="text-sm font-semibold text-gray-800 border border-gray-300 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <Link
            to="/hostel-management/user/outstanding"
            className="text-sm font-semibold text-red-700 border border-red-200 bg-red-50 px-3 py-2 rounded-lg hover:bg-red-100"
          >
            Outstanding report
          </Link>
          <HostelSelector />
        </div>
      </div>

      {canCreate && (
      <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">Create dues in one click</p>
          <p className="text-xs text-gray-500">
            Monthly bills only for <strong>Monthly</strong> plan residents.
            Adhoc residents never get a monthly bill — charge them below.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openMonthlyModal}
            disabled={generating || !selectedHostelId}
            className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Create Monthly Receivables
          </button>
          <button
            type="button"
            onClick={createDailyReceivables}
            disabled={generating || !selectedHostelId}
            className="border border-gray-300 text-gray-800 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            Create Daily Receivables
          </button>
        </div>
      </div>
      )}

      {monthModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-5 space-y-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900">Create monthly receivables</h3>
              <p className="text-sm text-gray-500 mt-1">
                Choose the billing month, then confirm. Only monthly-plan residents get a bill —
                Adhoc residents are skipped.
              </p>
            </div>
            <label className="block text-sm">
              <span className="text-xs font-semibold text-gray-600">Billing month *</span>
              <input
                type="month"
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                required
              />
            </label>
            <div className="bg-gray-50 border rounded-lg p-3 text-sm space-y-1">
              <p>
                Month: <strong>{monthLabel || '—'}</strong>
              </p>
              <p>
                Monthly residents to bill: <strong>{monthlyResidents.length}</strong>
              </p>
              <p className="text-xs text-amber-800">
                Adhoc residents ({adhocResidents.length}) will not get a new bill.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={generating || !billingMonth}
                onClick={confirmMonthlyReceivables}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 font-semibold disabled:opacity-50"
              >
                {generating ? 'Creating…' : 'Confirm create'}
              </button>
              <button
                type="button"
                disabled={generating}
                onClick={() => setMonthModalOpen(false)}
                className="flex-1 border rounded-lg py-2.5 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {canCreate && (
      <form onSubmit={submitAdhoc} className="bg-white border rounded-xl p-4 space-y-3">
        <div>
          <p className="font-semibold text-gray-900">Create Adhoc receivable</p>
          <p className="text-xs text-gray-500">For residents on Adhoc plan — enter amount each time (or use their default).</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            className="border rounded-lg px-3 py-2"
            value={adhocForm.residentId}
            onChange={(e) => onAdhocResidentChange(e.target.value)}
            required
          >
            <option value="">Select adhoc resident</option>
            {adhocResidents.map((r) => (
              <option key={r.id} value={r.id}>{r.name}{r.phone ? ` · ${r.phone}` : ''}</option>
            ))}
          </select>
          <input
            className="border rounded-lg px-3 py-2"
            type="number"
            min="1"
            step="0.01"
            placeholder="Amount *"
            required
            value={adhocForm.amount}
            onChange={(e) => setAdhocForm({ ...adhocForm, amount: e.target.value })}
          />
          <input
            className="border rounded-lg px-3 py-2"
            type="date"
            value={adhocForm.dueDate}
            onChange={(e) => setAdhocForm({ ...adhocForm, dueDate: e.target.value })}
          />
          <button
            type="submit"
            disabled={creatingAdhoc || !selectedHostelId || adhocResidents.length === 0}
            className="bg-gray-900 text-white rounded-lg py-2 font-semibold text-sm disabled:opacity-50"
          >
            {creatingAdhoc ? 'Creating…' : '+ Add Adhoc Due'}
          </button>
        </div>
        {adhocResidents.length === 0 && (
          <p className="text-xs text-amber-700">No active Adhoc residents in this hostel. Onboard one under Residents.</p>
        )}
      </form>
      )}

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-3">Resident</th>
              <th className="px-3 py-3">Floor/Room</th>
              <th className="px-3 py-3">Plan</th>
              <th className="px-3 py-3">St. Dt</th>
              <th className="px-3 py-3">Ed. Dt</th>
              <th className="px-3 py-3">Due</th>
              <th className="px-3 py-3">Paid</th>
              <th className="px-3 py-3">Balance</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {receivables.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-3">
                  <p className="font-medium">{r.resident_name}</p>
                  <p className="text-xs text-gray-500">{r.resident_phone}</p>
                </td>
                <td className="px-3 py-3 text-xs">{r.floor_name} / {r.room_number}-{r.bed_label}</td>
                <td className="px-3 py-3">{r.rent_plan}</td>
                <td className="px-3 py-3 text-xs whitespace-nowrap">
                  {r.billing_period_start
                    ? new Date(r.billing_period_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </td>
                <td className="px-3 py-3 text-xs whitespace-nowrap">
                  {r.billing_period_end
                    ? new Date(r.billing_period_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </td>
                <td className="px-3 py-3">₹{Number(r.amount_due).toLocaleString('en-IN')}</td>
                <td className="px-3 py-3">₹{Number(r.amount_paid).toLocaleString('en-IN')}</td>
                <td className="px-3 py-3 font-semibold text-red-700">₹{Number(r.balance).toLocaleString('en-IN')}</td>
                <td className="px-3 py-3">
                  {r.pending_submission ? (
                    <button
                      type="button"
                      onClick={() => openReview(r)}
                      className="inline-flex text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 underline-offset-2 hover:underline"
                    >
                      Resident paid — Check and confirm
                    </button>
                  ) : (
                    r.status
                  )}
                </td>
                <td className="px-3 py-3 space-x-2">
                  {Number(r.balance) > 0 && canPay && !r.pending_submission && (
                    <button type="button" className="text-blue-600 text-xs font-semibold" onClick={() => openPay(r)}>Pay</button>
                  )}
                  <button type="button" className="text-green-600 text-xs font-semibold inline-flex items-center gap-1" onClick={() => shareWhatsApp(r)}>
                    <FaWhatsapp /> Share
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {receivables.length === 0 && <p className="p-6 text-gray-500">No receivables.</p>}
      </div>

      {reviewSubmission && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-md space-y-4">
            <div>
              <h3 className="font-bold text-lg">Resident payment — verify in bank</h3>
              <p className="text-sm text-gray-500 mt-1">
                {reviewSubmission.row?.resident_name}
                {reviewSubmission.row?.resident_phone ? ` · ${reviewSubmission.row.resident_phone}` : ''}
              </p>
            </div>
            <div className="bg-gray-50 border rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Payment date</span>
                <span className="font-semibold">{formatDate(reviewSubmission.payment_date || reviewSubmission.submitted_at)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold">₹{Number(reviewSubmission.amount_claimed).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Transaction number</span>
                <span className="font-mono font-semibold">{reviewSubmission.transaction_ref}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Submitted on</span>
                <span>{formatDate(reviewSubmission.submitted_at)}</span>
              </div>
            </div>
            {canVerify && (
              <>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={reviewForm.paymentMethod}
                  onChange={(e) => setReviewForm({ ...reviewForm, paymentMethod: e.target.value })}
                >
                  <option value="PHONEPE">PHONEPE</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK">BANK</option>
                </select>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={reviewForm.ledgerAccountId}
                  onChange={(e) => setReviewForm({ ...reviewForm, ledgerAccountId: e.target.value })}
                >
                  <option value="">No ledger post</option>
                  {ledgerAccounts.map((a) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                </select>
                <p className="text-xs text-gray-500">
                  Check your bank account for this amount and transaction number, then mark as paid.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={reviewing}
                    className="flex-1 bg-green-600 text-white rounded-lg py-2.5 font-semibold disabled:opacity-50"
                    onClick={confirmResidentPayment}
                  >
                    {reviewing ? 'Confirming…' : 'Mark as Paid'}
                  </button>
                  <button
                    type="button"
                    disabled={reviewing}
                    className="flex-1 border border-red-300 text-red-700 rounded-lg py-2.5 font-semibold disabled:opacity-50"
                    onClick={rejectResidentPayment}
                  >
                    Reject
                  </button>
                </div>
              </>
            )}
            <button
              type="button"
              className="w-full border rounded-lg py-2 text-sm font-semibold"
              onClick={() => setReviewSubmission(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {payingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-md space-y-3">
            <h3 className="font-bold text-lg">Record Payment</h3>
            <input className="w-full border rounded-lg px-3 py-2" type="number" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
            <select className="w-full border rounded-lg px-3 py-2" value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
              <option value="CASH">CASH</option>
              <option value="PHONEPE">PHONEPE</option>
              <option value="UPI">UPI</option>
              <option value="BANK">BANK</option>
            </select>
            <select className="w-full border rounded-lg px-3 py-2" value={payForm.ledgerAccountId} onChange={(e) => setPayForm({ ...payForm, ledgerAccountId: e.target.value })}>
              <option value="">No ledger post</option>
              {ledgerAccounts.map((a) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
            </select>
            <input className="w-full border rounded-lg px-3 py-2" placeholder="Transaction ref" value={payForm.transactionRef} onChange={(e) => setPayForm({ ...payForm, transactionRef: e.target.value })} />
            <div className="flex gap-2">
              <button type="button" className="flex-1 bg-red-600 text-white rounded-lg py-2 font-semibold" onClick={submitPay}>Confirm</button>
              <button type="button" className="flex-1 border rounded-lg py-2" onClick={() => setPayingId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostelManagementReceivablesPage;
