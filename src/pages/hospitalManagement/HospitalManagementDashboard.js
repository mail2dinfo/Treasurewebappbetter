import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhBasePath } from '../../components/hospitalManagement/hospitalManagementMenuItems';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const StatCard = ({ label, value, hint, valueClass = 'text-gray-900', to }) => {
  const body = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-1 tabular-nums ${valueClass}`}>{value}</p>
      {hint ? <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p> : null}
    </>
  );
  const className = `bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm ${to ? 'hover:border-cyan-300 transition-colors' : ''}`;
  return to
    ? <Link to={to} className={`block ${className}`}>{body}</Link>
    : <div className={className}>{body}</div>;
};

const HospitalManagementDashboard = () => {
  const { dashboard, fetchDashboard, fetchLowStock, lowStockMedicines, isLoading } = useHospitalManagement();
  const basePath = useHhBasePath();

  useEffect(() => {
    fetchDashboard();
    fetchLowStock();
  }, [fetchDashboard, fetchLowStock]);

  const todayAppointments = Number(dashboard?.todayAppointments ?? dashboard?.appointments_today ?? 0);
  const admissionsActive = Number(dashboard?.activeAdmissions ?? dashboard?.admissions_active ?? 0);
  const revenueToday = Number(dashboard?.revenueToday ?? dashboard?.revenue_today ?? 0);
  const lowStock = dashboard?.lowStockAlerts || dashboard?.low_stock || lowStockMedicines || [];
  const lowCount = Array.isArray(lowStock) ? lowStock.length : Number(lowStock || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hospital Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Today&apos;s OPD, admissions, revenue & pharmacy alerts</p>
      </div>

      {isLoading && !dashboard ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Today's appointments"
              value={todayAppointments}
              to={`${basePath}/appointments`}
              valueClass="text-cyan-800"
            />
            <StatCard
              label="Active admissions"
              value={admissionsActive}
              to={`${basePath}/admissions`}
              valueClass="text-teal-700"
            />
            <StatCard
              label="Revenue today"
              value={rs(revenueToday)}
              to={`${basePath}/hospital-billing`}
              valueClass="text-emerald-700"
            />
            <StatCard
              label="Low stock alerts"
              value={lowCount}
              hint={lowCount ? 'Restock medicines' : 'All good'}
              to={`${basePath}/pharmacy`}
              valueClass={lowCount ? 'text-amber-700' : 'text-gray-900'}
            />
          </div>

          {Array.isArray(lowStock) && lowStock.length > 0 && (
            <div className="bg-white border border-amber-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-100 bg-amber-50">
                <h2 className="text-sm font-semibold text-amber-900">Pharmacy low stock</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {lowStock.slice(0, 8).map((item) => (
                  <li key={item.id || item.name} className="px-4 py-2.5 flex justify-between text-sm">
                    <span className="text-gray-800">{item.name || item.medicine_name}</span>
                    <span className="tabular-nums text-amber-700 font-medium">
                      {Number(item.stock_qty ?? item.qty ?? 0)} {item.unit || 'units'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HospitalManagementDashboard;
