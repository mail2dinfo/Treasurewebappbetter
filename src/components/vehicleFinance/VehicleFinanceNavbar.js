import React, { useState, useEffect, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import {
    FiLogOut,
    FiCreditCard,
    FiHome,
    FiUsers,
    FiDollarSign,
    FiBookOpen,
    FiCalendar,
    FiBarChart2,
    FiUserCheck,
} from 'react-icons/fi';
import { API_BASE_URL } from '../../utils/apiConfig';
import { downloadImage } from '../../utils/downloadImage';
import {
    getVehicleFinanceAppMenuItems,
    getVehicleFinanceBasePath,
} from './vehicleFinanceMenuItems';
import { useVfPermission } from './useVfPermission';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';
import { useBilling } from '../../context/billing_context';
import { getNavBillingBadge } from '../../utils/billingPaymentUtils';
import { getLoggedInRoleLabel } from '../../utils/roleLabels';
import { AppNavbarBurgerButton } from '../AppMobileSidebar';

const MENU_ICONS = {
    home: FiHome,
    subscribers: FiUsers,
    loans: FiDollarSign,
    ledger: FiBookOpen,
    daybook: FiCalendar,
    collections: FiCreditCard,
    reports: FiBarChart2,
    employees: FiUserCheck,
};

const BillingNavButton = ({ billingPath }) => {
    const history = useHistory();
    const { subscription, payments } = useBilling();
    const badge = getNavBillingBadge(subscription, payments);

    if (!billingPath) return null;

    return (
        <button
            type="button"
            onClick={() => history.push(billingPath)}
            className={`${navButtonClass} relative`}
        >
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

const navButtonClass =
    'flex items-center px-3 py-1.5 text-sm font-medium text-white hover:text-red-100 hover:bg-white/10 rounded-lg transition-colors';

const capitalizeName = (value) => {
    const name = String(value || '').trim();
    if (!name) return 'User';
    return name.charAt(0).toUpperCase() + name.slice(1);
};

const VehicleFinanceNavbar = () => {
    const history = useHistory();
    const location = useLocation();
    const { user, logout, userRole } = useUserContext();
    const platform = usePlatformAccess();
    const { canAccess, canAccessModule, canAccessAny } = useVfPermission();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const [image] = useState('');
    const [previewUrl, setPreviewUrl] = useState('https://i.imgur.com/ndu6pfe.png');

    const basePath = getVehicleFinanceBasePath(location.pathname);
    const dashboardPath = `${basePath}/dashboard`;
    const showBilling = basePath === '/vehicle-finance/user';
    const billingPath = showBilling ? `${basePath}/billing` : null;
    const menuItems = useMemo(() => {
        const all = getVehicleFinanceAppMenuItems(basePath);
        return all.filter((item) => {
            if (item.id === 'home') {
                return canAccessAny(item.requiredAny);
            }
            if (item.id === 'daybook') {
                return canAccessModule('ledger')
                    && (canAccess('vf_ledger_view_daybook') || canAccess('vf_ledger'));
            }
            if (item.moduleGate) {
                return canAccessModule(item.moduleGate);
            }
            return canAccessAny(item.requiredAny);
        });
    }, [basePath, canAccess, canAccessAny, canAccessModule]);
    const displayName = capitalizeName(
        user?.results?.firstname
        || user?.results?.userDetail?.userName
        || user?.results?.name
        || 'User'
    );
    const roleLabel = getLoggedInRoleLabel({
        platform,
        userRole,
        userAccounts: user?.results?.userAccounts,
        pathname: location.pathname,
    });

    const isItemActive = (item) => {
        const current = location.pathname || '';
        const search = new URLSearchParams(location.search || '');
        const tab = search.get('tab');

        if (item.id === 'home') {
            return (
                current === basePath
                || current === `${basePath}/`
                || current === `${basePath}/dashboard`
            );
        }
        if (item.id === 'daybook') {
            return current === `${basePath}/ledger` && tab === 'daybook';
        }
        if (item.id === 'ledger') {
            return current === `${basePath}/ledger` && tab !== 'daybook';
        }
        const itemPath = String(item.path || '').split('?')[0];
        if (current === itemPath) return true;
        return current.startsWith(`${itemPath}/`);
    };

    useEffect(() => {
        if (user) {
            fetchImage();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const getImageSrc = (userImage) => {
        if (!userImage) return 'default-avatar.png';
        return userImage.startsWith('data:image/') || userImage.startsWith('http')
            ? userImage
            : `${API_BASE_URL}/uploads/${userImage}`;
    };

    const fetchImage = async () => {
        try {
            if (user?.results?.userDetail?.user_image_s3_image) {
                setPreviewUrl(user.results.userDetail.user_image_s3_image);
            } else if (user?.results?.user_image_s3_image) {
                setPreviewUrl(user.results.user_image_s3_image);
            } else if (user?.results?.userDetail?.userImage) {
                const imageUrl = getImageSrc(user.results.userDetail.userImage);
                const downloadedImage = await downloadImage(imageUrl);
                setPreviewUrl(downloadedImage || imageUrl);
            } else if (user?.results?.user_image) {
                const imageUrl = getImageSrc(user.results.user_image);
                const downloadedImage = await downloadImage(imageUrl);
                setPreviewUrl(downloadedImage || imageUrl);
            }
        } catch {
            setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
        }
    };

    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    const avatarTooltip = (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsTooltipVisible(!isTooltipVisible)}
                onBlur={() => setTimeout(() => setIsTooltipVisible(false), 150)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/50 hover:border-white transition-colors"
                aria-label={`${displayName}, ${roleLabel}`}
            >
                <img
                    src={image || previewUrl}
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
                        <p className="text-sm font-semibold text-gray-900">
                            Hi {displayName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Logged in as {roleLabel}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                        <FiLogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 sticky top-0 z-50 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">
                    <MyTreasureBrand to={dashboardPath} subtitle="Vehicle Finance" inverse />

                    {/* Desktop nav actions */}
                    <div className="hidden lg:flex items-center space-x-2 sm:space-x-3">
                        <FinanceHubNavButton className={navButtonClass} />
                        {showBilling && <BillingNavButton billingPath={billingPath} />}
                        <div className="text-right px-2 border-l border-white/30">
                            <p className="text-sm font-semibold text-white truncate max-w-[10rem]">
                                Hi {displayName}
                            </p>
                            <p className="text-xs text-red-100">Logged in as {roleLabel}</p>
                        </div>
                        {avatarTooltip}
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
                                    src={image || previewUrl}
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
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                                    >
                                        <FiLogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                        <AppNavbarBurgerButton
                            brandTo={dashboardPath}
                            brandSubtitle="Vehicle Finance"
                            items={billingPath ? [...menuItems, { id: 'billing', label: 'Billing', path: billingPath, icon: '🧾' }] : menuItems}
                            isItemActive={isItemActive}
                            icons={MENU_ICONS}
                            DefaultIcon={FiDollarSign}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default VehicleFinanceNavbar;
