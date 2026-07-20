import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from "../context/user_context";
import { FiUser, FiPhone, FiCalendar, FiDollarSign, FiCreditCard, FiX, FiCheck } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PayablesList = ({ payables, region, onFilteredCount, refreshPayables }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchLocation, setSearchLocation] = useState('');
    const [filteredPeople, setFilteredPeople] = useState([]);
    const [paymentType, setPaymentType] = useState("");
    const [partialAmount, setPartialAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const { user } = useUserContext();

    useEffect(() => {
        const filterPeople = () => {
            const filteredByLocation = searchLocation
                ? payables.filter(person =>
                    person.aob && person.aob.toLowerCase() === searchLocation.toLowerCase()
                )
                : payables;

            const filteredByName = filteredByLocation.filter(person =>
                person.name && person.name.toLowerCase().includes(searchText.toLowerCase()));

            setFilteredPeople(filteredByName);
            onFilteredCount(filteredByName.length);
        };

        filterPeople();
    }, [payables, searchText, searchLocation, onFilteredCount]);

    const handlePartialPayment = () => {
        setPaymentType("partial");
    };

    const handleFullPayment = () => {
        setPaymentType("full");
    };

    const handlePartialAmountChange = (e) => {
        setPartialAmount(e.target.value);
    };

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    const handleLocationChange = (e) => {
        setSearchLocation(e.target.value);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSubscriber(null);
        setPaymentType("");
        setPartialAmount("");
        setPaymentMethod("");
    };

    const handlePayButtonClick = (subscriber) => {
        setSelectedSubscriber(subscriber);
        setIsModalOpen(true);
    };

    const handlePaymentMethodChange = (e) => {
        setPaymentMethod(e.target.value);
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

    const handlePayment = async () => {
        if (!paymentMethod) {
            toast.error("Please select a payment method.");
            return;
        }

        if (!paymentType) {
            toast.error("Please select a payment type.");
            return;
        }

        if (paymentType === "partial" && partialAmount === "") {
            toast.error("Please enter the partial amount.");
            return;
        }

        const isConfirmed = window.confirm("Are you sure you want to proceed with the payment?");
        if (!isConfirmed) {
            return;
        }

        setLoading(true);

        const payload = {
            payableReceivalbeId: selectedSubscriber.id,
            paymentMethod: paymentMethod,
            paymentStatus: "SUCCESS",
            paymentType: paymentType,
            paymentTransactionRef: "FUTURE",
            payableCode: "001",
            paymentAmount: paymentType === 'full'
                ? selectedSubscriber.pbdue > 0 ? selectedSubscriber.pbdue : selectedSubscriber.pytotal
                : partialAmount,
            subscriberId: selectedSubscriber.subscriber_id,
            grpSubscriberId: selectedSubscriber.group_subscriber_id,
            sourceSystem: "WEB",
            type: 1, // for payables
            groupId: selectedSubscriber.group_id,
            grpAccountId: selectedSubscriber.group_account_id
        };

        try {
            const response = await fetch(`${API_BASE_URL}/payments-receipts`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${user?.results?.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const responseData = await response.json();
                toast.success(responseData.message || "Payment processed successfully!");
                setTimeout(() => {
                    refreshPayables();
                    handleCloseModal();
                }, 2000);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "Payment failed.");
            }
        } catch (error) {
            toast.error("Network error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ToastContainer position="top-center" />

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                    <select
                        id="location"
                        onChange={handleLocationChange}
                        value={searchLocation}
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent bg-white"
                    >
                        <option value="">All Regions</option>
                        {region.map(regionItem => (
                            <option key={regionItem.id} value={regionItem.aob}>{regionItem.aob}</option>
                        ))}
                    </select>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        id="search"
                        value={searchText}
                        onChange={handleSearchChange}
                        placeholder="Enter name to search"
                        className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent"
                    />
                </div>
            </div>

            {/* Payables List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPeople.map((person) => {
                    const {
                        name,
                        phone,
                        user_image_from_s3,
                        pytotal, pbpaid, pbdue, rbdue,
                        auct_date, group_name, unique_id, payment_for
                    } = person;

                    return (
                        <div key={unique_id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-custom-red to-red-600 p-6 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        {user_image_from_s3 ? (
                                            <img
                                                src={user_image_from_s3}
                                                alt={name}
                                                className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`w-16 h-16 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center ${user_image_from_s3 ? 'hidden' : 'flex'}`}
                                        >
                                            <FiUser className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold">{name}</h3>
                                        <p className="text-red-100 flex items-center gap-1">
                                            <FiPhone className="w-4 h-4" />
                                            {phone}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6">
                                {/* Group Info */}
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                                        <FiCalendar className="w-4 h-4" />
                                        <span className="text-sm font-medium">Group Information</span>
                                    </div>
                                    <p className="text-gray-800 font-semibold">{group_name}</p>
                                    <p className="text-gray-600 text-sm">Auction: {formatDate(auct_date)}</p>
                                    {payment_for && (
                                        <p className="text-gray-600 text-sm">Payment For: {payment_for}</p>
                                    )}
                                </div>

                                {/* Financial Summary */}
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-xs text-blue-600 font-medium mb-1">Total</div>
                                        <div className="text-lg font-bold text-blue-700">{formatCurrency(pytotal || 0)}</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-xs text-green-600 font-medium mb-1">Paid</div>
                                        <div className="text-lg font-bold text-green-700">{formatCurrency(pbpaid || 0)}</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-xs text-red-600 font-medium mb-1">Due</div>
                                        <div className="text-lg font-bold text-red-700">{formatCurrency(pbdue || 0)}</div>
                                    </div>
                                </div>

                                {/* Receivable Info */}
                                {rbdue > 0 && (
                                    <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                                            <FiCreditCard className="w-4 h-4" />
                                            <span className="text-sm font-medium">Receivable Balance</span>
                                        </div>
                                        <p className="text-orange-800 font-semibold">{formatCurrency(rbdue)}</p>
                                    </div>
                                )}

                                {/* Action Button */}
                                <button
                                    onClick={() => handlePayButtonClick(person)}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-custom-red to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    <FiDollarSign className="w-5 h-5" />
                                    Process Payment
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Payment Modal */}
            {isModalOpen && selectedSubscriber && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-custom-red to-red-600 px-6 py-4 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        {selectedSubscriber.user_image_from_s3 ? (
                                            <img
                                                src={selectedSubscriber.user_image_from_s3}
                                                alt={selectedSubscriber.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`w-12 h-12 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center ${selectedSubscriber.user_image_from_s3 ? 'hidden' : 'flex'}`}
                                        >
                                            <FiUser className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{selectedSubscriber.name}</h2>
                                        <p className="text-red-100 text-sm flex items-center gap-1">
                                            <FiPhone className="w-3 h-3" />
                                            {selectedSubscriber.phone}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors duration-200"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
                            <div className="space-y-6">
                                {/* Subscriber Info */}
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold text-gray-800 mb-2">Subscriber Details</h3>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="font-medium">Group:</span> {selectedSubscriber.group_name}</p>
                                        <p><span className="font-medium">Auction Date:</span> {formatDate(selectedSubscriber.auct_date)}</p>
                                        {selectedSubscriber.payment_for && (
                                            <p><span className="font-medium">Payment For:</span> {selectedSubscriber.payment_for}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Financial Details */}
                                <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <FiDollarSign className="w-5 h-5 text-custom-red" />
                                        Financial Summary
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Payable:</span>
                                            <span className="font-semibold text-red-600">{formatCurrency(selectedSubscriber.pytotal || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Already Paid:</span>
                                            <span className="font-semibold text-green-600">{formatCurrency(selectedSubscriber.pbpaid || 0)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Amount Due:</span>
                                            <span className="font-semibold text-orange-600">{formatCurrency(selectedSubscriber.pbdue || 0)}</span>
                                        </div>
                                        {selectedSubscriber.rbdue > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Receivable Due:</span>
                                                <span className="font-semibold text-blue-600">{formatCurrency(selectedSubscriber.rbdue)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Payment Method Selection */}
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-3">Select Payment Method:</h4>
                                    <div className="space-y-2">
                                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-custom-red cursor-pointer transition-all duration-200">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="Cash"
                                                checked={paymentMethod === "Cash"}
                                                onChange={handlePaymentMethodChange}
                                                className="w-4 h-4 text-custom-red border-gray-300 focus:ring-custom-red"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">Cash Payment</span>
                                        </label>
                                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-custom-red cursor-pointer transition-all duration-200">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="Online"
                                                checked={paymentMethod === "Online"}
                                                onChange={handlePaymentMethodChange}
                                                className="w-4 h-4 text-custom-red border-gray-300 focus:ring-custom-red"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">Online Payment</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Payment Type Selection */}
                                <div>
                                    <h4 className="font-semibold text-gray-700 mb-3">Select Payment Type:</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-custom-red cursor-pointer transition-all duration-200">
                                            <input
                                                type="radio"
                                                name="paymentType"
                                                value="partial"
                                                checked={paymentType === "partial"}
                                                onChange={handlePartialPayment}
                                                className="w-4 h-4 text-custom-red border-gray-300 focus:ring-custom-red"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">Partial Payment</span>
                                        </label>
                                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-custom-red cursor-pointer transition-all duration-200">
                                            <input
                                                type="radio"
                                                name="paymentType"
                                                value="full"
                                                checked={paymentType === "full"}
                                                onChange={handleFullPayment}
                                                className="w-4 h-4 text-custom-red border-gray-300 focus:ring-custom-red"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">Full Payment</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Partial Amount Input */}
                                {paymentType === "partial" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Enter Partial Amount:</label>
                                        <input
                                            type="number"
                                            value={partialAmount}
                                            onChange={handlePartialAmountChange}
                                            placeholder="₹0.00"
                                            min="0"
                                            max={selectedSubscriber.pbdue || selectedSubscriber.pytotal}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent"
                                        />
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCloseModal}
                                        className="flex-1 py-3 px-4 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePayment}
                                        disabled={loading || !paymentMethod || !paymentType || (paymentType === "partial" && !partialAmount)}
                                        className="flex-1 py-3 px-4 bg-gradient-to-r from-custom-red to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <FiCheck className="w-5 h-5" />
                                                Submit Payment
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PayablesList;