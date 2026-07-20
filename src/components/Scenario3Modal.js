import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useGroupDetailsContext } from '../context/group_context';
import { useCompanySubscriberContext } from '../context/companysubscriber_context';
import { User, Phone, Search, X, AlertTriangle, DollarSign, RefreshCw } from 'lucide-react';

const Scenario3Modal = ({ isOpen, onClose, subscriber, groupId, scenarioData }) => {
    const { replaceGroupSubscriber } = useGroupDetailsContext();
    const { companySubscribers, fetchCompanySubscribers } = useCompanySubscriberContext();

    const [loading, setLoading] = useState(false);
    const [, setSelectedAction] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [showSubscriberSelection, setShowSubscriberSelection] = useState(false);
    const [showReplacementConfirmation, setShowReplacementConfirmation] = useState(false);

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
    // const handleCreatePayable = async () => {
    //     setLoading(true);
    //     try {
    //         const result = await deleteGroupSubscriberWithScenario(
    //             groupId || subscriber.group_id,
    //             subscriber.subscriber_id,
    //             subscriber.group_subscriber_id,
    //             'create_payable'
    //         );

    //         if (result?.success) {
    //             toast.success(result.message || 'Refund payable created and subscriber removed');
    //             onClose();
    //         } else {
    //             toast.error(result?.message || 'Failed to create payable');
    //         }
    //     } catch (error) {
    //         console.error('Error creating payable:', error);
    //         toast.error('Error creating payable');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const handleFullReplacement = () => {
        setSelectedAction('full_replacement');
        setShowSubscriberSelection(true);
    };

    const handleSubscriberSelect = (selectedSub) => {
        setSelectedSubscriber(selectedSub);
        setShowReplacementConfirmation(true);
        setShowSubscriberSelection(false);
    };

    const handleConfirmReplacement = async () => {
        setLoading(true);
        try {
            const result = await replaceGroupSubscriber(
                groupId || subscriber.group_id,
                subscriber.subscriber_id,
                subscriber.group_subscriber_id,
                selectedSubscriber.id,
                3 // Scenario 3
            );

            if (result?.success) {
                toast.success(result.message || 'Full replacement completed successfully');
                onClose();
            } else {
                toast.error(result?.message || 'Failed to complete replacement');
            }
        } catch (error) {
            console.error('Error completing replacement:', error);
            toast.error('Error completing replacement');
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white relative">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">Complex Replacement Required</h3>
                            <p className="text-purple-100">Both receivables and receipts exist - refund required</p>
                        </div>
                        <button onClick={handleClose} className="text-white hover:text-purple-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Financial Summary */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <DollarSign size={24} className="text-purple-600" />
                            <h4 className="text-lg font-semibold text-purple-800">Financial Summary</h4>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {scenarioData?.financialSummary?.receivables || 0}
                                </div>
                                <div className="text-sm text-purple-700">Receivables</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {scenarioData?.financialSummary?.receipts || 0}
                                </div>
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
                        <p className="text-purple-700 mt-4 text-sm">
                            This subscriber has both planned receivables and actual payments. A refund must be created before removal or replacement.
                        </p>
                    </div>

                    {/* Action Selection */}
                    {!showSubscriberSelection && !showReplacementConfirmation && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Choose Action:</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Create Payable Option - DISABLED */}
                                <div className="border border-gray-200 rounded-xl p-6 bg-gray-50 opacity-60 cursor-not-allowed">
                                    <div className="flex items-center gap-3 mb-3">
                                        <RefreshCw size={20} className="text-gray-400" />
                                        <h5 className="font-semibold text-gray-500">Create Payable</h5>
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        Create a refund payable for all receipts paid and remove the subscriber.
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

                                {/* Full Replacement Option */}
                                <div className="border border-blue-200 rounded-xl p-6 hover:bg-blue-50 transition-colors cursor-pointer"
                                    onClick={handleFullReplacement}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <User size={20} className="text-blue-600" />
                                        <h5 className="font-semibold text-blue-800">Full Replacement</h5>
                                    </div>
                                    <p className="text-blue-700 text-sm">
                                        Create refund, transfer receivables to new subscriber, and replace this one.
                                    </p>
                                    <div className="mt-4">
                                        <button
                                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Full Replacement
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Company Subscriber Selection */}
                    {showSubscriberSelection && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <Search size={20} className="text-blue-600" />
                                <h4 className="text-lg font-semibold text-gray-800">Select New Subscriber</h4>
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
                                    <h4 className="text-lg font-semibold text-yellow-800">Confirm Full Replacement</h4>
                                </div>
                                <p className="text-yellow-700 mb-4">
                                    This action will:
                                </p>
                                <ul className="text-yellow-700 text-sm space-y-1 ml-4">
                                    <li>• Create a refund payable for all receipts paid</li>
                                    <li>• Transfer receivables to the new subscriber</li>
                                    <li>• Replace the current subscriber with the new one</li>
                                </ul>
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
                                    onClick={handleConfirmReplacement}
                                    disabled={loading}
                                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
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

export default Scenario3Modal;






