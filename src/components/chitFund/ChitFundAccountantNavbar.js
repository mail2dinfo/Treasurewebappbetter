import React from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { FiHome, FiDollarSign, FiCreditCard, FiBarChart2, FiLogOut } from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';

const navLinkClass = (active) =>
    `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active ? 'bg-white/20 text-white' : 'text-white hover:bg-white/10'
    }`;

const ChitFundAccountantNavbar = () => {
    const location = useLocation();
    const history = useHistory();
    const { logout } = useUserContext();
    const platform = usePlatformAccess();

    const isActive = (path) => {
        if (path === '/chit-fund/accountant/home') {
            return location.pathname === path || location.pathname === '/chit-fund/accountant';
        }
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const handleLogout = () => {
        platform?.clearActiveContext?.();
        logout();
        history.push('/login');
    };

    const navItems = [
        { path: '/chit-fund/accountant/dashboard', label: 'Dashboard', icon: FiBarChart2 },
        { path: '/chit-fund/accountant/ledger', label: 'Ledger', icon: FiCreditCard },
        { path: '/chit-fund/accountant/receivables', label: 'Receivables', icon: FiDollarSign },
        { path: '/chit-fund/accountant/payables', label: 'Payables', icon: FiDollarSign },
        { path: '/chit-fund/accountant/home', label: 'Home', icon: FiHome },
    ];

    return (
        <nav className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <MyTreasureBrand
                        to="/chit-fund/accountant/dashboard"
                        subtitle="Chit Fund Accountant"
                        inverse
                    />

                    <div className="hidden md:flex items-center space-x-4">
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

                    <div className="flex items-center space-x-4">
                        <FinanceHubNavButton
                            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10"
                            iconClassName="w-4 h-4"
                        />
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="text-white hover:bg-white/10 p-2 rounded-lg"
                            aria-label="Logout"
                        >
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <FinanceHubNavButton
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-white hover:bg-white/10"
                            iconClassName="w-4 h-4"
                        />
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                                        isActive(item.path)
                                            ? 'bg-white/20 text-white'
                                            : 'text-white hover:bg-white/10'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default ChitFundAccountantNavbar;
