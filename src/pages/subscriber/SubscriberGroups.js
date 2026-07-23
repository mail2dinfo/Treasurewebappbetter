import React, { useState, useEffect } from 'react';
import { useSubscriberContext } from '../../context/subscriber/SubscriberContext';
import { useLanguage } from '../../context/language_context';
import GroupList from '../../components/subscriber/dashboard/GroupList';

const SubscriberGroups = () => {
    const {
        groupDashboard,
        fetchGroupDashboard,
        loading
    } = useSubscriberContext();

    const { t } = useLanguage();
    const [selectedProgress, setSelectedProgress] = useState('INPROGRESS');

    useEffect(() => {
        fetchGroupDashboard(selectedProgress);
    }, [selectedProgress]);

    const progressTypes = [
        {
            key: 'INPROGRESS',
            label: 'Ready Groups',
            count: groupDashboard?.groupProgress?.inProgressCount || 0,
            color: 'bg-green-500',
            icon: '🔄'
        },
        {
            key: 'FUTURE',
            label: 'New Groups',
            count: groupDashboard?.groupProgress?.futureCount || 0,
            color: 'bg-blue-500',
            icon: '⏳'
        },
        {
            key: 'CLOSED',
            label: 'Closed Groups',
            count: groupDashboard?.groupProgress?.completedCount || 0,
            color: 'bg-orange-500',
            icon: '✅'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-gray-100 py-8 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Debug: Log user data */}

                {/* Header Section with Welcome and Logout - Right Aligned */}
                {/* Header content moved to SubscriberHeader component */}

                {/* My Groups Heading - Matching Home Page Style */}
                <div className="my-groups-container mb-8">
                    <h3 className="text-2xl font-bold text-red-600">{t('my_groups')} ({groupDashboard?.groupInfo?.length || 0})</h3>
                </div>

                {/* Tabs Navigation - Modern Design */}
                <div className="mb-8 transition-all duration-300">
                    <div className="bg-white rounded-2xl shadow-lg p-2 transition-all duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {progressTypes.map(type => (
                                <button
                                    key={type.key}
                                    className={`px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${selectedProgress === type.key
                                        ? 'bg-red-500 text-white shadow-lg transform scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                                        }`}
                                    onClick={() => setSelectedProgress(type.key)}
                                >
                                    <span className="text-xl">{type.icon}</span>
                                    <div className="text-center">
                                        <div className="text-sm font-bold">{type.label}</div>
                                        <div className="text-xs opacity-80">({type.count})</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Groups Content */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300">
                    <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-red-50">
                        <h4 className="text-lg font-semibold text-gray-900">
                            {progressTypes.find(type => type.key === selectedProgress)?.label}
                            <span className="text-red-600 ml-2">
                                ({progressTypes.find(type => type.key === selectedProgress)?.count})
                            </span>
                        </h4>
                    </div>
                    <div className="p-6">
                        <GroupList
                            groups={groupDashboard?.groupInfo || []}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriberGroups;
