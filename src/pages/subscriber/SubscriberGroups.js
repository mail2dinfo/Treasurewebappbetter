import React, { useState, useEffect, useMemo } from 'react';
import { useSubscriberContext } from '../../context/subscriber/SubscriberContext';
import { useLanguage } from '../../context/language_context';
import GroupList from '../../components/subscriber/dashboard/GroupList';
import { API_BASE_URL } from '../../utils/apiConfig';

const groupDueKey = (group) => `${group.groupId}-${group.groupSubscriberId}`;

const SubscriberGroups = () => {
    const {
        user,
        groupDashboard,
        fetchGroupDashboard,
        loading
    } = useSubscriberContext();

    const { t } = useLanguage();
    const [selectedProgress, setSelectedProgress] = useState('INPROGRESS');
    // Per-card outstanding from existing group-details Due (totalDue) — UI-only
    const [groupDues, setGroupDues] = useState({});

    useEffect(() => {
        fetchGroupDashboard(selectedProgress);
    }, [selectedProgress]);

    const groups = groupDashboard?.groupInfo || [];

    useEffect(() => {
        let cancelled = false;
        const groupList = groupDashboard?.groupInfo || [];

        const loadOutstandingDues = async () => {
            if (!user?.token || !groupList.length) {
                setGroupDues({});
                return;
            }

            const results = await Promise.all(
                groupList.map(async (group) => {
                    const key = groupDueKey(group);
                    try {
                        const response = await fetch(
                            `${API_BASE_URL}/subscribers/groups/${group.groupId}/${group.groupSubscriberId}`,
                            {
                                method: 'GET',
                                headers: {
                                    Authorization: `Bearer ${user.token}`,
                                    'Content-Type': 'application/json',
                                },
                            }
                        );
                        const data = await response.json();
                        // Same value shown in the Due circular on group details
                        const due = Number(data?.results?.totalDue) || 0;
                        return [key, due];
                    } catch (error) {
                        console.error('Failed to load outstanding due for group', key, error);
                        return [key, 0];
                    }
                })
            );

            if (!cancelled) {
                setGroupDues(Object.fromEntries(results));
            }
        };

        loadOutstandingDues();
        return () => {
            cancelled = true;
        };
    }, [groupDashboard?.groupInfo, user?.token]);

    const groupsWithDue = useMemo(
        () =>
            groups.map((group) => ({
                ...group,
                outstandingDue: groupDues[groupDueKey(group)] ?? 0,
            })),
        [groups, groupDues]
    );

    const totalOutstanding = useMemo(
        () => groupsWithDue.reduce((sum, group) => sum + (Number(group.outstandingDue) || 0), 0),
        [groupsWithDue]
    );

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

    const selectedType = progressTypes.find((type) => type.key === selectedProgress);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-gray-100 py-8 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h4 className="text-lg font-semibold text-gray-900">
                                {selectedType?.label}
                                <span className="text-red-600 ml-2">
                                    ({selectedType?.count})
                                </span>
                            </h4>
                            <div className="text-base sm:text-lg font-semibold text-gray-900 sm:text-right">
                                Total Pending :{' '}
                                <span className="text-red-600 font-bold">
                                    ₹{totalOutstanding.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <GroupList
                            groups={groupsWithDue}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriberGroups;
