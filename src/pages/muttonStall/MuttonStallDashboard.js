import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMuttonStall } from '../../context/muttonStall/MuttonStallContext';
import { useMsBasePath } from '../../components/muttonStall/muttonStallMenuItems';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const StatCard = ({ label, value, hint, valueClass = 'text-gray-900', to }) => {
  const body = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-xl font-bold mt-1 tabular-nums ${valueClass}`}>{value}</p>
      {hint ? <p className="text-[11px] text-gray-500 mt-0.5">{hint}</p> : null}
    </>
  );
  const className = `bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm ${to ? 'hover:border-rose-300 transition-colors' : ''}`;
  return to
    ? <Link to={to} className={`block ${className}`}>{body}</Link>
    : <div className={className}>{body}</div>;
};

const MuttonStallDashboard = () => {
  const { dashboard, fetchDashboard, isLoading } = useMuttonStall();
  const basePath = useMsBasePath();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const todayOrders = Number(dashboard?.todayOrders ?? dashboard?.orders_today ?? 0);
  const salesToday = Number(dashboard?.salesToday ?? dashboard?.sales_today ?? 0);
  const lowStock = dashboard?.lowStockAlerts || dashboard?.low_stock || [];
  const lowCount = Array.isArray(lowStock) ? lowStock.length : Number(lowStock || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Stall Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Today&apos;s orders, stock alerts and sales</p>
      </div>

      {isLoading && !dashboard ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard
              label="Today's orders"
              value={todayOrders}
              to={`${basePath}/orders`}
              valueClass="text-rose-900"
            />
            <StatCard
              label="Sales today"
              value={rs(salesToday)}
              to={`${basePath}/reports`}
              valueClass="text-emerald-700"
            />
            <StatCard
              label="Low stock alerts"
              value={lowCount}
              hint={lowCount ? 'Restock soon' : 'All good'}
              to={`${basePath}/stock`}
              valueClass={lowCount ? 'text-amber-700' : 'text-gray-900'}
            />
          </div>

          {Array.isArray(lowStock) && lowStock.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Low stock</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {lowStock.slice(0, 8).map((item) => (
                  <li key={item.id || item.name} className="px-4 py-2.5 flex justify-between text-sm">
                    <span className="text-gray-800">{item.name || item.product_name}</span>
                    <span className="tabular-nums text-amber-700 font-medium">
                      {Number(item.stock_qty ?? item.qty ?? 0)} {item.unit || 'kg'}
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

export default MuttonStallDashboard;
