import React, { useState, useEffect } from 'react';
import { useDcLedgerContext } from '../../context/dailyCollection/dcLedgerContext';
import DayBookTab from './DayBookTab';
import { FiPlus, FiDollarSign, FiTrendingUp, FiCalendar, FiRefreshCw } from 'react-icons/fi';

const DcLedgerPage = () => {
    const {
        accounts,
        entries,
        summary,
        dayBook,
        isLoading,
        error,
        fetchAccounts,
        createAccount,
        fetchEntries,
        createEntry,
        fetchSummary,
        fetchDayBook,
        clearError
    } = useDcLedgerContext();

    const [activeTab, setActiveTab] = useState('accounts');
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
        if (activeTab === 'entries') {
            fetchEntries(filters);
        }
        // Day book is loaded separately by DayBookTab component
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, filters]);

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

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">DC Ledger Management</h1>
                        <p className="text-sm text-gray-600 mt-1">Track accounts, entries, and financial transactions</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAccountForm(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
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
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FiDollarSign className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Total Balance</p>
                                    <p className="text-xl font-bold text-gray-800">{formatCurrency(summary.total_balance)}</p>
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

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setActiveTab('accounts')}
                                className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'accounts'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Ledger Accounts
                            </button>
                            <button
                                onClick={() => setActiveTab('entries')}
                                className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'entries'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Ledger Entries
                            </button>
                            <button
                                onClick={() => setActiveTab('daybook')}
                                className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'daybook'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Day Book
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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

                {/* Accounts Tab */}
                {activeTab === 'accounts' && !isLoading && (
                    <>
                        {/* Accounts Header with Add Button */}
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Ledger Accounts</h3>
                                    <p className="text-sm text-gray-600 mt-1">Manage your financial accounts</p>
                                </div>
                                <button
                                    onClick={() => setShowAccountForm(true)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <FiPlus className="w-4 h-4" />
                                    Add Account
                                </button>
                            </div>
                        </div>

                        {/* Accounts Table */}
                        {accounts.length > 0 ? (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Account Name</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Opening Balance</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Current Balance</th>
                                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Created Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {accounts.map((account) => (
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
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
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
                            <div className="flex flex-wrap gap-4">
                                <select
                                    value={filters.account_id}
                                    onChange={(e) => setFilters({ ...filters, account_id: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="Start Date"
                                />

                                <input
                                    type="date"
                                    value={filters.end_date}
                                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                    placeholder="End Date"
                                />
                            </div>
                        </div>

                        {/* Entries Table */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800">Ledger Entries</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Account</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {entries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
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
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600">
                                                        {entry.description || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`text-sm font-semibold ${parseFloat(entry.amount) >= 0
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                        }`}>
                                                        {formatCurrency(entry.amount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(entry.created_at)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Day Book Tab */}
                {activeTab === 'daybook' && (
                    <DayBookTab dayBook={dayBook} fetchDayBook={fetchDayBook} />
                )}

                {/* Add Account Modal */}
                {showAccountForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
