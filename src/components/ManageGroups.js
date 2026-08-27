import React, { useState, useMemo } from 'react';
import { useGroupsDetailsContext } from '../context/groups_context';
import { toast, ToastContainer } from 'react-toastify';
import { FiTrash2, FiAlertTriangle, FiLoader, FiSearch, FiFilter, FiX, FiGrid, FiList } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

const ManageGroups = () => {
    const { state, deleteGroup, previewDeleteGroup } = useGroupsDetailsContext();
    const { groups, isLoading, error } = state;
    const [deletingGroupId, setDeletingGroupId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [deletePreview, setDeletePreview] = useState(null);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [amountFilter, setAmountFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState('list');

    // Filter groups based on search term and amount
    const filteredGroups = useMemo(() => {
        return groups.filter(group => {
            const matchesSearch = searchTerm === '' ||
                (group.group_name && group.group_name.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesAmount = amountFilter === '' ||
                (group.amount && group.amount.toString().includes(amountFilter));

            return matchesSearch && matchesAmount;
        });
    }, [groups, searchTerm, amountFilter]);

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setAmountFilter('');
    };

    const handleDeleteClick = async (group) => {
        setSelectedGroup(group);
        setDeletePreview(null);
        setShowDeleteModal(true);
        setLoadingPreview(true);
        try {
            const preview = await previewDeleteGroup(group.id);
            setDeletePreview(preview);
        } catch (previewError) {
            toast.error(previewError.message || 'Failed to load delete preview');
            setShowDeleteModal(false);
            setSelectedGroup(null);
        } finally {
            setLoadingPreview(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedGroup) return;

        setDeletingGroupId(selectedGroup.id);
        try {
            await deleteGroup(selectedGroup.id);
            toast.success('Group deleted successfully!');
        } catch (error) {
            toast.error('Failed to delete group. Please try again.');
        } finally {
            setDeletingGroupId(null);
            setShowDeleteModal(false);
            setSelectedGroup(null);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setSelectedGroup(null);
        setDeletePreview(null);
        setLoadingPreview(false);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Manage Groups</h2>
                <p className="text-gray-600">View and manage all your groups. Delete groups to remove them permanently.</p>
            </div>

            {/* Filter Section */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <input
                                type="text"
                                placeholder="Search by group name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <FiX className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden bg-white">
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold ${
                                    viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <FiList className="h-4 w-4" /> List
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold border-l border-gray-200 ${
                                    viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <FiGrid className="h-4 w-4" /> Grid
                            </button>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <FiFilter className="h-4 w-4" />
                            <span>Filters</span>
                        </button>

                        {(searchTerm || amountFilter) && (
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter by Amount
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter amount to filter..."
                                    value={amountFilter}
                                    onChange={(e) => setAmountFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Summary */}
                {(searchTerm || amountFilter) && (
                    <div className="mt-3 text-sm text-gray-600">
                        Showing {filteredGroups.length} of {groups.length} groups
                        {searchTerm && <span> matching "{searchTerm}"</span>}
                        {amountFilter && <span> with amount containing "{amountFilter}"</span>}
                    </div>
                )}
            </div>

            {isLoading && groups.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                        <FiLoader className="animate-spin h-6 w-6 text-blue-600" />
                        <span className="text-gray-600">Loading groups...</span>
                    </div>
                </div>
            ) : filteredGroups.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {groups.length === 0 ? 'No groups found' : 'No groups match your filters'}
                    </h3>
                    <p className="text-gray-500">
                        {groups.length === 0
                            ? 'You don\'t have any groups to manage yet.'
                            : 'Try adjusting your search terms or filters.'
                        }
                    </p>
                    {groups.length > 0 && (searchTerm || amountFilter) && (
                        <button
                            onClick={clearFilters}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <div
                    className={
                        viewMode === 'grid'
                            ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
                            : 'flex flex-col gap-3'
                    }
                >
                    {filteredGroups.map((group) => (
                        <div
                            key={group.id}
                            className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${
                                viewMode === 'list' ? 'flex flex-col sm:flex-row sm:items-center gap-4 p-4' : 'p-5'
                            }`}
                        >
                            <div className={`min-w-0 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                                <div className="flex justify-between items-start gap-3 mb-3">
                                    <h3 className="text-base font-semibold text-gray-900 truncate">
                                        {group.group_name || 'Unnamed Group'}
                                    </h3>
                                    <span className={`shrink-0 px-2 py-1 text-xs font-medium rounded-full ${group.groupProgress === 'FUTURE'
                                        ? 'bg-blue-100 text-blue-800'
                                        : group.groupProgress === 'ACTIVE'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {group.groupProgress || 'Unknown'}
                                    </span>
                                </div>

                                <div className={viewMode === 'list'
                                    ? 'grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2'
                                    : 'space-y-2'}
                                >
                                    <div className="flex justify-between sm:block">
                                        <span className="text-xs text-gray-500">Amount</span>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatCurrency(group.amount || 0)}
                                        </p>
                                    </div>
                                    <div className="flex justify-between sm:block">
                                        <span className="text-xs text-gray-500">Type</span>
                                        <p className="text-sm font-medium text-gray-900">
                                            {group.type || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="flex justify-between sm:block">
                                        <span className="text-xs text-gray-500">Tenure</span>
                                        <p className="text-sm font-medium text-gray-900">
                                            {group.tenure || 0} months
                                        </p>
                                    </div>
                                    <div className="flex justify-between sm:block">
                                        <span className="text-xs text-gray-500">Members</span>
                                        <p className="text-sm font-medium text-gray-900">
                                            {group.totalMembers || 0}
                                        </p>
                                    </div>
                                    {viewMode === 'grid' && (
                                        <div className="flex justify-between">
                                            <span className="text-xs text-gray-500">Auction date</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {group.auctDate ? formatDate(group.auctDate) : 'N/A'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={viewMode === 'list' ? 'sm:w-40 flex-shrink-0' : 'pt-4 mt-4 border-t border-gray-200'}>
                                <button
                                    onClick={() => handleDeleteClick(group)}
                                    disabled={deletingGroupId === group.id}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deletingGroupId === group.id ? (
                                        <>
                                            <FiLoader className="animate-spin h-4 w-4 mr-2" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <FiTrash2 className="h-4 w-4 mr-2" />
                                            Delete Group
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedGroup && (
                <div className="fixed inset-0 bg-black/60 overflow-y-auto h-full w-full z-50 p-4">
                    <div className="relative top-10 mx-auto p-0 border w-full max-w-lg shadow-lg rounded-2xl bg-white overflow-hidden">
                        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <FiTrash2 className="h-5 w-5" />
                                Delete Group
                            </h3>
                            <button
                                type="button"
                                onClick={handleCancelDelete}
                                disabled={deletingGroupId === selectedGroup.id}
                                className="text-white/80 hover:text-white"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                                <FiAlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                                <p>
                                    Delete <strong>"{selectedGroup.group_name}"</strong> permanently.
                                    This cannot be undone.
                                </p>
                            </div>

                            {loadingPreview ? (
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                    <FiLoader className="animate-spin h-4 w-4" />
                                    Loading what will be deleted…
                                </p>
                            ) : deletePreview ? (
                                <>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                            Records that will be deleted
                                        </h4>
                                        <ul className="text-sm border border-gray-200 rounded-lg divide-y divide-gray-100">
                                            {[
                                                ['Receivables', deletePreview.will_delete?.receivables],
                                                ['Receipts', deletePreview.will_delete?.receipts],
                                                ['Payables', deletePreview.will_delete?.payables],
                                                ['Payments', deletePreview.will_delete?.payments],
                                                ['Ledger entries', deletePreview.will_delete?.ledger_entries],
                                                ['Group accounts', deletePreview.will_delete?.group_accounts],
                                                ['Group subscribers', deletePreview.will_delete?.group_subscribers],
                                                ['Earned premium', deletePreview.will_delete?.earned_premium],
                                                ['Auction bids', deletePreview.will_delete?.auction],
                                                ['Group', deletePreview.will_delete?.groups],
                                            ].map(([label, count]) => (
                                                <li key={label} className="flex justify-between px-3 py-2">
                                                    <span>{label}</span>
                                                    <span className="font-semibold">{count ?? 0}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {Array.isArray(deletePreview.ledger_accounts) && deletePreview.ledger_accounts.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                                Ledger closing balance after delete
                                            </h4>
                                            <ul className="text-sm border border-gray-200 rounded-lg divide-y divide-gray-100">
                                                {deletePreview.ledger_accounts.map((row) => (
                                                    <li key={row.ledger_account_id} className="px-3 py-2">
                                                        <div className="flex justify-between gap-3">
                                                            <span className="font-medium text-gray-800">{row.account_name}</span>
                                                            <span className="font-semibold whitespace-nowrap">
                                                                {Number(row.current_balance ?? 0).toFixed(2)} →{' '}
                                                                {Number(row.new_closing_balance ?? 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {row.entries} entries · credit {Number(row.credit_reversed ?? 0).toFixed(2)} · debit{' '}
                                                            {Number(row.debit_reversed ?? 0).toFixed(2)}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-red-600">Unable to load delete preview.</p>
                            )}

                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={handleCancelDelete}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    disabled={deletingGroupId === selectedGroup.id || loadingPreview || !deletePreview}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                    {deletingGroupId === selectedGroup.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
};

export default ManageGroups;