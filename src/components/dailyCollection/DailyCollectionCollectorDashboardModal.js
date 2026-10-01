import React, { useCallback, useEffect, useState } from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import { API_BASE_URL, readApiResponse } from '../../utils/apiConfig';
import { useDcLiveEvents } from '../../context/dailyCollection/dcLiveEvents_context';

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

const DailyCollectionCollectorDashboardModal = ({
    employee,
    membershipId,
    token,
    onClose,
}) => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const profileId = employee?.id;
    const scopeMembershipId = employee?.parent_membership_id
        ?? employee?.parentMembershipId
        ?? membershipId;
    const collectorName = employee?.name || 'Collector';

    const loadDashboard = useCallback(async ({ silent = false } = {}) => {
        if (!profileId || !scopeMembershipId || !token) return;
        if (!silent) {
            setLoading(true);
            setError('');
        }
        try {
            const res = await fetch(
                `${API_BASE_URL}/dc/employees/${profileId}/dashboard?parent_membership_id=${encodeURIComponent(scopeMembershipId)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const body = await readApiResponse(res);
            setDashboard(unwrapDashboard(body));
        } catch (requestError) {
            if (!silent) {
                setError(requestError.message || 'Unable to load collector dashboard');
                setDashboard(null);
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [profileId, scopeMembershipId, token]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    useDcLiveEvents(() => {
        loadDashboard({ silent: true });
    });

    const totals = dashboard?.totals || {};
    const areas = dashboard?.areas || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Collector dashboard</h2>
                        <p className="text-sm text-gray-500">{collectorName}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
                        <FiX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-5 overflow-y-auto">
                    {loading ? (
                        <p className="text-center text-gray-500 py-10">Loading collection amounts...</p>
                    ) : error ? (
                        <div className="flex items-start gap-2 text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                            <FiAlertCircle className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                                <div className="border border-gray-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-gray-500">To collect now</p>
                                    <p className="text-lg font-bold text-orange-600">{formatAmount(totals.toCollect)}</p>
                                </div>
                                <div className="border border-gray-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-gray-500">Overdue</p>
                                    <p className="text-lg font-bold text-red-600">{formatAmount(totals.overdue)}</p>
                                </div>
                                <div className="border border-gray-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-gray-500">Today</p>
                                    <p className="text-lg font-bold text-green-600">{formatAmount(totals.todayDue)}</p>
                                </div>
                                <div className="border border-gray-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-gray-500">Areas</p>
                                    <p className="text-lg font-bold text-gray-900">{totals.areaCount || 0}</p>
                                </div>
                            </div>
                            {areas.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                    No areas assigned. Assign areas first so this collector can collect.
                                </p>
                            ) : (
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs uppercase text-gray-500 border-b">
                                            <th className="py-2 pr-3">Area</th>
                                            <th className="py-2 pr-3">To collect</th>
                                            <th className="py-2 pr-3">Dues</th>
                                            <th className="py-2">Customers</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {areas.map((area) => (
                                            <tr key={area.id} className="border-b border-gray-100">
                                                <td className="py-2 pr-3 font-medium">{area.aob || '—'}</td>
                                                <td className="py-2 pr-3 text-orange-600 font-semibold">
                                                    {formatAmount((area.overdueAmount || 0) + (area.todayAmount || 0))}
                                                </td>
                                                <td className="py-2 pr-3">{area.dueCount || 0}</td>
                                                <td className="py-2">{area.customerCount || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyCollectionCollectorDashboardModal;
