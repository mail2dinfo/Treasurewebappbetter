import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiHome as FiProperty,
  FiFileText,
  FiCreditCard,
  FiBriefcase,
} from 'react-icons/fi';
import {
  RM_BASE_PATH,
  getRentalManagementAppMenuItems,
} from './rentalManagementMenuItems';

const MENU_ICONS = {
  home: FiHome,
  company: FiBriefcase,
  tenants: FiUsers,
  properties: FiProperty,
  agreements: FiFileText,
  collections: FiCreditCard,
};

const RentalManagementAppMenuBar = ({ basePath = RM_BASE_PATH }) => {
  const location = useLocation();
    const items = getRentalManagementAppMenuItems(basePath);

  const isItemActive = (item) => {
    const current = location.pathname || '';
    if (item.id === 'home') {
      return (
        current === basePath
        || current === `${basePath}/`
        || current === `${basePath}/dashboard`
      );
    }
    if (current === item.path) return true;
    return current.startsWith(`${item.path}/`);
  };

  return (
    <>
      <nav className="hidden lg:block bg-white border-b border-gray-200 sticky top-14 z-40 shadow-sm" aria-label="Rental Management modules">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1">
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
                      ? 'bg-red-50 text-red-800 border border-red-100'
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
    </>
  );
};

export default RentalManagementAppMenuBar;
