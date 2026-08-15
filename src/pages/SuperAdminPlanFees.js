import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiRefreshCw, FiSave } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { fetchSuperAdminApi } from '../utils/superAdminApi';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import { API_BASE_URL } from '../utils/apiConfig';
import SuperAdminShell from '../components/superAdmin/SuperAdminShell';
import { SuperAdminPanel } from '../components/superAdmin/SuperAdminDashboardCards';
import Loading from '../components/Loading';

const PLAN_ORDER = ['VeryBasic', 'Basic', 'Medium', 'Advance'];

const feeKey = (appCode, planId) => `${appCode}::${planId}`;

const SuperAdminPlanFees = () => {
    const history = useHistory();
    const { user } = useUserContext();
    const token = user?.results?.token;

    const [apps, setApps] = useState([]);
    const [planIds, setPlanIds] = useState(PLAN_ORDER);
    const [draft, setDraft] = useState({});
    const [savedSnapshot, setSavedSnapshot] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const applyPayload = useCallback((data) => {
        const nextApps = data?.apps || [];
        const nextPlans = data?.plan_ids?.length ? data.plan_ids : PLAN_ORDER;
        const nextDraft = {};

        (data?.fees || []).forEach((fee) => {
            nextDraft[feeKey(fee.app_code, fee.plan_id)] = String(
                Number(fee.monthly_amount ?? 0)
            );
        });

        setApps(nextApps);
        setPlanIds(nextPlans);
        setDraft(nextDraft);
        setSavedSnapshot(nextDraft);
    }, []);

    const loadFees = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const data = await fetchSuperAdminApi('/super-admin/billing/plan-fees', token);
            applyPayload(data?.data || data);
        } catch (err) {
            setError(err.message || 'Failed to load plan fees');
        } finally {
            setIsLoading(false);
        }
    }, [token, applyPayload]);

    useEffect(() => {
        if (!isSuperAdminUser(user)) {
            history.replace('/login');
            return;
        }
        loadFees();
    }, [user, history, loadFees]);

    const dirtyFees = useMemo(() => {
        const changes = [];
        Object.keys(draft).forEach((key) => {
            if (String(draft[key]) !== String(savedSnapshot[key] ?? '')) {
                const [app_code, plan_id] = key.split('::');
                changes.push({
                    app_code,
                    plan_id,
                    monthly_amount: Number(draft[key]),
                });
            }
        });
        return changes;
    }, [draft, savedSnapshot]);

    const handleChange = (appCode, planId, value) => {
        setDraft((prev) => ({
            ...prev,
            [feeKey(appCode, planId)]: value,
        }));
        setSuccess(null);
    };

    const handleSave = async () => {
        if (!token || dirtyFees.length === 0) return;

        const invalid = dirtyFees.find(
            (fee) => !Number.isFinite(fee.monthly_amount) || fee.monthly_amount < 0
        );
        if (invalid) {
            setError(`Invalid amount for ${invalid.app_code} / ${invalid.plan_id}`);
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(`${API_BASE_URL}/super-admin/billing/plan-fees`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fees: dirtyFees }),
            });
            const data = await response.json();
            if (!response.ok || data.success === false) {
                throw new Error(data.message || 'Failed to save plan fees');
            }
            applyPayload(data.data);
            setSuccess(`Saved ${dirtyFees.length} fee update${dirtyFees.length === 1 ? '' : 's'}`);
        } catch (err) {
            setError(err.message || 'Failed to save plan fees');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SuperAdminShell
            activeId="plan-fees"
            title="Plan Fees"
            subtitle="Set monthly SaaS price per app for VeryBasic, Basic, Medium, and Advance. Features stay unchanged."
            actions={(
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={loadFees}
                        disabled={isLoading || isSaving}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading || isSaving || dirtyFees.length === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        <FiSave />
                        {isSaving ? 'Saving…' : `Save${dirtyFees.length ? ` (${dirtyFees.length})` : ''}`}
                    </button>
                </div>
            )}
        >
            {isLoading ? (
                <Loading />
            ) : (
                <SuperAdminPanel>
                    {error && (
                        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </p>
                    )}
                    {success && (
                        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            {success}
                        </p>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-3 font-semibold">App</th>
                                    {planIds.map((planId) => (
                                        <th key={planId} className="px-3 py-3 font-semibold">
                                            {planId} (₹/mo)
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {apps.map((app) => {
                                    const appCode = app.app_code || app;
                                    const label = app.display_name || appCode;
                                    return (
                                        <tr key={appCode} className="border-b border-slate-100">
                                            <td className="px-3 py-3 font-medium text-slate-800">
                                                {label}
                                                <div className="text-xs font-normal text-slate-400">{appCode}</div>
                                            </td>
                                            {planIds.map((planId) => {
                                                const key = feeKey(appCode, planId);
                                                const dirty = String(draft[key] ?? '') !== String(savedSnapshot[key] ?? '');
                                                return (
                                                    <td key={key} className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            value={draft[key] ?? ''}
                                                            onChange={(e) => handleChange(appCode, planId, e.target.value)}
                                                            className={`w-28 rounded-lg border px-2 py-1.5 text-sm ${
                                                                dirty
                                                                    ? 'border-amber-400 bg-amber-50'
                                                                    : 'border-slate-200 bg-white'
                                                            }`}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <p className="mt-4 text-xs text-slate-500">
                        New users still onboard on VeryBasic. Changing prices here updates the catalog used for new upgrades and new subscriptions; existing open cycles keep their snapshot amount until renewal/upgrade.
                    </p>
                </SuperAdminPanel>
            )}
        </SuperAdminShell>
    );
};

export default SuperAdminPlanFees;
