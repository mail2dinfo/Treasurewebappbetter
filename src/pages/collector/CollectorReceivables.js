import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiUsers, FiTrendingUp, FiArrowLeft, FiSearch, FiFilter, FiX, FiUser, FiPhone, FiCalendar, FiCreditCard, FiRefreshCw, FiGrid, FiList } from 'react-icons/fi';
import { useCollector } from '../../context/CollectorProvider';
import { useCollectorLedger } from '../../context/CollectorLedgerContext';
import loadingImage from '../../images/preloader.gif';
import CollectorPaymentModal from '../../components/collector/CollectorPaymentModal';
import { usePlatformAccess } from '../../context/platformAccess_context';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const CollectorReceivables = () => {
    const platform = usePlatformAccess();
    const enforceAccess = platform?.isAvailable
        && !platform.isOwner
        && platform.activeContext?.appCode === 'CHIT_FUND';
    const canAccess = (featureKey) => !enforceAccess || platform.hasPermission(featureKey);
    const {
        receivables,
        selectedArea,
        areaReceivables,
        isFetchingReceivables,
        error,
        fetchReceivables,
        getAreaSummary,
        getReceivablesSummary,
        user,
        isAuthenticated,
    } = useCollector();

    // Fetch ledger accounts (payment methods) for the collector
    const {
        ledgerAccounts = [],
        fetchLedgerAccounts,
        isLoading: isLoadingAccounts
    } = useCollectorLedger();

    const [showAreaDetails, setShowAreaDetails] = useState(false);

    // Filter states
    const [areaFilter, setAreaFilter] = useState("");
    const [customerFilter, setCustomerFilter] = useState("");

    // Payment modal states
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedReceivable, setSelectedReceivable] = useState(null);

    // Advance 360° modal state
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [selectedAdvanceReceivable, setSelectedAdvanceReceivable] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        fetchReceivables();
    }, [isAuthenticated, user, fetchReceivables]);

    useEffect(() => {
        if (!isAuthenticated || !user) return;

        fetchLedgerAccounts();
    }, [isAuthenticated, user, fetchLedgerAccounts]);

    // Debug logging for ledger accounts
    useEffect(() => {
        console.log('🔍 CollectorReceivables - Ledger Accounts Update:');
        console.log('  - ledgerAccounts:', ledgerAccounts);
        console.log('  - ledgerAccounts.length:', ledgerAccounts?.length);
        console.log('  - isLoadingAccounts:', isLoadingAccounts);
    }, [ledgerAccounts, isLoadingAccounts]);

    useEffect(() => {
        setCurrentPage(1);
    }, [areaFilter, customerFilter, showAreaDetails, selectedArea, pageSize]);

    const areaSummary = getAreaSummary();

    // Manual fetch function for testing
    const handleManualFetch = () => {
        console.log('🔄 Manual fetch triggered');
        fetchReceivables();
    };

    const handleBackToAreas = () => {
        setShowAreaDetails(false);
    };

    const matchesCustomerFilter = (receivable) => {
        if (!customerFilter.trim()) return true;

        const search = customerFilter.toLowerCase().trim();
        const customerName = (receivable.name || receivable.customer_name || '').toLowerCase();
        const customerPhone = (receivable.phone || receivable.customer_phone || '').toLowerCase();

        return customerName.includes(search) || customerPhone.includes(search);
    };

    const matchesAreaFilter = (receivable) => {
        if (!areaFilter.trim()) return true;
        return (receivable.aob || '').toLowerCase().includes(areaFilter.toLowerCase());
    };

    // Filter receivables based on area and customer name
    const filteredReceivables = receivables.filter((receivable) => (
        matchesAreaFilter(receivable) && matchesCustomerFilter(receivable)
    ));

    const filteredAreaReceivables = areaReceivables.filter((receivable) => (
        matchesCustomerFilter(receivable)
    ));

    // Clear all filters
    const clearFilters = () => {
        setAreaFilter("");
        setCustomerFilter("");
        setCurrentPage(1);
    };

    const getPaginationMeta = (items) => {
        const totalItems = items.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const safePage = Math.min(currentPage, totalPages);
        const startIndex = (safePage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);

        return {
            totalItems,
            totalPages,
            safePage,
            startIndex,
            endIndex,
            paginatedItems: items.slice(startIndex, endIndex),
        };
    };

    const getVisiblePageNumbers = (totalPages) => (
        Array.from({ length: totalPages }, (_, index) => index + 1)
    );

    const renderPagination = (items) => {
        const { totalItems, totalPages, safePage, startIndex, endIndex } = getPaginationMeta(items);

        if (totalItems === 0) return null;

        const pageNumbers = getVisiblePageNumbers(totalPages);

        return (
            <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600">
                        <span>
                            Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
                            <span className="font-semibold text-gray-900">{endIndex}</span> of{' '}
                            <span className="font-semibold text-gray-900">{totalItems}</span>
                        </span>
                        <div className="flex items-center gap-2">
                            <label htmlFor="collector-page-size" className="text-sm text-gray-600">Per page</label>
                            <select
                                id="collector-page-size"
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent bg-white"
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center sm:justify-end gap-1 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                disabled={safePage === 1}
                                aria-label="Previous page"
                                className={`min-w-[40px] h-10 px-3 rounded-lg text-lg font-semibold transition-colors ${safePage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                &lt;
                            </button>

                            {pageNumbers.map((pageNum) => (
                                <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-semibold transition-colors ${safePage === pageNum
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            ))}

                            <button
                                type="button"
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                disabled={safePage === totalPages}
                                aria-label="Next page"
                                className={`min-w-[40px] h-10 px-3 rounded-lg text-lg font-semibold transition-colors ${safePage === totalPages
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                &gt;
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderPaginatedReceivables = (items) => {
        const { paginatedItems } = getPaginationMeta(items);

        return (
            <>
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                        {paginatedItems.map((receivable, index) => renderReceivableGridCard(receivable, index))}
                        {renderGridSummaryFooter(items)}
                    </div>
                ) : (
                    renderReceivableList(paginatedItems, items)
                )}
                {renderPagination(items)}
            </>
        );
    };

    // Advance 360° modal handlers
    const handleOpenAdvanceModal = (receivable) => {
        setSelectedAdvanceReceivable(receivable);
        setShowAdvanceModal(true);
    };

    const handleCloseAdvanceModal = () => {
        setShowAdvanceModal(false);
        setSelectedAdvanceReceivable(null);
    };

    // Calculate advance breakdown
    const calculateAdvanceBreakdown = (receivable) => {
        const transactions = receivable?.advance_transactions || [];
        let runningBalance = 0;
        let totalCredit = 0;
        let totalDebit = 0;

        // Debug: Log original transaction order
        console.log('🔍 Collector Receivables - Original transactions from backend (chronological order):', transactions);

        // Backend sends data in chronological order (oldest first), so we can use it directly
        const chronologicalTransactions = [...transactions];

        console.log('🔍 Collector Receivables - Using chronological order for calculation:', chronologicalTransactions);

        // Calculate running balance in chronological order and store with each transaction
        const transactionsWithBalance = chronologicalTransactions.map((tx, index) => {
            const amount = parseFloat(tx.amount) || 0;
            if (tx.type === 'CREDIT') {
                runningBalance += amount;
                totalCredit += amount;
            } else if (tx.type === 'DEBIT') {
                runningBalance -= amount;
                totalDebit += amount;
            }

            console.log(`🔍 Collector Receivables - Transaction ${index + 1}: ${tx.type} ₹${amount} → Running Balance: ₹${runningBalance}`);

            return {
                ...tx,
                runningBalance: runningBalance,
                chronologicalIndex: index
            };
        });

        // Reverse for display (newest first) while preserving running balance
        const displayTransactions = transactionsWithBalance.reverse();

        console.log('🔍 Collector Receivables - Final display transactions (newest first):', displayTransactions);

        return {
            transactions: displayTransactions,
            totalCredit,
            totalDebit,
            currentBalance: runningBalance
        };
    };

    const formatCurrency = (amount) => {
        return `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;
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

    const getReceivableKey = (receivable, index) =>
        receivable.id || `${receivable.group_id || 'group'}-${receivable.auct_date || 'date'}-${index}`;

    const renderMobileSummaryFooter = (items) => {
        if (!items.length) return null;

        const totals = getReceivablesSummary(items);

        return (
            <div className="bg-gray-100 rounded-xl border-2 border-red-600 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                    Summary — {items.length} {items.length === 1 ? 'record' : 'records'}
                </p>
                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-[10px] text-blue-600 font-medium uppercase">Total Due</p>
                        <p className="text-sm font-bold text-blue-800">{formatCurrency(totals.totalDue)}</p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded-lg">
                        <p className="text-[10px] text-green-600 font-medium uppercase">Paid</p>
                        <p className="text-sm font-bold text-green-800">{formatCurrency(totals.paid)}</p>
                    </div>
                    <div className="text-center p-2 bg-red-50 rounded-lg">
                        <p className="text-[10px] text-red-600 font-medium uppercase">Balance</p>
                        <p className="text-sm font-bold text-red-800">{formatCurrency(totals.balance)}</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderDesktopSummaryRow = (items) => {
        if (!items.length) return null;

        const totals = getReceivablesSummary(items);

        return (
            <tr className="bg-gray-100 border-t-2 border-red-600">
                <td colSpan={5} className="px-4 py-4 text-sm font-semibold text-gray-900">
                    Summary — {items.length} {items.length === 1 ? 'record' : 'records'}
                </td>
                <td className="px-4 py-4 text-sm font-bold text-blue-700">
                    {formatCurrency(totals.totalDue)}
                </td>
                <td className="px-4 py-4 text-sm font-bold text-green-700">
                    {formatCurrency(totals.paid)}
                </td>
                <td className="px-4 py-4 text-sm font-bold text-red-700">
                    {formatCurrency(totals.balance)}
                </td>
                <td className="px-4 py-4" />
            </tr>
        );
    };

    const renderGridSummaryFooter = (items) => {
        if (!items.length) return null;

        const totals = getReceivablesSummary(items);

        return (
            <div className="col-span-full bg-gray-100 rounded-xl border-2 border-red-600 p-4 md:p-5">
                <p className="text-sm font-semibold text-gray-900 mb-3">
                    Summary — {items.length} {items.length === 1 ? 'record' : 'records'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Due</p>
                        <p className="text-xl font-bold text-blue-800 mt-1">{formatCurrency(totals.totalDue)}</p>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Paid</p>
                        <p className="text-xl font-bold text-green-800 mt-1">{formatCurrency(totals.paid)}</p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Balance</p>
                        <p className="text-xl font-bold text-red-800 mt-1">{formatCurrency(totals.balance)}</p>
                    </div>
                </div>
            </div>
        );
    };

    const openPaymentModal = (receivable) => {
        setSelectedReceivable(receivable);
        setModalOpen(true);
    };

    const renderViewToggle = () => (
        <div className="inline-flex w-full sm:w-auto rounded-lg border border-gray-300 overflow-hidden bg-white shadow-sm">
            <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${viewMode === 'grid'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                title="Grid view"
            >
                <FiGrid className="w-4 h-4" />
                <span>Grid</span>
            </button>
            <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-l border-gray-300 ${viewMode === 'list'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                title="List view"
            >
                <FiList className="w-4 h-4" />
                <span>List</span>
            </button>
        </div>
    );

    const renderReceivableGridCard = (receivable, index) => (
        <div key={getReceivableKey(receivable, index)} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 md:transform md:hover:-translate-y-1">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 md:p-6 text-white">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative flex-shrink-0">
                        {receivable.user_image_from_s3 || receivable.customer_image ? (
                            <img
                                src={receivable.user_image_from_s3 || receivable.customer_image}
                                alt={receivable.name || receivable.customer_name}
                                className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-white/30"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        <div
                            className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center ${receivable.user_image_from_s3 || receivable.customer_image ? 'hidden' : 'flex'}`}
                        >
                            <FiUser className="w-6 h-6 md:w-8 md:h-8 text-white" />
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg md:text-xl font-bold truncate">{receivable.name || receivable.customer_name || 'N/A'}</h3>
                        <p className="text-red-100 flex items-center gap-2 text-sm">
                            <FiPhone className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{receivable.phone || receivable.customer_phone || 'N/A'}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6">
                <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                            <FiUsers className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Group</span>
                        </div>
                        <p className="text-sm font-bold text-blue-900 truncate" title={receivable.group_name}>
                            {receivable.group_name || 'N/A'}
                        </p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                            <FiCalendar className="w-4 h-4 text-purple-600" />
                            <span className="text-xs text-purple-600 font-medium uppercase tracking-wide">Auction</span>
                        </div>
                        <p className="text-sm font-bold text-purple-900">
                            {formatDate(receivable.auct_date)}
                        </p>
                    </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiFilter className="w-4 h-4" />
                        <span className="font-medium">Area:</span>
                        <span>{receivable.aob || 'N/A'}</span>
                    </div>
                </div>

                <div
                    className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => handleOpenAdvanceModal(receivable)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">💰</span>
                            <div>
                                <p className="text-xs text-yellow-700 font-medium uppercase tracking-wide">Advance Balance</p>
                                <span className="text-xs text-yellow-600 flex items-center gap-1">
                                    Click for details <span className="text-blue-500">ℹ️</span>
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-yellow-900">
                                {formatCurrency(receivable?.total_advance_balance || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-6">
                    <div className="text-center p-2 md:p-3 bg-blue-50 rounded-lg">
                        <div className="text-[10px] md:text-xs text-blue-600 font-medium mb-1">Total Due</div>
                        <div className="text-sm md:text-lg font-bold text-blue-700">{formatCurrency(receivable.rbtotal || receivable.total_amount)}</div>
                    </div>
                    <div className="text-center p-2 md:p-3 bg-green-50 rounded-lg">
                        <div className="text-[10px] md:text-xs text-green-600 font-medium mb-1">Paid</div>
                        <div className="text-sm md:text-lg font-bold text-green-700">{formatCurrency(receivable.rbpaid || receivable.collected_amount)}</div>
                    </div>
                    <div className="text-center p-2 md:p-3 bg-red-50 rounded-lg">
                        <div className="text-[10px] md:text-xs text-red-600 font-medium mb-1">Balance</div>
                        <div className="text-sm md:text-lg font-bold text-red-700">{formatCurrency(receivable.rbdue || receivable.pending_amount)}</div>
                    </div>
                </div>

                {canAccess('chit.collector.collections') && <button
                    onClick={() => openPaymentModal(receivable)}
                    className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                    <FiDollarSign className="w-5 h-5" />
                    Process Payment
                </button>}
            </div>
        </div>
    );

    const renderReceivableMobileListCard = (receivable, index) => (
        <div
            key={getReceivableKey(receivable, index)}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
        >
            <div className="flex items-center gap-3 mb-3">
                {receivable.user_image_from_s3 || receivable.customer_image ? (
                    <img
                        src={receivable.user_image_from_s3 || receivable.customer_image}
                        alt={receivable.name || receivable.customer_name}
                        className="w-11 h-11 rounded-full object-cover border border-gray-200 flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <FiUser className="w-5 h-5 text-gray-500" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{receivable.name || receivable.customer_name || 'N/A'}</p>
                    <p className="text-sm text-gray-500 truncate">{receivable.phone || receivable.customer_phone || 'N/A'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 mb-3 text-sm">
                <div className="flex items-start gap-2 text-gray-700">
                    <FiUsers className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                    <span className="break-words"><span className="font-medium">Group:</span> {receivable.group_name || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <FiCalendar className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span><span className="font-medium">Auction:</span> {formatDate(receivable.auct_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                    <FiFilter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span><span className="font-medium">Area:</span> {receivable.aob || 'N/A'}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-[10px] text-blue-600 font-medium">Due</p>
                    <p className="text-sm font-bold text-blue-700">{formatCurrency(receivable.rbtotal || receivable.total_amount)}</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-[10px] text-green-600 font-medium">Paid</p>
                    <p className="text-sm font-bold text-green-700">{formatCurrency(receivable.rbpaid || receivable.collected_amount)}</p>
                </div>
                <div className="text-center p-2 bg-red-50 rounded-lg">
                    <p className="text-[10px] text-red-600 font-medium">Balance</p>
                    <p className="text-sm font-bold text-red-700">{formatCurrency(receivable.rbdue || receivable.pending_amount)}</p>
                </div>
            </div>

            {canAccess('chit.collector.advances') && <button
                type="button"
                onClick={() => handleOpenAdvanceModal(receivable)}
                className="w-full mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left"
            >
                <p className="text-xs text-yellow-700 font-medium uppercase tracking-wide">Advance Balance</p>
                <p className="text-lg font-bold text-yellow-900">{formatCurrency(receivable?.total_advance_balance || 0)}</p>
            </button>}

            {canAccess('chit.collector.collections') && <button
                type="button"
                onClick={() => openPaymentModal(receivable)}
                className="w-full py-3 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
            >
                <FiDollarSign className="w-5 h-5" />
                Process Payment
            </button>}
        </div>
    );

    const renderReceivableList = (items, summaryItems = items) => (
        <>
            <div className="md:hidden space-y-4">
                {items.map((receivable, index) => renderReceivableMobileListCard(receivable, index))}
                {renderMobileSummaryFooter(summaryItems)}
            </div>

            <div className="hidden md:block bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                    <thead>
                        <tr className="bg-red-600 text-white">
                            <th className="px-4 py-3 text-left text-sm font-semibold">Customer</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Group</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Auction</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Area</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Advance</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Total Due</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Paid</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Balance</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((receivable, index) => (
                            <tr
                                key={getReceivableKey(receivable, index)}
                                className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {receivable.user_image_from_s3 || receivable.customer_image ? (
                                            <img
                                                src={receivable.user_image_from_s3 || receivable.customer_image}
                                                alt={receivable.name || receivable.customer_name}
                                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                <FiUser className="w-5 h-5 text-gray-500" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-900">{receivable.name || receivable.customer_name || 'N/A'}</p>
                                            <p className="text-sm text-gray-500">{receivable.phone || receivable.customer_phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-800">{receivable.group_name || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">{formatDate(receivable.auct_date)}</td>
                                <td className="px-4 py-3 text-sm text-gray-800">{receivable.aob || 'N/A'}</td>
                                <td className="px-4 py-3">
                                    {canAccess('chit.collector.advances') && <button
                                        type="button"
                                        onClick={() => handleOpenAdvanceModal(receivable)}
                                        className="text-sm font-semibold text-yellow-700 hover:text-yellow-900 underline"
                                    >
                                        {formatCurrency(receivable?.total_advance_balance || 0)}
                                    </button>}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-blue-700">
                                    {formatCurrency(receivable.rbtotal || receivable.total_amount)}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-green-700">
                                    {formatCurrency(receivable.rbpaid || receivable.collected_amount)}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-red-700">
                                    {formatCurrency(receivable.rbdue || receivable.pending_amount)}
                                </td>
                                <td className="px-4 py-3">
                                    {canAccess('chit.collector.collections') && <button
                                        type="button"
                                        onClick={() => openPaymentModal(receivable)}
                                        className="px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                                    >
                                        <FiDollarSign className="w-4 h-4" />
                                        Pay
                                    </button>}
                                </td>
                            </tr>
                        ))}
                        {renderDesktopSummaryRow(summaryItems)}
                    </tbody>
                </table>
                </div>
            </div>
        </>
    );

    if (isFetchingReceivables && receivables.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <img src={loadingImage} alt="Loading..." className="w-20 h-20 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading receivables...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                            <FiCreditCard className="w-12 h-12 text-red-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Receivables</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={fetchReceivables}
                            className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto"
                        >
                            <FiDollarSign className="w-5 h-5" />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!receivables.length) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <FiCreditCard className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Receivables Found</h3>
                        <p className="text-gray-600 mb-4">
                            You don't have any assigned areas or receivables yet.
                        </p>
                        <p className="text-sm text-gray-500">
                            Contact your administrator to get areas assigned to your account.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Show area details view
    if (showAreaDetails && selectedArea) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-3 md:px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 md:mb-8">
                        <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 md:px-8 py-4 md:py-6 rounded-t-xl">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <button
                                        onClick={handleBackToAreas}
                                        className="flex items-center text-white/80 hover:text-white mb-3 md:mb-4 transition-colors text-sm md:text-base"
                                    >
                                        <FiArrowLeft className="h-5 w-5 mr-2" />
                                        Back to All Areas
                                    </button>
                                    <h1 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3">
                                        <FiCreditCard className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
                                        <span className="break-words">{selectedArea} - Receivables</span>
                                    </h1>
                                    <p className="text-red-100 mt-1 md:mt-2 text-sm md:text-base">{areaReceivables.length} receivables found in this area</p>
                                </div>
                                <div className="bg-white/20 rounded-lg px-4 py-2 self-start">
                                    <span className="text-white font-semibold text-lg">{areaReceivables.length}</span>
                                    <p className="text-red-100 text-sm">Total Records</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Area Summary Cards */}
                    {areaSummary[selectedArea] && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-full bg-blue-100">
                                        <FiDollarSign className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Amount</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatCurrency(areaSummary[selectedArea].totalAmount)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-full bg-green-100">
                                        <FiTrendingUp className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Collected</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(areaSummary[selectedArea].collected)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-full bg-orange-100">
                                        <FiDollarSign className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Pending</p>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {formatCurrency(areaSummary[selectedArea].pending)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-full bg-purple-100">
                                        <FiUsers className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Customers</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {areaSummary[selectedArea].count}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Receivables */}
                    {areaReceivables.length > 0 ? (
                        <>
                            <div className="mb-4">
                                {renderViewToggle()}
                            </div>
                            {filteredAreaReceivables.length > 0 ? (
                                renderPaginatedReceivables(filteredAreaReceivables)
                            ) : (
                                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No matching customers in {selectedArea}</h3>
                                    <p className="text-gray-600">Try a different customer name or clear filters.</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                                <FiCreditCard className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Receivables in {selectedArea}</h3>
                            <p className="text-gray-600">This area doesn't have any receivables at the moment.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Show main receivables view
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-3 md:px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 md:mb-8">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 px-4 md:px-8 py-4 md:py-6 rounded-t-xl">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3">
                                    <FiCreditCard className="w-6 h-6 md:w-8 md:h-8" />
                                    Collector Receivables
                                </h1>
                                <p className="text-red-100 mt-1 md:mt-2 text-sm md:text-base">Track and manage your assigned area receivables</p>
                            </div>
                            <div className="flex items-center gap-3 self-start sm:self-auto">
                                <button
                                    onClick={handleManualFetch}
                                    disabled={isFetchingReceivables}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                    title="Refresh Receivables"
                                >
                                    <FiRefreshCw className={`w-5 h-5 ${isFetchingReceivables ? 'animate-spin' : ''}`} />
                                    <span className="hidden md:inline">Refresh</span>
                                </button>
                                <div className="bg-white/20 rounded-lg px-4 py-2">
                                    <span className="text-white font-semibold text-lg">
                                        {(areaFilter || customerFilter) ? filteredReceivables.length : receivables.length}
                                    </span>
                                    <p className="text-red-100 text-sm">
                                        {(areaFilter || customerFilter) ? 'Filtered Records' : 'Total Records'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="p-4 md:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiSearch className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search by customer name"
                                    value={customerFilter}
                                    onChange={(e) => setCustomerFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200"
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FiFilter className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    value={areaFilter}
                                    onChange={(e) => setAreaFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all duration-200 appearance-none bg-white"
                                >
                                    <option value="">All Areas</option>
                                    {[...new Set(receivables.map((item) => item.aob).filter(Boolean))].map((areaName, index) => (
                                        <option key={index} value={areaName}>
                                            {areaName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                            >
                                <FiX className="w-4 h-4" />
                                Clear Filters
                            </button>
                        </div>

                        {/* Results Summary */}
                        <div className="flex flex-col gap-3 text-sm text-gray-600">
                            <span>Showing {filteredReceivables.length} of {receivables.length} receivables</span>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                                {(areaFilter || customerFilter) && (
                                    <span className="text-red-600 font-medium">Filters applied</span>
                                )}
                                {renderViewToggle()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Receivables List */}
                {filteredReceivables.length > 0 ? (
                    renderPaginatedReceivables(filteredReceivables)
                ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <FiCreditCard className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Receivables Found</h3>
                        <p className="text-gray-600 mb-4">
                            {receivables.length === 0
                                ? "You don't have any assigned areas or receivables yet."
                                : "No receivables match your current filters."}
                        </p>
                        {receivables.length > 0 && (
                            <button
                                onClick={clearFilters}
                                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Modal - Collector Specific */}
            <CollectorPaymentModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedReceivable(null);
                }}
                receivable={selectedReceivable}
                fetchReceivables={fetchReceivables}
                canManageReceipts={canAccess('chit.collector.receipts')}
            />

            {/* Advance 360° Modal */}
            {showAdvanceModal && selectedAdvanceReceivable && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 md:p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl md:text-4xl">💰</span>
                                    <div>
                                        <h3 className="text-lg md:text-xl font-bold">Advance 360° View</h3>
                                        <p className="text-xs md:text-sm text-blue-100 mt-1">
                                            {selectedAdvanceReceivable.name || selectedAdvanceReceivable.customer_name}
                                        </p>
                                        <div className="flex flex-col md:flex-row md:gap-4 mt-1">
                                            <p className="text-xs text-blue-200 flex items-center gap-1">
                                                <FiUsers className="w-3 h-3" />
                                                Group: {selectedAdvanceReceivable.group_name}
                                            </p>
                                            <p className="text-xs text-blue-200 flex items-center gap-1">
                                                <FiCalendar className="w-3 h-3" />
                                                Auction: {formatDate(selectedAdvanceReceivable.auct_date)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseAdvanceModal}
                                    className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                                >
                                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                            {(() => {
                                const breakdown = calculateAdvanceBreakdown(selectedAdvanceReceivable);
                                const { transactions, totalCredit, totalDebit, currentBalance } = breakdown;

                                return (
                                    <>
                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                                            <div className="bg-green-50 rounded-lg p-3 md:p-4 text-center border border-green-200">
                                                <p className="text-xs md:text-sm text-green-600 font-medium mb-1">Collected</p>
                                                <p className="text-base md:text-xl font-bold text-green-700">₹{totalCredit.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-3 md:p-4 text-center border border-red-200">
                                                <p className="text-xs md:text-sm text-red-600 font-medium mb-1">Utilized</p>
                                                <p className="text-base md:text-xl font-bold text-red-700">₹{totalDebit.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-3 md:p-4 text-center border border-blue-200">
                                                <p className="text-xs md:text-sm text-blue-600 font-medium mb-1">Balance</p>
                                                <p className="text-base md:text-xl font-bold text-blue-700">₹{currentBalance.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        {/* Transaction List */}
                                        <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                                            <h4 className="text-sm md:text-base font-semibold text-gray-800 mb-3 md:mb-4 flex items-center justify-between">
                                                <span>Transaction History</span>
                                                <span className="text-xs md:text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                    {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}
                                                </span>
                                            </h4>

                                            {transactions.length > 0 ? (
                                                <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto">
                                                    {transactions.map((tx, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-lg ${tx.type === 'CREDIT'
                                                                ? 'bg-green-50 border-l-4 border-green-500'
                                                                : 'bg-red-50 border-l-4 border-red-500'
                                                                }`}
                                                        >
                                                            <div className="flex-shrink-0 mt-1">
                                                                {tx.type === 'CREDIT' ? (
                                                                    <span className="text-green-600 text-lg md:text-xl">✅</span>
                                                                ) : (
                                                                    <span className="text-red-600 text-lg md:text-xl">⚡</span>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-0 mb-2">
                                                                    <span className="font-semibold text-gray-700 text-sm md:text-base">
                                                                        {new Date(tx.date).toLocaleDateString('en-IN', {
                                                                            day: '2-digit',
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </span>
                                                                    <span className={`font-bold text-base md:text-lg ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                                                                        {tx.type === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-600 text-xs md:text-sm mb-1 break-words">{tx.description}</p>
                                                                {tx.sub_category && (
                                                                    <span className="inline-block text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full mb-2">
                                                                        {tx.sub_category}
                                                                    </span>
                                                                )}
                                                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                                                    <span className="text-xs md:text-sm text-gray-500">Running Balance:</span>
                                                                    <span className="text-sm md:text-base font-semibold text-blue-600">₹{tx.runningBalance.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-8 md:py-12">
                                                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 md:mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                                                        <span className="text-3xl md:text-4xl">📊</span>
                                                    </div>
                                                    <p className="text-gray-500 text-sm md:text-base">No transactions yet</p>
                                                    <p className="text-gray-400 text-xs md:text-sm mt-1">Transactions will appear here once recorded</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
                            <button
                                onClick={handleCloseAdvanceModal}
                                className="px-4 md:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm md:text-base font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollectorReceivables;
