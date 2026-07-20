import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useSubscriberContext } from '../../context/subscriber/SubscriberContext';
import GroupHeader from '../../components/subscriber/group/GroupHeader';
import ProgressCircles from '../../components/subscriber/group/ProgressCircles';
import CircleContentDisplay from '../../components/subscriber/group/CircleContentDisplay';
import io from 'socket.io-client';
import { WEBSOCKET_URL } from '../../utils/apiConfig';

const SubscriberGroupDetails = () => {
    const { groupId, grpSubId } = useParams();
    const history = useHistory();
    const {
        groupDetails,
        fetchGroupDetails,
        loading
    } = useSubscriberContext();

    const [selectedCircle, setSelectedCircle] = useState('groups'); // Default to groups (Group Accounts)
    const [, setGroupSocket] = useState(null);
    const [, setIsGroupConnected] = useState(false);
    const [auctionStatus, setAuctionStatus] = useState('CLOSED'); // Track auction status
    const [groupAccountId, setGroupAccountId] = useState(null); // Store groupAccountId for auction

    useEffect(() => {
        if (groupId && grpSubId) {
            fetchGroupDetails(groupId, grpSubId);
        }
    }, [groupId, grpSubId]);

    // Initialize auction status from groupDetails when it loads - EXACTLY like mobile app
    useEffect(() => {
        if (groupDetails) {
            // EXACTLY like mobile app GroupDetailsActivity.kt lines 238-274
            const groupAccountIdFromAPI = groupDetails.groupAccountId;
            const auctionStatusFromAPI = groupDetails.auctionStatus;

            // Mobile app logic: doAuction = grpAccountIdFinal != null && grpAccountIdFinal != ""
            const doAuction = groupAccountIdFromAPI != null && groupAccountIdFromAPI !== "";

            // Mobile app logic: val status = if (responseData.results.auctionStatus == "OPEN" && groupInfo?.groupAccountId != null) "Open" else "Closed"
            const status = (auctionStatusFromAPI === "OPEN" && doAuction) ? "OPEN" : "CLOSED";

            setGroupAccountId(groupAccountIdFromAPI);
            setAuctionStatus(status);

            console.log('=== INITIALIZED FROM API (MOBILE APP PATTERN) ===');
            console.log('groupAccountIdFromAPI:', groupAccountIdFromAPI);
            console.log('auctionStatusFromAPI:', auctionStatusFromAPI);
            console.log('doAuction:', doAuction);
            console.log('Final status:', status);
        }
    }, [groupDetails]);

    // Debug: Monitor state changes
    useEffect(() => {
        console.log('=== STATE CHANGED ===');
        console.log('auctionStatus:', auctionStatus);
        console.log('groupAccountId:', groupAccountId);
        console.log('====================');
    }, [auctionStatus, groupAccountId]);

    // Setup WebSocket exactly like mobile app GroupDetailsActivity
    useEffect(() => {
        if (groupId) {
            console.log('=== SETTING UP WEBSOCKET (EXACT MOBILE APP PATTERN) ===');
            console.log('Group ID:', groupId);
            console.log('WebSocket URL:', WEBSOCKET_URL);

            let joinGroupCalled = false;

            const socket = io(WEBSOCKET_URL, {
                transports: ['websocket'],
                upgrade: true,
                reconnection: true,
                forceNew: true
            });

            // Set up event listeners IMMEDIATELY - not inside connect event
            console.log('Setting up WebSocket event listeners...');

            // Listen for openAuction event - EXACTLY like mobile app GroupDetailsActivity.kt lines 131-154
            socket.on('openAuction', (args) => {
                console.log('=== OPEN AUCTION RECEIVED (MOBILE APP PATTERN) ===');
                console.log('Args:', args);

                // Handle JSONObject format like mobile app
                let responseObj = null;
                if (Array.isArray(args) && args[0]) {
                    responseObj = args[0];
                } else if (args && typeof args === 'object') {
                    responseObj = args;
                }

                if (responseObj) {
                    console.log('Response object:', responseObj);

                    if (responseObj.groupAccountId) {
                        console.log('Auction opened for groupAccountId:', responseObj.groupAccountId);

                        // EXACTLY like mobile app: Set doAuction = true, auctOpen = true
                        setGroupAccountId(responseObj.groupAccountId);
                        setAuctionStatus('OPEN');

                        console.log('Auction status updated to OPEN');
                    }
                }
            });

            // Listen for closeAuction event - EXACTLY like mobile app GroupDetailsActivity.kt lines 155-161
            socket.on('closeAuction', (args) => {
                console.log('=== CLOSE AUCTION RECEIVED (MOBILE APP PATTERN) ===');
                console.log('Args:', args);
                console.log('Current auctionStatus before close:', auctionStatus);
                console.log('Current groupAccountId before close:', groupAccountId);

                // EXACTLY like mobile app: Call doCloseGroup() function
                doCloseGroup();

                console.log('Auction should now be CLOSED');
            });

            // Listen for closeGroup event - EXACTLY like mobile app GroupDetailsActivity.kt lines 162-168
            socket.on('closeGroup', (args) => {
                console.log('=== CLOSE GROUP RECEIVED (MOBILE APP PATTERN) ===');
                console.log('Args:', args);
                console.log('Current auctionStatus before close:', auctionStatus);
                console.log('Current groupAccountId before close:', groupAccountId);

                // EXACTLY like mobile app: Call doCloseGroup() function
                doCloseGroup();

                console.log('Group should now be CLOSED');
            });

            // Add a general event listener to catch any events (for debugging)
            socket.onAny((eventName, ...args) => {
                console.log('=== RECEIVED WEBSOCKET EVENT ===');
                console.log('Event name:', eventName);
                console.log('Args:', args);
            });

            socket.on('connect', () => {
                console.log('=== WEBSOCKET CONNECTED ===');
                console.log('Socket ID:', socket.id);
                console.log('WebSocket URL:', WEBSOCKET_URL);
                console.log('Group ID to join:', groupId);
                setIsGroupConnected(true);

                // Join group immediately on connect (like mobile app)
                if (!joinGroupCalled && groupId && socket.connected) {
                    socket.emit('joinGroup', groupId);
                    console.log('=== JOINED GROUP ROOM ===');
                    console.log('Emitted joinGroup:', groupId);
                    console.log('Socket connected status:', socket.connected);
                    console.log('Socket ID:', socket.id);
                    joinGroupCalled = true;
                } else {
                    console.log('=== NOT JOINING GROUP ===');
                    console.log('joinGroupCalled:', joinGroupCalled);
                    console.log('groupId:', groupId);
                    console.log('socket.connected:', socket.connected);
                }
            });

            socket.on('disconnect', () => {
                console.log('=== WEBSOCKET DISCONNECTED ===');
                setIsGroupConnected(false);
            });

            socket.on('connect_error', (error) => {
                console.log('=== WEBSOCKET CONNECTION ERROR ===');
                console.log('Error:', error);
            });

            // Store socket globally like mobile app DataHelper.webSocket
            setGroupSocket(socket);

            // Cleanup
            return () => {
                console.log('=== CLEANING UP WEBSOCKET ===');
                socket.emit('leaveGroup', groupId);
                socket.disconnect();
            };
        }
    }, [groupId, grpSubId]);

    // doCloseGroup function - EXACTLY like mobile app GroupDetailsActivity.kt lines 176-184
    const doCloseGroup = () => {
        console.log('=== doCloseGroup() called (MOBILE APP PATTERN) ===');
        console.log('Before doCloseGroup - auctionStatus:', auctionStatus);
        console.log('Before doCloseGroup - groupAccountId:', groupAccountId);

        // EXACTLY like mobile app:
        // grpAccountIdFinal = null
        // doAuction = false  
        // auctOpen = doAuction
        // val status = if (doAuction) "Open" else "Closed"
        // binding.txtAuctionData.text = status
        // if (status == "Open") binding.lytAuction.setBackgroundResource(R.drawable.roundbg_green)
        // else binding.lytAuction.setBackgroundResource(R.drawable.roundbg_red)

        setGroupAccountId(null);
        setAuctionStatus('CLOSED');

        console.log('After doCloseGroup - setGroupAccountId(null) called');
        console.log('After doCloseGroup - setAuctionStatus("CLOSED") called');
        console.log('Auction status should now be CLOSED');
    };


    const handleBackClick = () => {
        history.push('/chit-fund/subscriber/groups');
    };

    const handleCircleClick = (circleId) => {
        setSelectedCircle(circleId);
    };

    if (loading && !groupDetails) {
        return (
            <div className="group-details-loading">
                <div className="spinner"></div>
                <p>Loading group details...</p>
            </div>
        );
    }

    if (!groupDetails) {
        return (
            <div className="group-details-error">
                <h3>Group Not Found</h3>
                <p>The requested group could not be found.</p>
                <button onClick={handleBackClick} className="back-btn">
                    Back to Groups
                </button>
            </div>
        );
    }

    return (
        <div className="subscriber-group-details min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="group-details-header mb-6 sm:mb-8">
                    <button onClick={handleBackClick} className="back-btn text-base sm:text-lg lg:text-xl font-semibold bg-white hover:bg-gray-50 px-4 py-3 rounded-xl transition-all duration-200 shadow-lg border border-gray-200 hover:border-gray-300">
                        ← Back to Groups
                    </button>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mt-4 text-center sm:text-left">Group Details</h1>
                </div>

                <div className="group-details-content-improved space-y-6 sm:space-y-8 lg:space-y-10">
                    {/* Group Header */}
                    <GroupHeader groupDetails={groupDetails} />

                    {/* Progress Circles */}
                    <ProgressCircles
                        groupDetails={groupDetails}
                        selectedCircle={selectedCircle}
                        onCircleClick={handleCircleClick}
                        auctionStatus={auctionStatus}
                        groupAccountId={groupAccountId}
                    />

                    {/* Dynamic Content Display */}
                    <CircleContentDisplay
                        selectedCircle={selectedCircle}
                        groupDetails={groupDetails}
                        auctionStatus={auctionStatus}
                        groupAccountId={groupAccountId}
                    />
                </div>
            </div>
        </div>
    );
};

export default SubscriberGroupDetails;
