import React, { useEffect, useState } from 'react';
import { useMuttonStall } from '../../context/muttonStall/MuttonStallContext';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const toDate = (d) => d.toISOString().slice(0, 10);

const MuttonStallReportsPage = () => {
  const { reports, fetchReports } = useMuttonStall();
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return toDate(d);
  });
  const [to, setTo] = useState(toDate(new Date()));

  useEffect(() => {
    fetchReports({ from_date: fromDate, to_date: to, start_date: fromDate, end_date: to });
  }, [fromDate, to, fetchReports]);

  const byDay = reports?.byDay || reports?.sales_by_day || reports?.by_day || [];
  const byProduct = reports?.byProduct || reports?.sales_by_product || reports?.by_product || [];
  const totalSales = Number(reports?.totalSales ?? reports?.total_sales ?? byDay.reduce((s, r) => s + Number(r.total || r.sales || 0), 0));

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Sales by day and product</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="text-sm">
            <span className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">From</span>
            <input type="date" className="border border-gray-300 rounded-lg px-2.5 py-2 text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </label>
          <label className="text-sm">
            <span className="block text-[11px] font-semibold uppercase text-gray-500 mb-1">To</span>
            <input type="date" className="border border-gray-300 rounded-lg px-2.5 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <p className="text-[11px] font-semibold uppercase text-gray-500">Period total</p>
        <p className="text-2xl font-bold text-emerald-700 tabular-nums mt-1">{rs(totalSales)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Sales by day</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {byDay.map((row) => (
              <li key={row.date || row.day} className="px-4 py-2.5 flex justify-between text-sm">
                <span className="text-gray-700">{row.date || row.day}</span>
                <span className="tabular-nums font-medium">{rs(row.total ?? row.sales)}</span>
              </li>
            ))}
            {!byDay.length && <li className="px-4 py-8 text-center text-gray-500 text-sm">No day sales</li>}
          </ul>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Sales by product</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {byProduct.map((row) => (
              <li key={row.product_id || row.name} className="px-4 py-2.5 flex justify-between text-sm gap-3">
                <span className="text-gray-700 truncate">{row.product_name || row.name}</span>
                <span className="tabular-nums font-medium shrink-0">{rs(row.total ?? row.sales)}</span>
              </li>
            ))}
            {!byProduct.length && <li className="px-4 py-8 text-center text-gray-500 text-sm">No product sales</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MuttonStallReportsPage;
