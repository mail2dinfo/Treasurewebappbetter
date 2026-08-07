import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiEye, FiLogIn, FiRefreshCw, FiSearch, FiUserCheck, FiUsers, FiX } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { fetchSuperAdminApi } from '../utils/superAdminApi';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import SuperAdminShell from '../components/superAdmin/SuperAdminShell';
import { SuperAdminKpiCard, SuperAdminPanel } from '../components/superAdmin/SuperAdminDashboardCards';
import Loading from '../components/Loading';

const ACCOUNT_BADGE_STYLES = {
    User: 'bg-red-100 text-red-700 ring-red-200',
    Subscriber: 'bg-blue-100 text-blue-700 ring-blue-200',
    Manager: 'bg-violet-100 text-violet-700 ring-violet-200',
    Accountant: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    Collector: 'bg-amber-100 text-amber-700 ring-amber-200',
};

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

const formatDate = (value) => {
    if (!value) return '—';
    const raw = String(value).slice(0, 10);
    const d = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

/** Convert decimal hours → "20 mins" / "1 hr 20 mins" */
const formatHours = (value) => {
    const hours = Number(value || 0);
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

const AccountBadges = ({ accountNames = '' }) => {
    const accounts = parseAccountNames(accountNames);

    if (accounts.length === 0) {
        return <span className="text-sm text-slate-400">—</span>;
    }

    return (
        <div className="flex flex-wrap gap-1.5">
            {accounts.map((account) => (
                <span
                    key={account}
                    className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${
                        ACCOUNT_BADGE_STYLES[account] || 'bg-slate-100 text-slate-700 ring-slate-200'
                    }`}
                >
                    {account}
                </span>
            ))}
        </div>
    );
};

const LoginDetailsModal = ({ open, onClose, userRow, details, isLoading, error }) => {
    if (!open) return null;

    const days = details?.days || [];
    const totals = details?.totals || { login_times: 0, hours_spent: 0 };

    return (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <button
                type="button"
                className="absolute inset-0 border-0 bg-black/50"
                aria-label="Close"
                onClick={onClose}
            />
            <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-2xl sm:rounded-2xl">
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                    <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900">Login details</h3>
                        <p className="mt-0.5 truncate text-sm text-slate-500">
                            {userRow?.display_name || 'User'}
                            {userRow?.phone ? ` · ${userRow.phone}` : ''}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loading size="lg" />
                        </div>
                    ) : error ? (
                        <p className="text-sm text-red-600">{error}</p>
                    ) : (
                        <>
                            <div className="mb-4 grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        Total logins (range)
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-slate-900">
                                        {totals.login_times}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        Time spent (range)
                                    </p>
                                    <p className="mt-1 text-xl font-bold text-slate-900">
                                        {formatHours(totals.hours_spent)}
                                    </p>
                                </div>
                            </div>

                            {details?.note && (
                                <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                    {details.note}
                                </p>
                            )}

                            {days.length === 0 ? (
                                <p className="py-8 text-center text-sm text-slate-500">
                                    No date-wise session data yet for this user.
                                </p>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Date</th>
                                                <th className="px-4 py-3 text-right font-semibold">No of times</th>
                                                <th className="px-4 py-3 text-right font-semibold">Time spent</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {days.map((row) => (
                                                <tr key={String(row.date)} className="hover:bg-slate-50/80">
                                                    <td className="px-4 py-3 font-medium text-slate-800">
                                                        {formatDate(row.date)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                                        {row.login_times}
                                                    </td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                                        {formatHours(row.hours_spent)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const SuperAdminUserAnalytics = () => {
    const history = useHistory();
    const { user } = useUserContext();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [accountFilter, setAccountFilter] = useState('all');
    const [detailsUser, setDetailsUser] = useState(null);
    const [detailsData, setDetailsData] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState(null);

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchSuperAdminApi(
                '/super-admin/analytics/user-analytics/users',
                user?.results?.token
            );

            setReport(data.data);
        } catch (fetchError) {
            setError(fetchError.message);
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

    const users = useMemo(() => {
        return [...(report?.users || [])].sort(
            (a, b) => Number(b.login_count || 0) - Number(a.login_count || 0)
        );
    }, [report?.users]);

    const accountTypes = useMemo(() => {
        const fromApi = report?.account_types || [];
        if (fromApi.length > 0) return fromApi;

        const unique = new Set();
        users.forEach((row) => {
            parseAccountNames(row.account_names).forEach((name) => unique.add(name));
        });
        return [...unique].sort();
    }, [report?.account_types, users]);

    const filteredUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return users.filter((row) => {
            const accounts = parseAccountNames(row.account_names);
            const matchesAccount =
                accountFilter === 'all' || accounts.includes(accountFilter);

            if (!matchesAccount) return false;

            if (!query) return true;

            return [row.display_name, row.phone, row.email, row.account_names]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));
        });
    }, [users, searchQuery, accountFilter]);

    const stats = useMemo(() => {
        const totalLogins = users.reduce((sum, row) => sum + Number(row.login_count || 0), 0);
        const activeUsers = users.filter((row) => Number(row.login_count || 0) > 0).length;

        return {
            totalUsers: report?.total_users ?? users.length,
            totalLogins,
            activeUsers,
        };
    }, [report?.total_users, users]);

    const openDetails = async (row) => {
        setDetailsUser(row);
        setDetailsData(null);
        setDetailsError(null);
        setDetailsLoading(true);
        try {
            const data = await fetchSuperAdminApi(
                `/super-admin/analytics/user-analytics/users/${row.user_id}/login-details?days=90`,
                user?.results?.token
            );
            setDetailsData(data.data);
        } catch (fetchError) {
            setDetailsError(fetchError.message);
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeDetails = () => {
        setDetailsUser(null);
        setDetailsData(null);
        setDetailsError(null);
    };

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
            activeId="user-analytics"
            title="User Analytics"
            subtitle="Login activity for all MyTreasure users"
            actions={refreshButton}
        >
            <div className="space-y-6">
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SuperAdminKpiCard
                        icon={FiUsers}
                        label="Total users"
                        value={stats.totalUsers}
                        hint="Registered accounts"
                        accent="red"
                    />
                    <SuperAdminKpiCard
                        icon={FiUserCheck}
                        label="Active users"
                        value={stats.activeUsers}
                        hint="Logged in at least once"
                        accent="emerald"
                    />
                    <SuperAdminKpiCard
                        icon={FiLogIn}
                        label="Total logins"
                        value={stats.totalLogins}
                        hint="Combined login count"
                        accent="blue"
                    />
                </section>

                {isLoading ? (
                    <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                        <Loading size="lg" />
                    </div>
                ) : error ? (
                    <SuperAdminPanel title="Unable to load report">
                        <p className="text-sm text-red-600">{error}</p>
                    </SuperAdminPanel>
                ) : (
                    <SuperAdminPanel
                        flush
                        title="User login report"
                        description={`${filteredUsers.length} user${filteredUsers.length === 1 ? '' : 's'} listed`}
                    >
                        <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                <div className="relative flex-1">
                                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="search"
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder="Search user, phone, email, account..."
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                                    />
                                </div>
                                <select
                                    value={accountFilter}
                                    onChange={(event) => setAccountFilter(event.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 sm:w-48"
                                >
                                    <option value="all">All account types</option>
                                    {accountTypes.map((account) => (
                                        <option key={account} value={account}>
                                            {account}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {filteredUsers.length === 0 ? (
                            <p className="py-12 text-center text-sm text-slate-500">No users found.</p>
                        ) : (
                            <>
                                <div className="divide-y divide-slate-100 md:hidden">
                                    {filteredUsers.map((row, index) => (
                                        <div key={row.user_id} className="px-4 py-3 sm:px-6">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 shrink-0 text-center text-xs font-medium text-slate-400">
                                                    {index + 1}
                                                </span>
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                                                    {getInitials(row.display_name)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium capitalize text-slate-900">
                                                        {row.display_name}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500">{row.phone}</p>
                                                </div>
                                                <span className="shrink-0 rounded-md bg-slate-900 px-2.5 py-1 text-sm font-bold text-white">
                                                    {row.login_count}
                                                </span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between gap-2 pl-9">
                                                <AccountBadges accountNames={row.account_names} />
                                                <button
                                                    type="button"
                                                    onClick={() => openDetails(row)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                                                >
                                                    <FiEye className="h-3.5 w-3.5" />
                                                    View details
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="hidden md:block">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border-collapse text-left">
                                            <thead>
                                                <tr className="border-b border-slate-200 bg-slate-50">
                                                    <th className="w-16 px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        #
                                                    </th>
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
                                                        Email
                                                    </th>
                                                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Logins
                                                    </th>
                                                    <th className="sticky right-0 z-10 bg-slate-50 px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.12)]">
                                                        Actions
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {filteredUsers.map((row, index) => {
                                                    const rowBg =
                                                        index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white';
                                                    return (
                                                    <tr
                                                        key={row.user_id}
                                                        className={`transition hover:bg-red-50/40 ${rowBg}`}
                                                    >
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-400">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-semibold text-red-700">
                                                                    {getInitials(row.display_name)}
                                                                </div>
                                                                <span className="font-medium capitalize text-slate-900">
                                                                    {row.display_name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <AccountBadges accountNames={row.account_names} />
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-700">
                                                            {row.phone}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600">
                                                            {row.email || '—'}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-bold tabular-nums text-white">
                                                                {row.login_count}
                                                            </span>
                                                        </td>
                                                        <td
                                                            className={`sticky right-0 z-10 px-4 py-4 text-center shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.12)] ${
                                                                index % 2 === 1 ? 'bg-slate-50' : 'bg-white'
                                                            }`}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => openDetails(row)}
                                                                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                            >
                                                                <FiEye className="h-4 w-4" />
                                                                View details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-slate-200 bg-slate-50">
                                                    <td colSpan={5} className="px-6 py-3 text-sm font-medium text-slate-600">
                                                        Total: {filteredUsers.length} users
                                                        {accountFilter !== 'all' ? ` (${accountFilter})` : ''}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-sm font-bold text-slate-900">
                                                        {filteredUsers.reduce(
                                                            (sum, row) => sum + Number(row.login_count || 0),
                                                            0
                                                        )}{' '}
                                                        logins
                                                    </td>
                                                    <td className="sticky right-0 bg-slate-50 px-4 py-3 shadow-[-6px_0_8px_-6px_rgba(15,23,42,0.12)]" />
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </SuperAdminPanel>
                )}
            </div>

            <LoginDetailsModal
                open={Boolean(detailsUser)}
                onClose={closeDetails}
                userRow={detailsUser}
                details={detailsData}
                isLoading={detailsLoading}
                error={detailsError}
            />
        </SuperAdminShell>
    );
};

export default SuperAdminUserAnalytics;
