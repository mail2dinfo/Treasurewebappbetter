import React from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import {
    FiHome,
    FiTrendingUp,
    FiTrendingDown,
    FiBarChart2,
    FiCreditCard,
    FiLogOut,
    FiMenu,
    FiChevronDown,
} from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';
import { getLoggedInRoleLabel } from '../../utils/roleLabels';

const formatDisplayName = (value) => String(value || '')
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

const navLinkClass = (active) =>
    `flex flex-shrink-0 items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium ${
        active ? 'bg-white/20 text-white' : 'text-white hover:bg-white/10'
    }`;

const ACCOUNTANT_HOME = '/chit-fund/accountant/home';

const navItems = [
    { path: ACCOUNTANT_HOME, label: 'Home', icon: FiHome },
    { path: '/chit-fund/accountant/receivables', label: 'Receivables', icon: FiTrendingUp },
    { path: '/chit-fund/accountant/payables', label: 'Payables', icon: FiTrendingDown },
    { path: '/chit-fund/accountant/dashboard', label: 'Dashboard', icon: FiBarChart2 },
    { path: '/chit-fund/accountant/ledger', label: 'Ledger', icon: FiCreditCard },
];

const ChitFundAccountantNavbar = () => {
    const location = useLocation();
    const history = useHistory();
    const { user, logout, userRole } = useUserContext();
    const platform = usePlatformAccess();
    const userDetails = user?.results || {};
    const displayName = formatDisplayName(
        userDetails.firstname || userDetails.name || 'Accountant'
    );
    const roleLabel = getLoggedInRoleLabel({
        platform,
        userRole,
        userAccounts: userDetails.userAccounts,
        pathname: location.pathname,
    });

    const isActive = (path) => {
        if (path === ACCOUNTANT_HOME) {
            return location.pathname === path
                || location.pathname === '/chit-fund/accountant'
                || location.pathname === '/chit-fund/accountant/';
        }
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const handleLogout = () => {
        platform?.clearActiveContext?.();
        logout();
        history.push('/login');
    };

    return (
        <nav className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <MyTreasureBrand
                        to={ACCOUNTANT_HOME}
                        subtitle="Chit Fund Accountant"
                        inverse
                    />

                    <div className="flex items-center gap-1 sm:gap-2">
                        <FinanceHubNavButton
                            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10"
                            iconClassName="w-4 h-4"
                        />
                        <div className="hidden md:block text-right px-2 border-l border-white/30">
                            <p className="text-sm font-semibold text-white">Hi {displayName}</p>
                            <p className="text-xs text-red-100">Logged in as {roleLabel}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="p-2 text-white hover:bg-white/10 rounded-lg"
                            aria-label="Logout"
                        >
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="hidden md:flex items-center flex-wrap gap-1 border-t border-white/20 py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={navLinkClass(isActive(item.path))}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <details className="md:hidden border-t border-white/20">
                    <summary className="list-none cursor-pointer flex items-center justify-between py-3 text-sm font-semibold text-white">
                        <span className="flex items-center gap-2">
                            <FiMenu className="w-5 h-5" />
                            Menu
                        </span>
                        <FiChevronDown className="w-4 h-4" />
                    </summary>
                    <div className="grid grid-cols-2 gap-2 pb-3">
                        <div className="col-span-2 px-1 pb-1">
                            <p className="text-sm font-semibold text-white">Hi {displayName}</p>
                            <p className="text-xs text-red-100">Logged in as {roleLabel}</p>
                        </div>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={`mobile-${item.path}`}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                                        isActive(item.path)
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </details>
            </div>
        </nav>
    );
};

export default ChitFundAccountantNavbar;
