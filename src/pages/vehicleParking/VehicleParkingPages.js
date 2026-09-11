import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation, Link } from 'react-router-dom';
import { FiBriefcase, FiEdit2, FiMail, FiMapPin, FiPhone, FiPlus, FiSearch, FiTag, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useVehicleParking } from '../../context/vehicleParking_context';
import {
    formatWhen, money, printHtml, shareSms, shareWhatsApp, slipText, receiptText, compressImageFile,
    vpPaymentAccounts,
} from '../../utils/vpClient';
import { Field, PageWrap, btnPrimary, btnGhost, cardClass, inputClass, SlotMap, VpPayeeHint, slotIdOf, slotStatusOf } from '../../components/vehicleParking/vpUi';
import { useVpPermission } from '../../components/vehicleParking/useVpPermission';
import { VP_FEATURES } from '../../utils/vpPermissionCatalog';
import { VP_BASE } from '../../components/vehicleParking/vpMenu';

const tenDigitPhone = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length > 10 ? digits.slice(-10) : digits;
};

const identityLoginToast = (prefix, row) => {
    const idn = row?.identity;
    if (idn?.default_password) {
        return `${prefix}. Customer app login: ${idn.login_username} / ${idn.default_password} (first 4 digits of mobile — share once)`;
    }
    if (idn?.login_username) {
        return `${prefix}. Customer can sign in with ${idn.login_username} (existing Treasure password)`;
    }
    return prefix;
};

const METHODS = [
    { id: 'CALENDAR_DAY', label: 'Adhoc · Calendar Day' },
    { id: 'PER_DAY', label: 'Adhoc · Per Day' },
    { id: 'PER_HOUR', label: 'Adhoc · Per Hour' },
    { id: 'PER_24_HOURS', label: 'Adhoc · Per 24 Hours' },
    { id: 'DAILY', label: 'Daily pass' },
    { id: 'WEEKLY', label: 'Weekly pass' },
    { id: 'MONTHLY', label: 'Monthly pass' },
    { id: 'YEARLY', label: 'Yearly pass' },
];
const ADHOC_METHODS = ['CALENDAR_DAY', 'PER_DAY', 'PER_HOUR', 'PER_24_HOURS'];
const PASS_PLANS = [
    { id: 'DAILY', label: 'Daily' },
    { id: 'WEEKLY', label: 'Weekly' },
    { id: 'MONTHLY', label: 'Monthly' },
    { id: 'YEARLY', label: 'Yearly' },
];

const ymdShift = (ymdStr, n) => {
    const x = new Date(`${ymdStr}T00:00:00`);
    x.setDate(x.getDate() + n);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const ymdAddMonths = (ymdStr, months) => {
    const [y, m, d] = String(ymdStr).split('-').map(Number);
    const x = new Date(y, m - 1 + months, d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const passEndDate = (plan, start) => {
    if (plan === 'DAILY') return start;
    if (plan === 'WEEKLY') return ymdShift(start, 6);
    if (plan === 'MONTHLY') return ymdShift(ymdAddMonths(start, 1), -1);
    return ymdShift(ymdAddMonths(start, 12), -1);
};

const SafetyPhotoField = ({ label, value, facing, onChange }) => (
    <Field label={label}>
        <input
            className="block w-full text-sm"
            type="file"
            accept="image/*"
            capture={facing}
            onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                    onChange(await compressImageFile(file));
                } catch (err) {
                    toast.error(err.message || 'Could not use that photo');
                }
            }}
        />
        {value ? <img src={value} alt="" className="mt-2 h-24 w-24 object-cover rounded-lg border" /> : <p className="text-xs text-gray-500 mt-1">Camera or gallery</p>}
    </Field>
);

const SafetyThumbs = ({ ticket, size = 'h-12 w-12' }) => (
    <div className="flex gap-1">
        {ticket?.vehicle_photo ? <img src={ticket.vehicle_photo} alt="Vehicle" className={`${size} object-cover rounded border`} /> : null}
        {ticket?.customer_photo ? <img src={ticket.customer_photo} alt="Customer" className={`${size} object-cover rounded border`} /> : null}
    </div>
);

const slipHtml = (ticket, company) => `
  <h1>${company || 'VEHICLE PARKING'}</h1>
  <p class="center">VEHICLE TOKEN — show this to recover your vehicle</p>
  <p><b>Ticket No:</b> ${ticket.ticket_no}</p>
  <p><b>Vehicle:</b> ${ticket.vehicle_type_name || ''} ${ticket.vehicle_number}</p>
  ${ticket.customer_name ? `<p><b>Name:</b> ${ticket.customer_name}</p>` : ''}
  <p><b>Customer Mobile:</b> ${ticket.customer_mobile}</p>
  <p><b>Check-In:</b> ${formatWhen(ticket.check_in_at)}</p>
  <p><b>Parking Slot:</b> ${ticket.slot_number}</p>
  ${ticket.location_name ? `<p><b>Facility:</b> ${ticket.location_name}</p>` : ''}
  ${ticket.payment_status === 'PASS' && ticket.pass
    ? `<p><b>Pass:</b> ${ticket.pass.plan} until ${ticket.pass.valid_to}</p>`
    : Number(ticket.paid_amount) > 0
      ? `<p><b>Paid:</b> ${money(ticket.paid_amount)}${ticket.payment_status === 'PREPAID' ? ' (at check-in)' : ''}</p>`
      : '<p><b>Payment:</b> at check-out</p>'}
  ${(ticket.vehicle_photo || ticket.customer_photo) ? `
    <div class="center" style="margin:10px 0;display:flex;gap:8px;justify-content:center">
      ${ticket.vehicle_photo ? `<img src="${ticket.vehicle_photo}" alt="Vehicle" style="height:72px;width:72px;object-fit:cover;border-radius:8px;border:1px solid #ddd" />` : ''}
      ${ticket.customer_photo ? `<img src="${ticket.customer_photo}" alt="Customer" style="height:72px;width:72px;object-fit:cover;border-radius:8px;border:1px solid #ddd" />` : ''}
    </div>` : ''}
  <hr/><p class="center muted">Keep this token until check-out.</p>`;

const receiptHtml = (ticket) => `
  <h1>PARKING RECEIPT</h1>
  <p><b>Receipt No:</b> ${ticket.receipt?.receipt_no || ''}</p>
  <p><b>Ticket No:</b> ${ticket.ticket_no}</p>
  <p><b>Vehicle:</b> ${ticket.vehicle_type_name || ''} ${ticket.vehicle_number}</p>
  <p><b>Check-In:</b> ${formatWhen(ticket.check_in_at)}</p>
  <p><b>Check-Out:</b> ${formatWhen(ticket.check_out_at)}</p>
  <p><b>Duration:</b> ${ticket.duration_label || ''}</p>
  <p><b>Parking:</b> ${money(ticket.parking_charge)}</p>
  <hr/><p><b>TOTAL:</b> ${money(ticket.paid_amount || ticket.parking_charge)}</p>
  <p>Payment: ${ticket.payment?.payment_mode || ''} · ${ticket.payment_status || 'PAID'}</p>`;

