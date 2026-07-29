import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiDollarSign,
  FiCoffee,
  FiShoppingBag,
  FiClipboard,
  FiTarget,
  FiActivity,
} from 'react-icons/fi';
import { HM_RESIDENT_BASE_PATH } from './hostelManagementMenuItems';

const RESIDENT_MENU = [
  { id: 'home', label: 'Home', path: `${HM_RESIDENT_BASE_PATH}/dashboard`, hash: '', icon: FiHome },
  { id: 'dues', label: 'My dues', path: `${HM_RESIDENT_BASE_PATH}/dashboard#dues`, hash: 'dues', icon: FiDollarSign },
  { id: 'meals', label: 'Meals', path: `${HM_RESIDENT_BASE_PATH}/dashboard#meals`, hash: 'meals', icon: FiCoffee },
  { id: 'special-orders', label: 'Special orders', path: `${HM_RESIDENT_BASE_PATH}/special-orders`, icon: FiClipboard },
  { id: 'order-food', label: 'Order food', path: `${HM_RESIDENT_BASE_PATH}/order-food`, icon: FiShoppingBag },
  { id: 'turfs', label: 'Turfs', path: `${HM_RESIDENT_BASE_PATH}/turfs`, icon: FiTarget },
  { id: 'shuttle-courts', label: 'Shuttle courts', path: `${HM_RESIDENT_BASE_PATH}/shuttle-courts`, icon: FiActivity },
];

/** Module links under top bar (same pattern as admin AppMenuBar). */
const HostelManagementResidentAppMenuBar = () => {
  const location = useLocation();

  const isItemActive = (item) => {
    const path = location.pathname || '';
    const hash = (location.hash || '').replace('#', '');
    if (item.id === 'order-food') return path.includes('/order-food');
    if (item.id === 'special-orders') return path.includes('/special-orders');
    if (item.id === 'turfs') return path.includes('/turfs');
    if (item.id === 'shuttle-courts') return path.includes('/shuttle-courts');
    if (item.id === 'home') {
      return (path.endsWith('/resident') || path.includes('/dashboard')) && !hash;
    }
    if (item.hash) {
      return (path.includes('/dashboard') || path.endsWith('/resident')) && hash === item.hash;
    }
    return false;
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-14 z-40 shadow-sm" aria-label="Resident modules">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1">
          {RESIDENT_MENU.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);
            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={item.label}
                onClick={() => {
                  if (item.hash) {
                    setTimeout(() => {
                      document.getElementById(item.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 80);
                  }
                }}
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
  );
};

export default HostelManagementResidentAppMenuBar;
