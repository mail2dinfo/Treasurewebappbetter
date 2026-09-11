import React, { useEffect, useMemo, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiClock, FiCreditCard, FiMapPin, FiRefreshCw, FiTruck } from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { vpRequest, formatWhen, money } from '../../utils/vpClient';

const VP_CUSTOMER_PARENT_KEY = 'vp_customer_parent_id';

const statusTone = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'PARKED' || s === 'BOOKED' || s === 'ACTIVE') return 'bg-emerald-50 text-emerald-800 border-emerald-100';
    if (s === 'ENDED' || s === 'EXPIRED' || s === 'CANCELLED') return 'bg-gray-100 text-gray-600 border-gray-200';
    if (s === 'CHECKED_OUT' || s === 'PAID') return 'bg-sky-50 text-sky-800 border-sky-100';
    return 'bg-amber-50 text-amber-800 border-amber-100';
};

const Pill = ({ children, className = '' }) => (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}>
        {children}
    </span>
);

const EmptyState = ({ icon: Icon, title, text }) => (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-700">
            <Icon className="h-5 w-5" />
        </span>
        <p className="mt-3 font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-sm text-gray-500">{text}</p>
    </div>
);

const PhotoRow = ({ ticket }) => {
    if (!ticket?.vehicle_photo && !ticket?.customer_photo) return null;
    return (
        <div className="mt-3 flex gap-2">
            {ticket.vehicle_photo ? (
                <img src={ticket.vehicle_photo} alt="Vehicle" className="h-20 w-20 rounded-xl border object-cover" />
            ) : null}
            {ticket.customer_photo ? (
                <img src={ticket.customer_photo} alt="You" className="h-20 w-20 rounded-xl border object-cover" />
            ) : null}
        </div>
    );
};

