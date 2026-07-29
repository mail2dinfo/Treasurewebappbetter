import React, { useState, useEffect, useMemo } from 'react';
import { useHistory, useLocation, NavLink } from 'react-router-dom';
import {
  FiHome,
  FiLogOut,
  FiDollarSign,
  FiCoffee,
  FiShoppingBag,
  FiClipboard,
  FiTarget,
  FiActivity,
} from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';
import { HM_RESIDENT_BASE_PATH } from './hostelManagementMenuItems';
import { API_BASE_URL } from '../../utils/apiConfig';
import { downloadImage } from '../../utils/downloadImage';
import { AppNavbarBurgerButton } from '../AppMobileSidebar';

const navButtonClass =
  'flex items-center px-3 py-1.5 text-sm font-medium text-white hover:text-red-100 hover:bg-white/10 rounded-lg transition-colors';

const capitalizeName = (value) => {
  const name = String(value || '').trim();
  if (!name) return 'Resident';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const RESIDENT_MENU = [
  { id: 'home', label: 'Home', path: `${HM_RESIDENT_BASE_PATH}/dashboard`, hash: '', Icon: FiHome },
  { id: 'dues', label: 'My dues', path: `${HM_RESIDENT_BASE_PATH}/dashboard#dues`, hash: 'dues', Icon: FiDollarSign },
  { id: 'meals', label: 'Meals', path: `${HM_RESIDENT_BASE_PATH}/dashboard#meals`, hash: 'meals', Icon: FiCoffee },
  { id: 'special-orders', label: 'Special orders', path: `${HM_RESIDENT_BASE_PATH}/special-orders`, Icon: FiClipboard },
  { id: 'order-food', label: 'Order food', path: `${HM_RESIDENT_BASE_PATH}/order-food`, Icon: FiShoppingBag },
  { id: 'turfs', label: 'Turfs', path: `${HM_RESIDENT_BASE_PATH}/turfs`, Icon: FiTarget },
  { id: 'shuttle-courts', label: 'Shuttle courts', path: `${HM_RESIDENT_BASE_PATH}/shuttle-courts`, Icon: FiActivity },
];

const MENU_ICONS = Object.fromEntries(RESIDENT_MENU.map((i) => [i.id, i.Icon]));

/** Top bar: Home + Finance Hub only (modules live in app menu). */
const HostelManagementResidentNavbar = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, logout } = useUserContext();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('https://i.imgur.com/ndu6pfe.png');
  const dashboardPath = `${HM_RESIDENT_BASE_PATH}/dashboard`;

  const displayName = capitalizeName(
    user?.results?.firstname || user?.results?.userDetail?.userName || user?.results?.name || 'Resident'
  );

  const menuItems = useMemo(
    () => RESIDENT_MENU.map((item) => ({
      id: item.id,
      label: item.label,
      path: item.path,
      onNavigate: item.hash
        ? () => {
          setTimeout(() => {
            document.getElementById(item.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 80);
        }
        : undefined,
    })),
    []
  );

  const isItemActive = (item) => {
    const path = location.pathname || '';
    const hash = (location.hash || '').replace('#', '');
    if (item.id === 'order-food') return path.includes('/order-food');
    if (item.id === 'special-orders') return path.includes('/special-orders');
    if (item.id === 'turfs') return path.includes('/turfs');
    if (item.id === 'shuttle-courts') return path.includes('/shuttle-courts');
    if (item.id === 'home') {
      return (path.endsWith('/resident') || path.includes('/dashboard')) && !hash;
    }
    const menuItem = RESIDENT_MENU.find((m) => m.id === item.id);
    if (menuItem?.hash) {
      return (path.includes('/dashboard') || path.endsWith('/resident')) && hash === menuItem.hash;
    }
    return false;
  };

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
    <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <MyTreasureBrand to={dashboardPath} subtitle="Hostel · Resident" inverse />

          {/* Desktop nav actions */}
          <div className="hidden lg:flex items-center space-x-2 sm:space-x-3">
            <button type="button" onClick={() => history.push(dashboardPath)} className={navButtonClass}>
              <FiHome className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <FinanceHubNavButton className={navButtonClass} />
            <div className="text-right px-2 border-l border-white/30">
              <p className="text-sm font-semibold text-white truncate max-w-[10rem]">Hi {displayName}</p>
              <p className="text-xs text-red-100">Logged in as Resident</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTooltipVisible(!isTooltipVisible)}
                onBlur={() => setTimeout(() => setIsTooltipVisible(false), 150)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 hover:border-white transition-colors"
                aria-label={`${displayName}, Resident`}
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
                    <p className="text-xs text-gray-500 mt-0.5">Logged in as Resident</p>
                  </div>
                  <NavLink
                    to="/app-selection"
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Finance Hub
                  </NavLink>
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
                aria-label={`${displayName}, Resident`}
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
                    <p className="text-xs text-gray-500 mt-0.5">Logged in as Resident</p>
                  </div>
                  <NavLink
                    to="/app-selection"
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Finance Hub
                  </NavLink>
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
              brandTo={dashboardPath}
              brandSubtitle="Hostel · Resident"
              items={menuItems}
              isItemActive={isItemActive}
              icons={MENU_ICONS}
              DefaultIcon={FiHome}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default HostelManagementResidentNavbar;
