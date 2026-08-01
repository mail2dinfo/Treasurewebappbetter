import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import { useHmBasePath } from '../../components/hostelManagement/hostelManagementMenuItems';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

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
  }
);

const th = 'px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap';
const td = 'px-3 py-2.5 whitespace-nowrap';

const HostelManagementDashboard = () => {
  const {
    dashboard, fetchDashboard, hostels, fetchHostels,
  } = useHostelManagement();
  const basePath = useHmBasePath();
  const [hostelFilter, setHostelFilter] = useState('');

  useEffect(() => {
    fetchHostels();
  }, []);

  useEffect(() => {
    fetchDashboard(hostelFilter || null);
  }, [hostelFilter]);

  const allByHostel = dashboard?.byHostel || [];

  const byHostel = useMemo(() => {
    if (!hostelFilter) return allByHostel;
    return allByHostel.filter((row) => String(row.hostel_id) === String(hostelFilter));
  }, [allByHostel, hostelFilter]);

  const viewTotals = useMemo(() => sumRows(byHostel), [byHostel]);
  const topFoodItems = (dashboard?.topFoodItems || []).slice(0, 5);

  const mostUtilizedBeds = useMemo(() => {
    const rows = dashboard?.mostUtilizedBeds || [];
    const filtered = hostelFilter
      ? rows.filter((r) => String(r.hostel_id) === String(hostelFilter))
      : rows;
    return filtered.slice(0, 5);
  }, [dashboard?.mostUtilizedBeds, hostelFilter]);

  const mostEmptyBeds = useMemo(() => {
    const rows = dashboard?.mostEmptyBeds || [];
    const filtered = hostelFilter
      ? rows.filter((r) => String(r.hostel_id) === String(hostelFilter))
      : rows;
    return filtered.slice(0, 5);
  }, [dashboard?.mostEmptyBeds, hostelFilter]);

  const outstandingQuery = hostelFilter
    ? `hostel_id=${encodeURIComponent(hostelFilter)}&outstanding=1`
    : 'outstanding=1';

  const moneyCards = [
    { label: 'Rent collected', value: rs(viewTotals.rentCollected), hint: 'Payment receipts', to: `${basePath}/receivables` },
    { label: 'Food collected', value: rs(viewTotals.foodCollected), hint: 'Special orders', to: `${basePath}/special-orders` },
    { label: 'Total collected', value: rs(viewTotals.totalCollected), hint: 'Rent + food', to: null },
  ];

  const opsCards = [
    { label: 'Hostels', value: hostelFilter ? 1 : (dashboard?.hostels ?? hostels.length), to: `${basePath}/hostels` },
    { label: 'Residents', value: viewTotals.residents, to: `${basePath}/residents` },
    { label: 'Pending dues', value: viewTotals.pendingCount, to: `${basePath}/outstanding?${outstandingQuery}` },
    { label: 'Due amount', value: rs(viewTotals.pendingTotal), to: `${basePath}/outstanding?${outstandingQuery}` },
  ];

  const hostelOptions = useMemo(() => {
    if (allByHostel.length) {
      return allByHostel.map((h) => ({ id: h.hostel_id, name: h.hostel_name }));
    }
    return (hostels || []).map((h) => ({ id: h.id, name: h.hostel_name }));
  }, [allByHostel, hostels]);

  const scopeLabel = hostelFilter ? 'Selected hostel' : 'All hostels';

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hostel Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {scopeLabel} · collections, food and bed utilization
          </p>
        </div>
        <label className="text-sm">
          <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Filter by hostel
          </span>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[13rem] bg-white"
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
          >
            <option value="">All hostels</option>
            {hostelOptions.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {moneyCards.map((c) => {
          const className = 'bg-white border border-gray-200 rounded-xl px-4 py-3.5 shadow-sm hover:border-red-300 block';
          const inner = (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{c.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.hint}</p>
            </>
          );
          return c.to
            ? <Link key={c.label} to={c.to} className={className}>{inner}</Link>
            : <div key={c.label} className={className}>{inner}</div>;
        })}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {opsCards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:border-red-300"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{c.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Most sold food · Top 5</h2>
            <Link to={`${basePath}/special-orders`} className="text-xs font-semibold text-red-700 hover:underline">
              View orders
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className={th}>#</th>
                <th className={th}>Item</th>
                <th className={`${th} text-right`}>Qty</th>
                <th className={`${th} text-right`}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topFoodItems.map((item) => (
                <tr key={`${item.rank}-${item.item_name}`} className="border-t border-gray-100">
                  <td className={`${td} text-gray-500`}>{item.rank}</td>
                  <td className={`${td} font-medium text-gray-900 truncate max-w-[10rem]`}>{item.item_name}</td>
                  <td className={`${td} text-right`}>{Number(item.quantity_sold).toLocaleString('en-IN')}</td>
                  <td className={`${td} text-right text-green-700 font-medium`}>{rs(item.revenue)}</td>
                </tr>
              ))}
              {topFoodItems.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No special orders yet</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Most utilized beds</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className={th}>Hostel</th>
                <th className={`${th} text-right`}>Occupied</th>
                <th className={`${th} text-right`}>Usage</th>
              </tr>
            </thead>
            <tbody>
              {mostUtilizedBeds.map((row) => (
                <tr key={`util-${row.hostel_id}`} className="border-t border-gray-100">
                  <td className={`${td} font-medium text-gray-900 truncate max-w-[9rem]`}>{row.hostel_name}</td>
                  <td className={`${td} text-right`}>{row.occupiedBeds}/{row.totalBeds}</td>
                  <td className={`${td} text-right font-semibold text-green-700`}>{row.utilizationPct}%</td>
                </tr>
              ))}
              {mostUtilizedBeds.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No bed data</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Most empty beds</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className={th}>Hostel</th>
                <th className={`${th} text-right`}>Vacant</th>
                <th className={`${th} text-right`}>Usage</th>
              </tr>
            </thead>
            <tbody>
              {mostEmptyBeds.map((row) => (
                <tr key={`empty-${row.hostel_id}`} className="border-t border-gray-100">
                  <td className={`${td} font-medium text-gray-900 truncate max-w-[9rem]`}>{row.hostel_name}</td>
                  <td className={`${td} text-right font-semibold text-amber-700`}>{row.vacantBeds}/{row.totalBeds}</td>
                  <td className={`${td} text-right text-gray-600`}>{row.utilizationPct}%</td>
                </tr>
              ))}
              {mostEmptyBeds.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">No bed data</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Money collected (hostel-wise)</h2>
            <p className="text-xs text-gray-500">Rent from receipts · food from special orders</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className={th}>Hostel</th>
                  <th className={`${th} text-right`}>Rent</th>
                  <th className={`${th} text-right`}>Food</th>
                  <th className={`${th} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody>
                {byHostel.map((row) => (
                  <tr key={`coll-${row.hostel_id}`} className="border-t border-gray-100 hover:bg-gray-50/80">
                    <td className={`${td} font-medium text-gray-900 truncate max-w-[11rem]`}>{row.hostel_name}</td>
                    <td className={`${td} text-right text-green-700`}>{rs(row.rentCollected)}</td>
                    <td className={`${td} text-right text-green-700`}>{rs(row.foodCollected)}</td>
                    <td className={`${td} text-right font-semibold text-gray-900`}>{rs(row.totalCollected)}</td>
                  </tr>
                ))}
                {byHostel.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      No hostels yet. <Link to={`${basePath}/hostels`} className="text-red-700 font-semibold underline">Add a hostel</Link>
                    </td>
                  </tr>
                )}
              </tbody>
              {byHostel.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className={`${td} font-bold text-gray-900`}>Total</td>
                    <td className={`${td} text-right font-bold text-green-800`}>{rs(viewTotals.rentCollected)}</td>
                    <td className={`${td} text-right font-bold text-green-800`}>{rs(viewTotals.foodCollected)}</td>
                    <td className={`${td} text-right font-bold text-gray-900`}>{rs(viewTotals.totalCollected)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Hostel-wise dues summary</h2>
              <p className="text-xs text-gray-500">Click pending count to open the outstanding list</p>
            </div>
            <Link
              to={`${basePath}/outstanding?${outstandingQuery}`}
              className="text-xs font-semibold text-red-700 border border-red-200 bg-red-50 px-2.5 py-1.5 rounded-lg hover:bg-red-100"
            >
              {hostelFilter ? 'Hostel dues' : 'All pending dues'}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className={th}>Hostel</th>
                  <th className={`${th} text-right`}>Residents</th>
                  <th className={`${th} text-right`}>Total</th>
                  <th className={`${th} text-right`}>Paid</th>
                  <th className={`${th} text-right`}>Due</th>
                  <th className={`${th} text-right`}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {byHostel.map((row) => (
                  <tr key={row.hostel_id} className="border-t border-gray-100 hover:bg-gray-50/80">
                    <td className={`${td} font-medium text-gray-900 truncate max-w-[9rem]`}>{row.hostel_name}</td>
                    <td className={`${td} text-right`}>{row.residents}</td>
                    <td className={`${td} text-right`}>{rs(row.amountDue)}</td>
                    <td className={`${td} text-right text-green-700`}>{rs(row.amountPaid)}</td>
                    <td className={`${td} text-right font-semibold text-red-700`}>{rs(row.pendingTotal)}</td>
                    <td className={`${td} text-right`}>
                      <Link
                        to={`${basePath}/outstanding?hostel_id=${encodeURIComponent(row.hostel_id)}&outstanding=1`}
                        className="inline-flex min-w-[2.25rem] justify-center px-2 py-1 rounded-lg text-sm font-semibold text-red-800 bg-red-50 border border-red-200 hover:bg-red-100"
                        title="View outstanding list"
                      >
                        {row.pendingCount}
                      </Link>
                    </td>
                  </tr>
                ))}
                {byHostel.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No hostels yet</td>
                  </tr>
                )}
              </tbody>
              {byHostel.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className={`${td} font-bold text-gray-900`}>Total</td>
                    <td className={`${td} text-right font-bold text-gray-900`}>{viewTotals.residents}</td>
                    <td className={`${td} text-right font-bold text-gray-900`}>{rs(viewTotals.amountDue)}</td>
                    <td className={`${td} text-right font-bold text-green-800`}>{rs(viewTotals.amountPaid)}</td>
                    <td className={`${td} text-right font-bold text-red-800`}>{rs(viewTotals.pendingTotal)}</td>
                    <td className={`${td} text-right`}>
                      <Link
                        to={`${basePath}/outstanding?${outstandingQuery}`}
                        className="inline-flex min-w-[2.25rem] justify-center px-2 py-1 rounded-lg text-sm font-bold text-red-900 bg-red-100 border border-red-200 hover:bg-red-200"
                      >
                        {viewTotals.pendingCount}
                      </Link>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HostelManagementDashboard;
