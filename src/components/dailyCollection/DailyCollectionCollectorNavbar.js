import React, { useState } from 'react';
import { NavLink, useHistory, useLocation } from 'react-router-dom';
import { FiLogOut, FiHome, FiUsers, FiDollarSign } from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';
import { getLoggedInRoleLabel } from '../../utils/roleLabels';
import { AppNavbarBurgerButton } from '../AppMobileSidebar';

const DC_COLLECTOR_PATH = '/daily-collection/collector';

const navButtonClass =
    'flex items-center px-3 py-1.5 text-sm font-medium text-white hover:text-red-100 hover:bg-white/10 rounded-lg transition-colors';

const COLLECTOR_MENU_ITEMS = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: `${DC_COLLECTOR_PATH}/dashboard`,
        icon: FiHome,
        description: 'Collector overview',
    },
    {
        id: 'collections',
        label: 'Collections',
        path: `${DC_COLLECTOR_PATH}/collections`,
        icon: FiDollarSign,
        description: 'Collect receivables',
    },
    {
        id: 'customers',
        label: 'Customers',
        path: `${DC_COLLECTOR_PATH}/customers`,
        icon: FiUsers,
        description: 'Assigned customers',
    },
];

const MENU_ICONS = {
    dashboard: FiHome,
    collections: FiDollarSign,
    customers: FiUsers,
};

const capitalizeName = (value) => {
    const name = String(value || '').trim();
    if (!name) return 'Collector';
    return name.charAt(0).toUpperCase() + name.slice(1);
};

const DailyCollectionCollectorNavbar = () => {
    const history = useHistory();
    const location = useLocation();
    const { user, logout, userRole } = useUserContext();
    const platform = usePlatformAccess();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    const displayName = capitalizeName(
        user?.results?.firstname
        || user?.results?.userDetail?.userName
        || user?.results?.name
        || user?.firstname
        || 'Collector'
    );
    const roleLabel = getLoggedInRoleLabel({
        platform,
        userRole,
        userAccounts: user?.results?.userAccounts || user?.userAccounts,
        pathname: location.pathname,
    });

    const isItemActive = (item) => {
        const current = location.pathname || '';
        if (item.id === 'dashboard') {
            return (
                current === DC_COLLECTOR_PATH
                || current === `${DC_COLLECTOR_PATH}/`
                || current === `${DC_COLLECTOR_PATH}/dashboard`
            );
        }
        if (current === item.path) return true;
        return current.startsWith(`${item.path}/`);
    };

    const handleLogout = () => {
        platform?.clearActiveContext?.();
        logout();
        history.push('/login');
    };

    return (
        <>
            <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14">
                        <MyTreasureBrand
                            to={`${DC_COLLECTOR_PATH}/dashboard`}
                            subtitle="Daily Collection Collector"
                            inverse
                        />

                        <div className="hidden lg:flex items-center space-x-2 sm:space-x-3">
                            <FinanceHubNavButton className={navButtonClass} />
                            <div className="text-right px-2 border-l border-white/30">
                                <p className="text-sm font-semibold text-white truncate max-w-[10rem]">
                                    Hi {displayName}
                                </p>
                                <p className="text-xs text-red-100">Logged in as {roleLabel}</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleLogout}
                                className={navButtonClass}
                            >
                                <FiLogOut className="w-4 h-4 mr-1.5" />
                                <span>Logout</span>
                            </button>
                        </div>

                        <div className="flex lg:hidden items-center gap-2">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsTooltipVisible(!isTooltipVisible)}
                                    onBlur={() => setTimeout(() => setIsTooltipVisible(false), 150)}
                                    className="px-2 py-1 text-right"
                                    aria-label={`${displayName}, ${roleLabel}`}
                                >
                                    <p className="text-sm font-semibold text-white truncate max-w-[8rem]">
                                        Hi {displayName}
                                    </p>
                                    <p className="text-xs text-red-100">Logged in as {roleLabel}</p>
                                </button>
                                {isTooltipVisible && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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
                                brandTo={`${DC_COLLECTOR_PATH}/dashboard`}
                                brandSubtitle="Daily Collection Collector"
                                items={COLLECTOR_MENU_ITEMS}
                                isItemActive={isItemActive}
                                icons={MENU_ICONS}
                                DefaultIcon={FiHome}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <nav
                className="hidden lg:block bg-white border-b border-gray-200 sticky top-14 z-40 shadow-sm"
                aria-label="Daily Collection collector modules"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1 scrollbar-thin">
                        {COLLECTOR_MENU_ITEMS.map((item) => {
                            const Icon = item.icon;
                            const active = isItemActive(item);
                            return (
                                <NavLink
                                    key={item.id}
                                    to={item.path}
                                    title={item.description || item.label}
                                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-red-50 text-custom-red border border-red-100'
                                            : 'text-gray-600 border border-transparent hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    <Icon className="w-4 h-4 shrink-0" aria-hidden />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </nav>
        </>
    );
};

export default DailyCollectionCollectorNavbar;
