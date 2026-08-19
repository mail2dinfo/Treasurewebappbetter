import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useUserContext } from '../../context/user_context';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';
import { useHhBasePath } from '../../components/hospitalManagement/hospitalManagementMenuItems';
import { useHhClinicalStream } from '../../components/hospitalManagement/useHhClinicalStream';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const toDate = (d) => d.toISOString().slice(0, 10);
const accountName = (account) => account?.name || account?.account_name || account?.accountName || '—';
const categoryName = (category) => category?.name || category?.category_name || category?.categoryName || '—';
const openingOf = (account) => Number(account?.opening_balance ?? account?.openingBalance ?? 0);
const closingOf = (account) => Number(
  account?.closing_balance ?? account?.current_balance ?? account?.currentBalance ?? 0
);

const pctChange = (opening, closing) => {
  if (!Number(opening)) return '—';
  return `${(((Number(closing) - Number(opening)) / Math.abs(Number(opening))) * 100).toFixed(2)}%`;
};

const balanceStatus = (opening, closing) => {
  if (closing > opening) return <span className="font-semibold text-green-700">Increased ↑</span>;
  if (closing < opening) return <span className="font-semibold text-red-700">Reduced ↓</span>;
  return <span className="font-semibold text-gray-500">No change</span>;
};

const emptyEntry = {
  ledgerAccountId: '',
  categoryId: '',
  amount: '',
  entryType: 'CREDIT',
  description: '',
  transactedDate: toDate(new Date()),
};
const PAGE_SIZE = 10;

