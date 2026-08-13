import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
    FiLogOut,
    FiCreditCard,
    FiHome,
    FiTag,
} from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { useBilling } from '../../context/billing_context';
import { getNavBillingBadge } from '../../utils/billingPaymentUtils';
import { BILLING_PATHS } from '../../utils/billingAppCodes';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';
import { AppNavbarBurgerButton } from '../AppMobileSidebar';

const PF_BASE_PATH = '/personal-finance/user';

const MENU_ICONS = {
    home: FiHome,
    accounts: FiCreditCard,
    categories: FiTag,
    billing: FiCreditCard,
};

const getPersonalFinanceMenuItems = () => [
    {
        id: 'home',
        label: 'Dashboard',
        path: `${PF_BASE_PATH}/dashboard`,
        description: 'Income & expense overview',
    },
    {
        id: 'accounts',
        label: 'Accounts',
        path: `${PF_BASE_PATH}/accounts`,
        description: 'Cash & bank accounts',
    },
    {
        id: 'categories',
        label: 'Categories',
        path: `${PF_BASE_PATH}/categories`,
        description: 'Income & expense categories',
    },
];

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

const PersonalFinanceNavbar = () => {
    const history = useHistory();
    const location = useLocation();
    const { user, logout } = useUserContext();
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    const billingPath = BILLING_PATHS.PERSONAL_FINANCE;
    const dashboardPath = `${PF_BASE_PATH}/dashboard`;
    const menuItems = getPersonalFinanceMenuItems();

    const displayName = capitalizeName(
        user?.results?.firstname
        || user?.results?.userDetail?.userName
        || user?.results?.userDetail?.firstname
        || user?.results?.name
        || 'User'
    );

    const isItemActive = (item) => {
        const current = location.pathname || '';
        if (item.id === 'home') {
            return (
                current === PF_BASE_PATH
                || current === `${PF_BASE_PATH}/`
                || current === `${PF_BASE_PATH}/dashboard`
            );
        }
        if (current === item.path) return true;
        return current.startsWith(`${item.path}/`);
    };

    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    return (
        <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 sticky top-0 z-50 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">
                    <MyTreasureBrand
                        to={dashboardPath}
                        subtitle="Personal Finance"
                        inverse
                    />

                    {/* Desktop nav actions */}
                    <div className="hidden lg:flex items-center space-x-2 sm:space-x-3">
                        <FinanceHubNavButton className={navButtonClass} />
                        <BillingNavButton billingPath={billingPath} />
                        <div className="text-right px-2 border-l border-white/30">
                            <p className="text-sm font-semibold text-white truncate max-w-[10rem]">
                                Hi {displayName}
                            </p>
                            <p className="text-xs text-red-100">Personal Finance</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="p-2 text-white hover:bg-white/10 rounded-lg"
                            aria-label="Logout"
                            title="Logout"
                        >
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile: avatar + burger (same pattern as other apps) */}
                    <div className="flex lg:hidden items-center gap-2">
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsTooltipVisible(!isTooltipVisible)}
                                onBlur={() => setTimeout(() => setIsTooltipVisible(false), 150)}
                                className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50 bg-white/20 text-white text-xs font-semibold"
                                aria-label={`${displayName}, Personal Finance`}
                            >
                                {displayName.charAt(0).toUpperCase()}
                            </button>
                            {isTooltipVisible && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <p className="text-sm font-semibold text-gray-900">
                                            Hi {displayName}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Personal Finance
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
                        <AppNavbarBurgerButton
                            brandTo={dashboardPath}
                            brandSubtitle="Personal Finance"
                            items={[
                                ...menuItems,
                                { id: 'billing', label: 'Billing', path: billingPath },
                            ]}
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

export default PersonalFinanceNavbar;
