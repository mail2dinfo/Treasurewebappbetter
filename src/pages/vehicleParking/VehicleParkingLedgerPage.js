import React, { useEffect, useMemo, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FiDownload, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useVehicleParking } from '../../context/vehicleParking_context';
import { useUserContext } from '../../context/user_context';
import LedgerHeader from '../../components/LedgerHeader';
import FilterBar from '../../components/FilterBar';
import Mypdf from '../../components/PDF/Mypdf';
import { isFlaggedLedgerEntry } from '../../components/LedgerTable';
import '../../style/ledger.css';
import '../../style/AddAccountModal.css';

const formatMoney = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value || '—');
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
};

const isParkingIncomeName = (name) => String(name || '').trim().toUpperCase() === 'PARKING INCOME';
const MONEY_IN_TYPES = ['PARKING_PAYMENT', 'PASS_SALE'];
const MONEY_OUT_TYPES = ['EXPENSE'];

const flattenEntries = (raw, accounts) => {
    const nameOf = (id) => accounts.find((a) => a.id === id)?.account_name || '—';
    const rows = [];
    (raw || []).forEach((entry) => {
        const type = String(entry.transaction_type || '').toUpperCase();
        const debitName = nameOf(entry.debit_account_id);
        const creditName = nameOf(entry.credit_account_id);
        if (MONEY_IN_TYPES.includes(type)) {
            rows.push({
                id: `${entry.id}-cr`,
                transacted_date: entry.transaction_date,
                account: { account_name: debitName },
                account_id: entry.debit_account_id,
                entry_type: 'CREDIT',
                amount: entry.amount,
                category: entry.category_name || entry.transaction_type || '',
                description: entry.description || '',
            });
            return;
        }
        if (MONEY_OUT_TYPES.includes(type)) {
            rows.push({
                id: `${entry.id}-db`,
                transacted_date: entry.transaction_date,
                account: { account_name: creditName },
                account_id: entry.credit_account_id,
                entry_type: 'DEBIT',
                amount: entry.amount,
                category: entry.category_name || entry.transaction_type || '',
                description: entry.description || '',
            });
            return;
        }
        if (!isParkingIncomeName(debitName)) {
            rows.push({
                id: `${entry.id}-db`,
                transacted_date: entry.transaction_date,
                account: { account_name: debitName },
                account_id: entry.debit_account_id,
                entry_type: 'DEBIT',
                amount: entry.amount,
                category: entry.category_name || entry.transaction_type || '',
                description: entry.description || '',
            });
        }
        if (!isParkingIncomeName(creditName)) {
            rows.push({
                id: `${entry.id}-cr`,
                transacted_date: entry.transaction_date,
                account: { account_name: creditName },
                account_id: entry.credit_account_id,
                entry_type: 'CREDIT',
                amount: entry.amount,
                category: entry.category_name || entry.transaction_type || '',
                description: entry.description || '',
            });
        }
    });
    return rows;
};

