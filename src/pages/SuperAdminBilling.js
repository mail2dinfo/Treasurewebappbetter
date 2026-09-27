import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import { fetchSuperAdminApi, patchSuperAdminApi } from '../utils/superAdminApi';
import { API_BASE_URL } from '../utils/apiConfig';
import SuperAdminShell from '../components/superAdmin/SuperAdminShell';
import { SuperAdminPanel } from '../components/superAdmin/SuperAdminDashboardCards';
import { getBillingAppLabel } from '../utils/billingAppLabels';

const STATUS_LABELS = {
    active: 'Running',
    suspended: 'Stopped',
    none: 'Not started',
    expired: 'Expired',
};

const PLAN_ORDER = ['VeryBasic', 'Basic', 'Medium', 'Advance'];

const feeKey = (appCode, planId) => `${appCode}::${planId}`;

const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const postSuperAdminApi = async (path, token, body) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Request failed');
    }
    return data;
};

const CycleList = ({ title, cycles, emptyText, tone = 'slate', onMarkPaid, busy }) => (
    <div>
        <p className={`text-xs font-semibold uppercase tracking-wide ${
            tone === 'green' ? 'text-green-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-600'
        }`}>
            {title} ({cycles.length})
        </p>
        {cycles.length === 0 ? (
            <p className="mt-1 text-xs text-slate-400">{emptyText}</p>
        ) : (
            <div className="mt-2 space-y-2">
                {cycles.map((cycle) => (
                    <div
                        key={cycle.id}
                        className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs ${
                            tone === 'green'
                                ? 'bg-green-50 text-green-900'
                                : tone === 'amber'
                                    ? 'bg-amber-50 text-amber-900'
                                    : 'bg-slate-50 text-slate-800'
                        }`}
                    >
                        <div>
                            <p className="font-semibold">
                                Cycle {cycle.cycle_number}
                                {' · '}
                                {formatMoney(cycle.amount)}
                                {Number(cycle.amount) === 0 ? ' (trial)' : ''}
                            </p>
                            <p className="mt-0.5 opacity-80">
                                {formatDate(cycle.cycle_start_date)} → {formatDate(cycle.cycle_end_date)}
                                {' · '}
                                <span className="capitalize">{cycle.status}</span>
                                {cycle.payment_reference ? ` · Ref ${cycle.payment_reference}` : ''}
                            </p>
                        </div>
                        {onMarkPaid && ['pending', 'unpaid'].includes(cycle.status) && Number(cycle.amount) > 0 && (
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => onMarkPaid(cycle.id)}
                                className="rounded-md border border-amber-300 bg-white px-2 py-1 font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                            >
                                Mark paid
                            </button>
                        )}
                    </div>
                ))}
            </div>
        )}
    </div>
);

const SuperAdminBilling = () => {
    const history = useHistory();
    const { user } = useUserContext();
    const token = user?.results?.token;

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selected, setSelected] = useState(null);
    const [overview, setOverview] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);
    const [reason, setReason] = useState('Stopped by customer service');
    const [feeApps, setFeeApps] = useState([]);
    const [feePlanIds, setFeePlanIds] = useState(PLAN_ORDER);
    const [feeDraft, setFeeDraft] = useState({});
    const [feeSnapshot, setFeeSnapshot] = useState({});
    const [isSavingFees, setIsSavingFees] = useState(false);

    if (!isSuperAdminUser(user)) {
        history.push('/login');
        return null;
    }

    const applyFeePayload = (data) => {
        const nextDraft = {};
        (data?.fees || []).forEach((fee) => {
            nextDraft[feeKey(fee.app_code, fee.plan_id)] = String(
                Number(fee.monthly_amount ?? 0)
            );
        });
        setFeeApps(data?.apps || []);
        setFeePlanIds(data?.plan_ids?.length ? data.plan_ids : PLAN_ORDER);
        setFeeDraft(nextDraft);
        setFeeSnapshot(nextDraft);
    };

    const loadPlanFees = async (membershipId) => {
        const data = await fetchSuperAdminApi(
            `/super-admin/billing/${membershipId}/plan-fees`,
            token
        );
        applyFeePayload(data.data);
    };

    const handleSavePlanFees = async () => {
        if (!selected) return;
        const fees = Object.entries(feeDraft).map(([key, value]) => {
            const [app_code, plan_id] = key.split('::');
            return {
                app_code,
                plan_id,
                monthly_amount: Number(value),
            };
        });
        const invalid = fees.find((fee) => !Number.isFinite(fee.monthly_amount) || fee.monthly_amount < 0);
        if (invalid) {
            setError(`Invalid amount for ${invalid.app_code} / ${invalid.plan_id}`);
            return;
        }
        setIsSavingFees(true);
        setError(null);
        try {
            const data = await patchSuperAdminApi(
                `/super-admin/billing/${selected.membership_id}/plan-fees`,
                token,
                { fees }
            );
            applyFeePayload(data.data);
            await loadOverview(selected.membership_id);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSavingFees(false);
        }
    };

    const loadOverview = async (membershipId) => {
        const data = await fetchSuperAdminApi(`/super-admin/billing/${membershipId}`, token);
        setOverview(data.data);
    };

    const handleSelect = async (row) => {
        setSelected(row);
        setError(null);
        setBusy(true);
        try {
            await loadOverview(row.membership_id);
            await loadPlanFees(row.membership_id);
        } catch (err) {
            setError(err.message);
            setOverview(null);
            setFeeDraft({});
            setFeeSnapshot({});
        } finally {
            setBusy(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        setOverview(null);
        setSelected(null);
        setFeeDraft({});
        setFeeSnapshot({});
        try {
            const data = await fetchSuperAdminApi(
                `/super-admin/billing/search?q=${encodeURIComponent(query.trim())}`,
                token
            );
            const rows = data.data || [];
            setSearchResults(rows);
            if (!rows.length) {
                setError('No customer found for that phone number');
                return;
            }
            if (rows.length === 1) {
                await handleSelect(rows[0]);
            }
        } catch (err) {
            setError(err.message);
            setSearchResults([]);
        } finally {
            setBusy(false);
        }
    };

    const handleStop = async (appCode) => {
        if (!selected) return;
        setBusy(true);
        setError(null);
        try {
            const data = await postSuperAdminApi(
                `/super-admin/billing/${selected.membership_id}/suspend`,
                token,
                { app_code: appCode, reason }
            );
            setOverview(data.data.overview);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const handleStart = async (appCode) => {
        if (!selected) return;
        setBusy(true);
        setError(null);
        try {
            const data = await postSuperAdminApi(
                `/super-admin/billing/${selected.membership_id}/resume`,
                token,
                { app_code: appCode }
            );
            setOverview(data.data.overview);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const handleMarkPaid = async (appCode, paymentId) => {
        if (!selected) return;
        const paymentReference = window.prompt('Enter payment reference / receipt number');
        if (!paymentReference) return;
        setBusy(true);
        setError(null);
        try {
            const data = await postSuperAdminApi(
                `/super-admin/billing/${selected.membership_id}/mark-paid`,
                token,
                {
                    app_code: appCode,
                    payment_id: paymentId,
                    payment_reference: paymentReference,
                }
            );
            setOverview(data.data.overview);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <SuperAdminShell
            activeId="billing"
            title="Billing Control"
            subtitle="Customer calls in → search phone → set per-user plan prices or start/stop billing"
            toolbar={(
                <div className="w-full text-left">
                    <label className="mb-1.5 block text-sm font-semibold text-slate-900">
                        Find customer by phone
                    </label>
                    <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                            type="tel"
                            inputMode="numeric"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Phone number (min 3 digits)"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:max-w-md"
                        />
                        <button
                            type="submit"
                            disabled={busy || query.trim().length < 3}
                            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 sm:shrink-0"
                        >
                            {busy ? 'Searching…' : 'Search'}
                        </button>
                    </form>

                    {searchResults.length > 0 && (
                        <div className="mt-3 w-full max-w-xl divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white text-left">
                            {searchResults.map((row) => (
                                <button
                                    key={row.membership_id}
                                    type="button"
                                    onClick={() => handleSelect(row)}
                                    className={`flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-slate-50 ${
                                        selected?.membership_id === row.membership_id ? 'bg-red-50' : ''
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-slate-900">{row.display_name}</p>
                                        <p className="truncate text-xs text-slate-500">
                                            {row.phone} · {row.email || 'no email'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-xs font-medium text-slate-600">
                                        #{row.membership_id}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        >
            <div className="space-y-4 text-left">
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700">
                        {error}
                    </div>
                )}

                {selected && overview && (
                    <SuperAdminPanel
                        className="text-left"
                        title={`${selected.display_name || 'Customer'} · ${selected.phone || ''}`}
                        description={`Membership #${selected.membership_id} · apps with paid / unpaid cycles`}
                        actions={(
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-56 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                                placeholder="Stop reason"
                            />
                        )}
                    >
                        <div className="space-y-4">
                            {Object.keys(feeDraft).length > 0 && (
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="font-semibold text-slate-900">Plan fees for this customer</p>
                                            <p className="text-xs text-slate-500">
                                                These amounts are what this parent membership sees. Catalog on Plan Fees is only the template for new signups.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={busy || isSavingFees || JSON.stringify(feeDraft) === JSON.stringify(feeSnapshot)}
                                            onClick={handleSavePlanFees}
                                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                                        >
                                            {isSavingFees ? 'Saving…' : 'Save prices'}
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-xs">
                                            <thead>
                                                <tr className="text-left text-slate-500">
                                                    <th className="px-2 py-2">App</th>
                                                    {feePlanIds.map((planId) => (
                                                        <th key={planId} className="px-2 py-2">{planId}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {feeApps.map((app) => (
                                                    <tr key={app.app_code} className="border-t border-slate-100">
                                                        <td className="px-2 py-2 font-medium text-slate-800">
                                                            {app.display_name || getBillingAppLabel(app.app_code)}
                                                        </td>
                                                        {feePlanIds.map((planId) => {
                                                            const key = feeKey(app.app_code, planId);
                                                            return (
                                                                <td key={key} className="px-2 py-2">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        value={feeDraft[key] ?? ''}
                                                                        onChange={(e) => setFeeDraft((prev) => ({
                                                                            ...prev,
                                                                            [key]: e.target.value,
                                                                        }))}
                                                                        className="w-24 rounded border border-slate-300 px-2 py-1"
                                                                    />
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {(overview.apps || []).length === 0 && (
                                <p className="text-sm text-slate-500">
                                    This customer has no app subscriptions with billing cycles yet.
                                </p>
                            )}
                            {(overview.apps || []).map((app) => {
                                const paidCycles = app.paid_cycles || [];
                                const unpaidCycles = app.unpaid_cycles || app.outstanding_cycles || [];
                                const canStop = app.can_stop === true
                                    || (app.status === 'active' && app.cycles_started);
                                const canStart = app.can_start === true || app.status === 'suspended';
                                const statusLabel = STATUS_LABELS[app.status] || app.status;

                                return (
                                    <div
                                        key={app.app_code}
                                        className="rounded-xl border border-slate-200 p-4"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    {getBillingAppLabel(app.app_code)}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Status:{' '}
                                                    <span className="font-semibold text-slate-800">
                                                        {statusLabel}
                                                    </span>
                                                    {app.plan_name ? ` · ${app.plan_name}` : ''}
                                                    {app.amount != null ? ` · ${formatMoney(app.amount)}/mo` : ''}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Paid: {app.paid_count ?? paidCycles.length} cycles
                                                    {' · '}
                                                    {formatMoney(app.paid_amount ?? paidCycles.reduce((s, c) => s + Number(c.amount || 0), 0))}
                                                    {' · '}
                                                    Unpaid: {app.unpaid_count ?? unpaidCycles.length} cycles
                                                    {' · '}
                                                    {formatMoney(app.unpaid_amount ?? app.outstanding_amount)}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    disabled={busy || !canStart || (unpaidCycles.filter((c) => Number(c.amount) > 0).length > 0)}
                                                    onClick={() => handleStart(app.app_code)}
                                                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-40"
                                                    title={
                                                        !canStart
                                                            ? 'Start is only for stopped apps'
                                                            : unpaidCycles.some((c) => Number(c.amount) > 0)
                                                                ? 'Clear unpaid dues before starting'
                                                                : 'Start automatic billing'
                                                    }
                                                >
                                                    Start Automatic Billing
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={busy || !canStop}
                                                    onClick={() => handleStop(app.app_code)}
                                                    className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
                                                    title={
                                                        app.status !== 'active'
                                                            ? 'Billing is not running'
                                                            : 'Stop Automatic Billing'
                                                    }
                                                >
                                                    Stop Automatic Billing
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                            {paidCycles.length > 0 && (
                                                <CycleList
                                                    title="Paid"
                                                    cycles={paidCycles}
                                                    emptyText="No paid cycles"
                                                    tone="green"
                                                />
                                            )}
                                            {unpaidCycles.length > 0 && (
                                                <CycleList
                                                    title="Unpaid"
                                                    cycles={unpaidCycles}
                                                    emptyText="No unpaid cycles"
                                                    tone="amber"
                                                    busy={busy}
                                                    onMarkPaid={(paymentId) => handleMarkPaid(app.app_code, paymentId)}
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </SuperAdminPanel>
                )}
            </div>
        </SuperAdminShell>
    );
};

export default SuperAdminBilling;
