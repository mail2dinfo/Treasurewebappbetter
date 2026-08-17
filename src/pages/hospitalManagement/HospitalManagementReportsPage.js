import React, { useEffect, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const toDate = (d) => d.toISOString().slice(0, 10);

const firstOfMonth = () => {
  const d = new Date();
  return toDate(new Date(d.getFullYear(), d.getMonth(), 1));
};

const HospitalManagementReportsPage = () => {
  const { reportsOverview, fetchReportsOverview } = useHospitalManagement();
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(toDate(new Date()));
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    await fetchReportsOverview(from, to);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const ov = reportsOverview || {};
  const appointments = ov.appointments || {};
  const revenue = ov.revenue || {};
  const beds = ov.beds || {};
  const pharmacy = ov.pharmacy || {};
  const lab = ov.lab || {};
  const doctorProductivity = ov.doctor_productivity || ov.doctorProductivity || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500">Hospital overview & productivity</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
            <button type="button" onClick={load} className="inline-flex items-center gap-1 bg-cyan-700 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-cyan-800">
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Load
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard title="Appointments" value={appointments.total ?? appointments.count ?? 0} sub={`Completed: ${appointments.completed ?? 0}`} />
        <StatCard title="Revenue" value={rs(revenue.total ?? revenue.amount)} sub={`Collections: ${rs(revenue.collections)}`} isMoney />
        <StatCard title="Bed occupancy" value={`${beds.occupied ?? 0}/${beds.total ?? 0}`} sub={`Rate: ${beds.occupancy_rate ?? beds.occupancyRate ?? 0}%`} />
        <StatCard title="Pharmacy sales" value={rs(pharmacy.total ?? pharmacy.revenue)} sub={`Orders: ${pharmacy.count ?? pharmacy.orders ?? 0}`} isMoney />
        <StatCard title="Lab orders" value={lab.total ?? lab.count ?? 0} sub={`Completed: ${lab.completed ?? 0}`} />
        <StatCard title="Net collections" value={rs(revenue.net ?? revenue.total)} sub={from && to ? `${from} — ${to}` : ''} isMoney />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Doctor productivity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Doctor</th>
                <th className="px-4 py-2">Consultations</th>
                <th className="px-4 py-2">Appointments</th>
                <th className="px-4 py-2">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!(doctorProductivity || []).length ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No data for selected range</td></tr>
              ) : (doctorProductivity || []).map((row, idx) => (
                <tr key={row.doctor_id ?? row.doctorId ?? idx}>
                  <td className="px-4 py-2 font-medium">{row.doctor_name ?? row.doctorName ?? '—'}</td>
                  <td className="px-4 py-2">{row.consultations ?? 0}</td>
                  <td className="px-4 py-2">{row.appointments ?? 0}</td>
                  <td className="px-4 py-2 tabular-nums">{rs(row.revenue ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, sub, isMoney }) => (
  <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
    <p className="text-[11px] font-semibold uppercase text-gray-500">{title}</p>
    <p className={`text-xl font-bold tabular-nums text-cyan-800 ${isMoney ? '' : ''}`}>{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

export default HospitalManagementReportsPage;