export const VehicleParkingDashboardPage = () => {
    const history = useHistory();
    const { vp, locationId, setLocationId, loading, boot } = useVehicleParking();
    const [stats, setStats] = useState(null);
    const [parked, setParked] = useState([]);
    const [q, setQ] = useState('');
    const locations = boot?.locations || [];
    const load = async () => {
        if (!locationId) return;
        try {
            const [dash, active] = await Promise.all([
                vp('/vp/dashboard', { params: { location_id: locationId } }),
                vp('/vp/active', { params: { location_id: locationId } }).catch(() => []),
            ]);
            setStats(dash);
            setParked(active || []);
        } catch (e) {
            toast.error(e.message);
        }
    };
    useEffect(() => { load(); }, [locationId]);
    const parkedBySlotId = useMemo(
        () => Object.fromEntries((parked || []).map((t) => [t.slot_id, t])),
        [parked]
    );
    const runSearch = async () => {
        const term = q.trim();
        if (!term) return toast.info('Enter a ticket, vehicle number or mobile');
        const query = `?q=${encodeURIComponent(term)}`;
        try {
            const rows = await vp('/vp/search', { params: { location_id: locationId, q: term } }) || [];
            if (rows[0]?.status === 'PARKED') history.push(`/vehicle-parking/user/active${query}`);
            else history.push(`/vehicle-parking/user/history${query}`);
        } catch {
            history.push(`/vehicle-parking/user/history${query}`);
        }
    };
    if (loading && !stats) return <PageWrap title="Dashboard"><p className="text-sm text-gray-500">Loading…</p></PageWrap>;
    const companyReady = Boolean(boot?.company?.company_name);
    const slotsReady = (boot?.slots || []).length > 0;
    const accountsReady = vpPaymentAccounts(boot).length > 0;
    const tiles = [
        ['Today\'s Check-In', stats?.today_check_in],
        ['Currently Parked', stats?.currently_parked],
        ['Today\'s Check-Out', stats?.today_check_out],
        ['Today\'s Collection', money(stats?.today_collection)],
        ['Empty slots', stats?.available_slots],
        ['Parked slots', stats?.occupied_slots],
    ];
    const locationSearch = (
        <>
            <select
                value={locationId || ''}
                onChange={(e) => setLocationId(e.target.value)}
                className={`${inputClass} w-44`}
                aria-label="Parking facility"
            >
                {!locations.length ? <option value="">No facility</option> : null}
                {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.location_name}</option>
                ))}
            </select>
            <input
                className={`${inputClass} w-48`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
                placeholder="Ticket / vehicle / mobile"
                aria-label="Search parking"
            />
            <button type="button" className={btnPrimary} onClick={runSearch}>
                <FiSearch className="w-4 h-4 mr-1" /> Search
            </button>
        </>
    );
    return (
        <PageWrap title="Dashboard" actions={locationSearch}>
            {(!companyReady || !slotsReady || !accountsReady) && (
                <div className={`${cardClass} mb-4 border-amber-200 bg-amber-50`}>
                    <p className="font-semibold text-amber-900">Set up your parking business</p>
                    <ol className="mt-2 text-sm text-amber-900 list-decimal pl-5 space-y-1">
                        <li>Create your <Link className="underline font-semibold" to={`${VP_BASE}/settings`}>company name</Link></li>
                        <li>Add facility capacity by type (Bike, Car, Any vehicle) on the same Settings page</li>
                        <li>Create ledger <Link className="underline font-semibold" to={`${VP_BASE}/accounts`}>accounts</Link> on Ledger (Cash, Paytm, Google Pay — each with opening balance)</li>
                    </ol>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {tiles.map(([label, value]) => (
                    <div key={label} className={cardClass}>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
                    </div>
                ))}
            </div>
            <div className={`${cardClass} mb-6`}>
                <h2 className="font-semibold mb-3">Slot map</h2>
                <SlotMap
                    slots={boot?.slots || []}
                    parkedBySlotId={parkedBySlotId}
                    typeLabel={(s) => (boot?.vehicle_types || []).find((t) => t.id === s.vehicle_type_id)?.type_name || 'Any vehicle'}
                />
            </div>
            <div className={cardClass}>
                <h2 className="font-semibold mb-3">Vehicle breakdown</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {(stats?.vehicle_breakdown || []).map((row) => (
                        <div key={row.vehicle_type_id} className="rounded-lg bg-gray-50 p-3 text-center">
                            <p className="text-xs text-gray-500">{row.name}</p>
                            <p className="text-lg font-semibold">{row.count}</p>
                        </div>
                    ))}
                </div>
            </div>
        </PageWrap>
    );
};

const slotFitsType = (slot, vehicleTypeId) => !slot.vehicle_type_id || String(slot.vehicle_type_id) === String(vehicleTypeId);

export const VehicleParkingCheckInPage = () => {
    const { boot, locationId, vp, reload } = useVehicleParking();
    const [form, setForm] = useState({
        vehicle_number: '', vehicle_type_id: '', customer_mobile: '', slot_id: '', customer_name: '', notes: '',
        pay_at_checkin: false, payment_mode: '', amount: '', reference_number: '',
    });
    const [saving, setSaving] = useState(false);
    const [ticket, setTicket] = useState(null);
    const [photos, setPhotos] = useState({ vehicle: '', customer: '' });
    const [parked, setParked] = useState([]);
    const [activePass, setActivePass] = useState(null);
    const types = boot?.vehicle_types || [];
    const payAccounts = vpPaymentAccounts(boot);
    const selectedPayAccount = payAccounts.find((a) => String(a.id) === String(form.payment_mode)) || null;
    const typeName = (id) => types.find((t) => t.id === id)?.type_name || 'Any vehicle';
    const allSlots = boot?.slots || [];
    const filteredSlots = form.vehicle_type_id
        ? allSlots.filter((s) => slotFitsType(s, form.vehicle_type_id))
        : allSlots;
    const matchingSlots = filteredSlots.filter((s) => {
        if (s.status === 'AVAILABLE') return true;
        if (s.status === 'RESERVED' && activePass?.slot_id && String(s.id) === String(activePass.slot_id)) return true;
        return false;
    });
    const emptyCount = matchingSlots.length;
    const parkedCount = filteredSlots.filter((s) => s.status === 'OCCUPIED').length;
    const rateForType = (boot?.rates || []).find((r) => String(r.vehicle_type_id) === String(form.vehicle_type_id) && r.status !== 'INACTIVE' && ADHOC_METHODS.includes(r.charging_method));
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    const parkedBySlotId = useMemo(() => {
        const map = Object.fromEntries((parked || []).map((t) => [t.slot_id, t]));
        if (activePass?.slot_id) map[activePass.slot_id] = { ...map[activePass.slot_id], ...activePass };
        return map;
    }, [parked, activePass]);

    useEffect(() => {
        if (!locationId) return;
        vp('/vp/active', { params: { location_id: locationId } })
            .then((rows) => setParked(rows || []))
            .catch(() => setParked([]));
    }, [locationId, boot?.slots]);

    const pickType = (typeId) => {
        setForm((p) => ({
            ...p,
            vehicle_type_id: typeId,
            slot_id: p.slot_id && slotFitsType(allSlots.find((s) => s.id === p.slot_id) || {}, typeId) ? p.slot_id : '',
            amount: '',
        }));
    };

    useEffect(() => {
        const plate = form.vehicle_number.trim().toUpperCase();
        if (!locationId || plate.length < 4) {
            setActivePass(null);
            return undefined;
        }
        const t = setTimeout(() => {
            vp('/vp/passes/active', { params: { location_id: locationId, vehicle_number: plate } })
                .then((row) => setActivePass(row || null))
                .catch(() => setActivePass(null));
        }, 400);
        return () => clearTimeout(t);
    }, [form.vehicle_number, locationId]);

    useEffect(() => {
        if (!activePass) return;
        setForm((p) => ({
            ...p,
            vehicle_type_id: activePass.vehicle_type_id || p.vehicle_type_id,
            slot_id: activePass.slot_id || p.slot_id,
            customer_mobile: p.customer_mobile || activePass.customer_mobile || '',
            customer_name: p.customer_name || activePass.customer_name || '',
        }));
    }, [activePass?.id]);

    useEffect(() => {
        if (!form.pay_at_checkin || !rateForType) return;
        setForm((p) => (p.amount ? p : { ...p, amount: String(rateForType.rate_amount) }));
    }, [form.pay_at_checkin, form.vehicle_type_id]);

    useEffect(() => {
        if (!payAccounts.length) return;
        setForm((p) => (p.payment_mode ? p : { ...p, payment_mode: payAccounts[0].id }));
    }, [payAccounts.length]);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.vehicle_type_id) return toast.error('Select a vehicle type above the slot map');
        if (!form.slot_id) return toast.error('Select an empty slot, or the amber slot booked on this pass');
        if (!form.customer_name.trim()) return toast.error('Customer name is required');
        if (!/^\d{10}$/.test(tenDigitPhone(form.customer_mobile))) {
            return toast.error('Enter a 10-digit mobile — this becomes their Treasure login');
        }
        if (!photos.vehicle) return toast.error('Take a vehicle photo');
        if (!photos.customer) return toast.error('Take a customer photo');
        if (form.pay_at_checkin && !activePass && !form.payment_mode) {
            return toast.error('Add a ledger account first (Cash, Paytm, Google Pay), then choose it here.');
        }
        setSaving(true);
        try {
            const row = await vp('/vp/check-in', {
                method: 'POST',
                body: {
                    ...form,
                    location_id: locationId,
                    vehicle_number: form.vehicle_number.toUpperCase(),
                    pay_at_checkin: form.pay_at_checkin && !activePass,
                    amount: form.pay_at_checkin ? form.amount : undefined,
                    vehicle_photo: photos.vehicle,
                    customer_photo: photos.customer,
                },
            });
            setTicket(row);
            toast.success(identityLoginToast(
                form.pay_at_checkin ? `Checked in ${row.ticket_no} · paid` : `Checked in ${row.ticket_no}`,
                row
            ));
            setForm({
                vehicle_number: '', vehicle_type_id: form.vehicle_type_id, customer_mobile: '', slot_id: '', customer_name: '', notes: '',
                pay_at_checkin: form.pay_at_checkin, payment_mode: form.payment_mode, amount: '', reference_number: '',
            });
            setPhotos({ vehicle: '', customer: '' });
            reload(locationId);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const company = boot?.company?.company_name;
    const selectedSlot = allSlots.find((s) => String(s.id) === String(form.slot_id));
    return (
        <PageWrap title="Check-In">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <form onSubmit={submit} className={`${cardClass} grid grid-cols-1 sm:grid-cols-2 gap-3`}>
                <Field label="Vehicle Number *">
                    <input className={inputClass} required value={form.vehicle_number} onChange={(e) => set('vehicle_number', e.target.value)} placeholder="TN38AB1234" />
                </Field>
                <Field label="Vehicle type">
                    <input className={inputClass} readOnly value={form.vehicle_type_id ? typeName(form.vehicle_type_id) : 'Pick a type on the right'} />
                </Field>
                <Field label="Customer Mobile *">
                    <input className={inputClass} required inputMode="numeric" value={form.customer_mobile} onChange={(e) => set('customer_mobile', e.target.value)} placeholder="10-digit login mobile" />
                    <p className="text-xs text-gray-500 mt-1">Creates a Subscriber login. New users: password is the first 4 digits of this number.</p>
                </Field>
                <Field label="Parking slot">
                    <input className={inputClass} readOnly value={selectedSlot ? `${selectedSlot.slot_number} · ${typeName(selectedSlot.vehicle_type_id)}` : 'Click an empty slot, or the booked pass slot'} />
                </Field>
                <Field label="Customer Name *">
                    <input className={inputClass} required value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)} />
                </Field>
                <SafetyPhotoField
                    label="Vehicle photo *"
                    facing="environment"
                    value={photos.vehicle}
                    onChange={(data) => setPhotos((p) => ({ ...p, vehicle: data }))}
                />
                <SafetyPhotoField
                    label="Customer photo *"
                    facing="user"
                    value={photos.customer}
                    onChange={(data) => setPhotos((p) => ({ ...p, customer: data }))}
                />
                <Field label="Notes">
                    <input className={inputClass} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
                </Field>
                {activePass ? (
                    <p className="sm:col-span-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        {activePass.plan} pass {activePass.pass_no} is booked on slot {activePass.slot_number || selectedSlot?.slot_number || '—'} until {activePass.valid_to}. Check-in is covered — no visit charge.
                    </p>
                ) : (
                    <>
                        <div className="sm:col-span-2 flex items-center gap-2 py-1">
                            <input
                                id="pay_at_checkin"
                                type="checkbox"
                                checked={form.pay_at_checkin}
                                onChange={(e) => setForm((p) => ({
                                    ...p,
                                    pay_at_checkin: e.target.checked,
                                    amount: e.target.checked && rateForType ? String(rateForType.rate_amount) : p.amount,
                                }))}
                            />
                            <label htmlFor="pay_at_checkin" className="text-sm font-medium text-gray-800">Collect payment now (adhoc visit)</label>
                        </div>
                        {form.pay_at_checkin && (
                            <>
                                <Field label="Payment account">
                                    <select className={inputClass} required value={form.payment_mode} onChange={(e) => set('payment_mode', e.target.value)}>
                                        <option value="">Select account</option>
                                        {payAccounts.map((m) => <option key={m.id} value={m.id}>{m.account_name}</option>)}
                                    </select>
                                    {!payAccounts.length ? (
                                        <p className="text-xs text-amber-700 mt-1">
                                            Ledger has no accounts yet. Add Cash, Paytm or Google Pay with opening balance on Ledger.
                                        </p>
                                    ) : null}
                                </Field>
                                <Field label="Amount *">
                                    <input type="number" step="0.01" min="0.01" className={inputClass} required value={form.amount} onChange={(e) => set('amount', e.target.value)} />
                                    {rateForType ? <p className="text-xs text-gray-500 mt-1">Adhoc rate: {money(rateForType.rate_amount)} ({rateForType.charging_method}). Extra time is collected at check-out.</p> : <p className="text-xs text-amber-700 mt-1">Set an adhoc rate in Masters before collecting payment.</p>}
                                </Field>
                                <Field label="Reference">
                                    <input className={inputClass} value={form.reference_number} onChange={(e) => set('reference_number', e.target.value)} placeholder="UPI / Paytm reference" />
                                </Field>
                                <VpPayeeHint account={selectedPayAccount} amount={form.amount} />
                            </>
                        )}
                    </>
                )}
                <div className="sm:col-span-2">
                    <button className={btnPrimary} type="submit" disabled={saving}>{saving ? 'Saving…' : (form.pay_at_checkin && !activePass ? 'CHECK IN & COLLECT' : 'CHECK IN')}</button>
                </div>
                </form>

                <div className={cardClass}>
                    <h2 className="font-semibold text-gray-900">Vehicle type</h2>
                    <p className="text-sm text-gray-600 mb-3">Click a type to see only those slots. Red = empty, green = parked, amber = booked on a pass until the pass end date.</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                        <button
                            type="button"
                            className={!form.vehicle_type_id ? btnPrimary : btnGhost}
                            onClick={() => pickType('')}
                        >
                            All ({allSlots.length})
                        </button>
                        {types.map((t) => {
                            const forType = allSlots.filter((s) => slotFitsType(s, t.id));
                            const empty = forType.filter((s) => s.status === 'AVAILABLE').length;
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    className={String(form.vehicle_type_id) === String(t.id) ? btnPrimary : btnGhost}
                                    onClick={() => pickType(t.id)}
                                >
                                    {t.type_name} ({empty} empty / {forType.length})
                                </button>
                            );
                        })}
                    </div>
                    {!allSlots.length ? (
                        <p className="text-sm text-amber-800 mb-2">No parking capacity yet. In Settings, enter how many Bike / Car / Any slots this facility has.</p>
                    ) : form.vehicle_type_id && !matchingSlots.length ? (
                        <p className="text-sm text-amber-800 mb-2">No empty slots for this vehicle type.</p>
                    ) : (
                        <p className="text-sm text-gray-600 mb-2">
                            {form.vehicle_type_id ? typeName(form.vehicle_type_id) : 'All types'}: {emptyCount} available · {parkedCount} parked
                        </p>
                    )}
                    <SlotMap
                        slots={filteredSlots}
                        parkedBySlotId={parkedBySlotId}
                        selectedId={form.slot_id}
                        selectStatuses={activePass?.slot_id ? ['AVAILABLE', 'RESERVED'] : ['AVAILABLE']}
                        onSelect={(s) => {
                            setForm((p) => {
                                const nextType = p.vehicle_type_id || s.vehicle_type_id || '';
                                if (!nextType) {
                                    toast.error('Select a vehicle type first');
                                    return p;
                                }
                                return { ...p, vehicle_type_id: nextType, slot_id: s.id };
                            });
                        }}
                        canSelect={(s) => {
                            if (form.vehicle_type_id && !slotFitsType(s, form.vehicle_type_id)) return false;
                            if (s.status === 'RESERVED') return Boolean(activePass?.slot_id && String(s.id) === String(activePass.slot_id));
                            return true;
                        }}
                        typeLabel={(s) => typeName(s.vehicle_type_id)}
                        gridClass="grid grid-cols-2 sm:grid-cols-3 gap-2"
                    />
                </div>
            </div>
            {ticket && (
                <div className={`${cardClass} max-w-2xl mt-4`}>
                    <p className="font-semibold mb-2">Vehicle token {ticket.ticket_no}</p>
                    {ticket.identity?.login_username ? (
                        <p className="text-sm text-indigo-900 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mb-3">
                            {ticket.identity.default_password
                                ? `Customer app: sign in with ${ticket.identity.login_username}, password ${ticket.identity.default_password} (first 4 digits of mobile).`
                                : `Customer app: they already have a Treasure login for ${ticket.identity.login_username}.`}
                        </p>
                    ) : null}
                    <SafetyThumbs ticket={ticket} size="h-20 w-20" />
                    <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{slipText(ticket, company)}</pre>
                    <div className="flex flex-wrap gap-2 mt-3">
                        <button type="button" className={btnGhost} onClick={() => printHtml('Check-in slip', slipHtml(ticket, company))}>Print / PDF</button>
                        <button type="button" className={btnGhost} onClick={() => shareWhatsApp(ticket.customer_mobile, slipText(ticket, company))}>WhatsApp</button>
                        <button type="button" className={btnGhost} onClick={() => shareSms(ticket.customer_mobile, slipText(ticket, company))}>SMS</button>
                    </div>
                </div>
            )}
        </PageWrap>
    );
};

