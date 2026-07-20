import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import AdvanceModal from './AdvanceModal';

const ProgressCircles = ({ groupDetails, selectedCircle, onCircleClick, auctionStatus: realTimeAuctionStatus, groupAccountId }) => {
    const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

    const {
        totalGroups = 0,
        groupsCompleted = 0,
        totalDue = 0,
        outstandingAdvanceTransactionInfo = [],
        advanceLedgerDetails = {} // New field from backend
    } = groupDetails || {};

    // Use real-time auction status from WebSocket events
    const auctionStatus = realTimeAuctionStatus || groupDetails?.auctionStatus || 'CLOSED';

    const progressPercentage = totalGroups > 0 ? (groupsCompleted / totalGroups) * 100 : 0;

    // Calculate dynamic credit amount from credit transactions (similar to due calculation)
    const calculateDynamicCredit = () => {
        if (!outstandingAdvanceTransactionInfo || outstandingAdvanceTransactionInfo.length === 0) {
            return 0;
        }

        // Sum up all credit amounts from outstandingAdvanceTransactionInfo
        const totalCredit = outstandingAdvanceTransactionInfo.reduce((sum, transaction) => {
            const amount = parseFloat(transaction.amount) || 0;
            return sum + amount;
        }, 0);

        return totalCredit;
    };

    const dynamicCreditAmount = calculateDynamicCredit();

    const circles = [
        {
            id: 'groups',
            label: 'Groups',
            value: `${groupsCompleted}/${totalGroups}`,
            percentage: progressPercentage,
            color: '#4CAF50',
            icon: '👥'
        },
        {
            id: 'due',
            label: 'Due',
            value: `₹${(totalDue || 0).toLocaleString()}`,
            percentage: 100,
            color: '#FF9800',
            icon: '💰'
        },
        {
            id: 'auction',
            label: 'Auction',
            value: auctionStatus === 'OPEN' ? 'Open' : 'Closed',
            percentage: 100,
            color: auctionStatus === 'OPEN' ? '#4CAF50' : '#f44336',
            icon: auctionStatus === 'OPEN' ? '🟢' : '🔴'
        },
        {
            id: 'credit',
            label: 'Credit',
            value: `₹${(dynamicCreditAmount || 0).toLocaleString()}`,
            percentage: 100,
            color: '#2196F3',
            icon: '📈'
        },
        {
            id: 'advance',
            label: 'Advance',
            value: `₹${(advanceLedgerDetails?.total_balance ?? 0).toLocaleString()}`,
            percentage: 100,
            color: '#9C27B0',
            icon: '💎'
        }
    ];

    const history = useHistory();
    const { groupId, grpSubId } = useParams();

    const handleCircleClick = (circleId) => {
        // If auction circle is clicked and auction is open, go directly to auction page
        if (circleId === 'auction' && auctionStatus === 'OPEN' && groupAccountId) {
            history.push(`/chit-fund/subscriber/groups/${groupId}/${grpSubId}/auction`);
            return;
        }

        // If advance circle is clicked, open the modal
        if (circleId === 'advance') {
            setIsAdvanceModalOpen(true);
            return;
        }

        // For other circles, use the normal click handler
        onCircleClick(circleId);
    };

    // Check if there are pending dues - multiple ways to detect
    const hasPendingDues = () => {
        return (
            (groupDetails?.pendingAmount > 0) ||
            (groupDetails?.totalDue > 0 && groupDetails?.paidAmount < groupDetails?.totalDue) ||
            (groupDetails?.customerDue > 0) ||
            (groupDetails?.receivableAmount > 0)
        );
    };

    // Animation logic for circles with custom styles
    const getCircleAnimation = (circleId) => {
        if (circleId === 'due' && hasPendingDues()) {
            return 'due-pulse-animation';
        }
        if (circleId === 'auction' && auctionStatus === 'OPEN') {
            return 'auction-bounce-animation';
        }
        return '';
    };

    const getCircleMessage = (circleId) => {
        if (circleId === 'due' && hasPendingDues()) {
            return (
                <div
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                    style={{
                        animation: 'pulse 2s infinite'
                    }}
                >
                    💰 Pay Due Now!
                </div>
            );
        }
        if (circleId === 'auction' && auctionStatus === 'OPEN') {
            return (
                <div
                    className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                    style={{
                        animation: 'bounce 1.5s infinite'
                    }}
                >
                    🎯 Auction Open!
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <div className="progress-circles-container mb-6 sm:mb-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto px-4">
                    {circles.map((circle) => (
                        <div key={circle.id} className="flex justify-center relative">
                            <div
                                className={`progress-circle clickable ${selectedCircle === circle.id ? 'active' : ''} w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 cursor-pointer transition-all duration-300 hover:scale-105 ${getCircleAnimation(circle.id)}`}
                                onClick={() => handleCircleClick(circle.id)}
                            >
                                <div
                                    className="circle-background w-full h-full rounded-full flex items-center justify-center relative transition-all duration-300 shadow-lg"
                                    style={{
                                        background: `conic-gradient(${circle.color} ${circle.percentage * 3.6}deg, #e0e0e0 0deg)`
                                    }}
                                >
                                    <div className="circle-content absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full flex flex-col items-center justify-center shadow-md border-2 border-gray-100">
                                        <div className="circle-icon text-lg sm:text-xl md:text-2xl mb-1">{circle.icon}</div>
                                        <div className="circle-value text-xs sm:text-sm md:text-base font-bold text-gray-800 mb-1 text-center leading-tight">
                                            {circle.value}
                                        </div>
                                        <div className="circle-label text-xs sm:text-xs md:text-sm text-gray-600 font-medium text-center uppercase tracking-wide">
                                            {circle.label}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {getCircleMessage(circle.id)}
                        </div>
                    ))}
                </div>

                {/* Additional Info Section */}
                <div className="mt-6 sm:mt-8 text-center">
                    <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto px-4">
                        Tap any circle above to view detailed information about that aspect of your group
                    </p>
                    {(hasPendingDues() || auctionStatus === 'OPEN') && (
                        <div className="mt-4">
                            {hasPendingDues() && (
                                <p
                                    className="text-red-600 text-sm font-semibold"
                                    style={{
                                        animation: 'pulse 2s infinite'
                                    }}
                                >
                                    💰 You have pending dues to pay - Click on Due circle above!
                                </p>
                            )}
                            {auctionStatus === 'OPEN' && (
                                <p
                                    className="text-green-600 text-sm font-semibold"
                                    style={{
                                        animation: 'bounce 1.5s infinite'
                                    }}
                                >
                                    🎯 Auction is live - Click on Auction circle to participate!
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Advance Modal */}
            <AdvanceModal
                isOpen={isAdvanceModalOpen}
                onClose={() => setIsAdvanceModalOpen(false)}
                advanceData={advanceLedgerDetails}
            />
        </>
    );
};

export default ProgressCircles;
