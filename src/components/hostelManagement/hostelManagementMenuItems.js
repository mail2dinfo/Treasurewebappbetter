import React, { createContext, useContext } from 'react';

export const HM_BASE_PATH = '/hostel-management/user';
export const HM_MANAGER_BASE_PATH = '/hostel-management/manager';
export const HM_RECEPTIONIST_BASE_PATH = '/hostel-management/receptionist';
export const HM_KITCHENSTAFF_BASE_PATH = '/hostel-management/kitchenstaff';
export const HM_RESIDENT_BASE_PATH = '/hostel-management/resident';

/** @deprecated use HM_KITCHENSTAFF_BASE_PATH */
export const HM_KITCHEN_BASE_PATH = HM_KITCHENSTAFF_BASE_PATH;

export const getHmBasePathForRole = (roleCode, { isOwner = false } = {}) => {
  const role = String(roleCode || '').toUpperCase();
  if (isOwner && (!role || role === 'USER')) return HM_BASE_PATH;
  switch (role) {
    case 'MANAGER':
      return HM_MANAGER_BASE_PATH;
    case 'RECEPTIONIST':
      return HM_RECEPTIONIST_BASE_PATH;
    case 'KITCHEN_STAFF':
      return HM_KITCHENSTAFF_BASE_PATH;
    case 'SUBSCRIBER':
      return HM_RESIDENT_BASE_PATH;
    case 'USER':
    default:
      return HM_BASE_PATH;
  }
};

export const getHmBasePathFromPathname = (pathname = '') => {
  const path = String(pathname || '');
  if (path.startsWith(HM_MANAGER_BASE_PATH)) return HM_MANAGER_BASE_PATH;
  if (path.startsWith(HM_RECEPTIONIST_BASE_PATH)) return HM_RECEPTIONIST_BASE_PATH;
  if (path.startsWith(HM_KITCHENSTAFF_BASE_PATH)) return HM_KITCHENSTAFF_BASE_PATH;
  if (path.startsWith('/hostel-management/kitchen')) return HM_KITCHENSTAFF_BASE_PATH;
  if (path.startsWith(HM_RESIDENT_BASE_PATH)) return HM_RESIDENT_BASE_PATH;
  return HM_BASE_PATH;
};

export const getHostelManagementMenuItems = (basePath = HM_BASE_PATH) => [
  { id: 'dashboard', label: 'Dashboard', path: `${basePath}/dashboard`, navKey: 'dashboard' },
  { id: 'residents', label: 'Residents', path: `${basePath}/residents`, navKey: 'residents' },
  { id: 'dues-deck', label: 'Bed Deck', path: `${basePath}/dues-deck`, navKey: 'duesDeck' },
  { id: 'receivables', label: 'Receivables', path: `${basePath}/receivables`, navKey: 'receivables' },
  { id: 'outstanding', label: 'Outstanding', path: `${basePath}/outstanding`, navKey: 'outstanding' },
  { id: 'food-report', label: 'Food Report', path: `${basePath}/food-report`, navKey: 'foodReport' },
  { id: 'special-orders', label: 'Special Orders', path: `${basePath}/special-orders`, navKey: 'specialOrders' },
  { id: 'ledger', label: 'Ledger', path: `${basePath}/ledger`, navKey: 'ledger' },
  { id: 'adminsettings', label: 'Admin settings', path: `${basePath}/adminsettings`, navKey: 'adminSettings' },
  { id: 'billing', label: 'Billing', path: `${basePath}/billing`, navKey: null },
];

const HmBasePathContext = createContext(HM_BASE_PATH);

export const HmBasePathProvider = ({ basePath = HM_BASE_PATH, children }) => (
  <HmBasePathContext.Provider value={basePath}>
    {children}
  </HmBasePathContext.Provider>
);

export const useHmBasePath = () => useContext(HmBasePathContext) || HM_BASE_PATH;
