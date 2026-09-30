import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiBookOpen, FiBarChart2, FiCreditCard, FiDollarSign, FiSettings } from 'react-icons/fi';
import { DP_APP_MENU_IDS, DP_BASE_PATH, getDeepavaliAppMenuItems } from './deepavaliMenuItems';

const MENU_ICONS = {
    home: FiHome,
    subscribers: FiUsers,
    groups: FiDollarSign,
    collections: FiCreditCard,
    payables: FiDollarSign,
    adminsettings: FiSettings,
    ledger: FiBookOpen,
    reports: FiBarChart2,
};

const DeepavaliAppMenuBar = ({ basePath = DP_BASE_PATH, menuIds = DP_APP_MENU_IDS }) => {
    const location = useLocation();
    const items = getDeepavaliAppMenuItems(basePath, menuIds);

    const isItemActive = (item) => {
        const current = location.pathname || '';
        if (item.id === 'home') {
            return current === basePath || current === `${basePath}/` || current === `${basePath}/dashboard`;
        }
        if (item.id === 'collections') {
            return current.includes('/receivables') || current.includes('/collections');
        }
        if (item.id === 'adminsettings') {
            return current.includes('/adminsettings') || current.includes('/employees');
        }
        return current === item.path || current.startsWith(`${item.path}/`);
    };

    return (
        <nav className="hidden lg:block bg-white border-b border-gray-200 sticky top-14 z-40 shadow-sm" aria-label="Deepavali Chits modules">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1">
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
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default DeepavaliAppMenuBar;
