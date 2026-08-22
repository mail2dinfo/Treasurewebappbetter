import { useEffect, useState } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';
import { FiPlus, FiX, FiList } from 'react-icons/fi';
import loadingImage from '../images/preloader.gif';
import { useGroupDetailsContext } from '../context/group_context';
import { useUserContext } from '../context/user_context';
import { API_BASE_URL } from '../utils/apiConfig';
import { UserInfo, GroupSubscriber } from '../components';
import GroupDetailsCard from '../components/GroupDetailsCard';

const Wrapper = styled.div`
  padding-top: 1.25rem;
`;

const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toISODate = (value) => {
  if (!value) return '';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatDisplayDate = (isoDate) => {
  const iso = toISODate(isoDate);
  if (!iso) return '—';
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const scheduleDueNumber = (receivables = []) =>
  receivables.reduce((max, row) => Math.max(max, Number(row.due_number) || 0), 0);

const isDelayedJoiner = (row, scheduleDue) =>
  Number(row.due_number) > 0 && Number(row.due_number) < Number(scheduleDue);

const recipientLabel = (s) => `${s.name || s.firstname || s.phone} · ${s.phone || ''}`;

const DueProcessedModal = ({ open, month, tenure, onClose }) => {
  if (!open || !month) return null;
  const subscribers = month.subscribers || [];
  const tenureNum = Number(tenure) || 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Dues processed</h2>
            <p className="text-sm text-teal-100">{formatDisplayDate(month.auct_date)}</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white p-2">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">Subscriber</th>
                  <th className="px-3 py-2 text-left">Due no.</th>
                  <th className="px-3 py-2 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.receivable_id} className="border-t">
                    <td className="px-3 py-2 font-semibold">{s.name}</td>
                    <td className="px-3 py-2">
                      {s.due_number}{tenureNum ? ` out of ${tenureNum}` : ''}
                    </td>
                    <td className="px-3 py-2 font-bold">{formatMoney(s.due_amount)}</td>
                  </tr>
                ))}
                {!subscribers.length && (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                      No subscribers billed on this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full px-4 py-3 bg-gray-100 rounded-lg font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const AddPayableModal = ({
  open,
  onClose,
  subscribers,
  paidSubscriberIds = [],
  groupAmount,
  defaultDate,
  saving,
  onSubmit,
}) => {
  const [auctDate, setAuctDate] = useState(todayISO());
  const [groupSubscriberId, setGroupSubscriberId] = useState('');
  const [customerAmount, setCustomerAmount] = useState('');

  const paidIds = new Set((paidSubscriberIds || []).map((id) => String(id)));
  const unpaidSubscribers = (subscribers || []).filter((s) => {
    const id = s.group_subscriber_id || s.id;
    return id && !paidIds.has(String(id));
  });

  useEffect(() => {
    if (!open) return;
    setAuctDate(toISODate(defaultDate) || todayISO());
    setGroupSubscriberId('');
    setCustomerAmount('');
  }, [open, defaultDate]);

  if (!open) return null;

  const groupAmountNum = Number(groupAmount) || 0;
  const prizeNum = Number(customerAmount) || 0;
  const selected = unpaidSubscribers.find(
    (s) => String(s.group_subscriber_id || s.id) === String(groupSubscriberId)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!auctDate) {
      toast.error('Enter date');
      return;
    }
    if (!groupSubscriberId) {
      toast.error('Choose customer');
      return;
    }
    if (!customerAmount || prizeNum <= 0) {
      toast.error('Enter prize amount');
      return;
    }
    onSubmit({
      auct_date: auctDate,
      group_subscriber_id: groupSubscriberId,
      customer_amount: prizeNum,
      asked_amount: Math.max(groupAmountNum - prizeNum, 0),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add payable</h2>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white p-2">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Creates a payable for one customer who has not received a prize yet.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              value={auctDate}
              onChange={(e) => setAuctDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            {unpaidSubscribers.length ? (
              <select
                value={groupSubscriberId}
                onChange={(e) => setGroupSubscriberId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                required
              >
                <option value="">Choose subscriber</option>
                {unpaidSubscribers.map((s) => (
                  <option key={s.group_subscriber_id || s.id} value={s.group_subscriber_id || s.id}>
                    {recipientLabel(s)}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                All subscribers already have a prize.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prize amount *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={customerAmount}
              onChange={(e) => setCustomerAmount(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-xl font-bold"
              required
            />
          </div>
          {selected && prizeNum > 0 && (
            <div className="rounded-xl bg-teal-50 border border-teal-200 px-4 py-3">
              <p className="text-xl font-extrabold text-gray-900">{selected.name || selected.firstname}</p>
              <p className="text-2xl font-extrabold text-teal-800 mt-1">{formatMoney(prizeNum)}</p>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !unpaidSubscribers.length}
              className="flex-1 px-4 py-3 bg-teal-700 text-white rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save payable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddDuesModal = ({
  open,
  onClose,
  defaultEmi,
  defaultDate,
  tenure,
  saving,
  previewLoading,
  preview,
  onPreview,
  onSubmit,
}) => {
  const [auctDate, setAuctDate] = useState(todayISO());
  const [emiValue, setEmiValue] = useState('');
  const [rowEmis, setRowEmis] = useState({});
  const [ready, setReady] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAuctDate(toISODate(defaultDate) || todayISO());
    setEmiValue('');
    setRowEmis({});
    setReady(false);
    setConfirming(false);
  }, [open]);

  useEffect(() => {
    if (!open || !auctDate) return undefined;
    let cancelled = false;
    setReady(false);
    (async () => {
      const ok = await onPreview({
        auct_date: auctDate,
        customer_due: 0,
      });
      if (cancelled) return;
      setReady(!!ok);
    })();
    return () => {
      cancelled = true;
    };
    // onPreview is recreated each render — do not depend on it
  }, [open, auctDate]);

  useEffect(() => {
    if (!ready || !preview?.receivables) return;
    if (toISODate(preview.auct_date) && toISODate(preview.auct_date) !== toISODate(auctDate)) return;
    const recs = preview.receivables;
    const next = {};
    recs.forEach((row) => {
      next[String(row.group_subscriber_id)] = '';
    });
    setRowEmis(next);
  }, [ready, preview, auctDate]);

  if (!open) return null;

  const emiNum = Number(emiValue);
  const scheduleDue = scheduleDueNumber(preview?.receivables || []);
  const rows = (preview?.receivables || []).map((row) => {
    const key = String(row.group_subscriber_id);
    const delayed = isDelayedJoiner(row, scheduleDue);
    const raw = rowEmis[key];
    const parsed = Number(raw);
    const hasAmount = raw !== '' && raw != null && Number.isFinite(parsed) && parsed > 0;
    return {
      ...row,
      delayed,
      emi: hasAmount ? parsed : null,
      emiRaw: raw ?? '',
    };
  });

  const applyOnSchedule = (value) => {
    setEmiValue(value);
    const base = Number(value);
    if (!Number.isFinite(base) || base < 0) return;
    setRowEmis((prev) => {
      const next = { ...prev };
      (preview?.receivables || []).forEach((row) => {
        if (isDelayedJoiner(row, scheduleDueNumber(preview?.receivables || []))) return;
        const pct = Number(row.accountshare_percentage);
        const sharePct = Number.isFinite(pct) ? pct : 100;
        next[String(row.group_subscriber_id)] = String(Math.floor((base * sharePct) / 100));
      });
      return next;
    });
  };

  const missingAmounts = rows.filter((row) => row.emi == null);

  const handleSave = () => {
    if (!auctDate) {
      toast.error('Enter due date');
      return;
    }
    if (!rows.length) {
      toast.error('No subscribers to bill');
      return;
    }
    if (missingAmounts.length) {
      toast.error(
        `Enter due amount for: ${missingAmounts.map((row) => row.name).join(', ')}`
      );
      return;
    }
    setConfirming(true);
  };

  const handleConfirmProcess = () => {
    if (missingAmounts.length) {
      toast.error(
        `Enter due amount for: ${missingAmounts.map((row) => row.name).join(', ')}`
      );
      setConfirming(false);
      return;
    }
    onSubmit({
      auct_date: auctDate,
      customer_due: Number.isFinite(emiNum) ? emiNum : 0,
      receivables: rows.map((row) => ({
        group_subscriber_id: row.group_subscriber_id,
        receivable_amount: Number(row.emi) || 0,
      })),
      advance_next_date: true,
    });
  };

  const dueTotal = rows.reduce((sum, row) => sum + (Number(row.emi) || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {confirming ? 'Confirm monthly due' : 'Add monthly due'}
          </h2>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white p-2">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {confirming ? (
            <>
              <p className="text-sm text-gray-600">
                Review the dues below. This will create receivables for{' '}
                <span className="font-semibold">{rows.length}</span> subscriber
                {rows.length === 1 ? '' : 's'} on{' '}
                <span className="font-semibold">{formatDisplayDate(auctDate)}</span>.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Due date</div>
                  <div className="font-semibold text-gray-900">{formatDisplayDate(auctDate)}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <div className="text-xs text-gray-500">Total amount</div>
                  <div className="font-semibold text-gray-900">{formatMoney(dueTotal)}</div>
                </div>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Subscriber</th>
                      <th className="px-3 py-2 text-left">Due no.</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.group_subscriber_id} className="border-t">
                        <td className="px-3 py-2 font-semibold">{row.name}</td>
                        <td className="px-3 py-2">
                          {row.due_number}
                          {tenure || row.tenure ? ` / ${tenure || row.tenure}` : ''}
                        </td>
                        <td className="px-3 py-2 font-bold">{formatMoney(row.emi)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-lg"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleConfirmProcess}
                  className="flex-1 px-4 py-3 bg-teal-700 text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Processing…' : 'Confirm'}
                </button>
              </div>
            </>
          ) : (
            <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due date *</label>
              <input
                type="date"
                value={auctDate}
                onChange={(e) => {
                  setAuctDate(e.target.value);
                  setConfirming(false);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due</label>
              <input
                type="number"
                min="0"
                value={emiValue}
                placeholder="Enter due"
                onChange={(e) => applyOnSchedule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Applied only to members on the current due. Late joiners stay empty until you enter an amount.
              </p>
            </div>
          </div>

          {previewLoading && (
            <p className="text-sm text-gray-500">Loading subscribers…</p>
          )}

          {ready && (
            <>
              {(preview?.skipped || []).length > 0 && (
                <p className="text-xs text-gray-500">
                  Skipped (tenure complete): {preview.skipped.map((s) => s.name).join(', ')}
                </p>
              )}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Subscriber</th>
                      <th className="px-3 py-2 text-left">Due no.</th>
                      <th className="px-3 py-2 text-left">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.group_subscriber_id} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-semibold">{row.name}</div>
                          {row.delayed && (
                            <div className="text-xs text-amber-700">Late joiner — enter due manually</div>
                          )}
                        </td>
                        <td className="px-3 py-2">{row.due_number} / {tenure || row.tenure}</td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            value={row.emiRaw}
                            placeholder={row.delayed ? 'Enter due' : ''}
                            onChange={(e) =>
                              setRowEmis((prev) => ({
                                ...prev,
                                [String(row.group_subscriber_id)]: e.target.value,
                              }))
                            }
                            className={`w-28 px-2 py-1 border rounded-lg ${
                              row.delayed && row.emi == null ? 'border-amber-400 bg-amber-50' : ''
                            }`}
                          />
                        </td>
                      </tr>
                    ))}
                    {!rows.length && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                          No subscribers still need dues
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || previewLoading || !ready || !rows.length}
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-teal-700 text-white rounded-lg disabled:opacity-50"
            >
              Process Monthly Due
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const FlexibleGroupsContent = ({ data, onRefresh }) => {
  const { user } = useUserContext();
  const { groupId } = useParams();
  const [dueStatus, setDueStatus] = useState(null);
  const [showPayable, setShowPayable] = useState(false);
  const [showDues, setShowDues] = useState(false);
  const [savingPayable, setSavingPayable] = useState(false);
  const [savingDues, setSavingDues] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedDueMonth, setSelectedDueMonth] = useState(null);

  const results = data?.results || {};
  const {
    groupsTabResult,
    yourDueResult,
    custDueResult,
    commisionType,
    is_commision_taken,
    commissionAmount,
    emi,
    groupProgress,
    type,
    nextAuctionDate,
    startTime,
    endTime,
    groupSubcriberResult,
  } = results;

  const loadStatus = async () => {
    if (!groupId || !user?.results?.token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/flexible-groups/${groupId}/due-status`, {
        headers: { Authorization: `Bearer ${user.results.token}` },
      });
      const body = await res.json();
      if (res.ok && !body.error) {
        setDueStatus(body.results || body);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [groupId, user?.results?.token, data]);

  const authHeaders = {
    Authorization: `Bearer ${user?.results?.token}`,
    'Content-Type': 'application/json',
  };

  const submitPayable = async (payload) => {
    setSavingPayable(true);
    try {
      const res = await fetch(`${API_BASE_URL}/flexible-groups/${groupId}/payables`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || body.error) throw new Error(body.message || 'Failed to add payable');
      toast.success(body.message || 'Payable added');
      setShowPayable(false);
      if (onRefresh) await onRefresh();
      await loadStatus();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingPayable(false);
    }
  };

  const submitPreview = async (payload) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/flexible-groups/${groupId}/accounts/preview`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || body.error) throw new Error(body.message || 'Failed to load dues');
      setPreview(body.results || body);
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setPreviewLoading(false);
    }
  };

  const submitDues = async (payload) => {
    setSavingDues(true);
    try {
      const res = await fetch(`${API_BASE_URL}/flexible-groups/${groupId}/dues`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || body.error) throw new Error(body.message || 'Failed to add dues');
      toast.success(body.message || 'Monthly dues added');
      setShowDues(false);
      setPreview(null);
      if (onRefresh) await onRefresh();
      await loadStatus();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingDues(false);
    }
  };

  if (!data?.results) {
    return <p className="text-gray-500">No data available.</p>;
  }

  const payables = dueStatus?.payables || [];
  const dueMonths = dueStatus?.due_months || [];

  return (
    <>
      <Wrapper>
        <div className="space-y-4">
          <GroupDetailsCard
            compact
            groups={groupsTabResult || []}
            yourdue={yourDueResult || []}
            customerdue={custDueResult || []}
            nextAuctionDate={nextAuctionDate}
            startTime={startTime}
            endTime={endTime}
            commisionType={commisionType}
            is_commision_taken={is_commision_taken}
            commision={commissionAmount}
            emi={emi || 0}
            isGroupProgress={groupProgress}
            groupType={type || 'FLEXIBLE'}
            groupSubcriberResult={groupSubcriberResult}
            payablesSettled={
              new Set(
                (dueStatus?.payables || [])
                  .map((p) => p.group_subscriber_id)
                  .filter(Boolean)
              ).size
            }
            payablesTotal={
              dueStatus?.members?.length
              || dueStatus?.tenure
              || results.noOfSubcribers
              || results.noOfSubscribers
              || 0
            }
            dueMonthsProcessed={dueStatus?.due_month_count || 0}
            dueMonthsTotal={dueStatus?.tenure || results.totalTenture || 0}
          />

          {dueStatus?.is_extension && dueStatus?.can_add_dues && (
            <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-amber-950">
              <p className="text-sm font-extrabold mb-1">
                Extra dues needed after {dueStatus.due_month_count} due months
              </p>
              <p className="text-xs mb-2">
                {dueStatus.remaining_member_count === 1 ? (
                  <>
                    <span className="font-semibold">{dueStatus.billable?.[0]?.name}</span>
                    {' '}still has {dueStatus.billable?.[0]?.remaining_dues} pending due
                    {dueStatus.billable?.[0]?.remaining_dues === 1 ? '' : 's'}.
                    Use <span className="font-semibold">Add monthly due</span>. Only this subscriber will be billed.
                  </>
                ) : (
                  <>
                    {dueStatus.remaining_member_count} subscribers still have pending dues.
                    Use <span className="font-semibold">Add monthly due</span>. Only they will be billed.
                  </>
                )}
              </p>
              <table className="w-full text-xs bg-white rounded-lg border border-amber-200">
                <thead className="bg-amber-100">
                  <tr>
                    <th className="px-3 py-2 text-left">Subscriber</th>
                    <th className="px-3 py-2 text-left">Dues posted</th>
                    <th className="px-3 py-2 text-left">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {(dueStatus.billable || []).map((m) => (
                    <tr key={m.group_subscriber_id} className="border-t border-amber-100">
                      <td className="px-3 py-2 font-semibold">{m.name}</td>
                      <td className="px-3 py-2">{m.dues_posted} / {dueStatus.tenure}</td>
                      <td className="px-3 py-2 font-extrabold text-amber-800">{m.remaining_dues} pending</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Payables</h3>
                  <p className="text-xs text-gray-500">Prize for one customer at a time.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayable(true)}
                  className="shrink-0 bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm"
                >
                  <FiPlus size={16} />
                  Add payable
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Customer</th>
                      <th className="px-3 py-2 text-left">Prize</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payables.map((p) => (
                      <tr key={p.payable_id} className="border-t">
                        <td className="px-3 py-2">{formatDisplayDate(p.auct_date)}</td>
                        <td className="px-3 py-2 font-semibold">{p.name || p.firstname}</td>
                        <td className="px-3 py-2 font-bold">{formatMoney(p.payable_amount)}</td>
                      </tr>
                    ))}
                    {!payables.length && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-gray-500">No payables yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Receivables</h3>
                  <p className="text-xs text-gray-500">
                    Due months: <span className="font-bold text-gray-700">{dueStatus?.due_month_count || 0}</span>
                    {dueStatus?.tenure ? ` / ${dueStatus.tenure}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    setShowDues(true);
                  }}
                  disabled={dueStatus && !dueStatus.can_add_dues}
                  className="shrink-0 bg-teal-700 hover:bg-teal-800 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  <FiPlus size={16} />
                  Add monthly due
                </button>
              </div>
              <div className="space-y-2">
                {dueMonths.map((month) => (
                  <div
                    key={`${month.auct_date}-${month.group_account_id}`}
                    className="border border-gray-200 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2"
                  >
                    <span className="text-sm font-bold text-gray-900">
                      {formatDisplayDate(month.auct_date)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDueMonth(month)}
                      className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                    >
                      <FiList size={14} />
                      Dues processed
                    </button>
                  </div>
                ))}
                {!dueMonths.length && (
                  <p className="text-sm text-gray-500 text-center py-6">No monthly dues yet</p>
                )}
              </div>
            </section>
          </div>
        </div>
      </Wrapper>

      <AddPayableModal
        open={showPayable}
        onClose={() => setShowPayable(false)}
        subscribers={groupSubcriberResult || []}
        paidSubscriberIds={(dueStatus?.payables || [])
          .map((p) => p.group_subscriber_id)
          .filter(Boolean)}
        groupAmount={results.amount}
        defaultDate={nextAuctionDate}
        saving={savingPayable}
        onSubmit={submitPayable}
      />
      <DueProcessedModal
        open={!!selectedDueMonth}
        month={selectedDueMonth}
        tenure={dueStatus?.tenure || results.totalTenture}
        onClose={() => setSelectedDueMonth(null)}
      />
      <AddDuesModal
        open={showDues}
        onClose={() => {
          setShowDues(false);
          setPreview(null);
        }}
        defaultEmi={emi || dueStatus?.emi || 0}
        defaultDate={nextAuctionDate}
        tenure={dueStatus?.tenure || results.totalTenture}
        saving={savingDues}
        previewLoading={previewLoading}
        preview={preview}
        onPreview={submitPreview}
        onSubmit={submitDues}
      />
    </>
  );
};

const FlexibleGroupsPage = () => {
  const { groupId } = useParams();
  const history = useHistory();
  const location = useLocation();
  const { data, isLoading, fetchGroups } = useGroupDetailsContext();

  useEffect(() => {
    if (groupId) {
      fetchGroups(groupId);
    }
  }, [groupId]);

  useEffect(() => {
    const groupType = String(data?.results?.type || '').toUpperCase();
    if (!groupType || isLoading) return;
    if (groupType !== 'FLEXIBLE') {
      const base = location.pathname.includes('/manager/')
        ? '/chit-fund/manager'
        : '/chit-fund/user';
      const dest =
        groupType === 'ADAPTIVE'
          ? `${base}/adaptive-groups/${groupId}`
          : `${base}/groups/${groupId}`;
      history.replace(dest);
    }
  }, [data, isLoading, groupId, history, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-4">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <img src={loadingImage} className="w-20 h-20 mx-auto mb-4" alt="loading" />
            <p className="text-gray-600 font-medium">Loading flexible group...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasData = data && Object.keys(data).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-4">
      <div className="max-w-7xl mx-auto">
        {hasData ? (
          <>
            <UserInfo data={data} />
            <FlexibleGroupsContent data={data} onRefresh={() => fetchGroups(groupId)} />
            <GroupSubscriber data={data} />
          </>
        ) : (
          <div className="text-center mt-8 text-gray-500">No data available.</div>
        )}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default FlexibleGroupsPage;
