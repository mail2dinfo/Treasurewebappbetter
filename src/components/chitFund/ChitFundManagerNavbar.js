import React from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { FiChevronDown, FiFileText, FiHome, FiUsers, FiLayers, FiLogOut, FiMapPin, FiMenu, FiPackage, FiTrendingDown, FiTrendingUp, FiUserPlus } from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { CHIT_NAV_ANY } from '../../utils/chitPermissionCatalog';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';
import { getLoggedInRoleLabel } from '../../utils/roleLabels';

const formatDisplayName = (value) => String(value || '')
    .trim()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

const ChitFundManagerNavbar = () => {
    const location = useLocation();
    const history = useHistory();
    const { user, logout, userRole } = useUserContext();
    const platform = usePlatformAccess();
    const userDetails = user?.results || {};
    const managerName = formatDisplayName(userDetails.firstname || userDetails.name || 'Manager');
    const roleLabel = getLoggedInRoleLabel({
        platform,
        userRole,
        userAccounts: user?.results?.userAccounts,
        pathname: location.pathname,
    });
    const enforceAccess = platform?.isAvailable
        && !platform.isOwner
        && platform.activeContext?.appCode === 'CHIT_FUND'
        && platform.activeContext?.roleCode === 'MANAGER';
    const canAccessAny = (featureKeys) => !enforceAccess || platform.hasAnyPermission(featureKeys);

    const isActive = (path) => {
        return location.pathname === path
            || (path.endsWith('/groups') && location.pathname.startsWith(`${path}/`));
    };

    const navItems = [
        { path: '/chit-fund/manager/home', label: 'Home', icon: FiHome, requiredFeatures: CHIT_NAV_ANY.home },
        { path: '/chit-fund/manager/groups', label: 'Groups', icon: FiLayers, requiredFeatures: CHIT_NAV_ANY.groups },
        { path: '/chit-fund/manager/subscribers', label: 'Subscribers', icon: FiUsers, requiredFeatures: CHIT_NAV_ANY.subscribers },
        { path: '/chit-fund/manager/receivables', label: 'Receivables', icon: FiTrendingUp, requiredFeatures: CHIT_NAV_ANY.receivables },
        { path: '/chit-fund/manager/payables', label: 'Payables', icon: FiTrendingDown, requiredFeatures: CHIT_NAV_ANY.payables },
        { path: '/chit-fund/manager/areas', label: 'Area', icon: FiMapPin, requiredFeatures: CHIT_NAV_ANY.areas },
        { path: '/chit-fund/manager/products', label: 'Products', icon: FiPackage, requiredFeatures: CHIT_NAV_ANY.products },
        { path: '/chit-fund/manager/employees', label: 'Employee', icon: FiUserPlus, requiredFeatures: CHIT_NAV_ANY.employees },
    ].filter((item) => canAccessAny(item.requiredFeatures));
    const canViewAreaReport = canAccessAny(CHIT_NAV_ANY.reportAreaWise);
    const canViewSubscriberReport = canAccessAny(CHIT_NAV_ANY.reportSubscriberOutstanding);
    const firstReportPath = canViewAreaReport
        ? '/chit-fund/manager/reports/area-wise'
        : (canViewSubscriberReport ? '/chit-fund/manager/reports/subscriber-outstanding' : null);
    const homePath = canAccessAny(CHIT_NAV_ANY.home)
        ? '/chit-fund/manager/home'
        : navItems[0]?.path
            || firstReportPath
            || '/app-selection';

    const handleLogout = () => {
        platform?.clearActiveContext();
        logout();
        history.push('/login');
    };

    return (
        <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-3 min-w-0">
                        <MyTreasureBrand to={homePath} subtitle="Chit Fund Manager" />
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <FinanceHubNavButton
                            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50"
                            iconClassName="w-4 h-4"
                        />
                        <div className="hidden md:block text-right px-2 border-l border-gray-200">
                            <p className="text-sm font-semibold text-gray-800">Hi {managerName}</p>
                            <p className="text-xs text-gray-500">Logged in as {roleLabel}</p>
                        </div>
                        <button type="button" onClick={handleLogout} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg" aria-label="Logout">
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="hidden md:flex items-center flex-wrap gap-1 border-t border-gray-100 py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex flex-shrink-0 items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium ${isActive(item.path)
                                    ? 'bg-red-100 text-red-700'
                                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                    {(canViewAreaReport || canViewSubscriberReport) && (
                        <details className="relative group">
                            <summary className={`list-none cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium ${
                                location.pathname.startsWith('/chit-fund/manager/reports')
                                    ? 'bg-red-100 text-red-700'
                                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                            }`}>
                                <FiFileText className="w-4 h-4" />
                                <span>Reports</span>
                                <FiChevronDown className="w-3.5 h-3.5" />
                            </summary>
                            <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
                                {canViewAreaReport && (
                                    <Link
                                        to="/chit-fund/manager/reports/area-wise"
                                        className="block px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
                                    >
                                        Area-wise Reports
                                    </Link>
                                )}
                                {canViewSubscriberReport && (
                                    <Link
                                        to="/chit-fund/manager/reports/subscriber-outstanding"
                                        className={`block px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 ${canViewAreaReport ? 'border-t border-gray-100' : ''}`}
                                    >
                                        Subscriber-wise Outstanding Reports
                                    </Link>
                                )}
                            </div>
                        </details>
                    )}
                </div>

                <details className="md:hidden border-t border-gray-100">
                    <summary className="list-none cursor-pointer flex items-center justify-between py-3 text-sm font-semibold text-gray-700">
                        <span className="flex items-center gap-2">
                            <FiMenu className="w-5 h-5 text-red-600" />
                            Menu
                        </span>
                        <FiChevronDown className="w-4 h-4" />
                    </summary>
                    <div className="grid grid-cols-2 gap-2 pb-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={`mobile-${item.path}`}
                                    to={item.path}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                                        isActive(item.path)
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-gray-50 text-gray-700 hover:bg-red-50 hover:text-red-700'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                        {(canViewAreaReport || canViewSubscriberReport) && (
                            <div className="col-span-2 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden">
                                <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-800">
                                    <FiFileText className="w-4 h-4 text-red-600" />
                                    Reports
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-gray-100">
                                    {canViewAreaReport && (
                                        <Link
                                            to="/chit-fund/manager/reports/area-wise"
                                            className="px-4 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-700"
                                        >
                                            Area-wise Reports
                                        </Link>
                                    )}
                                    {canViewSubscriberReport && (
                                        <Link
                                            to="/chit-fund/manager/reports/subscriber-outstanding"
                                            className={`px-4 py-2.5 text-sm text-gray-600 hover:bg-red-50 hover:text-red-700 ${canViewAreaReport ? 'border-t sm:border-t-0 sm:border-l border-gray-100' : ''}`}
                                        >
                                            Subscriber Outstanding
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </details>
            </div>
        </nav>
    );
};

export default ChitFundManagerNavbar;
