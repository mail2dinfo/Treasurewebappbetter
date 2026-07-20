import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useGroupDetailsContext } from '../context/group_context';
import { useCompanySubscriberContext } from '../context/companysubscriber_context';
import { User, Phone, Search, X, AlertTriangle, DollarSign } from 'lucide-react';

const Scenario2Modal = ({ isOpen, onClose, subscriber, groupId, scenarioData }) => {
    const { replaceGroupSubscriber } = useGroupDetailsContext();
    const { companySubscribers, fetchCompanySubscribers } = useCompanySubscriberContext();

    const [loading, setLoading] = useState(false);
    const [, setSelectedAction] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [showSubscriberSelection, setShowSubscriberSelection] = useState(false);
    const [showReplacementConfirmation, setShowReplacementConfirmation] = useState(false);
    // COMMENTED OUT - Clear Dues confirmation state blocked for now
    // const [showClearDuesConfirmation, setShowClearDuesConfirmation] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCompanySubscribers();
        }
    }, [isOpen, fetchCompanySubscribers]);

    const filteredSubscribers = companySubscribers?.filter(sub =>
        sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.phone?.includes(searchTerm)
    ) || [];

    // COMMENTED OUT - Clear Dues functionality blocked for now
    // const handleClearDues = () => {
    //     setShowClearDuesConfirmation(true);
    // };

    // const handleConfirmClearDues = async () => {
    //     setLoading(true);
    //     try {
    //         const result = await deleteGroupSubscriberWithScenario(
    //             groupId || subscriber.group_id,
    //             subscriber.subscriber_id,
    //             subscriber.group_subscriber_id,
    //             'clear_dues'
    //         );

    //         if (result?.success) {
    //             toast.success(result.message || 'Receivables cleared and subscriber removed');
    //             onClose();
    //         } else {
    //             toast.error(result?.message || 'Failed to clear dues');
    //         }
    //     } catch (error) {
    //         console.error('Error clearing dues:', error);
    //         toast.error('Error clearing dues');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleTransferToNew = () => {
        setSelectedAction('transfer_to_new');
        setShowSubscriberSelection(true);
    };

    const handleSubscriberSelect = (selectedSub) => {
        setSelectedSubscriber(selectedSub);
        setShowReplacementConfirmation(true);
        setShowSubscriberSelection(false);
    };

    const handleConfirmTransfer = async () => {
        setLoading(true);
        try {
            const result = await replaceGroupSubscriber(
                groupId || subscriber.group_id,
                subscriber.subscriber_id,
                subscriber.group_subscriber_id,
                selectedSubscriber.id,
                2 // Scenario 2
            );

            if (result?.success) {
                toast.success(result.message || 'Receivables transferred successfully');
                onClose();
            } else {
                toast.error(result?.message || 'Failed to transfer receivables');
            }
        } catch (error) {
            console.error('Error transferring receivables:', error);
            toast.error('Error transferring receivables');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedAction('');
        setSelectedSubscriber(null);
        setShowSubscriberSelection(false);
        setShowReplacementConfirmation(false);
        // setShowClearDuesConfirmation(false);
        setSearchTerm('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white relative">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Receivables Found</h3>
                            <p className="text-orange-100">Clear dues or transfer to another subscriber</p>
                        </div>
                        <button onClick={handleClose} className="text-white hover:text-orange-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Financial Summary */}
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <DollarSign size={24} className="text-orange-600" />
                            <h4 className="text-lg font-semibold text-orange-800">Financial Summary</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {scenarioData?.financialSummary?.receivables || 0}
                                </div>
                                <div className="text-sm text-orange-700">Receivables</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">0</div>
                                <div className="text-sm text-green-700">Receipts</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">0</div>
                                <div className="text-sm text-blue-700">Payables</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">0</div>
                                <div className="text-sm text-purple-700">Payments</div>
                            </div>
                        </div>
                        <p className="text-orange-700 mt-4 text-sm">
                            This subscriber has planned receivables but no actual payments. You can safely clear the dues or transfer them to another subscriber.
                        </p>
                    </div>

                    {/* Action Selection */}
                    {!showSubscriberSelection && !showReplacementConfirmation && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Choose Action:</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Clear Dues Option - DISABLED */}
                                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 opacity-60 cursor-not-allowed">
                                    <div className="flex items-center gap-3 mb-3">
                                        <X size={20} className="text-gray-400" />
                                        <h5 className="font-semibold text-gray-500">Clear Dues</h5>
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        Remove all receivables and delete the subscriber. This action cannot be undone.
                                    </p>
                                    <div className="mt-4">
                                        <button
                                            disabled={true}
                                            className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed"
                                        >
                                            Disabled
                                        </button>
                                    </div>
                                </div>

                                {/* Transfer Option */}
                                <div className="border border-blue-200 rounded-xl p-6 hover:bg-blue-50 transition-colors cursor-pointer"
                                    onClick={handleTransferToNew}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <User size={20} className="text-blue-600" />
                                        <h5 className="font-semibold text-blue-800">Transfer to New</h5>
                                    </div>
                                    <p className="text-blue-700 text-sm">
                                        Transfer all receivables to another subscriber and replace this one.
                                    </p>
                                    <div className="mt-4">
                                        <button
                                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Transfer Receivables
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Company Subscriber Selection */}
                    {showSubscriberSelection && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Search size={20} className="text-blue-600" />
                                    <h4 className="text-lg font-semibold text-gray-800">Select New Subscriber</h4>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowSubscriberSelection(false);
                                        setSelectedAction('');
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    <X size={16} />
                                    Back
                                </button>
                            </div>

                            <div className="relative mb-4">
                                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name or phone..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {filteredSubscribers.map((sub) => (
                                    <div
                                        key={sub.id}
                                        onClick={() => handleSubscriberSelect(sub)}
                                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                                    >
                                        <div className="relative">
                                            {sub.user_image_from_s3 ? (
                                                <img
                                                    src={sub.user_image_from_s3}
                                                    alt={sub.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <User size={16} className="text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h6 className="font-medium text-gray-800">{sub.name || 'Unknown'}</h6>
                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                <Phone size={12} />
                                                {sub.phone || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Replacement Confirmation */}
                    {showReplacementConfirmation && selectedSubscriber && (
                        <div className="space-y-6">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle size={20} className="text-yellow-600" />
                                    <h4 className="text-lg font-semibold text-yellow-800">Confirm Transfer</h4>
                                </div>
                                <p className="text-yellow-700 mb-4">
                                    This action will transfer all receivables from the current subscriber to the new one.
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
                                            <h6 className="font-medium text-gray-800">{selectedSubscriber.name || "Unknown"}</h6>
                                            <p className="text-sm text-gray-600">{selectedSubscriber.phone || "N/A"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowReplacementConfirmation(false);
                                        setSelectedSubscriber(null);
                                        setShowSubscriberSelection(true);
                                    }}
                                    className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleConfirmTransfer}
                                    disabled={loading}
                                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Transferring...' : 'Confirm Transfer'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* COMMENTED OUT - Clear Dues Confirmation blocked for now */}
                    {/* {showClearDuesConfirmation && (
                        <div className="space-y-6">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle size={20} className="text-red-600" />
                                    <h4 className="text-lg font-semibold text-red-800">Confirm Clear Dues</h4>
                                </div>
                                <p className="text-red-700 mb-4">
                                    This action will permanently delete all receivables and remove the subscriber. This cannot be undone.
                                </p>

                                <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
                                    <h5 className="font-semibold text-gray-800 mb-2">Subscriber to be removed:</h5>
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

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                    <p className="text-yellow-800 text-sm">
                                        <strong>Warning:</strong> This will delete {scenarioData?.financialSummary?.receivables || 0} receivables permanently.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowClearDuesConfirmation(false)}
                                    className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmClearDues}
                                    disabled={loading}
                                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Clearing...' : 'Confirm Clear Dues'}
                                </button>
                            </div>
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    );
};

export default Scenario2Modal;


