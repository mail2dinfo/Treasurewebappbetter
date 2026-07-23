import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSubscriberContext } from '../../../context/subscriber/SubscriberContext';
import { useLanguage } from '../../../context/language_context';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import MyTreasureBrand from '../../MyTreasureBrand';
import FinanceHubNavButton from '../../FinanceHubNavButton';

const SubscriberHeader = () => {
    const history = useHistory();
    const location = useLocation();
    const { user, signOut } = useSubscriberContext();
    const { t } = useLanguage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        {
            id: 'groups',
            label: t('my_groups'),
            path: '/chit-fund/subscriber/groups',
            icon: '👥'
        },
        {
            id: 'transactions',
            label: t('transactions'),
            path: '/chit-fund/subscriber/transactions',
            icon: '💳'
        },
        {
            id: 'dashboard',
            label: t('dashboard'),
            path: '/chit-fund/subscriber/dashboard',
            icon: '📊'
        },
        {
            id: 'profile',
            label: t('profile'),
            path: '/chit-fund/subscriber/profile',
            icon: '👤'
        }
    ];

    const handleMenuClick = (path) => {
        history.push(path);
        setIsMobileMenuOpen(false);
    };

    const handleLogout = () => {
        signOut();
        history.push('/login');
        setIsMobileMenuOpen(false);
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <MyTreasureBrand subtitle="Chit Fund Subscriber" inverse />

                    <nav className="hidden md:flex items-center space-x-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => handleMenuClick(item.path)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${isActive(item.path)
                                    ? 'bg-white/20 text-white shadow-md'
                                    : 'text-white hover:bg-white/10'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center space-x-4">
                        <FinanceHubNavButton
                            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10"
                            iconClassName="w-4 h-4"
                        />
                        <div className="hidden lg:flex items-center space-x-3">
                            <img
                                src={user?.user_image_s3_image || 'https://i.imgur.com/ndu6pfe.png'}
                                alt={user?.firstname || user?.name || user?.results?.firstname || user?.results?.name || 'User'}
                                className="w-8 h-8 rounded-full object-cover border-2 border-white/50"
                                onError={(e) => {
                                    e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                }}
                            />
                            <div className="text-right">
                                <p className="text-sm font-medium text-white">
                                    {t('welcome_message')}, {user?.firstname || user?.name || user?.results?.firstname || user?.results?.name || 'User'}!
                                </p>
                                <p className="text-xs text-red-100">
                                    {user?.email || user?.results?.email || user?.phone || user?.results?.phone || 'Subscriber'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                        >
                            <FiLogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('logout')}</span>
                        </button>

                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
                        >
                            {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-white/20">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleMenuClick(item.path)}
                                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive(item.path)
                                        ? 'bg-white/20 text-white shadow-md'
                                        : 'text-white hover:bg-white/10'
                                        }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="px-4 py-3 border-t border-white/20 bg-white/10">
                            <div className="flex items-center space-x-3">
                                <img
                                    src={user?.user_image_s3_image || 'https://i.imgur.com/ndu6pfe.png'}
                                    alt={user?.firstname || user?.name || user?.results?.firstname || user?.results?.name || 'User'}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
                                    onError={(e) => {
                                        e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                    }}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-white">
                                        {t('welcome_message')}, {user?.firstname || user?.name || user?.results?.firstname || user?.results?.name || 'User'}!
                                    </p>
                                    <p className="text-xs text-red-100">
                                        {user?.email || user?.results?.email || user?.phone || user?.results?.phone || 'Subscriber'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default SubscriberHeader;
