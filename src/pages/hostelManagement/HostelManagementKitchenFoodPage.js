import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation, NavLink } from 'react-router-dom';
import { FiLogOut, FiCoffee, FiClipboard } from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import MyTreasureBrand from '../../components/MyTreasureBrand';
import FinanceHubNavButton from '../../components/FinanceHubNavButton';
import { getLoggedInRoleLabel } from '../../utils/roleLabels';
import { API_BASE_URL } from '../../utils/apiConfig';
import { downloadImage } from '../../utils/downloadImage';
import { AppNavbarBurgerButton } from '../../components/AppMobileSidebar';

const ALL_HOSTELS = 'ALL';

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
  const [hostelFilter, setHostelFilter] = useState(ALL_HOSTELS);
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

  const allHostels = orgFoodReport?.hostels || [];
  const endLabel = orgFoodReport?.end_date || '';

  // Keep filter valid if hostel list changes (select values are strings)
  useEffect(() => {
    if (hostelFilter === ALL_HOSTELS) return;
    if (!allHostels.some((h) => String(h.hostel_id) === String(hostelFilter))) {
      setHostelFilter(ALL_HOSTELS);
    }
  }, [allHostels, hostelFilter]);

  const filteredHostels = useMemo(() => {
    if (hostelFilter === ALL_HOSTELS) return allHostels;
    return allHostels.filter((h) => String(h.hostel_id) === String(hostelFilter));
  }, [allHostels, hostelFilter]);

  const selectedHostel = useMemo(
    () => allHostels.find((h) => String(h.hostel_id) === String(hostelFilter)) || null,
    [allHostels, hostelFilter]
  );

  const displayTotals = useMemo(() => {
    if (hostelFilter === ALL_HOSTELS) return orgFoodReport?.totals_by_date || [];
    const days = selectedHostel?.days || [];
    return [...days].sort((a, b) => String(a.meal_date).localeCompare(String(b.meal_date)));
  }, [hostelFilter, orgFoodReport, selectedHostel]);

  const totalsTitle = hostelFilter === ALL_HOSTELS
    ? 'All hostels · combined'
    : `${selectedHostel?.hostel_name || 'Hostel'} · totals`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Food Estimation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Breakfast / lunch / dinner counts — filter by hostel or view all combined.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-gray-500">Hostel</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm min-w-[180px] bg-white"
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
          >
            <option value={ALL_HOSTELS}>All hostels</option>
            {allHostels.map((h) => (
              <option key={h.hostel_id} value={h.hostel_id}>
                {h.hostel_name}
              </option>
            ))}
          </select>
          <label className="text-xs text-gray-500 ml-1">Week starting</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading estimates…</p>}

      {!loading && displayTotals.length > 0 && (
        <section className="bg-white border rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <FiCoffee className="text-red-700" />
            <h2 className="font-bold text-gray-900">{totalsTitle}</h2>
            <span className="text-xs text-gray-400">{startDate} → {endLabel}</span>
          </div>
          <div className="space-y-3">
            {displayTotals.map((day) => (
              <div key={day.meal_date} className="border rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  {day.weekday} · {day.meal_date}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
        {filteredHostels.map((hostel) => (
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

      {!loading && allHostels.length === 0 && (
        <p className="text-gray-500">No hostels found for this company.</p>
      )}
      {!loading && allHostels.length > 0 && filteredHostels.length === 0 && (
        <p className="text-gray-500">No data for the selected hostel this week.</p>
      )}
    </div>
  );
};

const KITCHEN_LINKS = [
  { to: '/hostel-management/kitchen/food-report', label: 'Food estimation', icon: FiCoffee },
  { to: '/hostel-management/kitchen/special-orders', label: 'Special orders', icon: FiClipboard },
];

const capitalizeName = (value) => {
  const name = String(value || '').trim();
  if (!name) return 'User';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const KitchenNavbar = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, logout, userRole } = useUserContext();
  const platform = usePlatformAccess();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('https://i.imgur.com/ndu6pfe.png');
  const kitchenBrandTo = '/hostel-management/kitchen/food-report';
  const kitchenItems = KITCHEN_LINKS.map((item) => ({
    id: item.to,
    label: item.label,
    path: item.to,
    Icon: item.icon,
  }));
  const kitchenIcons = Object.fromEntries(kitchenItems.map((i) => [i.id, i.Icon]));

  const displayName = capitalizeName(
    user?.results?.firstname || user?.results?.userDetail?.userName || user?.results?.name || 'User'
  );
  const roleLabel = getLoggedInRoleLabel({
    platform,
    userRole,
    userAccounts: user?.results?.userAccounts,
    pathname: location.pathname,
  });

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  useEffect(() => {
    const fetchImage = async () => {
      try {
        if (user?.results?.userDetail?.user_image_s3_image) {
          setPreviewUrl(user.results.userDetail.user_image_s3_image);
        } else if (user?.results?.user_image_s3_image) {
          setPreviewUrl(user.results.user_image_s3_image);
        } else if (user?.results?.userDetail?.userImage) {
          const imageUrl = user.results.userDetail.userImage.startsWith('http')
            ? user.results.userDetail.userImage
            : `${API_BASE_URL}/uploads/${user.results.userDetail.userImage}`;
          const downloadedImage = await downloadImage(imageUrl);
          setPreviewUrl(downloadedImage || imageUrl);
        }
      } catch {
        setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
      }
    };
    if (user) fetchImage();
  }, [user]);

  return (
    <div className="sticky top-0 z-50">
      <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <MyTreasureBrand
              to={kitchenBrandTo}
              subtitle="Hostel · Kitchen"
              inverse
            />

            {/* Desktop nav actions */}
            <div className="hidden lg:flex items-center space-x-2 sm:space-x-3">
              <FinanceHubNavButton className="flex items-center px-3 py-1.5 text-sm font-medium text-white hover:text-red-100 hover:bg-white/10 rounded-lg transition-colors" />
              <div className="text-right px-2 border-l border-white/30">
                <p className="text-sm font-semibold text-white truncate max-w-[10rem]">Hi {displayName}</p>
                <p className="text-xs text-red-100">Logged in as {roleLabel}</p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTooltipVisible(!isTooltipVisible)}
                  onBlur={() => setTimeout(() => setIsTooltipVisible(false), 150)}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 hover:border-white transition-colors"
                  aria-label={`${displayName}, ${roleLabel}`}
                >
                  <img
                    src={previewUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                    }}
                  />
                </button>
                {isTooltipVisible && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">Hi {displayName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Logged in as {roleLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center"
                    >
                      <FiLogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: avatar + burger (like Chit Fund) */}
            <div className="flex lg:hidden items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTooltipVisible(!isTooltipVisible)}
                  onBlur={() => setTimeout(() => setIsTooltipVisible(false), 150)}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50"
                  aria-label={`${displayName}, ${roleLabel}`}
                >
                  <img
                    src={previewUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                    }}
                  />
                </button>
                {isTooltipVisible && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">Hi {displayName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Logged in as {roleLabel}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center"
                    >
                      <FiLogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
              <AppNavbarBurgerButton
                brandTo={kitchenBrandTo}
                brandSubtitle="Hostel · Kitchen"
                items={kitchenItems}
                isItemActive={(item) => location.pathname.startsWith(item.path)}
                icons={kitchenIcons}
                DefaultIcon={FiCoffee}
              />
            </div>
          </div>
        </div>
      </header>
      <nav className="hidden lg:block bg-white border-b border-gray-200 shadow-sm" aria-label="Kitchen modules">
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
