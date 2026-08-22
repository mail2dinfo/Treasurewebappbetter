import { useEffect, useState } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';
import { FiPlus, FiX, FiList, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
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

const shareDueAmount = (due, pct) => {
  const dueNum = Number(due);
  if (!Number.isFinite(dueNum) || dueNum < 0) return 0;
  let p = Number(pct);
  if (!Number.isFinite(p) || p <= 0) p = 100;
  if (p > 0 && p <= 1) p *= 100;
  return Math.floor((dueNum * p) / 100);
};

const payableSubscriberLabel = (s) => {
  const name = s.name || s.firstname || s.phone || 'Subscriber';
  const ticket = s.accountshare_id ? `Ticket ${s.accountshare_id}` : 'Ticket —';
  let pct = Number(s.accountshare_percentage);
  if (!Number.isFinite(pct) || pct <= 0) pct = 100;
  if (pct > 0 && pct <= 1) pct *= 100;
  return `${name} · ${ticket} · ${pct}%`;
};

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

const DeleteFlexibleAccountModal = ({
  open,
  onClose,
  preview,
  loadingPreview,
  deleting,
  onConfirm,
  kind,
}) => {
  if (!open) return null;
  const will = preview?.will_delete || {};
  const account = preview?.group_account || {};
  const label = kind === 'payable' ? 'prize payable' : 'monthly due';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Delete {label}</h2>
          <button type="button" onClick={onClose} disabled={deleting} className="text-white/80 hover:text-white p-2">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {loadingPreview ? (
            <p className="text-sm text-gray-500">Loading delete impact…</p>
          ) : !preview ? (
            <p className="text-sm text-red-600">Unable to load delete preview.</p>
          ) : (
            <>
              <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <FiAlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  Only the last {label} can be deleted. Date:{' '}
                  <strong>{formatDisplayDate(account.auct_date)}</strong>
                </p>
              </div>
              <ul className="text-sm border border-gray-200 rounded-lg divide-y">
                {[
                  ['Group accounts', will.group_accounts ?? 1],
                  ['Payables', will.payables ?? 0],
                  ['Payments', will.payments ?? 0],
                  ['Receivables', will.receivables ?? 0],
                  ['Receipts', will.receipts ?? 0],
                  ['Ledger entries', will.ledger_entries ?? 0],
                ].map(([name, count]) => (
                  <li key={name} className="flex justify-between px-3 py-2">
                    <span>{name}</span>
                    <span className="font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
              {Array.isArray(preview?.ledger_accounts) && preview.ledger_accounts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Ledger after delete</h3>
                  <ul className="text-sm border border-gray-200 rounded-lg divide-y">
                    {preview.ledger_accounts.map((row) => (
                      <li key={row.ledger_account_id} className="px-3 py-2 flex justify-between gap-3">
                        <span>{row.account_name}</span>
                        <span className="font-semibold whitespace-nowrap">
                          {Number(row.current_balance ?? 0).toFixed(2)} → {Number(row.new_closing_balance ?? 0).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={deleting} className="flex-1 px-4 py-3 bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting || loadingPreview || !preview}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
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
  const [confirming, setConfirming] = useState(false);

  const paidIds = new Set((paidSubscriberIds || []).map((id) => String(id)));
  const unpaidSubscribers = (subscribers || []).filter((s) => {
    const id = s.group_subscriber_id || s.id;
    return id && !paidIds.has(String(id));
  });

  const selectedSharePct = (sub) => {
    let pct = Number(sub?.accountshare_percentage);
    if (!Number.isFinite(pct) || pct <= 0) pct = 100;
    if (pct > 0 && pct <= 1) pct *= 100;
    return pct;
  };

  useEffect(() => {
    if (!open) return;
    setAuctDate(toISODate(defaultDate) || todayISO());
    setGroupSubscriberId('');
    setCustomerAmount('');
    setConfirming(false);
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
      toast.error('Choose subscriber');
      return;
    }
    if (!customerAmount || prizeNum <= 0) {
      toast.error('Enter prize amount');
      return;
    }
    setConfirming(true);
  };

  const handleConfirm = () => {
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
          <h2 className="text-lg font-bold text-white">
            {confirming ? 'Confirm payable' : 'Add payable'}
          </h2>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white p-2">
            <FiX className="w-5 h-5" />
          </button>
        </div>
        {confirming ? (
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">
              Review this prize payable. It will be created for the subscriber below.
            </p>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-semibold">{formatDisplayDate(auctDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subscriber</span>
                <span className="font-semibold">{selected?.name || selected?.firstname}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Ticket</span>
                <span className="font-semibold">{selected?.accountshare_id || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Share</span>
                <span className="font-semibold">{selectedSharePct(selected)}%</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-500">Prize amount</span>
                <span className="font-extrabold text-teal-800">{formatMoney(prizeNum)}</span>
              </div>
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
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 bg-teal-700 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Processing…' : 'Confirm'}
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Creates a payable for one subscriber who has not received a prize yet. Share % comes from group subscribers.
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscriber *</label>
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
                    {payableSubscriberLabel(s)}
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
          {selected && (
            <div className="rounded-xl bg-teal-50 border border-teal-200 px-4 py-3">
              <p className="text-xl font-extrabold text-gray-900">{selected.name || selected.firstname}</p>
              <p className="text-sm text-teal-800 mt-1">
                Ticket {selected.accountshare_id || '—'} · {(() => {
                  let pct = Number(selected.accountshare_percentage);
                  if (!Number.isFinite(pct) || pct <= 0) pct = 100;
                  if (pct > 0 && pct <= 1) pct *= 100;
                  return `${pct}% share`;
                })()}
              </p>
              {prizeNum > 0 && (
                <p className="text-2xl font-extrabold text-teal-800 mt-1">{formatMoney(prizeNum)}</p>
              )}
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
        )}
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
    const currentDueNo = scheduleDueNumber(recs);
    const base = Number(emiValue);
    const next = {};
    recs.forEach((row) => {
      const key = String(row.group_subscriber_id);
      if (isDelayedJoiner(row, currentDueNo)) {
        next[key] = '';
      } else if (Number.isFinite(base) && base > 0) {
        next[key] = String(shareDueAmount(base, row.accountshare_percentage));
      } else {
        next[key] = '';
      }
    });
    setRowEmis(next);
  }, [ready, preview, auctDate]);

  useEffect(() => {
    if (!ready || !preview?.receivables) return;
    const recs = preview.receivables;
    const currentDueNo = scheduleDueNumber(recs);
    const base = Number(emiValue);
    setRowEmis((prev) => {
      const next = { ...prev };
      recs.forEach((row) => {
        if (isDelayedJoiner(row, currentDueNo)) return;
        const key = String(row.group_subscriber_id);
        next[key] = Number.isFinite(base) && base > 0
          ? String(shareDueAmount(base, row.accountshare_percentage))
          : '';
      });
      return next;
    });
  }, [emiValue, ready, preview]);

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
                      <th className="px-3 py-2 text-left">Ticket</th>
                      <th className="px-3 py-2 text-left">Share</th>
                      <th className="px-3 py-2 text-left">Due no.</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.group_subscriber_id} className="border-t">
                        <td className="px-3 py-2 font-semibold">{row.name}</td>
                        <td className="px-3 py-2">{row.accountshare_id || '—'}</td>
                        <td className="px-3 py-2">{Number(row.accountshare_percentage) || 100}%</td>
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
                Full-ticket due. Split tickets (for example 1A / 1B at 50%) get this amount × their share.
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
                      <th className="px-3 py-2 text-left">Ticket</th>
                      <th className="px-3 py-2 text-left">Share</th>
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
                        <td className="px-3 py-2">{row.accountshare_id || '—'}</td>
                        <td className="px-3 py-2">{Number(row.accountshare_percentage) || 100}%</td>
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
                        <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePreview, setDeletePreview] = useState(null);
  const [loadingDeletePreview, setLoadingDeletePreview] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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

  useEffect(() => {
    if (!deleteTarget?.groupAccountId || !groupId) return undefined;
    let cancelled = false;
    const load = async () => {
      setLoadingDeletePreview(true);
      setDeletePreview(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/flexible-groups/${groupId}/accounts/${deleteTarget.groupAccountId}/delete-preview`,
          { headers: authHeaders }
        );
        const body = await res.json();
        if (!res.ok || body.error) throw new Error(body.message || 'Failed to load delete preview');
        if (!cancelled) setDeletePreview(body.results || body);
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message);
          setDeleteTarget(null);
        }
      } finally {
        if (!cancelled) setLoadingDeletePreview(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [deleteTarget, groupId, user?.results?.token]);

  const confirmDeleteAccount = async () => {
    if (!deleteTarget?.groupAccountId) return;
    setDeletingAccount(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/flexible-groups/${groupId}/accounts/${deleteTarget.groupAccountId}`,
        { method: 'DELETE', headers: authHeaders }
      );
      const body = await res.json();
      if (!res.ok || body.error) throw new Error(body.message || 'Failed to delete');
      toast.success(body.message || 'Deleted');
      setDeleteTarget(null);
      setDeletePreview(null);
      if (onRefresh) await onRefresh();
      await loadStatus();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeletingAccount(false);
    }
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
  const lastPayable = payables.reduce((latest, row) => {
    if (!latest) return row;
    return Number(row.sequence_number || 0) >= Number(latest.sequence_number || 0) ? row : latest;
  }, null);
  const lastDueMonth = dueMonths.reduce((latest, row) => {
    if (!latest) return row;
    return Number(row.sequence_number || 0) >= Number(latest.sequence_number || 0) ? row : latest;
  }, null);

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
                  <p className="text-xs text-gray-500">Prize for one subscriber at a time. Trash is only on the last payable.</p>
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
                      <th className="px-3 py-2 text-left">Subscriber</th>
                      <th className="px-3 py-2 text-left">Prize</th>
                      <th className="px-3 py-2 text-right"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payables.map((p) => (
                      <tr key={p.payable_id} className="border-t">
                        <td className="px-3 py-2">{formatDisplayDate(p.auct_date)}</td>
                        <td className="px-3 py-2 font-semibold">{p.name || p.firstname}</td>
                        <td className="px-3 py-2 font-bold">{formatMoney(p.payable_amount)}</td>
                        <td className="px-3 py-2 text-right">
                          {lastPayable && p.group_account_id === lastPayable.group_account_id && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ kind: 'payable', groupAccountId: p.group_account_id })}
                              className="inline-flex items-center gap-1 text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg"
                              title="Delete last payable"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!payables.length && (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-gray-500">No payables yet</td>
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDueMonth(month)}
                        className="inline-flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        <FiList size={14} />
                        Dues processed
                      </button>
                      {lastDueMonth && month.group_account_id === lastDueMonth.group_account_id && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ kind: 'due', groupAccountId: month.group_account_id })}
                          className="inline-flex items-center gap-1 text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg"
                          title="Delete last monthly due"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
      <DeleteFlexibleAccountModal
        open={Boolean(deleteTarget)}
        kind={deleteTarget?.kind}
        preview={deletePreview}
        loadingPreview={loadingDeletePreview}
        deleting={deletingAccount}
        onClose={() => {
          if (deletingAccount) return;
          setDeleteTarget(null);
          setDeletePreview(null);
        }}
        onConfirm={confirmDeleteAccount}
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
