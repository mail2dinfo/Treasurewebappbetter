import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiLogIn, FiRefreshCw, FiSearch, FiUserCheck, FiUsers } from 'react-icons/fi';
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

const SuperAdminUserAnalytics = () => {
    const history = useHistory();
    const { user } = useUserContext();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [accountFilter, setAccountFilter] = useState('all');

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
            subtitle="Login report for all MyTreasure users"
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
                                            <div className="mt-2 pl-9">
                                                <AccountBadges accountNames={row.account_names} />
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
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {filteredUsers.map((row, index) => (
                                                    <tr
                                                        key={row.user_id}
                                                        className={`transition hover:bg-red-50/40 ${
                                                            index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                                                        }`}
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
                                                    </tr>
                                                ))}
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
        </SuperAdminShell>
    );
};

export default SuperAdminUserAnalytics;
