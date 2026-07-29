import React, { useEffect, useState } from 'react';
import { useHistory, useLocation, NavLink } from 'react-router-dom';
import { FiLogOut, FiCoffee, FiClipboard } from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import MyTreasureBrand from '../../components/MyTreasureBrand';
import FinanceHubNavButton from '../../components/FinanceHubNavButton';
import { getLoggedInRoleLabel } from '../../utils/roleLabels';

const toDate = (d) => d.toISOString().slice(0, 10);

const mondayOfWeek = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

const MealBlock = ({ label, count }) => (
  <div className="rounded-lg border bg-gray-50 px-3 py-2 text-center">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="text-2xl font-bold text-red-700 tabular-nums">{count || 0}</p>
  </div>
);

/**
 * Kitchen Staff prep view — weekly food estimates across all hostels.
 */
const HostelManagementKitchenFoodPage = () => {
  const { membershipId, orgFoodReport, fetchOrgFoodReport } = useHostelManagement();
  const [startDate, setStartDate] = useState(() => toDate(mondayOfWeek()));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!membershipId || !startDate) return undefined;
    const end = new Date(startDate);
    end.setDate(end.getDate() + 6);
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await fetchOrgFoodReport(membershipId, startDate, toDate(end));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [membershipId, startDate, fetchOrgFoodReport]);

  const hostels = orgFoodReport?.hostels || [];
  const totals = orgFoodReport?.totals_by_date || [];
  const endLabel = orgFoodReport?.end_date || '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Food Estimation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Totals across all hostels for breakfast / lunch / dinner — use this to prep for the week.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Week starting</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading estimates…</p>}

      {!loading && totals.length > 0 && (
        <section className="bg-white border rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FiCoffee className="text-red-700" />
            <h2 className="font-bold text-gray-900">All hostels · combined</h2>
            <span className="text-xs text-gray-400">{startDate} → {endLabel}</span>
          </div>
          <div className="space-y-3">
            {totals.map((day) => (
              <div key={day.meal_date} className="border rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  {day.weekday} · {day.meal_date}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <MealBlock label="Breakfast" count={day.breakfast?.count} />
                  <MealBlock label="Lunch" count={day.lunch?.count} />
                  <MealBlock label="Dinner" count={day.dinner?.count} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-4">
        {hostels.map((hostel) => (
          <section key={hostel.hostel_id} className="bg-white border rounded-xl p-4">
            <h2 className="font-bold text-lg text-gray-900 mb-3">{hostel.hostel_name}</h2>
            {(hostel.days || []).length === 0 ? (
              <p className="text-sm text-gray-400">No meal updates this week (default = not available).</p>
            ) : (
              <div className="space-y-3">
                {(hostel.days || []).map((day) => (
                  <div key={`${hostel.hostel_id}-${day.meal_date}`} className="border rounded-lg p-3 bg-gray-50/60">
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                      {day.weekday} · {day.meal_date}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {['breakfast', 'lunch', 'dinner'].map((meal) => (
                        <div key={meal} className="border rounded-lg p-3 bg-white">
                          <p className="text-xs font-semibold uppercase text-gray-500">{meal}</p>
                          <p className="text-2xl font-bold text-red-700">{day[meal]?.count || 0}</p>
                          <ul className="mt-2 text-xs text-gray-700 space-y-0.5 max-h-24 overflow-y-auto">
                            {(day[meal]?.residents || []).map((r) => (
                              <li key={r.id}>{r.name}</li>
                            ))}
                            {(day[meal]?.count || 0) === 0 && (
                              <li className="text-gray-400">None available</li>
                            )}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {!loading && hostels.length === 0 && (
        <p className="text-gray-500">No hostels found for this company.</p>
      )}
    </div>
  );
};

const KITCHEN_LINKS = [
  { to: '/hostel-management/kitchen/food-report', label: 'Food estimation', icon: FiCoffee },
  { to: '/hostel-management/kitchen/special-orders', label: 'Special orders', icon: FiClipboard },
];

const KitchenNavbar = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, logout, userRole } = useUserContext();
  const platform = usePlatformAccess();
  const displayName = String(
    user?.results?.firstname || user?.results?.userDetail?.userName || user?.results?.name || 'User'
  ).trim() || 'User';
  const roleLabel = getLoggedInRoleLabel({
    platform,
    userRole,
    userAccounts: user?.results?.userAccounts,
    pathname: location.pathname,
  });

  return (
    <div className="sticky top-0 z-50">
      <nav className="bg-[#d62828] text-white shadow">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <MyTreasureBrand className="text-white" />
            <span className="hidden sm:inline text-sm text-red-100 truncate">
              Kitchen · {displayName} · {roleLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FinanceHubNavButton />
            <button
              type="button"
              onClick={() => {
                logout();
                history.push('/login');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-white/10"
            >
              <FiLogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>
      <nav className="bg-white border-b border-gray-200 shadow-sm" aria-label="Kitchen modules">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto py-2">
          {KITCHEN_LINKS.map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? 'bg-red-50 text-red-800 border border-red-100'
                    : 'text-gray-600 border border-transparent hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export { KitchenNavbar };
export default HostelManagementKitchenFoodPage;
