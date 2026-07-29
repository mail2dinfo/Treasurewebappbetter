import React, { useEffect, useState } from 'react';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import HostelSelector from '../../components/hostelManagement/HostelSelector';

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const bedColor = (status, pending) => {
  if (String(status || '').toUpperCase() !== 'OCCUPIED') {
    return 'bg-gray-400 text-white border-gray-500';
  }
  if (Number(pending) > 0) {
    return 'bg-red-600 text-white border-red-700';
  }
  return 'bg-green-600 text-white border-green-700';
};

const STATUS_STYLE = {
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-amber-100 text-amber-800',
  PENDING: 'bg-red-100 text-red-700',
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};


const BedHistory = ({ bed, stayLabel, onClose, fetchReceivables, hostelId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bed?.resident_id) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setRows([]);
      try {
        const result = await fetchReceivables(hostelId, { residentId: bed.resident_id });
        if (!cancelled) {
          const all = Array.isArray(result?.data) ? result.data : [];
          // Strict filter — only this bed's resident
          setRows(all.filter((r) => String(r.resident_id) === String(bed.resident_id)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [bed?.resident_id, bed?.bed_id, hostelId, fetchReceivables]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-bold text-gray-900">{bed.resident_name || `Bed ${bed.bed_label}`}</h2>
          <p className="text-xs text-gray-500">
            {stayLabel}
            {bed.resident_phone ? ` · ${bed.resident_phone}` : ''}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {bed.resident_id
              ? 'Payment history for this bed / resident only'
              : 'Vacant — no payment history'}
          </p>
          {bed.join_date && (
            <p className="text-xs text-gray-500 mt-0.5">
              Onboarded: <span className="font-semibold text-gray-700">{fmtDate(bed.join_date)}</span>
            </p>
          )}
        </div>
        <button type="button" onClick={onClose} className="text-xs text-gray-500 font-semibold hover:text-red-700 px-2 py-1 rounded border border-gray-200">
          ✕ Close
        </button>
      </div>
      <div className="overflow-y-auto flex-1 max-h-[calc(100vh-220px)]">
        {loading && <p className="p-4 text-sm text-gray-500">Loading history…</p>}
        {!loading && !bed.resident_id && (
          <p className="p-4 text-sm text-gray-400">This bed is vacant — no payment records.</p>
        )}
        {!loading && bed.resident_id && rows.length === 0 && (
          <p className="p-4 text-sm text-gray-400">No billing records found for this resident.</p>
        )}
        {!loading && rows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2">Period</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Paid</th>
                <th className="px-3 py-2">Balance</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs">
                    <p className="font-medium">{fmtDate(r.billing_period_start)}</p>
                    {r.billing_period_end && r.billing_period_end !== r.billing_period_start && (
                      <p className="text-gray-400">→ {fmtDate(r.billing_period_end)}</p>
                    )}
                    <p className="text-gray-400">{r.rent_plan}</p>
                  </td>
                  <td className="px-3 py-2 font-semibold">{inr(r.amount_due)}</td>
                  <td className="px-3 py-2 text-green-700 font-semibold">{inr(r.amount_paid)}</td>
                  <td className="px-3 py-2 text-red-700 font-semibold">{inr(r.balance)}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status] || 'bg-gray-100 text-gray-700'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-gray-50">
              <tr>
                <td className="px-3 py-2 text-xs font-bold text-gray-700">Total</td>
                <td className="px-3 py-2 font-bold">{inr(rows.reduce((s, r) => s + Number(r.amount_due || 0), 0))}</td>
                <td className="px-3 py-2 font-bold text-green-700">{inr(rows.reduce((s, r) => s + Number(r.amount_paid || 0), 0))}</td>
                <td className="px-3 py-2 font-bold text-red-700">{inr(rows.reduce((s, r) => s + Number(r.balance || 0), 0))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

const HostelManagementDuesDeckPage = () => {
  const {
    selectedHostelId, duesDeck, duesPeriodLabel,
    fetchDuesDeck, fetchReceivables, isLoading,
  } = useHostelManagement();
  const [period, setPeriod] = useState('all');
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedStayLabel, setSelectedStayLabel] = useState('');

  useEffect(() => {
    setSelectedBed(null);
    setSelectedStayLabel('');
    if (selectedHostelId) fetchDuesDeck(selectedHostelId, period);
  }, [selectedHostelId, period]);

  const floors = duesDeck || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-red-700">Bed Deck</h1>
          <p className="text-sm text-red-400">
            {duesPeriodLabel || (period === 'current' ? 'Current month only' : 'All months — full pending history')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 font-semibold ${period === 'all' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              All months
            </button>
            <button
              type="button"
              onClick={() => setPeriod('current')}
              className={`px-3 py-1.5 font-semibold ${period === 'current' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              This month
            </button>
          </div>
          <HostelSelector />
        </div>
      </div>

      {isLoading && <p className="text-gray-500">Loading…</p>}

      {!selectedHostelId && !isLoading && (
        <p className="text-gray-500">Select a hostel to view the bed deck.</p>
      )}

      {selectedHostelId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {/* 50% — Bed deck */}
          <section className="bg-white border rounded-xl shadow-sm overflow-hidden min-h-[70vh] flex flex-col">
            <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-red-700">Bed Deck</h2>
                <p className="text-xs text-red-400">
                  Click a bed to see that resident&apos;s payment history only
                </p>
              </div>
              <div className="flex gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-400" /> Vacant</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-600" /> No dues</span>
                <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-600" /> Pending</span>
              </div>
            </div>
            <div className="p-4 space-y-5 overflow-y-auto flex-1 max-h-[calc(100vh-220px)]">
              {floors.map((floor) => (
                <div key={floor.floor_id} className="space-y-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="text-sm font-bold text-red-800">{floor.floor_name}</h3>
                    <p className="text-xs text-red-700 font-semibold">
                      Not paid {inr(floor.pending_total)} · {floor.pending_residents || 0} due
                    </p>
                  </div>
                  {(floor.rooms || []).map((room) => (
                    <div key={room.room_id}>
                      <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Room {room.room_number}</p>
                      <div className="flex flex-wrap gap-2">
                        {(room.beds || []).map((bed) => (
                          <div
                            key={bed.bed_id}
                            onClick={() => {
                              setSelectedBed({ ...bed, floor_name: floor.floor_name, room_number: room.room_number });
                              setSelectedStayLabel(`${floor.floor_name} / Room ${room.room_number} / Bed ${bed.bed_label}`);
                            }}
                            className={`min-w-[100px] rounded-lg border px-2.5 py-2 text-center cursor-pointer hover:opacity-80 transition-opacity ${bedColor(bed.status, bed.pending_amount)} ${selectedBed?.bed_id === bed.bed_id ? 'ring-2 ring-offset-1 ring-yellow-300' : ''}`}
                            title={bed.resident_name || 'Vacant'}
                          >
                            <p className="text-[11px] font-bold leading-tight text-white">Bed {bed.bed_label}</p>
                            <p className="text-[10px] truncate text-white opacity-90">{bed.resident_name || 'Vacant'}</p>
                            {bed.resident_name && Number(bed.pending_amount) > 0 && (
                              <p className="text-[11px] font-bold mt-0.5 text-white">{inr(bed.pending_amount)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {!isLoading && floors.length === 0 && (
                <p className="text-sm text-gray-500">No floors yet for this hostel.</p>
              )}
            </div>
          </section>

          {/* 50% — Payment History (selected bed only) */}
          <section className="bg-white border rounded-xl shadow-sm overflow-hidden min-h-[70vh] flex flex-col">
            {selectedBed ? (
              <BedHistory
                key={`${selectedBed.bed_id}-${selectedBed.resident_id || 'vacant'}`}
                bed={selectedBed}
                stayLabel={selectedStayLabel}
                onClose={() => setSelectedBed(null)}
                fetchReceivables={fetchReceivables}
                hostelId={selectedHostelId}
              />
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 p-8 text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl">🛏️</div>
                <p className="font-semibold text-gray-700">Click any bed to view payment history</p>
                <p className="text-sm text-gray-400">
                  Only that bed&apos;s resident history is shown — period, amount, paid, balance, and status.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default HostelManagementDuesDeckPage;
