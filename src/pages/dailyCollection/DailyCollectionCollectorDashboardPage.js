import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiDollarSign, FiMapPin, FiRefreshCw, FiUsers } from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL, readApiResponse } from '../../utils/apiConfig';
import { useDcLiveEvents } from '../../context/dailyCollection/dcLiveEvents_context';
import Loading from '../../components/Loading';

const formatAmount = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const unwrapDashboard = (body) => {
    let value = body;
    for (let i = 0; i < 3; i += 1) {
        if (value?.results != null && !Array.isArray(value.results) && typeof value.results === 'object') {
            value = value.results;
        } else if (value?.data != null && !Array.isArray(value.data) && typeof value.data === 'object') {
            value = value.data;
        } else {
            break;
        }
    }
    return value || {};
};

const DailyCollectionCollectorDashboardPage = () => {
    const { user } = useUserContext();
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
    const token = user?.results?.token;

    const fetchDashboard = useCallback(async ({ silent = false } = {}) => {
        if (!token || !membershipId) return;
        if (!silent) {
            setIsLoading(true);
            setError('');
        }
        try {
            const res = await fetch(
                `${API_BASE_URL}/dc/collector/dashboard?parent_membership_id=${encodeURIComponent(membershipId)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const body = await readApiResponse(res);
            setDashboard(unwrapDashboard(body));
        } catch (requestError) {
            if (!silent) {
                setError(requestError.message || 'Unable to load dashboard');
                setDashboard(null);
            }
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [token, membershipId]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    useDcLiveEvents(() => {
        fetchDashboard({ silent: true });
    });

    const totals = dashboard?.totals || {};
    const areas = dashboard?.areas || [];

    if (isLoading && !dashboard) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="text-center">
                    <Loading />
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Collector Dashboard</h1>
                        <p className="text-gray-600 mt-1">Receivables you are assigned to collect</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchDashboard}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
                        {error}
                    </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-orange-100">
                                <FiDollarSign className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">To collect now</p>
                                <p className="text-xs text-gray-500">Today + overdue</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(totals.toCollect)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-red-100">
                                <FiAlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Overdue</p>
                                <p className="text-xs text-gray-500">Past due dates</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">{formatAmount(totals.overdue)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-green-100">
                                <FiDollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Today</p>
                                <p className="text-xs text-gray-500">Due today</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">{formatAmount(totals.todayDue)}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-full bg-blue-100">
                                <FiMapPin className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Assigned areas</p>
                                <p className="text-xs text-gray-500">{totals.customerCount || 0} customers</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{totals.areaCount || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <Link
                        to="/daily-collection/collector/collections"
                        className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 flex items-center max-w-xl"
                    >
                        <div className="p-3 rounded-full bg-red-100">
                            <FiUsers className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">Collect receivables</h3>
                            <p className="text-gray-600">Open collections for your assigned areas</p>
                        </div>
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Area-wise collection</h2>
                        <p className="text-gray-600 mt-1">How much you have to collect in each assigned area</p>
                    </div>
                    {areas.length === 0 ? (
                        <div className="p-8 text-center">
                            <FiMapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No areas assigned</h3>
                            <p className="text-gray-600">Ask admin to assign areas in Employees.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To collect</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overdue</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Today</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dues</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customers</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {areas.map((area) => (
                                        <tr key={area.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{area.aob || '—'}</td>
                                            <td className="px-6 py-4 text-orange-600 font-semibold">
                                                {formatAmount((area.overdueAmount || 0) + (area.todayAmount || 0))}
                                            </td>
                                            <td className="px-6 py-4">{formatAmount(area.overdueAmount)}</td>
                                            <td className="px-6 py-4">{formatAmount(area.todayAmount)}</td>
                                            <td className="px-6 py-4">{area.dueCount || 0}</td>
                                            <td className="px-6 py-4">{area.customerCount || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyCollectionCollectorDashboardPage;
