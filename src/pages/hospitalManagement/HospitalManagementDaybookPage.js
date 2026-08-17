import React, { useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const toDate = (d) => d.toISOString().slice(0, 10);

const HospitalManagementDaybookPage = () => {
  const { daybook, fetchDaybook } = useHospitalManagement();
  const [selectedDate, setSelectedDate] = useState(toDate(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const prevDateRef = useRef(null);

  const load = async (date, force = false) => {
    setIsLoading(true);
    await fetchDaybook(date, force);
    setIsLoading(false);
  };

  useEffect(() => {
    if (prevDateRef.current !== selectedDate) {
      prevDateRef.current = selectedDate;
      load(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    load(selectedDate);
  }, []);

  const navigateDate = (direction) => {
    const date = new Date(`${selectedDate}T12:00:00`);
    date.setDate(date.getDate() + direction);
    setSelectedDate(toDate(date));
  };

  const isToday = selectedDate === toDate(new Date());
  const collections = daybook?.collections_by_category || daybook?.collectionsByCategory || [];
  const expenses = daybook?.expenses_by_category || daybook?.expensesByCategory || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Daybook</h1>
            <p className="text-sm text-gray-500">Daily collections and expenses</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigateDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg" title="Previous day">
              <FiChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <FiCalendar className="w-5 h-5 text-gray-500" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              {isToday && <span className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full font-medium">Today</span>}
            </div>
            <button type="button" onClick={() => navigateDate(1)} className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-40" disabled={isToday} title="Next day">
              <FiChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <button type="button" onClick={() => load(selectedDate, true)} className="p-2 hover:bg-gray-100 rounded-lg" title="Refresh">
              <FiRefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-gray-500">Collections</p>
          <p className="text-lg font-bold tabular-nums text-emerald-700">{rs(daybook?.total_collections ?? daybook?.totalCollections)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-gray-500">Expenses</p>
          <p className="text-lg font-bold tabular-nums text-red-700">{rs(daybook?.total_expenses ?? daybook?.totalExpenses)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-gray-500">Net</p>
          <p className="text-lg font-bold tabular-nums text-cyan-800">{rs(daybook?.net_balance ?? daybook?.netBalance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryBlock title="Collections by category" items={collections} color="emerald" />
        <CategoryBlock title="Expenses by category" items={expenses} color="red" />
      </div>

      <CashReportSection />
    </div>
  );
};

const CashReportSection = () => {
  const { cashReport, fetchCashReport } = useHospitalManagement();
  const firstOfMonth = () => {
    const d = new Date();
    return toDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };
  const [from, setFrom] = useState(firstOfMonth());
  const [to, setTo] = useState(toDate(new Date()));
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    await fetchCashReport(from, to);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const rows = cashReport?.daily_breakdown || cashReport?.dailyBreakdown || cashReport?.rows || [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Cash report (date range)</h2>
          <p className="text-xs text-gray-500">Collections, expenses & net by day</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-gray-400 text-xs">to</span>
          <input type="date" className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          <button type="button" onClick={load} className="inline-flex items-center gap-1 bg-cyan-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-cyan-800">
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Load
          </button>
        </div>
      </div>

      {(cashReport?.total_collections != null || cashReport?.totalCollections != null) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div><p className="text-[10px] uppercase text-gray-500 font-semibold">Total collections</p><p className="text-sm font-bold text-emerald-700 tabular-nums">{rs(cashReport.total_collections ?? cashReport.totalCollections)}</p></div>
          <div><p className="text-[10px] uppercase text-gray-500 font-semibold">Total expenses</p><p className="text-sm font-bold text-red-700 tabular-nums">{rs(cashReport.total_expenses ?? cashReport.totalExpenses)}</p></div>
          <div><p className="text-[10px] uppercase text-gray-500 font-semibold">Net</p><p className="text-sm font-bold text-cyan-800 tabular-nums">{rs(cashReport.net_balance ?? cashReport.netBalance)}</p></div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Collections</th>
              <th className="px-4 py-2">Expenses</th>
              <th className="px-4 py-2">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!(rows || []).length ? (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No data for selected range</td></tr>
            ) : (rows || []).map((row, idx) => (
              <tr key={row.date || idx}>
                <td className="px-4 py-2">{row.date || row.book_date || row.bookDate || '—'}</td>
                <td className="px-4 py-2 tabular-nums text-emerald-700">{rs(row.collections ?? row.total_collections ?? row.totalCollections)}</td>
                <td className="px-4 py-2 tabular-nums text-red-700">{rs(row.expenses ?? row.total_expenses ?? row.totalExpenses)}</td>
                <td className="px-4 py-2 tabular-nums text-cyan-800">{rs(row.net ?? row.net_balance ?? row.netBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CategoryBlock = ({ title, items, color }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
    </div>
    {!(items || []).length ? (
      <p className="text-center text-gray-500 py-6 text-sm">No entries</p>
    ) : (
      <ul className="divide-y divide-gray-100">
        {(items || []).map((item, idx) => (
          <li key={item.category || idx} className="px-4 py-2.5 flex justify-between text-sm">
            <span className="text-gray-800">{item.category || item.name}</span>
            <span className={`tabular-nums font-medium ${color === 'emerald' ? 'text-emerald-700' : 'text-red-700'}`}>{rs(item.amount ?? item.total)}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default HospitalManagementDaybookPage;
