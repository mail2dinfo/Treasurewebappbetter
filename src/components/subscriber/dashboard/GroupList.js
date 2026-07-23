import React from 'react';
import { useHistory } from 'react-router-dom';

const GroupList = ({ groups, loading }) => {
    const history = useHistory();

    const handleGroupClick = (groupId, grpSubId) => {
        history.push(`/chit-fund/subscriber/groups/${groupId}/${grpSubId}`);
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-200 animate-pulse rounded-2xl h-64"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!groups || groups.length === 0) {
        return (
            <div className="text-center py-16 px-8">
                <div className="text-6xl mb-6 opacity-50">📊</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No new groups</h3>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group, index) => (
                    <GroupCard key={index} group={group} onGroupClick={handleGroupClick} />
                ))}
            </div>
        </div>
    );
};

const GroupCard = ({ group, onGroupClick }) => {
    const {
        groupId,
        amount,
        isGovApproved,
        auctionDate,
        groupProgress,
        groupType,
        groupSubscriberId,
        groupName,
        outstandingDue,
    } = group;

    const handleClick = () => {
        onGroupClick(groupId, groupSubscriberId);
    };

    const dueAmount = Number(outstandingDue) || 0;
    const groupAmount = Number(amount) || 0;
    const displayName = group?.group_name || groupName || group?.name || group?.groupName || 'Group';

    const getGroupTypeStyles = (type) => {
        switch (type) {
            case 'FIXED': return 'bg-green-100 text-green-800 border-green-200';
            case 'ACCUMULATIVE': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'DEDUCTIVE': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'ADAPTIVE': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getProgressStyles = (progress) => {
        switch (progress) {
            case 'INPROGRESS': return 'bg-green-100 text-green-800';
            case 'FUTURE': return 'bg-blue-100 text-blue-800';
            case 'CLOSED': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getProgressIcon = (progress) => {
        switch (progress) {
            case 'INPROGRESS': return '🔄';
            case 'FUTURE': return '⏳';
            case 'CLOSED': return '✅';
            default: return '📊';
        }
    };

    return (
        <div
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100 overflow-hidden group"
            onClick={handleClick}
        >
            {/* Header Section */}
            <div className="bg-red-100 p-4 border-b border-red-200">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate min-w-0">
                        {displayName}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border shrink-0 ${getGroupTypeStyles(groupType)}`}>
                        {groupType}
                    </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xl font-extrabold text-gray-900">
                        ₹{groupAmount.toLocaleString('en-IN')}
                    </p>
                    <span className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-md bg-yellow-300 text-red-700 text-xs font-bold shadow-sm w-full sm:w-auto sm:ml-auto text-center">
                        Pending due : ₹{dueAmount.toLocaleString('en-IN')}
                    </span>
                </div>

                {isGovApproved && (
                    <div className="flex items-center space-x-1 text-green-700 mt-2">
                        <span className="text-xs">✓</span>
                        <span className="text-xs font-medium">Government Approved</span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4">
                {/* Status Row */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm">{getProgressIcon(groupProgress)}</span>
                        <span className="text-xs font-medium text-gray-600">Status</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getProgressStyles(groupProgress)}`}>
                        {groupProgress}
                    </span>
                </div>

                {/* Next Auction Row */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm">📅</span>
                        <span className="text-xs font-medium text-gray-600">Next Auction</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">
                        {auctionDate ? new Date(auctionDate).toLocaleDateString() : '—'}
                    </span>
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-gray-100">
                    <button className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-3 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform group-hover:scale-105 text-sm">
                        View Details →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GroupList;
