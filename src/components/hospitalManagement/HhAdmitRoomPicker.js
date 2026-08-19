import React, { useMemo } from 'react';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/** Sort vacant beds by daily room price (low → high). */
export const sortBedsByPrice = (beds = []) =>
  [...beds].sort((a, b) => Number(a.daily_rate ?? a.price ?? 0) - Number(b.daily_rate ?? b.price ?? 0));

export const bedLabel = (b) => {
  const ward = b.ward_name || b.wardName || 'Ward';
  const type = b.ward_type || b.wardType || '';
  const bed = b.bed_number || b.bedNumber || '';
  const rate = Number(b.daily_rate ?? b.price ?? b.ward_daily_rate ?? 0);
  return `${ward}${type ? ` (${type})` : ''} · Bed ${bed} · ${rs(rate)}/day`;
};

/**
 * Room/bed picker sorted by price + patient wish field.
 */
const HhAdmitRoomPicker = ({
  beds = [],
  bedId,
  onBedChange,
  patientWish = '',
  onPatientWishChange,
  doctorAdvice = '',
  onDoctorAdviceChange,
  showDoctorAdvice = false,
}) => {
  const sorted = useMemo(() => sortBedsByPrice(beds), [beds]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-gray-600">Room / bed (by price)</label>
      <select
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        value={bedId}
        onChange={(e) => onBedChange(e.target.value)}
      >
        <option value="">Select room *</option>
        {sorted.map((b) => (
          <option key={b.id} value={b.id}>{bedLabel(b)}</option>
        ))}
      </select>
      {!sorted.length && (
        <p className="text-xs text-amber-700">No vacant rooms. Add wards/beds with a daily rate first.</p>
      )}
      <label className="block text-xs font-medium text-gray-600">Patient wish (room preference)</label>
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="e.g. Private room near window, AC, family attendant…"
        value={patientWish}
        onChange={(e) => onPatientWishChange(e.target.value)}
      />
      {showDoctorAdvice && (
        <>
          <label className="block text-xs font-medium text-gray-600">Doctor advice / reason for admit</label>
          <textarea
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Surgery / observation / critical care…"
            value={doctorAdvice}
            onChange={(e) => onDoctorAdviceChange(e.target.value)}
          />
        </>
      )}
    </div>
  );
};

export default HhAdmitRoomPicker;
