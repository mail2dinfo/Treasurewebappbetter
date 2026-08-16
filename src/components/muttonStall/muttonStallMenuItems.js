import React, { createContext, useContext } from 'react';

export const MS_BASE_PATH = '/mutton-stall/user';
export const MS_MANAGER_BASE_PATH = '/mutton-stall/manager';
export const MS_SALESMAN_BASE_PATH = '/mutton-stall/salesman';
export const MS_CUSTOMER_BASE_PATH = '/mutton-stall/customer';

export const getMsBasePathForRole = (roleCode, { isOwner = false } = {}) => {
  const role = String(roleCode || '').toUpperCase();
  if (isOwner && (!role || role === 'USER')) return MS_BASE_PATH;
  switch (role) {
    case 'MANAGER':
      return MS_MANAGER_BASE_PATH;
    case 'SALESMAN':
      return MS_SALESMAN_BASE_PATH;
    case 'SUBSCRIBER':
      return MS_CUSTOMER_BASE_PATH;
    case 'USER':
    default:
      return MS_BASE_PATH;
  }
};

export const getMsBasePathFromPathname = (pathname = '') => {
  const path = String(pathname || '');
  if (path.startsWith(MS_MANAGER_BASE_PATH)) return MS_MANAGER_BASE_PATH;
  if (path.startsWith(MS_SALESMAN_BASE_PATH)) return MS_SALESMAN_BASE_PATH;
  if (path.startsWith(MS_CUSTOMER_BASE_PATH)) return MS_CUSTOMER_BASE_PATH;
  return MS_BASE_PATH;
};

export const getMuttonStallMenuItems = (basePath = MS_BASE_PATH) => [
  { id: 'dashboard', label: 'Dashboard', path: `${basePath}/dashboard`, navKey: 'dashboard' },
  { id: 'orders', label: 'Orders', path: `${basePath}/orders`, navKey: 'orders' },
  { id: 'stock', label: 'Stock', path: `${basePath}/stock`, navKey: 'stock' },
  { id: 'customers', label: 'Customers', path: `${basePath}/customers`, navKey: 'customers' },
  { id: 'billing', label: 'Stall Billing', path: `${basePath}/stall-billing`, navKey: 'billing' },
  { id: 'reports', label: 'Reports', path: `${basePath}/reports`, navKey: 'reports' },
  { id: 'ledger', label: 'Ledger', path: `${basePath}/ledger`, navKey: 'ledger' },
  { id: 'daybook', label: 'Daybook', path: `${basePath}/daybook`, navKey: 'daybook' },
  { id: 'adminsettings', label: 'Admin settings', path: `${basePath}/adminsettings`, navKey: 'adminSettings' },
  { id: 'subscription-billing', label: 'Billing', path: `${basePath}/billing`, navKey: null },
];

const MsBasePathContext = createContext(MS_BASE_PATH);

export const MsBasePathProvider = ({ basePath = MS_BASE_PATH, children }) => (
  <MsBasePathContext.Provider value={basePath}>
    {children}
  </MsBasePathContext.Provider>
);

export const useMsBasePath = () => useContext(MsBasePathContext) || MS_BASE_PATH;
