import React, { useCallback, useEffect, useState } from 'react';
import { FiCheckCircle, FiClock, FiMessageSquare, FiRefreshCw } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { fetchSuperAdminApi, patchSuperAdminApi } from '../utils/superAdminApi';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import SuperAdminShell from '../components/superAdmin/SuperAdminShell';
import { SuperAdminKpiCard, SuperAdminPanel } from '../components/superAdmin/SuperAdminDashboardCards';
import Loading from '../components/Loading';

const DEMO_STATUS_OPTIONS = [
    { value: 'new', label: 'New' },
    { value: 'need_to_follow', label: 'Need to Follow' },
    { value: 'closed', label: 'Closed' },
];

const STATUS_STYLES = {
    new: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    need_to_follow: 'bg-amber-100 text-amber-800 border-amber-200',
    closed: 'bg-slate-100 text-slate-700 border-slate-200',
};

const formatDateTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const buildStatusCounts = (requests = []) => ({
    new: requests.filter((row) => row.status === 'new').length,
    need_to_follow: requests.filter((row) => row.status === 'need_to_follow').length,
    closed: requests.filter((row) => row.status === 'closed').length,
});

const SuperAdminHome = () => {
    const history = useHistory();
    const { user } = useUserContext();
    const [demoRequests, setDemoRequests] = useState([]);
    const [demoStats, setDemoStats] = useState({
        total: 0,
        new_count: 0,
        status_counts: { new: 0, need_to_follow: 0, closed: 0 },
    });
    const [updatingStatusId, setUpdatingStatusId] = useState(null);
    const [statusError, setStatusError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [demoError, setDemoError] = useState(null);

    const fetchDashboard = useCallback(async () => {
        setIsLoading(true);
        setDemoError(null);

        try {
            const demoData = await fetchSuperAdminApi(
                '/super-admin/marketing/demo-requests',
                user?.results?.token
            );
            setDemoRequests(demoData.data.requests || []);
            setDemoStats({
                total: demoData.data.total ?? 0,
                new_count: demoData.data.new_count ?? 0,
                status_counts: demoData.data.status_counts || buildStatusCounts(demoData.data.requests || []),
            });
        } catch (fetchError) {
            setDemoError(fetchError.message);
            setDemoRequests([]);
            setDemoStats({
                total: 0,
                new_count: 0,
                status_counts: { new: 0, need_to_follow: 0, closed: 0 },
            });
        } finally {
            setIsLoading(false);
        }
    }, [user?.results?.token]);

    const handleStatusChange = async (requestId, nextStatus) => {
        setStatusError(null);
        setUpdatingStatusId(requestId);

        try {
            const data = await patchSuperAdminApi(
                `/super-admin/marketing/demo-requests/${requestId}/status`,
                user?.results?.token,
                { status: nextStatus }
            );

            setDemoRequests((current) => {
                const updated = current.map((row) =>
                    row.id === requestId ? { ...row, status: data.data.status } : row
                );
                setDemoStats((stats) => ({
                    ...stats,
                    total: updated.length,
                    new_count: updated.filter((row) => row.status === 'new').length,
                    status_counts: buildStatusCounts(updated),
                }));
                return updated;
            });
        } catch (updateError) {
            setStatusError(updateError.message);
        } finally {
            setUpdatingStatusId(null);
        }
    };

    useEffect(() => {
        if (!isSuperAdminUser(user)) {
            history.replace('/login');
            return;
        }

        fetchDashboard();
    }, [user, history, fetchDashboard]);

    const refreshButton = (
        <button
            type="button"
            onClick={fetchDashboard}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
        >
            <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
        </button>
    );

    return (
        <SuperAdminShell
            title="Demo Requests"
            subtitle="Track and follow up landing page demo leads"
            actions={refreshButton}
        >
            <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-red-900 p-5 text-white shadow-xl sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">Super Admin</p>
                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Demo request dashboard</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                        Review new leads, mark follow-ups, and close completed demo requests.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                        <Loading size="lg" />
                    </div>
                ) : (
                    <>
                        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <SuperAdminKpiCard
                                icon={FiMessageSquare}
                                label="New"
                                value={demoStats.status_counts?.new ?? 0}
                                hint="Demo requests to review"
                                accent="red"
                            />
                            <SuperAdminKpiCard
                                icon={FiClock}
                                label="Need to Follow"
                                value={demoStats.status_counts?.need_to_follow ?? 0}
                                hint="Follow-up pending"
                                accent="amber"
                            />
                            <SuperAdminKpiCard
                                icon={FiCheckCircle}
                                label="Closed"
                                value={demoStats.status_counts?.closed ?? 0}
                                hint="Completed demo leads"
                                accent="slate"
                            />
                        </section>

                        <SuperAdminPanel
                            flush
                            title="Demo requests"
                            description={`${demoStats.total} total · New: ${demoStats.status_counts?.new ?? 0} · Need to Follow: ${demoStats.status_counts?.need_to_follow ?? 0} · Closed: ${demoStats.status_counts?.closed ?? 0}`}
                        >
                            {statusError && (
                                <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-600">
                                    {statusError}
                                </p>
                            )}
                            {demoError ? (
                                <p className="p-6 text-sm text-red-600">{demoError}</p>
                            ) : demoRequests.length === 0 ? (
                                <p className="py-12 text-center text-sm text-slate-500">
                                    No demo requests yet.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-200 bg-slate-50">
                                                <th className="w-16 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    #
                                                </th>
                                                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    Name
                                                </th>
                                                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    Mobile
                                                </th>
                                                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    Source
                                                </th>
                                                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                    Requested
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {demoRequests.map((row, index) => (
                                                <tr
                                                    key={row.id}
                                                    className={`transition hover:bg-red-50/40 ${
                                                        index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                                                    }`}
                                                >
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-400">
                                                        {index + 1}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium capitalize text-slate-900">
                                                        {row.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-700">
                                                        <a
                                                            href={`tel:+91${row.mobile}`}
                                                            className="hover:text-red-600"
                                                        >
                                                            {row.mobile}
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={row.status || 'new'}
                                                            disabled={updatingStatusId === row.id}
                                                            onChange={(event) =>
                                                                handleStatusChange(row.id, event.target.value)
                                                            }
                                                            className={`min-w-[9.5rem] rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:opacity-60 ${
                                                                STATUS_STYLES[row.status] || STATUS_STYLES.new
                                                            }`}
                                                        >
                                                            {DEMO_STATUS_OPTIONS.map((option) => (
                                                                <option key={option.value} value={option.value}>
                                                                    {option.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {row.source || '—'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {formatDateTime(row.created_at)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </SuperAdminPanel>
                    </>
                )}
            </div>
        </SuperAdminShell>
    );
};

export default SuperAdminHome;
