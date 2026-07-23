import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSubscriberContext } from '../../../context/subscriber/SubscriberContext';
import { useLanguage } from '../../../context/language_context';

const SubscriberSidebar = () => {
    const history = useHistory();
    const location = useLocation();
    const { signOut, user } = useSubscriberContext();
    const { t } = useLanguage();

    const menuItems = [
        {
            id: 'dashboard',
            label: t('dashboard'),
            icon: '🏠',
            path: '/chit-fund/subscriber/dashboard'
        },
        {
            id: 'groups',
            label: t('my_groups'),
            icon: '👥',
            path: '/chit-fund/subscriber/groups'
        },
        {
            id: 'transactions',
            label: t('transactions'),
            icon: '💳',
            path: '/chit-fund/subscriber/transactions'
        },
        {
            id: 'profile',
            label: t('profile'),
            icon: '👤',
            path: '/chit-fund/subscriber/profile'
        }
    ];

    const handleMenuClick = (path) => {
        history.push(path);
    };

    const handleLogout = () => {
        signOut();
        history.push('/login');
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <aside className="subscriber-sidebar">
            <div className="sidebar-content flex flex-col h-full">
                {/* Logo/Brand Section */}
                <div className="mb-6">
                    <div className="flex items-center space-x-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md overflow-hidden bg-white border border-gray-200">
                            {user?.userCompany?.logo_s3_image ? (
                                <img
                                    src={user.userCompany.logo_s3_image}
                                    alt={user?.userCompany?.companyName || user?.userCompany?.name || 'Company Logo'}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                            ) : null}
                            <div
                                className={`w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center ${user?.userCompany?.logo_s3_image ? 'hidden' : 'flex'}`}
                                style={{ display: user?.userCompany?.logo_s3_image ? 'none' : 'flex' }}
                            >
                                <span className="text-white text-xl font-bold">🏦</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900">
                                {user?.userCompany?.companyName || user?.userCompany?.name || 'Treasure'}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium">Subscriber Portal</p>
                        </div>
                    </div>
                </div>

                {/* Debug: Log user data */}

                {/* Welcome Section */}
                <div className="mt-4 mb-6 p-4 bg-gradient-to-r from-red-600 to-red-700 rounded-xl text-white shadow-lg">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <img
                                src={user?.userImage || user?.profileImage || user?.user_image || 'https://via.placeholder.com/50x50?text=U'}
                                alt={user?.firstname || user?.name || user?.results?.firstname || user?.results?.name || 'Subscriber'}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/50x50?text=U';
                                }}
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-red-100 font-medium">{t('welcome_message')},</p>
                            <p className="text-lg font-bold text-white truncate">
                                {user?.firstname || user?.name || user?.results?.firstname || user?.results?.name || 'Subscriber'}
                            </p>
                            <p className="text-xs text-red-200 truncate">
                                {user?.email || user?.results?.email || user?.phone || user?.results?.phone || 'Subscriber Account'}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => handleMenuClick(item.path)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Logout Button at Bottom */}
                <div className="sidebar-footer mt-auto">
                    <button
                        className="nav-item logout-button"
                        onClick={handleLogout}
                    >
                        <span className="nav-icon">🚪</span>
                        <span className="nav-label">{t('logout')}</span>
                    </button>
                </div>

            </div>
        </aside>
    );
};

export default SubscriberSidebar;
