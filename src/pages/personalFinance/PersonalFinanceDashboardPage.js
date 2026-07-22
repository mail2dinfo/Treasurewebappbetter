import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FaPlus,
    FaTimes,
    FaTrash,
    FaTags,
    FaFilePdf,
    FaFileExcel,
} from 'react-icons/fa';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import { downloadPfExcel, downloadPfPdf } from '../../utils/pfExportUtils';

const PERIODS = [
    { id: 'day', label: 'Today' },
    { id: 'month', label: 'This month' },
    { id: 'last_month', label: 'Last month' },
    { id: 'months_3', label: '3 months' },
    { id: 'months_6', label: '6 months' },
    { id: 'year', label: 'This year' },
];

const ACCOUNT_TYPES = [
    { value: 'CASH', label: 'Cash' },
    { value: 'WALLET', label: 'Wallet' },
    { value: 'BANK', label: 'Bank' },
    { value: 'OTHER', label: 'Other' },
];

const formatMoneyExact = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '₹0.00';
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const CATEGORY_CHART_COLORS = [
    '#16a34a', '#22c55e', '#4ade80', '#86efac', '#15803d',
    '#065f46', '#10b981', '#34d399', '#059669', '#047857',
];

const ACCOUNT_CHART_COLORS = [
    '#ca8a04', '#eab308', '#facc15', '#fde047', '#a16207',
    '#d97706', '#f59e0b', '#fbbf24', '#b45309', '#92400e',
];