export const VehicleParkingAccountsPage = () => {
    const { boot, locationId, vp, reload } = useVehicleParking();
    const { user } = useUserContext();
    const allAccounts = boot?.ledger_accounts || [];
    const accounts = allAccounts.filter(
        (a) => String(a.account_name || '').trim().toUpperCase() !== 'PARKING INCOME'
    );
    const [rawEntries, setRawEntries] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        category: '',
        entryType: '',
    });
    const [accountForm, setAccountForm] = useState({
        account_name: '',
        opening_balance: '',
    });
    const emptyEntryForm = () => ({
        debit_account_id: '',
        credit_account_id: '',
        category_id: '',
        amount: '',
        description: '',
        transaction_date: new Date().toISOString().slice(0, 10),
    });
    const [entryForm, setEntryForm] = useState(emptyEntryForm);

    const loadEntries = async () => {
        try {
            const [entries, cats] = await Promise.all([
                vp('/vp/ledger/entries', { params: { location_id: locationId } }),
                vp('/vp/ledger/categories').catch(() => []),
            ]);
            setRawEntries(entries || []);
            setCategories(cats || []);
        } catch (error) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (locationId) loadEntries();
    }, [locationId]);

    const displayRows = useMemo(() => {
        let rows = flattenEntries(rawEntries, allAccounts);
        if (filters.category) rows = rows.filter((r) => String(r.category || '').toLowerCase().includes(String(filters.category).toLowerCase()));
        if (filters.entryType) rows = rows.filter((r) => r.entry_type === filters.entryType);
        if (filters.startDate) rows = rows.filter((r) => String(r.transacted_date) >= filters.startDate);
        if (filters.endDate) rows = rows.filter((r) => String(r.transacted_date) <= filters.endDate);
        return rows;
    }, [rawEntries, allAccounts, filters]);

    const categoryOptions = useMemo(() => {
        const fromSettings = (categories || []).map((c) => c.category_name).filter(Boolean);
        const fromRows = flattenEntries(rawEntries, allAccounts).map((r) => r.category).filter(Boolean);
        const names = [...new Set([...fromSettings, ...fromRows])];
        return names.map((category_name) => ({ category_name }));
    }, [rawEntries, allAccounts, categories]);

    const totals = useMemo(() => {
        const opening = accounts.reduce((sum, acc) => sum + Number(acc.opening_balance || 0), 0);
        const current = accounts.reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0);
        return { opening, current, movement: current - opening };
    }, [accounts]);

    const openAddAccount = () => {
        setEditingAccount(null);
        setAccountForm({ account_name: '', opening_balance: '' });
        setShowAccountModal(true);
    };

    const handleEditAccount = (account) => {
        setEditingAccount(account);
        setAccountForm({
            account_name: account.account_name || '',
            opening_balance: String(account.opening_balance ?? 0),
        });
        setShowAccountModal(true);
    };

    const handleDeleteAccount = async (account) => {
        try {
            await vp(`/vp/ledger/accounts/${account.id}`, { method: 'DELETE' });
            await reload(locationId);
            return { success: true, message: 'Account deleted successfully.' };
        } catch (error) {
            return { success: false, message: error.message || 'Unable to delete account.' };
        }
    };

    const saveAccount = async (e) => {
        e.preventDefault();
        if (!accountForm.account_name.trim()) return toast.error('Please enter account name.');
        if (!editingAccount && accountForm.opening_balance === '') return toast.error('Please enter opening balance.');
        try {
            await vp(editingAccount ? `/vp/ledger/accounts/${editingAccount.id}` : '/vp/ledger/accounts', {
                method: editingAccount ? 'PUT' : 'POST',
                body: {
                    account_name: accountForm.account_name.trim(),
                    ...(!editingAccount ? { opening_balance: Number(accountForm.opening_balance || 0) } : {}),
                },
            });
            toast.success(editingAccount ? 'Account updated' : 'Account created');
            setShowAccountModal(false);
            setEditingAccount(null);
            await reload(locationId);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const saveEntry = async (e) => {
        e.preventDefault();
        try {
            await vp('/vp/ledger/entries', {
                method: 'POST',
                body: { ...entryForm, location_id: locationId },
            });
            toast.success('Entry saved');
            setShowEntryModal(false);
            setEntryForm(emptyEntryForm());
            await reload(locationId);
            loadEntries();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleDownloadCSV = () => {
        const headers = ['Date', 'Account', 'Category', 'CR Amount', 'DB Amount', 'Description'];
        const rows = displayRows.map((entry) => [
            formatDate(entry.transacted_date),
            entry.account?.account_name ?? '',
            entry.category,
            entry.entry_type === 'CREDIT' ? entry.amount : '',
            entry.entry_type === 'DEBIT' ? entry.amount : '',
            `"${String(entry.description || '').replace(/"/g, '""')}"`,
        ]);
        const csvContent = [headers, ...rows].map((line) => line.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'parking-ledger.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalCredit = displayRows.filter((r) => r.entry_type === 'CREDIT').reduce((s, r) => s + Number(r.amount || 0), 0);
    const totalDebit = displayRows.filter((r) => r.entry_type === 'DEBIT').reduce((s, r) => s + Number(r.amount || 0), 0);

    const pdfHeaders = [
        { title: 'Date', value: 'date' },
        { title: 'Account', value: 'account' },
        { title: 'Category', value: 'category' },
        { title: 'CR Amount', value: 'credit' },
        { title: 'DB Amount', value: 'debit' },
        { title: 'Description', value: 'description' },
    ];

    const pdfRows = useMemo(() => {
        const rows = displayRows.map((entry) => ({
            date: formatDate(entry.transacted_date),
            account: entry.account?.account_name || '',
            category: entry.category || '',
            credit: entry.entry_type === 'CREDIT' ? Number(entry.amount || 0).toLocaleString('en-IN') : '',
            debit: entry.entry_type === 'DEBIT' ? Number(entry.amount || 0).toLocaleString('en-IN') : '',
            description: entry.description || '',
        }));
        if (rows.length) {
            rows.push({
                date: 'TOTAL',
                account: '',
                category: `${displayRows.length} entries`,
                credit: totalCredit.toLocaleString('en-IN'),
                debit: totalDebit.toLocaleString('en-IN'),
                description: '',
            });
        }
        return rows;
    }, [displayRows, totalCredit, totalDebit]);

    return (
        <div className={`ledger-page ${showAccountModal || showEntryModal ? 'blurred' : ''}`}>
            <div className="ledger-page-inner">
                <div className="ledger-page-header">
                    <div>
                        <h1>Ledger</h1>
                        <p>Pass sales and parking collections show as one credit on the payment account. Expenses show as one debit.</p>
                    </div>
                    <div className="ledger-page-header-actions">
                        <button type="button" className="ledger-btn ledger-btn-secondary" onClick={openAddAccount}>
                            <FiPlus /> Add account
                        </button>
                        <button type="button" className="ledger-btn ledger-btn-primary" onClick={() => setShowEntryModal(true)}>
                            <FiPlus /> Add entry
                        </button>
                    </div>
                </div>

                <div className="ledger-kpi-grid">
                    <div className="ledger-kpi-card">
                        <p className="ledger-kpi-label">Accounts</p>
                        <p className="ledger-kpi-value">{accounts.length}</p>
                    </div>
                    <div className="ledger-kpi-card">
                        <p className="ledger-kpi-label">Opening</p>
                        <p className="ledger-kpi-value">{formatMoney(totals.opening)}</p>
                    </div>
                    <div className="ledger-kpi-card">
                        <p className="ledger-kpi-label">Current</p>
                        <p className="ledger-kpi-value">{formatMoney(totals.current)}</p>
                    </div>
                    <div className="ledger-kpi-card">
                        <p className="ledger-kpi-label">Net change</p>
                        <p className={`ledger-kpi-value ${totals.movement >= 0 ? 'is-up' : 'is-down'}`}>
                            {totals.movement === 0
                                ? formatMoney(0)
                                : `${totals.movement > 0 ? 'Increased' : 'Decreased'} ${formatMoney(Math.abs(totals.movement))}`}
                        </p>
                    </div>
                </div>

                <LedgerHeader
                    accounts={accounts}
                    onAddClick={openAddAccount}
                    onEditAccount={handleEditAccount}
                    onDeleteAccount={handleDeleteAccount}
                />

                <section className="ledger-panel">
                    <div className="ledger-panel-head">
                        <div>
                            <h2>Entries</h2>
                            <p>{displayRows.length ? `${displayRows.length} recorded` : 'Filter and export ledger activity'}</p>
                        </div>
                        <div className="ledger-panel-actions">
                            <button type="button" className="ledger-btn ledger-btn-primary" onClick={() => setShowEntryModal(true)}>
                                <FiPlus /> Add entry
                            </button>
                            <button type="button" className="ledger-btn ledger-btn-ghost" onClick={handleDownloadCSV}>
                                <FiDownload /> CSV
                            </button>
                            {pdfRows.length > 0 && (
                                <PDFDownloadLink
                                    document={(
                                        <Mypdf
                                            tableData={pdfRows}
                                            tableHeaders={pdfHeaders}
                                            heading="Ledger Entries"
                                            companyData={user?.results?.userCompany || []}
                                        />
                                    )}
                                    fileName={`Ledger_${new Date().toISOString().slice(0, 10)}.pdf`}
                                >
                                    {({ loading }) => (
                                        <button type="button" className="ledger-btn ledger-btn-ghost">
                                            <FiDownload /> {loading ? 'Preparing PDF…' : 'PDF'}
                                        </button>
                                    )}
                                </PDFDownloadLink>
                            )}
                        </div>
                    </div>
                    <div className="ledger-panel-filters">
                        <FilterBar filters={filters} setFilters={setFilters} categories={categoryOptions} />
                    </div>
                    <div className="ledger-panel-body">
                        {!displayRows.length ? (
                            <div className="ledger-empty">No ledger entries match these filters.</div>
                        ) : (
                            <div className="w-full">
                                <p className="ledger-flag-note">
                                    Rows in light red are flagged reversal / incorrect / correction entries.
                                </p>
                                <div className="lg:hidden space-y-3">
                                    {displayRows.map((entry) => {
                                        const flagged = isFlaggedLedgerEntry(entry);
                                        return (
                                            <div key={entry.id} className={`ledger-entry-card ${flagged ? 'is-flagged' : ''}`}>
                                                <div className="ledger-entry-card-top">
                                                    <div className="min-w-0">
                                                        <p className="ledger-entry-account">{entry.account?.account_name || '—'}</p>
                                                        <p className="ledger-entry-date">{formatDate(entry.transacted_date)}</p>
                                                    </div>
                                                    <span className={`ledger-type-pill ${entry.entry_type === 'CREDIT' ? 'is-credit' : 'is-debit'}`}>
                                                        {entry.entry_type === 'CREDIT' ? 'CR' : 'DB'} {formatMoney(entry.amount)}
                                                    </span>
                                                </div>
                                                <p className="ledger-entry-meta">
                                                    <span>Category</span> {entry.category || '—'}
                                                </p>
                                                {entry.description && (
                                                    <p className="ledger-entry-desc">{entry.description}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200">
                                    <table className="ledger-table min-w-[720px]">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Account name</th>
                                                <th>Category</th>
                                                <th>CR amount</th>
                                                <th>DB amount</th>
                                                <th>Description</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayRows.map((entry) => {
                                                const flagged = isFlaggedLedgerEntry(entry);
                                                return (
                                                    <tr
                                                        key={entry.id}
                                                        className={flagged ? 'ledger-row-flagged' : undefined}
                                                    >
                                                        <td>{formatDate(entry.transacted_date)}</td>
                                                        <td className="ledger-account-cell">{entry.account?.account_name || '-'}</td>
                                                        <td>{entry.category}</td>
                                                        <td className="ledger-credit-cell">
                                                            {entry.entry_type === 'CREDIT' ? formatMoney(entry.amount) : '—'}
                                                        </td>
                                                        <td className="ledger-debit-cell">
                                                            {entry.entry_type === 'DEBIT' ? formatMoney(entry.amount) : '—'}
                                                        </td>
                                                        <td>{entry.description}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="ledger-pagination">
                                    <div className="ledger-pagination-totals">
                                        <span className="is-credit">Credit {formatMoney(totalCredit)}</span>
                                        <span className="is-debit">Debit {formatMoney(totalDebit)}</span>
                                        <span className="is-muted">{displayRows.length} entries</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {showAccountModal && (
                <div className="modal-overlay">
                    <form className="modal" onSubmit={saveAccount}>
                        <h3>{editingAccount ? 'Update Account' : 'Add New Account'}</h3>
                        <input
                            type="text"
                            placeholder="Account Name"
                            value={accountForm.account_name}
                            onChange={(e) => setAccountForm((p) => ({ ...p, account_name: e.target.value }))}
                        />
                        {!editingAccount && (
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Opening Balance"
                                value={accountForm.opening_balance}
                                onChange={(e) => setAccountForm((p) => ({ ...p, opening_balance: e.target.value }))}
                            />
                        )}
                        <div className="modal-actions">
                            <button type="submit">{editingAccount ? 'Update' : 'Submit'}</button>
                            <button type="button" className="cancel" onClick={() => { setShowAccountModal(false); setEditingAccount(null); }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {showEntryModal && (
                <div className="modal-overlay">
                    <form className="modal" onSubmit={saveEntry}>
                        <h3>Add New Entry</h3>
                        <input
                            type="date"
                            value={entryForm.transaction_date}
                            onChange={(e) => setEntryForm((p) => ({ ...p, transaction_date: e.target.value }))}
                        />
                        <select
                            required
                            value={entryForm.debit_account_id}
                            onChange={(e) => setEntryForm((p) => ({ ...p, debit_account_id: e.target.value }))}
                        >
                            <option value="">Debit account</option>
                            {allAccounts.map((a) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                        </select>
                        <select
                            required
                            value={entryForm.credit_account_id}
                            onChange={(e) => setEntryForm((p) => ({ ...p, credit_account_id: e.target.value }))}
                        >
                            <option value="">Credit account</option>
                            {allAccounts.map((a) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                        </select>
                        <select
                            required
                            value={entryForm.category_id}
                            onChange={(e) => setEntryForm((p) => ({ ...p, category_id: e.target.value }))}
                        >
                            <option value="">Category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.category_name}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="Amount"
                            value={entryForm.amount}
                            onChange={(e) => setEntryForm((p) => ({ ...p, amount: e.target.value }))}
                        />
                        <input
                            type="text"
                            placeholder="Description"
                            value={entryForm.description}
                            onChange={(e) => setEntryForm((p) => ({ ...p, description: e.target.value }))}
                        />
                        <div className="modal-actions">
                            <button type="submit">Submit</button>
                            <button type="button" className="cancel" onClick={() => setShowEntryModal(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default VehicleParkingAccountsPage;
