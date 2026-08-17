import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FiHome,
  FiActivity,
  FiUserCheck,
  FiUsers,
  FiCalendar,
  FiLayers,
  FiClipboard,
  FiDollarSign,
  FiPackage,
  FiBookOpen,
  FiSettings,
  FiFileText,
  FiThermometer,
  FiDroplet,
  FiBox,
  FiShield,
  FiBarChart2,
  FiSliders,
} from 'react-icons/fi';
import {
  HH_BASE_PATH,
  getHospitalManagementMenuItems,
  useHhBasePath,
} from './hospitalManagementMenuItems';
import { useHhPermission } from './useHhPermission';

const MENU_ICONS = {
  dashboard: FiHome,
  hospital: FiActivity,
  doctors: FiUserCheck,
  patients: FiUsers,
  appointments: FiCalendar,
  'wards-beds': FiLayers,
  admissions: FiClipboard,
  'hospital-billing': FiDollarSign,
  pharmacy: FiPackage,
  ledger: FiBookOpen,
  daybook: FiCalendar,
  emr: FiFileText,
  lab: FiThermometer,
  'blood-bank': FiDroplet,
  inventory: FiBox,
  insurance: FiShield,
  reports: FiBarChart2,
  'extra-admin': FiSliders,
  adminsettings: FiSettings,
};

const HospitalManagementAppMenuBar = ({ basePath: basePathProp }) => {
  const location = useLocation();
  const contextBasePath = useHhBasePath();
  const basePath = basePathProp || contextBasePath || HH_BASE_PATH;
  const { nav, isOwner } = useHhPermission();
  const items = getHospitalManagementMenuItems(basePath).filter((item) => {
    if (item.id === 'subscription-billing') return false;
    if (!item.navKey) return isOwner;
    return Boolean(nav[item.navKey]);
  });

  const isItemActive = (item) => {
    const current = location.pathname || '';
    if (item.id === 'dashboard') {
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
    <nav className="hidden lg:block bg-white border-b border-gray-200 sticky top-14 z-40 shadow-sm" aria-label="Hospital Management modules">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 px-1">
          {items.map((item) => {
            const Icon = MENU_ICONS[item.id] || FiHome;
            const active = isItemActive(item);
            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={item.label}
                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-cyan-50 text-cyan-900 border border-cyan-100'
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

export default HospitalManagementAppMenuBar;
