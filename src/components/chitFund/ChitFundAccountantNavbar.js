import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiDollarSign, FiCreditCard, FiBarChart2, FiLogOut } from 'react-icons/fi';
import MyTreasureBrand from '../MyTreasureBrand';

const ChitFundAccountantNavbar = () => {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        { path: '/chit-fund/accountant/dashboard', label: 'Dashboard', icon: FiBarChart2 },
        { path: '/chit-fund/accountant/ledger', label: 'Ledger', icon: FiCreditCard },
        { path: '/chit-fund/accountant/receivables', label: 'Receivables', icon: FiDollarSign },
        { path: '/chit-fund/accountant/payables', label: 'Payables', icon: FiDollarSign },
        { path: '/chit-fund/accountant/home', label: 'Home', icon: FiHome },
    ];

    return (
        <nav className="bg-white shadow-lg border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <MyTreasureBrand
                        to="/chit-fund/accountant/dashboard"
                        subtitle="Chit Fund Accountant"
                    />

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.path)
                                        ? 'bg-green-100 text-green-700'
                                        : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        <button className="text-gray-600 hover:text-green-600">
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${isActive(item.path)
                                        ? 'bg-green-100 text-green-700'
                                        : 'text-gray-600 hover:text-green-600 hover:bg-gray-50'
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
