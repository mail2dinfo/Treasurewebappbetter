import React from 'react';

const GroupHeader = ({ groupDetails }) => {
    const {
        groupName,
        amount,
        type,
        isGovApproved,
        bidStatus,
        auctionDate,
        auctionStatus,
        startDate,
        endDate,
        commissionAmount,
        commissionType
    } = groupDetails;

    const getGroupTypeColor = (type) => {
        switch (type) {
            case 'FIXED': return '#4CAF50';
            case 'ACCUMULATIVE': return '#2196F3';
            case 'DEDUCTIVE': return '#FF9800';
            case 'ADAPTIVE': return '#7C3AED';
            case 'FLEXIBLE': return '#0D9488';
            default: return '#666';
        }
    };

    return (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 shadow-lg">
            {/* Header Row - Optimized Layout */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 gap-3 lg:gap-0">
                <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">{groupName}</h1>
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white drop-shadow-lg">₹{amount.toLocaleString()}</div>
                </div>
                <div className="flex flex-row lg:flex-col gap-2 items-start lg:items-end">
                    <span
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-md"
                        style={{ backgroundColor: getGroupTypeColor(type) }}
                    >
                        {type}
                    </span>
                    {isGovApproved && (
                        <span className="bg-green-500 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-md">
                            ✓ Gov Approved
                        </span>
                    )}
                </div>
            </div>

            {/* Info Grid - Compact Layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
                <div className="text-center bg-white/10 rounded-md p-3 backdrop-blur-sm">
                    <div className="text-xs opacity-90 mb-1 font-medium">Start Date</div>
                    <div className="text-sm font-bold">{new Date(startDate).toLocaleDateString()}</div>
                </div>
                <div className="text-center bg-white/10 rounded-md p-3 backdrop-blur-sm">
                    <div className="text-xs opacity-90 mb-1 font-medium">End Date</div>
                    <div className="text-sm font-bold">{new Date(endDate).toLocaleDateString()}</div>
                </div>
                <div className="text-center bg-white/10 rounded-md p-3 backdrop-blur-sm">
                    <div className="text-xs opacity-90 mb-1 font-medium">Commission</div>
                    <div className="text-sm font-bold">₹{commissionAmount}</div>
                </div>
                <div className="text-center bg-white/10 rounded-md p-3 backdrop-blur-sm">
                    <div className="text-xs opacity-90 mb-1 font-medium">Type</div>
                    <div className="text-sm font-bold">{commissionType}</div>
                </div>
            </div>

            {/* Status Row - Compact Layout */}
            <div className="flex flex-wrap gap-2 lg:gap-3 justify-center lg:justify-start">
                {type !== 'ACCUMULATIVE' && bidStatus !== 'BIDTAKEN' && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold shadow-md bg-yellow-500/40 border border-yellow-400/60">
                        <span className="text-sm">⏳</span>
                        <span className="text-xs">No Bid</span>
                    </div>
                )}

                {type !== 'ACCUMULATIVE' && auctionStatus !== 'OPEN' && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold shadow-md bg-red-500/40 border border-red-400/60">
                        <span className="text-sm">🔴</span>
                        <span className="text-xs">Auction Closed</span>
                    </div>
                )}

                <div className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold shadow-md bg-blue-500/40 border border-blue-400/60">
                    <span className="text-sm">📅</span>
                    <span className="text-xs">Next Auction: {new Date(auctionDate).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};

export default GroupHeader;
