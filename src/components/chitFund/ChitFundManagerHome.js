import React, { useEffect, useState } from 'react';
import { FiArrowDownCircle, FiArrowUpCircle, FiUsers } from 'react-icons/fi';
import HomePage from '../../pages/HomePage';
import { API_BASE_URL, readApiResponse } from '../../utils/apiConfig';
import { useUserContext } from '../../context/user_context';
import { usePayablesContext } from '../../context/payables_context';
import { usePlatformAccess } from '../../context/platformAccess_context';

const money = (value) => Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const ChitFundManagerHome = ({ showDashboard = true }) => {
    const { user } = useUserContext();
    const { payables } = usePayablesContext();
    const platform = usePlatformAccess();
    const token = user?.results?.token;
    const canViewReceivables = platform.hasPermission('chit_home_view_receivable');
    const canViewPayables = platform.hasPermission('chit_home_view_payable');
    const canViewCollectorSummary = canViewReceivables
        && platform.hasAnyPermission(['chit_employee_add', 'chit_collector_edit', 'chit_employee_manage']);
    const [totalReceivable, setTotalReceivable] = useState(0);
    const [collectorTotals, setCollectorTotals] = useState([]);
    const [isLoadingSummary, setIsLoadingSummary] = useState(showDashboard);

    useEffect(() => {
        if (!showDashboard || !token || (!canViewReceivables && !canViewCollectorSummary)) {
            setIsLoadingSummary(false);
            return;
        }
        const loadSummary = async () => {
            setIsLoadingSummary(true);
            try {
                const [dashboardResponse, employeesResponse] = await Promise.all([
                    canViewReceivables
                        ? fetch(`${API_BASE_URL}/dashboard`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                        : Promise.resolve(null),
                    canViewCollectorSummary
                        ? fetch(`${API_BASE_URL}/employee/all`, {
                            headers: { Authorization: `Bearer ${token}` },
                        })
                        : Promise.resolve(null),
                ]);
                const dashboardData = dashboardResponse
                    ? await readApiResponse(dashboardResponse)
                    : {};
                const employeeData = employeesResponse
                    ? await readApiResponse(employeesResponse)
                    : {};
                setTotalReceivable(Number(
                    dashboardData?.results?.userMembershipTotalDue?.[0]?.due || 0
                ));

                const employeeRows = Array.isArray(employeeData?.results)
                    ? employeeData.results
                    : employeeData?.results?.employees || [];
                const collectors = employeeRows.filter(
                    (employee) => String(employee.role || '').toUpperCase() === 'COLLECTOR'
                );
                const totals = await Promise.all(collectors.map(async (collector) => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/collector-area/${collector.id}/receivables`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const data = await readApiResponse(response);
                        const receivables = data?.results?.receivables || [];
                        return {
                            id: collector.id,
                            name: collector.name || 'Collector',
                            amount: receivables.reduce(
                                (sum, receivable) => sum + Number(receivable.rbdue || 0),
                                0
                            ),
                            subscriberCount: receivables.length,
                        };
                    } catch (error) {
                        return {
                            id: collector.id,
                            name: collector.name || 'Collector',
                            amount: 0,
                            subscriberCount: 0,
                        };
                    }
                }));
                setCollectorTotals(totals.sort((left, right) => right.amount - left.amount));
            } catch (error) {
                setTotalReceivable(0);
                setCollectorTotals([]);
            } finally {
                setIsLoadingSummary(false);
            }
        };
        loadSummary();
    }, [showDashboard, token, canViewReceivables, canViewCollectorSummary]);

    const totalPayable = (payables || []).reduce(
        (sum, payable) => sum + Number(payable.pbdue || 0),
        0
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {showDashboard && (
                <section className="mb-5">
                    <div className={`grid grid-cols-1 ${(canViewReceivables && canViewPayables) ? 'sm:grid-cols-2' : ''} gap-3`}>
                        {canViewReceivables && (
                        <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Receivable</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">₹{money(totalReceivable)}</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                                <FiArrowDownCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                        )}
                        {canViewPayables && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Payable</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">₹{money(totalPayable)}</p>
                            </div>
                            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
                                <FiArrowUpCircle className="w-6 h-6 text-gray-700" />
                            </div>
                        </div>
                        )}
                    </div>

                    {canViewCollectorSummary && (
                    <div className="mt-3 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="font-bold text-gray-900">Collector Receivables</h2>
                                <p className="text-xs text-gray-500">Amount each collector needs to collect</p>
                            </div>
                            <FiUsers className="w-5 h-5 text-red-600" />
                        </div>
                        {isLoadingSummary ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">Loading collection responsibility…</div>
                        ) : collectorTotals.length ? (
                            <div className="divide-y divide-gray-100">
                                {collectorTotals.map((collector) => (
                                    <div key={collector.id} className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-red-50/40">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{collector.name}</p>
                                            <p className="text-xs text-gray-500">{collector.subscriberCount} receivable record{collector.subscriberCount === 1 ? '' : 's'}</p>
                                        </div>
                                        <p className="font-bold text-red-700 whitespace-nowrap">₹{money(collector.amount)}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">No collector receivables assigned yet.</div>
                        )}
                    </div>
                    )}
                    {!canViewReceivables && !canViewPayables && !canViewCollectorSummary && (
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-500">
                            No financial summary permissions have been assigned.
                        </div>
                    )}
                </section>
            )}
            {!showDashboard && (
                <HomePage
                    basePath="/chit-fund/manager"
                    groupsOnly
                    alwaysShowCreateGroup={platform.hasPermission('chit_group_start')}
                    canCreateGroup={platform.hasPermission('chit_group_start')}
                    canAddSubscriber={platform.hasPermission('chit_subscriber_add')}
                    canDeleteGroup={platform.hasPermission('chit_group_start')}
                />
            )}
        </div>
    );
};

export default ChitFundManagerHome;
