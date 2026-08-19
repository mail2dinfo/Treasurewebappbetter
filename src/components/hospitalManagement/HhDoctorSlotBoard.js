import React from 'react';

const HhDoctorSlotBoard = ({
  doctorName,
  slotBoard,
  loading = false,
  selectedTime = '',
  onSelect,
  selectable = true,
  emptyPrompt = 'Choose a day to see appointment slots.',
}) => {
  const slots = slotBoard?.slots || [];
  const morningSlots = slots.filter((slot) => String(slot.time || '').slice(0, 2) < '14');
  const eveningSlots = slots.filter((slot) => String(slot.time || '').slice(0, 2) >= '14');

  const renderSlots = (group, title) => {
    if (!group.length) return null;
    return (
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
        <div className="flex flex-wrap gap-2">
          {group.map((slot) => {
            const booked = String(slot.status).toUpperCase() === 'BOOKED';
            const selected = selectedTime === slot.time;
            const canClick = Boolean(onSelect) && (selectable ? !booked : true);
            return (
              <button
                key={`${title}-${slot.time}`}
                type="button"
                disabled={!canClick}
                title={booked ? `Booked${slot.patient_name ? ` · ${slot.patient_name}` : ''}` : 'Free slot'}
                onClick={() => onSelect?.(slot)}
                className={`min-w-[5.25rem] rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                  booked
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : selected
                      ? 'border-cyan-700 bg-cyan-700 text-white'
                      : 'border-green-200 bg-green-50 text-green-800 hover:bg-green-100'
                } ${!canClick ? 'cursor-default' : ''}`}
              >
                <span className="block">{slot.time}</span>
                <span className="block font-medium opacity-80">{booked ? (slot.patient_name || 'Booked') : 'Free'}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {doctorName ? `Dr. ${doctorName} schedule` : 'Doctor schedule'}
        </h3>
        {slotBoard?.working ? (
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${slotBoard.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {slotBoard.available ? `${slotBoard.free_count} free / ${slotBoard.booked_count} booked` : 'Fully booked'}
          </span>
        ) : slotBoard ? (
          <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-amber-100 text-amber-800">Not available this day</span>
        ) : null}
      </div>
      {loading ? (
        <p className="text-sm text-gray-500">Loading schedule…</p>
      ) : !slotBoard ? (
        <p className="text-sm text-gray-500">{emptyPrompt}</p>
      ) : !slotBoard.working ? (
        <p className="text-sm text-gray-500">No OPD slots on this date. Try another day (Mon–Sat, 9:00–13:00 and 16:00–20:00).</p>
      ) : (
        <>
          {renderSlots(morningSlots, 'Morning')}
          {renderSlots(eveningSlots, 'Evening')}
          <p className="text-xs text-gray-500">Green = free. Red = booked.</p>
        </>
      )}
    </div>
  );
};

export default HhDoctorSlotBoard;