export const VehicleParkingActivePage = () => {
    const { vp, locationId, boot, reload } = useVehicleParking();
    const payAccounts = vpPaymentAccounts(boot);
    const urlQ = new URLSearchParams(useLocation().search).get('q') || '';
    const [q, setQ] = useState(urlQ);
    const [rows, setRows] = useState([]);
    const [quote, setQuote] = useState(null);
    const [pay, setPay] = useState({ payment_mode: '', reference_number: '' });
    const [done, setDone] = useState(null);
    const [checkingOut, setCheckingOut] = useState(false);
    const load = async (term = q) => {
        try {
            setRows(await vp('/vp/active', { params: { location_id: locationId, q: term } }) || []);
        } catch (e) { toast.error(e.message); }
    };
    useEffect(() => { setQ(urlQ); }, [urlQ]);
    useEffect(() => { if (locationId) load(urlQ); }, [locationId, urlQ]);

    const openQuote = async (id) => {
        try {
            setDone(null);
            setQuote(await vp(`/vp/tickets/${id}/quote`));
            setPay({ payment_mode: payAccounts[0]?.id || '', reference_number: '' });
        } catch (e) { toast.error(e.message); }
    };

    const closeCheckout = () => {
        setQuote(null);
        setDone(null);
        setCheckingOut(false);
    };

    const checkout = async () => {
        if (Number(quote.quote?.due) > 0 && !pay.payment_mode) {
            toast.error('Select a payment account');
            return;
        }
        setCheckingOut(true);
        try {
            const row = await vp(`/vp/tickets/${quote.id}/check-out`, {
                method: 'POST',
                body: {
                    payment_mode: pay.payment_mode,
                    reference_number: pay.reference_number,
                    amount: quote.quote?.due ?? quote.quote?.amount,
                },
            });
            setDone(row);
            setQuote(null);
            reload(locationId);
            load();
            toast.success('Checked out');
        } catch (e) { toast.error(e.message); }
        finally { setCheckingOut(false); }
    };

    return (
        <PageWrap title="Active Vehicles" actions={(
            <>
                <input className={`${inputClass} w-56`} placeholder="Ticket / vehicle / mobile / slot" value={q} onChange={(e) => setQ(e.target.value)} />
                <button type="button" className={btnGhost} onClick={load}>Search</button>
            </>
        )}>
            <div className="overflow-x-auto bg-white rounded-xl border">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-500">
                        <tr>
                            <th className="px-3 py-2">Ticket</th>
                            <th className="px-3 py-2">Photos</th>
                            <th className="px-3 py-2">Vehicle</th>
                            <th className="px-3 py-2">Number</th>
                            <th className="px-3 py-2">Slot</th>
                            <th className="px-3 py-2">Check-In</th>
                            <th className="px-3 py-2">Payment</th>
                            <th className="px-3 py-2">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} className="border-t">
                                <td className="px-3 py-2">{r.ticket_no}</td>
                                <td className="px-3 py-2"><SafetyThumbs ticket={r} /></td>
                                <td className="px-3 py-2">{r.vehicle_type_name}</td>
                                <td className="px-3 py-2 font-medium">{r.vehicle_number}</td>
                                <td className="px-3 py-2">{r.slot_number}</td>
                                <td className="px-3 py-2">{formatWhen(r.check_in_at)}</td>
                                <td className="px-3 py-2">{r.payment_status === 'PASS' ? 'Pass' : r.payment_status === 'PREPAID' ? `Paid ${money(r.paid_amount)}` : 'Pay at exit'}</td>
                                <td className="px-3 py-2">
                                    <button type="button" className={btnPrimary} onClick={() => openQuote(r.id)}>Checkout</button>
                                    <button
                                        type="button"
                                        className={`${btnGhost} ml-2`}
                                        onClick={async () => {
                                            try {
                                                await vp(`/vp/tickets/${r.id}/void`, { method: 'POST', body: { reason: 'Cancelled check-in' } });
                                                toast.success('Cancelled');
                                                load();
                                                reload(locationId);
                                            } catch (err) { toast.error(err.message); }
                                        }}
                                    >
                                        Void
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!rows.length && <tr><td className="px-3 py-6 text-gray-500" colSpan={8}>No vehicles parked</td></tr>}
                    </tbody>
                </table>
            </div>
            {quote && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={closeCheckout} role="presentation">
                    <div
                        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="vp-checkout-title"
                    >
                        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-start justify-between gap-3 rounded-t-2xl">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Check-out</p>
                                <h2 id="vp-checkout-title" className="text-lg font-bold text-gray-900">Ticket {quote.ticket_no}</h2>
                                <p className="text-sm text-gray-600">{quote.vehicle_type_name} · {quote.vehicle_number} · Slot {quote.slot_number}</p>
                            </div>
                            <button type="button" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" onClick={closeCheckout} aria-label="Close">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-5 py-4 space-y-4">
                            <div className="flex gap-3">
                                <SafetyThumbs ticket={quote} size="h-20 w-20" />
                                <div className="text-sm text-gray-700 space-y-0.5">
                                    {quote.customer_name ? <p>{quote.customer_name}</p> : null}
                                    {quote.customer_mobile ? <p>{quote.customer_mobile}</p> : null}
                                    <p>In {formatWhen(quote.check_in_at)}</p>
                                    <p>Out {formatWhen(quote.quote?.check_out_at)}</p>
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-50 border border-gray-100 divide-y divide-gray-200 text-sm">
                                <div className="flex justify-between px-3 py-2"><span className="text-gray-500">Duration</span><span className="font-medium">{quote.quote?.duration_label || '—'}</span></div>
                                <div className="flex justify-between px-3 py-2"><span className="text-gray-500">Rate</span><span className="font-medium">{money(quote.quote?.rate)}</span></div>
                                <div className="flex justify-between px-3 py-2"><span className="text-gray-500">Parking charge</span><span className="font-medium">{money(quote.quote?.amount)}</span></div>
                                {Number(quote.quote?.already_paid) > 0 ? (
                                    <div className="flex justify-between px-3 py-2"><span className="text-gray-500">Paid at check-in</span><span className="font-medium text-green-700">{money(quote.quote.already_paid)}</span></div>
                                ) : null}
                                <div className="flex justify-between px-3 py-3">
                                    <span className="font-semibold text-gray-900">Due now</span>
                                    <span className="text-lg font-bold text-gray-900">{money(quote.quote?.due ?? quote.quote?.amount)}</span>
                                </div>
                            </div>
                            {quote.quote?.pass_covered ? (
                                <p className="text-sm text-green-800 bg-green-50 border border-green-100 rounded-lg px-3 py-2">Covered by {quote.quote?.pass?.plan} pass until {quote.quote?.pass?.valid_to}.</p>
                            ) : null}
                            {quote.quote?.overstay && !quote.quote?.pass_covered ? (
                                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">Pass ended — extra stay is charged as adhoc.</p>
                            ) : null}
                            {Number(quote.quote?.due) > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Field label="Payment account">
                                        <select className={inputClass} value={pay.payment_mode} onChange={(e) => setPay((p) => ({ ...p, payment_mode: e.target.value }))}>
                                            <option value="">Select account</option>
                                            {payAccounts.map((m) => <option key={m.id} value={m.id}>{m.account_name}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Reference">
                                        <input className={inputClass} value={pay.reference_number} onChange={(e) => setPay((p) => ({ ...p, reference_number: e.target.value }))} placeholder="UPI / Paytm ref" />
                                    </Field>
                                    <div className="sm:col-span-2">
                                        <VpPayeeHint
                                            account={payAccounts.find((a) => String(a.id) === String(pay.payment_mode))}
                                            amount={quote.quote?.due}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-green-800 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                                    {quote.quote?.pass_covered ? 'Pass covers this stay. Releasing the slot is free.' : 'Nothing due. Check-out will free the slot.'}
                                </p>
                            )}
                        </div>
                        <div className="sticky bottom-0 bg-white border-t px-5 py-4 flex gap-2 rounded-b-2xl">
                            <button type="button" className={`${btnPrimary} flex-1`} disabled={checkingOut} onClick={checkout}>
                                {checkingOut ? 'Saving…' : (Number(quote.quote?.due) > 0 ? 'CHECK OUT' : 'RELEASE SLOT')}
                            </button>
                            <button type="button" className={btnGhost} onClick={closeCheckout}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
            {done && !quote && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={closeCheckout} role="presentation">
                    <div
                        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Checked out</p>
                                <h2 className="text-lg font-bold text-gray-900">Receipt {done.receipt?.receipt_no || done.ticket_no}</h2>
                            </div>
                            <button type="button" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" onClick={closeCheckout} aria-label="Close">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-5 py-4">
                            <pre className="text-sm whitespace-pre-wrap bg-gray-50 border rounded-xl p-3">{receiptText(done)}</pre>
                        </div>
                        <div className="sticky bottom-0 bg-white border-t px-5 py-4 flex flex-wrap gap-2">
                            <button type="button" className={btnPrimary} onClick={() => printHtml('Receipt', receiptHtml(done))}>Print / PDF</button>
                            <button type="button" className={btnGhost} onClick={() => shareWhatsApp(done.customer_mobile, receiptText(done))}>WhatsApp</button>
                            <button type="button" className={btnGhost} onClick={closeCheckout}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </PageWrap>
    );
};

export const VehicleParkingHistoryPage = () => {
    const { vp, locationId } = useVehicleParking();
    const urlQ = new URLSearchParams(useLocation().search).get('q') || '';
    const [q, setQ] = useState(urlQ);
    const [rows, setRows] = useState([]);
    const load = async (term = q) => {
        try { setRows(await vp('/vp/history', { params: { location_id: locationId, q: term } }) || []); }
        catch (e) { toast.error(e.message); }
    };
    useEffect(() => { setQ(urlQ); }, [urlQ]);
    useEffect(() => { if (locationId) load(urlQ); }, [locationId, urlQ]);
    return (
        <PageWrap title="Parking History" actions={(
            <>
                <input className={`${inputClass} w-56`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ticket / vehicle / mobile" />
                <button type="button" className={btnGhost} onClick={load}>Search</button>
            </>
        )}>
            <div className="overflow-x-auto bg-white rounded-xl border">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left"><tr>
                        <th className="px-3 py-2">Ticket</th><th className="px-3 py-2">Photos</th><th className="px-3 py-2">Vehicle</th><th className="px-3 py-2">Slot</th>
                        <th className="px-3 py-2">In</th><th className="px-3 py-2">Out</th><th className="px-3 py-2">Charge</th><th className="px-3 py-2">Status</th>
                    </tr></thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} className="border-t">
                                <td className="px-3 py-2">{r.ticket_no}</td>
                                <td className="px-3 py-2"><SafetyThumbs ticket={r} /></td>
                                <td className="px-3 py-2">{r.vehicle_number}</td>
                                <td className="px-3 py-2">{r.slot_number}</td>
                                <td className="px-3 py-2">{formatWhen(r.check_in_at)}</td>
                                <td className="px-3 py-2">{formatWhen(r.check_out_at)}</td>
                                <td className="px-3 py-2">{r.parking_charge != null ? money(r.parking_charge) : '—'}</td>
                                <td className="px-3 py-2">{r.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PageWrap>
    );
};

export const VehicleParkingSlotsPage = () => {
    const { boot, locationId, vp, reload } = useVehicleParking();
    const { can } = useVpPermission();
    const canManage = can(VP_FEATURES.slots);
    const emptyForm = { slot_number: '', vehicle_type_id: '', status: 'AVAILABLE' };
    const [form, setForm] = useState(emptyForm);
    const [editingSlot, setEditingSlot] = useState(null);
    const [parked, setParked] = useState([]);
    useEffect(() => {
        if (!locationId) return;
        vp('/vp/active', { params: { location_id: locationId } })
            .then((rows) => setParked(rows || []))
            .catch(() => setParked([]));
    }, [locationId, boot?.slots]);
    const parkedBySlotId = useMemo(
        () => Object.fromEntries((parked || []).map((t) => [t.slot_id, t])),
        [parked]
    );
    const resetForm = () => {
        setEditingSlot(null);
        setForm(emptyForm);
    };
    const startEdit = (slot) => {
        if (slot.status === 'OCCUPIED') {
            toast.info('Check out the vehicle before renaming this slot');
            return;
        }
        setEditingSlot(slot);
        setForm({
            slot_number: slot.slot_number || '',
            vehicle_type_id: slot.vehicle_type_id || '',
            status: slot.status || 'AVAILABLE',
        });
    };
    const save = async (e) => {
        e.preventDefault();
        try {
            await vp(editingSlot ? `/vp/slots/${editingSlot.id}` : '/vp/slots', {
                method: editingSlot ? 'PUT' : 'POST',
                body: {
                    location_id: locationId,
                    slot_number: form.slot_number.trim(),
                    slot_type: form.vehicle_type_id ? 'TYPED' : 'GENERAL',
                    vehicle_type_id: form.vehicle_type_id || null,
                    status: editingSlot ? editingSlot.status : 'AVAILABLE',
                },
            });
            toast.success(editingSlot ? 'Slot updated' : 'Slot added');
            resetForm();
            reload(locationId);
        } catch (err) { toast.error(err.message); }
    };
    const setStatus = async (slot, status) => {
        if (slot.status === 'OCCUPIED') {
            toast.info('Parked slots free up on check-out');
            return;
        }
        try {
            await vp(`/vp/slots/${slot.id}`, {
                method: 'PUT',
                body: {
                    location_id: slot.location_id,
                    slot_number: slot.slot_number,
                    slot_type: slot.slot_type,
                    vehicle_type_id: slot.vehicle_type_id,
                    status,
                },
            });
            reload(locationId);
        } catch (err) { toast.error(err.message); }
    };
    const slots = boot?.slots || [];
    const typeName = (id) => (boot?.vehicle_types || []).find((t) => t.id === id)?.type_name || 'Any vehicle';
    return (
        <PageWrap title="Parking Slots">
            <p className="text-sm text-gray-600 mb-3">
                Capacity on Settings creates numbered slots (BIKE-01, CAR-01). Rename a slot here. You cannot rename a slot while a vehicle is parked in it.
            </p>
            {canManage && (
                <form onSubmit={save} className={`${cardClass} grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4`}>
                    <h2 className="sm:col-span-4 font-semibold">{editingSlot ? `Edit slot ${editingSlot.slot_number}` : 'Add slot'}</h2>
                    <Field label="Slot number">
                        <input className={inputClass} required value={form.slot_number} onChange={(e) => setForm((p) => ({ ...p, slot_number: e.target.value }))} placeholder="B1 / BIKE-01 / G-12" />
                    </Field>
                    <Field label="For vehicle">
                        <select className={inputClass} value={form.vehicle_type_id} onChange={(e) => setForm((p) => ({ ...p, vehicle_type_id: e.target.value }))}>
                            <option value="">Any vehicle</option>
                            {(boot?.vehicle_types || []).map((t) => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                        </select>
                    </Field>
                    <div className="flex items-end gap-2">
                        <button className={btnPrimary} type="submit">{editingSlot ? 'Update slot' : 'Add Slot'}</button>
                        {editingSlot ? <button type="button" className={btnGhost} onClick={resetForm}>Cancel</button> : null}
                    </div>
                </form>
            )}
            <div className={`${cardClass} mb-4`}>
                <SlotMap
                    slots={slots}
                    parkedBySlotId={parkedBySlotId}
                    canManage={canManage}
                    onStatusChange={setStatus}
                    typeLabel={(s) => typeName(s.vehicle_type_id)}
                />
            </div>
            {canManage && (
                <ul className={cardClass}>
                    {slots.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0 text-sm">
                            <span>
                                <strong>{s.slot_number}</strong> · {typeName(s.vehicle_type_id)} · {s.status}
                                {parkedBySlotId[s.id] ? ` · ${parkedBySlotId[s.id].vehicle_number}` : ''}
                            </span>
                            <button
                                type="button"
                                className={btnGhost}
                                disabled={s.status === 'OCCUPIED'}
                                onClick={() => startEdit(s)}
                            >
                                <FiEdit2 className="w-4 h-4 mr-1" /> Edit number
                            </button>
                        </li>
                    ))}
                    {!slots.length ? <li className="text-sm text-gray-500">No slots yet. Set capacity in Settings or add a slot above.</li> : null}
                </ul>
            )}
        </PageWrap>
    );
};

export const VehicleParkingMastersPage = () => {
    const { boot, locationId, vp, reload } = useVehicleParking();
    const [tab, setTab] = useState('rates');
    const [editingType, setEditingType] = useState(null);
    const [editingRate, setEditingRate] = useState(null);
    const [typeForm, setTypeForm] = useState({ type_name: '', code: '' });
    const [rateForm, setRateForm] = useState({
        vehicle_type_id: '',
        rate_amount: '',
        charging_method: 'CALENDAR_DAY',
        effective_from: new Date().toISOString().slice(0, 10),
    });
    const resetTypeForm = () => {
        setEditingType(null);
        setTypeForm({ type_name: '', code: '' });
    };
    const resetRateForm = () => {
        setEditingRate(null);
        setRateForm({
            vehicle_type_id: '',
            rate_amount: '',
            charging_method: 'CALENDAR_DAY',
            effective_from: new Date().toISOString().slice(0, 10),
        });
    };
    const startEditType = (row) => {
        setEditingType(row);
        setTypeForm({ type_name: row.type_name || '', code: row.code || '' });
    };
    const startEditRate = (row) => {
        setEditingRate(row);
        setRateForm({
            vehicle_type_id: row.vehicle_type_id || '',
            rate_amount: String(row.rate_amount ?? ''),
            charging_method: row.charging_method || 'CALENDAR_DAY',
            effective_from: String(row.effective_from || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
        });
    };
    const saveType = async (e) => {
        e.preventDefault();
        try {
            await vp(editingType ? `/vp/vehicle-types/${editingType.id}` : '/vp/vehicle-types', {
                method: editingType ? 'PUT' : 'POST',
                body: { type_name: typeForm.type_name.trim(), code: String(typeForm.code).trim().toUpperCase() },
            });
            toast.success(editingType ? 'Type updated' : 'Type saved');
            resetTypeForm();
            reload(locationId);
        } catch (err) { toast.error(err.message); }
    };
    const saveRate = async (e) => {
        e.preventDefault();
        try {
            await vp(editingRate ? `/vp/rates/${editingRate.id}` : '/vp/rates', {
                method: editingRate ? 'PUT' : 'POST',
                body: { ...rateForm, location_id: locationId },
            });
            toast.success(editingRate ? 'Rate updated' : 'Rate saved');
            resetRateForm();
            reload(locationId);
        } catch (err) { toast.error(err.message); }
    };
    const deleteType = async (row) => {
        if (!window.confirm(`Delete type "${row.type_name}" (${row.code})?`)) return;
        try {
            await vp(`/vp/vehicle-types/${row.id}`, { method: 'DELETE' });
            toast.success('Type deleted');
            if (editingType?.id === row.id) resetTypeForm();
            reload(locationId);
        } catch (err) { toast.error(err.message); }
    };
    const deleteRate = async (row) => {
        if (!window.confirm(`Delete this ${typeName(row.vehicle_type_id)} rate of ${money(row.rate_amount)}?`)) return;
        try {
            await vp(`/vp/rates/${row.id}`, { method: 'DELETE' });
            toast.success('Rate deleted');
            if (editingRate?.id === row.id) resetRateForm();
            reload(locationId);
        } catch (err) { toast.error(err.message); }
    };
    const typeName = (id) => (boot?.vehicle_types || []).find((t) => t.id === id)?.type_name || id;
    const methodLabel = (id) => METHODS.find((m) => m.id === id)?.label || id;
    return (
        <PageWrap title="Masters" actions={['rates', 'types'].map((t) => (
            <button key={t} type="button" className={tab === t ? btnPrimary : btnGhost} onClick={() => setTab(t)}>{t}</button>
        ))}>
            {tab === 'types' && (
                <>
                    <form onSubmit={saveType} className={`${cardClass} grid sm:grid-cols-3 gap-3 mb-4`}>
                        <h2 className="sm:col-span-3 font-semibold">{editingType ? 'Edit type' : 'Add type'}</h2>
                        <Field label="Type"><input className={inputClass} required value={typeForm.type_name} onChange={(e) => setTypeForm((p) => ({ ...p, type_name: e.target.value }))} /></Field>
                        <Field label="Code"><input className={inputClass} required value={typeForm.code} onChange={(e) => setTypeForm((p) => ({ ...p, code: e.target.value }))} disabled={Boolean(editingType)} /></Field>
                        <div className="flex items-end gap-2">
                            <button className={btnPrimary} type="submit">{editingType ? 'Update type' : 'Add'}</button>
                            {editingType ? <button type="button" className={btnGhost} onClick={resetTypeForm}>Cancel</button> : null}
                        </div>
                    </form>
                    <ul className={cardClass}>
                        {(boot?.vehicle_types || []).map((t) => (
                            <li key={t.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0 text-sm">
                                <span>{t.code} — {t.type_name}</span>
                                <div className="flex items-center gap-2">
                                    <button type="button" className={btnGhost} onClick={() => startEditType(t)}>
                                        <FiEdit2 className="w-4 h-4 mr-1" /> Edit
                                    </button>
                                    <button
                                        type="button"
                                        className={`${btnGhost} text-red-700 border-red-200 hover:bg-red-50`}
                                        onClick={() => deleteType(t)}
                                    >
                                        <FiTrash2 className="w-4 h-4 mr-1" /> Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            {tab === 'rates' && (
                <>
                    <form onSubmit={saveRate} className={`${cardClass} grid sm:grid-cols-4 gap-3 mb-4`}>
                        <h2 className="sm:col-span-4 font-semibold">{editingRate ? 'Edit rate' : 'Add rate'}</h2>
                        <Field label="Vehicle Type">
                            <select className={inputClass} required value={rateForm.vehicle_type_id} onChange={(e) => setRateForm((p) => ({ ...p, vehicle_type_id: e.target.value }))}>
                                <option value="">Select</option>
                                {(boot?.vehicle_types || []).map((t) => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                            </select>
                        </Field>
                        <Field label="Rate"><input type="number" className={inputClass} required value={rateForm.rate_amount} onChange={(e) => setRateForm((p) => ({ ...p, rate_amount: e.target.value }))} /></Field>
                        <Field label="Method">
                            <select className={inputClass} value={rateForm.charging_method} onChange={(e) => setRateForm((p) => ({ ...p, charging_method: e.target.value }))}>
                                {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                            </select>
                        </Field>
                        <Field label="From">
                            <input type="date" className={inputClass} required value={rateForm.effective_from} onChange={(e) => setRateForm((p) => ({ ...p, effective_from: e.target.value }))} />
                        </Field>
                        <div className="flex items-end gap-2 sm:col-span-4">
                            <button className={btnPrimary} type="submit">{editingRate ? 'Update rate' : 'Add rate'}</button>
                            {editingRate ? <button type="button" className={btnGhost} onClick={resetRateForm}>Cancel</button> : null}
                        </div>
                        <p className="text-xs text-gray-500 sm:col-span-4">Adhoc methods are for random visits. Daily / Weekly / Monthly / Yearly rates are used when you sell a pass.</p>
                    </form>
                    <ul className={cardClass}>
                        {(boot?.rates || []).map((r) => (
                            <li key={r.id} className="flex items-center justify-between gap-3 py-2 border-b last:border-0 text-sm">
                                <span>{typeName(r.vehicle_type_id)} · {money(r.rate_amount)} · {methodLabel(r.charging_method)} · from {String(r.effective_from || '').slice(0, 10)}</span>
                                <div className="flex items-center gap-2">
                                    <button type="button" className={btnGhost} onClick={() => startEditRate(r)}>
                                        <FiEdit2 className="w-4 h-4 mr-1" /> Edit
                                    </button>
                                    <button
                                        type="button"
                                        className={`${btnGhost} text-red-700 border-red-200 hover:bg-red-50`}
                                        onClick={() => deleteRate(r)}
                                    >
                                        <FiTrash2 className="w-4 h-4 mr-1" /> Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
            <p className="text-sm text-gray-500 mt-4">Check-in payment methods are the accounts you add on Ledger (Cash, Paytm, Google Pay), each with its own opening balance.</p>
        </PageWrap>
    );
};

export { VehicleParkingAccountsPage } from './VehicleParkingLedgerPage';

export const VehicleParkingShiftsPage = () => {
    const { vp, locationId } = useVehicleParking();
    const [shifts, setShifts] = useState([]);
    const [preview, setPreview] = useState(null);
    const [form, setForm] = useState({ shift_name: 'Morning Shift', staff_name: '', opening_cash: 0 });
    const [actual, setActual] = useState('');
    const load = async () => {
        try {
            setShifts(await vp('/vp/shifts', { params: { location_id: locationId } }) || []);
            setPreview(await vp('/vp/daily-closings/preview', { params: { location_id: locationId } }));
        } catch (e) { toast.error(e.message); }
    };
    useEffect(() => { if (locationId) load(); }, [locationId]);
    const openShift = async (e) => {
        e.preventDefault();
        try {
            await vp('/vp/shifts/open', { method: 'POST', body: { ...form, location_id: locationId } });
            toast.success('Shift opened');
            load();
        } catch (err) { toast.error(err.message); }
    };
    const closeShift = async (id) => {
        try {
            await vp(`/vp/shifts/${id}/close`, { method: 'POST', body: { actual_cash: actual } });
            toast.success('Shift closed');
            load();
        } catch (err) { toast.error(err.message); }
    };
    const closeDay = async () => {
        try {
            await vp('/vp/daily-closings', { method: 'POST', body: { location_id: locationId, actual_cash: actual } });
            toast.success('Day closed');
            load();
        } catch (err) { toast.error(err.message); }
    };
    return (
        <PageWrap title="Shifts & Daily Closing">
            <form onSubmit={openShift} className={`${cardClass} grid sm:grid-cols-4 gap-3 mb-4`}>
                <Field label="Shift name"><input className={inputClass} value={form.shift_name} onChange={(e) => setForm((p) => ({ ...p, shift_name: e.target.value }))} /></Field>
                <Field label="Staff"><input className={inputClass} value={form.staff_name} onChange={(e) => setForm((p) => ({ ...p, staff_name: e.target.value }))} /></Field>
                <Field label="Opening cash"><input type="number" className={inputClass} value={form.opening_cash} onChange={(e) => setForm((p) => ({ ...p, opening_cash: e.target.value }))} /></Field>
                <div className="flex items-end"><button className={btnPrimary} type="submit">Open Shift</button></div>
            </form>
            <div className={`${cardClass} mb-4`}>
                <h2 className="font-semibold mb-2">Today</h2>
                {preview && (
                    <p className="text-sm">Cash {money(preview.cash_collection)} · UPI {money(preview.upi_collection)} · Card {money(preview.card_collection)} · Total {money(preview.total_collection)}</p>
                )}
                <div className="flex gap-2 mt-3 items-end">
                    <Field label="Actual cash"><input className={inputClass} value={actual} onChange={(e) => setActual(e.target.value)} /></Field>
                    <button type="button" className={btnPrimary} onClick={closeDay}>CLOSE DAY</button>
                </div>
            </div>
            <ul className={cardClass}>
                {shifts.map((s) => (
                    <li key={s.id} className="flex justify-between py-2 border-b last:border-0 text-sm">
                        <span>{s.shift_name} · {s.staff_name || ''} · {s.status}</span>
                        {s.status === 'OPEN' && <button type="button" className={btnGhost} onClick={() => closeShift(s.id)}>Close shift</button>}
                    </li>
                ))}
            </ul>
        </PageWrap>
    );
};

export const VehicleParkingReportsPage = () => {
    const { vp, locationId } = useVehicleParking();
    const [type, setType] = useState('collection');
    const [from, setFrom] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
    const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
    const [data, setData] = useState(null);
    const [audit, setAudit] = useState([]);
    const load = async (t = type) => {
        try {
            setData(await vp('/vp/reports', { params: { type: t, location_id: locationId, from, to } }));
            setAudit(await vp('/vp/audit', { params: { location_id: locationId } }) || []);
        } catch (e) { toast.error(e.message); }
    };
    useEffect(() => { if (locationId) load(); }, [locationId]);
    const tabs = [
        ['collection', 'Collection'],
        ['vehicle', 'Vehicles'],
        ['income_expense', 'Income & Expense'],
        ['trial_balance', 'Trial Balance'],
        ['slots', 'Slots'],
        ['daily_closing', 'Daily Closing'],
    ];
    return (
        <PageWrap title="Reports" actions={tabs.map(([t, label]) => (
            <button key={t} type="button" className={type === t ? btnPrimary : btnGhost} onClick={() => { setType(t); load(t); }}>{label}</button>
        ))}>
            <div className="flex flex-wrap gap-3 mb-4">
                <Field label="From"><input type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
                <Field label="To"><input type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
                <div className="flex items-end"><button type="button" className={btnGhost} onClick={() => load()}>Apply</button></div>
            </div>
            {type === 'collection' && data && (
                <div className={cardClass}>
                    <p className="text-lg font-bold mb-2">Total {money(data.total)} · {data.count || 0} payments</p>
                    <ul>{Object.entries(data.by_mode || {}).map(([k, v]) => <li key={k} className="text-sm">{k}: {money(v)}</li>)}</ul>
                    <h3 className="font-semibold mt-4 mb-1">By day</h3>
                    <ul>{Object.entries(data.by_day || {}).map(([k, v]) => <li key={k} className="text-sm">{k}: {money(v)}</li>)}</ul>
                </div>
            )}
            {type === 'vehicle' && data && (
                <div className={cardClass}>
                    <ul className="mb-3">{Object.entries(data.by_vehicle_type || {}).map(([k, v]) => (
                        <li key={k} className="text-sm">{k}: {v.count} vehicles · {money(v.income)}</li>
                    ))}</ul>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm"><thead><tr>
                            <th className="text-left py-1">Ticket</th><th className="text-left">Vehicle</th><th className="text-left">In</th><th className="text-left">Out</th><th className="text-left">Paid</th>
                        </tr></thead>
                        <tbody>{(data.tickets || []).map((r) => (
                            <tr key={r.id} className="border-t">
                                <td className="py-1">{r.ticket_no}</td><td>{r.vehicle_number}</td>
                                <td>{formatWhen(r.check_in_at)}</td><td>{formatWhen(r.check_out_at)}</td>
                                <td>{money(r.paid_amount || r.parking_charge)}</td>
                            </tr>
                        ))}</tbody></table>
                    </div>
                </div>
            )}
            {type === 'income_expense' && data && (
                <div className={cardClass}>
                    <p>Income {money(data.income)}</p>
                    <p>Expense {money(data.expense)}</p>
                    <p className="font-bold">Net {money(data.net)}</p>
                </div>
            )}
            {type === 'trial_balance' && data && (
                <div className={cardClass}>
                    <table className="min-w-full text-sm">
                        <thead><tr><th className="text-left">Code</th><th className="text-left">Account</th><th className="text-left">Type</th><th className="text-left">Balance</th></tr></thead>
                        <tbody>{(data.rows || []).map((r) => (
                            <tr key={r.account_code} className="border-t">
                                <td>{r.account_code}</td><td>{r.account_name}</td><td>{r.account_type}</td><td>{money(r.balance)}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
            {type === 'slots' && data && (
                <div className={cardClass}>
                    <p>Available {data.available} · Occupied {data.occupied} · Reserved {data.reserved} · Maintenance {data.maintenance} · Blocked {data.blocked}</p>
                    <p className="font-semibold mt-1">Utilization {data.utilization_pct}%</p>
                </div>
            )}
            {type === 'daily_closing' && data && (
                <ul className={cardClass}>{(data.rows || []).map((r) => (
                    <li key={r.id} className="text-sm py-1">{r.closing_date} · Total {money(r.total_collection)} · Cash {money(r.cash_collection)} · Actual {r.actual_cash != null ? money(r.actual_cash) : '—'}</li>
                ))}</ul>
            )}
            <h2 className="font-semibold mt-6 mb-2">Audit trail</h2>
            <ul className={cardClass}>{audit.map((a) => <li key={a.id} className="text-sm py-1">{formatWhen(a.created_at)} · {a.actor_name} · {a.details || a.action}</li>)}</ul>
        </PageWrap>
    );
};

export const VehicleParkingSettingsPage = () => {
    const { boot, vp, reload, locationId } = useVehicleParking();
    const [company, setCompany] = useState(boot?.company || {});
    const [editingCompany, setEditingCompany] = useState(!boot?.company?.id);
    const [loc, setLoc] = useState({});
    const [capacities, setCapacities] = useState({ ANY: '' });
    useEffect(() => {
        setCompany(boot?.company || {});
        if (!boot?.company?.id) setEditingCompany(true);
        setLoc(boot?.locations?.find((l) => l.id === locationId) || {});
        const next = { ANY: '' };
        (boot?.vehicle_types || []).forEach((t) => { next[t.id] = ''; });
        (boot?.slots || []).forEach((s) => {
            const key = s.vehicle_type_id || 'ANY';
            next[key] = String(Number(next[key] || 0) + 1);
        });
        setCapacities(next);
    }, [boot, locationId]);
    const saveCompany = async (e) => {
        e.preventDefault();
        try {
            await vp('/vp/company', {
                method: 'PUT',
                body: {
                    company_name: company.company_name,
                    mobile: company.mobile,
                    email: company.email,
                    address: company.address,
                },
            });
            toast.success(boot?.company?.id ? 'Company updated' : 'Company saved');
            setEditingCompany(false);
            reload(locationId);
        } catch (err) { toast.error(err.message); }
    };
    const startEditCompany = () => {
        setCompany(boot?.company || {});
        setEditingCompany(true);
    };
    const cancelEditCompany = () => {
        setCompany(boot?.company || {});
        setEditingCompany(!boot?.company?.id);
    };
    const saveLoc = async (e) => {
        e.preventDefault();
        try {
            if (loc.id) await vp(`/vp/locations/${loc.id}`, { method: 'PUT', body: { ...loc, capacities } });
            else await vp('/vp/locations', { method: 'POST', body: { ...loc, capacities } });
            toast.success('Facility and slot capacity saved');
            reload(locationId);
        } catch (err) { toast.error(err.message); }
    };
    return (
        <PageWrap title="Settings">
            {boot?.company?.id && !editingCompany ? (
                <div className={`${cardClass} mb-4`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {boot.company.logo ? (
                                    <img src={boot.company.logo} alt="" className="w-full h-full object-contain bg-white" />
                                ) : (
                                    <FiBriefcase className="w-5 h-5 text-red-600" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-semibold text-gray-900">Company</h2>
                                <p className="text-lg font-bold text-gray-900 truncate">{boot.company.company_name}</p>
                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                    <p className="flex items-center gap-2"><FiPhone className="w-4 h-4 flex-shrink-0" />{boot.company.mobile || '—'}</p>
                                    <p className="flex items-center gap-2"><FiMail className="w-4 h-4 flex-shrink-0" />{boot.company.email || '—'}</p>
                                    <p className="flex items-start gap-2"><FiMapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />{boot.company.address || '—'}</p>
                                </div>
                            </div>
                        </div>
                        <button type="button" className={btnGhost} onClick={startEditCompany} title="Edit company">
                            <FiEdit2 className="w-4 h-4 mr-1" /> Edit
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-3">This name appears on the customer token. Use Edit to change details or logo.</p>
                </div>
            ) : (
                <form onSubmit={saveCompany} className={`${cardClass} grid sm:grid-cols-2 gap-3 mb-4`}>
                    <h2 className="sm:col-span-2 font-semibold">{boot?.company?.id ? 'Edit company' : 'Company'}</h2>
                    <p className="sm:col-span-2 text-sm text-gray-600">Your parking business name appears on the customer token.</p>
                    <Field label="Company Name *"><input className={inputClass} required value={company.company_name || ''} onChange={(e) => setCompany((p) => ({ ...p, company_name: e.target.value }))} /></Field>
                    <Field label="Mobile"><input className={inputClass} value={company.mobile || ''} onChange={(e) => setCompany((p) => ({ ...p, mobile: e.target.value }))} /></Field>
                    <Field label="Email"><input className={inputClass} value={company.email || ''} onChange={(e) => setCompany((p) => ({ ...p, email: e.target.value }))} /></Field>
                    <Field label="Address"><input className={inputClass} value={company.address || ''} onChange={(e) => setCompany((p) => ({ ...p, address: e.target.value }))} /></Field>
                    <Field label="Logo">
                        <input
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (!boot?.company?.id) {
                                    toast.error('Save the company name first, then upload a logo');
                                    e.target.value = '';
                                    return;
                                }
                                const fd = new FormData();
                                fd.append('logo', file);
                                try {
                                    await vp('/vp/company/logo', { method: 'POST', formData: fd });
                                    toast.success('Logo uploaded');
                                    reload(locationId);
                                } catch (err) { toast.error(err.message); }
                            }}
                        />
                        {company.logo ? <img src={company.logo} alt="Logo" className="h-12 mt-2 object-contain" /> : null}
                    </Field>
                    <div className="flex items-end gap-2">
                        <button className={btnPrimary} type="submit">{boot?.company?.id ? 'Update company' : 'Save company'}</button>
                        {boot?.company?.id ? (
                            <button type="button" className={btnGhost} onClick={cancelEditCompany}>Cancel</button>
                        ) : null}
                    </div>
                </form>
            )}
            <form onSubmit={saveLoc} className={`${cardClass} grid sm:grid-cols-2 gap-3`}>
                <h2 className="sm:col-span-2 font-semibold">Parking facility</h2>
                <p className="sm:col-span-2 text-sm text-gray-600">This is one parking yard (basement, street lot, mall). Company details above are the business. The mobile here is the facility / gate office number customers can call for this yard — not the subscriber’s number, and not a staff login.</p>
                <p className="sm:col-span-2 text-sm text-gray-600">You can update name, contact, address or add slots later. Check-ins already made stay on this facility and keep their slot. Occupied slots are never deleted if you lower capacity. Only Owner / Parking Manager (Settings permission) can change this — not Parking Staff or the subscriber.</p>
                <Field label="Facility / location name *"><input className={inputClass} required value={loc.location_name || ''} onChange={(e) => setLoc((p) => ({ ...p, location_name: e.target.value }))} /></Field>
                <Field label="Facility contact mobile">
                    <input className={inputClass} value={loc.mobile || ''} onChange={(e) => setLoc((p) => ({ ...p, mobile: e.target.value }))} placeholder="Gate / office number for this yard" />
                </Field>
                <Field label="Address"><input className={inputClass} value={loc.address || ''} onChange={(e) => setLoc((p) => ({ ...p, address: e.target.value }))} /></Field>
                <p className="sm:col-span-2 text-sm text-gray-600">Slot counts: Bike slots are only offered to bikes; Car slots to cars. “Any vehicle” can take any type. Occupied slots are never removed if you later type a smaller number.</p>
                <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Field label="Any vehicle">
                        <input type="number" min="0" max="2000" className={inputClass} placeholder="0" value={capacities.ANY || ''} onChange={(e) => setCapacities((p) => ({ ...p, ANY: e.target.value }))} />
                    </Field>
                    {(boot?.vehicle_types || []).map((t) => (
                        <Field key={t.id} label={t.type_name}>
                            <input type="number" min="0" max="2000" className={inputClass} placeholder="0" value={capacities[t.id] || ''} onChange={(e) => setCapacities((p) => ({ ...p, [t.id]: e.target.value }))} />
                        </Field>
                    ))}
                </div>
                <p className="sm:col-span-2 text-sm text-gray-500">Current slots: {(boot?.slots || []).length}</p>
                <div className="flex items-end gap-2">
                    <button className={btnPrimary} type="submit">Save facility</button>
                    <button type="button" className={btnGhost} onClick={() => { setLoc({ location_name: '' }); setCapacities({ ANY: '' }); }}>New facility</button>
                </div>
            </form>
            <VpLedgerCategoriesCard />
        </PageWrap>
    );
};

const VpLedgerCategoriesCard = () => {
    const { vp, reload, locationId } = useVehicleParking();
    const [rows, setRows] = useState([]);
    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const load = async () => {
        try { setRows(await vp('/vp/ledger/categories') || []); }
        catch (e) { toast.error(e.message); }
    };
    useEffect(() => { load(); }, []);
    const add = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error('Enter a category name');
        setSaving(true);
        try {
            await vp('/vp/ledger/categories', { method: 'POST', body: { category_name: name.trim() } });
            toast.success('Category added');
            setName('');
            await load();
            reload(locationId);
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };
    const remove = async (row) => {
        try {
            await vp(`/vp/ledger/categories/${row.id}`, { method: 'DELETE' });
            toast.success('Category deleted');
            await load();
            reload(locationId);
        } catch (err) { toast.error(err.message); }
    };
    return (
        <div className={`${cardClass} mt-4`}>
            <div className="flex items-center gap-2 text-red-700 text-sm font-semibold mb-1">
                <FiTag /> Ledger
            </div>
            <h2 className="font-semibold text-gray-900">Categories</h2>
            <p className="text-sm text-gray-600 mb-3">These categories appear on Ledger → Add entry. Pass sales and parking collections can use them too.</p>
            <form onSubmit={add} className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                    className={inputClass}
                    placeholder="e.g. Electricity, Salary, Pass Sale"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <button className={btnPrimary} type="submit" disabled={saving}>{saving ? 'Adding…' : '+ Add category'}</button>
            </form>
            <ul className="divide-y divide-gray-100 border rounded-xl overflow-hidden">
                {rows.map((row) => (
                    <li key={row.id} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white">
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{row.category_name}</p>
                            {row.is_system ? <p className="text-xs text-gray-500">System category</p> : null}
                        </div>
                        {!row.is_system ? (
                            <button type="button" className="p-2 rounded-lg text-red-600 hover:bg-red-50" onClick={() => remove(row)} aria-label={`Delete ${row.category_name}`}>
                                <FiTrash2 />
                            </button>
                        ) : null}
                    </li>
                ))}
                {!rows.length ? <li className="px-3 py-6 text-sm text-gray-500 text-center">No categories yet.</li> : null}
            </ul>
        </div>
    );
};

export const VehicleParkingPassesPage = () => {
    const { boot, locationId, vp, reload } = useVehicleParking();
    const payAccounts = vpPaymentAccounts(boot);
    const types = boot?.vehicle_types || [];
    const typeName = (id) => types.find((t) => t.id === id)?.type_name || 'Any vehicle';
    const emptyForm = () => ({
        vehicle_number: '', vehicle_type_id: '', slot_id: '', customer_mobile: '', customer_name: '',
        plan: 'MONTHLY', valid_from: new Date().toISOString().slice(0, 10),
        payment_mode: payAccounts[0]?.id || '', amount: '', reference_number: '',
    });
    const [rows, setRows] = useState([]);
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const passRate = (boot?.rates || []).find((r) => String(r.vehicle_type_id) === String(form.vehicle_type_id) && r.charging_method === form.plan);
    const bookedUntil = passEndDate(form.plan, form.valid_from);
    const allSlots = boot?.slots || [];
    const mapSlots = form.vehicle_type_id
        ? allSlots.filter((s) => slotFitsType(s, form.vehicle_type_id))
        : allSlots;
    const selectedSlot = allSlots.find((s) => slotIdOf(s) === String(form.slot_id));
    const emptySlots = mapSlots.filter((s) => slotStatusOf(s) === 'AVAILABLE');
    const bookedBySlotId = useMemo(
        () => Object.fromEntries((rows || []).filter((r) => r.booked && r.slot_id).map((r) => [r.slot_id, r])),
        [rows]
    );
    const load = async () => {
        try { setRows(await vp('/vp/passes', { params: { location_id: locationId } }) || []); }
        catch (e) { toast.error(e.message); }
    };
    const closeModal = () => {
        setOpen(false);
        setForm(emptyForm());
        setSaving(false);
    };
    const openModal = () => {
        setForm(emptyForm());
        setOpen(true);
    };
    useEffect(() => { if (locationId) load(); }, [locationId]);
    useEffect(() => {
        if (passRate) setForm((p) => ({ ...p, amount: String(passRate.rate_amount) }));
    }, [form.plan, form.vehicle_type_id]);
    useEffect(() => {
        if (!payAccounts.length) return;
        setForm((p) => (p.payment_mode ? p : { ...p, payment_mode: payAccounts[0].id }));
    }, [payAccounts.length]);
    const sell = async (e) => {
        e.preventDefault();
        if (!form.customer_name.trim()) return toast.error('Customer name is required');
        if (!/^\d{10}$/.test(tenDigitPhone(form.customer_mobile))) {
            return toast.error('Enter a 10-digit mobile — this becomes their Treasure login');
        }
        if (!form.vehicle_type_id) return toast.error('Select a vehicle type, then an empty slot');
        if (!form.slot_id) return toast.error('Select an empty slot (dropdown or red tile) to book until the pass end date');
        if (!form.payment_mode) return toast.error('Add a ledger account first, then choose it as the payment account.');
        setSaving(true);
        try {
            const row = await vp('/vp/passes', { method: 'POST', body: { ...form, location_id: locationId, vehicle_number: form.vehicle_number.toUpperCase() } });
            toast.success(identityLoginToast(
                `${row.plan} pass ${row.pass_no} · slot ${row.slot_number} booked until ${row.valid_to}`,
                row
            ));
            closeModal();
            load();
            reload(locationId);
        } catch (err) { toast.error(err.message); }
        finally { setSaving(false); }
    };
    return (
        <PageWrap title="Parking passes" actions={(
            <button type="button" className={btnPrimary} onClick={openModal}>
                <FiPlus className="mr-1" /> Add New pass
            </button>
        )}>
            <p className="text-sm text-gray-600 mb-3">
                All daily, weekly, monthly and yearly passes for this facility. Add a pass to book a slot until the plan end date.
            </p>
            <div className="overflow-x-auto bg-white rounded-xl border">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left"><tr>
                        <th className="px-3 py-2">Pass</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2">Mobile</th>
                        <th className="px-3 py-2">Vehicle</th>
                        <th className="px-3 py-2">Slot</th>
                        <th className="px-3 py-2">Plan</th>
                        <th className="px-3 py-2">From</th>
                        <th className="px-3 py-2">Booked until</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Status</th>
                    </tr></thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id} className="border-t">
                                <td className="px-3 py-2">{r.pass_no}</td>
                                <td className="px-3 py-2 font-medium">{r.customer_name || '—'}</td>
                                <td className="px-3 py-2">{r.customer_mobile || '—'}</td>
                                <td className="px-3 py-2">{r.vehicle_number} · {r.vehicle_type_name}</td>
                                <td className="px-3 py-2">{r.slot_number || '—'}</td>
                                <td className="px-3 py-2">{r.plan_label || r.plan}</td>
                                <td className="px-3 py-2">{r.valid_from}</td>
                                <td className="px-3 py-2">{r.valid_to}</td>
                                <td className="px-3 py-2">{money(r.amount)}</td>
                                <td className="px-3 py-2">{r.booking_status || (r.expired && r.status === 'ACTIVE' ? 'Ended' : r.status)}</td>
                            </tr>
                        ))}
                        {!rows.length ? (
                            <tr><td className="px-3 py-6 text-sm text-gray-500" colSpan={10}>No passes yet. Use + Add New pass.</td></tr>
                        ) : null}
                    </tbody>
                </table>
            </div>
            {open ? (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={closeModal} role="presentation">
                    <form
                        onSubmit={sell}
                        className="bg-white w-full max-w-6xl sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[94vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="vp-add-pass-title"
                    >
                        <div className="shrink-0 border-b px-5 py-4 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-red-700">New pass</p>
                                <h2 id="vp-add-pass-title" className="text-lg font-bold text-gray-900">Add New pass</h2>
                                <p className="text-sm text-gray-600">Customer details on the left. Book a slot on the right until {bookedUntil}.</p>
                            </div>
                            <button type="button" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" onClick={closeModal} aria-label="Close">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-2">
                            <div className="p-5 border-b lg:border-b-0 lg:border-r space-y-3">
                                <h3 className="font-semibold text-gray-900">Customer</h3>
                                <Field label="Customer name *"><input className={inputClass} required value={form.customer_name} onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))} /></Field>
                                <Field label="Mobile *">
                                    <input className={inputClass} required inputMode="numeric" value={form.customer_mobile} onChange={(e) => setForm((p) => ({ ...p, customer_mobile: e.target.value }))} placeholder="10-digit login mobile" />
                                </Field>
                                <Field label="Vehicle number *"><input className={inputClass} required value={form.vehicle_number} onChange={(e) => setForm((p) => ({ ...p, vehicle_number: e.target.value }))} /></Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Plan *">
                                        <select className={inputClass} value={form.plan} onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value, amount: '' }))}>
                                            {PASS_PLANS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Starts"><input type="date" className={inputClass} value={form.valid_from} onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))} /></Field>
                                </div>
                                <Field label="Booked until">
                                    <input className={inputClass} readOnly value={bookedUntil} />
                                    <p className="text-xs text-gray-500 mt-1">From the {PASS_PLANS.find((p) => p.id === form.plan)?.label || form.plan} plan</p>
                                </Field>
                                <Field label="Parking slot *">
                                    <select
                                        className={inputClass}
                                        required
                                        value={form.slot_id}
                                        onChange={(e) => {
                                            const next = allSlots.find((s) => slotIdOf(s) === e.target.value);
                                            setForm((p) => ({
                                                ...p,
                                                slot_id: e.target.value,
                                                vehicle_type_id: p.vehicle_type_id || next?.vehicle_type_id || '',
                                            }));
                                        }}
                                    >
                                        <option value="">{emptySlots.length ? 'Select empty slot' : 'No empty slots for this type'}</option>
                                        {emptySlots.map((s) => (
                                            <option key={slotIdOf(s)} value={slotIdOf(s)}>
                                                {s.slot_number} · {typeName(s.vehicle_type_id)}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedSlot ? <p className="text-xs text-gray-500 mt-1">Booked on this pass until {bookedUntil}</p> : null}
                                </Field>
                                <Field label="Payment account">
                                    <select className={inputClass} required value={form.payment_mode} onChange={(e) => setForm((p) => ({ ...p, payment_mode: e.target.value }))}>
                                        <option value="">Select account</option>
                                        {payAccounts.map((m) => <option key={m.id} value={m.id}>{m.account_name}</option>)}
                                    </select>
                                </Field>
                                <Field label="Amount *">
                                    <input type="number" step="0.01" min="0.01" className={inputClass} required value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
                                    {passRate ? <p className="text-xs text-gray-500 mt-1">From Masters: {money(passRate.rate_amount)}</p> : <p className="text-xs text-amber-700 mt-1">Add a {form.plan} rate in Masters, or type the amount.</p>}
                                </Field>
                                <Field label="Reference"><input className={inputClass} value={form.reference_number} onChange={(e) => setForm((p) => ({ ...p, reference_number: e.target.value }))} /></Field>
                                <VpPayeeHint
                                    account={payAccounts.find((a) => String(a.id) === String(form.payment_mode))}
                                    amount={form.amount}
                                />
                            </div>
                            <div className="p-5 bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Slots</h3>
                                <p className="text-sm text-gray-600 mb-3">Click a type, then an empty red slot. Amber slots are already booked on a pass.</p>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <button
                                        type="button"
                                        className={!form.vehicle_type_id ? btnPrimary : btnGhost}
                                        onClick={() => setForm((p) => ({ ...p, vehicle_type_id: '', slot_id: '' }))}
                                    >
                                        All ({allSlots.length})
                                    </button>
                                    {types.map((t) => {
                                        const forType = allSlots.filter((s) => slotFitsType(s, t.id));
                                        const empty = forType.filter((s) => slotStatusOf(s) === 'AVAILABLE').length;
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                className={String(form.vehicle_type_id) === String(t.id) ? btnPrimary : btnGhost}
                                                onClick={() => setForm((p) => ({ ...p, vehicle_type_id: t.id, slot_id: p.slot_id && slotFitsType(allSlots.find((s) => s.id === p.slot_id) || {}, t.id) ? p.slot_id : '' }))}
                                            >
                                                {t.type_name} ({empty} empty / {forType.length})
                                            </button>
                                        );
                                    })}
                                </div>
                                <SlotMap
                                    slots={mapSlots}
                                    parkedBySlotId={bookedBySlotId}
                                    selectedId={form.slot_id}
                                    onSelect={(s) => setForm((p) => ({
                                        ...p,
                                        slot_id: slotIdOf(s),
                                        vehicle_type_id: p.vehicle_type_id || s.vehicle_type_id || '',
                                    }))}
                                    canSelect={(s) => !form.vehicle_type_id || slotFitsType(s, form.vehicle_type_id)}
                                    typeLabel={(s) => typeName(s.vehicle_type_id)}
                                    gridClass="grid grid-cols-2 sm:grid-cols-3 gap-2"
                                />
                            </div>
                        </div>
                        <div className="shrink-0 border-t px-5 py-4 flex gap-2 bg-white rounded-b-2xl">
                            <button className={`${btnPrimary} flex-1 sm:flex-none`} type="submit" disabled={saving}>{saving ? 'Saving…' : 'Sell pass'}</button>
                            <button type="button" className={btnGhost} onClick={closeModal}>Cancel</button>
                        </div>
                    </form>
                </div>
            ) : null}
        </PageWrap>
    );
};

export const VehicleParkingStaffPage = () => {
    const history = useHistory();
    return (
        <PageWrap title="Staff">
            <div className={cardClass}>
                <p className="text-sm text-gray-600 mb-3">
                    Parking Manager, Parking Staff (Collector) and Accountant are managed in Employee & Access.
                    Assign VEHICLE_PARKING with the right role and feature permissions (check-in, check-out, rates, ledger, reports).
                </p>
                <button type="button" className={btnPrimary} onClick={() => history.push('/platform/employees')}>Open Employee & Access</button>
            </div>
        </PageWrap>
    );
};
