import React, { useEffect, useState } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FiDownload, FiPlus, FiX } from 'react-icons/fi';
import loadingImage from '../images/preloader.gif';
import { useGroupDetailsContext } from '../context/group_context';
import { useUserContext } from '../context/user_context';
import { API_BASE_URL } from '../utils/apiConfig';
import { UserInfo, GroupSubscriber } from '../components';
import GroupAccountsPdf from '../components/PDF/GroupAccountsPdf';
import GroupsAccounts from '../components/GroupsAccounts';
import GroupDetailsCard from '../components/GroupDetailsCard';

const todayISO = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const AddAdaptiveGroupAccountModal = ({
  open,
  onClose,
  groupId,
  subscribers,
  defaultEmi,
  defaultCommission,
  saving,
  onSubmit,
}) => {
  const [auctDate, setAuctDate] = useState(todayISO());
  const [groupSubscriberId, setGroupSubscriberId] = useState('');
  const [askedAmount, setAskedAmount] = useState('');
  const [commision, setCommision] = useState(String(defaultCommission || 0));
  const [customerAmount, setCustomerAmount] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [reserveAmount, setReserveAmount] = useState('0');
  const [customerDue, setCustomerDue] = useState('');
  const [auctionProfitAmount, setAuctionProfitAmount] = useState('0');
  const [nextAuctDate, setNextAuctDate] = useState('');
  const [recipientMenuOpen, setRecipientMenuOpen] = useState(false);

  const isPrizeDone = (s) => Number(s?.group_won) === 1;

  const calcCustomerDueFromShare = (subscriber) => {
    const emi = Number(defaultEmi) || 0;
    const sharePct = Number(subscriber?.accountshare_percentage);
    const pct = Number.isFinite(sharePct) ? sharePct : 100;
    // 100% share → full EMI; 50% → half EMI, etc.
    const due = (emi * pct) / 100;
    return String(Number.isFinite(due) ? Math.round(due * 100) / 100 : 0);
  };

  useEffect(() => {
    if (!open) return;
    setAuctDate(todayISO());
    const firstEligible = (subscribers || []).find((s) => !isPrizeDone(s));
    setGroupSubscriberId(firstEligible?.group_subscriber_id || '');
    setAskedAmount('');
    setCommision(String(defaultCommission || 0));
    setCustomerAmount('');
    setBalanceAmount('');
    setReserveAmount('0');
    setCustomerDue(firstEligible ? calcCustomerDueFromShare(firstEligible) : String(defaultEmi || 0));
    setAuctionProfitAmount('0');
    setNextAuctDate('');
    setRecipientMenuOpen(false);
  }, [open, subscribers, defaultEmi, defaultCommission]);

  if (!open) return null;

  const eligibleSubscribers = (subscribers || []).filter((s) => !isPrizeDone(s));
  const paidSubscribers = (subscribers || []).filter((s) => isPrizeDone(s));
  const selectedSubscriber = (subscribers || []).find(
    (s) => String(s.group_subscriber_id) === String(groupSubscriberId)
  );
  const selectedSharePct = Number(selectedSubscriber?.accountshare_percentage);
  const sharePctLabel = Number.isFinite(selectedSharePct) ? selectedSharePct : 100;
  const recipientLabel = (s) =>
    `${s.name || s.firstname || s.phone} · ${s.accountshare_percentage || 0}% · ticket ${s.accountshare_id || '—'}`;

  const selectRecipient = (subscriberId) => {
    setGroupSubscriberId(subscriberId);
    setRecipientMenuOpen(false);
    const sub = (subscribers || []).find(
      (s) => String(s.group_subscriber_id) === String(subscriberId)
    );
    if (sub) setCustomerDue(calcCustomerDueFromShare(sub));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!groupSubscriberId) {
      toast.error('Select prize recipient (payable)');
      return;
    }
    if (selectedSubscriber && isPrizeDone(selectedSubscriber)) {
      toast.error('This subscriber already has Payment - Done. Choose another recipient.');
      return;
    }
    if (!customerAmount || Number(customerAmount) <= 0) {
      toast.error('Enter prize / customer amount');
      return;
    }
    if (customerDue === '' || Number(customerDue) < 0) {
      toast.error('Enter customer due (base EMI for receivables)');
      return;
    }

    onSubmit({
      auct_date: auctDate,
      group_subscriber_id: groupSubscriberId,
      asked_amount: Number(askedAmount) || 0,
      commision: Number(commision) || 0,
      customer_amount: Number(customerAmount),
      balance_amount: Number(balanceAmount || askedAmount) || 0,
      reserve_amount: Number(reserveAmount) || 0,
      customer_due: Number(customerDue) || 0,
      auction_profit_amount: Number(auctionProfitAmount) || 0,
      next_auct_date: nextAuctDate || undefined,
      advance_next_date: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add Group Account (Adaptive)</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Manual allotment — creates group account, receivables by share %, and payable for the selected winner.
            Existing auction groups are not affected.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Installment date *</label>
              <input
                type="date"
                value={auctDate}
                onChange={(e) => setAuctDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Prize recipient (payable) *</label>
              <button
                type="button"
                onClick={() => setRecipientMenuOpen((v) => !v)}
                disabled={eligibleSubscribers.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-white text-left flex items-center justify-between gap-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <span className={`truncate text-sm ${selectedSubscriber ? 'text-gray-800' : 'text-gray-400'}`}>
                  {selectedSubscriber
                    ? recipientLabel(selectedSubscriber)
                    : eligibleSubscribers.length === 0
                      ? 'No recipients available'
                      : 'Select subscriber'}
                </span>
                <span className="text-gray-400 text-xs shrink-0">{recipientMenuOpen ? '▲' : '▼'}</span>
              </button>

              {recipientMenuOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {eligibleSubscribers.map((s) => (
                    <button
                      key={s.group_subscriber_id}
                      type="button"
                      onClick={() => selectRecipient(s.group_subscriber_id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                        String(groupSubscriberId) === String(s.group_subscriber_id)
                          ? 'bg-red-50 text-red-700'
                          : 'text-gray-800'
                      }`}
                    >
                      {recipientLabel(s)}
                    </button>
                  ))}
                  {paidSubscribers.map((s) => (
                    <div
                      key={s.group_subscriber_id}
                      className="w-full px-3 py-2 text-sm flex items-center justify-between gap-2 bg-green-50 text-gray-500 cursor-not-allowed"
                      title="Cannot allocate again"
                    >
                      <span className="truncate">{recipientLabel(s)}</span>
                      <span className="text-xs font-bold text-green-700 shrink-0">Payment - Done</span>
                    </div>
                  ))}
                  {(subscribers || []).length === 0 && (
                    <p className="px-3 py-2 text-sm text-gray-500">No subscribers found.</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asked amount</label>
              <input
                type="number"
                step="0.01"
                value={askedAmount}
                onChange={(e) => setAskedAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commission</label>
              <input
                type="number"
                step="0.01"
                value={commision}
                onChange={(e) => setCommision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prize / customer amount *</label>
              <input
                type="number"
                step="0.01"
                value={customerAmount}
                onChange={(e) => setCustomerAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balance amount</label>
              <input
                type="number"
                step="0.01"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reserve amount</label>
              <input
                type="number"
                step="0.01"
                value={reserveAmount}
                onChange={(e) => setReserveAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer due *</label>
              <input
                type="number"
                step="0.01"
                value={customerDue}
                onChange={(e) => setCustomerDue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Auto: EMI × share % — {sharePctLabel}% of ₹{Number(defaultEmi) || 0}
                {sharePctLabel === 100 ? ' (full EMI)' : sharePctLabel === 50 ? ' (half EMI)' : ''}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auction profit amount</label>
              <input
                type="number"
                step="0.01"
                value={auctionProfitAmount}
                onChange={(e) => setAuctionProfitAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next installment date (optional)</label>
              <input
                type="date"
                value={nextAuctDate}
                onChange={(e) => setNextAuctDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || eligibleSubscribers.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save allotment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdaptiveGroupsContent = ({ data, onRefresh }) => {
  const { user } = useUserContext();
  const { groupId } = useParams();
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groupTransactionInfo, setGroupTransactionInfo] = useState([]);
  const [groups, setGroups] = useState([]);
  const [yourdue, setYourDue] = useState([]);
  const [customerdue, setCustomerDue] = useState([]);
  const [commisionType, setCommisionType] = useState([]);
  const [is_commision_taken, setCommisionProcurred] = useState([]);
  const [commision, setCommision] = useState([]);
  const [emi, setEmi] = useState(0);
  const [isGroupProgress, setGroupProgress] = useState([]);
  const [groupType, setGroupType] = useState('ADAPTIVE');
  const [subscribers, setSubscribers] = useState([]);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const userCompany = user?.results?.userCompany;

  useEffect(() => {
    if (data?.results) {
      const {
        groupsTabResult,
        yourDueResult,
        custDueResult,
        groupAccountResult,
        commisionType: cType,
        is_commision_taken: cTaken,
        commissionAmount: cAmount,
        emi: emiVal,
        groupProgress,
        type,
        groupSubcriberResult,
      } = data.results;
      setGroupTransactionInfo(groupAccountResult || []);
      setGroups(groupsTabResult || []);
      setYourDue(yourDueResult || []);
      setCustomerDue(custDueResult || []);
      setCommisionType(cType);
      setCommisionProcurred(cTaken);
      setCommision(cAmount);
      setEmi(emiVal || 0);
      setGroupProgress(groupProgress);
      setGroupType(type || 'ADAPTIVE');
      setSubscribers(groupSubcriberResult || []);
      setCommissionAmount(cAmount || 0);
    }
  }, [data]);

  const submitAllotment = async (payload) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/adaptive-groups/${groupId}/accounts`, {
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

  const { nextAuctionDate, startTime, endTime, type, groupSubcriberResult } = data.results;

  return (
    <>
      <Wrapper>
        <div>
          <div className="flex flex-wrap justify-end gap-3 mb-6">
            <PDFDownloadLink
              document={<GroupAccountsPdf data={data} companyData={userCompany} />}
              fileName={`AdaptiveGroupAccounts_${new Date().toISOString().slice(0, 10)}.pdf`}
            >
              {({ loading }) =>
                loading ? (
                  'Loading document...'
                ) : (
                  <button
                    type="button"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2 transition-colors duration-200"
                  >
                    <FiDownload size={16} />
                    Download PDF
                  </button>
                )
              }
            </PDFDownloadLink>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg shadow-md flex items-center gap-2"
            >
              <FiPlus size={16} />
              Add Group accounts
            </button>
          </div>

          <GroupsAccounts
            groupTransactionInfo={groupTransactionInfo}
            type={type || groupType}
            groupId={groupId}
            allowDeleteLast
            onRefresh={onRefresh}
          />
        </div>

        <GroupDetailsCard
          groups={groups}
          yourdue={yourdue}
          customerdue={customerdue}
          nextAuctionDate={nextAuctionDate}
          startTime={startTime}
          endTime={endTime}
          commisionType={commisionType}
          is_commision_taken={is_commision_taken}
          commision={commision}
          emi={emi}
          isGroupProgress={isGroupProgress}
          groupType={groupType}
          groupSubcriberResult={groupSubcriberResult}
        />
      </Wrapper>

      <AddAdaptiveGroupAccountModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        groupId={groupId}
        subscribers={subscribers}
        defaultEmi={emi}
        defaultCommission={commissionAmount}
        saving={saving}
        onSubmit={submitAllotment}
      />
    </>
  );
};

const Wrapper = styled.div`
  padding-top: 2rem;
  display: grid;
  gap: 3rem 2rem;
  @media (min-width: 992px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const AdaptiveGroupsPage = () => {
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
    if (type !== 'ADAPTIVE') {
      const base = location.pathname.includes('/manager/')
        ? '/chit-fund/manager'
        : '/chit-fund/user';
      history.replace(`${base}/groups/${groupId}`);
    }
  }, [data, isLoading, groupId, history, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-4">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <img src={loadingImage} className="w-20 h-20 mx-auto mb-4" alt="loading" />
            <p className="text-gray-600 font-medium">Loading adaptive group...</p>
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
            <AdaptiveGroupsContent data={data} onRefresh={() => fetchGroups(groupId)} />
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

export default AdaptiveGroupsPage;
