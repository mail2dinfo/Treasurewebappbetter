import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    FiHome,
    FiUsers,
    FiDollarSign,
    FiBookOpen,
    FiCreditCard,
    FiBarChart2,
} from 'react-icons/fi';
import {
    PL_BASE_PATH,
    getPersonalLoanAppMenuItems,
} from './personalLoanMenuItems';

const MENU_ICONS = {
    home: FiHome,
    subscribers: FiUsers,
    loans: FiDollarSign,
    ledger: FiBookOpen,
    collections: FiCreditCard,
    reports: FiBarChart2,
};

/**
 * App-specific module bar for Personal Loan.
 * Renders under the main navbar on /personal-loan/user/* routes.
 */
const PersonalLoanAppMenuBar = ({ basePath = PL_BASE_PATH }) => {
    const location = useLocation();
    const items = getPersonalLoanAppMenuItems(basePath);

    const isItemActive = (item) => {
        const current = location.pathname || '';
        if (item.id === 'home') {
            return (
                current === basePath
                || current === `${basePath}/`
                || current === `${basePath}/home`
                || current === `${basePath}/dashboard`
            );
        }
        if (current === item.path) return true;
        return current.startsWith(`${item.path}/`);
    };

    return (
        <nav
            className="bg-white border-b border-gray-200 sticky top-14 z-40 shadow-sm"
            aria-label="Personal Loan modules"
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

export default PersonalLoanAppMenuBar;
