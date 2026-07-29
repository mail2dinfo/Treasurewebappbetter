import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import {
  FiLogOut,
  FiCreditCard,
  FiHome,
  FiMapPin,
  FiGrid,
  FiUsers,
  FiLayers,
  FiDollarSign,
  FiClipboard,
  FiCheckCircle,
  FiCoffee,
  FiBookOpen,
  FiSettings,
} from 'react-icons/fi';
import { API_BASE_URL } from '../../utils/apiConfig';
import { downloadImage } from '../../utils/downloadImage';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';
import { useBilling } from '../../context/billing_context';
import { getNavBillingBadge } from '../../utils/billingPaymentUtils';
import { HM_BASE_PATH, getHostelManagementMenuItems } from './hostelManagementMenuItems';
import { useHmPermission } from './useHmPermission';
import { getLoggedInRoleLabel } from '../../utils/roleLabels';
import { AppNavbarBurgerButton } from '../AppMobileSidebar';

const MENU_ICONS = {
  dashboard: FiHome,
  hostels: FiMapPin,
  'floors-rooms': FiGrid,
  residents: FiUsers,
  'dues-deck': FiLayers,
  receivables: FiDollarSign,
  outstanding: FiClipboard,
  payments: FiCheckCircle,
  'food-report': FiCoffee,
  'special-orders': FiClipboard,
  ledger: FiBookOpen,
  adminsettings: FiSettings,
};

const navButtonClass =
  'flex items-center px-3 py-1.5 text-sm font-medium text-white hover:text-red-100 hover:bg-white/10 rounded-lg transition-colors';

const capitalizeName = (value) => {
  const name = String(value || '').trim();
  if (!name) return 'User';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const BillingNavButton = ({ billingPath }) => {
  const history = useHistory();
  const { subscription, payments } = useBilling();
  const badge = getNavBillingBadge(subscription, payments);
  if (!billingPath) return null;
  return (
    <button type="button" onClick={() => history.push(billingPath)} className={`${navButtonClass} relative`}>
      <FiCreditCard className="w-4 h-4 mr-1.5" />
      <span className="hidden sm:inline">Billing</span>
      {badge.status !== 'unknown' && (
        <span
          className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
            badge.color === 'red'
              ? 'bg-red-100 text-red-800'
              : badge.color === 'blue'
                ? 'bg-blue-100 text-blue-800'
                : badge.color === 'green'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
          }`}
        >
          {badge.message}
        </span>
      )}
    </button>
  );
};

const HostelManagementNavbar = () => {
  const history = useHistory();
  const location = useLocation();
  const { user, logout, userRole } = useUserContext();
  const platform = usePlatformAccess();
  const { nav, isOwner } = useHmPermission();
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('https://i.imgur.com/ndu6pfe.png');

  const dashboardPath = `${HM_BASE_PATH}/dashboard`;
  const billingPath = isOwner ? `${HM_BASE_PATH}/billing` : null;
  const menuItems = getHostelManagementMenuItems(HM_BASE_PATH).filter((item) => {
    if (item.id === 'billing') return false;
    if (!item.navKey) return isOwner;
    return Boolean(nav[item.navKey]);
  });
  const displayName = capitalizeName(
    user?.results?.firstname || user?.results?.userDetail?.userName || user?.results?.name || 'User'
  );
  const roleLabel = getLoggedInRoleLabel({
    platform,
    userRole,
    userAccounts: user?.results?.userAccounts,
    pathname: location.pathname,
  });

  const isItemActive = (item) => {
    const current = location.pathname || '';
    if (item.id === 'dashboard') {
      return (
        current === HM_BASE_PATH
        || current === `${HM_BASE_PATH}/`
        || current === `${HM_BASE_PATH}/dashboard`
      );
    }
    if (current === item.path) return true;
    return current.startsWith(`${item.path}/`);
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
          <MyTreasureBrand to={dashboardPath} subtitle="Hostel Management" inverse />

          {/* Desktop nav actions */}
          <div className="hidden lg:flex items-center space-x-2 sm:space-x-3">
            <FinanceHubNavButton className={navButtonClass} />
            {billingPath && <BillingNavButton billingPath={billingPath} />}
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
              brandTo={dashboardPath}
              brandSubtitle="Hostel Management"
              items={billingPath ? [...menuItems, { id: 'billing', label: 'Billing', path: billingPath, icon: '🧾' }] : menuItems}
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

export default HostelManagementNavbar;
