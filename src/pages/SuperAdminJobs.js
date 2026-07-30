import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiClock, FiFilter, FiRefreshCw } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { fetchSuperAdminApi } from '../utils/superAdminApi';
import { isSuperAdminUser, SUPER_ADMIN_PHONE } from '../utils/superAdminUtils';
import SuperAdminShell from '../components/superAdmin/SuperAdminShell';
import { SuperAdminPanel } from '../components/superAdmin/SuperAdminDashboardCards';
import Loading from '../components/Loading';

const todayIso = () => new Date().toISOString().slice(0, 10);

const daysAgoIso = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
};

const STATUS_STYLES = {
    SUCCESS: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
    RUNNING: 'bg-amber-100 text-amber-800 border-amber-200',
    SKIPPED: 'bg-slate-100 text-slate-700 border-slate-200',
};

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

const SuperAdminJobs = () => {
    const history = useHistory();
    const { user } = useUserContext();

    const [fromDate, setFromDate] = useState(daysAgoIso(7));
    const [toDate, setToDate] = useState(todayIso());
    const [status, setStatus] = useState('');
    const [application, setApplication] = useState('');
    const [jobs, setJobs] = useState([]);
    const [statusCounts, setStatusCounts] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const queryPath = useMemo(() => {
        const params = new URLSearchParams();
        if (fromDate) params.set('fromDate', fromDate);
        if (toDate) params.set('toDate', toDate);
        if (status) params.set('status', status);
        if (application) params.set('application', application);
        params.set('limit', '300');
        return `/super-admin/jobs?${params.toString()}`;
    }, [fromDate, toDate, status, application]);

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchSuperAdminApi(queryPath, user?.results?.token);
            setJobs(data.data?.jobs || []);
            setStatusCounts(data.data?.status_counts || {});
        } catch (fetchError) {
            setError(fetchError.message);
            setJobs([]);
            setStatusCounts({});
        } finally {
            setIsLoading(false);
        }
    }, [queryPath, user?.results?.token]);

    useEffect(() => {
        if (!isSuperAdminUser(user)) {
            history.replace('/login');
            return;
        }
        fetchJobs();
    }, [user, history, fetchJobs]);

    const applyQuickRange = (days) => {
        setFromDate(daysAgoIso(days));
        setToDate(todayIso());
    };

    const refreshButton = (
        <button
            type="button"
            onClick={fetchJobs}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
        >
            <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
        </button>
    );

    return (
        <SuperAdminShell
            activeId="jobs"
            title="Jobs"
            subtitle={`Cron run logs · Super Admin ${SUPER_ADMIN_PHONE}`}
            actions={refreshButton}
        >
            <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-red-900 p-5 text-white shadow-xl sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                        Super Admin · {SUPER_ADMIN_PHONE}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Scheduled jobs</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                        Filter by date to review job id, name, description, and status for billing, rental, and personal loan crons.
                    </p>
                </div>

                <SuperAdminPanel
                    title="Daily schedule notes"
                    description="Server timezone — these jobs run automatically every day"
                >
                    <ul className="divide-y divide-slate-100">
                        {[
                            {
                                time: '00:15',
                                name: 'rm_rent_due_daily',
                                app: 'RENTAL_MANAGEMENT',
                                note: 'Creates monthly rent dues for active rental agreements when due dates arrive.',
                            },
                            {
                                time: '00:30',
                                name: 'pl_interest_only_monthly',
                                app: 'PERSONAL_LOAN',
                                note: 'Safety net for Interest Only loans — creates missing monthly interest dues and new month dues when due day arrives.',
                            },
                            {
                                time: '09:00',
                                name: 'billing_cycle_daily',
                                app: 'BILLING',
                                note: 'Checks active SaaS subscriptions and creates the next billing cycle when the previous cycle window allows it.',
                            },
                        ].map((job) => (
                            <li key={job.name} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
                                <div className="shrink-0 sm:w-40">
                                    <p className="text-sm font-bold text-slate-900">{job.time}</p>
                                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                        {job.app}
                                    </p>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-mono text-xs font-semibold text-red-700 sm:text-sm">
                                        {job.name}
                                    </p>
                                    <p className="mt-0.5 text-sm text-slate-600">{job.note}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </SuperAdminPanel>

                <SuperAdminPanel
                    title="Filters"
                    description="Choose a date range to see job status for that period"
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => applyQuickRange(0)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Today
                            </button>
                            <button
                                type="button"
                                onClick={() => applyQuickRange(7)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Last 7 days
                            </button>
                            <button
                                type="button"
                                onClick={() => applyQuickRange(30)}
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Last 30 days
                            </button>
                        </div>
                    }
                >
                    <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="block text-sm">
                            <span className="mb-1 block font-medium text-slate-700">From date</span>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                            />
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block font-medium text-slate-700">To date</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                            />
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block font-medium text-slate-700">Status</span>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                            >
                                <option value="">All statuses</option>
                                <option value="SUCCESS">SUCCESS</option>
                                <option value="FAILED">FAILED</option>
                                <option value="RUNNING">RUNNING</option>
                                <option value="SKIPPED">SKIPPED</option>
                            </select>
                        </label>
                        <label className="block text-sm">
                            <span className="mb-1 block font-medium text-slate-700">Application</span>
                            <select
                                value={application}
                                onChange={(e) => setApplication(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
                            >
                                <option value="">All apps</option>
                                <option value="PERSONAL_LOAN">PERSONAL_LOAN</option>
                                <option value="RENTAL_MANAGEMENT">RENTAL_MANAGEMENT</option>
                                <option value="BILLING">BILLING</option>
                            </select>
                        </label>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <FiFilter className="h-3.5 w-3.5" />
                            {jobs.length} job(s)
                        </span>
                        {Object.entries(statusCounts).map(([key, count]) => (
                            <span key={key}>
                                {key}: {count}
                            </span>
                        ))}
                    </div>
                </SuperAdminPanel>

                <SuperAdminPanel
                    flush
                    title="Job runs"
                    description="id · date · job name · description · status"
                >
                    {isLoading ? (
                        <div className="flex min-h-[30vh] items-center justify-center">
                            <Loading size="lg" />
                        </div>
                    ) : error ? (
                        <p className="p-6 text-sm text-red-600">{error}</p>
                    ) : jobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-10 text-center text-slate-500">
                            <FiClock className="h-8 w-8 text-slate-300" />
                            <p className="text-sm font-medium text-slate-700">No jobs for this filter</p>
                            <p className="text-xs">Widen the date range or wait for the next daily cron run.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Id</th>
                                        <th className="px-4 py-3 font-semibold">Date</th>
                                        <th className="px-4 py-3 font-semibold">Job name</th>
                                        <th className="px-4 py-3 font-semibold">Description</th>
                                        <th className="px-4 py-3 font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {jobs.map((job) => (
                                        <tr key={job.id} className="align-top hover:bg-slate-50/80">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-600">
                                                <div className="max-w-[9rem] break-all">{job.id}</div>
                                                <div className="mt-1 text-[10px] uppercase text-slate-400">
                                                    {job.application || '—'}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                                                <div className="font-medium">{formatDate(job.date)}</div>
                                                <div className="text-[11px] text-slate-400">
                                                    {formatDateTime(job.started_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800">
                                                {job.job_name || '—'}
                                            </td>
                                            <td className="max-w-md px-4 py-3 text-slate-600">
                                                <p className="line-clamp-3 text-xs leading-relaxed sm:text-sm">
                                                    {job.description || '—'}
                                                </p>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                                        STATUS_STYLES[String(job.status || '').toUpperCase()]
                                                        || 'bg-slate-100 text-slate-700 border-slate-200'
                                                    }`}
                                                >
                                                    {job.status || '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SuperAdminPanel>
            </div>
        </SuperAdminShell>
    );
};

export default SuperAdminJobs;
