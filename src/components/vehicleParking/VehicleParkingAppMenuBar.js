import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { VP_MENU } from './vpMenu';
import { useVpPermission } from './useVpPermission';

const VehicleParkingAppMenuBar = () => {
    const location = useLocation();
    const { nav } = useVpPermission();
    const items = VP_MENU.filter((item) => nav[item.nav]);
    return (
        <nav className="hidden lg:block bg-white border-b border-gray-200 sticky top-14 z-40 shadow-sm" aria-label="Parking modules">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1 overflow-x-auto py-2">
                    {items.map((item) => {
                        const active = (location.pathname || '').startsWith(item.path);
                        return (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                className={`inline-flex items-center whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                                    active
                                        ? 'bg-red-50 text-red-800 border border-red-100'
                                        : 'text-gray-600 border border-transparent hover:bg-gray-50'
                                }`}
                            >
                                {item.label}
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default VehicleParkingAppMenuBar;
