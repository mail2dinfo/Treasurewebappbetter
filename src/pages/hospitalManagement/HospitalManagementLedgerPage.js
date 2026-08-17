import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const toDate = (d) => d.toISOString().slice(0, 10);

const HospitalManagementLedgerPage = () => {
  const {
    ledgerAccounts,
    ledgerEntries,
    ledgerCategories,
    fetchLedgerAccounts,
    fetchLedgerEntries,
    fetchLedgerCategories,
    createLedgerAccount,
    createLedgerEntry,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_ledger_manage');

  const [accountForm, setAccountForm] = useState({ accountName: '', openingBalance: '0' });
  const [entryForm, setEntryForm] = useState({
    ledgerAccountId: '',
    category: '',
    subcategory: '',
    amount: '',
    entryType: 'CREDIT',
    description: '',
    transactedDate: toDate(new Date()),
  });
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ accountId: '', category: '', entryType: '' });

  useEffect(() => {
    fetchLedgerAccounts();
    fetchLedgerCategories();
    fetchLedgerEntries();
  }, [fetchLedgerAccounts, fetchLedgerCategories, fetchLedgerEntries]);

  useEffect(() => {
    fetchLedgerEntries({
      accountId: filters.accountId || undefined,
      category: filters.category || undefined,
      entryType: filters.entryType || undefined,
    });
  }, [filters, fetchLedgerEntries]);

  const accountTotals = useMemo(() => {
    const opening = (ledgerAccounts || []).reduce((s, a) => s + Number(a.opening_balance ?? a.openingBalance ?? 0), 0);
    const closing = (ledgerAccounts || []).reduce((s, a) => s + Number(a.closing_balance ?? a.current_balance ?? a.currentBalance ?? 0), 0);
    return { opening, closing };
  }, [ledgerAccounts]);

  const onAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.accountName.trim()) return toast.error('Account name required');
    setSaving(true);
    const result = await createLedgerAccount({
      accountName: accountForm.accountName.trim(),
      openingBalance: Number(accountForm.openingBalance) || 0,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Account created');
      setAccountForm({ accountName: '', openingBalance: '0' });
    } else toast.error(result.error || 'Failed');
  };

  const onEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.ledgerAccountId) return toast.error('Select account');
    if (!entryForm.category) return toast.error('Select category');
    if (!Number(entryForm.amount)) return toast.error('Enter amount');
    setSaving(true);
    const result = await createLedgerEntry({
      ledgerAccountId: entryForm.ledgerAccountId,
      category: entryForm.category,
      subcategory: entryForm.subcategory.trim() || null,
      amount: Number(entryForm.amount),
      entryType: entryForm.entryType,
      description: entryForm.description.trim() || null,
      transactedDate: entryForm.transactedDate,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Entry recorded');
      setEntryForm((f) => ({ ...f, amount: '', description: '', subcategory: '' }));
    } else toast.error(result.error || 'Failed');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Ledger</h1>
        <p className="text-sm text-gray-500">Accounts, categories and entries</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-gray-500">Opening total</p>
          <p className="text-lg font-bold tabular-nums text-gray-900">{rs(accountTotals.opening)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-gray-500">Current total</p>
          <p className="text-lg font-bold tabular-nums text-cyan-800">{rs(accountTotals.closing)}</p>
        </div>
      </div>

      {canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form onSubmit={onAccount} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">New account</h2>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Account name *" value={accountForm.accountName} onChange={(e) => setAccountForm((f) => ({ ...f, accountName: e.target.value }))} />
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Opening balance" type="number" value={accountForm.openingBalance} onChange={(e) => setAccountForm((f) => ({ ...f, openingBalance: e.target.value }))} />
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">Create account</button>
          </form>

          <form onSubmit={onEntry} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">New entry</h2>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={entryForm.ledgerAccountId} onChange={(e) => setEntryForm((f) => ({ ...f, ledgerAccountId: e.target.value }))}>
              <option value="">Account *</option>
              {(ledgerAccounts || []).map((a) => <option key={a.id} value={a.id}>{a.account_name || a.accountName}</option>)}
            </select>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={entryForm.category} onChange={(e) => setEntryForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="">Category *</option>
              {(ledgerCategories || []).map((c) => <option key={c.id} value={c.category_name || c.categoryName}>{c.category_name || c.categoryName}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={entryForm.entryType} onChange={(e) => setEntryForm((f) => ({ ...f, entryType: e.target.value }))}>
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
              </select>
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Amount *" type="number" value={entryForm.amount} onChange={(e) => setEntryForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={entryForm.transactedDate} onChange={(e) => setEntryForm((f) => ({ ...f, transactedDate: e.target.value }))} />
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Description" value={entryForm.description} onChange={(e) => setEntryForm((f) => ({ ...f, description: e.target.value }))} />
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">Record entry</button>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2">
          <select className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white" value={filters.accountId} onChange={(e) => setFilters((f) => ({ ...f, accountId: e.target.value }))}>
            <option value="">All accounts</option>
            {(ledgerAccounts || []).map((a) => <option key={a.id} value={a.id}>{a.account_name || a.accountName}</option>)}
          </select>
          <select className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white" value={filters.entryType} onChange={(e) => setFilters((f) => ({ ...f, entryType: e.target.value }))}>
            <option value="">All types</option>
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
          </select>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Account</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(ledgerEntries || []).map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2">{String(e.transacted_date || e.transactedDate || '').slice(0, 10)}</td>
                <td className="px-4 py-2">{e.account_name || e.accountName || '—'}</td>
                <td className="px-4 py-2">{e.category}</td>
                <td className="px-4 py-2">{e.entry_type || e.entryType}</td>
                <td className="px-4 py-2 tabular-nums">{rs(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!(ledgerEntries || []).length && <p className="text-center text-gray-500 py-8 text-sm">No entries.</p>}
      </div>
    </div>
  );
};

export default HospitalManagementLedgerPage;
