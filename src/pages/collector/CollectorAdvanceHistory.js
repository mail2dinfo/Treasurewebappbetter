import React, { useEffect, useState } from 'react';
import { FiDollarSign, FiFilter, FiX, FiRefreshCw, FiPlus, FiCheckCircle } from 'react-icons/fi';
import { useCollector } from '../../context/CollectorProvider';
import { useCollectorLedger } from '../../context/CollectorLedgerContext';
import AddAdvanceModal from '../../components/collector/AddAdvanceModal';
import loadingImage from '../../images/preloader.gif';

const CollectorAdvanceHistory = () => {
    const { user } = useCollector();
    const {
        ledgerEntries = [], // Default to empty array
        isLoading,
        error,
        fetchLedgerEntries,
        filters,
        setFilters,
    } = useCollectorLedger();

    const [showAddModal, setShowAddModal] = useState(false);

    // Get current collector's userId
    const currentCollectorId = user?.userId || user?.id;

    // Ensure ledgerEntries is always an array
    const safeledgerEntries = Array.isArray(ledgerEntries) ? ledgerEntries : [];

    const [showFilters, setShowFilters] = useState(false);
    const [showOnlyMyEntries, setShowOnlyMyEntries] = useState(false);
    const [localFilters, setLocalFilters] = useState({
        startDate: filters.startDate || '',
        endDate: filters.endDate || '',
        category: filters.category || '',
    });

    useEffect(() => {
        // Fetch ledger entries on mount with default filters (Groups + CREDIT)
        fetchLedgerEntries();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        setFilters(localFilters);
        fetchLedgerEntries(localFilters);
        setShowFilters(false);
    };

    const clearFilters = () => {
        const clearedFilters = {
            startDate: '',
            endDate: '',
            category: '',
        };
        setLocalFilters(clearedFilters);
        setFilters(clearedFilters);
        fetchLedgerEntries(clearedFilters);
        setShowFilters(false);
    };

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Calculate total advance collected
    const totalAdvance = safeledgerEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);

    // Calculate entries collected by current collector
    // Use the same logic as the table row highlighting for consistency
    const myEntries = safeledgerEntries.filter(entry =>
        entry.collectorId === currentCollectorId || entry.created_by === currentCollectorId
    );
    const myTotalAdvance = myEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);

    // Filter entries based on "Show Only My Entries" toggle
    const displayedEntries = showOnlyMyEntries ? myEntries : safeledgerEntries;


    if (isLoading && safeledgerEntries.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <img src={loadingImage} alt="Loading..." className="w-16 h-16 mx-auto mb-4" />
                    <p className="text-gray-600">Loading advance history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                            Advance Payment History
                        </h1>
                        <p className="text-gray-600">
                            View all advance payments collected from subscribers
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <FiPlus className="w-5 h-5" />
                        <span className="hidden md:inline">Record Advance</span>
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Total Advance (All Collectors) */}
                    <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm mb-1">Total Advance (All Collectors)</p>
                                <p className="text-white text-3xl font-bold">{formatCurrency(totalAdvance)}</p>
                            </div>
                            <div className="bg-white/20 p-4 rounded-full">
                                <FiDollarSign className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <p className="text-red-100 text-sm">Total Entries: <span className="font-semibold text-white">{safeledgerEntries.length}</span></p>
                        </div>
                    </div>

                    {/* My Collections */}
                    <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-100 text-sm mb-1">My Collections</p>
                                <p className="text-white text-3xl font-bold">{formatCurrency(myTotalAdvance)}</p>
                            </div>
                            <div className="bg-white/20 p-4 rounded-full">
                                <FiCheckCircle className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <p className="text-green-100 text-sm">My Entries: <span className="font-semibold text-white">{myEntries.length}</span></p>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white rounded-lg shadow mb-6 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <FiFilter className="w-5 h-5 text-gray-600" />
                                <span className="font-medium text-gray-700">Filters</span>
                                {(localFilters.startDate || localFilters.endDate || localFilters.category || showOnlyMyEntries) && (
                                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                                        Active
                                    </span>
                                )}
                            </div>

                            {/* Show Only My Entries Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showOnlyMyEntries}
                                    onChange={(e) => setShowOnlyMyEntries(e.target.checked)}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Show Only My Entries</span>
                            </label>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchLedgerEntries()}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Refresh"
                            >
                                <FiRefreshCw className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <FiFilter className="w-4 h-4" />
                                {showFilters ? 'Hide' : 'Show'} Filters
                            </button>
                        </div>
                    </div>

                    {/* Filter Inputs */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={localFilters.startDate}
                                        onChange={handleFilterChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={localFilters.endDate}
                                        onChange={handleFilterChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category Name
                                    </label>
                                    <input
                                        type="text"
                                        name="category"
                                        value={localFilters.category}
                                        onChange={handleFilterChange}
                                        placeholder="e.g., ACC MANAGER-ganesh-2025-10-10"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={applyFilters}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Apply Filters
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                                >
                                    <FiX className="w-4 h-4" />
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2">
                            <FiX className="w-5 h-5 text-red-600" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Entries List */}
                {displayedEntries.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <FiDollarSign className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Ledger Entries Found</h3>
                        <p className="text-gray-600 mb-4">
                            {showOnlyMyEntries
                                ? "You haven't recorded any entries yet."
                                : localFilters.startDate || localFilters.endDate
                                    ? "No entries found for the selected date range."
                                    : "No ledger entries have been recorded yet."}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-red-600 to-red-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Account Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Category
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                                            CR Amount
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                                            DB Amount
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            Collector
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {displayedEntries.map((entry, index) => {
                                        const isMyEntry = entry.collectorId === currentCollectorId || entry.created_by === currentCollectorId;
                                        const isCreditEntry = entry.entry_type === 'CREDIT' || entry.entryType === 'CREDIT';

                                        return (
                                            <tr
                                                key={entry.id || index}
                                                className={`hover:bg-gray-50 transition-colors ${isMyEntry ? 'bg-green-50' : ''
                                                    }`}
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    {formatDate(entry.transactedDate || entry.transacted_date)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    {entry.account_name || entry.account?.account_name || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                                        {entry.category}
                                                    </span>
                                                    {entry.subCategory && (
                                                        <div className="text-xs text-gray-500 mt-1">{entry.subCategory}</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                                    {isCreditEntry ? (
                                                        <span className="font-semibold text-green-600">
                                                            {formatCurrency(entry.amount)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                                    {!isCreditEntry ? (
                                                        <span className="font-semibold text-red-600">
                                                            {formatCurrency(entry.amount)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                                                    <div className="truncate" title={entry.description}>
                                                        {entry.description || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    {isMyEntry ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                            <FiCheckCircle className="w-3 h-3" />
                                                            You
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-600 text-xs">
                                                            {/* Extract collector name from description */}
                                                            {entry.description?.match(/Collected by (.+?)(?:\s*-|$)/)?.[1] || 'Other'}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && displayedEntries.length > 0 && (
                    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 shadow-xl">
                            <img src={loadingImage} alt="Loading..." className="w-12 h-12 mx-auto mb-4" />
                            <p className="text-gray-700">Refreshing...</p>
                        </div>
                    </div>
                )}

                {/* Add Advance Modal */}
                <AddAdvanceModal
                    isOpen={showAddModal}
                    onClose={() => {
                        setShowAddModal(false);
                        // Refresh ledger entries to show new entries at bottom
                        fetchLedgerEntries();
                    }}
                />
            </div>
        </div>
    );
};

export default CollectorAdvanceHistory;

