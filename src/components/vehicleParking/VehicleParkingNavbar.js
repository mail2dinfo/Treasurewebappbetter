import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { FiLogOut, FiCreditCard, FiTruck } from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { useBilling } from '../../context/billing_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { getNavBillingBadge } from '../../utils/billingPaymentUtils';
import { BILLING_PATHS } from '../../utils/billingAppCodes';
import { getLoggedInRoleLabel } from '../../utils/roleLabels';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';
import { AppNavbarBurgerButton } from '../AppMobileSidebar';
import { VP_BASE, VP_MENU } from './vpMenu';
import { useVpPermission } from './useVpPermission';

const navButtonClass =
    'flex items-center px-3 py-1.5 text-sm font-medium text-white hover:text-red-100 hover:bg-white/10 rounded-lg transition-colors';

const VP_ROLE_LABELS = {
    MANAGER: 'Parking Manager',
    COLLECTOR: 'Parking Staff',
    ACCOUNTANT: 'Accountant',
    USER: 'User',
    OWNER: 'User',
};

const VehicleParkingNavbar = () => {
    const history = useHistory();
    const location = useLocation();
    const { user, logout } = useUserContext();
    const platform = usePlatformAccess();
    const { subscription, payments, availablePlans } = useBilling();
    const { nav, roleCode } = useVpPermission();
    const menuItems = VP_MENU.filter((item) => nav[item.nav]);
    const [menuOpen, setMenuOpen] = useState(false);
    const billingPath = BILLING_PATHS.VEHICLE_PARKING;
    const badge = getNavBillingBadge(subscription, payments, availablePlans);
    const displayName = String(
        user?.results?.firstname || user?.results?.userDetail?.userName || 'User'
    ).trim() || 'User';
    const home = `${VP_BASE}/dashboard`;
    const roleLabel = VP_ROLE_LABELS[String(roleCode || '').toUpperCase()]
        || getLoggedInRoleLabel({
            platform,
            userRole: user?.results?.userRole || user?.results?.role,
            userAccounts: user?.results?.userAccounts,
            pathname: location.pathname,
        });

    const isItemActive = (item) => (location.pathname || '').startsWith(item.path);
    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    const userBlock = (
        <div className="text-right px-2 border-l border-white/30">
            <p className="text-sm font-semibold text-white truncate max-w-[10rem]">Hi {displayName}</p>
            <p className="text-xs text-red-100">Role {roleLabel}</p>
        </div>
    );

    return (
        <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 sticky top-0 z-50 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14 gap-3">
                    <MyTreasureBrand to={home} subtitle="Parking" inverse />
                    <div className="hidden lg:flex items-center space-x-2 sm:space-x-3">
                        <FinanceHubNavButton className={navButtonClass} />
                        <button type="button" onClick={() => history.push(billingPath)} className={`${navButtonClass} relative`}>
                            <FiCreditCard className="w-4 h-4 mr-1.5" />
                            Billing
                            {badge.status !== 'unknown' && (
                                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-white/20">{badge.message}</span>
                            )}
                        </button>
                        {userBlock}
                        <button type="button" onClick={handleLogout} className={`${navButtonClass}`} aria-label="Logout">
                            <FiLogOut className="w-4 h-4 mr-1.5" />
                            Logout
                        </button>
                    </div>
                    <div className="flex lg:hidden items-center gap-2">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((v) => !v)}
                                className="w-9 h-9 rounded-full bg-white/20 text-white text-xs font-semibold"
                                aria-label={`${displayName}, ${roleLabel}`}
                            >
                                {displayName.charAt(0).toUpperCase()}
                            </button>
                            {menuOpen ? (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <p className="text-sm font-semibold text-gray-900">Hi {displayName}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Role {roleLabel}</p>
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
                            ) : null}
                        </div>
                        <AppNavbarBurgerButton
                            brandTo={home}
                            brandSubtitle="Parking"
                            items={[...menuItems, { id: 'billing', label: 'Billing', path: billingPath }]}
                            isItemActive={isItemActive}
                            icons={{}}
                            DefaultIcon={FiTruck}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default VehicleParkingNavbar;
