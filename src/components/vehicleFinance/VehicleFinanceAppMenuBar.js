import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    FiHome,
    FiUsers,
    FiDollarSign,
    FiBookOpen,
    FiCalendar,
    FiCreditCard,
    FiBarChart2,
    FiUserCheck,
} from 'react-icons/fi';
import {
    getVehicleFinanceAppMenuItems,
    getVehicleFinanceBasePath,
} from './vehicleFinanceMenuItems';
import { useVfPermission } from './useVfPermission';

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

/**
 * App-specific module bar for Vehicle Finance.
 * Shown under the main navbar on /vehicle-finance/{user|manager|collector}/*.
 */
const VehicleFinanceAppMenuBar = ({ basePath: basePathProp }) => {
    const location = useLocation();
    const { canAccess, canAccessModule, canAccessAny } = useVfPermission();
    const basePath = basePathProp || getVehicleFinanceBasePath(location.pathname);

    const items = useMemo(() => {
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

    if (!items.length) return null;

    return (
        <nav
            className="bg-white border-b border-gray-200 sticky top-14 z-40 shadow-sm"
            aria-label="Vehicle Finance modules"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1 scrollbar-thin">
                    {items.map((item) => {
                        const Icon = MENU_ICONS[item.id] || FiDollarSign;
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
    );
};

export default VehicleFinanceAppMenuBar;
