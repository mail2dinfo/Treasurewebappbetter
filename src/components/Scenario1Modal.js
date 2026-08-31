import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useGroupDetailsContext } from '../context/group_context';
import { useCompanySubscriberContext } from '../context/companysubscriber_context';
import { User, Phone, Search, X, AlertTriangle } from 'lucide-react';
import Loading from './Loading';

const Scenario1Modal = ({ isOpen, onClose, subscriber, groupId }) => {
    const { checkDeletionScenario, deleteGroupSubscriberWithScenario, replaceGroupSubscriber } = useGroupDetailsContext();
    const { companySubscribers, fetchCompanySubscribers } = useCompanySubscriberContext();

    const [loading, setLoading] = useState(false);
    const [scenarioData, setScenarioData] = useState(null);
    const [selectedAction, setSelectedAction] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [showSubscriberSelection, setShowSubscriberSelection] = useState(false);
    const [showReplacementConfirmation, setShowReplacementConfirmation] = useState(false);

    // Load scenario data when modal opens
    useEffect(() => {
        if (isOpen && subscriber) {
            console.log('🔄 Modal opened, loading data...');
            console.log('📊 Modal props:', { groupId, subscriber });
            console.log('📊 Subscriber object:', subscriber);
            loadScenarioData();
            fetchCompanySubscribers();
        }
    }, [isOpen, subscriber]);

    // Debug company subscribers
    useEffect(() => {
        console.log('👥 Company subscribers updated:', companySubscribers?.length || 0, 'subscribers');
        console.log('👥 Company subscribers data:', companySubscribers);
    }, [companySubscribers]);

    const loadScenarioData = async () => {
        if (!subscriber) return;

        setLoading(true);
        try {
            console.log('🔍 Loading scenario data for:', {
                groupId: groupId || subscriber.group_id,
                subscriberId: subscriber.subscriber_id,
                groupSubscriberId: subscriber.group_subscriber_id
            });

            const result = await checkDeletionScenario(
                groupId || subscriber.group_id,
                subscriber.subscriber_id,
                subscriber.group_subscriber_id
            );

            console.log('🔍 Scenario data result:', result);

            if (result.success) {
                setScenarioData(result.data);
                console.log('✅ Scenario data loaded successfully:', result.data);
            } else {
                console.error('❌ Failed to load scenario data:', result);
                toast.error(result.message || 'Failed to load scenario data');
            }
        } catch (error) {
            console.error('❌ Error loading scenario data:', error);
            console.error('❌ Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            toast.error('Error loading scenario data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!subscriber || !selectedAction) return;

        setLoading(true);
        try {
            console.log('🔍 Confirming action:', selectedAction);
            console.log('🔍 With subscriber:', subscriber);

            let result;

            if (selectedAction === 'remove_only') {
                result = await deleteGroupSubscriberWithScenario(
                    groupId || subscriber.group_id,
                    subscriber.subscriber_id,
                    subscriber.group_subscriber_id,
                    'remove_only'
                );
            } else if (selectedAction === 'replace' && selectedSubscriber) {
                result = await replaceGroupSubscriber(
                    groupId || subscriber.group_id,
                    subscriber.subscriber_id,
                    subscriber.group_subscriber_id,
                    selectedSubscriber.id
                );
            }

            console.log('🔍 Action result:', result);

            if (result?.success) {
                toast.success(result.message || 'Action completed successfully');
                onClose();
            } else {
                toast.error(result?.message || 'Action failed');
            }
        } catch (error) {
            console.error('Error performing action:', error);
            toast.error('Error performing action');
        } finally {
            setLoading(false);
        }
    };

    const handleSubscriberSelect = (companySubscriber) => {
        console.log('🔍 Selected company subscriber:', companySubscriber);
        setSelectedSubscriber(companySubscriber);
        setShowReplacementConfirmation(true);
    };

    const handleReplacementConfirm = async () => {
        if (!selectedSubscriber) return;

        setLoading(true);
        try {
            console.log('🔍 Confirming replacement with:', selectedSubscriber);

            const result = await replaceGroupSubscriber(
                groupId || subscriber.group_id,
                subscriber.subscriber_id,
                subscriber.group_subscriber_id,
                selectedSubscriber.id
            );

            console.log('🔍 Replacement result:', result);

            if (result.success) {
                toast.success(result.message || 'Subscriber replaced successfully');
                onClose();
            } else {
                toast.error(result.message || 'Failed to replace subscriber');
            }
        } catch (error) {
            console.error('Error replacing subscriber:', error);
            toast.error('Error replacing subscriber');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedAction('');
        setSelectedSubscriber(null);
        setShowSubscriberSelection(false);
        setShowReplacementConfirmation(false);
        setSearchTerm('');
        onClose();
    };

    const handleBackToSelection = () => {
        setShowReplacementConfirmation(false);
        setSelectedSubscriber(null);
    };

    // Filter company subscribers based on search term
    const filteredSubscribers = companySubscribers?.filter(sub =>
        sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.phone?.includes(searchTerm)
    ) || [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white relative">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Subscriber Management</h3>
                            <p className="text-red-100">Choose your action for this subscriber</p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white hover:text-red-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Current Subscriber Info */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <User size={20} />
                            Current Subscriber
                        </h4>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {subscriber?.user_image_from_s3 ? (
                                    <img
                                        src={subscriber.user_image_from_s3}
                                        alt={subscriber?.name || "Subscriber"}
                                        className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gray-200 border-3 border-white shadow-lg flex items-center justify-center">
                                        <User size={20} className="text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h5 className="font-bold text-lg text-gray-800">{subscriber?.name || "Unknown"}</h5>
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Phone size={14} />
                                    <span>{subscriber?.phone || "N/A"}</span>
                                </div>
                                <p className="text-xs text-gray-500">ID: {subscriber?.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Scenario Analysis */}
                    {loading && !scenarioData && (
                        <div className="text-center py-8">
                            <Loading />
                            <p className="text-gray-600">Analyzing subscriber data...</p>
                        </div>
                    )}

                    {scenarioData && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">1</span>
                                </div>
                                <h4 className="text-lg font-semibold text-green-800">Scenario 1: Safe to Delete</h4>
                            </div>
                            <p className="text-green-700 mb-4">
                                No financial records found. This subscriber can be safely removed or replaced.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-white rounded-lg p-3 border border-green-200">
                                    <p className="font-medium text-gray-700">Receivables</p>
                                    <p className="text-green-600 font-bold">{scenarioData.receivablesCount || 0}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-green-200">
                                    <p className="font-medium text-gray-700">Receipts</p>
                                    <p className="text-green-600 font-bold">{scenarioData.receiptsCount || 0}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-green-200">
                                    <p className="font-medium text-gray-700">Payables</p>
                                    <p className="text-green-600 font-bold">{scenarioData.payablesCount || 0}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Selection */}
                    {!showSubscriberSelection && !showReplacementConfirmation && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Choose Action:</h4>
                            <p className="text-sm text-gray-600 mb-4">
                                {scenarioData ? 'Scenario 1 detected - Safe to delete or replace this subscriber' : 'Loading scenario analysis...'}
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Remove Only */}
                                <button
                                    onClick={() => setSelectedAction('remove_only')}
                                    className={`p-6 rounded-xl border-2 transition-all ${selectedAction === 'remove_only'
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-200 hover:border-red-300'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${selectedAction === 'remove_only' ? 'bg-red-500' : 'bg-gray-200'
                                            }`}>
                                            <X size={20} className={selectedAction === 'remove_only' ? 'text-white' : 'text-gray-500'} />
                                        </div>
                                        <h5 className="font-bold text-gray-800 mb-2">Remove Only</h5>
                                        <p className="text-sm text-gray-600">Permanently remove this subscriber from the group</p>
                                    </div>
                                </button>

                                {/* Remove & Replace */}
                                <button
                                    onClick={() => setShowSubscriberSelection(true)}
                                    className={`p-6 rounded-xl border-2 transition-all ${selectedAction === 'replace'
                                        ? 'border-red-500 bg-red-50'
                                        : 'border-gray-200 hover:border-red-300'
                                        }`}
                                >
                                    <div className="text-center">
                                        <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${selectedAction === 'replace' ? 'bg-red-500' : 'bg-gray-200'
                                            }`}>
                                            <User size={20} className={selectedAction === 'replace' ? 'text-white' : 'text-gray-500'} />
                                        </div>
                                        <h5 className="font-bold text-gray-800 mb-2">Remove & Replace</h5>
                                        <p className="text-sm text-gray-600">Remove current and add a new subscriber</p>
                                    </div>
                                </button>
                            </div>

                            {/* Action Buttons */}
                            {selectedAction === 'remove_only' && (
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleClose}
                                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                                        disabled={loading}
                                    >
                                        {loading ? 'Processing...' : 'Confirm Removal'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Subscriber Selection */}
                    {showSubscriberSelection && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-800">Select New Subscriber</h4>
                                <button
                                    onClick={() => setShowSubscriberSelection(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative mb-4">
                                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>

                            {/* Subscribers List */}
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {filteredSubscribers.map((companySub) => (
                                    <button
                                        key={companySub.id}
                                        onClick={() => handleSubscriberSelect(companySub)}
                                        className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                {companySub.user_image_from_s3 ? (
                                                    <img
                                                        src={companySub.user_image_from_s3}
                                                        alt={companySub.name}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-gray-200 flex items-center justify-center">
                                                        <User size={16} className="text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="font-medium text-gray-800">{companySub.name || 'Unknown'}</h5>
                                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                                    <Phone size={12} />
                                                    <span>{companySub.phone || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {filteredSubscribers.length === 0 && (
                                    <p className="text-center text-gray-500 py-4">No subscribers found</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Replacement Confirmation */}
                    {showReplacementConfirmation && selectedSubscriber && (
                        <div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle size={20} className="text-yellow-600" />
                                    <h4 className="text-lg font-semibold text-yellow-800">Confirm Replacement</h4>
                                </div>
                                <p className="text-yellow-700 mb-4">
                                    This action will transfer all financial commitments from the current subscriber to the new one.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Current Subscriber */}
                                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                                    <h5 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                                        <X size={16} />
                                        To be Removed
                                    </h5>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            {subscriber?.user_image_from_s3 ? (
                                                <img
                                                    src={subscriber.user_image_from_s3}
                                                    alt={subscriber?.name || "Subscriber"}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-md flex items-center justify-center">
                                                    <User size={16} className="text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h6 className="font-medium text-gray-800">{subscriber?.name || "Unknown"}</h6>
                                            <p className="text-sm text-gray-600">{subscriber?.phone || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* New Subscriber */}
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                                    <h5 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                                        <User size={16} />
                                        New Subscriber
                                    </h5>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            {selectedSubscriber?.user_image_from_s3 ? (
                                                <img
                                                    src={selectedSubscriber.user_image_from_s3}
                                                    alt={selectedSubscriber.name}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-md flex items-center justify-center">
                                                    <User size={16} className="text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h6 className="font-medium text-gray-800">{selectedSubscriber?.name || "Unknown"}</h6>
                                            <p className="text-sm text-gray-600">{selectedSubscriber?.phone || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-6">
                                <button
                                    onClick={handleBackToSelection}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    disabled={loading}
                                >
                                    Back to Selection
                                </button>
                                <button
                                    onClick={handleReplacementConfirm}
                                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : 'Confirm Replacement'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Scenario1Modal;
