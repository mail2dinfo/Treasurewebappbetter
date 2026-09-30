import React, { useEffect, useMemo, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FiEdit2, FiTrash2, FiArrowUp, FiArrowDown, FiDownload, FiPlus } from 'react-icons/fi';
import { GoArrowBoth } from 'react-icons/go';
import { toast } from 'react-toastify';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';
import { useUserContext } from '../../context/user_context';
import Mypdf from '../../components/PDF/Mypdf';
import FilterBar from '../../components/FilterBar';
import '../../style/FilterBar.css';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const todayIso = () => new Date().toISOString().slice(0, 10);
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const DeepavaliLedgerPage = () => {
    const { user } = useUserContext();
    const {
        company,
        accounts,
        entries,
        categories,
        saveAccount,
        deleteAccount,
        saveEntry,
        fetchEntries,
        loading,
    } = useDeepavali();
    const [showForm, setShowForm] = useState(false);
    const [showEntryForm, setShowEntryForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [accountName, setAccountName] = useState('');
    const [openingBalance, setOpeningBalance] = useState('');
    const [filterAccountId, setFilterAccountId] = useState('');
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        category: '',
        entryType: '',
    });
    const [entryForm, setEntryForm] = useState({
        ledger_account_id: '',
        transaction_date: todayIso(),
        entry_type: 'CREDIT',
        category: '',
        amount: '',
        narration: '',
    });

    useEffect(() => {
        fetchEntries({
            ...filters,
            ledger_account_id: filterAccountId || undefined,
        }).catch((err) => toast.error(err.message || 'Could not load entries'));
    }, [filters, filterAccountId, fetchEntries]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, filterAccountId, pageSize]);

    const pagination = useMemo(() => {
        const totalItems = (entries || []).length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
        const safePage = Math.min(currentPage, totalPages);
        const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);
        return {
            totalItems,
            totalPages,
            safePage,
            startIndex,
            endIndex,
            pageItems: (entries || []).slice(startIndex, endIndex),
        };
    }, [entries, currentPage, pageSize]);

    const openAdd = () => {
        setEditing(null);
        setAccountName('');
        setOpeningBalance('');
        setShowForm(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setAccountName(row.account_name || '');
        setOpeningBalance('');
        setShowForm(true);
    };

    const saveAcc = async (e) => {
        e.preventDefault();
        if (!accountName.trim()) {
            toast.error('Please enter account name.');
            return;
        }
        if (!editing && openingBalance === '') {
            toast.error('Please enter opening balance.');
            return;
        }
        setSaving(true);
        try {
            await saveAccount({
                id: editing?.id,
                account_name: accountName.trim(),
                opening_balance: editing ? undefined : Number(openingBalance || 0),
            });
            toast.success(editing ? 'Account updated' : 'Account added');
            setShowForm(false);
            setEditing(null);
            setAccountName('');
            setOpeningBalance('');
        } catch (err) {
            toast.error(err.message || 'Could not save account');
        } finally {
            setSaving(false);
        }
    };

    const removeAccount = async (row) => {
        if (!window.confirm(`Delete account "${row.account_name}"?`)) return;
        try {
            await deleteAccount(row.id);
            toast.success('Account deleted');
        } catch (err) {
            toast.error(err.message || 'Unable to delete account.');
        }
    };

    const submitEntry = async (e) => {
        e.preventDefault();
        if (!entryForm.ledger_account_id) {
            toast.error('Select an account');
            return;
        }
        if (!Number(entryForm.amount)) {
            toast.error('Enter amount');
            return;
        }
        setSaving(true);
        try {
            await saveEntry({
                ledger_account_id: entryForm.ledger_account_id,
                transaction_date: entryForm.transaction_date,
                entry_type: entryForm.entry_type,
                amount: Number(entryForm.amount),
                category: entryForm.category || undefined,
                narration: entryForm.narration.trim(),
            });
            toast.success('Entry added');
            setShowEntryForm(false);
            setEntryForm({
                ledger_account_id: '',
                transaction_date: todayIso(),
                entry_type: 'CREDIT',
                category: '',
                amount: '',
                narration: '',
            });
            await fetchEntries({
                ...filters,
                ledger_account_id: filterAccountId || undefined,
            });
        } catch (err) {
            toast.error(err.message || 'Could not add entry');
        } finally {
            setSaving(false);
        }
    };

    const statusFor = (opening, current) => {
        const open = Number(opening) || 0;
        const curr = Number(current) || 0;
        if (curr > open) return <span className="inline-flex items-center gap-1 text-green-700 text-xs">Profit <FiArrowUp /></span>;
        if (curr < open) return <span className="inline-flex items-center gap-1 text-red-700 text-xs">Loss <FiArrowDown /></span>;
        return <span className="inline-flex items-center gap-1 text-gray-500 text-xs">Break-even <GoArrowBoth /></span>;
    };

    const accountNameOf = (row) => row.account?.account_name
        || accounts.find((acc) => acc.id === row.ledger_account_id)?.account_name
        || '—';

    const categoryNameOf = (row) => row.account?.category?.category_name
        || accounts.find((acc) => acc.id === row.ledger_account_id)?.category?.category_name
        || '';

    const formatPdfDate = (value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value || '').slice(0, 10);
        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    };

    const pdfHeaders = [
        { title: 'Date', value: 'date' },
        { title: 'Account', value: 'account' },
        { title: 'Category', value: 'category' },
        { title: 'CR Amount', value: 'credit' },
        { title: 'DB Amount', value: 'debit' },
        { title: 'Description', value: 'description' },
    ];

    const pdfRows = useMemo(() => {
        const rows = (entries || []).map((entry) => ({
            date: formatPdfDate(entry.transaction_date),
            account: accountNameOf(entry),
            category: categoryNameOf(entry),
            credit: Number(entry.credit_amount) ? Number(entry.credit_amount).toLocaleString('en-IN') : '',
            debit: Number(entry.debit_amount) ? Number(entry.debit_amount).toLocaleString('en-IN') : '',
            description: entry.narration || '',
        }));
        if (rows.length) {
            const totalCredit = (entries || []).reduce((sum, entry) => sum + Number(entry.credit_amount || 0), 0);
            const totalDebit = (entries || []).reduce((sum, entry) => sum + Number(entry.debit_amount || 0), 0);
            rows.push({
                date: 'TOTAL',
                account: '',
                category: `${entries.length} entries`,
                credit: totalCredit.toLocaleString('en-IN'),
                debit: totalDebit.toLocaleString('en-IN'),
                description: '',
            });
        }
        return rows;
    }, [entries, accounts]);

    const pdfCompany = useMemo(() => {
        const fromUser = user?.results?.userCompany;
        if (Array.isArray(fromUser) && fromUser[0]) return fromUser;
        return [{
            name: company?.company_name || 'Deepavali Chits',
            street_address: company?.address || '',
            phone: company?.phone || '',
            email: company?.email || '',
            registration_no: company?.gst_details || '',
            logo_base64format: company?.company_logo || '',
        }];
    }, [company, user]);

    const totalOpening = accounts.reduce((sum, acc) => sum + Number(acc.opening_balance || 0), 0);
    const totalCurrent = accounts.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0);

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Ledger accounts</h1>
                </div>
                <button type="button" onClick={openAdd} className="rounded-lg bg-orange-700 text-white px-3 py-2 text-sm whitespace-nowrap">
                    + Add account
                </button>
            </div>

            {showForm && (
                <div
                    className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
                    onClick={() => { if (!saving) { setShowForm(false); setEditing(null); } }}
                >
                    <form
                        onSubmit={saveAcc}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Update account' : 'Add new account'}</h2>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1"
                                onClick={() => { if (!saving) { setShowForm(false); setEditing(null); } }}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <label className="block text-sm font-medium text-gray-700">
                            Account name
                            <input
                                placeholder="e.g. CASH, PHONEPE, BANK"
                                value={accountName}
                                onChange={(e) => setAccountName(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                                autoFocus
                                required
                            />
                        </label>
                        {!editing && (
                            <label className="block text-sm font-medium text-gray-700">
                                Opening balance
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                                    required
                                />
                            </label>
                        )}
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditing(null); }}
                                disabled={saving}
                                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-gray-700"
                            >
                                Cancel
                            </button>
                            <button type="submit" disabled={saving || loading} className="flex-1 rounded-lg bg-orange-700 text-white py-2.5">
                                {saving ? 'Saving…' : editing ? 'Update' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {showEntryForm && (
                <div
                    className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
                    onClick={() => { if (!saving) setShowEntryForm(false); }}
                >
                    <form
                        onSubmit={submitEntry}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-semibold text-gray-900">Add entry</h2>
                            <button
                                type="button"
                                className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1"
                                onClick={() => { if (!saving) setShowEntryForm(false); }}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>
                        <label className="block text-sm font-medium text-gray-700">
                            Date
                            <input
                                type="date"
                                value={entryForm.transaction_date}
                                onChange={(e) => setEntryForm((f) => ({ ...f, transaction_date: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                                required
                            />
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Account
                            <select
                                value={entryForm.ledger_account_id}
                                onChange={(e) => setEntryForm((f) => ({ ...f, ledger_account_id: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 bg-white"
                                required
                            >
                                <option value="">Select account</option>
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.account_name} ({money(acc.current_balance)})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Category
                            <select
                                value={entryForm.category}
                                onChange={(e) => setEntryForm((f) => ({ ...f, category: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 bg-white"
                            >
                                <option value="">Optional</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.category_name}>{cat.category_name}</option>
                                ))}
                            </select>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setEntryForm((f) => ({ ...f, entry_type: 'CREDIT' }))}
                                className={`rounded-lg border-2 py-2 text-sm font-semibold ${
                                    entryForm.entry_type === 'CREDIT'
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                                        : 'border-gray-200 text-gray-600'
                                }`}
                            >
                                CREDIT
                            </button>
                            <button
                                type="button"
                                onClick={() => setEntryForm((f) => ({ ...f, entry_type: 'DEBIT' }))}
                                className={`rounded-lg border-2 py-2 text-sm font-semibold ${
                                    entryForm.entry_type === 'DEBIT'
                                        ? 'border-red-600 bg-red-50 text-red-800'
                                        : 'border-gray-200 text-gray-600'
                                }`}
                            >
                                DEBIT
                            </button>
                        </div>
                        <label className="block text-sm font-medium text-gray-700">
                            Amount
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={entryForm.amount}
                                onChange={(e) => setEntryForm((f) => ({ ...f, amount: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                                required
                            />
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Description
                            <input
                                value={entryForm.narration}
                                onChange={(e) => setEntryForm((f) => ({ ...f, narration: e.target.value }))}
                                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                                placeholder="Narration"
                            />
                        </label>
                        <div className="flex gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => setShowEntryForm(false)}
                                disabled={saving}
                                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-gray-700"
                            >
                                Cancel
                            </button>
                            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-orange-700 text-white py-2.5">
                                {saving ? 'Saving…' : 'Save entry'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!accounts.length && !loading && (
                <p className="rounded-2xl border border-dashed border-orange-200 bg-white p-4 text-sm text-gray-500">
                    No accounts yet. Add Cash, UPI, or Bank with an opening balance.
                </p>
            )}

            {accounts.length > 0 && (
                <div className="rounded-2xl border border-orange-100 bg-white overflow-hidden shadow-sm">
                    <div className="hidden sm:grid grid-cols-6 gap-2 px-4 py-2 text-xs font-medium text-gray-500 bg-orange-50">
                        <span>Account name</span>
                        <span>Opening</span>
                        <span>Current</span>
                        <span>Diff</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>
                    {accounts.map((acc) => (
                        <div
                            key={acc.id}
                            className={`grid grid-cols-2 sm:grid-cols-6 gap-2 px-4 py-3 border-t border-gray-100 text-sm items-center ${filterAccountId === acc.id ? 'bg-orange-50' : ''}`}
                        >
                            <button
                                type="button"
                                className="font-medium text-gray-900 text-left"
                                onClick={() => setFilterAccountId(filterAccountId === acc.id ? '' : acc.id)}
                            >
                                {acc.account_name}
                            </button>
                            <span>{money(acc.opening_balance)}</span>
                            <span>{money(acc.current_balance)}</span>
                            <span>{money(Math.abs(Number(acc.opening_balance || 0) - Number(acc.current_balance || 0)))}</span>
                            <span>{statusFor(acc.opening_balance, acc.current_balance)}</span>
                            <span className="flex gap-2">
                                <button type="button" onClick={() => openEdit(acc)} className="text-orange-700" title="Update account"><FiEdit2 /></button>
                                <button type="button" onClick={() => removeAccount(acc)} className="text-red-600" title="Delete account"><FiTrash2 /></button>
                            </span>
                        </div>
                    ))}
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 px-4 py-3 border-t border-orange-100 text-sm font-semibold bg-orange-50">
                        <span>Total</span>
                        <span>{money(totalOpening)}</span>
                        <span>{money(totalCurrent)}</span>
                        <span>{money(Math.abs(totalOpening - totalCurrent))}</span>
                        <span>—</span>
                        <span>—</span>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-start justify-between gap-3 pt-2">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Ledger entries</h2>
                    {filterAccountId && (
                        <p className="text-xs text-gray-500 mt-1">
                            Showing {accounts.find((acc) => acc.id === filterAccountId)?.account_name || 'account'}
                            {' · '}
                            <button type="button" className="text-orange-700" onClick={() => setFilterAccountId('')}>Show all</button>
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setShowEntryForm(true)}
                        className="inline-flex items-center gap-1 rounded-lg bg-orange-700 text-white px-3 py-2 text-sm"
                    >
                        <FiPlus /> Add entry
                    </button>
                    {pdfRows.length > 0 && (
                        <PDFDownloadLink
                            document={
                                <Mypdf
                                    tableData={pdfRows}
                                    tableHeaders={pdfHeaders}
                                    heading="Ledger Entries"
                                    companyData={pdfCompany}
                                />
                            }
                            fileName={`Deepavali_Ledger_${todayIso()}.pdf`}
                        >
                            {({ loading: pdfLoading }) => (
                                <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                                    <FiDownload /> {pdfLoading ? 'Preparing PDF…' : 'PDF'}
                                </button>
                            )}
                        </PDFDownloadLink>
                    )}
                </div>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-white p-3 shadow-sm">
                <FilterBar
                    filters={filters}
                    setFilters={setFilters}
                    categories={categories}
                />
            </div>

            <div className="rounded-2xl border border-orange-100 bg-white overflow-hidden shadow-sm">
                <div className="hidden sm:grid grid-cols-6 gap-2 px-4 py-2 text-xs font-medium text-gray-500 bg-orange-50">
                    <span>Date</span>
                    <span>Account</span>
                    <span>Category</span>
                    <span>Debit</span>
                    <span>Credit</span>
                    <span>Narration</span>
                </div>
                {pagination.pageItems.map((row) => (
                    <div key={row.id} className="grid grid-cols-1 sm:grid-cols-6 gap-1 sm:gap-2 px-4 py-3 border-t border-gray-100 text-sm">
                        <span>{String(row.transaction_date || '').slice(0, 10)}</span>
                        <span className="font-medium text-gray-900">{accountNameOf(row)}</span>
                        <span className="text-gray-600">{categoryNameOf(row) || '—'}</span>
                        <span>{Number(row.debit_amount) ? money(row.debit_amount) : '—'}</span>
                        <span>{Number(row.credit_amount) ? money(row.credit_amount) : '—'}</span>
                        <span className="text-gray-600 text-xs sm:text-sm sm:col-span-1 break-words">{row.narration || '—'}</span>
                    </div>
                ))}
                {!pagination.totalItems && (
                    <p className="px-4 py-6 text-sm text-gray-500">No ledger entries for this filter. Add an entry or collect a due.</p>
                )}
            </div>

            {pagination.totalItems > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600">
                            <span>
                                Showing <span className="font-semibold text-gray-900">{pagination.startIndex + 1}</span>
                                {' '}to <span className="font-semibold text-gray-900">{pagination.endIndex}</span>
                                {' '}of <span className="font-semibold text-gray-900">{pagination.totalItems}</span>
                            </span>
                            <label className="flex items-center gap-2">
                                Per page
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                >
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={pagination.safePage <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page <span className="font-semibold text-gray-900">{pagination.safePage}</span> of <span className="font-semibold text-gray-900">{pagination.totalPages}</span>
                            </span>
                            <button
                                type="button"
                                disabled={pagination.safePage >= pagination.totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeepavaliLedgerPage;
