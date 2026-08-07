import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { fetchSuperAdminApi } from '../utils/superAdminApi';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import SuperAdminShell from '../components/superAdmin/SuperAdminShell';
import { SuperAdminKpiCard, SuperAdminPanel } from '../components/superAdmin/SuperAdminDashboardCards';
import Loading from '../components/Loading';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const formatDate = (value) => {
  if (!value) return '—';
  const raw = String(value).slice(0, 10);
  const d = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const SuperAdminUnpaidUsers = () => {
  const history = useHistory();
  const { user } = useUserContext();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSuperAdminApi(
        '/super-admin/analytics/unpaid-users',
        user?.results?.token
      );
      setReport(data.data);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.results?.token]);

  useEffect(() => {
    if (!isSuperAdminUser(user)) {
      history.replace('/login');
      return;
    }
    fetchReport();
  }, [user, history, fetchReport]);

  const unpaidDues = useMemo(() => report?.unpaid_dues || [], [report?.unpaid_dues]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return unpaidDues;
    return unpaidDues.filter((row) =>
      [row.display_name, row.phone, row.email, row.app_name, row.app_code, row.month_label]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [unpaidDues, searchQuery]);

  const filteredTotal = useMemo(
    () => filteredRows.reduce((sum, row) => sum + Number(row.unpaid_amount || 0), 0),
    [filteredRows]
  );

  const uniqueUsers = useMemo(() => {
    const ids = new Set(filteredRows.map((row) => row.user_id).filter(Boolean));
    return ids.size;
  }, [filteredRows]);

  const refreshButton = (
    <button
      type="button"
      onClick={fetchReport}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
    >
      <FiRefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      Refresh
    </button>
  );

  return (
    <SuperAdminShell
      activeId="unpaid-users"
      title="Unpaid Users"
      subtitle="Users with pending app subscription billing"
      actions={refreshButton}
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SuperAdminKpiCard
            icon={FiUsers}
            label="Users with dues"
            value={uniqueUsers}
            hint="Distinct customers"
            accent="red"
          />
          <SuperAdminKpiCard
            icon={FiAlertCircle}
            label="Unpaid cycles"
            value={filteredRows.length}
            hint="Pending / unpaid billing rows"
            accent="amber"
          />
          <SuperAdminKpiCard
            icon={FiAlertCircle}
            label="Amount yet to pay"
            value={rs(filteredTotal)}
            hint="Sum of filtered list"
            accent="slate"
          />
        </section>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loading size="lg" />
          </div>
        ) : error ? (
          <SuperAdminPanel title="Unable to load unpaid users">
            <p className="text-sm text-red-600">{error}</p>
          </SuperAdminPanel>
        ) : (
          <SuperAdminPanel
            flush
            title="Amount yet to pay"
            description="Username with phone · App · Month · Amount"
          >
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <div className="relative max-w-md">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user, phone, app, month..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            {filteredRows.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">No unpaid users found.</p>
            ) : (
              <>
                <div className="divide-y divide-slate-100 md:hidden">
                  {filteredRows.map((row) => (
                    <div
                      key={row.payment_id || `${row.user_id}-${row.app_code}-${row.cycle_start_date}`}
                      className="px-4 py-3 sm:px-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium capitalize text-slate-900">
                            {row.display_name || '—'}
                          </p>
                          <p className="truncate text-xs text-slate-500">{row.phone || '—'}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-700">
                            {row.app_name || row.app_code || '—'}
                            {' · '}
                            {row.month_label || formatDate(row.cycle_start_date)}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-red-700">
                          {rs(row.unpaid_amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Username
                        </th>
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Phone
                        </th>
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          App
                        </th>
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Month
                        </th>
                        <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Amount yet to pay
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRows.map((row) => (
                        <tr
                          key={row.payment_id || `${row.user_id}-${row.app_code}-${row.cycle_start_date}`}
                          className="hover:bg-slate-50/80"
                        >
                          <td className="px-6 py-3.5 font-medium capitalize text-slate-900">
                            {row.display_name || '—'}
                          </td>
                          <td className="px-6 py-3.5 tabular-nums text-slate-700">
                            {row.phone || '—'}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                              {row.app_name || row.app_code || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 whitespace-nowrap text-slate-700">
                            {row.month_label || formatDate(row.cycle_start_date)}
                          </td>
                          <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-red-700">
                            {rs(row.unpaid_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                        <td className="px-6 py-3" colSpan={4}>
                          Total yet to pay
                        </td>
                        <td className="px-6 py-3 text-right tabular-nums text-red-800">
                          {rs(filteredTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </SuperAdminPanel>
        )}
      </div>
    </SuperAdminShell>
  );
};

export default SuperAdminUnpaidUsers;