/** SVG donut chart for expense breakdown (category or account) */
const ExpenseDonut = ({ items, total, idKey = 'category_id', colors = CATEGORY_CHART_COLORS }) => {
    const size = 140;
    const stroke = 22;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    if (!items.length || total <= 0) {
        return (
            <div className="flex items-center justify-center h-[140px]">
                <div className="text-center text-gray-500 text-sm">No expense data</div>
            </div>
        );
    }

    return (
        <div className="relative mx-auto" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth={stroke}
                />
                {items.map((item, i) => {
                    const pct = Number(item.expense) / total;
                    const dash = pct * circumference;
                    const gap = circumference - dash;
                    const circle = (
                        <circle
                            key={item[idKey] || item.name || i}
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={colors[i % colors.length]}
                            strokeWidth={stroke}
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-offset}
                            strokeLinecap="butt"
                        />
                    );
                    offset += dash;
                    return circle;
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] font-medium text-gray-500 uppercase">Expense</p>
                <p className="text-sm font-bold text-gray-900 tabular-nums">{formatMoneyExact(total)}</p>
            </div>
        </div>
    );
};

const todayISO = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const typeBadgeClass = (type) => {
    switch (String(type || '').toUpperCase()) {
        case 'CASH':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'WALLET':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'BANK':
            return 'bg-green-100 text-green-800 border-green-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const PersonalFinanceDashboardPage = () => {
    const { user } = useUserContext();
    const token = user?.results?.token;
    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id
        || user?.results?.userAccounts?.[0]?.membershipId;

    const [period, setPeriod] = useState('month');
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTxn, setSelectedTxn] = useState(null);

    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(true);
    const [incomeCats, setIncomeCats] = useState([]);
    const [expenseCats, setExpenseCats] = useState([]);

    const [showTxnModal, setShowTxnModal] = useState(false);
    const [showCatModal, setShowCatModal] = useState(false);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [txnType, setTxnType] = useState('EXPENSE');
    const [amount, setAmount] = useState('');
    const [accountId, setAccountId] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [txnDate, setTxnDate] = useState(todayISO());
    const [note, setNote] = useState('');

    const [catType, setCatType] = useState('EXPENSE');
    const [catName, setCatName] = useState('');
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountType, setNewAccountType] = useState('CASH');
    const [newOpeningBalance, setNewOpeningBalance] = useState('0');
    const [exporting, setExporting] = useState(false);

    const authHeaders = useMemo(() => ({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    }), [token]);

    const qs = membershipId ? `parent_membership_id=${membershipId}` : '';

    const fetchSummary = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ period });
            if (membershipId) params.set('parent_membership_id', membershipId);
            const res = await fetch(`${API_BASE_URL}/pf/dashboard/summary?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to load dashboard');
            }
            const results = data.results;
            setSummary(results);
            const entries = results?.entries || results?.recent || [];
            setSelectedTxn((prev) => {
                if (prev && entries.some((t) => t.id === prev.id)) {
                    return entries.find((t) => t.id === prev.id) || entries[0] || null;
                }
                return entries[0] || null;
            });
        } catch (error) {
            toast.error(error.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    }, [token, membershipId, period]);

    const ensureLookups = useCallback(async () => {
        if (!token) return;
        setAccountsLoading(true);
        try {
            const [accRes, catRes] = await Promise.all([
                fetch(`${API_BASE_URL}/pf/accounts${qs ? `?${qs}` : ''}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE_URL}/pf/categories${qs ? `?${qs}` : ''}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            const accData = await accRes.json();
            const catData = await catRes.json();
            if (accRes.ok && !accData.error) {
                const list = accData.results?.accounts || [];
                setAccounts(list);
                setAccountId((prev) => prev || list[0]?.id || '');
            }
            if (catRes.ok && !catData.error) {
                setIncomeCats(catData.results?.income || []);
                setExpenseCats(catData.results?.expense || []);
            }
        } catch (_) {
            /* optional */
        } finally {
            setAccountsLoading(false);
        }
    }, [token, qs]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    useEffect(() => {
        ensureLookups();
    }, [ensureLookups]);

    useEffect(() => {
        const list = txnType === 'INCOME' ? incomeCats : expenseCats;
        setCategoryId((prev) => {
            if (list.some((c) => c.id === prev)) return prev;
            return list[0]?.id || '';
        });
    }, [txnType, incomeCats, expenseCats]);

    const openTxnModal = async (type = 'EXPENSE') => {
        setTxnType(type);
        setAmount('');
        setTxnDate(todayISO());
        setNote('');
        await ensureLookups();
        setShowTxnModal(true);
    };

    const openCatModal = async () => {
        await ensureLookups();
        setCatName('');
        setCatType('EXPENSE');
        setShowCatModal(true);
    };

    const openAccountModal = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setNewAccountName('');
        setNewAccountType('CASH');
        setNewOpeningBalance('0');
        setShowAccountModal(true);
    };

    const closeAccountModal = () => {
        setShowAccountModal(false);
    };

    const submitAccount = async (e) => {
        if (e) e.preventDefault();
        const trimmed = String(newAccountName || '').trim();
        if (!trimmed) {
            toast.error('Enter an account name');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/pf/accounts`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    name: trimmed,
                    account_type: newAccountType,
                    opening_balance: Number(newOpeningBalance) || 0,
                    membershipId,
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to add account');
            }
            toast.success(data.message || 'Account added');
            closeAccountModal();
            setNewAccountName('');
            setNewAccountType('CASH');
            setNewOpeningBalance('0');
            await ensureLookups();
        } catch (error) {
            toast.error(error.message || 'Failed to add account');
        } finally {
            setSaving(false);
        }
    };

    const submitTransaction = async (e) => {
        e.preventDefault();
        if (!amount || Number(amount) <= 0) {
            toast.error('Enter a valid amount');
            return;
        }
        if (!accountId) {
            toast.error('Select an account');
            return;
        }
        if (!categoryId) {
            toast.error('Select a category');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/pf/transactions`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    txn_type: txnType,
                    amount: Number(amount),
                    account_id: accountId,
                    category_id: categoryId,
                    txn_date: txnDate,
                    note: note.trim() || undefined,
                    membershipId,
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to save');
            }
            toast.success(txnType === 'INCOME' ? 'Income logged' : 'Expense logged');
            setShowTxnModal(false);
            await fetchSummary();
            await ensureLookups();
        } catch (error) {
            toast.error(error.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const addCategory = async () => {
        const name = catName.trim();
        if (!name) {
            toast.error('Enter a category name');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/pf/categories`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    category_type: catType,
                    name,
                    membershipId,
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to add category');
            }
            toast.success('Category added');
            setCatName('');
            await ensureLookups();
        } catch (error) {
            toast.error(error.message || 'Failed to add category');
        } finally {
            setSaving(false);
        }
    };

    const removeCategory = async (category) => {
        if (!window.confirm(`Remove "${category.name}"?`)) return;
        setSaving(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/pf/categories/${category.id}${qs ? `?${qs}` : ''}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to remove');
            }
            toast.success('Category removed');
            await ensureLookups();
        } catch (error) {
            toast.error(error.message || 'Failed to remove');
        } finally {
            setSaving(false);
        }
    };

    const removeTransaction = async (txn) => {
        if (!window.confirm('Delete this entry?')) return;
        setSaving(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/pf/transactions/${txn.id}${qs ? `?${qs}` : ''}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to delete entry');
            }
            toast.success('Entry deleted');
            await fetchSummary();
            await ensureLookups();
        } catch (error) {
            toast.error(error.message || 'Failed to delete entry');
        } finally {
            setSaving(false);
        }
    };

    const totals = summary?.totals || { income: 0, expense: 0, net: 0 };
    const entries = summary?.entries || summary?.recent || [];
    const byAccount = (summary?.by_account || [])
        .filter((a) => Number(a.expense) > 0)
        .sort((a, b) => Number(b.expense) - Number(a.expense));
    const expenseByCategory = (summary?.by_category || [])
        .filter((c) => c.category_type === 'EXPENSE' && Number(c.expense) > 0)
        .sort((a, b) => Number(b.expense) - Number(a.expense));
    const expenseCategoryTotal = expenseByCategory.reduce((sum, c) => sum + Number(c.expense || 0), 0);
    const expenseAccountTotal = byAccount.reduce((sum, a) => sum + Number(a.expense || 0), 0);
    const totalAccountBalance = accounts.reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);
    const totalOpeningBalance = accounts.reduce((sum, a) => sum + (Number(a.opening_balance) || 0), 0);
    // Header stats: opening is treated as starting money (part of Income)
    // so Balance = Income − Spent always holds.
    const periodIncome = Number(totals.income) || 0;
    const periodSpent = Number(totals.expense) || 0;
    const headerTotals = {
        income: Math.round((totalOpeningBalance + periodIncome) * 100) / 100,
        expense: Math.round(periodSpent * 100) / 100,
        net: Math.round((totalOpeningBalance + periodIncome - periodSpent) * 100) / 100,
        opening: Math.round(totalOpeningBalance * 100) / 100,
        period_income: periodIncome,
    };
    const categoryList = catType === 'INCOME' ? incomeCats : expenseCats;
    const txnCategories = txnType === 'INCOME' ? incomeCats : expenseCats;

    const periodLabel =
        PERIODS.find((p) => p.id === period)?.label
        || summary?.label
        || period;

    const handleDownloadExcel = () => {
        try {
            setExporting(true);
            downloadPfExcel({
                entries,
                totals: headerTotals,
                periodLabel,
                from: summary?.from,
                to: summary?.to,
            });
            toast.success('Excel file downloaded');
        } catch (error) {
            toast.error(error.message || 'Failed to download Excel');
        } finally {
            setExporting(false);
        }
    };

    const handleDownloadPdf = () => {
        try {
            setExporting(true);
            downloadPfPdf({
                entries,
                totals: headerTotals,
                periodLabel,
                from: summary?.from,
                to: summary?.to,
                expenseByCategory,
                byAccount,
            });
            toast.success('PDF downloaded');
        } catch (error) {
            toast.error(error.message || 'Failed to download PDF');
        } finally {
            setExporting(false);
        }
    };

    const accountModal = showAccountModal ? (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
            onClick={closeAccountModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-account-title"
        >
            <div
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h2 id="add-account-title" className="text-lg font-bold text-white">Add Account</h2>
                        <button
                            type="button"
                            onClick={closeAccountModal}
                            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <form onSubmit={submitAccount} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account name *
                        </label>
                        <input
                            type="text"
                            value={newAccountName}
                            onChange={(e) => setNewAccountName(e.target.value)}
                            placeholder="e.g. Indian Bank, Paytm"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            autoFocus
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <select
                            value={newAccountType}
                            onChange={(e) => setNewAccountType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        >
                            {ACCOUNT_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Opening balance
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={newOpeningBalance}
                            onChange={(e) => setNewOpeningBalance(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeAccountModal}
                            className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-md disabled:opacity-50"
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ) : null;

    return (
        <div>
            <div className="p-2 md:p-4">
                <div className="max-w-7xl mx-auto">
                    {/* Enhanced Header — Products pattern */}
                    <div className="mb-6">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                        Personal Finance
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {entries.length > 0
                                            ? `${entries.length} complete entries · spend by account & category`
                                            : 'No transactions logged yet'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div
                                        className="bg-green-50 border border-green-200 rounded-lg px-4 py-2"
                                        title={
                                            headerTotals.opening
                                                ? `Opening ${formatMoneyExact(headerTotals.opening)} + period income ${formatMoneyExact(headerTotals.period_income)}`
                                                : 'Period income'
                                        }
                                    >
                                        <span className="text-sm font-medium text-green-800">
                                            Income: {formatMoneyExact(headerTotals.income)}
                                        </span>
                                    </div>
                                    <div
                                        className="bg-red-50 border border-red-200 rounded-lg px-4 py-2"
                                        title="Expenses in the selected period"
                                    >
                                        <span className="text-sm font-medium text-red-800">
                                            Spent: {formatMoneyExact(headerTotals.expense)}
                                        </span>
                                    </div>
                                    <div
                                        className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2"
                                        title="Income − Spent (opening + period income − period spent)"
                                    >
                                        <span className="text-sm font-medium text-yellow-800">
                                            Balance: {formatMoneyExact(headerTotals.net)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                {PERIODS.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setPeriod(p.id)}
                                        className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                                            period === p.id
                                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                                <div className="flex-1" />
                                <button
                                    type="button"
                                    onClick={() => openTxnModal('EXPENSE')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    <FaPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">+ Add</span>
                                    <span className="sm:hidden">Add</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={openCatModal}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    <FaTags className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Add Category</span>
                                    <span className="sm:hidden">Category</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Account list — below Personal Finance header */}
                    <div className="mb-4 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Account list
                                <span className="ml-2 text-xs font-normal text-gray-500">
                                    ({accounts.length})
                                </span>
                            </h3>
                            <div className="flex items-center gap-2 sm:gap-3">
                                {accounts.length > 0 && (
                                    <span className="text-xs font-medium text-gray-600 hidden sm:inline">
                                        Total {formatMoneyExact(totalAccountBalance)}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={openAccountModal}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs sm:text-sm rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    <FaPlus className="w-3 h-3" />
                                    + New Account
                                </button>
                            </div>
                        </div>

                        {accountsLoading ? (
                            <div className="py-6 text-center text-sm text-gray-500">Loading accounts...</div>
                        ) : accounts.length === 0 ? (
                            <div className="py-6 text-center text-sm text-gray-500">
                                <p className="mb-3">No accounts yet</p>
                                <button
                                    type="button"
                                    onClick={openAccountModal}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-lg hover:from-red-700 hover:to-red-800 shadow-md"
                                >
                                    <FaPlus className="w-3.5 h-3.5" />
                                    + New Account
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-red-600 text-white text-left">
                                            <th className="px-3 py-2 font-medium w-10">#</th>
                                            <th className="px-3 py-2 font-medium">Name</th>
                                            <th className="px-3 py-2 font-medium">Type</th>
                                            <th className="px-3 py-2 font-medium text-right">Opening</th>
                                            <th className="px-3 py-2 font-medium text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map((account, index) => (
                                            <tr
                                                key={account.id}
                                                className="border-t border-gray-100 hover:bg-red-50 transition-colors"
                                            >
                                                <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                                                <td className="px-3 py-2 font-semibold text-gray-900">
                                                    {account.name}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${typeBadgeClass(account.account_type)}`}>
                                                        {account.account_type || 'OTHER'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap tabular-nums">
                                                    {formatMoneyExact(account.opening_balance)}
                                                </td>
                                                <td className={`px-3 py-2 text-right font-bold whitespace-nowrap tabular-nums ${
                                                    Number(account.current_balance) >= 0 ? 'text-green-700' : 'text-red-700'
                                                }`}>
                                                    {formatMoneyExact(account.current_balance)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Top row: Category 20% | Account 20% | Entries 60% — expense only */}
                    <div className="mb-4 flex flex-col lg:flex-row gap-3 lg:items-start">
                        {/* Expense by Category — 20% */}
                        <div className="w-full lg:w-[20%] bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0">
                            <div className="px-2 py-1.5 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Expense by Category
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    {formatMoneyExact(expenseCategoryTotal)}
                                </p>
                            </div>
                            {loading ? (
                                <div className="py-4 text-center text-xs text-gray-500">Loading...</div>
                            ) : expenseByCategory.length === 0 ? (
                                <div className="py-4 text-center text-xs text-gray-500">No expense yet</div>
                            ) : (
                                <div className="p-2">
                                    <ExpenseDonut
                                        items={expenseByCategory}
                                        total={expenseCategoryTotal}
                                        idKey="category_id"
                                        colors={CATEGORY_CHART_COLORS}
                                    />
                                    <div className="mt-2 max-h-36 overflow-y-auto">
                                        <table className="w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-red-600 text-white text-left">
                                                    <th className="px-1.5 py-1 font-medium">Category</th>
                                                    <th className="px-1.5 py-1 font-medium text-right">Amt</th>
                                                    <th className="px-1.5 py-1 font-medium text-right">%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {expenseByCategory.map((c, index) => {
                                                    const amt = Number(c.expense) || 0;
                                                    const pct = expenseCategoryTotal > 0
                                                        ? Math.round((amt / expenseCategoryTotal) * 100)
                                                        : 0;
                                                    return (
                                                        <tr key={c.category_id} className="border-t border-gray-100">
                                                            <td className="px-1.5 py-1 truncate max-w-[80px]" title={c.name}>
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span
                                                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                        style={{ backgroundColor: CATEGORY_CHART_COLORS[index % CATEGORY_CHART_COLORS.length] }}
                                                                    />
                                                                    {c.name}
                                                                </span>
                                                            </td>
                                                            <td className="px-1.5 py-1 text-right text-red-700 whitespace-nowrap">
                                                                {formatMoneyExact(amt)}
                                                            </td>
                                                            <td className="px-1.5 py-1 text-right text-gray-600">{pct}%</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Expense by Account — 20% */}
                        <div className="w-full lg:w-[20%] bg-white rounded-lg border border-gray-200 overflow-hidden shrink-0">
                            <div className="px-2 py-1.5 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    Expense by Account
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                    {formatMoneyExact(expenseAccountTotal)}
                                </p>
                            </div>
                            {loading ? (
                                <div className="py-4 text-center text-xs text-gray-500">Loading...</div>
                            ) : byAccount.length === 0 ? (
                                <div className="py-4 text-center text-xs text-gray-500">No expense yet</div>
                            ) : (
                                <div className="p-2">
                                    <ExpenseDonut
                                        items={byAccount}
                                        total={expenseAccountTotal}
                                        idKey="account_id"
                                        colors={ACCOUNT_CHART_COLORS}
                                    />
                                    <div className="mt-2 max-h-36 overflow-y-auto">
                                        <table className="w-full text-xs border-collapse">
                                            <thead>
                                                <tr className="bg-red-600 text-white text-left">
                                                    <th className="px-1.5 py-1 font-medium">Account</th>
                                                    <th className="px-1.5 py-1 font-medium text-right">Amt</th>
                                                    <th className="px-1.5 py-1 font-medium text-right">%</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {byAccount.map((a, index) => {
                                                    const amt = Number(a.expense) || 0;
                                                    const share = expenseAccountTotal > 0
                                                        ? Math.round((amt / expenseAccountTotal) * 100)
                                                        : 0;
                                                    return (
                                                        <tr key={a.account_id} className="border-t border-gray-100 hover:bg-red-50">
                                                            <td className="px-1.5 py-1 truncate max-w-[80px]" title={a.name}>
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span
                                                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                        style={{ backgroundColor: ACCOUNT_CHART_COLORS[index % ACCOUNT_CHART_COLORS.length] }}
                                                                    />
                                                                    <span className="font-medium text-gray-900">{a.name}</span>
                                                                </span>
                                                            </td>
                                                            <td className="px-1.5 py-1 text-right text-red-700 whitespace-nowrap">
                                                                {formatMoneyExact(amt)}
                                                            </td>
                                                            <td className="px-1.5 py-1 text-right text-gray-600">{share}%</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* All Entries — 60% */}
                        <div className="w-full lg:w-[60%] min-w-0 flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleDownloadPdf}
                                    disabled={exporting || loading}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 text-white text-xs sm:text-sm rounded-lg hover:from-rose-700 hover:to-rose-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                >
                                    <FaFilePdf className="w-3.5 h-3.5" />
                                    Download PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadExcel}
                                    disabled={exporting || loading}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs sm:text-sm rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                >
                                    <FaFileExcel className="w-3.5 h-3.5" />
                                    Download Excel
                                </button>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    All Entries
                                    <span className="ml-2 text-xs font-normal text-gray-500">
                                        ({entries.length})
                                    </span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => openTxnModal('EXPENSE')}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700"
                                >
                                    <FaPlus className="w-3 h-3" />
                                    Add
                                </button>
                            </div>

                            {loading ? (
                                <div className="py-6 text-center text-sm text-gray-500">Loading...</div>
                            ) : entries.length === 0 ? (
                                <div className="py-6 text-center text-sm text-gray-500">No entries for this period</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-red-600 text-white text-left">
                                                <th className="px-2 py-1.5 font-medium w-8">#</th>
                                                <th className="px-2 py-1.5 font-medium">Date</th>
                                                <th className="px-2 py-1.5 font-medium">Type</th>
                                                <th className="px-2 py-1.5 font-medium">Category</th>
                                                <th className="px-2 py-1.5 font-medium">Account</th>
                                                <th className="px-2 py-1.5 font-medium text-right">Amount</th>
                                                <th className="px-2 py-1.5 font-medium">Note</th>
                                                <th className="px-2 py-1.5 font-medium text-center w-10" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entries.map((txn, index) => (
                                                <tr
                                                    key={txn.id}
                                                    onClick={() => setSelectedTxn(txn)}
                                                    className={`border-t border-gray-100 cursor-pointer hover:bg-red-50 ${
                                                        selectedTxn && selectedTxn.id === txn.id ? 'bg-red-50' : ''
                                                    }`}
                                                >
                                                    <td className="px-2 py-1.5 text-gray-500">{index + 1}</td>
                                                    <td className="px-2 py-1.5 whitespace-nowrap">{txn.txn_date}</td>
                                                    <td className="px-2 py-1.5">
                                                        <span className={txn.txn_type === 'INCOME' ? 'text-green-700' : 'text-red-700'}>
                                                            {txn.txn_type === 'INCOME' ? 'Income' : 'Expense'}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-1.5">{txn.category?.name || '—'}</td>
                                                    <td className="px-2 py-1.5">{txn.account?.name || '—'}</td>
                                                    <td className={`px-2 py-1.5 text-right font-medium whitespace-nowrap ${
                                                        txn.txn_type === 'INCOME' ? 'text-green-700' : 'text-red-700'
                                                    }`}>
                                                        {txn.txn_type === 'INCOME' ? '+' : '−'}
                                                        {formatMoneyExact(txn.amount)}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-gray-500 max-w-[120px] truncate" title={txn.note || ''}>
                                                        {txn.note || '—'}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeTransaction(txn);
                                                            }}
                                                            disabled={saving}
                                                            className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50"
                                                            title="Delete"
                                                        >
                                                            <FaTrash className="w-3 h-3" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add transaction modal — Products modal pattern */}
            {showTxnModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {txnType === 'INCOME' ? 'Log Income' : 'Log Expense'}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowTxnModal(false)}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors duration-200"
                                >
                                    <FaTimes className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={submitTransaction} className="space-y-3">
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setTxnType('EXPENSE')}
                                        className={`py-2 rounded-lg text-sm font-bold transition-all ${
                                            txnType === 'EXPENSE'
                                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTxnType('INCOME')}
                                        className={`py-2 rounded-lg text-sm font-bold transition-all ${
                                            txnType === 'INCOME'
                                                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        Income
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="Enter amount"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Account *</label>
                                        <select
                                            value={accountId}
                                            onChange={(e) => setAccountId(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            required
                                        >
                                            {accounts.length === 0 && <option value="">No accounts</option>}
                                            {accounts.map((a) => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                        <select
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            required
                                        >
                                            {txnCategories.length === 0 && <option value="">No categories</option>}
                                            {txnCategories.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                        <input
                                            type="date"
                                            value={txnDate}
                                            onChange={(e) => setTxnDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                                        <input
                                            type="text"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            placeholder="Optional note"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowTxnModal(false)}
                                        className="px-8 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 text-base font-medium shadow-sm hover:shadow-md"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-3 px-8 py-3 text-white rounded-xl transition-all duration-200 text-base font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl disabled:opacity-50"
                                    >
                                        {saving ? 'Saving…' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Category modal */}
            {showCatModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Add Category</h2>
                                <button
                                    type="button"
                                    onClick={() => setShowCatModal(false)}
                                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCatType('EXPENSE')}
                                    className={`py-2 rounded-lg text-sm font-bold ${
                                        catType === 'EXPENSE'
                                            ? 'bg-gradient-to-r from-red-600 to-red-700 text-white'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    Expense
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCatType('INCOME')}
                                    className={`py-2 rounded-lg text-sm font-bold ${
                                        catType === 'INCOME'
                                            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    Income
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={catName}
                                    onChange={(e) => setCatName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') addCategory();
                                    }}
                                    placeholder="Category name"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={addCategory}
                                    disabled={saving}
                                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-md disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 max-h-64 overflow-y-auto space-y-2">
                                {categoryList.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-4">No categories</p>
                                ) : (
                                    categoryList.map((c) => (
                                        <div
                                            key={c.id}
                                            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{c.name}</p>
                                                <p className="text-[11px] text-gray-400">{c.is_system ? 'Default' : 'Custom'}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeCategory(c)}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-xs rounded-lg hover:from-red-700 hover:to-red-800 shadow-md"
                                            >
                                                <FaTrash className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {ReactDOM.createPortal(accountModal, document.body)}

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default PersonalFinanceDashboardPage;
