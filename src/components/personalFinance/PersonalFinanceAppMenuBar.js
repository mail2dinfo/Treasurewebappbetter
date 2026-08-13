import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiCreditCard, FiTag } from 'react-icons/fi';

const PF_BASE_PATH = '/personal-finance/user';

const ITEMS = [
    { id: 'home', label: 'Dashboard', path: `${PF_BASE_PATH}/dashboard` },
    { id: 'accounts', label: 'Accounts', path: `${PF_BASE_PATH}/accounts` },
    { id: 'categories', label: 'Categories', path: `${PF_BASE_PATH}/categories` },
];

const ICONS = {
    home: FiHome,
    accounts: FiCreditCard,
    categories: FiTag,
};

const PersonalFinanceAppMenuBar = () => {
    const location = useLocation();

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

    return (
        <nav
            className="hidden lg:block bg-white border-b border-gray-200 sticky top-14 z-40 shadow-sm"
            aria-label="Personal Finance modules"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1">
                    {ITEMS.map((item) => {
                        const Icon = ICONS[item.id] || FiHome;
                        const active = isItemActive(item);
                        return (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-red-50 text-red-800 border border-red-100'
                                        : 'text-gray-600 border border-transparent hover:bg-gray-50 hover:text-gray-900'
                                }`}
                                aria-current={active ? 'page' : undefined}
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

export default PersonalFinanceAppMenuBar;
