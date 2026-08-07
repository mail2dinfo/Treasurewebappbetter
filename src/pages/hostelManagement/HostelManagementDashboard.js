import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import { useHmBasePath } from '../../components/hostelManagement/hostelManagementMenuItems';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const sumRows = (rows) => rows.reduce(
  (acc, row) => ({
    residents: acc.residents + Number(row.residents || 0),
    pendingCount: acc.pendingCount + Number(row.pendingCount || 0),
    pendingTotal: acc.pendingTotal + Number(row.pendingTotal || 0),
    amountDue: acc.amountDue + Number(row.amountDue || 0),
    amountPaid: acc.amountPaid + Number(row.amountPaid || 0),
    rentCollected: acc.rentCollected + Number(row.rentCollected || 0),
    foodCollected: acc.foodCollected + Number(row.foodCollected || 0),
    totalCollected: acc.totalCollected + Number(row.totalCollected || 0),
    monthRent: acc.monthRent + Number(row.monthRent || 0),
    monthFood: acc.monthFood + Number(row.monthFood || 0),
    monthEarned: acc.monthEarned + Number(row.monthEarned || 0),
    monthSpent: acc.monthSpent + Number(row.monthSpent || 0),
    monthProfit: acc.monthProfit + Number(row.monthProfit || 0),
    totalBeds: acc.totalBeds + Number(row.totalBeds || 0),
    occupiedBeds: acc.occupiedBeds + Number(row.occupiedBeds || 0),
    vacantBeds: acc.vacantBeds + Number(row.vacantBeds || 0),
  }),
  {
    residents: 0,
    pendingCount: 0,
    pendingTotal: 0,
    amountDue: 0,
    amountPaid: 0,
    rentCollected: 0,
    foodCollected: 0,
    totalCollected: 0,
    monthRent: 0,
    monthFood: 0,
    monthEarned: 0,
    monthSpent: 0,
    monthProfit: 0,
    totalBeds: 0,
    occupiedBeds: 0,
    vacantBeds: 0,
  }
);

const th = 'px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap';
const td = 'px-3 py-2 whitespace-nowrap';

const StatCard = ({ label, value, hint, valueClass = 'text-gray-900', cardClass = '', to }) => {
  const body = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 leading-tight">{label}</p>
      <p className={`text-lg sm:text-xl font-bold mt-1 tabular-nums leading-tight ${valueClass}`}>{value}</p>
      {hint ? <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{hint}</p> : null}
    </>
  );
  const className = `bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm ${cardClass} ${to ? 'hover:border-red-300 transition-colors' : ''}`;
  return to
    ? <Link to={to} className={`block ${className}`}>{body}</Link>
    : <div className={className}>{body}</div>;
};

