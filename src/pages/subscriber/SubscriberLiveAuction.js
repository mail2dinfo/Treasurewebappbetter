import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useSubscriberContext } from '../../context/subscriber/SubscriberContext';
import io from 'socket.io-client';
import { WEBSOCKET_URL } from '../../utils/apiConfig';
import { toast } from 'react-toastify';

const SubscriberLiveAuction = () => {
    const { groupId, grpSubId } = useParams();
    const history = useHistory();
    const { user, groupDetails, fetchGroupDetails } = useSubscriberContext();

    console.log('SubscriberLiveAuction loaded with:', { groupId, grpSubId, groupDetails, user });

    // Extract parameters exactly like mobile app
    const subscriberId = user?.subscriberId || user?.userId || '';
    const groupAccountId = groupDetails?.groupAccountId || '';
    const grpUserId = groupDetails?.groupUserId || '';
    const groupSubscriberId = parseInt(grpSubId) || 0;
    const auctDate = groupDetails?.auctionDate ? groupDetails.auctionDate.split('T')[0] : '';
    const bidStatus = groupDetails?.bidStatus || '';
    const amount = groupDetails?.amount || '';

    console.log('Extracted parameters:', {
        subscriberId,
        groupAccountId,
        grpUserId,
        groupSubscriberId,
        auctDate,
        bidStatus,
        amount
    });

    const [bidAmount, setBidAmount] = useState('');
    const [bidList, setBidList] = useState([]);
    const [isPlacingBid, setIsPlacingBid] = useState(false);
    const [, setAuctionStatus] = useState('OPEN');
    const [winnerData, setWinnerData] = useState(null);
    const [, setIsLoading] = useState(false);
    const [isBidDisabled, setIsBidDisabled] = useState(false);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (groupId && grpSubId) {
            fetchGroupDetails(groupId, grpSubId);
        }
    }, [groupId, grpSubId]);

    // Check if bid is disabled based on bidStatus (matching mobile app)
    useEffect(() => {
        console.log('BidStatus useEffect triggered:', bidStatus);
        if (bidStatus && bidStatus.toLowerCase() === 'bidtaken') {
            console.log('Setting bid as disabled because bidStatus is bidtaken');
            setIsBidDisabled(true);
        } else {
            console.log('Setting bid as enabled because bidStatus is not bidtaken:', bidStatus);
            setIsBidDisabled(false);
        }
    }, [bidStatus]);

    // Debug: Monitor bidList changes
    useEffect(() => {
        console.log('=== BID LIST STATE CHANGED ===');
        console.log('New bidList length:', bidList.length);
        console.log('New bidList:', bidList);
        console.log('=============================');
    }, [bidList]);

    // Setup WebSocket exactly like mobile app AuctionActivity
    useEffect(() => {
        if (groupAccountId) {
            console.log('=== SETTING UP WEBSOCKET (MOBILE APP PATTERN) ===');
            console.log('Group Account ID:', groupAccountId);
            console.log('WebSocket URL:', WEBSOCKET_URL);

            // Use the same socket from DataHelper.webSocket (like mobile app)
            const newSocket = io(WEBSOCKET_URL, {
                transports: ['websocket'],
                upgrade: true,
                reconnection: true,
                forceNew: true
            });

            setSocket(newSocket);

            // Handle connection events
            newSocket.on('connect', () => {
                console.log('=== WEBSOCKET CONNECTED TO AUCTION ===');
                console.log('Socket ID:', newSocket.id);
                setIsConnected(true);

                // Join auction room after connection (like mobile app line 76)
                newSocket.emit('joinAuction', groupAccountId);
                console.log('=== JOINED AUCTION ROOM ===');
                console.log('Emitted joinAuction:', groupAccountId);

                // Fetch existing auction details (like mobile app fetchAuctionDetails)
                console.log('=== FETCHING EXISTING AUCTION DETAILS ===');

                // Test bid removed - no longer needed
            });

            newSocket.on('disconnect', () => {
                console.log('=== WEBSOCKET DISCONNECTED FROM AUCTION ===');
                setIsConnected(false);
            });

            // Setup WebSocket event listeners exactly like mobile app
            newSocket.on('bidError', (args) => {
                console.log('=== BID ERROR RECEIVED ===');
                console.log('Args:', args);

                if (args && args[0] && args[0].message) {
                    const message = args[0].message || 'Bid place error!!';
                    toast.error(message);
                    setIsPlacingBid(false);
                    setIsLoading(false);
                } else {
                    toast.error('Bid place error!!');
                    setIsPlacingBid(false);
                    setIsLoading(false);
                }
            });

            newSocket.on('closeAuction', (args) => {
                console.log('=== CLOSE AUCTION RECEIVED IN CUSTOMER APP ===');
                console.log('Args:', args);
                console.log('=== LEAVING AUCTION ROOM AND RETURNING TO GROUP ===');

                // Handle both array format and direct object format
                let winnerObj = null;
                if (args && args[0] && args[0].winnerObject) {
                    winnerObj = args[0].winnerObject;
                } else if (args && args.winnerObject) {
                    winnerObj = args.winnerObject;
                }

                if (winnerObj) {
                    console.log('=== PROCESSING WINNER DATA ===');
                    const winner = {
                        name: winnerObj.name || '',
                        message: winnerObj.message || '',
                        userImage: winnerObj.userImage || '',
                        winnerAmount: winnerObj.winnerAmount || 0
                    };
                    console.log('Winner data:', winner);
                    setWinnerData(winner);
                } else {
                    console.log('=== NO WINNER DATA - SIMPLE AUCTION CLOSE ===');
                }

                // Set auction status to closed
                setAuctionStatus('CLOSED');
                toast.success('Auction closed!');

                // Leave auction room (like mobile app onDestroy)
                if (newSocket && newSocket.connected) {
                    newSocket.emit('leaveAuction', groupAccountId);
                    console.log('Emitted leaveAuction:', groupAccountId);
                }

                // Return to group details page after a short delay (like mobile app)
                setTimeout(() => {
                    console.log('=== RETURNING TO GROUP DETAILS ===');
                    history.push(`/chit-fund/subscriber/groups/${groupId}/${grpSubId}`);
                }, 2000); // 2 second delay to show the close message
            });

            newSocket.on('newBid', (args) => {
                console.log('=== NEW BID RECEIVED IN CUSTOMER APP ===');
                console.log('Full Args object:', JSON.stringify(args, null, 2));
                console.log('Args type:', typeof args);
                console.log('Args length:', args ? args.length : 'null');
                console.log('Current bidList length:', bidList.length);
                console.log('Auction room groupAccountId:', groupAccountId);

                // Handle both array format (args[0].auctionObject) and direct object format (args.auctionObject)
                let auctionObj = null;
                if (args && args[0] && args[0].auctionObject) {
                    // Array format: args[0].auctionObject
                    auctionObj = args[0].auctionObject;
                    console.log('Processing array format data');
                } else if (args && args.auctionObject) {
                    // Direct object format: args.auctionObject
                    auctionObj = args.auctionObject;
                    console.log('Processing direct object format data');
                }

                if (auctionObj) {
                    console.log('=== PROCESSING AUCTION OBJECT ===');
                    console.log('auctionObj:', auctionObj);

                    // Handle amount conversion - check multiple possible fields
                    let aucAmount = auctionObj.amount || auctionObj.bid_amount || auctionObj.bidAmount || auctionObj.auction_amount || "0";
                    if (typeof aucAmount === 'number') aucAmount = aucAmount.toString();

                    const amount = parseInt(aucAmount, 10) || 0;
                    console.log('Extracted amount:', amount);

                    // If amount is 0, this might be a notification without amount data
                    // We'll still add it to the list but with a placeholder amount
                    const finalAmount = amount > 0 ? amount : 'N/A';

                    const newBid = {
                        auctionId: auctionObj.auctionid || auctionObj.auction_id || 0,
                        group_accounts_id: groupAccountId,
                        groupId: groupId,
                        amount: finalAmount,
                        subscriberId: auctionObj.subscriber_id || auctionObj.userid || '',
                        grpUserId: auctionObj.user_id || auctionObj.userid || '',
                        name: auctionObj.name || auctionObj.firstname || '',
                        created_at: auctionObj.created_at || auctionObj.createdAt || new Date().toISOString(),
                        user_image: auctionObj.user_image || auctionObj.userImage || ''
                    };

                    console.log('=== CREATED NEW BID OBJECT ===');
                    console.log('newBid:', newBid);

                    setBidList(prev => {
                        console.log('=== UPDATING BID LIST ===');
                        console.log('Previous bidList:', prev);
                        console.log('Previous bidList length:', prev ? prev.length : 'null');
                        console.log('New bid to add:', newBid);
                        const updatedList = [newBid, ...prev];
                        console.log('Updated bidList:', updatedList);
                        console.log('Updated bidList length:', updatedList.length);
                        console.log('=== BID LIST UPDATE COMPLETE ===');
                        return updatedList;
                    });

                    // Force a re-render by logging the state change
                    setTimeout(() => {
                        console.log('=== CHECKING STATE AFTER UPDATE ===');
                        console.log('Current bidList state should be updated now');
                    }, 100);

                    toast.success('New Bid placed');
                    setBidAmount(''); // Clear input after successful bid
                    setIsPlacingBid(false);
                    setIsLoading(false);
                }
            });

            // Listen for existing bids when joining auction room (like mobile app)
            newSocket.on('existingBids', (bids) => {
                console.log('=== EXISTING BIDS RECEIVED ===');
                console.log('Bids:', bids);
                setBidList(bids || []);
            });

            // Debug: Add a test event listener to see if ANY events are being received
            newSocket.onAny((eventName, ...args) => {
                console.log(`=== ANY EVENT RECEIVED: ${eventName} ===`);
                console.log('Args:', args);
            });

            // Cleanup
            return () => {
                console.log('=== CLEANING UP WEBSOCKET ===');
                newSocket.emit('leaveAuction', groupAccountId);
                newSocket.disconnect();
            };
        }
    }, [groupAccountId, groupId]);

    // Handle bid submission exactly like mobile app sendBid function
    const handlePlaceBid = () => {
        console.log('=== BID SUBMISSION START ===');
        console.log('bidAmount:', bidAmount);
        console.log('subscriberId:', subscriberId);
        console.log('groupSubscriberId:', groupSubscriberId);

        if (!bidAmount || bidAmount.trim() === '') {
            toast.error('Enter auction amount!');
            return;
        }

        if (!socket) {
            toast.error('Not connected to auction');
            return;
        }

        setIsPlacingBid(true);
        setIsLoading(true);

        // Create bid data exactly like mobile app sendBid function
        const bidData = {
            groupId: groupId,
            subscriberId: subscriberId,
            amount: bidAmount,
            auctDate: auctDate,
            groupAccountId: groupAccountId,
            sourceSystem: 'web',
            grpUserId: grpUserId,
            grpSubscriberId: groupSubscriberId
        };

        console.log('=== SENDING BID DATA ===');
        console.log('bidData:', bidData);

        // Emit bid exactly like mobile app
        socket.emit('placeBid', bidData);
        console.log('=== BID EMITTED FROM CUSTOMER APP ===');
        console.log('Bid data sent:', bidData);
        console.log('Socket connected:', socket.connected);
        console.log('Socket ID:', socket.id);

        // Timeout mechanism to prevent stuck state
        setTimeout(() => {
            if (isPlacingBid) {
                console.log('=== BID TIMEOUT - RESETTING STATE ===');
                setIsPlacingBid(false);
                setIsLoading(false);
                toast.error('Bid submission timed out. Please try again.');
            }
        }, 10000); // 10 second timeout
    };

    const handleBackClick = () => {
        if (socket) {
            socket.emit('leaveAuction', groupAccountId);
            socket.disconnect();
        }
        history.push(`/chit-fund/subscriber/groups/${groupId}/${grpSubId}`);
    };

    const formatCurrency = (amount) => {
        if (amount === 'N/A' || amount === null || amount === undefined) {
            return 'N/A';
        }
        return `₹${Number(amount).toLocaleString('en-IN')}`;
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const currentHighestBid = bidList.length > 0 ? (bidList[0].amount === 'N/A' ? 0 : bidList[0].amount) : 0;

    if (!groupDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading auction details...</p>
                </div>
            </div>
        );
    }

    if (winnerData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl p-8 text-center max-w-md w-full">
                    <div className="text-6xl mb-6">🏆</div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Auction Winner!</h2>
                    <img
                        src={winnerData.userImage || 'https://via.placeholder.com/100x100?text=Winner'}
                        alt={winnerData.name}
                        className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-yellow-400 mb-4"
                    />
                    <p className="text-xl font-semibold text-gray-800 mb-2">{winnerData.name}</p>
                    <p className="text-2xl font-bold text-green-600 mb-6">
                        Winner Amount: {formatCurrency(winnerData.winnerAmount)}
                    </p>
                    <button
                        onClick={handleBackClick}
                        className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                        Back to Group Details
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-700">
            {/* Header */}
            <div className="bg-red-800 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                    <button
                        onClick={handleBackClick}
                        className="flex items-center gap-2 px-3 py-2 text-white hover:bg-red-700 rounded-lg transition-colors duration-200"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden sm:inline text-sm">Back</span>
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-white flex-1 text-center">🔴 Live Auction</h1>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                            🟢 Live
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {isConnected ? '🔗 Connected' : '❌ Disconnected'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Group Info Card */}
                <div className="bg-white rounded-lg p-6 text-gray-800 shadow-lg mb-6 border border-red-300">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <h2 className="text-2xl font-bold text-red-700 mb-1">{groupDetails.groupName}</h2>
                            <p className="text-gray-600 text-lg">Group Amount: <span className="font-semibold">{formatCurrency(amount)}</span></p>
                        </div>
                        <div className="text-center sm:text-right">
                            <p className="text-sm text-gray-500">Auction Date</p>
                            <p className="text-lg font-semibold text-gray-800">{auctDate}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Bid Input */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <h3 className="text-xl font-semibold text-gray-800 mb-5">Place Your Bid</h3>

                            {/* Current Highest Bid */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-1">Current Highest Bid</p>
                                    <p className="text-3xl font-bold text-orange-600">
                                        {formatCurrency(currentHighestBid)}
                                    </p>
                                </div>
                            </div>

                            {/* Bid Input */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Bid Amount
                                    </label>
                                    <input
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        placeholder="Enter bid amount"
                                        className={`w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${isBidDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={isPlacingBid || isBidDisabled}
                                    />
                                </div>
                                <button
                                    onClick={handlePlaceBid}
                                    disabled={isPlacingBid || isBidDisabled}
                                    className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                    {isPlacingBid ? 'Placing Bid...' : 'Place Bid'}
                                </button>
                                {isBidDisabled && (
                                    <p className="text-sm text-red-600 text-center">
                                        You have already placed a bid in this auction.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Live Bids */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                            <div className="bg-green-600 text-white p-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📊</span>
                                    <h2 className="text-xl font-semibold">Live Bids</h2>
                                    <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                                        {bidList.length} bids
                                    </span>
                                </div>
                            </div>

                            <div className="p-6">
                                {(() => {
                                    console.log('=== RENDERING BID LIST ===');
                                    console.log('bidList length:', bidList.length);
                                    console.log('bidList:', bidList);
                                    return null;
                                })()}
                                {bidList.length > 0 ? (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {bidList
                                            .slice()
                                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                            .map((bid, index) => {
                                                console.log('=== RENDERING BID ===', index, bid);
                                                return (
                                                    <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <img
                                                                    src={bid.user_image || 'https://via.placeholder.com/50x50?text=U'}
                                                                    alt={bid.name || 'Bidder'}
                                                                    className="w-12 h-12 rounded-full object-cover border-2 border-green-300"
                                                                    onError={(e) => (e.target.src = 'https://via.placeholder.com/50x50?text=U')}
                                                                />
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">
                                                                        {bid.name || bid.firstname || 'Unknown Bidder'}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        {formatTime(bid.created_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-2xl font-bold text-green-600">
                                                                    {formatCurrency(bid.amount)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">💰</div>
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Bids Yet</h3>
                                        <p className="text-gray-600">Be the first to place a bid!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriberLiveAuction;