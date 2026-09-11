import React from 'react';

export const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';
export const labelClass = 'block text-xs font-medium text-gray-600 mb-1';
export const btnPrimary = 'inline-flex items-center justify-center rounded-lg bg-red-700 text-white px-4 py-2 text-sm font-semibold hover:bg-red-800 disabled:opacity-50';
export const btnGhost = 'inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50';
export const cardClass = 'bg-white rounded-xl border border-gray-200 shadow-sm p-4';

export const Field = ({ label, children }) => (
    <label className="block">
        <span className={labelClass}>{label}</span>
        {children}
    </label>
);

export const VpPayeeHint = ({ account, amount }) => {
    if (!account) return null;
    const phone = String(account.payee_phone || '').replace(/\D/g, '').slice(-10);
    if (!account.qr_code && !phone) return null;
    return (
        <div className="sm:col-span-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-3">
            <p className="text-sm font-semibold text-indigo-950">Pay with {account.account_name}</p>
            {amount ? <p className="text-sm text-indigo-900 mt-0.5">Amount {`₹${Number(amount || 0).toLocaleString('en-IN')}`}</p> : null}
            {phone ? <p className="text-lg font-bold tracking-wide text-indigo-950 mt-1">{phone}</p> : null}
            {account.qr_code ? (
                <img src={account.qr_code} alt={`${account.account_name} QR`} className="h-40 w-40 object-contain bg-white rounded-md border mt-2" />
            ) : null}
            <p className="text-xs text-indigo-800 mt-2">Subscriber can scan this QR or pay to the number in Paytm / Google Pay during check-in.</p>
        </div>
    );
};

export const slotStatusOf = (slot) => String(slot?.status || 'AVAILABLE').trim().toUpperCase();
export const slotIdOf = (slot) => String(slot?.id || slot?.slot_id || '');

export const slotTone = (status) => {
    const key = String(status || '').trim().toUpperCase();
    if (key === 'OCCUPIED') return 'bg-green-600 border-green-700 text-white';
    if (key === 'AVAILABLE' || !key) return 'bg-red-600 border-red-700 text-white';
    if (key === 'RESERVED') return 'bg-amber-400 border-amber-500 text-white';
    if (key === 'MAINTENANCE') return 'bg-blue-500 border-blue-600 text-white';
    return 'bg-gray-400 border-gray-500 text-white';
};

export const SlotMap = ({ slots = [], parkedBySlotId = {}, onStatusChange, canManage = false, onSelect, selectedId, canSelect, typeLabel, gridClass, selectStatuses = ['AVAILABLE'] }) => (
    <div>
        <div className="flex flex-wrap gap-3 text-xs mb-3">
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-600 inline-block" /> Parked / not available</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600 inline-block" /> Empty / available</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Booked on a pass</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Maintenance</span>
            <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-400 inline-block" /> Blocked</span>
        </div>
        <div className={gridClass || 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2'}>
            {slots.map((s) => {
                const id = slotIdOf(s);
                const status = slotStatusOf(s);
                const parked = parkedBySlotId[s.id] || parkedBySlotId[id];
                const allowed = !canSelect || canSelect(s);
                const selectable = Boolean(onSelect) && selectStatuses.includes(status) && allowed;
                const selected = Boolean(id) && String(selectedId) === id;
                const label = typeLabel ? typeLabel(s) : (s.slot_type && s.slot_type !== 'GENERAL' ? s.slot_type : 'Any');
                const reservedHint = parked?.valid_to ? `Until ${parked.valid_to}` : (parked?.vehicle_number || parked?.customer_name || 'Booked');
                return (
                    <button
                        key={id || s.slot_number}
                        type="button"
                        onClick={() => selectable && onSelect(s)}
                        className={`rounded-lg p-3 text-left border shadow-sm min-h-[4.5rem] ${slotTone(status)} ${selected ? 'ring-2 ring-offset-2 ring-gray-900' : ''} ${selectable ? 'cursor-pointer' : 'cursor-default'} ${onSelect && !selectable ? 'opacity-40' : ''}`}
                    >
                        <p className="font-bold text-white">{s.slot_number}</p>
                        <p className="text-[10px] uppercase tracking-wide text-white">{label}</p>
                        <p className="text-xs text-white">
                            {status === 'OCCUPIED'
                                ? (parked?.vehicle_number || 'Parked')
                                : status === 'AVAILABLE' ? 'Empty'
                                : status === 'RESERVED' ? reservedHint
                                : status}
                        </p>
                        {canManage && status !== 'OCCUPIED' ? (
                            <select
                                className="mt-1 text-xs w-full bg-white/90 text-gray-900 rounded"
                                value={status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => onStatusChange?.(s, e.target.value)}
                            >
                                {['AVAILABLE', 'RESERVED', 'MAINTENANCE', 'BLOCKED'].map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        ) : null}
                    </button>
                );
            })}
        </div>
        {!slots.length ? <p className="text-sm text-gray-500 mt-2">No slots at this location yet.</p> : null}
    </div>
);

export const PageWrap = ({ title, actions, children }) => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
        {children}
    </div>
);
