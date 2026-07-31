import React, { useCallback, useEffect, useState } from 'react';
import { FiRefreshCw, FiUserCheck, FiUserX, FiUsers, FiWifi } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { fetchSuperAdminApi } from '../utils/superAdminApi';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import SuperAdminShell from '../components/superAdmin/SuperAdminShell';
import { SuperAdminKpiCard, SuperAdminPanel } from '../components/superAdmin/SuperAdminDashboardCards';
import Loading from '../components/Loading';

const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const parseAccountNames = (accountNames = '') =>
    String(accountNames)
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);

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

/** Convert decimal hours → "20 mins" / "1 hr 20 mins" */
const formatDuration = (hoursValue) => {
    const hours = Number(hoursValue || 0);
    if (!Number.isFinite(hours) || hours <= 0) return '0 mins';

    const totalMinutes = Math.round(hours * 60);
    if (totalMinutes < 1) return '< 1 min';
    if (totalMinutes < 60) {
        return `${totalMinutes} min${totalMinutes === 1 ? '' : 's'}`;
    }

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const hourPart = `${h} hr${h === 1 ? '' : 's'}`;
    if (m === 0) return hourPart;
    return `${hourPart} ${m} min${m === 1 ? '' : 's'}`;
};

const SuperAdminUserOnline = () => {
    const history = useHistory();
    const { user } = useUserContext();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchSuperAdminApi(
                '/super-admin/analytics/user-online',
                user?.results?.token
            );
            setReport(data.data);
        } catch (fetchError) {
            setError(fetchError.message);
            setReport(null);
        } finally {
            setIsLoading(false);
        }
    }, [user?.results?.token]);

    useEffect(() => {
        if (!isSuperAdminUser(user)) {
            history.replace('/login');
            return;
        }
        fetchReport();
    }, [user, history, fetchReport]);

    const onlineUsers = report?.online_users || [];

    const refreshButton = (
        <button
            type="button"
            onClick={fetchReport}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
        >
            <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
        </button>
    );

    return (
        <SuperAdminShell
            activeId="user-online"
            title="User Online"
            subtitle="Users currently logged in and active in the portal"
            actions={refreshButton}
        >
            <div className="space-y-6">
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SuperAdminKpiCard
                        icon={FiUsers}
                        label="Total users"
                        value={report?.total_users ?? 0}
                        hint="Registered accounts"
                        accent="red"
                    />
                    <SuperAdminKpiCard
                        icon={FiUserCheck}
                        label="Total online"
                        value={report?.total_online ?? 0}
                        hint={`Active in last ${report?.online_window_minutes ?? 5} mins`}
                        accent="emerald"
                    />
                    <SuperAdminKpiCard
                        icon={FiUserX}
                        label="Total offline"
                        value={report?.total_offline ?? 0}
                        hint="Not currently active"
                        accent="blue"
                    />
                </section>

                {isLoading && !report ? (
                    <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                        <Loading size="lg" />
                    </div>
                ) : error ? (
                    <SuperAdminPanel title="Unable to load online users">
                        <p className="text-sm text-red-600">{error}</p>
                    </SuperAdminPanel>
                ) : (
                    <SuperAdminPanel
                        flush
                        title="Online users"
                        description={`${onlineUsers.length} user${onlineUsers.length === 1 ? '' : 's'} active now`}
                    >
                        {onlineUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center text-slate-500">
                                <FiWifi className="h-8 w-8 text-slate-300" />
                                <p className="text-sm font-medium text-slate-700">No one online right now</p>
                                <p className="text-xs">
                                    Online means a user is logged in and the portal sent activity within the last{' '}
                                    {report?.online_window_minutes ?? 5} minutes.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50">
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                User
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Account
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Phone
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Session started
                                            </th>
                                            <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Last activity
                                            </th>
                                            <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                Session time
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {onlineUsers.map((row) => (
                                            <tr key={`${row.user_id}-${row.session_id}`} className="hover:bg-emerald-50/40">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                                                            {getInitials(row.display_name)}
                                                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-medium capitalize text-slate-900">
                                                                {row.display_name}
                                                            </p>
                                                            <p className="truncate text-xs text-slate-500">
                                                                {row.email || '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {parseAccountNames(row.account_names).map((account) => (
                                                            <span
                                                                key={account}
                                                                className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
                                                            >
                                                                {account}
                                                            </span>
                                                        ))}
                                                        {!row.account_names && (
                                                            <span className="text-sm text-slate-400">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700">{row.phone}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {formatDateTime(row.login_at)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {formatDateTime(row.last_seen_at)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-semibold tabular-nums text-slate-900">
                                                    {formatDuration(row.session_hours)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </SuperAdminPanel>
                )}
            </div>
        </SuperAdminShell>
    );
};

export default SuperAdminUserOnline;
