import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';

const HostelManagementLedgerPage = () => {
  const {
    ledgerAccounts, ledgerEntries,
    fetchLedgerAccounts, fetchLedgerEntries, createLedgerAccount,
  } = useHostelManagement();
  const { can } = useHmPermission();
  const canCreate = can('hm_ledger_create') || can('hm_ledger_manage');
  const [accountName, setAccountName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [accountFilter, setAccountFilter] = useState('');

  useEffect(() => {
    fetchLedgerAccounts();
    fetchLedgerEntries();
  }, []);

  const addAccount = async (e) => {
    e.preventDefault();
    const r = await createLedgerAccount({ accountName, openingBalance: Number(openingBalance) || 0 });
    if (r.success) {
      toast.success('Account created');
      setAccountName('');
      setOpeningBalance('0');
    } else toast.error(r.error);
  };

  const filteredEntries = useMemo(() => {
    if (!accountFilter) return ledgerEntries || [];
    return (ledgerEntries || []).filter((e) => e.hm_ledger_account_id === accountFilter);
  }, [ledgerEntries, accountFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hostel Ledger</h1>
        <p className="text-sm text-gray-500">
          Cash / PhonePe / Bank accounts. Rent payments show which resident and month paid when a ledger account is selected.
        </p>
      </div>

      {canCreate && (
        <form onSubmit={addAccount} className="bg-white border rounded-xl p-4 flex flex-wrap gap-2">
          <input className="border rounded-lg px-3 py-2" placeholder="Account name" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
          <input className="border rounded-lg px-3 py-2" type="number" placeholder="Opening" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} />
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">+ Account</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ledgerAccounts.map((a) => (
          <button
            type="button"
            key={a.id}
            onClick={() => setAccountFilter((prev) => (prev === a.id ? '' : a.id))}
            className={`text-left bg-white border rounded-xl p-4 transition ${
              accountFilter === a.id ? 'border-red-400 ring-1 ring-red-200' : 'hover:border-gray-300'
            }`}
          >
            <p className="font-semibold">{a.account_name}</p>
            <p className="text-xs text-gray-500">Opening ₹{Number(a.opening_balance).toLocaleString('en-IN')}</p>
            <p className="text-xl font-bold text-green-700 mt-1">₹{Number(a.current_balance).toLocaleString('en-IN')}</p>
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-xl overflow-x-auto">
        <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Recent entries</h2>
          {accountFilter && (
            <button type="button" className="text-xs font-semibold text-red-700 underline" onClick={() => setAccountFilter('')}>
              Clear account filter
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Resident</th>
              <th className="px-3 py-2">Month</th>
              <th className="px-3 py-2">Account</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((e) => (
              <tr key={e.id} className="border-t align-top">
                <td className="px-3 py-2 whitespace-nowrap">{e.transacted_date}</td>
                <td className="px-3 py-2">
                  <p className="font-medium text-gray-900">{e.resident_name || '—'}</p>
                  {e.resident_phone && <p className="text-xs text-gray-500">{e.resident_phone}</p>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{e.month_label || '—'}</td>
                <td className="px-3 py-2">{e.account_name || '—'}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs font-semibold ${e.entry_type === 'CREDIT' ? 'text-green-700' : 'text-red-700'}`}>
                    {e.entry_type}
                  </span>
                  {e.category && <p className="text-xs text-gray-500">{e.category}</p>}
                </td>
                <td className="px-3 py-2 text-right font-semibold">₹{Number(e.amount).toLocaleString('en-IN')}</td>
                <td className="px-3 py-2 text-xs text-gray-600 max-w-xs">
                  {e.bill_number && <p className="font-medium text-gray-800">Bill {e.bill_number}</p>}
                  {e.payment_method && <p>{e.payment_method}</p>}
                  <p className="text-gray-500">{e.description}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEntries.length === 0 && <p className="p-4 text-gray-500">No entries yet.</p>}
      </div>
    </div>
  );
};

export default HostelManagementLedgerPage;
