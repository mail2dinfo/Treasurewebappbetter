import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import { FiCheck, FiSearch, FiSlash, FiUser, FiX } from 'react-icons/fi';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const today = () => new Date().toISOString().slice(0, 10);
const fieldClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

const scenarioMeta = (scenario) => {
    const value = String(scenario || 'RUNNING').toUpperCase();
    if (value === 'POSITIVE') return { label: 'Positive', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' };
    if (value === 'NEGATIVE' || value === 'INCOMPLETE' || value === 'CANCELLED') {
        return { label: 'Negative', className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100' };
    }
    if (value === 'CLOSED') return { label: 'Closed', className: 'bg-red-50 text-red-700 ring-1 ring-red-100' };
    if (value === 'SETTLED') return { label: 'Settled', className: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200' };
    return { label: 'Running', className: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100' };
};

const netOf = (row) => Number(row.net_amount ?? row.closing_balance ?? 0);
const scenarioOf = (row) => String(row.scenario || 'RUNNING').toUpperCase();

const DeepavaliPayablesPage = () => {
    const { payables, paymentMethods, settleSubscriber, enrolSlot, loading } = useDeepavali();
    const [statusTab, setStatusTab] = useState('ALL');
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [closeSlot, setCloseSlot] = useState(null);
    const [settleBundle, setSettleBundle] = useState(null);
    const [payAccount, setPayAccount] = useState('');

    const rows = payables || [];

    const counts = useMemo(() => ({
        ALL: rows.length,
        RUNNING: rows.filter((row) => ['RUNNING', 'CLOSED'].includes(scenarioOf(row))).length,
        READY: rows.filter((row) => row.can_settle && !row.is_paid).length,
        SETTLED: rows.filter((row) => row.is_paid).length,
    }), [rows]);

    const grouped = useMemo(() => {
        const q = search.trim().toLowerCase();
        const map = {};
        rows.forEach((row) => {
            const key = `${row.subscriber_id}::${row.group_id}`;
            if (!map[key]) {
                map[key] = {
                    key,
                    subscriber: row.subscriber,
                    group: row.group,
                    slots: [],
                };
            }
            map[key].slots.push(row);
        });
        return Object.values(map).map((bundle) => {
            const slots = bundle.slots.slice().sort((a, b) => Number(a.slot?.slot_number || 0) - Number(b.slot?.slot_number || 0));
            const unpaid = slots.filter((slot) => !slot.is_paid);
            const canSettleAll = unpaid.length > 0 && unpaid.every((slot) => slot.can_settle);
            const dueNow = canSettleAll ? unpaid.reduce((sum, slot) => sum + netOf(slot), 0) : 0;
            const agreed = slots.reduce((sum, slot) => sum + Number(slot.agreed_amount || 0), 0);
            const collected = slots.reduce((sum, slot) => sum + Number(slot.collected_amount || 0), 0);
            const penalty = unpaid.reduce((sum, slot) => sum + Number(slot.penalty_amount || 0), 0);
            const lastDue = unpaid.reduce((max, slot) => {
                const date = String(slot.last_due_date || '').slice(0, 10);
                if (!date) return max;
                return !max || date > max ? date : max;
            }, null);
            return { ...bundle, slots, unpaid, canSettleAll, dueNow, agreed, collected, penalty, lastDue };
        }).filter((bundle) => {
            if (statusTab === 'RUNNING' && !bundle.slots.some((slot) => ['RUNNING', 'CLOSED'].includes(scenarioOf(slot)))) return false;
            if (statusTab === 'READY' && !bundle.canSettleAll) return false;
            if (statusTab === 'SETTLED' && !bundle.slots.every((slot) => slot.is_paid)) return false;
            if (!q) return true;
            const blob = `${bundle.subscriber?.subscriber_name || ''} ${bundle.subscriber?.phone || ''} ${bundle.group?.group_name || ''}`.toLowerCase();
            return blob.includes(q);
        }).sort((a, b) => Number(b.dueNow) - Number(a.dueNow));
    }, [rows, search, statusTab]);

    const payNow = useMemo(
        () => grouped.filter((bundle) => bundle.canSettleAll).reduce((sum, bundle) => sum + bundle.dueNow, 0),
        [grouped]
    );

    const openSettle = (bundle) => {
        if (!paymentMethods.length) {
            toast.error('Add a ledger account first');
            return;
        }
        setSettleBundle(bundle);
        setPayAccount(paymentMethods[0].id);
    };

    const confirmSettle = async () => {
        if (!settleBundle || !payAccount) {
            toast.error('Select a ledger account');
            return;
        }
        setSaving(true);
        try {
            const result = await settleSubscriber({
                subscriber_id: settleBundle.subscriber?.id || settleBundle.slots[0]?.subscriber_id,
                group_id: settleBundle.group?.id || settleBundle.slots[0]?.group_id,
                payment_method_id: payAccount,
                payment_date: today(),
            });
            toast.success(`${result?.bill_label || 'Bill'} paid for ${result?.slots || settleBundle.unpaid.length} slot${(result?.slots || settleBundle.unpaid.length) === 1 ? '' : 's'}`);
            setSettleBundle(null);
        } catch (err) {
            toast.error(err.message || 'Settlement failed');
        } finally {
            setSaving(false);
        }
    };

    const confirmClose = async () => {
        if (!closeSlot?.slot?.id) return;
        setSaving(true);
        try {
            await enrolSlot({ slot_id: closeSlot.slot.id, unsubscribe: true });
            toast.success(`Slot ${closeSlot.slot.slot_number} closed. Remaining dues written off. Pay after last due date.`);
            setCloseSlot(null);
        } catch (err) {
            toast.error(err.message || 'Could not close this slot');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'ALL', label: 'All', count: counts.ALL },
        { id: 'READY', label: 'To pay', count: counts.READY },
        { id: 'RUNNING', label: 'Running', count: counts.RUNNING },
        { id: 'SETTLED', label: 'Settled', count: counts.SETTLED },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-5">
                <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 sm:p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">Payables</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{counts.READY} slot{counts.READY === 1 ? '' : 's'} ready after last due</p>
                        </div>
                        <div className="md:text-right rounded-xl bg-red-50 px-4 py-3 min-w-[160px]">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-red-500">Pay now</p>
                            <p className="text-xl font-bold text-red-600 tabular-nums">{money(payNow)}</p>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subscriber, phone or group" className={`pl-9 ${fieldClass}`} />
                        </div>
                        <div className="flex rounded-xl bg-gray-100 p-1 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setStatusTab(tab.id)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap ${statusTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                                >
                                    {tab.label} {tab.count}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading && !rows.length && <p className="text-sm text-gray-500 text-center py-10">Loading payables…</p>}

                {!rows.length && !loading && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FiUser className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="font-semibold text-gray-800">No payables yet</p>
                    </div>
                )}

                {Boolean(rows.length) && !grouped.length && (
                    <p className="text-sm text-gray-500 text-center py-8">No records in this view.</p>
                )}

                <div className="space-y-4">
                    {grouped.map((bundle) => {
                        const name = bundle.subscriber?.subscriber_name || 'Subscriber';
                        return (
                            <article key={bundle.key} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-4 bg-gray-50 border-b border-gray-100">
                                    <div className="w-11 h-11 rounded-full bg-red-500 text-white flex items-center justify-center font-bold overflow-hidden shrink-0">
                                        {bundle.subscriber?.photo
                                            ? <img src={bundle.subscriber.photo} alt="" className="w-full h-full object-cover" />
                                            : name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-900 truncate">{name}</p>
                                        <p className="text-xs text-gray-500 truncate">{bundle.subscriber?.phone || '—'} · {bundle.group?.group_name || '—'} · {bundle.slots.length} slot{bundle.slots.length === 1 ? '' : 's'}</p>
                                    </div>
                                    <div className="flex items-center gap-3 ml-auto">
                                        {bundle.canSettleAll && (
                                            <div className="text-right">
                                                <p className="text-[11px] text-gray-500">To pay</p>
                                                <p className="text-sm font-bold text-red-600 tabular-nums">{money(bundle.dueNow)}</p>
                                            </div>
                                        )}
                                        {bundle.canSettleAll && (
                                            <button type="button" onClick={() => openSettle(bundle)} className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white">
                                                Settle all slots
                                            </button>
                                        )}
                                        {!bundle.canSettleAll && bundle.unpaid.length > 0 && bundle.lastDue && (
                                            <p className="text-xs text-gray-500 text-right">Pay after {bundle.lastDue}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="px-4 sm:px-5 py-3 grid grid-cols-4 gap-2 text-center border-b border-gray-100 bg-white">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-gray-500">Agreed</p>
                                        <p className="text-sm font-semibold tabular-nums">{money(bundle.agreed)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-emerald-700">Collected</p>
                                        <p className="text-sm font-semibold tabular-nums text-emerald-800">{money(bundle.collected)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-red-600">Fine</p>
                                        <p className="text-sm font-semibold tabular-nums text-red-700">{money(bundle.penalty)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-gray-500">Pay</p>
                                        <p className="text-sm font-semibold tabular-nums">{money(bundle.dueNow)}</p>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {bundle.slots.map((row) => {
                                        const meta = scenarioMeta(row.scenario);
                                        const running = scenarioOf(row) === 'RUNNING' && !row.is_paid;
                                        return (
                                            <div key={row.id} className="px-4 sm:px-5 py-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold text-gray-900">Slot {row.slot?.slot_number || '—'}</span>
                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.className}`}>{meta.label}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {running && (
                                                            <button type="button" onClick={() => setCloseSlot(row)} className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">Close</button>
                                                        )}
                                                        {row.is_paid && <span className="text-xs text-gray-500 self-center">{row.bill_label || 'Paid'}</span>}
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-4 gap-2 text-center">
                                                    <div className="rounded-lg bg-gray-50 py-2">
                                                        <p className="text-[10px] uppercase tracking-wide text-gray-500">Agreed</p>
                                                        <p className="text-xs sm:text-sm font-semibold tabular-nums">{money(row.agreed_amount)}</p>
                                                    </div>
                                                    <div className="rounded-lg bg-emerald-50 py-2">
                                                        <p className="text-[10px] uppercase tracking-wide text-emerald-700">In</p>
                                                        <p className="text-xs sm:text-sm font-semibold tabular-nums text-emerald-800">{money(row.collected_amount)}</p>
                                                    </div>
                                                    <div className="rounded-lg bg-red-50 py-2">
                                                        <p className="text-[10px] uppercase tracking-wide text-red-600">Fine</p>
                                                        <p className="text-xs sm:text-sm font-semibold tabular-nums text-red-700">{money(row.penalty_amount)}</p>
                                                    </div>
                                                    <div className="rounded-lg bg-gray-900 py-2">
                                                        <p className="text-[10px] uppercase tracking-wide text-gray-300">Pay</p>
                                                        <p className="text-xs sm:text-sm font-semibold tabular-nums text-white">{money(row.is_paid || !row.can_settle ? 0 : netOf(row))}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>

            {settleBundle && createPortal(
                <div className="fixed inset-0 z-[210] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => { if (!saving) setSettleBundle(null); }}>
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Settle all slots</h3>
                                <p className="text-sm text-gray-500">{settleBundle.subscriber?.subscriber_name} · {settleBundle.group?.group_name}</p>
                            </div>
                            <button type="button" className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" onClick={() => setSettleBundle(null)} aria-label="Close"><FiX className="w-5 h-5" /></button>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-gray-200 text-sm">
                            <div className="bg-red-500 text-white px-4 py-2 text-[11px] font-semibold uppercase tracking-wide flex justify-between"><span>Particulars</span><span>Amount</span></div>
                            {settleBundle.unpaid.map((row) => (
                                <div key={row.id} className="flex justify-between px-4 py-2 border-t border-gray-100">
                                    <span className="text-gray-600">Slot {row.slot?.slot_number} · {scenarioMeta(row.scenario).label}</span>
                                    <span className="font-medium tabular-nums">{money(netOf(row))}</span>
                                </div>
                            ))}
                            <div className="flex justify-between px-4 py-2.5 bg-gray-50 border-t font-semibold">
                                <span>Pay subscriber</span>
                                <span className="text-red-600 tabular-nums">{money(settleBundle.dueNow)}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Pending receivables on these slots will be written off.</p>
                        <label className="block text-sm font-medium text-gray-700">
                            Pay from
                            <select value={payAccount} onChange={(e) => setPayAccount(e.target.value)} className={`mt-1 ${fieldClass}`}>
                                {paymentMethods.map((acc) => <option key={acc.id} value={acc.id}>{acc.account_name}</option>)}
                            </select>
                        </label>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setSettleBundle(null)} disabled={saving} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium">Cancel</button>
                            <button type="button" onClick={confirmSettle} disabled={saving} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-1.5">
                                <FiCheck /> {saving ? 'Paying…' : 'Pay'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {closeSlot && createPortal(
                <div className="fixed inset-0 z-[210] bg-black/50 flex items-center justify-center p-4" onClick={() => { if (!saving) setCloseSlot(null); }}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900">Close slot {closeSlot.slot?.slot_number}?</h3>
                        <p className="text-sm text-gray-600 mt-2">Remaining dues on this slot are written off. Payout is collected minus fine, only after the last due date, with the subscriber’s other slots.</p>
                        <div className="flex gap-3 mt-5">
                            <button type="button" onClick={() => setCloseSlot(null)} disabled={saving} className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium">Cancel</button>
                            <button type="button" onClick={confirmClose} disabled={saving} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-1.5">
                                <FiSlash /> {saving ? 'Closing…' : 'Close'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DeepavaliPayablesPage;
