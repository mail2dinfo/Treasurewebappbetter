import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiArrowDown, FiArrowUp, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { GoArrowBoth } from 'react-icons/go';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const pctChange = (opening, current) => {
  if (!Number(opening)) return '—';
  return `${(((Number(current) - Number(opening)) / Number(opening)) * 100).toFixed(2)}%`;
};

const statusLabel = (opening, current) => {
  const o = Number(opening) || 0;
  const c = Number(current) || 0;
  if (c > o) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-green-700">
        Profit <FiArrowUp />
      </span>
    );
  }
  if (c < o) {
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-red-700">
        Loss <FiArrowDown />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-gray-500">
      Break-even <GoArrowBoth />
    </span>
  );
};

const emptyEntryForm = {
  ledgerAccountId: '',
  amount: '',
  entryType: 'CREDIT',
  category: 'Manual',
  description: '',
  transactedDate: new Date().toISOString().slice(0, 10),
};

const HostelManagementLedgerPage = () => {
  const {
    ledgerAccounts,
    ledgerEntries,
    ledgerCategories,
    fetchLedgerAccounts,
    fetchLedgerEntries,
    fetchLedgerCategories,
    createLedgerAccount,
    updateLedgerAccount,
    deleteLedgerAccount,
    createLedgerEntry,
    deleteLedgerEntry,
  } = useHostelManagement();
  const { can } = useHmPermission();
  const canCreate = can('hm_ledger_create') || can('hm_ledger_manage');
  const canDelete = can('hm_ledger_delete') || can('hm_ledger_manage');

  const [filters, setFilters] = useState({
    accountId: '',
    entryType: '',
    category: '',
    startDate: '',
    endDate: '',
  });
  const [accountForm, setAccountForm] = useState({ accountName: '', openingBalance: '0' });
  const [editingAccount, setEditingAccount] = useState(null);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [entryForm, setEntryForm] = useState(emptyEntryForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'account'|'entry', item }

  useEffect(() => {
    fetchLedgerAccounts();
    fetchLedgerCategories();
  }, []);

  useEffect(() => {
    fetchLedgerEntries({
      accountId: filters.accountId || undefined,
      entryType: filters.entryType || undefined,
      category: filters.category || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    });
  }, [filters]);

  const accounts = ledgerAccounts || [];
  const entries = ledgerEntries || [];

  const totals = useMemo(() => {
    const credit = entries.filter((e) => e.entry_type === 'CREDIT').reduce((s, e) => s + Number(e.amount || 0), 0);
    const debit = entries.filter((e) => e.entry_type === 'DEBIT').reduce((s, e) => s + Number(e.amount || 0), 0);
    return { credit, debit, net: credit - debit };
  }, [entries]);

  const summaryTotals = useMemo(() => ({
    opening: accounts.reduce((s, a) => s + Number(a.opening_balance || 0), 0),
    current: accounts.reduce((s, a) => s + Number(a.current_balance || 0), 0),
  }), [accounts]);

  const filterCategoryOptions = useMemo(() => {
    const set = new Set([
      ...(ledgerCategories || []).map((c) => c.category_name).filter(Boolean),
      ...(entries || []).map((e) => e.category).filter(Boolean),
    ]);
    return [...set].sort();
  }, [ledgerCategories, entries]);

  const entryCategoryOptions = useMemo(() => {
    const names = (ledgerCategories || []).map((c) => c.category_name).filter(Boolean);
    return names.length ? names : ['Manual', 'Rent', 'Food', 'Expense', 'Other'];
  }, [ledgerCategories]);

  const openCreateAccount = () => {
    setEditingAccount(null);
    setAccountForm({ accountName: '', openingBalance: '0' });
    setShowAccountForm(true);
  };

  const openEditAccount = (acc) => {
    setEditingAccount(acc);
    setAccountForm({
      accountName: acc.account_name || '',
      openingBalance: String(acc.opening_balance ?? 0),
    });
    setShowAccountForm(true);
  };

  const saveAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.accountName.trim()) return toast.error('Account name required');
    setSaving(true);
    try {
      let result;
      if (editingAccount) {
        result = await updateLedgerAccount(editingAccount.id, {
          accountName: accountForm.accountName.trim(),
          openingBalance: Number(accountForm.openingBalance) || 0,
        });
      } else {
        result = await createLedgerAccount({
          accountName: accountForm.accountName.trim(),
          openingBalance: Number(accountForm.openingBalance) || 0,
        });
      }
      if (result.success) {
        toast.success(editingAccount ? 'Account updated' : 'Account created');
        setShowAccountForm(false);
        setEditingAccount(null);
      } else toast.error(result.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const removeAccount = (acc) => {
    if (!canDelete) return toast.error('Delete permission required');
    setDeleteConfirm({ type: 'account', item: acc });
  };

  const reloadEntries = () => fetchLedgerEntries({
    accountId: filters.accountId || undefined,
    entryType: filters.entryType || undefined,
    category: filters.category || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
  });

  const removeEntry = (entry) => {
    if (!canDelete) return toast.error('Delete permission required');
    setDeleteConfirm({ type: 'entry', item: entry });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      if (deleteConfirm.type === 'account') {
        const result = await deleteLedgerAccount(deleteConfirm.item.id);
        if (result.success) toast.success('Account deleted');
        else toast.error(result.error || 'Cannot delete (may have entries)');
      } else {
        const result = await deleteLedgerEntry(deleteConfirm.item.id);
        if (result.success) {
          toast.success('Entry deleted — balance updated');
          reloadEntries();
        } else toast.error(result.error || 'Could not delete entry');
      }
      setDeleteConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  const saveEntry = async (e) => {
    e.preventDefault();
    if (!entryForm.ledgerAccountId) return toast.error('Select account');
    if (!entryForm.amount || Number(entryForm.amount) <= 0) return toast.error('Enter amount');
    setSaving(true);
    try {
      const result = await createLedgerEntry({
        ledgerAccountId: entryForm.ledgerAccountId,
        amount: Number(entryForm.amount),
        entryType: entryForm.entryType,
        category: entryForm.category || 'Manual',
        description: entryForm.description.trim() || null,
        transactedDate: entryForm.transactedDate,
      });
      if (result.success) {
        toast.success('Entry added');
        setShowEntryForm(false);
        setEntryForm(emptyEntryForm);
        reloadEntries();
      } else toast.error(result.error || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const downloadCsv = () => {
    const headers = ['Date', 'Account', 'Resident', 'Category', 'Type', 'Amount', 'Description'];
    const rows = entries.map((e) => [
      e.transacted_date ?? '',
      e.account_name ?? '',
      e.resident_name ?? '',
      e.category ?? '',
      e.entry_type ?? '',
      e.amount ?? '',
      `"${String(e.description || '').replace(/"/g, '""')}"`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hostel-ledger.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hostel Ledger</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Account summary and every cash movement — rent collections, food / special orders, refunds and manual entries.
        </p>
      </div>

      {/* Account Summary — Chit Fund style */}
      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900">Account Summary</h2>
          {canCreate && (
            <button
              type="button"
              onClick={openCreateAccount}
              className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
            >
              + Add Account
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Account Name</th>
                <th className="px-4 py-2.5 text-right">Opening Balance</th>
                <th className="px-4 py-2.5 text-right">Current Balance</th>
                <th className="px-4 py-2.5 text-right">Diff</th>
                <th className="px-4 py-2.5 text-right">% Change</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => {
                const opening = Number(acc.opening_balance) || 0;
                const current = Number(acc.current_balance) || 0;
                const diff = Math.abs(current - opening);
                return (
                  <tr key={acc.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                    <td className="px-4 py-2.5 font-semibold text-gray-900">{acc.account_name}</td>
                    <td className="px-4 py-2.5 text-right">{rs(opening)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-green-700">{rs(current)}</td>
                    <td className="px-4 py-2.5 text-right">{rs(diff)}</td>
                    <td className="px-4 py-2.5 text-right">{pctChange(opening, current)}</td>
                    <td className="px-4 py-2.5">{statusLabel(opening, current)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="inline-flex gap-1.5">
                        {canCreate && (
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => openEditAccount(acc)}
                            className="p-1.5 border rounded-md hover:bg-gray-100"
                          >
                            <FiEdit2 />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => removeAccount(acc)}
                            className="p-1.5 border rounded-md hover:bg-red-50 text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No ledger accounts yet. Add Cash / PhonePe / Bank to start logging payments.
                  </td>
                </tr>
              )}
            </tbody>
            {accounts.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                  <td className="px-4 py-2.5">Total</td>
                  <td className="px-4 py-2.5 text-right">{rs(summaryTotals.opening)}</td>
                  <td className="px-4 py-2.5 text-right text-green-800">{rs(summaryTotals.current)}</td>
                  <td className="px-4 py-2.5 text-right">{rs(Math.abs(summaryTotals.current - summaryTotals.opening))}</td>
                  <td className="px-4 py-2.5 text-right">—</td>
                  <td className="px-4 py-2.5">—</td>
                  <td className="px-4 py-2.5">—</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Filters + actions */}
      <section className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">Transactions</h2>
          <div className="flex flex-wrap gap-2">
            {canCreate && (
              <button
                type="button"
                onClick={() => {
                  const defaultCat = entryCategoryOptions.includes('Manual')
                    ? 'Manual'
                    : (entryCategoryOptions[0] || 'Manual');
                  setEntryForm({
                    ...emptyEntryForm,
                    ledgerAccountId: filters.accountId || accounts[0]?.id || '',
                    category: defaultCat,
                  });
                  setShowEntryForm(true);
                }}
                className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
              >
                + Add Entry
              </button>
            )}
            <button
              type="button"
              onClick={downloadCsv}
              className="border border-gray-300 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
            >
              Download CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <label className="text-xs">
            <span className="block text-gray-500 mb-1">Account</span>
            <select
              className="w-full border rounded-lg px-2 py-2 text-sm"
              value={filters.accountId}
              onChange={(e) => setFilters((f) => ({ ...f, accountId: e.target.value }))}
            >
              <option value="">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.account_name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="block text-gray-500 mb-1">Type</span>
            <select
              className="w-full border rounded-lg px-2 py-2 text-sm"
              value={filters.entryType}
              onChange={(e) => setFilters((f) => ({ ...f, entryType: e.target.value }))}
            >
              <option value="">All</option>
              <option value="CREDIT">CREDIT</option>
              <option value="DEBIT">DEBIT</option>
            </select>
          </label>
          <label className="text-xs">
            <span className="block text-gray-500 mb-1">Category</span>
            <select
              className="w-full border rounded-lg px-2 py-2 text-sm"
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">All</option>
              {filterCategoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="block text-gray-500 mb-1">From</span>
            <input
              type="date"
              className="w-full border rounded-lg px-2 py-2 text-sm"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
            />
          </label>
          <label className="text-xs">
            <span className="block text-gray-500 mb-1">To</span>
            <input
              type="date"
              className="w-full border rounded-lg px-2 py-2 text-sm"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <span>Credit: <strong className="text-green-700">{rs(totals.credit)}</strong></span>
          <span>Debit: <strong className="text-red-700">{rs(totals.debit)}</strong></span>
          <span>Net: <strong className="text-gray-900">{rs(totals.net)}</strong></span>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Resident</th>
                <th className="px-3 py-2.5">Account</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Type</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
                <th className="px-3 py-2.5">Details</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-gray-100 align-top hover:bg-gray-50/70">
                  <td className="px-3 py-2.5 whitespace-nowrap">{e.transacted_date}</td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-gray-900">{e.resident_name || '—'}</p>
                    {e.resident_phone && <p className="text-xs text-gray-500">{e.resident_phone}</p>}
                    {e.month_label && <p className="text-xs text-gray-500">{e.month_label}</p>}
                  </td>
                  <td className="px-3 py-2.5">{e.account_name || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      e.category === 'Food' || e.category === 'Food Refund'
                        ? 'bg-amber-50 text-amber-800'
                        : e.category === 'Rent'
                          ? 'bg-blue-50 text-blue-800'
                          : e.category === 'Security Deposit' || e.category === 'Security Deposit Refund'
                            ? 'bg-indigo-50 text-indigo-800'
                            : 'bg-gray-100 text-gray-700'
                    }`}
                    >
                      {e.category || '—'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`text-xs font-bold ${e.entry_type === 'CREDIT' ? 'text-green-700' : 'text-red-700'}`}>
                      {e.entry_type}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 text-right font-semibold ${e.entry_type === 'CREDIT' ? 'text-green-700' : 'text-red-700'}`}>
                    {rs(e.amount)}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-600 max-w-sm">
                    {e.bill_number && <p className="font-medium text-gray-800">Bill {e.bill_number}</p>}
                    {e.payment_method && <p>{e.payment_method}</p>}
                    <p className="text-gray-500">{e.description}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {canDelete ? (
                      <button
                        type="button"
                        title="Delete entry (adjusts balance)"
                        onClick={() => removeEntry(e)}
                        className="p-1.5 border rounded-md hover:bg-red-50 text-red-700"
                      >
                        <FiTrash2 />
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length === 0 && (
          <p className="p-6 text-center text-gray-500">No ledger entries yet. Collect rent or place a food order to see transactions here.</p>
        )}
      </section>

      {showAccountForm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={saveAccount} className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
            <h3 className="text-lg font-semibold">{editingAccount ? 'Update account' : 'Add account'}</h3>
            <label className="block text-sm">
              <span className="text-gray-600">Account name</span>
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={accountForm.accountName}
                onChange={(e) => setAccountForm((f) => ({ ...f, accountName: e.target.value }))}
                placeholder="CASH / PHONEPE / BANK"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-gray-600">Opening balance</span>
              <input
                type="number"
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={accountForm.openingBalance}
                onChange={(e) => setAccountForm((f) => ({ ...f, openingBalance: e.target.value }))}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-3 py-2 border rounded-lg" onClick={() => setShowAccountForm(false)}>Cancel</button>
              <button type="submit" disabled={saving} className="px-3 py-2 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEntryForm && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={saveEntry} className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-3">
            <h3 className="text-lg font-semibold">Add ledger entry</h3>
            <label className="block text-sm">
              <span className="text-gray-600">Account</span>
              <select
                className="mt-1 w-full border rounded-lg px-3 py-2"
                value={entryForm.ledgerAccountId}
                onChange={(e) => setEntryForm((f) => ({ ...f, ledgerAccountId: e.target.value }))}
                required
              >
                <option value="">Select</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.account_name}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                <span className="text-gray-600">Type</span>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={entryForm.entryType}
                  onChange={(e) => setEntryForm((f) => ({ ...f, entryType: e.target.value }))}
                >
                  <option value="CREDIT">CREDIT (in)</option>
                  <option value="DEBIT">DEBIT (out)</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Amount</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={entryForm.amount}
                  onChange={(e) => setEntryForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                <span className="text-gray-600">Category</span>
                <select
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={entryForm.category}
                  onChange={(e) => setEntryForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {entryCategoryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-gray-600">Date</span>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  value={entryForm.transactedDate}
                  onChange={(e) => setEntryForm((f) => ({ ...f, transactedDate: e.target.value }))}
                />
              </label>
            </div>
            <label className="block text-sm">
              <span className="text-gray-600">Description</span>
              <textarea
                className="mt-1 w-full border rounded-lg px-3 py-2"
                rows={2}
                value={entryForm.description}
                onChange={(e) => setEntryForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-3 py-2 border rounded-lg" onClick={() => setShowEntryForm(false)}>Cancel</button>
              <button type="submit" disabled={saving} className="px-3 py-2 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-60">
                {saving ? 'Saving…' : 'Add entry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Confirm delete</h3>
            {deleteConfirm.type === 'account' ? (
              <p className="text-sm text-gray-600">
                Delete account <strong>{deleteConfirm.item.account_name}</strong>?
                This cannot be undone.
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Delete this <strong>{deleteConfirm.item.entry_type}</strong> of{' '}
                <strong>{rs(deleteConfirm.item.amount)}</strong>
                {deleteConfirm.item.category ? ` (${deleteConfirm.item.category})` : ''}?
                Account balance will be adjusted to the latest position.
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="px-3 py-2 border rounded-lg text-sm font-semibold"
                onClick={() => setDeleteConfirm(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-60"
                onClick={confirmDelete}
                disabled={saving}
              >
                {saving ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostelManagementLedgerPage;
