import { useEffect, useState } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FiDownload, FiPlus, FiUserPlus, FiX } from 'react-icons/fi';
import loadingImage from '../images/preloader.gif';
import { useGroupDetailsContext } from '../context/group_context';
import { useUserContext } from '../context/user_context';
import { API_BASE_URL } from '../utils/apiConfig';
import { UserInfo, GroupSubscriber } from '../components';
import GroupAccountsPdf from '../components/PDF/GroupAccountsPdf';
import GroupsAccounts from '../components/GroupsAccounts';
import GroupDetailsCard from '../components/GroupDetailsCard';

const Wrapper = styled.div`
  padding-top: 2rem;
  display: grid;
  gap: 3rem 2rem;
  @media (min-width: 992px) {
    grid-template-columns: 1fr 1fr;
  }
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

const AddFlexibleGroupAccountModal = ({
  open,
  onClose,
  subscribers,
  groupAmount,
  defaultEmi,
  defaultInstallmentDate,
  saving,
  previewLoading,
  preview,
  billableIds: billableIdsProp,
  onPreview,
  onConfirm,
}) => {
  const [step, setStep] = useState(1);
  const [auctDate, setAuctDate] = useState(todayISO());
  const [groupSubscriberId, setGroupSubscriberId] = useState('');
  const [customerAmount, setCustomerAmount] = useState('');

  const isPrizeDone = (s) => Number(s?.group_won) === 1;
  const groupAmountNum = Number(groupAmount) || 0;
  const prizeNum = Number(customerAmount) || 0;

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setAuctDate(toISODate(defaultInstallmentDate) || todayISO());
    setGroupSubscriberId('');
    setCustomerAmount('');
  }, [open, defaultInstallmentDate]);

  if (!open) return null;

  const billableIds = new Set(
    (preview?.billable || []).map((m) => String(m.group_subscriber_id)).concat(
      (billableIdsProp || []).map((id) => String(id))
    )
  );
  const eligibleSubscribers = (subscribers || []).filter((s) => {
    if (isPrizeDone(s)) return false;
    if (billableIds.size > 0) return billableIds.has(String(s.group_subscriber_id));
    return true;
  });
  const selectedSubscriber = (subscribers || []).find(
    (s) => String(s.group_subscriber_id) === String(groupSubscriberId)
  );
  const recipientLabel = (s) => `${s.name || s.firstname || s.phone} · ${s.phone || ''}`;

  const goToReceivables = async (e) => {
    e.preventDefault();
    if (!auctDate) {
      toast.error('Enter installment date');
      return;
    }
    if (!groupSubscriberId) {
      toast.error('Choose customer');
      return;
    }
    if (!customerAmount || prizeNum <= 0) {
      toast.error('Enter customer prize amount');
      return;
    }
    if (prizeNum > groupAmountNum) {
      toast.error('Prize cannot be greater than group amount');
      return;
    }
    const ok = await onPreview({
      auct_date: auctDate,
      customer_due: Number(defaultEmi) || 0,
    });
    if (ok) setStep(2);
  };

  const receivables = preview?.receivables || [];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Add Group Account (Flexible) — Step {step} of 3
          </h2>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white p-2">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-4 text-xs font-medium text-gray-500 flex gap-4">
          <span className={step === 1 ? 'text-teal-700' : ''}>1. Installment</span>
          <span className={step === 2 ? 'text-teal-700' : ''}>2. Receivables</span>
          <span className={step === 3 ? 'text-teal-700' : ''}>3. Confirm</span>
        </div>

        {step === 1 && (
          <form onSubmit={goToReceivables} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installment date *</label>
              <input
                type="date"
                value={auctDate}
                onChange={(e) => setAuctDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Choose customer *</label>
              <select
                value={groupSubscriberId}
                onChange={(e) => setGroupSubscriberId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                required
              >
                <option value="">Choose subscriber</option>
                {eligibleSubscribers.map((s) => (
                  <option key={s.group_subscriber_id} value={s.group_subscriber_id}>
                    {recipientLabel(s)}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500 mt-1">
                Prize recipient. Members who already received prize, or who finished all dues, cannot be chosen.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer prize amount *</label>
              <input
                type="number"
                step="0.01"
                value={customerAmount}
                onChange={(e) => setCustomerAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button
                type="submit"
                disabled={previewLoading}
                className="flex-1 px-4 py-3 bg-teal-700 text-white rounded-lg disabled:opacity-50"
              >
                {previewLoading ? 'Loading…' : 'Next: Receivables'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="p-6 space-y-4">
            {preview?.is_extension && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Extra installment: {preview.message}
              </div>
            )}
            {!preview?.is_extension && preview?.message && (
              <p className="text-sm text-gray-600">{preview.message}</p>
            )}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Phone</th>
                    <th className="px-3 py-2 text-left">Auction date</th>
                    <th className="px-3 py-2 text-left">Due no.</th>
                    <th className="px-3 py-2 text-left">EMI</th>
                  </tr>
                </thead>
                <tbody>
                  {receivables.map((row) => (
                    <tr key={row.group_subscriber_id} className="border-t border-gray-100">
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.phone}</td>
                      <td className="px-3 py-2">{formatDisplayDate(row.auction_date)}</td>
                      <td className="px-3 py-2">{row.due_number} / {row.tenure}</td>
                      <td className="px-3 py-2">{formatMoney(row.emi)}</td>
                    </tr>
                  ))}
                  {!receivables.length && (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                        No subscribers to bill for this installment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {(preview?.skipped || []).length > 0 && (
              <p className="text-xs text-gray-500">
                Skipped (dues complete): {preview.skipped.map((s) => s.name).join(', ')}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep(1)} className="flex-1 px-4 py-3 bg-gray-100 rounded-lg">
                Back
              </button>
              <button
                type="button"
                disabled={!receivables.length}
                onClick={() => setStep(3)}
                className="flex-1 px-4 py-3 bg-teal-700 text-white rounded-lg disabled:opacity-50"
              >
                Next: Confirm
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">Nothing is saved until you confirm.</p>
            <ul className="text-sm border border-gray-200 rounded-lg divide-y">
              <li className="flex justify-between px-3 py-2">
                <span>Installment date</span>
                <span className="font-semibold">{formatDisplayDate(auctDate)}</span>
              </li>
              <li className="flex justify-between px-3 py-2">
                <span>Customer</span>
                <span className="font-semibold">{selectedSubscriber ? recipientLabel(selectedSubscriber) : '—'}</span>
              </li>
              <li className="flex justify-between px-3 py-2">
                <span>Prize amount</span>
                <span className="font-semibold">{formatMoney(prizeNum)}</span>
              </li>
              <li className="flex justify-between px-3 py-2">
                <span>Receivables to create</span>
                <span className="font-semibold">{receivables.length}</span>
              </li>
            </ul>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  onConfirm({
                    auct_date: auctDate,
                    group_subscriber_id: groupSubscriberId,
                    customer_amount: prizeNum,
                    asked_amount: Math.max(groupAmountNum - prizeNum, 0),
                    customer_due: Number(defaultEmi) || 0,
                    commision: 0,
                    advance_next_date: true,
                  })
                }
                className="flex-1 px-4 py-3 bg-teal-700 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FlexibleGroupsContent = ({ data, onRefresh }) => {
  const { user } = useUserContext();
  const { groupId } = useParams();
  const history = useHistory();
  const location = useLocation();
  const userCompany = user?.results?.userCompany;
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [dueStatus, setDueStatus] = useState(null);

  const results = data?.results || {};
  const {
    groupsTabResult,
    yourDueResult,
    custDueResult,
    groupAccountResult,
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

  const chitBase = location.pathname.includes('/manager/')
    ? '/chit-fund/manager'
    : '/chit-fund/user';

  useEffect(() => {
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
    loadStatus();
  }, [groupId, user?.results?.token, data]);

  const submitPreview = async (payload) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/flexible-groups/${groupId}/accounts/preview`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || body.error) {
        throw new Error(body.message || 'Failed to preview receivables');
      }
      setPreview(body.results || body);
      return true;
    } catch (error) {
      toast.error(error.message || 'Failed to preview receivables');
      return false;
    } finally {
      setPreviewLoading(false);
    }
  };

  const submitAccount = async (payload) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/flexible-groups/${groupId}/accounts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok || body.error) {
        throw new Error(body.message || 'Failed to add group account');
      }
      toast.success(body.message || 'Group account added');
      setShowAddModal(false);
      setPreview(null);
      if (onRefresh) await onRefresh();
    } catch (error) {
      toast.error(error.message || 'Failed to add group account');
    } finally {
      setSaving(false);
    }
  };

  if (!data?.results) {
    return <p className="text-gray-500">No data available.</p>;
  }

  return (
    <>
      <Wrapper>
        <div>
          {dueStatus?.is_extension && dueStatus?.can_add_account && (
            <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Extra dues needed. {dueStatus.message}
            </div>
          )}
          {dueStatus && !dueStatus.can_add_account && dueStatus.completed_member_count > 0 && (
            <div className="mb-4 rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900">
              {dueStatus.message}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-3 mb-6">
            <PDFDownloadLink
              document={<GroupAccountsPdf data={data} companyData={userCompany} />}
              fileName={`FlexibleGroupAccounts_${new Date().toISOString().slice(0, 10)}.pdf`}
            >
              {({ loading }) =>
                loading ? (
                  'Loading document...'
                ) : (
                  <button
                    type="button"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
                  >
                    <FiDownload size={16} />
                    Download PDF
                  </button>
                )
              }
            </PDFDownloadLink>
            <button
              type="button"
              onClick={() => history.push(`${chitBase}/addgroupsubscriber/${groupId}`)}
              className="bg-white border border-teal-600 text-teal-700 hover:bg-teal-50 px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
            >
              <FiUserPlus size={16} />
              Add subscriber
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              disabled={dueStatus && !dueStatus.can_add_account}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <FiPlus size={16} />
              Add Group accounts
            </button>
          </div>

          <GroupsAccounts
            groupTransactionInfo={groupAccountResult || []}
            type={type || 'FLEXIBLE'}
            groupId={groupId}
          />
        </div>

        <GroupDetailsCard
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
        />
      </Wrapper>

      <AddFlexibleGroupAccountModal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setPreview(null);
        }}
        subscribers={groupSubcriberResult || []}
        groupAmount={results.amount}
        defaultEmi={emi || dueStatus?.emi || 0}
        defaultInstallmentDate={nextAuctionDate}
        saving={saving}
        previewLoading={previewLoading}
        preview={preview}
        billableIds={(dueStatus?.billable || []).map((m) => m.group_subscriber_id)}
        onPreview={submitPreview}
        onConfirm={submitAccount}
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
    const type = String(data?.results?.type || '').toUpperCase();
    if (!type || isLoading) return;
    if (type !== 'FLEXIBLE') {
      const base = location.pathname.includes('/manager/')
        ? '/chit-fund/manager'
        : '/chit-fund/user';
      const dest =
        type === 'ADAPTIVE'
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
