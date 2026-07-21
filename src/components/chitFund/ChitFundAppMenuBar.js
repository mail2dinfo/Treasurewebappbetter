import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    FiHome,
    FiUsers,
    FiLayers,
    FiDownload,
    FiUpload,
    FiSettings,
    FiBookOpen,
    FiPackage,
} from 'react-icons/fi';
import {
    CHIT_BASE_PATH,
    getChitFundAppMenuItems,
} from './chitFundMenuItems';

const MENU_ICONS = {
    home: FiHome,
    subscribers: FiUsers,
    groups: FiLayers,
    receivables: FiDownload,
    payables: FiUpload,
    adminsettings: FiSettings,
    ledger: FiBookOpen,
    products: FiPackage,
};

/**
 * App-specific module bar for Chit Fund user shell.
 * Renders under the main navbar on /chit-fund/user/*.
 */
const ChitFundAppMenuBar = ({ basePath = CHIT_BASE_PATH }) => {
    const location = useLocation();
    const items = getChitFundAppMenuItems(basePath);

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
        if (item.id === 'groups') {
            return current === item.path || current.startsWith(`${item.path}/`);
        }
        if (item.id === 'subscribers') {
            return (
                current === item.path
                || current.startsWith(`${item.path}/`)
                || current.startsWith(`${basePath}/subscriber/`)
            );
        }
        if (current === item.path) return true;
        return current.startsWith(`${item.path}/`);
    };

    return (
        <nav
            className="bg-white border-b border-gray-200 sticky top-20 z-40 shadow-sm"
            aria-label="Chit Fund modules"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1 scrollbar-thin">
                    {items.map((item) => {
                        const Icon = MENU_ICONS[item.id] || FiHome;
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

export default ChitFundAppMenuBar;
