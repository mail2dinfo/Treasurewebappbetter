import React, { useState, useEffect } from 'react';
import { useDcLedgerContext } from '../../context/dailyCollection/dcLedgerContext';
import { FiPlus, FiDollarSign, FiTrendingUp, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import Loading from '../../components/Loading';

const DcLedgerPage = () => {
    const {
        accounts,
        entries,
        summary,
        isLoading,
        error,
        fetchAccounts,
        createAccount,
        fetchEntries,
        createEntry,
        fetchSummary,
        clearError
    } = useDcLedgerContext();

    const [showAccountForm, setShowAccountForm] = useState(false);
    const [showEntryForm, setShowEntryForm] = useState(false);
    const [filters, setFilters] = useState({
        account_id: '',
        category: '',
        start_date: '',
        end_date: ''
    });

    // Form states
    const [accountForm, setAccountForm] = useState({
        account_name: '',
        opening_balance: ''
    });
    const [entryForm, setEntryForm] = useState({
        dc_ledger_accounts_id: '',
        category: '',
        subcategory: '',
        amount: '',
        description: '',
        payment_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchAccounts();
        fetchSummary();
        fetchEntries(filters);
    }, [fetchAccounts, fetchSummary]);

    // Listen for loan deletion events and refresh accounts (to update balances)
    useEffect(() => {
        const handleLoanDeleted = (event) => {
            const { accountBalanceUpdates } = event.detail;
            if (accountBalanceUpdates && accountBalanceUpdates.length > 0) {
                console.log('🔄 Loan deleted - refreshing ledger accounts for updated balances');
                fetchAccounts();
            }
        };

        window.addEventListener('loanDeleted', handleLoanDeleted);
        return () => {
            window.removeEventListener('loanDeleted', handleLoanDeleted);
        };
    }, [fetchAccounts]);

    useEffect(() => {
        fetchEntries(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        const result = await createAccount(accountForm);
        if (result.success) {
            setShowAccountForm(false);
            setAccountForm({ account_name: '', opening_balance: '' });
            fetchAccounts();
            fetchSummary();
        }
    };

    const handleCreateEntry = async (e) => {
        e.preventDefault();
        const result = await createEntry(entryForm);
        if (result.success) {
            setShowEntryForm(false);
            setEntryForm({
                dc_ledger_accounts_id: '',
                category: '',
                subcategory: '',
                amount: '',
                description: '',
                payment_date: new Date().toISOString().split('T')[0]
            });
            fetchEntries(filters);
            fetchSummary();
        }
    };

    const formatCurrency = (amount) => {
        return `₹${Number(amount).toLocaleString("en-IN")}`;
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

    const isCreditEntry = (entry) => parseFloat(entry.amount || 0) >= 0;
    const totalCredit = (entries || []).reduce((sum, entry) => {
        const amount = parseFloat(entry.amount || 0);
        return amount >= 0 ? sum + amount : sum;
    }, 0);
    const totalDebit = (entries || []).reduce((sum, entry) => {
        const amount = parseFloat(entry.amount || 0);
        return amount < 0 ? sum + Math.abs(amount) : sum;
    }, 0);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">DC Ledger Management</h1>
                        <p className="text-sm text-gray-600 mt-1">Track accounts, entries, and financial transactions</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            type="button"
                            onClick={() => setShowAccountForm(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Account
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowEntryForm(true)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Entry
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FiDollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Total Balance</p>
                                    <p className="text-lg sm:text-xl font-bold text-gray-800 break-words">{formatCurrency(summary.total_balance)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <FiTrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Total Accounts</p>
                                    <p className="text-xl font-bold text-gray-800">{summary.total_accounts}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <FiCalendar className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Total Entries</p>
                                    <p className="text-xl font-bold text-gray-800">{summary.total_entries}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <FiRefreshCw className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Recent Activity</p>
                                    <p className="text-xl font-bold text-gray-800">{summary.recent_entries?.length || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isLoading && accounts.length === 0 && entries.length === 0 && (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <Loading />
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
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Ledger: Accounts + Entries together (like Chit Fund) */}
                {!(isLoading && accounts.length === 0 && entries.length === 0) && (
                    <>
                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Ledger Accounts</h3>
                                    <p className="text-sm text-gray-600 mt-1">Opening vs current balance for each cash or bank account. Tap an account to filter entries.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAccountForm(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shrink-0"
                                >
                                    <FiPlus className="w-4 h-4" />
                                    Add Account
                                </button>
                            </div>
                        </div>

                        {accounts.length > 0 ? (
                            <div className="mb-8">
                                <div className="md:hidden space-y-3">
                                    {accounts.map((account) => {
                                        const opening = parseFloat(account.opening_balance || 0);
                                        const current = parseFloat(account.current_balance || 0);
                                        const diff = Math.abs(current - opening);
                                        const isSelected = filters.account_id === String(account.id);
                                        return (
                                            <button
                                                type="button"
                                                key={account.id}
                                                onClick={() => setFilters({
                                                    ...filters,
                                                    account_id: isSelected ? '' : String(account.id),
                                                })}
                                                className={`w-full text-left bg-white rounded-xl shadow-sm border p-4 ${isSelected ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                            >
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <p className="font-semibold text-gray-900 break-words">{account.account_name}</p>
                                                    <span className={`shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${
                                                        current > opening
                                                            ? 'bg-green-100 text-green-800'
                                                            : current < opening
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {current > opening ? 'Profit' : current < opening ? 'Loss' : 'Break-even'}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Opening</p>
                                                        <p className="font-semibold text-gray-700">{formatCurrency(opening)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Current</p>
                                                        <p className={`font-semibold ${current >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(current)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Diff</p>
                                                        <p className="font-semibold text-gray-800">{formatCurrency(diff)}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Account Name</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Opening</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Current</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Diff</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {accounts.map((account) => {
                                                const opening = parseFloat(account.opening_balance || 0);
                                                const current = parseFloat(account.current_balance || 0);
                                                const diff = Math.abs(current - opening);
                                                const isSelected = filters.account_id === String(account.id);
                                                return (
                                                    <tr
                                                        key={account.id}
                                                        className={`hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-red-50' : ''}`}
                                                        onClick={() => setFilters({
                                                            ...filters,
                                                            account_id: isSelected ? '' : String(account.id),
                                                        })}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="font-medium text-gray-900">{account.account_name}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-sm font-semibold text-gray-600">
                                                                {formatCurrency(opening)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className={`text-sm font-semibold ${current >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {formatCurrency(current)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-sm font-semibold text-gray-800">
                                                                {formatCurrency(diff)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                current > opening
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : current < opening
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                                {current > opening ? 'Profit' : current < opening ? 'Loss' : 'Break-even'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center mb-8">
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

                        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Ledger Entries</h3>
                                    <p className="text-sm text-gray-600 mt-1">Every credit and debit against your accounts</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowEntryForm(true)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shrink-0"
                                >
                                    <FiPlus className="w-4 h-4" />
                                    Add Entry
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <select
                                    value={filters.account_id}
                                    onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="">All Accounts</option>
                                    {accounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.account_name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="">All Categories</option>
                                    <option value="Loan Disbursement">Loan Disbursement</option>
                                    <option value="Collection">Collection</option>
                                    <option value="Expense">Expense</option>
                                    <option value="Income">Income</option>
                                </select>

                                <input
                                    type="date"
                                    value={filters.start_date}
                                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Start Date"
                                />

                                <input
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="End Date"
                                />
                            </div>
                        </div>

                        {entries.length > 0 ? (
                            <div>
                                <div className="md:hidden space-y-3 mb-3">
                                    {entries.map((entry) => {
                                        const amount = Math.abs(parseFloat(entry.amount || 0));
                                        const credit = isCreditEntry(entry);
                                        return (
                                            <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 break-words">{entry.account?.account_name || 'N/A'}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {entry.payment_date ? formatDate(entry.payment_date) : formatDate(entry.created_at)}
                                                        </p>
                                                    </div>
                                                    <span className={`shrink-0 text-sm font-bold ${credit ? 'text-green-600' : 'text-red-600'}`}>
                                                        {credit ? 'CR' : 'DB'} {formatCurrency(amount)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-700">
                                                    {entry.category}
                                                    {entry.subcategory ? ` (${entry.subcategory})` : ''}
                                                </p>
                                                {entry.description ? (
                                                    <p className="text-sm text-gray-500 mt-1 break-words">{entry.description}</p>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between text-sm">
                                        <span className="font-semibold text-gray-800">Total ({entries.length})</span>
                                        <div className="text-right">
                                            <p className="font-bold text-green-700">CR {formatCurrency(totalCredit)}</p>
                                            <p className="font-bold text-red-700">DB {formatCurrency(totalDebit)}</p>
                                        </div>
                                    </div>
                                </div>
                            <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Account</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">CR Amount</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">DB Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {entries.map((entry) => {
                                                const amount = Math.abs(parseFloat(entry.amount || 0));
                                                const credit = isCreditEntry(entry);
                                                return (
                                                    <tr key={entry.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm text-gray-600">
                                                                {entry.payment_date ? formatDate(entry.payment_date) : formatDate(entry.created_at)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {entry.account?.account_name || 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm text-gray-600">
                                                                {entry.category}
                                                                {entry.subcategory && (
                                                                    <span className="text-xs text-gray-500 ml-1">
                                                                        ({entry.subcategory})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-sm font-semibold text-green-600">
                                                                {credit ? formatCurrency(amount) : '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-sm font-semibold text-red-600">
                                                                {!credit ? formatCurrency(amount) : '—'}
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
                                        <tfoot className="bg-gray-50">
                                            <tr>
                                                <td colSpan="3" className="px-6 py-3 text-sm font-semibold text-gray-800">
                                                    Total ({entries.length} entries)
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-bold text-green-700">
                                                    {formatCurrency(totalCredit)}
                                                </td>
                                                <td className="px-6 py-3 text-right text-sm font-bold text-red-700">
                                                    {formatCurrency(totalDebit)}
                                                </td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">📝</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Ledger Entries</h3>
                                <p className="text-gray-600 mb-6">
                                    Record a credit or debit, or collect a payment, to see entries here
                                </p>
                                <button
                                    onClick={() => setShowEntryForm(true)}
                                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                >
                                    <FiPlus className="w-5 h-5" />
                                    Add Entry
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Add Account Modal */}
                {showAccountForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Account</h3>
                            <form onSubmit={handleCreateAccount}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Account Name
                                    </label>
                                    <input
                                        type="text"
                                        value={accountForm.account_name}
                                        onChange={(e) => setAccountForm({ ...accountForm, account_name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., CASH, PHONEPE, GPAY"
                                        required
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Opening Balance
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={accountForm.opening_balance}
                                        onChange={(e) => setAccountForm({ ...accountForm, opening_balance: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAccountForm(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                    >
                                        Create Account
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add Entry Modal */}
                {showEntryForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Entry</h3>
                            <form onSubmit={handleCreateEntry}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Account
                                    </label>
                                    <select
                                        value={entryForm.dc_ledger_accounts_id}
                                        onChange={(e) => setEntryForm({ ...entryForm, dc_ledger_accounts_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        required
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.account_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={entryForm.category}
                                        onChange={(e) => setEntryForm({ ...entryForm, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Loan Disbursement">Loan Disbursement</option>
                                        <option value="Collection">Collection</option>
                                        <option value="Expense">Expense</option>
                                        <option value="Income">Income</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Subcategory
                                    </label>
                                    <input
                                        type="text"
                                        value={entryForm.subcategory}
                                        onChange={(e) => setEntryForm({ ...entryForm, subcategory: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={entryForm.amount}
                                        onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Date
                                    </label>
                                    <input
                                        type="date"
                                        value={entryForm.payment_date}
                                        onChange={(e) => setEntryForm({ ...entryForm, payment_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">This date will be used for day book calculation</p>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={entryForm.description}
                                        onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        rows="3"
                                        placeholder="Optional description"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowEntryForm(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                    >
                                        Create Entry
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DcLedgerPage;
