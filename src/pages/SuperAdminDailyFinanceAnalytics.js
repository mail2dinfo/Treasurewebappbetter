import React, { useCallback, useEffect, useState } from 'react';
import { FiBriefcase, FiRefreshCw, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { fetchSuperAdminApi } from '../utils/superAdminApi';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import SuperAdminShell from '../components/superAdmin/SuperAdminShell';
import { SuperAdminKpiCard, SuperAdminPanel } from '../components/superAdmin/SuperAdminDashboardCards';
import Loading from '../components/Loading';

const statCards = [
    { key: 'total_companies', label: 'Total companies', hint: 'Daily finance companies', icon: FiBriefcase, accent: 'emerald' },
    { key: 'total_loans', label: 'Total loans', hint: 'Loans on record', icon: FiTrendingUp, accent: 'blue' },
    { key: 'active_users', label: 'Active users', hint: 'Users with daily finance data', icon: FiUsers, accent: 'amber' },
];

const SuperAdminDailyFinanceAnalytics = () => {
    const history = useHistory();
    const { user } = useUserContext();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchSuperAdminApi('/super-admin/analytics/daily-finance', user?.results?.token);
            setStats(data.data);
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

        fetchStats();
    }, [user, history, fetchStats]);

    const refreshButton = (
        <button
            type="button"
            onClick={fetchStats}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
        >
            <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
        </button>
    );

    return (
        <SuperAdminShell
            activeId="daily-finance"
            title="Daily Finance Analytics"
            subtitle="Daily collection companies, loans, and active users"
            actions={refreshButton}
        >
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-slate-800 to-slate-900 p-5 text-white shadow-xl sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Daily Finance module</p>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Collection performance snapshot</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Monitor daily collection activity including companies, loans, and engaged users.
                </p>
            </div>

            {isLoading ? (
                <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <Loading size="lg" />
                </div>
            ) : error ? (
                <SuperAdminPanel title="Unable to load data">
                    <p className="text-sm text-red-600">{error}</p>
                </SuperAdminPanel>
            ) : (
                <SuperAdminPanel title="Key metrics" description="Current totals across the Daily Finance platform">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {statCards.map((card) => (
                            <SuperAdminKpiCard
                                key={card.key}
                                icon={card.icon}
                                label={card.label}
                                value={stats?.[card.key] ?? 0}
                                hint={card.hint}
                                accent={card.accent}
                            />
                        ))}
                    </div>
                </SuperAdminPanel>
            )}
        </SuperAdminShell>
    );
};

export default SuperAdminDailyFinanceAnalytics;
