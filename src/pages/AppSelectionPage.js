import React from 'react';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { FiLogOut } from 'react-icons/fi';

const AppSelectionPage = () => {
    const history = useHistory();
    const { user, logout } = useUserContext();

    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    const apps = [
        {
            id: 1,
            name: 'MyTreasure - Chit Fund',
            description: 'Manage chit groups and auctions',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
                </svg>
            ),
            path: '/chit-fund/user',
            isActive: true
        },
        {
            id: 2,
            name: 'MyTreasure - Daily Collection',
            description: 'Track daily loans and collections',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                    <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
                    <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
                </svg>
            ),
            path: '/daily-collection/user/dashboard',
            isActive: true
        },
        {
            id: 3,
            name: 'Mytreasure - Personal loan',
            description: 'Personal finance and loan management',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 8.25a3 3 0 100 6 3 3 0 000-6z" />
                    <path d="M12 15.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm.75-4.5a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z" />
                </svg>
            ),
            path: '/personal-loan/user/dashboard',
            isActive: true
        },
        {
            id: 4,
            name: 'MyTreasure - Two Wheeler Finance',
            description: 'Vehicle financing and loan management',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 116 0h3a.75.75 0 00.75-.75V15z" />
                    <path d="M8.25 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zM15.75 6.75a.75.75 0 00-.75.75v11.25c0 .087.015.17.042.248a3 3 0 015.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 00-3.732-10.104 1.837 1.837 0 00-1.47-.725H15.75z" />
                    <path d="M19.5 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
                </svg>
            ),
            path: '/two-wheeler-finance',
            isActive: false
        }
    ];

    const handleAppSelection = (app) => {
        if (app.isActive && app.path !== '#') {
            history.push(app.path);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Header with User Info and Logout */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo and Title */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-custom-red rounded-lg flex items-center justify-center">
                                <span className="text-white text-xl font-bold">🏦</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-custom-red">Finance Hub</h1>
                                <p className="text-xs text-gray-500">Select Your Application</p>
                            </div>
                        </div>

                        {/* User Info and Logout */}
                        <div className="flex items-center space-x-4">
                            {/* User Avatar and Name */}
                            <div className="hidden sm:flex items-center space-x-3">
                                <div className="relative">
                                    <img
                                        src={user?.results?.userDetail?.user_image_s3_image || user?.results?.user_image_s3_image || 'https://i.imgur.com/ndu6pfe.png'}
                                        alt={user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || 'User'}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-md"
                                        onError={(e) => {
                                            e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                        }}
                                    />
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        Welcome, {user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || 'User'}!
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {user?.results?.userDetail?.userRole || user?.results?.userDetail?.role || 'User'}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Mobile User Avatar */}
                            <div className="sm:hidden">
                                <img
                                    src={user?.results?.userDetail?.user_image_s3_image || user?.results?.user_image_s3_image || 'https://i.imgur.com/ndu6pfe.png'}
                                    alt={user?.results?.userDetail?.userName || user?.results?.firstname || user?.results?.name || 'User'}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-md"
                                    onError={(e) => {
                                        e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                    }}
                                />
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <FiLogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                {/* Welcome Message */}
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                        Welcome Back!
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500">
                        Select an application to get started
                    </p>
                </div>

                {/* App Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-5xl mx-auto">
                    {apps.map((app, index) => (
                        <div
                            key={app.id}
                            onClick={() => handleAppSelection(app)}
                            className={`
                group relative bg-white border-2 rounded-xl p-5 sm:p-6
                transition-all duration-300 ease-in-out
                flex flex-col items-center text-center gap-3 sm:gap-4
                shadow-sm hover:shadow-lg
                ${app.isActive
                                    ? 'border-custom-red cursor-pointer hover:-translate-y-1 hover:border-custom-red-dark'
                                    : 'border-gray-300 opacity-60 cursor-not-allowed'
                                }
              `}
                            style={{
                                animation: `fadeIn 0.4s ease-out ${index * 0.05}s backwards`
                            }}
                        >
                            {/* Top Border Indicator */}
                            <div className={`
                absolute top-0 left-0 w-full h-1 rounded-t-xl
                transition-transform duration-300 origin-left scale-x-0
                group-hover:scale-x-100
                ${app.isActive ? 'bg-custom-red' : 'bg-gray-400'}
              `} />

                            {/* Icon */}
                            <div className={`
                w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center
                transition-all duration-300 shadow-md
                group-hover:scale-105
                ${app.isActive ? 'bg-custom-red group-hover:bg-custom-red-dark' : 'bg-gray-400'}
              `}>
                                <div className="w-7 h-7 sm:w-8 sm:h-8 text-white">
                                    {app.icon}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">
                                    {app.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    {app.description}
                                </p>
                            </div>

                            {/* Coming Soon Badge */}
                            {!app.isActive && (
                                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gray-700 text-white text-[10px] sm:text-xs font-semibold px-2 py-1 rounded uppercase tracking-wide">
                                    Coming Soon
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="text-center pt-8 sm:pt-12 mt-8 sm:mt-12 border-t border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-500">
                        © 2024 Treasure Finance Hub. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Keyframes for animation */}
            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
        </div>
    );
};

export default AppSelectionPage;

