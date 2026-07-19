import React, { useState, useEffect } from "react";
import { API_BASE_URL, WEBSOCKET_URL } from "../utils/apiConfig";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from "socket.io-client";
import { useLocation, useParams } from "react-router-dom";
import { useUserContext } from "../context/user_context";
import { useHistory } from "react-router-dom";
import { Winner } from "../components/Winner";
import Modal from "../components/Modal";
import { UserInfo, GroupSubscriberDetailsPopup } from "../components";
import Alert from "../components/Alert";
import { FaEdit, FaTrash, FaArrowLeft, FaGavel, FaUsers, FaClock, FaMoneyBillWave, FaTrophy, FaCalendar, FaPlay, FaStop } from 'react-icons/fa';
import { useGroupDetailsContext } from '../context/group_context';
import { toast } from 'react-toastify';

const AuctionsPage = () => {
    const history = useHistory();
    const location = useLocation();
    const chitBasePath = location.pathname.startsWith('/chit-fund/manager')
        ? '/chit-fund/manager'
        : '/chit-fund/user';
    const { user } = useUserContext();
    const { data } = useGroupDetailsContext();

    // Debug the data structure
    console.log('Full data object from context:', data);
    console.log('data?.results:', data?.results);
    console.log('data?.results?.groupAccountResult:', data?.results?.groupAccountResult);
    console.log('data?.results?.type:', data?.results?.type);

    // Fix: Use the correct data structure based on Groups component
    const groupsAccountsDetail = data?.results;
    const [isPlacingBid, setIsPlacingBid] = useState(false);

    const { groupId, nextAuctionDate } = useParams();
    const [isAuctionOpen, setIsAuctionOpen] = useState(false);
    const [bidAmount, setBidAmount] = useState("");
    const [socket, setSocket] = useState(null);
    const [auctionId, setAuctionId] = useState(null);
    const [bidList, setBidList] = useState([]);
    const [existingOpenAuction, setExistingOpenAuction] = useState(null);
    const [isSubscriberDetailsOpen, setIsSubscriberDetailsOpen] = useState(false);

    const [isexistAucModalOpen, setIsexistAucModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [alert, setAlert] = useState({ show: false, msg: "", type: "" });

    const [selectedSubscriberidForBid, setSelectedSubscriberIdForBid] = useState(null);
    const [selectedgrpSubscriberidForBid, setSelectedgrpSubscriberIdForBid] = useState(null);
    const [selectedSubscriberimageForBid, setSelectedSubscriberImageForBid] = useState(null);
    const [selectedSubscribername, setSelectedSubscribername] = useState(null);
    const [selectedSubscriberphone, setSelectedSubscriberphone] = useState(null);

    // if its fixed take auction amount and put in text box
    useEffect(() => {
        console.log('groupsAccountsDetail:', groupsAccountsDetail);
        console.log('groupsAccountsDetail?.type:', groupsAccountsDetail?.type);
        console.log('groupsAccountsDetail?.groupAccountResult:', groupsAccountsDetail?.groupAccountResult);

        // Check if data is available and has the expected structure
        if (groupsAccountsDetail?.type === 'FIXED') {
            console.log('Fixed auction detected');
            console.log('groupAccountResult:', groupsAccountsDetail.groupAccountResult);

            const pendingAuctions = groupsAccountsDetail.groupAccountResult
                ?.filter(item => item.auctionStatus === 'pending')
                .sort((a, b) => a.sno - b.sno);

            console.log('pendingAuctions:', pendingAuctions);

            if (pendingAuctions && pendingAuctions.length > 0) {
                const firstAuctionAmount = pendingAuctions[0]?.auctionAmount;
                console.log('firstAuctionAmount:', firstAuctionAmount);
                setBidAmount(firstAuctionAmount?.toString() || '');
                console.log('Bid amount set to:', firstAuctionAmount?.toString() || '');
            } else {
                console.log('No pending auctions found');
            }
        } else {
            console.log('Not a fixed auction or data not available');
            console.log('Type found:', groupsAccountsDetail?.type);
        }
    }, [groupsAccountsDetail]);

    const [auctDate, setAuctDate] = useState(() => {
        const match = window.location.pathname.match(/\/date\/nextAuctionDate=(\d{4}-\d{2}-\d{2})/);
        if (match) {
            const nextAuctionDateParam = match[1];
            return nextAuctionDateParam;
        }
    });

    const [auctionType, setAuctionType] = useState("");

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const showAlert = (show = false, type = "", msg = "") => {
        setAlert({ show, type, msg });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleOpenExistingAuctModal = () => {
        setIsexistAucModalOpen(true);
    };

    const handleCloseExistingAuctModal = () => {
        setIsexistAucModalOpen(false);
    };

    const handleOpenAuction = () => {
        console.log("Auction Open Clicked");
        if (!auctionType) {
            toast.error("Please select an auction type before proceeding.");
            return;
        }
        socket.emit("joinGroup", groupId);

        socket.emit("openAuction", {
            groupId: groupId,
            userId: user.results.userId,
            sourceSystem: "WEB",
            auctDate: auctDate,
            auctionType: auctionType,
        });

        setIsModalOpen(false);
    };

    useEffect(() => {
        const socket = io(WEBSOCKET_URL);
        setSocket(socket);

        socket.on("openAuction", (data) => {
            console.log(data);
            console.log("Received auction ID:", data.groupAccountId);
            setAuctionId(data.groupAccountId);
            socket.emit("joinAuction", data.groupAccountId);
            setIsAuctionOpen(true);
        });

        socket.on("openAuctionError", (errorData) => {
            const errorMsg = errorData?.message?.trim() || "openAuctionError.";
            toast.error(errorMsg);
            console.log("Open auction  error:", errorData.message);
        });

        socket.on("newBid", (data) => {
            console.log("new bid", data);
            setBidList((prevBidList) => [...prevBidList, data.auctionObject]);
            console.log("new bid", data);
            toast.success("New bid placed!");
            setBidAmount("");
            setIsPlacingBid(false);
        });

        socket.on("closeAuction", (winningSub) => {
            console.log(winningSub);
            console.log(winningSub.auctionroomIdentifier);
            socket.emit("leaveAuction", winningSub.auctionroomIdentifier);
            setIsAuctionOpen(false);
            setBidList([]);
        });

        socket.on("closeGroup", (winningSub) => {
            console.log(winningSub);
            socket.emit("leaveGroup", winningSub.winnerObject.groupRoomIdentifier);
            // Use the groupId from URL params instead of winningSub.winnerObject.groupId
            const currentGroupId = groupId || winningSub.winnerObject.groupId;
            history.push(`${chitBasePath}/groups/${currentGroupId}/auctions/winner/${winningSub.winnerObject.winnerAmount}/winner`, {
                winningSub: winningSub
            });
        });

        socket.on("closeAuctionError", (errorData) => {
            console.log("Auction close error:", errorData.message);
            setIsAuctionOpen(false);
            setExistingOpenAuction(null);
        });

        socket.on("bidError", (errorData) => {
            const errorMsg = errorData?.message?.trim() || "bidError.";
            toast.error(errorMsg);
            console.log("PlaceBidError:", errorData);
            setIsPlacingBid(false); // Re-enable the Place Bid button
        });

        socket.on("existsAuction", (existsAuctionId) => {
            console.log("Existing open auction ID:", existsAuctionId);
            setExistingOpenAuction(existsAuctionId);
            setAuctionId(existsAuctionId);
            setIsAuctionOpen(false);
            setIsexistAucModalOpen(true);
        });

        socket.on("existingBids", (existingBids) => {
            setBidList((prevBidList) => [...prevBidList, ...existingBids]);
            setIsAuctionOpen(true);
        });

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, []);

    const handleCloseExistingAuction = () => {
        console.log("Close existing open auction:", existingOpenAuction);
        socket.emit("closeAuction", {
            groupId: groupId,
            userId: user.results.userId,
            sourceSystem: "web",
            groupCollectedBy: groupId,
            groupAccountId: existingOpenAuction,
        });
        setExistingOpenAuction(null);
    };

    const handleResumeExistingAuction = () => {
        socket.emit("getPrevBids", existingOpenAuction);
        socket.emit("joinGroup", groupId);
        socket.emit("joinAuction", existingOpenAuction);
        console.log("start existingOpenAuction");
        console.log(existingOpenAuction);
        console.log("end existingOpenAuction");
        setIsAuctionOpen(true);
        setIsModalOpen(false);
        setIsexistAucModalOpen(false);
    };

    const toggleAuction = () => {
        if (isAuctionOpen) {
            setSelectedSubscriberIdForBid(null);
            setSelectedgrpSubscriberIdForBid(null);
            setSelectedSubscribername(null);
            setSelectedSubscriberphone(null);

            console.log(auctionId);
            socket.emit("joinAuction", auctionId);
            socket.emit("closeAuction", {
                groupId: groupId,
                userId: user.results.userId,
                sourceSystem: "WEB",
                groupCollectedBy: groupId,
                groupAccountId: auctionId,
            });
        } else if (!isAuctionOpen) {
            console.log("came from open auction");
            setIsModalOpen(true);
        }
    };

    const openSubscriberDetails = () => {
        setIsSubscriberDetailsOpen(true);
    };

    const closeRightside = () => {
        setIsSubscriberDetailsOpen(false);
    }

    const closeSubscriberDetails = (grpSubscriberId, subscriberImage, name, phone, id) => {
        if (grpSubscriberId) {
            setSelectedSubscriberIdForBid(id !== undefined ? id : null);
            setSelectedgrpSubscriberIdForBid(grpSubscriberId !== undefined ? grpSubscriberId : null);
            setSelectedSubscriberImageForBid(subscriberImage !== undefined ? subscriberImage : null);
            setSelectedSubscribername(name !== undefined ? name : null);
            setSelectedSubscriberphone(phone !== undefined ? phone : null);
        }
        setIsSubscriberDetailsOpen(false);
    };

    const handlePlaceBid = (e) => {
        if (isPlacingBid) return;

        if (!bidAmount) {
            toast.error("Please enter the amount.");
            return;
        }

        if (selectedgrpSubscriberidForBid) {
            console.log("Placing bid with amount:", bidAmount);
            console.log("from auctions", selectedgrpSubscriberidForBid);
            setIsPlacingBid(true);

            socket.emit("placeBid", {
                groupId: groupId,
                subscriberId: selectedSubscriberidForBid,
                grpSubscriberId: selectedgrpSubscriberidForBid,
                grpUserId: user.results.userId,
                sourceSystem: "Mani",
                auctDate: "2023-12-20",
                amount: bidAmount,
                groupAccountId: auctionId,
            });
        } else {
            toast.error("Please choose subscriber.");
            openSubscriberDetails();
        }
    };

    const handleBackButtonClick = () => {
        socket.emit("leaveGroup", groupId);
        history.push(`${chitBasePath}/groups/${groupId}`);
    };

    const closeSubscriberList = () => {
        setSelectedgrpSubscriberIdForBid(null);
        setSelectedSubscriberImageForBid(null);
        setSelectedSubscribername(null);
        setSelectedSubscriberphone(null);
        setSelectedSubscriberIdForBid(null);
    };

    const formatCurrency = (amount) => {
        return `₹${Number(amount).toLocaleString("en-IN")}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar />

            {/* Header Section */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={handleBackButtonClick}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        >
                            <FaArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Back to Group</span>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 text-center flex-1">Auctions</h1>
                        <div className="w-20"></div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Auction Status Card */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-custom-red to-red-600 p-6 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <FaGavel className="w-8 h-8" />
                                <div>
                                    <h2 className="text-xl font-semibold">Auction Status</h2>
                                    <p className="text-red-100">
                                        {isAuctionOpen ? 'Auction is currently active' : 'No active auction'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-red-100">Next Auction Date</p>
                                <p className="text-lg font-semibold text-white">{auctDate || 'Not set'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        {isAuctionOpen ? (
                            <div className="space-y-6">
                                {/* Selected Subscriber Card */}
                                {selectedgrpSubscriberidForBid && (
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={selectedSubscriberimageForBid || 'https://via.placeholder.com/100x100?text=U'}
                                                alt={selectedSubscribername}
                                                className="w-24 h-24 rounded-full object-cover border-2 border-blue-300"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">{selectedSubscribername}</h3>
                                                <p className="text-sm text-gray-600">{selectedSubscriberphone}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={openSubscriberDetails}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm"
                                                >
                                                    Change Subscriber
                                                </button>
                                                <button
                                                    onClick={closeSubscriberList}
                                                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Progress Bar */}
                                {isPlacingBid && (
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
                                    </div>
                                )}

                                {/* Bid Input Section */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Bid Amount
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter bid amount"
                                                value={bidAmount}
                                                onChange={(e) => setBidAmount(e.target.value)}
                                                className="w-full px-4 py-3 text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                disabled={isPlacingBid}
                                            />
                                            {bidAmount && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Current bid amount: {bidAmount}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={handlePlaceBid}
                                                disabled={isPlacingBid}
                                                className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                            >
                                                {isPlacingBid ? "Placing Bid..." : "Place Bid"}
                                            </button>
                                            <button
                                                onClick={toggleAuction}
                                                className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-200"
                                            >
                                                Close Auction
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <FaGavel className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Auction</h3>
                                <p className="text-gray-600 mb-6">Start a new auction to begin bidding</p>
                                <button
                                    onClick={toggleAuction}
                                    className="px-8 py-3 bg-custom-red text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
                                >
                                    <FaPlay className="w-4 h-4" />
                                    Open Auction
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bids List Section */}
                {bidList && bidList.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                            <div className="flex items-center gap-3">
                                <FaTrophy className="w-6 h-6" />
                                <h2 className="text-xl font-semibold">Live Bids</h2>
                                <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                                    {bidList.length} bids
                                </span>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {bidList
                                    .slice()
                                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                    .map((item, index) => {
                                        const {
                                            firstname,
                                            name,
                                            phone,
                                            user_image,
                                            user_image_from_s3,
                                            amount,
                                            created_at,
                                        } = item;

                                        const createdAtDate = new Date(created_at);
                                        const formattedTime = createdAtDate.toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                        });

                                        return (
                                            <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <img
                                                        src={user_image_from_s3 || 'https://via.placeholder.com/40x40?text=U'}
                                                        alt={name || firstname || "Bidder"}
                                                        onError={(e) => (e.target.src = "https://via.placeholder.com/40x40?text=U")}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-green-300"
                                                    />
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-900 text-sm">
                                                            {name || firstname || "Unknown"}
                                                        </h4>
                                                        <p className="text-xs text-gray-500">{phone || "No phone"}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <FaClock className="w-3 h-3" />
                                                        <span className="text-xs">{formattedTime}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <FaMoneyBillWave className="w-4 h-4 text-green-600" />
                                                        <span className="text-lg font-bold text-green-600">
                                                            {formatCurrency(amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                )}

                {/* No Bids Message */}
                {(!bidList || bidList.length === 0) && isAuctionOpen && (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                        <FaUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Bids Yet</h3>
                        <p className="text-gray-600">Be the first to place a bid!</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {isModalOpen && (
                <Modal isOpen={handleOpenModal} onClose={handleCloseModal}>
                    <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Auction Details</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Auction Date</label>
                                <input
                                    type="date"
                                    value={auctDate}
                                    onChange={(e) => setAuctDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Auction Type</label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'NORMALAUCTION', label: 'Normal Auction' },
                                        { value: 'PROFITAUCTION', label: 'Profit Auction' },
                                        { value: 'COMPANYCHIT', label: 'Company Chit' }
                                    ].map((type) => (
                                        <label key={type.value} className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="auctionType"
                                                value={type.value}
                                                checked={auctionType === type.value}
                                                onChange={() => setAuctionType(type.value)}
                                                className="text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                className="flex-1 px-4 py-2 bg-custom-red text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                                onClick={handleOpenAuction}
                            >
                                Open Auction
                            </button>
                            <button
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {isexistAucModalOpen && (
                <Modal isOpen={handleOpenExistingAuctModal} onClose={handleCloseExistingAuctModal}>
                    <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Existing Auction</h2>
                        <p className="text-gray-600 mb-6 text-center">
                            Auction ID: <strong className="text-custom-red">{existingOpenAuction}</strong>
                        </p>

                        <div className="flex gap-3">
                            <button
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                                onClick={handleCloseExistingAuction}
                            >
                                Close Auction
                            </button>
                            <button
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                                onClick={handleResumeExistingAuction}
                            >
                                Resume Auction
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Subscriber Details Popup */}
            {isSubscriberDetailsOpen && (
                <GroupSubscriberDetailsPopup
                    onClose={closeSubscriberDetails}
                    onCloseRightSide={closeRightside}
                />
            )}
        </div>
    );
};

export default AuctionsPage;
