import React, { useState, useEffect } from 'react';
import { useVehicleFinanceContext } from '../../context/vehicleFinance/VehicleFinanceContext';
import { FiPlus, FiDollarSign, FiTrendingUp, FiCalendar, FiRefreshCw, FiX } from 'react-icons/fi';
import VehicleFinanceLedgerAccountForm from '../../components/vehicleFinance/VehicleFinanceLedgerAccountForm';
import VehicleFinanceLedgerEntryForm from '../../components/vehicleFinance/VehicleFinanceLedgerEntryForm';
import VehicleFinanceDayBookTab from '../../components/vehicleFinance/VehicleFinanceDayBookTab';
import { useVfPermission } from '../../components/vehicleFinance/useVfPermission';

const VehicleFinanceLedgerPage = () => {
    const {
        ledgerAccounts,
        ledgerEntries,
        ledgerSummary,
        dayBook,
        isLoading,
        error,
        fetchLedgerAccounts,
        createLedgerAccount,
        fetchLedgerEntries,
        createLedgerEntry,
        fetchLedgerSummary,
        fetchDayBook,
        clearError
    } = useVehicleFinanceContext();
    const { canAccess } = useVfPermission();
    const canAddAccount = canAccess('vf_ledger_add_account') || canAccess('vf_ledger');
    const canAddEntry = canAccess('vf_ledger_add_entry') || canAccess('vf_ledger');
    const canViewAccounts = canAccess('vf_ledger_view_account') || canAccess('vf_ledger') || canAddAccount;
    const canViewEntries = canAccess('vf_ledger_view_entry') || canAccess('vf_ledger') || canAddEntry;
    // Explicit grant only (Owner bypasses via useVfPermission). Legacy vf_ledger expands to daybook.
    const canViewDayBook = canAccess('vf_ledger_view_daybook') || canAccess('vf_ledger');

    const [activeTab, setActiveTab] = useState('accounts');
    const [showAccountForm, setShowAccountForm] = useState(false);
    const [showEntryForm, setShowEntryForm] = useState(false);
    const [filters, setFilters] = useState({
        account_id: '',
        category: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        if (canViewAccounts) fetchLedgerAccounts();
        fetchLedgerSummary();
    }, [fetchLedgerAccounts, fetchLedgerSummary, canViewAccounts]);

    useEffect(() => {
        if (!canViewAccounts && canViewEntries && activeTab === 'accounts') {
            setActiveTab('entries');
        }
    }, [canViewAccounts, canViewEntries, activeTab]);

    useEffect(() => {
        if (!canViewDayBook && activeTab === 'daybook') {
            setActiveTab(canViewAccounts ? 'accounts' : 'entries');
        }
    }, [canViewDayBook, activeTab, canViewAccounts]);

    useEffect(() => {
        if (activeTab === 'entries' && canViewEntries) {
            fetchLedgerEntries(filters);
        }
    }, [activeTab, filters, fetchLedgerEntries, canViewEntries]);

    const handleCreateAccount = async (accountData) => {
        const result = await createLedgerAccount(accountData);
        if (result.success) {
            setShowAccountForm(false);
            fetchLedgerAccounts();
            fetchLedgerSummary();
            if (activeTab === 'daybook') {
                fetchDayBook(dayBook?.date || undefined, true);
            }
        }
    };

    const handleCreateEntry = async (entryData) => {
        const result = await createLedgerEntry(entryData);
        if (result.success) {
            setShowEntryForm(false);
            fetchLedgerEntries(filters);
            fetchLedgerSummary();
            fetchLedgerAccounts(); // Refresh to update balances
            if (activeTab === 'daybook') {
                const entryDate = entryData.payment_date || dayBook?.date;
                fetchDayBook(entryDate || undefined, true);
            }
        }
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

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vehicle Finance Ledger</h1>
                        <p className="text-sm text-gray-600 mt-1">Track accounts, entries, and day book</p>
                    </div>
                    <div className="flex gap-2">
                        {canAddAccount && (
                            <button
                                onClick={() => setShowAccountForm(true)}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <FiPlus className="w-4 h-4" />
                                Add Account
                            </button>
                        )}
                        {canAddEntry && (
                            <button
                                onClick={() => setShowEntryForm(true)}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <FiPlus className="w-4 h-4" />
                                Add Entry
                            </button>
                        )}
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
                            <div className="flex gap-4 overflow-x-auto">
                                {canViewAccounts && (
                                    <button
                                        onClick={() => setActiveTab('accounts')}
                                        className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'accounts'
                                            ? 'border-red-600 text-red-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        Ledger Accounts
                                    </button>
                                )}
                                {canViewEntries && (
                                    <button
                                        onClick={() => setActiveTab('entries')}
                                        className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'entries'
                                            ? 'border-red-600 text-red-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        Ledger Entries
                                    </button>
                                )}
                                {canViewDayBook && (
                                    <button
                                        onClick={() => setActiveTab('daybook')}
                                        className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'daybook'
                                            ? 'border-red-600 text-red-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-800'
                                            }`}
                                    >
                                        Day Book
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Loading State — day book tab has its own loader */}
                {isLoading && activeTab !== 'daybook' && (
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
                                {canAddAccount && (
                                    <button
                                        onClick={() => setShowAccountForm(true)}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                                    >
                                        <FiPlus className="w-5 h-5" />
                                        Create Your First Account
                                    </button>
                                )}
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
                                    <option value="Loan Disbursement">Loan Disbursement</option>
                                    <option value="Collection">Collection</option>
                                    <option value="Expense">Expense</option>
                                    <option value="Income">Income</option>
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
                            </div>
                        </div>

                        {/* Entries Table */}
                        {ledgerEntries.length > 0 ? (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Account</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subcategory</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">CR</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">DB</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {ledgerEntries.map((entry) => {
                                                const amount = parseFloat(entry.amount) || 0;
                                                const isCredit = amount >= 0;
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
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-sm font-semibold text-green-600">
                                                                {isCredit ? formatCurrency(Math.abs(amount)) : '—'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-sm font-semibold text-red-600">
                                                                {!isCredit ? formatCurrency(Math.abs(amount)) : '—'}
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
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">📝</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Ledger Entries</h3>
                                <p className="text-gray-600 mb-6">
                                    Create your first ledger entry to start recording financial transactions
                                </p>
                                {canAddEntry && (
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

                {/* Day Book Tab */}
                {activeTab === 'daybook' && canViewDayBook && (
                    <VehicleFinanceDayBookTab
                        dayBook={dayBook}
                        fetchDayBook={fetchDayBook}
                        isLoading={isLoading}
                    />
                )}

                {/* Modals */}
                {showAccountForm && (
                    <VehicleFinanceLedgerAccountForm
                        onClose={() => setShowAccountForm(false)}
                        onSuccess={handleCreateAccount}
                    />
                )}

                {showEntryForm && (
                    <VehicleFinanceLedgerEntryForm
                        accounts={ledgerAccounts}
                        onClose={() => setShowEntryForm(false)}
                        onSuccess={handleCreateEntry}
                    />
                )}
            </div>
        </div>
    );
};

export default VehicleFinanceLedgerPage;