const PayBox = ({ accounts, parentId, ticketParentId }) => {
    const rows = (accounts || []).filter(
        (a) => (a.qr_code || a.payee_phone)
            && String(a.parent_membership_id) === String(ticketParentId || parentId)
    );
    if (!rows.length) return null;
    return (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
            <p className="text-sm font-semibold text-indigo-950">Pay this parking</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {rows.map((a) => (
                    <div key={a.id} className="rounded-lg bg-white p-3 border border-indigo-100">
                        <p className="text-sm font-medium text-gray-900">{a.account_name}</p>
                        {a.payee_phone ? <p className="mt-0.5 text-lg font-bold tracking-wide text-indigo-950">{a.payee_phone}</p> : null}
                        {a.qr_code ? (
                            <img src={a.qr_code} alt={`${a.account_name} QR`} className="mt-2 h-36 w-36 object-contain" />
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const VehicleParkingCustomerPage = () => {
    const { user } = useUserContext();
    const token = user?.results?.token || localStorage.getItem('token') || '';
    const displayName = String(
        user?.results?.firstname || user?.results?.userDetail?.userName || ''
    ).trim();
    const customerApps = user?.results?.customerApps || [];
    const parkingApps = customerApps.filter((a) => a.appCode === 'VEHICLE_PARKING');
    const [parentId, setParentId] = useState(
        () => localStorage.getItem(VP_CUSTOMER_PARENT_KEY) || parkingApps[0]?.parentMembershipId || ''
    );
    const [tab, setTab] = useState('parked');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (parentId) localStorage.setItem(VP_CUSTOMER_PARENT_KEY, String(parentId));
    }, [parentId]);

    const load = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const row = await vpRequest(token, '/vp/customer/bookings', {
                params: { parent_membership_id: parentId || undefined },
            });
            setData(row);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [token, parentId]);

    const companyLabel = useMemo(() => {
        const match = parkingApps.find((a) => String(a.parentMembershipId) === String(parentId));
        return match?.companyName || 'Vehicle Parking';
    }, [parkingApps, parentId]);

    if (!token) return <Redirect to="/login" />;

    const parked = data?.parked || [];
    const history = data?.history || [];
    const passes = data?.passes || [];
    const activePasses = passes.filter((p) => p.booked || (p.status === 'ACTIVE' && !p.expired));
    const tabs = [
        { id: 'parked', label: 'Parked now', count: parked.length, icon: FiTruck },
        { id: 'history', label: 'History', count: history.length, icon: FiClock },
        { id: 'passes', label: 'Passes', count: passes.length, icon: FiCreditCard },
    ];

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-10">
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-700 via-red-700 to-red-900 text-white p-5 sm:p-6 shadow-lg">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute -bottom-10 right-10 h-24 w-24 rounded-full bg-white/5" />
                <div className="relative">
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-100">Customer parking</p>
                    <h1 className="mt-1 text-2xl font-bold">{displayName ? `Hi ${displayName}` : 'My parking'}</h1>
                    <p className="mt-1 text-sm text-red-50 max-w-xl">
                        {companyLabel} — parked vehicles, visit history and season passes on this Treasure login.
                    </p>
                    {parkingApps.length > 1 ? (
                        <select
                            className="mt-4 w-full max-w-xs rounded-lg border border-white/30 bg-white/15 px-3 py-2 text-sm text-white"
                            value={parentId}
                            onChange={(e) => setParentId(e.target.value)}
                            aria-label="Parking company"
                        >
                            {parkingApps.map((a) => (
                                <option key={a.parentMembershipId} value={a.parentMembershipId} className="text-gray-900">
                                    {a.companyName || 'Parking'}
                                </option>
                            ))}
                        </select>
                    ) : null}
                    <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                        {[
                            ['Parked', parked.length],
                            ['Active passes', activePasses.length],
                            ['Past visits', history.length],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-xl bg-white/10 px-3 py-3 backdrop-blur-sm">
                                <p className="text-[11px] uppercase tracking-wide text-red-100">{label}</p>
                                <p className="mt-1 text-2xl font-bold">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="mt-5 flex flex-wrap items-center gap-2">
                {tabs.map((item) => {
                    const Icon = item.icon;
                    const on = tab === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold border transition-colors ${
                                on
                                    ? 'bg-red-700 text-white border-red-700 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                            {item.label}
                            <span className={`rounded-full px-1.5 text-xs ${on ? 'bg-white/20' : 'bg-gray-100 text-gray-700'}`}>
                                {item.count}
                            </span>
                        </button>
                    );
                })}
                <button
                    type="button"
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={load}
                >
                    <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="mt-6 space-y-3">
                    {[1, 2].map((n) => (
                        <div key={n} className="h-28 animate-pulse rounded-2xl bg-white border border-gray-100" />
                    ))}
                </div>
            ) : null}

            {!loading && data?.phone_matched === false ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {data.message}
                </div>
            ) : null}

            {!loading && tab === 'parked' && (
                <ul className="mt-5 space-y-4">
                    {parked.map((t) => (
                        <li key={t.id} className="rounded-2xl border border-emerald-100 bg-white p-4 sm:p-5 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <Pill className={statusTone('PARKED')}>Currently parked</Pill>
                                    <p className="mt-2 text-lg font-bold text-gray-900">{t.vehicle_number}</p>
                                    <p className="text-sm text-gray-500">{t.vehicle_type_name} · Ticket {t.ticket_no}</p>
                                </div>
                                <div className="rounded-xl bg-gray-50 px-3 py-2 text-right">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500">Slot</p>
                                    <p className="text-xl font-bold text-gray-900">{t.slot_number || '—'}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                                {t.location_name ? (
                                    <span className="inline-flex items-center gap-1"><FiMapPin className="h-3.5 w-3.5" /> {t.location_name}</span>
                                ) : null}
                                <span className="inline-flex items-center gap-1"><FiClock className="h-3.5 w-3.5" /> In {formatWhen(t.check_in_at)}</span>
                            </div>
                            {t.pass ? (
                                <p className="mt-2 text-sm font-medium text-emerald-800">
                                    Covered by {t.pass.plan_label || t.pass.plan} until {t.pass.valid_to}
                                </p>
                            ) : null}
                            <PhotoRow ticket={t} />
                            <PayBox accounts={data.payment_accounts} parentId={parentId} ticketParentId={t.parent_membership_id} />
                        </li>
                    ))}
                    {!parked.length ? (
                        <li>
                            <EmptyState
                                icon={FiTruck}
                                title="Nothing parked right now"
                                text="When staff checks in a vehicle on your mobile, it will show here with slot and ticket."
                            />
                        </li>
                    ) : null}
                </ul>
            )}

            {!loading && tab === 'history' && (
                <ul className="mt-5 space-y-3">
                    {history.map((t) => (
                        <li key={t.id} className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <p className="font-bold text-gray-900">{t.vehicle_number}</p>
                                    <p className="text-sm text-gray-500">{t.vehicle_type_name} · {t.ticket_no}</p>
                                </div>
                                <Pill className={statusTone(t.status)}>{t.status}</Pill>
                            </div>
                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-[11px] text-gray-500">Slot</p>
                                    <p className="font-semibold">{t.slot_number || '—'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-[11px] text-gray-500">Charge</p>
                                    <p className="font-semibold">{t.parking_charge != null ? money(t.parking_charge) : '—'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-[11px] text-gray-500">Paid</p>
                                    <p className="font-semibold">{t.paid_amount != null ? money(t.paid_amount) : '—'}</p>
                                </div>
                                <div className="rounded-lg bg-gray-50 px-3 py-2">
                                    <p className="text-[11px] text-gray-500">Duration</p>
                                    <p className="font-semibold truncate">{t.duration_label || '—'}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-sm text-gray-600">In {formatWhen(t.check_in_at)}</p>
                            <p className="text-sm text-gray-600">Out {t.check_out_at ? formatWhen(t.check_out_at) : '—'}</p>
                            <PhotoRow ticket={t} />
                        </li>
                    ))}
                    {!history.length ? (
                        <li>
                            <EmptyState
                                icon={FiClock}
                                title="No visits yet"
                                text="Completed check-in and check-out records for this mobile will appear here."
                            />
                        </li>
                    ) : null}
                </ul>
            )}

            {!loading && tab === 'passes' && (
                <ul className="mt-5 space-y-3">
                    {passes.map((p) => {
                        const status = p.booking_status || (p.expired && p.status === 'ACTIVE' ? 'Ended' : p.status);
                        return (
                            <li key={p.id} className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-red-700">{p.plan_label || p.plan}</p>
                                        <p className="mt-0.5 text-lg font-bold text-gray-900">{p.vehicle_number}</p>
                                        <p className="text-sm text-gray-500">{p.pass_no}{p.slot_number ? ` · Slot ${p.slot_number}` : ''}</p>
                                    </div>
                                    <Pill className={statusTone(status)}>{status}</Pill>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-[11px] text-gray-500">From</p>
                                        <p className="font-semibold">{p.valid_from}</p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2">
                                        <p className="text-[11px] text-gray-500">Booked until</p>
                                        <p className="font-semibold">{p.valid_to}</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-sm font-medium text-gray-800">{money(p.amount)}</p>
                            </li>
                        );
                    })}
                    {!passes.length ? (
                        <li>
                            <EmptyState
                                icon={FiCreditCard}
                                title="No passes on this mobile"
                                text="Daily, weekly, monthly or yearly passes sold at the yard will show here with slot and end date."
                            />
                        </li>
                    ) : null}
                </ul>
            )}
        </div>
    );
};

export default VehicleParkingCustomerPage;
