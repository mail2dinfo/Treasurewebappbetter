import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FiAlertCircle, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { fetchSuperAdminApi } from '../utils/superAdminApi';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import SuperAdminShell from '../components/superAdmin/SuperAdminShell';
import { SuperAdminKpiCard, SuperAdminPanel } from '../components/superAdmin/SuperAdminDashboardCards';
import Loading from '../components/Loading';
import { BILLING_APP_CODES } from '../utils/billingAppCodes';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const formatAppLabel = (code) =>
  String(code || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const FALLBACK_APP_OPTIONS = Object.values(BILLING_APP_CODES).map((code) => ({
  code,
  label: formatAppLabel(code),
}));

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

const selectClassName =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100';

const SuperAdminUnpaidUsers = () => {
  const history = useHistory();
  const { user } = useUserContext();
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [appFilter, setAppFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

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

  const userOptions = useMemo(() => {
    const map = new Map();
    unpaidDues.forEach((row) => {
      if (!row.user_id || map.has(row.user_id)) return;
      map.set(row.user_id, {
        id: row.user_id,
        label: row.display_name || row.phone || row.user_id,
        phone: row.phone || '',
      });
    });
    return [...map.values()].sort((a, b) =>
      String(a.label).localeCompare(String(b.label), undefined, { sensitivity: 'base' })
    );
  }, [unpaidDues]);

  const appOptions = useMemo(() => {
    const map = new Map();
    // Full catalog first (API apps or local billing app codes)
    const catalog = Array.isArray(report?.apps) && report.apps.length
      ? report.apps
      : FALLBACK_APP_OPTIONS;
    catalog.forEach((app) => {
      const code = app.code || app.app_code;
      if (!code || map.has(code)) return;
      map.set(code, app.label || app.display_name || formatAppLabel(code));
    });
    // Keep any unexpected codes present in unpaid rows
    unpaidDues.forEach((row) => {
      const code = row.app_code;
      if (!code || map.has(code)) return;
      map.set(code, row.app_name || formatAppLabel(code));
    });
    return [...map.entries()]
      .map(([code, label]) => ({ code, label }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [report?.apps, unpaidDues]);

  const monthOptions = useMemo(() => {
    const map = new Map();
    unpaidDues.forEach((row) => {
      const sortKey = row.month_key || String(row.cycle_start_date || '').slice(0, 7);
      const label = row.month_label || formatDate(row.cycle_start_date);
      if (!sortKey || !label || label === '—' || map.has(sortKey)) return;
      map.set(sortKey, label);
    });
    return [...map.entries()]
      .map(([sortKey, label]) => ({ label, sortKey }))
      .sort((a, b) => String(b.sortKey).localeCompare(String(a.sortKey)));
  }, [unpaidDues]);

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return unpaidDues.filter((row) => {
      if (userFilter !== 'all' && row.user_id !== userFilter) return false;

      if (appFilter !== 'all') {
        const code = row.app_code || row.app_name;
        if (code !== appFilter) return false;
      }

      if (monthFilter !== 'all') {
        const rowKey = row.month_key || String(row.cycle_start_date || '').slice(0, 7);
        if (rowKey !== monthFilter) return false;
      }

      if (!query) return true;

      return [row.display_name, row.phone, row.app_name, row.app_code, row.month_label, row.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [unpaidDues, searchQuery, userFilter, appFilter, monthFilter]);

  const filteredTotal = useMemo(
    () => filteredRows.reduce((sum, row) => sum + Number(row.unpaid_amount || 0), 0),
    [filteredRows]
  );

  const uniqueUsers = useMemo(() => {
    const ids = new Set(filteredRows.map((row) => row.user_id).filter(Boolean));
    return ids.size;
  }, [filteredRows]);

  const hasActiveFilters =
    userFilter !== 'all' || appFilter !== 'all' || monthFilter !== 'all' || searchQuery.trim();

  const clearFilters = () => {
    setUserFilter('all');
    setAppFilter('all');
    setMonthFilter('all');
    setSearchQuery('');
  };

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
      subtitle="billing_payments status = unpaid or pending · User role only"
      actions={refreshButton}
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SuperAdminKpiCard
            icon={FiUsers}
            label="Users with dues"
            value={uniqueUsers}
            hint="Distinct User accounts"
            accent="red"
          />
          <SuperAdminKpiCard
            icon={FiAlertCircle}
            label="Unpaid cycles"
            value={filteredRows.length}
            hint="status = unpaid or pending"
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
            title="Unpaid users"
            description="User · Phone · App · Month · Amount · Status"
          >
            <div className="space-y-3 border-b border-slate-100 px-4 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    User
                  </label>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className={selectClassName}
                  >
                    <option value="all">All users</option>
                    {userOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                        {option.phone ? ` (${option.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    App
                  </label>
                  <select
                    value={appFilter}
                    onChange={(e) => setAppFilter(e.target.value)}
                    className={selectClassName}
                  >
                    <option value="all">All apps</option>
                    {appOptions.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Month
                  </label>
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className={selectClassName}
                  >
                    <option value="all">All months</option>
                    {monthOptions.map((option) => (
                      <option key={option.sortKey} value={option.sortKey}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Search
                  </label>
                  <div className="relative">
                    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Name, phone, app, status..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-100"
                    />
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
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
                            {' · '}
                            <span className="uppercase text-amber-700">{row.status || 'unpaid'}</span>
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
                          User
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
                          Amount
                        </th>
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Status
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
                          <td className="px-6 py-3.5">
                            <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold uppercase text-amber-800 ring-1 ring-amber-200">
                              {row.status || 'unpaid'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                        <td className="px-6 py-3" colSpan={4}>
                          Total amount
                        </td>
                        <td className="px-6 py-3 text-right tabular-nums text-red-800">
                          {rs(filteredTotal)}
                        </td>
                        <td className="px-6 py-3" />
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
