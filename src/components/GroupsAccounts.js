import React, { useState, useEffect } from 'react';
import GroupAccountList from './GroupAccountList';
import { ArrowUp, Database } from 'lucide-react';
import { FiTrash2, FiX, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useUserContext } from '../context/user_context';
import { API_BASE_URL } from '../utils/apiConfig';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const DeleteGroupAccountModal = ({
  open,
  onClose,
  preview,
  loadingPreview,
  deleting,
  onConfirm,
}) => {
  if (!open) return null;

  const will = preview?.will_delete || {};
  const account = preview?.group_account || {};

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiTrash2 className="w-5 h-5" />
            Delete Group Account
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2"
          >
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
                <div>
                  <p className="font-semibold">Only the last S.No can be deleted</p>
                  <p className="mt-1 text-amber-800">
                    Deleting from the end keeps S.No continuous. You are deleting S.No{' '}
                    <strong>{account.sno ?? '—'}</strong> dated{' '}
                    <strong>{formatDate(account.auct_date)}</strong>.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Records that will be deleted
                </h3>
                <ul className="text-sm border border-gray-200 rounded-lg divide-y divide-gray-100">
                  <li className="flex justify-between px-3 py-2">
                    <span>Group accounts</span>
                    <span className="font-semibold">{will.group_accounts ?? 1}</span>
                  </li>
                  <li className="flex justify-between px-3 py-2">
                    <span>Receivables</span>
                    <span className="font-semibold">{will.receivables ?? 0}</span>
                  </li>
                  <li className="flex justify-between px-3 py-2">
                    <span>Receipts</span>
                    <span className="font-semibold">{will.receipts ?? 0}</span>
                  </li>
                  <li className="flex justify-between px-3 py-2">
                    <span>Payables</span>
                    <span className="font-semibold">{will.payables ?? 0}</span>
                  </li>
                  <li className="flex justify-between px-3 py-2">
                    <span>Payments</span>
                    <span className="font-semibold">{will.payments ?? 0}</span>
                  </li>
                  <li className="flex justify-between px-3 py-2">
                    <span>Earned premium</span>
                    <span className="font-semibold">{will.earned_premium ?? 0}</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-900">
                <p className="font-semibold mb-1">Next auction date</p>
                <p>
                  Will be restored from{' '}
                  <strong>{formatDate(will.next_auction_date?.from)}</strong> →{' '}
                  <strong>{formatDate(will.next_auction_date?.to)}</strong>
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={deleting || loadingPreview || !preview}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FiTrash2 className="w-4 h-4" />
              {deleting ? 'Deleting…' : 'Delete last account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GroupsAccounts = ({
  groupTransactionInfo,
  type,
  groupId,
  allowDeleteLast = false,
  onRefresh,
}) => {
  const { user } = useUserContext();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!deleteTarget?.grpAccountId || !groupId) return undefined;

    let cancelled = false;
    const loadPreview = async () => {
      setLoadingPreview(true);
      setPreview(null);
      try {
        const res = await fetch(
          `${API_BASE_URL}/adaptive-groups/${groupId}/accounts/${deleteTarget.grpAccountId}/delete-preview`,
          {
            headers: {
              Authorization: `Bearer ${user?.results?.token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        const body = await res.json();
        if (!res.ok || body.error) {
          throw new Error(body.message || 'Failed to load delete preview');
        }
        if (!cancelled) setPreview(body.results || body.data || body);
      } catch (error) {
        if (!cancelled) {
          toast.error(error.message || 'Failed to load delete preview');
          setDeleteTarget(null);
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    };

    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [deleteTarget, groupId, user?.results?.token]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setPreview(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.grpAccountId || !groupId) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/adaptive-groups/${groupId}/accounts/${deleteTarget.grpAccountId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user?.results?.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const body = await res.json();
      if (!res.ok || body.error) {
        throw new Error(body.message || 'Failed to delete group account');
      }
      toast.success(body.message || 'Group account deleted');
      setDeleteTarget(null);
      setPreview(null);
      if (onRefresh) await onRefresh();
    } catch (error) {
      toast.error(error.message || 'Failed to delete group account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg relative mt-6">
      <div className="absolute -top-4 left-6 bg-custom-red text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
        Group Accounts
      </div>

      <div className="p-6 pt-8">
        {allowDeleteLast && groupTransactionInfo?.length > 0 && (
          <p className="text-xs text-gray-500 mb-3">
            Trash is available only on the last S.No so sequence numbers do not collapse.
          </p>
        )}
        {groupTransactionInfo?.length > 0 ? (
          <div className="space-y-4">
            <GroupAccountList
              items={groupTransactionInfo}
              type={type}
              allowDeleteLast={allowDeleteLast}
              onDeleteClick={(item) => setDeleteTarget(item)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Database className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No auctions done</h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              There are currently no group account transactions available. Data will appear here once
              group accounts are created or imported.
            </p>
          </div>
        )}
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center z-50 group"
        >
          <ArrowUp size={20} className="group-hover:animate-bounce" />
        </button>
      )}

      <DeleteGroupAccountModal
        open={Boolean(deleteTarget)}
        onClose={closeDeleteModal}
        preview={preview}
        loadingPreview={loadingPreview}
        deleting={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default GroupsAccounts;
