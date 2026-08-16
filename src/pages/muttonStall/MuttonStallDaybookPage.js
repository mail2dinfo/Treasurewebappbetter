import React, { useEffect, useRef, useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import { useMuttonStall } from '../../context/muttonStall/MuttonStallContext';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const toDate = (d) => d.toISOString().slice(0, 10);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(`${String(dateStr).slice(0, 10)}T12:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Daybook like Daily Collection / VF — computed from ledger credits & debits.
 */
const MuttonStallDaybookPage = () => {
  const { daybook, fetchDaybook } = useMuttonStall();
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
  const collections = daybook?.collections_by_category || [];
  const expenses = daybook?.expenses_by_category || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigateDate(-1)} className="p-2 hover:bg-gray-100 rounded-lg" title="Previous day">
              <FiChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <FiCalendar className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              {isToday && (
                <span className="px-2 py-1 bg-rose-100 text-rose-800 text-xs rounded-full font-medium">Today</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigateDate(1)}
              className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-40"
              disabled={isToday}
              title="Next day"
            >
              <FiChevronRight className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm text-gray-600">{formatDate(selectedDate)}</span>
          </div>
          <button
            type="button"
            onClick={() => load(selectedDate, true)}
            disabled={isLoading}
            className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading && !daybook && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500">
          Loading day book…
        </div>
      )}

      {daybook && (
        <>
          <div className="bg-gradient-to-br from-rose-800 to-rose-950 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Balance Summary</h3>
              <span className="text-rose-200 text-sm">{formatDate(daybook.date || daybook.book_date)}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-rose-200 text-xs mb-1 font-medium">Opening Balance</p>
                <p className="text-2xl font-bold">{rs(daybook.opening_balance)}</p>
                <p className="text-rose-300 text-xs mt-1">(Previous day&apos;s closing)</p>
              </div>
              <div>
                <p className="text-rose-200 text-xs mb-1 font-medium">Total Received</p>
                <p className="text-2xl font-bold text-emerald-200">{rs(daybook.total_received)}</p>
                <p className="text-rose-300 text-xs mt-1">{collections.length} categories</p>
              </div>
              <div>
                <p className="text-rose-200 text-xs mb-1 font-medium">Total Spent</p>
                <p className="text-2xl font-bold text-red-200">{rs(daybook.total_spent)}</p>
                <p className="text-rose-300 text-xs mt-1">{expenses.length} categories</p>
              </div>
              <div>
                <p className="text-rose-200 text-xs mb-1 font-medium">Closing Balance</p>
                <p className="text-2xl font-bold">{rs(daybook.closing_balance)}</p>
                <p className="text-rose-300 text-xs mt-1">(Opening + Received − Spent)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                <h3 className="text-sm font-semibold text-emerald-900">Received (Credit) by category</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {collections.map((row) => (
                  <li key={`${row.category}-${row.subcategory || ''}`} className="px-4 py-2.5 flex justify-between text-sm">
                    <span className="text-gray-800">
                      {row.category}
                      {row.subcategory ? <span className="text-xs text-gray-500"> · {row.subcategory}</span> : null}
                      <span className="text-xs text-gray-400 ml-2">×{row.transaction_count || 0}</span>
                    </span>
                    <span className="tabular-nums font-medium text-emerald-700">{rs(row.amount)}</span>
                  </li>
                ))}
                {!collections.length && (
                  <li className="px-4 py-8 text-center text-sm text-gray-500">No credits today</li>
                )}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-rose-50 border-b border-rose-100">
                <h3 className="text-sm font-semibold text-rose-900">Spent (Debit) by category</h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {expenses.map((row) => (
                  <li key={`${row.category}-${row.subcategory || ''}`} className="px-4 py-2.5 flex justify-between text-sm">
                    <span className="text-gray-800">
                      {row.category}
                      {row.subcategory ? <span className="text-xs text-gray-500"> · {row.subcategory}</span> : null}
                      <span className="text-xs text-gray-400 ml-2">×{row.transaction_count || 0}</span>
                    </span>
                    <span className="tabular-nums font-medium text-rose-800">{rs(row.amount)}</span>
                  </li>
                ))}
                {!expenses.length && (
                  <li className="px-4 py-8 text-center text-sm text-gray-500">No debits today</li>
                )}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MuttonStallDaybookPage;
