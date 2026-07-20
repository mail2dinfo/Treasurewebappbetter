import React, { useState, useEffect } from 'react';
import { useSubscriberContext } from '../../context/subscriber/SubscriberContext';
import GroupProgressCards from '../../components/subscriber/dashboard/GroupProgressCards';
import GroupList from '../../components/subscriber/dashboard/GroupList';
import RecentTransactions from '../../components/subscriber/dashboard/RecentTransactions';
// import GroupDetailsModal from '../../components/subscriber/dashboard/GroupDetailsModal'; // Removed - no longer using modal

const SubscriberDashboard = () => {
    const {
        groupDashboard,
        transactionDashboard,
        fetchGroupDashboard,
        fetchTransactionDashboard,
        loading
    } = useSubscriberContext();

    const [selectedProgress, setSelectedProgress] = useState('INPROGRESS');
    // Removed modal-related state variables since we're using filters now

    useEffect(() => {
        // Only load data once when component mounts
        const loadData = async () => {
            try {
                // Load group dashboard first
                await fetchGroupDashboard(selectedProgress);
                // Then load transactions
                await fetchTransactionDashboard(1, 5);
            } catch (error) {
                console.error('Error loading dashboard:', error);
            }
        };
        loadData();
    }, []); // Empty dependency array - only run once

    // Remove the modal behavior - progress cards will just filter the groups
    // const handleInProgressClick = () => {
    //     if (groupDashboard?.groupInfo && groupDashboard.groupInfo.length > 0) {
    //         setSelectedGroup(groupDashboard.groupInfo[0]); // Show first group or you can show all
    //         setShowGroupDetailsModal(true);
    //     }
    // };

    if (loading && !groupDashboard) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-gray-100 py-8 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Welcome Header removed */}

                {/* Group Progress Summary */}
                <GroupProgressCards
                    progress={groupDashboard?.groupProgress}
                    onProgressChange={setSelectedProgress}
                    selectedProgress={selectedProgress}
                />

                {/* My Groups */}
                <div className="mb-12">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        My Groups
                                        <span className="ml-2 text-lg font-normal text-gray-600">
                                            ({selectedProgress === 'INPROGRESS' ? 'In Progress' :
                                                selectedProgress === 'FUTURE' ? 'Future' :
                                                    selectedProgress === 'CLOSED' ? 'Completed' : 'All'})
                                        </span>
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Click on progress cards above to filter groups
                                    </p>
                                </div>
                                <button
                                    onClick={() => window.location.href = '/chit-fund/subscriber/groups'}
                                    className="text-red-600 hover:text-red-800 font-semibold flex items-center space-x-2 transition-colors duration-200"
                                >
                                    <span>View All</span>
                                    <span>→</span>
                                </button>
                            </div>
                        </div>
                        <GroupList
                            groups={groupDashboard?.groupInfo || []}
                            loading={loading}
                        />
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="mb-12">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
                        </div>
                        <div className="p-6">
                            <RecentTransactions
                                transactions={transactionDashboard?.transactions || []}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* Modal removed - progress cards now work as filters */}
            </div>
        </div>
    );
};

export default SubscriberDashboard;