const HospitalManagementLedgerPage = () => {
  const {
    ledgerAccounts,
    ledgerEntries,
    ledgerCategories,
    membershipId,
    fetchLedgerAccounts,
    fetchLedgerEntries,
    fetchLedgerCategories,
    createLedgerAccount,
    createLedgerEntry,
  } = useHospitalManagement();
  const { user } = useUserContext();
  const { can } = useHhPermission();
  const basePath = useHhBasePath();
  const canManage = can('hh_ledger_manage');
  const authToken = user?.results?.token || localStorage.getItem('token') || '';

  const [filters, setFilters] = useState({
    accountId: '',
    categoryId: '',
    entryType: '',
    startDate: '',
    endDate: '',
  });
  const [accountForm, setAccountForm] = useState({ accountName: '', openingBalance: '0' });
  const [entryForm, setEntryForm] = useState(emptyEntry);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const reloadLedger = useCallback((silentAccounts = false) => {
    const current = filtersRef.current;
    if (!silentAccounts) fetchLedgerCategories();
    fetchLedgerAccounts();
    fetchLedgerEntries({
      accountId: current.accountId || undefined,
      ledgerAccountId: current.accountId || undefined,
      categoryId: current.categoryId || undefined,
      entryType: current.entryType || undefined,
      startDate: current.startDate || undefined,
      endDate: current.endDate || undefined,
    });
  }, [fetchLedgerAccounts, fetchLedgerEntries, fetchLedgerCategories]);

  useEffect(() => {
    reloadLedger();
  }, [filters, reloadLedger]);

  useHhClinicalStream({
    enabled: Boolean(authToken && membershipId),
    streamPath: '/hh/opd/visits/stream',
    parentMembershipId: membershipId,
    token: authToken,
    onEvent: (event) => {
      const type = String(event?.type || '').toLowerCase();
      const action = String(event?.action || '').toLowerCase();
      if (action === 'connected') return;
      if (['ledger', 'pharmacy_order', 'receivable', 'receipt', 'bill'].includes(type) || String(event?.status || '').toUpperCase() === 'PAID') {
        reloadLedger(true);
      }
    },
  });

  useEffect(() => {
    const timer = setInterval(() => reloadLedger(true), 4000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') reloadLedger(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [reloadLedger]);

  const accounts = ledgerAccounts || [];
  const entries = ledgerEntries || [];
  const categories = ledgerCategories || [];

  const accountTotals = useMemo(() => {
    const opening = accounts.reduce((sum, account) => sum + openingOf(account), 0);
    const closing = accounts.reduce((sum, account) => sum + closingOf(account), 0);
    return { opening, closing, movement: closing - opening };
  }, [accounts]);

  const entryTotals = useMemo(() => {
    const credit = entries
      .filter((entry) => String(entry.entry_type || entry.entryType).toUpperCase() === 'CREDIT')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const debit = entries
      .filter((entry) => String(entry.entry_type || entry.entryType).toUpperCase() === 'DEBIT')
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    return { credit, debit, net: credit - debit };
  }, [entries]);
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pagedEntries = useMemo(
    () => entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [entries, page]
  );

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const onAccount = async (event) => {
    event.preventDefault();
    if (!accountForm.accountName.trim()) return toast.error('Account name required');
    setSaving(true);
    const result = await createLedgerAccount({
      name: accountForm.accountName.trim(),
      openingBalance: Number(accountForm.openingBalance) || 0,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Account created');
      setAccountForm({ accountName: '', openingBalance: '0' });
      setShowAccountForm(false);
    } else toast.error(result.error || 'Failed to create account');
  };

  const onEntry = async (event) => {
    event.preventDefault();
    if (!entryForm.ledgerAccountId) return toast.error('Select account');
    if (!entryForm.categoryId) return toast.error('Select category');
    if (!(Number(entryForm.amount) > 0)) return toast.error('Enter amount');
    setSaving(true);
    const result = await createLedgerEntry({
      ledgerAccountId: entryForm.ledgerAccountId,
      categoryId: entryForm.categoryId,
      amount: Number(entryForm.amount),
      entryType: entryForm.entryType,
      description: entryForm.description.trim() || null,
      transactedDate: entryForm.transactedDate,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Ledger entry recorded — closing balance updated');
      setEntryForm(emptyEntry);
      setShowEntryForm(false);
    } else toast.error(result.error || 'Failed to record entry');
  };

  const openEntryForm = () => {
    setEntryForm({
      ...emptyEntry,
      ledgerAccountId: filters.accountId || accounts[0]?.id || '',
      categoryId: filters.categoryId || categories[0]?.id || '',
    });
    setShowEntryForm(true);
  };

  const downloadCsv = () => {
    const rows = [
      ['Date', 'Account', 'Category', 'Type', 'Amount', 'Running Balance', 'Description'],
      ...entries.map((entry) => [
        entry.transacted_date || entry.transactedDate || '',
        entry.account_name || entry.accountName || '',
        entry.category_name || entry.categoryName || '',
        entry.entry_type || entry.entryType || '',
        entry.amount || 0,
        entry.running_balance ?? entry.runningBalance ?? '',
        `"${String(entry.description || '').replace(/"/g, '""')}"`,
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hospital-ledger.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hospital Ledger</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Account summary and every payment or expense entry, with complete opening and closing balances.
        </p>
      </div>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Account Summary</h2>
            <p className="text-xs text-gray-500">Closing balance = opening balance + credits − debits</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowAccountForm(true)}
              className="bg-cyan-700 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-800"
            >
              + Add Account
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Account Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5 text-right">Opening Balance</th>
                <th className="px-4 py-2.5 text-right">Closing Balance</th>
                <th className="px-4 py-2.5 text-right">Movement</th>
                <th className="px-4 py-2.5 text-right">% Change</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => {
                const opening = openingOf(account);
                const closing = closingOf(account);
                const movement = closing - opening;
                return (
                  <tr key={account.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                    <td className="px-4 py-2.5 font-semibold text-gray-900">{accountName(account)}</td>
                    <td className="px-4 py-2.5 text-gray-600">{account.account_type || account.accountType || '—'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{rs(opening)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-bold text-cyan-800">{rs(closing)}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${movement >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {movement >= 0 ? '+' : '−'}{rs(Math.abs(movement))}
                    </td>
                    <td className="px-4 py-2.5 text-right">{pctChange(opening, closing)}</td>
                    <td className="px-4 py-2.5">{balanceStatus(opening, closing)}</td>
                  </tr>
                );
              })}
              {!accounts.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No accounts yet. Add Cash, UPI or Bank with its opening balance.
                  </td>
                </tr>
              )}
            </tbody>
            {!!accounts.length && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <td className="px-4 py-2.5" colSpan={2}>Total</td>
                  <td className="px-4 py-2.5 text-right">{rs(accountTotals.opening)}</td>
                  <td className="px-4 py-2.5 text-right text-cyan-900">{rs(accountTotals.closing)}</td>
                  <td className={`px-4 py-2.5 text-right ${accountTotals.movement >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {accountTotals.movement >= 0 ? '+' : '−'}{rs(Math.abs(accountTotals.movement))}
                  </td>
                  <td className="px-4 py-2.5 text-right">{pctChange(accountTotals.opening, accountTotals.closing)}</td>
                  <td className="px-4 py-2.5">{balanceStatus(accountTotals.opening, accountTotals.closing)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-green-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Filtered Credits</p>
          <p className="text-xl font-bold text-green-700">{rs(entryTotals.credit)}</p>
        </div>
        <div className="bg-white border border-red-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Filtered Debits</p>
          <p className="text-xl font-bold text-red-700">{rs(entryTotals.debit)}</p>
        </div>
        <div className="bg-white border border-cyan-200 rounded-xl px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase text-gray-500">Filtered Net Movement</p>
          <p className={`text-xl font-bold ${entryTotals.net >= 0 ? 'text-cyan-800' : 'text-red-700'}`}>{rs(entryTotals.net)}</p>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Account Entries</h2>
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <button type="button" onClick={openEntryForm} className="bg-cyan-700 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-800">
                + Add Entry
              </button>
            )}
            <button type="button" onClick={downloadCsv} className="border border-gray-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">
              Download CSV
            </button>
            <Link to={`${basePath}/adminsettings`} className="border border-gray-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50">
              Manage Categories
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          <label className="text-xs">
            <span className="block text-gray-500 mb-1">Account</span>
            <select className="w-full border rounded-lg px-2 py-2 text-sm bg-white" value={filters.accountId} onChange={(e) => setFilters((current) => ({ ...current, accountId: e.target.value }))}>
              <option value="">All accounts</option>
              {accounts.map((account) => <option key={account.id} value={account.id}>{accountName(account)}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <span className="block text-gray-500 mb-1">Type</span>
            <select className="w-full border rounded-lg px-2 py-2 text-sm bg-white" value={filters.entryType} onChange={(e) => setFilters((current) => ({ ...current, entryType: e.target.value }))}>
              <option value="">All types</option>
              <option value="CREDIT">CREDIT</option>
              <option value="DEBIT">DEBIT</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="block text-gray-500 mb-1">Category</span>
            <select className="w-full border rounded-lg px-2 py-2 text-sm bg-white" value={filters.categoryId} onChange={(e) => setFilters((current) => ({ ...current, categoryId: e.target.value }))}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{categoryName(category)}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <span className="block text-gray-500 mb-1">From</span>
            <input type="date" className="w-full border rounded-lg px-2 py-2 text-sm" value={filters.startDate} onChange={(e) => setFilters((current) => ({ ...current, startDate: e.target.value }))} />
          </label>
          <label className="text-xs">
            <span className="block text-gray-500 mb-1">To</span>
            <input type="date" className="w-full border rounded-lg px-2 py-2 text-sm" value={filters.endDate} onChange={(e) => setFilters((current) => ({ ...current, endDate: e.target.value }))} />
          </label>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Account</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
                <th className="px-3 py-2.5 text-right">Running / Closing Balance</th>
                <th className="px-3 py-2.5">Description</th>
              </tr>
            </thead>
            <tbody>
              {pagedEntries.map((entry) => {
                const type = String(entry.entry_type || entry.entryType || '').toUpperCase();
                return (
                  <tr key={entry.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                    <td className="px-3 py-2.5 whitespace-nowrap">{String(entry.transacted_date || entry.transactedDate || '').slice(0, 10)}</td>
                    <td className="px-3 py-2.5 font-medium">{entry.account_name || entry.accountName || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                        {entry.category_name || entry.categoryName || '—'}
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 text-xs font-bold ${type === 'CREDIT' ? 'text-green-700' : 'text-red-700'}`}>{type}</td>
                    <td className={`px-3 py-2.5 text-right font-semibold ${type === 'CREDIT' ? 'text-green-700' : 'text-red-700'}`}>
                      {type === 'CREDIT' ? '+' : '−'}{rs(entry.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-cyan-900">{rs(entry.running_balance ?? entry.runningBalance)}</td>
                    <td className="px-3 py-2.5 text-gray-600">{entry.description || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!entries.length && <p className="p-8 text-center text-gray-500">No ledger entries match these filters.</p>}
        {!!entries.length && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-gray-600">
                Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
                <strong>{Math.min(page * PAGE_SIZE, entries.length)}</strong> of <strong>{entries.length}</strong>
              </span>
              <span>Credit: <strong className="text-green-700">{rs(entryTotals.credit)}</strong></span>
              <span>Debit: <strong className="text-red-700">{rs(entryTotals.debit)}</strong></span>
              <span>Net total: <strong className={entryTotals.net >= 0 ? 'text-cyan-800' : 'text-red-700'}>{rs(entryTotals.net)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-gray-600">Page {page} of {pageCount}</span>
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {showAccountForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={onAccount} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Add ledger account</h3>
            <label className="block text-sm">
              <span className="text-gray-600">Account name *</span>
              <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Cash / UPI / Bank" value={accountForm.accountName} onChange={(e) => setAccountForm((current) => ({ ...current, accountName: e.target.value }))} required />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Opening balance</span>
              <input type="number" step="0.01" className="mt-1 w-full border rounded-lg px-3 py-2" value={accountForm.openingBalance} onChange={(e) => setAccountForm((current) => ({ ...current, openingBalance: e.target.value }))} />
            </label>
            <p className="text-xs text-gray-500">Opening balance is the starting amount. New entries update the closing balance.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAccountForm(false)} className="px-3 py-2 border rounded-lg">Cancel</button>
              <button type="submit" disabled={saving} className="px-3 py-2 bg-cyan-700 text-white rounded-lg font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Save account'}</button>
            </div>
          </form>
        </div>
      )}

      {showEntryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={onEntry} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Add account entry</h3>
            <label className="block text-sm">
              <span className="text-gray-600">Account *</span>
              <select className="mt-1 w-full border rounded-lg px-3 py-2 bg-white" value={entryForm.ledgerAccountId} onChange={(e) => setEntryForm((current) => ({ ...current, ledgerAccountId: e.target.value }))} required>
                <option value="">Select account</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{accountName(account)} · closing {rs(closingOf(account))}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                <span className="text-gray-600">Entry type *</span>
                <select
                  className={`mt-1 w-full border rounded-lg px-3 py-2 bg-white font-semibold ${
                    entryForm.entryType === 'CREDIT'
                      ? 'border-green-300 text-green-700 bg-green-50'
                      : 'border-red-300 text-red-700 bg-red-50'
                  }`}
                  value={entryForm.entryType}
                  onChange={(e) => setEntryForm((current) => ({ ...current, entryType: e.target.value }))}
                >
                  <option value="CREDIT" className="text-green-700 bg-white">CREDIT (money in)</option>
                  <option value="DEBIT" className="text-red-700 bg-white">DEBIT (money out)</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Amount *</span>
                <input type="number" min="0.01" step="0.01" className="mt-1 w-full border rounded-lg px-3 py-2" value={entryForm.amount} onChange={(e) => setEntryForm((current) => ({ ...current, amount: e.target.value }))} required />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                <span className="text-gray-600">Category *</span>
                <select className="mt-1 w-full border rounded-lg px-3 py-2 bg-white" value={entryForm.categoryId} onChange={(e) => setEntryForm((current) => ({ ...current, categoryId: e.target.value }))} required>
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{categoryName(category)}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Date *</span>
                <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2" value={entryForm.transactedDate} onChange={(e) => setEntryForm((current) => ({ ...current, transactedDate: e.target.value }))} required />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-gray-600">Description</span>
              <textarea className="mt-1 w-full border rounded-lg px-3 py-2" rows={3} value={entryForm.description} onChange={(e) => setEntryForm((current) => ({ ...current, description: e.target.value }))} />
            </label>
            {!categories.length && (
              <p className="text-xs text-amber-700">
                Add a category first in <Link to={`${basePath}/adminsettings`} className="font-semibold underline">Admin settings</Link>.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowEntryForm(false)} className="px-3 py-2 border rounded-lg">Cancel</button>
              <button type="submit" disabled={saving} className="px-3 py-2 bg-cyan-700 text-white rounded-lg font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Record entry'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default HospitalManagementLedgerPage;
