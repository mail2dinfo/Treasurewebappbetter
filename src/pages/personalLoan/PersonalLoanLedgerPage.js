import React, { useState, useEffect, useMemo } from 'react';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import { FiPlus, FiDollarSign, FiTrendingUp, FiCalendar, FiRefreshCw, FiX, FiEdit2, FiDownload } from 'react-icons/fi';
import PersonalLoanLedgerAccountForm from '../../components/personalLoan/PersonalLoanLedgerAccountForm';
import PersonalLoanLedgerEntryForm from '../../components/personalLoan/PersonalLoanLedgerEntryForm';
import { exportToCSV } from '../../utils/exportUtils';
import { toast } from 'react-toastify';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const PersonalLoanLedgerPage = () => {
    const {
        ledgerAccounts,
        ledgerEntries,
        ledgerSummary,
        ledgerCategories,
        isLoading,
        error,
        createLedgerAccount,
        updateLedgerAccount,
        createLedgerEntry,
        fetchLedgerEntries,
        refreshLedgerData,
        clearError
    } = usePersonalLoanContext();

    const [activeTab, setActiveTab] = useState('accounts');
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [showEntryForm, setShowEntryForm] = useState(false);
    const [filters, setFilters] = useState({
        account_id: '',
        category: '',
        type: '',
        start_date: '',
        end_date: ''
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    useEffect(() => {
        refreshLedgerData();
    }, [refreshLedgerData]);

    useEffect(() => {
        if (activeTab === 'entries') {
            fetchLedgerEntries({
                account_id: filters.account_id,
                category: filters.category,
                start_date: filters.start_date,
                end_date: filters.end_date,
            });
        }
    }, [
        activeTab,
        filters.account_id,
        filters.category,
        filters.start_date,
        filters.end_date,
        fetchLedgerEntries,
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, pageSize]);

    // Re-sync when user returns to this tab (e.g. after disburse/collect elsewhere)
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                refreshLedgerData(filters);
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [refreshLedgerData, filters]);

    const handleCreateAccount = async (accountData) => {
        const result = await createLedgerAccount(accountData);
        if (result.success) {
            setShowAccountForm(false);
            await refreshLedgerData(filters);
        }
        return result;
    };

    const handleUpdateAccount = async (accountData) => {
        if (!editingAccount?.id) {
            return { success: false, error: 'No account selected' };
        }
        const result = await updateLedgerAccount(editingAccount.id, accountData);
        if (result.success) {
            setEditingAccount(null);
            await refreshLedgerData(filters);
        }
        return result;
    };

    const handleCreateEntry = async (entryData) => {
        const result = await createLedgerEntry(entryData);
        if (result.success) {
            setShowEntryForm(false);
            await refreshLedgerData(filters);
        }
        return result;
    };

    const formatCurrency = (amount) => {
        return `₹${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatAmountPlain = (amount) => {
        return Number(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const filteredEntries = useMemo(() => {
        if (!filters.type) return ledgerEntries;
        return ledgerEntries.filter((entry) => {
            const amount = parseFloat(entry.amount || 0);
            const isCredit = amount >= 0;
            if (filters.type === 'Credit') return isCredit;
            if (filters.type === 'Debit') return !isCredit;
            return true;
        });
    }, [ledgerEntries, filters.type]);

    const entriesPagination = useMemo(() => {
        const totalItems = filteredEntries.length;
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
            pageItems: filteredEntries.slice(startIndex, endIndex),
        };
    }, [filteredEntries, currentPage, pageSize]);

    const handleDownloadExcel = () => {
        if (!filteredEntries.length) {
            toast.info('No ledger entries to download');
            return;
        }

        const rows = filteredEntries.map((entry) => {
            const amount = parseFloat(entry.amount || 0);
            const isCredit = amount >= 0;
            const absAmount = Math.abs(amount);
            return {
                'Transacted Date': entry.payment_date || '',
                Account: entry.account?.account_name || '',
                Category: entry.category || '',
                Subcategory: entry.subcategory || '',
                Type: isCredit ? 'Credit' : 'Debit',
                Cr: isCredit ? formatAmountPlain(absAmount) : '',
                Db: !isCredit ? formatAmountPlain(absAmount) : '',
                Description: (entry.description || '').replace(/\n/g, ' '),
                'Reference Type': entry.reference_type || '',
                'Reference ID': entry.reference_id || '',
            };
        });

        const stamp = new Date().toISOString().slice(0, 10);
        exportToCSV(rows, `pl-ledger-entries-${stamp}.csv`);
        toast.success(`Downloaded ${rows.length} entries`);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Personal Loan Ledger</h1>
                        <p className="text-sm text-gray-600 mt-1">Track accounts, entries, and financial transactions</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAccountForm(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Account
                        </button>
                        <button
                            onClick={() => setShowEntryForm(true)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Entry
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {ledgerSummary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-blue-500">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FiDollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Total Balance</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(ledgerSummary.total_balance)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FiTrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Total Accounts</p>
                                    <p className="text-xl font-bold text-gray-900">{ledgerSummary.total_accounts}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-purple-500">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FiCalendar className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Total Entries</p>
                                    <p className="text-xl font-bold text-gray-900">{ledgerSummary.total_entries}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-orange-500">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <FiRefreshCw className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Recent Activity</p>
                                    <p className="text-xl font-bold text-gray-900">{ledgerSummary.recent_entries?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-6">
                    <div className="bg-white rounded-xl shadow-sm">
                        <div className="border-b border-gray-200">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setActiveTab('accounts')}
                                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'accounts'
                                        ? 'border-red-600 text-red-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    Ledger Accounts
                                </button>
                                <button
                                    onClick={() => setActiveTab('entries')}
                                    className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'entries'
                                        ? 'border-red-600 text-red-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-800'
                                        }`}
                                >
                                    Ledger Entries
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading ledger data...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 text-red-500">⚠️</div>
                            <p className="text-red-700">{error}</p>
                            <button
                                onClick={clearError}
                                className="ml-auto text-red-500 hover:text-red-700"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Accounts Tab */}
                {activeTab === 'accounts' && !isLoading && (
                    <>
                        {/* Accounts Table */}
                        {ledgerAccounts.length > 0 ? (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Account Name</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Opening Balance</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Current Balance</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Created Date</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {ledgerAccounts.map((account) => (
                                                <tr key={account.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">{account.account_name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="text-sm font-semibold text-gray-600">
                                                            {formatCurrency(account.opening_balance)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-sm font-semibold ${parseFloat(account.current_balance) >= 0
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                            }`}>
                                                            {formatCurrency(account.current_balance)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-sm text-gray-600">
                                                            {formatDate(account.created_at)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingAccount(account)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                        >
                                                            <FiEdit2 className="w-3.5 h-3.5" />
                                                            Update
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">🏦</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Ledger Accounts</h3>
                                <p className="text-gray-600 mb-6">
                                    Create your first ledger account to start tracking financial transactions
                                </p>
                                <button
                                    onClick={() => setShowAccountForm(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                >
                                    <FiPlus className="w-5 h-5" />
                                    Create Your First Account
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Entries Tab */}
                {activeTab === 'entries' && !isLoading && (
                    <>
                        {/* Filters */}
                        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                            <div className="flex flex-wrap gap-4 items-end">
                                <select
                                    value={filters.account_id}
                                    onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="">All Accounts</option>
                                    {ledgerAccounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.account_name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="">All Categories</option>
                                    {(ledgerCategories || []).map((cat) => (
                                        <option key={cat.id} value={cat.category_name}>
                                            {cat.category_name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={filters.type}
                                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="">All Types</option>
                                    <option value="Credit">Credit</option>
                                    <option value="Debit">Debit</option>
                                </select>

                                <input
                                    type="date"
                                    value={filters.start_date}
                                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Start Date"
                                />

                                <input
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="End Date"
                                />

                                <button
                                    type="button"
                                    onClick={handleDownloadExcel}
                                    disabled={filteredEntries.length === 0}
                                    className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                                >
                                    <FiDownload className="w-4 h-4" />
                                    Download Excel
                                </button>
                            </div>
                        </div>

                        {/* Entries Table */}
                        {filteredEntries.length > 0 ? (
                            <>
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Transacted Date</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Account</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subcategory</th>
                                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Type</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Cr</th>
                                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Db</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {entriesPagination.pageItems.map((entry) => {
                                                    const amount = parseFloat(entry.amount || 0);
                                                    const isCredit = amount >= 0;
                                                    const absAmount = Math.abs(amount);
                                                    return (
                                                        <tr key={entry.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                                {formatDate(entry.payment_date)}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {entry.account?.account_name || 'N/A'}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                                    {entry.category}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm text-gray-600">
                                                                    {entry.subcategory || '-'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-center">
                                                                <span
                                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                        isCredit
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-red-100 text-red-800'
                                                                    }`}
                                                                >
                                                                    {isCredit ? 'Credit' : 'Debit'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="text-sm font-semibold text-green-600">
                                                                    {isCredit ? formatCurrency(absAmount) : '—'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <span className="text-sm font-semibold text-red-600">
                                                                    {!isCredit ? formatCurrency(absAmount) : '—'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-600 max-w-xs truncate">
                                                                    {entry.description || '-'}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pagination */}
                                <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600">
                                            <span>
                                                Showing{' '}
                                                <span className="font-semibold text-gray-900">
                                                    {entriesPagination.startIndex + 1}
                                                </span>{' '}
                                                to{' '}
                                                <span className="font-semibold text-gray-900">
                                                    {entriesPagination.endIndex}
                                                </span>{' '}
                                                of{' '}
                                                <span className="font-semibold text-gray-900">
                                                    {entriesPagination.totalItems}
                                                </span>
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <label htmlFor="pl-ledger-page-size" className="text-sm text-gray-600">
                                                    Per page
                                                </label>
                                                <select
                                                    id="pl-ledger-page-size"
                                                    value={pageSize}
                                                    onChange={(e) => setPageSize(Number(e.target.value))}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                                                >
                                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                                        <option key={size} value={size}>
                                                            {size}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                type="button"
                                                disabled={entriesPagination.safePage <= 1}
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Previous
                                            </button>
                                            <span className="text-sm text-gray-600 px-2">
                                                Page{' '}
                                                <span className="font-semibold text-gray-900">
                                                    {entriesPagination.safePage}
                                                </span>{' '}
                                                of{' '}
                                                <span className="font-semibold text-gray-900">
                                                    {entriesPagination.totalPages}
                                                </span>
                                            </span>
                                            <button
                                                type="button"
                                                disabled={entriesPagination.safePage >= entriesPagination.totalPages}
                                                onClick={() =>
                                                    setCurrentPage((p) =>
                                                        Math.min(entriesPagination.totalPages, p + 1)
                                                    )
                                                }
                                                className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">📝</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                    {ledgerEntries.length > 0 ? 'No Matching Entries' : 'No Ledger Entries'}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {ledgerEntries.length > 0
                                        ? 'Try changing the Type or other filters'
                                        : 'Create your first ledger entry to start recording financial transactions'}
                                </p>
                                {ledgerEntries.length === 0 && (
                                    <button
                                        onClick={() => setShowEntryForm(true)}
                                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                    >
                                        <FiPlus className="w-5 h-5" />
                                        Create Your First Entry
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Modals */}
                {showAccountForm && (
                    <PersonalLoanLedgerAccountForm
                        onClose={() => setShowAccountForm(false)}
                        onSuccess={handleCreateAccount}
                    />
                )}

                {editingAccount && (
                    <PersonalLoanLedgerAccountForm
                        account={editingAccount}
                        onClose={() => setEditingAccount(null)}
                        onSuccess={handleUpdateAccount}
                    />
                )}

                {showEntryForm && (
                    <PersonalLoanLedgerEntryForm
                        accounts={ledgerAccounts}
                        onClose={() => setShowEntryForm(false)}
                        onSuccess={handleCreateEntry}
                    />
                )}
            </div>
        </div>
    );
};

export default PersonalLoanLedgerPage;
