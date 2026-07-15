import React, { useCallback, useEffect, useState } from 'react';
import {
    FiArrowRight,
    FiBarChart2,
    FiRefreshCw,
    FiTrendingUp,
} from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { fetchSuperAdminApi } from '../utils/superAdminApi';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import { SUPER_ADMIN_ANALYTICS } from '../utils/superAdminAnalytics';
import SuperAdminShell from '../components/superAdmin/SuperAdminShell';
import { SuperAdminKpiCard, SuperAdminPanel } from '../components/superAdmin/SuperAdminDashboardCards';
import Loading from '../components/Loading';

const moduleMeta = {
    'chit-fund': { icon: FiBarChart2, accent: 'blue' },
    'daily-finance': { icon: FiTrendingUp, accent: 'emerald' },
};

const SuperAdminHome = () => {
    const history = useHistory();
    const { user } = useUserContext();
    const [modules, setModules] = useState(SUPER_ADMIN_ANALYTICS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSummary = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await fetchSuperAdminApi('/super-admin/analytics/summary', user?.results?.token);
            setModules(
                data.data.modules.map((module) => {
                    const config = SUPER_ADMIN_ANALYTICS.find((item) => item.id === module.id);
                    return { ...config, ...module };
                })
            );
        } catch (fetchError) {
            setError(fetchError.message);
            setModules(SUPER_ADMIN_ANALYTICS);
        } finally {
            setIsLoading(false);
        }
    }, [user?.results?.token]);

    useEffect(() => {
        if (!isSuperAdminUser(user)) {
            history.replace('/login');
            return;
        }

        fetchSummary();
    }, [user, history, fetchSummary]);

    const visibleModules = modules.filter((module) => module.id !== 'user-analytics');
    const chitModule = visibleModules.find((m) => m.id === 'chit-fund');
    const dailyModule = visibleModules.find((m) => m.id === 'daily-finance');

    const refreshButton = (
        <button
            type="button"
            onClick={fetchSummary}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
        >
            <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
        </button>
    );

    return (
        <SuperAdminShell
            title="Analytics Overview"
            subtitle="Monitor MyTreasure platform performance across all apps"
            actions={refreshButton}
        >
            <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-red-900 p-5 text-white shadow-xl sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">Super Admin</p>
                <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Welcome to your command center</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                    Open each module below for Chit Fund and Daily Finance analytics.
                </p>
            </div>

            {error && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Could not load live counts: {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <Loading size="lg" />
                </div>
            ) : (
                <>
                    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <SuperAdminKpiCard
                            icon={FiBarChart2}
                            label="Chit fund groups"
                            value={chitModule?.metric_value ?? 0}
                            hint="Total groups created"
                            accent="blue"
                        />
                        <SuperAdminKpiCard
                            icon={FiTrendingUp}
                            label="Daily finance loans"
                            value={dailyModule?.metric_value ?? 0}
                            hint="Total daily collection loans"
                            accent="emerald"
                        />
                    </div>

                    <SuperAdminPanel title="Analytics modules" description="Select a report to drill down">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {visibleModules.map((module) => {
                                const meta = moduleMeta[module.id] || moduleMeta['chit-fund'];
                                const Icon = meta.icon;

                                return (
                                    <button
                                        key={module.id}
                                        type="button"
                                        onClick={() => module.isActive && module.path && history.push(module.path)}
                                        disabled={!module.isActive}
                                        className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-5 text-left transition hover:border-red-200 hover:bg-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${
                                                meta.accent === 'red' ? 'from-red-500 to-rose-600' :
                                                meta.accent === 'blue' ? 'from-blue-500 to-indigo-600' :
                                                'from-emerald-500 to-teal-600'
                                            }`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <FiArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-red-500" />
                                        </div>
                                        <h3 className="mt-4 text-lg font-semibold text-slate-900">{module.name}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-slate-500">{module.description}</p>
                                        {module.metric_label && module.metric_value != null && (
                                            <p className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                                {module.metric_label}: {module.metric_value}
                                            </p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </SuperAdminPanel>
                </>
            )}
        </SuperAdminShell>
    );
};

export default SuperAdminHome;