const HostelManagementDashboard = () => {
  const {
    dashboard, fetchDashboard, hostels, fetchHostels,
  } = useHostelManagement();
  const basePath = useHmBasePath();
  const [hostelFilter, setHostelFilter] = useState('');
  const [monthMode, setMonthMode] = useState('month'); // 'all' | 'month'
  const [monthFilter, setMonthFilter] = useState(currentMonthKey);

  useEffect(() => {
    fetchHostels();
  }, []);

  useEffect(() => {
    const monthParam = monthMode === 'all' ? 'all' : (monthFilter || currentMonthKey());
    fetchDashboard(hostelFilter || null, monthParam);
  }, [hostelFilter, monthMode, monthFilter]);

  const byHostel = dashboard?.byHostel || [];
  const viewTotals = useMemo(() => sumRows(byHostel), [byHostel]);

  const spentUnallocated = Number(dashboard?.totals?.monthSpentUnallocated || 0);
  const isAllHostels = !hostelFilter;
  const profitTotal = isAllHostels
    ? Number((viewTotals.monthEarned - viewTotals.monthSpent - spentUnallocated).toFixed(2))
    : viewTotals.monthProfit;
  const spentTotal = isAllHostels
    ? Number((viewTotals.monthSpent + spentUnallocated).toFixed(2))
    : viewTotals.monthSpent;

  const monthLabel = dashboard?.monthLabel
    || (monthMode === 'all'
      ? 'All months'
      : new Date(`${monthFilter}-01T00:00:00`).toLocaleString('en-IN', { month: 'long', year: 'numeric' }));

  const hostelName = hostelFilter
    ? (byHostel[0]?.hostel_name || hostels.find((h) => String(h.id) === String(hostelFilter))?.hostel_name || 'Hostel')
    : 'All hostels';

  const topFoodItems = (dashboard?.topFoodItems || []).slice(0, 5);
  const mostUtilizedBeds = (dashboard?.mostUtilizedBeds || []).slice(0, 5);
  const mostEmptyBeds = (dashboard?.mostEmptyBeds || []).slice(0, 5);

  const outstandingQuery = hostelFilter
    ? `hostel_id=${encodeURIComponent(hostelFilter)}&outstanding=1`
    : 'outstanding=1';

  const hostelOptions = useMemo(() => {
    if ((dashboard?.byHostel || []).length && !hostelFilter) {
      // Prefer names from last unfiltered response when available via hostels list
    }
    return (hostels || []).map((h) => ({ id: h.id, name: h.hostel_name }));
  }, [hostels, dashboard?.byHostel, hostelFilter]);

  const periodHint = monthMode === 'all' ? 'All time' : monthLabel;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* Header + filters */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hostel Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {hostelName} · {monthLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <label className="text-sm">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Month</span>
              <div className="flex items-center gap-1.5">
                <select
                  className="border border-gray-300 rounded-lg px-2.5 py-2 text-sm bg-white"
                  value={monthMode}
                  onChange={(e) => setMonthMode(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="month">Month</option>
                </select>
                {monthMode === 'month' && (
                  <input
                    type="month"
                    className="border border-gray-300 rounded-lg px-2.5 py-2 text-sm bg-white"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value || currentMonthKey())}
                  />
                )}
              </div>
            </label>
            <label className="text-sm">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Hostel</span>
              <select
                className="border border-gray-300 rounded-lg px-2.5 py-2 text-sm min-w-[11rem] bg-white"
                value={hostelFilter}
                onChange={(e) => setHostelFilter(e.target.value)}
              >
                <option value="">All</option>
                {hostelOptions.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* KPI strip — one compact band */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatCard
          label="Earned"
          value={rs(viewTotals.monthEarned)}
          hint={periodHint}
          valueClass="text-green-700"
        />
        <StatCard
          label="Spent"
          value={rs(spentTotal)}
          hint="Ledger DEBITs"
          valueClass="text-amber-700"
        />
        <StatCard
          label="Profit"
          value={rs(profitTotal)}
          hint={profitTotal < 0 ? 'Loss' : 'Earned − spent'}
          valueClass={profitTotal < 0 ? 'text-red-700' : 'text-green-700'}
          cardClass={profitTotal < 0 ? 'border-red-300 bg-red-50' : ''}
        />
        <StatCard
          label="Rent"
          value={rs(viewTotals.rentCollected)}
          hint={periodHint}
          to={`${basePath}/receivables`}
        />
        <StatCard
          label="Food"
          value={rs(viewTotals.foodCollected)}
          hint={periodHint}
          to={`${basePath}/special-orders`}
        />
        <StatCard
          label="Pending dues"
          value={viewTotals.pendingCount}
          hint={rs(viewTotals.pendingTotal)}
          valueClass="text-red-700"
          to={`${basePath}/outstanding?${outstandingQuery}`}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard
          label="Hostels"
          value={hostelFilter ? 1 : (hostels?.length || byHostel.length)}
          to={`${basePath}/hostels`}
        />
        <StatCard
          label="Residents"
          value={viewTotals.residents}
          to={`${basePath}/residents`}
        />
        <StatCard
          label="Occupied beds"
          value={`${viewTotals.occupiedBeds}/${viewTotals.totalBeds}`}
          hint={viewTotals.totalBeds
            ? `${((viewTotals.occupiedBeds / viewTotals.totalBeds) * 100).toFixed(0)}% used`
            : '—'}
        />
        <StatCard
          label="Vacant beds"
          value={viewTotals.vacantBeds}
          valueClass="text-amber-700"
        />
      </div>

      {/* P&L + dues */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">P&amp;L by hostel</h2>
              <p className="text-[11px] text-gray-500">{monthLabel} · rent + food − ledger spend</p>
            </div>
            <Link to={`${basePath}/ledger`} className="text-xs font-semibold text-red-700 hover:underline">Ledger</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className={th}>Hostel</th>
                  <th className={`${th} text-right`}>Earned</th>
                  <th className={`${th} text-right`}>Spent</th>
                  <th className={`${th} text-right`}>Profit</th>
                </tr>
              </thead>
              <tbody>
                {byHostel.map((row) => {
                  const profit = Number(row.monthProfit || 0);
                  const loss = profit < 0;
                  return (
                    <tr key={`pnl-${row.hostel_id}`} className={`border-t border-gray-100 ${loss ? 'bg-red-50/80' : ''}`}>
                      <td className={`${td} font-medium text-gray-900 truncate max-w-[10rem]`}>{row.hostel_name}</td>
                      <td className={`${td} text-right text-green-700`}>{rs(row.monthEarned)}</td>
                      <td className={`${td} text-right text-amber-800`}>{rs(row.monthSpent)}</td>
                      <td className={`${td} text-right font-bold ${loss ? 'text-red-700' : 'text-green-700'}`}>{rs(profit)}</td>
                    </tr>
                  );
                })}
                {byHostel.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-5 text-center text-gray-500 text-sm">No data for this filter</td></tr>
                )}
              </tbody>
              {byHostel.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                    <td className={td}>Total</td>
                    <td className={`${td} text-right text-green-800`}>{rs(viewTotals.monthEarned)}</td>
                    <td className={`${td} text-right text-amber-900`}>{rs(spentTotal)}</td>
                    <td className={`${td} text-right ${profitTotal < 0 ? 'text-red-800' : 'text-green-800'}`}>{rs(profitTotal)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {isAllHostels && spentUnallocated > 0 && (
            <p className="px-3 py-1.5 text-[11px] text-gray-500 border-t border-gray-100">
              Includes {rs(spentUnallocated)} unallocated spend (no resident).
            </p>
          )}
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Collections &amp; dues</h2>
              <p className="text-[11px] text-gray-500">
                {monthMode === 'all' ? 'All-time collections' : `Collections in ${monthLabel}`}
                {' · '}dues for billing period
              </p>
            </div>
            <Link
              to={`${basePath}/outstanding?${outstandingQuery}`}
              className="text-xs font-semibold text-red-700 border border-red-200 bg-red-50 px-2 py-1 rounded-lg hover:bg-red-100"
            >
              Outstanding
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className={th}>Hostel</th>
                  <th className={`${th} text-right`}>Rent</th>
                  <th className={`${th} text-right`}>Food</th>
                  <th className={`${th} text-right`}>Due</th>
                  <th className={`${th} text-right`}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {byHostel.map((row) => (
                  <tr key={`coll-${row.hostel_id}`} className="border-t border-gray-100">
                    <td className={`${td} font-medium text-gray-900 truncate max-w-[9rem]`}>{row.hostel_name}</td>
                    <td className={`${td} text-right text-green-700`}>{rs(row.rentCollected)}</td>
                    <td className={`${td} text-right text-green-700`}>{rs(row.foodCollected)}</td>
                    <td className={`${td} text-right font-semibold text-red-700`}>{rs(row.pendingTotal)}</td>
                    <td className={`${td} text-right`}>
                      <Link
                        to={`${basePath}/outstanding?hostel_id=${encodeURIComponent(row.hostel_id)}&outstanding=1`}
                        className="inline-flex min-w-[2rem] justify-center px-2 py-0.5 rounded-md text-xs font-semibold text-red-800 bg-red-50 border border-red-200"
                      >
                        {row.pendingCount}
                      </Link>
                    </td>
                  </tr>
                ))}
                {byHostel.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-5 text-center text-gray-500 text-sm">No data for this filter</td></tr>
                )}
              </tbody>
              {byHostel.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                    <td className={td}>Total</td>
                    <td className={`${td} text-right text-green-800`}>{rs(viewTotals.rentCollected)}</td>
                    <td className={`${td} text-right text-green-800`}>{rs(viewTotals.foodCollected)}</td>
                    <td className={`${td} text-right text-red-800`}>{rs(viewTotals.pendingTotal)}</td>
                    <td className={`${td} text-right`}>{viewTotals.pendingCount}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Top food · {monthLabel}</h2>
            <Link to={`${basePath}/special-orders`} className="text-xs font-semibold text-red-700 hover:underline">Orders</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className={th}>#</th>
                <th className={th}>Item</th>
                <th className={`${th} text-right`}>Qty</th>
                <th className={`${th} text-right`}>₹</th>
              </tr>
            </thead>
            <tbody>
              {topFoodItems.map((item) => (
                <tr key={`${item.rank}-${item.item_name}`} className="border-t border-gray-100">
                  <td className={`${td} text-gray-500`}>{item.rank}</td>
                  <td className={`${td} font-medium truncate max-w-[9rem]`}>{item.item_name}</td>
                  <td className={`${td} text-right`}>{Number(item.quantity_sold).toLocaleString('en-IN')}</td>
                  <td className={`${td} text-right text-green-700`}>{rs(item.revenue)}</td>
                </tr>
              ))}
              {topFoodItems.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-5 text-center text-gray-500 text-sm">No orders in this period</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Most utilized beds</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className={th}>Hostel</th>
                <th className={`${th} text-right`}>Occ</th>
                <th className={`${th} text-right`}>%</th>
              </tr>
            </thead>
            <tbody>
              {mostUtilizedBeds.map((row) => (
                <tr key={`util-${row.hostel_id}`} className="border-t border-gray-100">
                  <td className={`${td} font-medium truncate max-w-[9rem]`}>{row.hostel_name}</td>
                  <td className={`${td} text-right`}>{row.occupiedBeds}/{row.totalBeds}</td>
                  <td className={`${td} text-right font-semibold text-green-700`}>{row.utilizationPct}%</td>
                </tr>
              ))}
              {mostUtilizedBeds.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-5 text-center text-gray-500 text-sm">No bed data</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Most empty beds</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className={th}>Hostel</th>
                <th className={`${th} text-right`}>Vacant</th>
                <th className={`${th} text-right`}>%</th>
              </tr>
            </thead>
            <tbody>
              {mostEmptyBeds.map((row) => (
                <tr key={`empty-${row.hostel_id}`} className="border-t border-gray-100">
                  <td className={`${td} font-medium truncate max-w-[9rem]`}>{row.hostel_name}</td>
                  <td className={`${td} text-right font-semibold text-amber-700`}>{row.vacantBeds}/{row.totalBeds}</td>
                  <td className={`${td} text-right text-gray-600`}>{row.utilizationPct}%</td>
                </tr>
              ))}
              {mostEmptyBeds.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-5 text-center text-gray-500 text-sm">No bed data</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default HostelManagementDashboard;
