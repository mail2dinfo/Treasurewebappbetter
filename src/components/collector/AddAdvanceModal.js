import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiX, FiDollarSign, FiCalendar, FiCreditCard, FiUsers, FiCheck, FiAlertCircle, FiSearch } from 'react-icons/fi';
import { useCollector } from '../../context/CollectorProvider';
import { useCollectorLedger } from '../../context/CollectorLedgerContext';
import { useCollectorGroups } from '../../context/CollectorGroupsContext';
import { API_BASE_URL } from '../../utils/apiConfig';

/**
 * AddAdvanceModal - Record advance payments from subscribers
 * Reuses exact functionality from user app's AddEntryModal
 * Uses parent_membership_id for data, collector's userId for created_by
 */
const AddAdvanceModal = ({ isOpen, onClose }) => {
    const { user } = useCollector();
    const { ledgerAccounts, fetchLedgerEntries } = useCollectorLedger();
    const {
        groups,
        selectedGroupDetails,
        groupSubscribers,
        fetchAllGroups,
        fetchGroupById,
    } = useCollectorGroups();

    const today = new Date().toISOString().split('T')[0];

    // Form states
    const [transactedDate, setTransactedDate] = useState(today);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [collectionType, setCollectionType] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedSubscriberIds, setSelectedSubscriberIds] = useState([]);
    const [subscriberAmounts, setSubscriberAmounts] = useState({});
    const [description, setDescription] = useState('');

    // UI states
    const [isConfirming, setIsConfirming] = useState(false);
    const [tempData, setTempData] = useState(null);
    const [groupSearch, setGroupSearch] = useState('');
    const [subscriberSearch, setSubscriberSearch] = useState('');
    const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const collectionTypes = ['DAILY-COLLECTION', 'WEEKLY-COLLECTION', 'MONTHLY-COLLECTION'];

    // Fetch groups on modal open
    useEffect(() => {
        if (isOpen && groups.length === 0) {
            console.log('🔄 Modal opened - fetching groups');
            fetchAllGroups();
        }
    }, [isOpen, groups.length, fetchAllGroups]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setTransactedDate(today);
            setPaymentMethodId('');
            setCollectionType('');
            setSelectedGroupId('');
            setSelectedSubscriberIds([]);
            setSubscriberAmounts({});
            setDescription('');
            setGroupSearch('');
            setSubscriberSearch('');
            setIsConfirming(false);
            setTempData(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Handle group selection
    const handleGroupChange = async (groupId) => {
        console.log('🔄 Group selected:', groupId);
        setSelectedGroupId(groupId);
        setSelectedSubscriberIds([]);
        setSubscriberAmounts({});
        setSubscriberSearch('');

        if (groupId) {
            setIsLoadingSubscribers(true);
            await fetchGroupById(groupId);
            setIsLoadingSubscribers(false);
        }
    };

    // Handle subscriber selection (toggle checkbox)
    const handleSubscriberSelect = (subscriberId) => {
        setSelectedSubscriberIds(prev => {
            if (prev.includes(subscriberId)) {
                // Remove subscriber
                const newAmounts = { ...subscriberAmounts };
                delete newAmounts[subscriberId];
                setSubscriberAmounts(newAmounts);
                return prev.filter(id => id !== subscriberId);
            } else {
                // Add subscriber
                return [...prev, subscriberId];
            }
        });
    };

    // Handle amount change for a subscriber
    const handleAmountChange = (subscriberId, amount) => {
        setSubscriberAmounts(prev => ({
            ...prev,
            [subscriberId]: amount
        }));
    };

    // Calculate total amount
    const getTotalAmount = () => {
        return Object.values(subscriberAmounts).reduce(
            (sum, amount) => sum + (parseFloat(amount) || 0),
            0
        );
    };

    // Select All / Unselect All
    const handleSelectAll = () => {
        const filteredSubscribers = groupSubscribers.filter((sub) =>
            sub.name.toLowerCase().includes(subscriberSearch.toLowerCase())
        );

        if (selectedSubscriberIds.length === filteredSubscribers.length) {
            // Unselect all
            setSelectedSubscriberIds([]);
            setSubscriberAmounts({});
        } else {
            // Select all
            const allIds = filteredSubscribers.map(sub => sub.group_subscriber_id);  // ✅ Changed to group_subscriber_id
            setSelectedSubscriberIds(allIds);
        }
    };

    const isAllSelected = () => {
        const filteredSubscribers = groupSubscribers.filter((sub) =>
            sub.name.toLowerCase().includes(subscriberSearch.toLowerCase())
        );
        return filteredSubscribers.length > 0 && selectedSubscriberIds.length === filteredSubscribers.length;
    };

    // Handle form submit (show confirmation)
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!paymentMethodId) {
            toast.error('Please select a payment method');
            return;
        }
        if (!collectionType) {
            toast.error('Please select collection type');
            return;
        }
        if (!selectedGroupId) {
            toast.error('Please select a group');
            return;
        }
        if (selectedSubscriberIds.length === 0) {
            toast.error('Please select at least one subscriber');
            return;
        }
        if (!description.trim()) {
            toast.error('Please enter a description');
            return;
        }

        // Get parent membership ID
        const parentMembershipId = user?.userAccounts?.[0]?.parent_membership_id ||
            user?.results?.userAccounts?.[0]?.parent_membership_id;

        if (!parentMembershipId) {
            toast.error('Parent membership ID not found');
            return;
        }

        // Get collector's userId
        const collectorUserId = user?.userId || user?.id;

        // Create entries array (only subscribers with amount > 0)
        const entries = selectedSubscriberIds
            .filter(id => parseFloat(subscriberAmounts[id] || 0) > 0)
            .map(id => {
                const subscriber = groupSubscribers.find(
                    sub => String(sub.group_subscriber_id) === String(id)  // ✅ Changed to group_subscriber_id
                );

                const entryData = {
                    ledgerAccountId: paymentMethodId,
                    transactedDate: transactedDate,
                    entryType: 'CREDIT',
                    category: 'Groups',
                    subCategory: collectionType,
                    amount: parseFloat(subscriberAmounts[id]),
                    description: description, // Keep original description clean
                    subscriberId: subscriber?.subscriber_id || null,  // ✅ Keep subscriber_id for person identification
                    groupSubscriberId: id,  // ✅ Added: unique group subscriber ID for chit identification
                    subscriberName: subscriber?.name || '',
                    membershipId: parentMembershipId,  // ✅ Organization's ID
                    groupId: selectedGroupId,
                    createdBy: collectorUserId,        // ✅ Collector's userId (now supported in DB)
                    updatedBy: collectorUserId,        // ✅ Collector's userId (now supported in DB)
                };

                // Debug: Verify exact values
                console.log('🔍 Creating entry with exact values:');
                console.log('  - category:', entryData.category, '(length:', entryData.category.length, ')');
                console.log('  - entryType:', entryData.entryType);
                console.log('  - membershipId:', entryData.membershipId, '(type:', typeof entryData.membershipId, ')');
                console.log('  - description:', entryData.description);

                return entryData;
            });

        if (entries.length === 0) {
            toast.error('Please enter amounts for selected subscribers');
            return;
        }

        console.log('📋 Entries to be created:', entries);
        setTempData(entries);
        setIsConfirming(true);
    };

    // Handle confirmation (submit to backend)
    const handleConfirm = async () => {
        setIsSubmitting(true);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        try {
            const token = user?.token || user?.results?.token;

            for (let i = 0; i < tempData.length; i++) {
                const entry = tempData[i];

                try {
                    console.log(`🔄 Submitting entry ${i + 1}/${tempData.length}:`, entry);

                    const response = await fetch(`${API_BASE_URL}/ledger/entry`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(entry),
                    });

                    const responseData = await response.json();
                    console.log(`📡 Response for entry ${i + 1}:`, responseData);
                    console.log(`📡 Response status: ${response.status}, OK: ${response.ok}`);

                    if (response.ok) {
                        successCount++;
                        console.log(`✅ Entry ${i + 1} created successfully`);
                        console.log(`  - Subscriber: ${entry.subscriberName}`);
                        console.log(`  - Amount: ${entry.amount}`);
                        console.log(`  - Category: ${entry.category}`);
                        console.log(`  - Entry Type: ${entry.entryType}`);
                        console.log(`  - Membership ID: ${entry.membershipId}`);
                    } else {
                        errorCount++;
                        errors.push(`${entry.subscriberName}: ${responseData.message || 'Failed'}`);
                        console.log(`❌ Entry ${i + 1} failed:`, responseData.message);
                    }
                } catch (error) {
                    errorCount++;
                    errors.push(`${entry.subscriberName}: ${error.message}`);
                }
            }

            console.log('📊 Submission Summary:');
            console.log(`  - Success: ${successCount}`);
            console.log(`  - Failed: ${errorCount}`);
            console.log(`  - Total attempted: ${tempData.length}`);

            if (successCount > 0) {
                // Refresh ledger entries to show new entries at bottom
                console.log('✅ Refreshing ledger entries to show new data');
                console.log('✅ Created entries with:');
                console.log('  - category: Groups');
                console.log('  - entryType: CREDIT');
                console.log('  - membershipId:', tempData[0]?.membershipId);

                // Wait a bit for backend to process, then refresh
                setTimeout(() => {
                    fetchLedgerEntries();
                }, 500);

                if (errorCount > 0) {
                    toast.warning(`Successfully recorded ${successCount} entries. ${errorCount} failed.`);
                    console.log('⚠️ Failed entries:', errors);
                } else {
                    toast.success(`Successfully recorded ${successCount} advance payments! Check the list below.`);
                }

                // Auto-close after 3 seconds (give time to see the success message)
                setTimeout(() => {
                    handleClose();
                }, 3000);
            } else {
                toast.error('No entries were recorded successfully');
                console.log('❌ All entries failed:', errors);
            }
        } catch (error) {
            console.error('❌ Unexpected error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle close (reset all states)
    const handleClose = () => {
        setTransactedDate(today);
        setPaymentMethodId('');
        setCollectionType('');
        setSelectedGroupId('');
        setSelectedSubscriberIds([]);
        setSubscriberAmounts({});
        setDescription('');
        setGroupSearch('');
        setSubscriberSearch('');
        setIsConfirming(false);
        setTempData(null);
        setIsSubmitting(false);
        onClose();
    };

    const formatCurrency = (amt) => `₹${Number(amt).toLocaleString('en-IN')}`;

    // Filter groups by search
    const filteredGroups = groups.filter(group =>
        group.group_name.toLowerCase().includes(groupSearch.toLowerCase())
    );

    // Filter subscribers by search
    const filteredSubscribers = groupSubscribers.filter(sub =>
        sub.name.toLowerCase().includes(subscriberSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            {/* Loading Overlay */}
            {isSubmitting && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
                    <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                        <p className="text-gray-600">Submitting entries...</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Record Advance Payment</h2>
                        <p className="text-red-100 text-sm mt-1">Collect advance from subscribers</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
                    {isConfirming ? (
                        /* Confirmation Screen */
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <FiAlertCircle className="w-8 h-8 text-yellow-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Confirm Advance Entries</h3>
                                <p className="text-gray-600">Please review the details before submitting</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-600">Date:</span>
                                        <p className="text-gray-800">{transactedDate}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Payment Method:</span>
                                        <p className="text-gray-800">
                                            {ledgerAccounts.find(acc => acc.id === paymentMethodId)?.account_name || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Collection Type:</span>
                                        <p className="text-gray-800">{collectionType}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Group:</span>
                                        <p className="text-gray-800">{selectedGroupDetails?.groupName || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-200">
                                    <h4 className="font-medium text-gray-800 mb-3">
                                        Subscriber Entries ({tempData?.length || 0})
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                        {tempData?.map((entry, index) => {
                                            const subscriber = groupSubscribers.find(sub => String(sub.group_subscriber_id) === String(entry.groupSubscriberId));  // ✅ Changed to group_subscriber_id
                                            return (
                                                <div key={index} className="flex justify-between items-center py-3 px-4 bg-white rounded-lg border border-gray-200">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-gray-700 truncate">{entry.subscriberName}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {subscriber?.phone || 'N/A'}
                                                        </div>
                                                        {subscriber?.accountshare_amount && (
                                                            <div className="text-xs text-blue-600 font-semibold mt-1">
                                                                Chit: ₹{parseFloat(subscriber.accountshare_amount).toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right ml-3">
                                                        <span className="font-bold text-green-600 text-lg">
                                                            {formatCurrency(entry.amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-800 text-lg">Total Amount:</span>
                                        <span className="font-bold text-green-600 text-2xl">
                                            {formatCurrency(getTotalAmount())}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-200">
                                    <span className="font-medium text-gray-600">Description:</span>
                                    <p className="text-gray-800 mt-1">{description}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsConfirming(false)}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 px-4 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck className="w-5 h-5" />
                                            Confirm & Submit
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Payment Form */
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Transaction Date and Payment Method */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FiCalendar className="inline w-4 h-4 mr-1" />
                                        Transaction Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={transactedDate}
                                        onChange={(e) => setTransactedDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FiCreditCard className="inline w-4 h-4 mr-1" />
                                        Payment Method *
                                    </label>
                                    <select
                                        value={paymentMethodId}
                                        onChange={(e) => setPaymentMethodId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select Payment Method</option>
                                        {ledgerAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.account_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Collection Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Collection Type *
                                </label>
                                <select
                                    value={collectionType}
                                    onChange={(e) => setCollectionType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select Collection Type</option>
                                    {collectionTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Group Selection */}
                            <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                                <h4 className="font-medium text-blue-800 flex items-center gap-2">
                                    <FiUsers className="w-5 h-5" />
                                    Group & Subscribers
                                </h4>

                                {/* Group Search */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search Group
                                    </label>
                                    <div className="relative">
                                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search group by name"
                                            value={groupSearch}
                                            onChange={(e) => setGroupSearch(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Group Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Group *
                                    </label>
                                    <select
                                        value={selectedGroupId}
                                        onChange={(e) => handleGroupChange(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select Group</option>
                                        {filteredGroups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.group_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subscriber Search */}
                                {selectedGroupId && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Search Subscribers
                                        </label>
                                        <div className="relative">
                                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search subscribers"
                                                value={subscriberSearch}
                                                onChange={(e) => setSubscriberSearch(e.target.value)}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Subscribers Multi-Select */}
                                {selectedGroupId && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Select Subscribers * ({selectedSubscriberIds.length} selected)
                                            </label>
                                            {filteredSubscribers.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={handleSelectAll}
                                                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                                                    disabled={isLoadingSubscribers}
                                                >
                                                    {isAllSelected() ? 'Unselect All' : 'Select All'}
                                                </button>
                                            )}
                                        </div>

                                        {isLoadingSubscribers ? (
                                            <div className="border border-gray-300 rounded-lg p-8 text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                                                <p className="text-gray-600 text-sm">Loading subscribers...</p>
                                            </div>
                                        ) : filteredSubscribers.length === 0 ? (
                                            <div className="border border-gray-300 rounded-lg p-8 text-center">
                                                <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-600 text-sm">
                                                    {subscriberSearch ? 'No subscribers found matching your search' : 'No subscribers in this group'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="border border-gray-300 rounded-lg p-2 space-y-2 max-h-80 overflow-y-auto">
                                                {filteredSubscribers.map((subscriber) => {
                                                    const isSelected = selectedSubscriberIds.includes(subscriber.group_subscriber_id);  // ✅ Changed to group_subscriber_id
                                                    return (
                                                        <div
                                                            key={subscriber.group_subscriber_id}  // ✅ Changed to group_subscriber_id
                                                            className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                id={`sub-${subscriber.group_subscriber_id}`}  // ✅ Changed to group_subscriber_id
                                                                checked={isSelected}
                                                                onChange={() => handleSubscriberSelect(subscriber.group_subscriber_id)}  // ✅ Changed to group_subscriber_id
                                                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                                            />
                                                            <label
                                                                htmlFor={`sub-${subscriber.group_subscriber_id}`}  // ✅ Changed to group_subscriber_id
                                                                className="flex-1 text-sm font-medium text-gray-700 cursor-pointer"
                                                            >
                                                                <div>{subscriber.name}</div>
                                                                <div className="text-xs text-gray-500">{subscriber.phone}</div>
                                                                {subscriber.accountshare_amount && (
                                                                    <div className="text-xs text-blue-600 font-semibold mt-1">
                                                                        Chit: ₹{parseFloat(subscriber.accountshare_amount).toLocaleString()} ({subscriber.accountshare_percentage}%)
                                                                    </div>
                                                                )}
                                                            </label>
                                                            {isSelected && (
                                                                <input
                                                                    type="number"
                                                                    placeholder="Amount"
                                                                    value={subscriberAmounts[subscriber.group_subscriber_id] || ''}  // ✅ Changed to group_subscriber_id
                                                                    onChange={(e) => handleAmountChange(subscriber.group_subscriber_id, e.target.value)}  // ✅ Changed to group_subscriber_id
                                                                    className="w-28 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                                    min="0"
                                                                    step="0.01"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {selectedSubscriberIds.length > 0 && !isLoadingSubscribers && (
                                            <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-green-800">
                                                        Total Amount:
                                                    </span>
                                                    <span className="text-lg font-bold text-green-700">
                                                        {formatCurrency(getTotalAmount())}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-green-600 mt-1">
                                                    {selectedSubscriberIds.length} subscriber(s) selected
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    rows="3"
                                    placeholder="Enter payment details..."
                                    required
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="flex-1 py-3 px-4 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={selectedSubscriberIds.length === 0 || getTotalAmount() === 0}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiDollarSign className="w-5 h-5" />
                                    Continue
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddAdvanceModal;
