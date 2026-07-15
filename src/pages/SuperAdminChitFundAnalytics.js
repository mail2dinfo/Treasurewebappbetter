import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    FiBarChart2,
    FiBriefcase,
    FiDollarSign,
    FiRefreshCw,
    FiSearch,
    FiUserCheck,
    FiUsers,
} from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { fetchSuperAdminApi } from '../utils/superAdminApi';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import SuperAdminShell from '../components/superAdmin/SuperAdminShell';
import { SuperAdminKpiCard, SuperAdminPanel } from '../components/superAdmin/SuperAdminDashboardCards';
import Loading from '../components/Loading';

const ACCOUNT_TYPE_KPIS = [
    { key: 'User', label: 'User', hint: 'Business owners', accent: 'red', icon: FiUsers },
    { key: 'Subscriber', label: 'Subscriber', hint: 'Group subscribers', accent: 'blue', icon: FiUserCheck },
    { key: 'Manager', label: 'Manager', hint: 'Group managers', accent: 'slate', icon: FiBriefcase },
    { key: 'Accountant', label: 'Accountant', hint: 'Finance roles', accent: 'emerald', icon: FiBarChart2 },
    { key: 'Collector', label: 'Collector', hint: 'Collection roles', accent: 'amber', icon: FiUsers },
];

const getInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

const formatCurrency = (value) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const SuperAdminChitFundAnalytics = () => {
    const history = useHistory();
    const { user } = useUserContext();
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchSuperAdminApi('/super-admin/analytics/chit-fund', user?.results?.token);
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

    const users = useMemo(() => report?.users || [], [report?.users]);

    const filteredUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return users;

        return users.filter((row) =>
            [row.display_name, row.phone, row.email]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [users, searchQuery]);

    const filteredTotals = useMemo(
        () => ({
            groupCount: filteredUsers.reduce((sum, row) => sum + Number(row.group_count || 0), 0),
            worth: filteredUsers.reduce((sum, row) => sum + Number(row.worth_of_business || 0), 0),
        }),
        [filteredUsers]
    );

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
            activeId="chit-fund"
            title="Chit Fund Analytics"
            subtitle="User account business capacity across chit groups"
            actions={refreshButton}
        >
            <div className="space-y-6">
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <SuperAdminKpiCard
                        icon={FiUsers}
                        label="Total users"
                        value={report?.total_users ?? 0}
                        hint="Distinct users on platform"
                        accent="red"
                    />
                    <SuperAdminKpiCard
                        icon={FiDollarSign}
                        label="Worth of business"
                        value={formatCurrency(report?.total_worth_of_business ?? 0)}
                        hint="Sum of all group amounts"
                        accent="blue"
                    />
                    <SuperAdminKpiCard
                        icon={FiBarChart2}
                        label="Total chits"
                        value={report?.total_groups ?? 0}
                        hint="Distinct chit groups"
                        accent="emerald"
                    />
                </section>

                <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                    {ACCOUNT_TYPE_KPIS.map((card) => (
                        <SuperAdminKpiCard
                            key={card.key}
                            icon={card.icon}
                            label={card.label}
                            value={report?.account_type_counts?.[card.key] ?? 0}
                            hint={card.hint}
                            accent={card.accent}
                        />
                    ))}
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
                        title="User business report"
                        description={`${filteredUsers.length} User account holder${filteredUsers.length === 1 ? '' : 's'} — groups linked by membership`}
                    >
                        <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                            <div className="relative max-w-md">
                                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="search"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    placeholder="Search user..."
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        {filteredUsers.length === 0 ? (
                            <p className="py-12 text-center text-sm text-slate-500">No User accounts found.</p>
                        ) : (
                            <>
                                <div className="divide-y divide-slate-100 md:hidden">
                                    {filteredUsers.map((row, index) => (
                                        <div key={row.user_id} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                                            <span className="w-6 shrink-0 text-center text-xs font-medium text-slate-400">
                                                {index + 1}
                                            </span>
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                                {getInitials(row.display_name)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium capitalize text-slate-900">
                                                    {row.display_name}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {row.group_count} chit{row.group_count === 1 ? '' : 's'}
                                                </p>
                                            </div>
                                            <p className="shrink-0 text-sm font-bold text-slate-900">
                                                {formatCurrency(row.worth_of_business)}
                                            </p>
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
                                                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        No of chits
                                                    </th>
                                                    <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Worth of business
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 bg-white">
                                                {filteredUsers.map((row, index) => (
                                                    <tr
                                                        key={row.user_id}
                                                        className={`transition hover:bg-blue-50/40 ${
                                                            index % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                                                        }`}
                                                    >
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-400">
                                                            {index + 1}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                                                                    {getInitials(row.display_name)}
                                                                </div>
                                                                <span className="font-medium capitalize text-slate-900">
                                                                    {row.display_name}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold tabular-nums text-slate-900">
                                                                {row.group_count}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="inline-flex items-center justify-end rounded-md bg-blue-600 px-3 py-1.5 text-sm font-bold tabular-nums text-white">
                                                                {formatCurrency(row.worth_of_business)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-slate-200 bg-slate-50">
                                                    <td colSpan={2} className="px-6 py-3 text-sm font-medium text-slate-600">
                                                        Total: {filteredUsers.length} users
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-sm font-bold text-slate-900">
                                                        {filteredTotals.groupCount} chits
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-sm font-bold text-slate-900">
                                                        {formatCurrency(filteredTotals.worth)}
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

export default SuperAdminChitFundAnalytics;
