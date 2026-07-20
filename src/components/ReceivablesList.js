import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../utils/apiConfig';
import { FiUser, FiPhone, FiCalendar, FiDollarSign, FiCreditCard, FiX, FiCheck } from 'react-icons/fi';
import Modal from "./Modal";
import { useUserContext } from "../context/user_context";
import Alert from '../components/Alert';
import loadingImage from '../images/preloader.gif';


const ReceivablesList = ({ receivables, region, onFilteredCount, refreshReceivables }) => {


    const [list] = useState([]);
    const [alert, setAlert] = useState({ show: false, msg: "", type: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const { user } = useUserContext();

    const [loading, setLoading] = useState(true);

    // filter variables
    const [searchText, setSearchText] = useState('');
    const [searchLocation, setSearchLocation] = useState('');
    const [filteredPeople, setFilteredPeople] = useState([]);

    const [paymentType, setPaymentType] = useState(""); // State to track payment type (partial or full)
    const [partialAmount, setPartialAmount] = useState(""); // State to store partial payment amount
    const [paymentMethod, setPaymentMethod] = useState("");

    useEffect(() => {

        const filterPeople = () => {
            // Filter the people list based on selected aob
            const filteredByLocation = searchLocation
                ? receivables.filter(person =>
                    person.aob && person.aob.toLowerCase() === searchLocation.toLowerCase()
                )
                : receivables;

            // Filter the people list based on search text and 'name' field
            const filteredByName = filteredByLocation.filter(person =>
                person.name && person.name.toLowerCase().includes(searchText.toLowerCase()));



            // Update the filteredPeople state with the filtered result
            setFilteredPeople(filteredByName);
            onFilteredCount(filteredByName.length);
        };

        filterPeople();
    }, [receivables, searchText, searchLocation]);


    const handlePartialPayment = () => {
        setPaymentType("partial");
    };

    const handleFullPayment = () => {
        setPaymentType("full");
    };

    const handlePartialAmountChange = (e) => {
        setPartialAmount(e.target.value);
        console.log('Max mani');
        console.log(e.target.value);
    };
    const showAlert = (show = false, type = "", msg = "") => {
        setAlert({ show, type, msg });
    };


    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };
    const handleLocationChange = (e) => {
        setSearchLocation(e.target.value);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Reset any necessary state variables
        setSelectedSubscriber(null);
    };

    const handlePayButtonClick = (subscriber, e) => {

        e.preventDefault();
        setSelectedSubscriber(subscriber);

        setIsModalOpen(true);
    };
    const handlePaymentMethodChange = (e) => {
        setPaymentMethod(e.target.value);
    };

    const handlePayment = async () => {

        if (!paymentMethod) {
            showAlert(true, "danger", "Please select a payment method.");
            return;
        }

        if (!paymentType) {
            showAlert(true, "danger", "Please select a payment type.");
            return;
        }
        // If partial payment is selected, check if partial amount is provided
        if (paymentType === "partial" && partialAmount === "") {
            showAlert(true, "danger", "Please enter the partial amount.");
            return;
        }

        // Prompt user for confirmation before payment
        const isConfirmed = window.confirm("Are you sure you want to proceed with the payment?");
        if (!isConfirmed) {
            return; // User cancelled payment
        }

        let eresponseData = null;


        // Implement your payment logic here based on the selected paymentMethod
        if (paymentMethod === "Online") {
            // Process online payment
            console.log(`Online payment for ${selectedSubscriber.username} with ID ${selectedSubscriber.subscriber_id} is processed.`);

            const updatedOnlinePayementData = {
                payableReceivalbeId: selectedSubscriber.id,
                paymentMethod: paymentMethod,
                paymentStatus: "SUCCESS",
                paymentType: paymentType,
                paymentTransactionRef: "FUTURE",
                payableCode: "001",
                paymentAmount: paymentType === 'full' ? selectedSubscriber.rbdue > 0 ? selectedSubscriber.rbdue : selectedSubscriber.rbtotal : partialAmount,
                subscriberId: selectedSubscriber.subscriber_id,
                grpSubscriberId: selectedSubscriber.group_subscriber_id,
                sourceSystem: "WEB",
                type: 2,
                groupId: selectedSubscriber.group_id,
                grpAccountId: selectedSubscriber.group_account_id
            };
            console.log("check form data");
            console.log(updatedOnlinePayementData);

            const apiUrl = `${API_BASE_URL}/payments-receipts`;
            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${user?.results?.token}`, // Include the Bearer token
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatedOnlinePayementData),
                });
                console.log(response);

                if (response.ok) {
                    const responseData = await response.json();
                    console.log(responseData);
                    showAlert(true, "success", responseData.message);

                    setTimeout(() => {
                        refreshReceivables();
                    }, 2000);


                } else {
                    eresponseData = await response.json();
                    console.log(eresponseData);

                    showAlert(true, "danger", eresponseData.message);
                }
            } catch (error) {
                // Handle network or fetch error, update the message state
                showAlert(true, "danger", eresponseData.message);
            } finally {
                setLoading(false); // Hide loading bar when data fetching is complete
            }
        } else if (paymentMethod === "Cash") {
            // Process online payment
            console.log(`Online payment for ${selectedSubscriber.username} with ID ${selectedSubscriber.subscriber_id} is processed.`);

            const updatedOnlinePayementData = {

                payableReceivalbeId: selectedSubscriber.id,
                paymentMethod: paymentMethod,
                paymentStatus: "SUCCESS",
                paymentType: paymentType,
                paymentTransactionRef: "FUTURE",
                payableCode: "001",
                paymentAmount: paymentType === 'full' ? selectedSubscriber.rbdue > 0 ? selectedSubscriber.rbdue : selectedSubscriber.rbtotal : partialAmount,
                subscriberId: selectedSubscriber.subscriber_id,
                grpSubscriberId: selectedSubscriber.group_subscriber_id,
                sourceSystem: "WEB",
                type: 2,

                groupId: selectedSubscriber.group_id,
                grpAccountId: selectedSubscriber.group_account_id
            };
            console.log("check form data");
            console.log(updatedOnlinePayementData);

            const apiUrl = `${API_BASE_URL}/payments-receipts`;
            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${user?.results?.token}`, // Include the Bearer token
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(updatedOnlinePayementData),
                });
                console.log(response);

                if (response.ok) {
                    const responseData = await response.json();
                    console.log(responseData);
                    showAlert(true, "success", responseData.message);


                    setTimeout(() => {
                        refreshReceivables();
                    }, 2000);
                } else {
                    eresponseData = await response.json();
                    console.log(eresponseData);

                    showAlert(true, "danger", eresponseData.message);
                }
            } catch (error) {
                // Handle network or fetch error, update the message state
                showAlert(true, "danger", eresponseData.message);
            } finally {
                setLoading(false); // Hide loading bar when data fetching is complete
            }
            // Process cash payment
            console.log(`Cash payment for ${selectedSubscriber.username} with ID ${selectedSubscriber.subscriber_id} is processed.`);
        }


    };
    useEffect(() => {
        if (receivables && receivables.length > 0) {
            setLoading(false);
        }
    }, [receivables]);

    if (loading) {
        return (
            <>
                <img src={loadingImage} className='loading-img' alt='loding' />
                <div className="placeholder" style={{ height: '50vh' }}></div>
            </>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            id="location"
                            onChange={handleLocationChange}
                            value={searchLocation}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent transition-all duration-200 appearance-none bg-white"
                        >
                            <option value="">All Regions</option>
                            {region.map(region => (
                                <option key={region.id} value={region.aob}>{region.aob}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiUser className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="search"
                            value={searchText}
                            onChange={handleSearchChange}
                            placeholder="Enter name to search"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent transition-all duration-200"
                        />
                    </div>
                </div>
            </div>

            {/* Receivables List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPeople.map((person) => {
                    const { name, phone, user_image_from_s3, rbtotal,
                        rbpaid,
                        auct_date, group_name, unique_id, rbdue } = person;

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
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold">{name}</h3>
                                        <p className="text-red-100 flex items-center gap-2">
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
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                        <FiUser className="w-4 h-4" />
                                        <span className="font-medium">Group:</span>
                                        <span>{group_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FiCalendar className="w-4 h-4" />
                                        <span className="font-medium">Auction Date:</span>
                                        <span>{auct_date}</span>
                                    </div>
                                </div>

                                {/* Financial Summary */}
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-xs text-blue-600 font-medium mb-1">Total Due</div>
                                        <div className="text-lg font-bold text-blue-700">₹{rbtotal}</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-xs text-green-600 font-medium mb-1">Paid</div>
                                        <div className="text-lg font-bold text-green-700">₹{rbpaid}</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-xs text-red-600 font-medium mb-1">Balance</div>
                                        <div className="text-lg font-bold text-red-700">₹{rbdue}</div>
                                    </div>
                                </div>

                                {/* Pay Button */}
                                <button
                                    onClick={(e) => handlePayButtonClick(person, e)}
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
            <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                    {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}

                    {selectedSubscriber && (
                        <>
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">Payment Confirmation</h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Subscriber Info */}
                            <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="relative">
                                    {selectedSubscriber.user_image_from_s3 ? (
                                        <img
                                            src={selectedSubscriber.user_image_from_s3}
                                            alt={selectedSubscriber.username}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className={`w-16 h-16 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center ${selectedSubscriber.user_image_from_s3 ? 'hidden' : 'flex'}`}
                                    >
                                        <FiUser className="w-8 h-8 text-gray-500" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{selectedSubscriber.name}</h3>
                                    <p className="text-gray-600">Group: {selectedSubscriber.group_name}</p>
                                    <p className="text-gray-600">Phone: {selectedSubscriber.phone}</p>
                                </div>
                            </div>

                            {/* Financial Details */}
                            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FiDollarSign className="w-5 h-5 text-custom-red" />
                                    Financial Summary
                                </h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Auction Due:</span>
                                        <span className="font-semibold text-blue-600">₹{selectedSubscriber.rbtotal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Paid:</span>
                                        <span className="font-semibold text-green-600">₹{selectedSubscriber.rbpaid}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Balance:</span>
                                        <span className="font-semibold text-red-600">₹{selectedSubscriber.rbdue}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Advance:</span>
                                        <span className="font-semibold text-orange-600">₹{selectedSubscriber.pbdue || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FiCreditCard className="w-5 h-5 text-custom-red" />
                                    Payment Method
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
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
                            <div className="mb-6">
                                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                    <FiCheck className="w-5 h-5 text-custom-red" />
                                    Payment Type
                                </h4>
                                <div className="grid grid-cols-2 gap-3 mb-4">
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

                                {paymentType === "partial" && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <label htmlFor="partialAmount" className="block text-sm font-medium text-gray-700 mb-2">
                                            Enter Partial Amount:
                                        </label>
                                        <input
                                            type="number"
                                            id="partialAmount"
                                            value={partialAmount}
                                            onChange={handlePartialAmountChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent"
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handlePayment}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-custom-red to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    <FiCheck className="w-5 h-5" />
                                    Submit Payment
                                </button>
                                <button
                                    onClick={handleCloseModal}
                                    className="px-6 py-3 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ReceivablesList;