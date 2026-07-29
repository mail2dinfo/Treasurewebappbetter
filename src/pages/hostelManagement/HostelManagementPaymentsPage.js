import React, { useEffect } from 'react';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import HostelSelector from '../../components/hostelManagement/HostelSelector';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';

const HostelManagementPaymentsPage = () => {
  const {
    selectedHostelId, paymentSubmissions, ledgerAccounts,
    fetchPaymentSubmissions, confirmPaymentSubmission, rejectPaymentSubmission, fetchLedgerAccounts,
  } = useHostelManagement();
  const { can } = useHmPermission();
  const canVerify = can('hm_payment_verify') || can('hm_receivable_manage');

  useEffect(() => { fetchLedgerAccounts(); }, []);
  useEffect(() => {
    if (selectedHostelId) fetchPaymentSubmissions(selectedHostelId);
  }, [selectedHostelId]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Verify Payments</h1>
          <p className="text-sm text-gray-500">Confirm resident PhonePe submissions → receipt + ledger + bill.</p>
        </div>
        <HostelSelector />
      </div>

      <div className="space-y-3">
        {(paymentSubmissions || []).map((s) => (
          <div key={s.id} className="bg-white border rounded-xl p-4 flex flex-wrap justify-between gap-3">
            <div>
              <p className="font-semibold">{s.resident_name}</p>
              <p className="text-sm text-gray-500">{s.resident_phone}</p>
              <p className="text-sm mt-1">₹{Number(s.amount_claimed).toLocaleString('en-IN')} · Ref: <span className="font-mono">{s.transaction_ref}</span></p>
            </div>
            <div className="flex gap-2 items-center">
              {canVerify && (
              <button
                type="button"
                className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                onClick={async () => {
                  const r = await confirmPaymentSubmission(s.id, {
                    ledgerAccountId: ledgerAccounts[0]?.id,
                    paymentMethod: 'PHONEPE',
                  });
                  if (r.success) {
                    toast.success(`Confirmed. Bill ${r.data?.receipt?.bill_number || ''}`);
                    fetchPaymentSubmissions(selectedHostelId);
                  } else toast.error(r.error);
                }}
              >
                Confirm received
              </button>
              )}
              {canVerify && (
              <button
                type="button"
                className="border border-red-300 text-red-700 px-3 py-2 rounded-lg text-sm font-semibold"
                onClick={async () => {
                  const r = await rejectPaymentSubmission(s.id, 'Invalid transaction');
                  if (r.success) {
                    toast.info('Rejected');
                    fetchPaymentSubmissions(selectedHostelId);
                  } else toast.error(r.error);
                }}
              >
                Reject
              </button>
              )}
            </div>
          </div>
        ))}
        {(!paymentSubmissions || paymentSubmissions.length === 0) && (
          <p className="text-gray-500 bg-white border rounded-xl p-6">No pending payment submissions.</p>
        )}
      </div>
    </div>
  );
};

export default HostelManagementPaymentsPage;
