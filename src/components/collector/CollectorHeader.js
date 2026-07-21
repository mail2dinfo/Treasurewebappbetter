import React, { useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut, FiBarChart2, FiDollarSign, FiList } from 'react-icons/fi';
import { useCollector } from '../../context/CollectorProvider';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { useUserContext } from '../../context/user_context';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';
import { getLoggedInRoleLabel } from '../../utils/roleLabels';

const MAIN_LOGIN_PATH = '/login';

const resolveCollectorName = (user) => {
    const first = String(user?.firstname || '').trim();
    const last = String(user?.lastname || '').trim();
    const combined = `${first} ${last}`.trim();
    if (combined) return combined;
    return String(user?.name || user?.username || 'Collector').trim() || 'Collector';
};

const CollectorHeader = () => {
    const { user, logout } = useCollector();
    const { logout: logoutMainUser, userRole } = useUserContext();
    const platform = usePlatformAccess();
    const history = useHistory();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const enforceAccess = platform?.isAvailable
        && !platform.isOwner
        && platform.activeContext?.appCode === 'CHIT_FUND';
    const canAccess = (featureKey) => !enforceAccess || platform.hasPermission(featureKey);
    const displayName = resolveCollectorName(user);
    const roleLabel = getLoggedInRoleLabel({
        platform,
        userRole,
        userAccounts: user?.userAccounts || user?.results?.userAccounts,
        pathname: location.pathname,
    });

    const handleLogout = () => {
        platform?.clearActiveContext();
        logout();
        logoutMainUser();
        history.replace(MAIN_LOGIN_PATH);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white shadow-lg fixed w-full top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <MyTreasureBrand subtitle="Chit Fund Collector" inverse />

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        {canAccess('chit.collector.receivables') && <Link
                            to="/chit-fund/collector/receivables"
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                            <FiDollarSign className="h-4 w-4" />
                            <span>Receivables</span>
                        </Link>}
                        {canAccess('chit.collector.advances') && <Link
                            to="/chit-fund/collector/advance-history"
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                            <FiList className="h-4 w-4" />
                            <span>Advance History</span>
                        </Link>}
                        {canAccess('chit.collector.dashboard') && <Link
                            to="/chit-fund/collector/dashboard"
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                            <FiBarChart2 className="h-4 w-4" />
                            <span>Dashboard</span>
                        </Link>}
                    </nav>

                    {/* User Info and Logout */}
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <FinanceHubNavButton
                            className="flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium text-white hover:bg-red-700"
                            iconClassName="w-4 h-4"
                        />
                        <div className="text-right leading-tight">
                            <p className="text-sm font-semibold text-white">Hi {displayName}</p>
                            <p className="text-xs text-red-100">Logged in as {roleLabel}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                            <FiLogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="md:hidden p-2 rounded-md hover:bg-red-700"
                            aria-label="Logout"
                        >
                            <FiLogOut className="h-5 w-5" />
                        </button>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                type="button"
                                onClick={toggleMenu}
                                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                aria-label="Open menu"
                            >
                                {isMenuOpen ? (
                                    <FiX className="block h-6 w-6" />
                                ) : (
                                    <FiMenu className="block h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-red-700 rounded-md mt-2">
                            {canAccess('chit.collector.receivables') && <Link
                                to="/chit-fund/collector/receivables"
                                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <FiDollarSign className="h-4 w-4" />
                                <span>Receivables</span>
                            </Link>}
                            {canAccess('chit.collector.advances') && <Link
                                to="/chit-fund/collector/advance-history"
                                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <FiList className="h-4 w-4" />
                                <span>Advance History</span>
                            </Link>}
                            {canAccess('chit.collector.dashboard') && <Link
                                to="/chit-fund/collector/dashboard"
                                className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <FiBarChart2 className="h-4 w-4" />
                                <span>Dashboard</span>
                            </Link>}
                            <div className="border-t border-red-500 pt-2 mt-2">
                                <div className="px-3 py-2 text-sm text-red-100">
                                    <p className="font-semibold text-white">Hi {displayName}</p>
                                    <p className="text-xs">Logged in as {roleLabel}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-base font-medium hover:bg-red-600 transition-colors"
                                >
                                    <FiLogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default CollectorHeader;
