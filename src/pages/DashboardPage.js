import React, { useState, useEffect } from 'react';
import { DashboardMasterInfo, DashboardAreaWiseGroups } from '../components';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';
import { useDashboardContext } from '../context/dashboard_context';

import loadingImage from '../images/preloader.gif';



const DashboardPage = () => {

    const { user } = useUserContext();
    const { updateDashboardDetails } = useDashboardContext();



    const [isLoading, setIsLoading] = useState(true); // Define isLoading state

    useEffect(() => {
        const fetchDashboardDetails = async () => {
            try {
                setIsLoading(true);
                const apiUrl = `${API_BASE_URL}/dashboard`;
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${user?.results?.token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch groups');
                }
                const dashboardData = await response.json();
                updateDashboardDetails(dashboardData)


            } catch (error) {
                console.error('Error fetching dashboard details:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardDetails();
    }, [user?.results?.token]); // Fetch once per auth session

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <img src={loadingImage} className="loading-img" alt="" style={{ marginTop: 0 }} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Modern Dashboard Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your chit funds.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-500">Last updated</p>
                                <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Key Metrics Cards */}
                <div className="mb-8">
                    <DashboardMasterInfo />
                </div>

                {/* Detailed Analytics */}
                <div className="mb-8">
                    <DashboardAreaWiseGroups />
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-lg">📊</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">View Reports</h3>
                                    <p className="text-sm text-gray-600">Generate detailed reports</p>
                                </div>
                            </div>
                        </button>
                        
                        <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors duration-200 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-lg">👥</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Manage Groups</h3>
                                    <p className="text-sm text-gray-600">View and manage groups</p>
                                </div>
                            </div>
                        </button>
                        
                        <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors duration-200 text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-lg">💰</span>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Financial Overview</h3>
                                    <p className="text-sm text-gray-600">Check receivables & payables</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );


}

export default DashboardPage
