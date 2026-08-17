import React, { createContext, useContext } from 'react';

export const HH_BASE_PATH = '/hospital-management/user';
export const HH_MANAGER_BASE_PATH = '/hospital-management/manager';
export const HH_RECEPTIONIST_BASE_PATH = '/hospital-management/receptionist';

export const getHhBasePathForRole = (roleCode, { isOwner = false } = {}) => {
  const role = String(roleCode || '').toUpperCase();
  if (isOwner && (!role || role === 'USER')) return HH_BASE_PATH;
  switch (role) {
    case 'MANAGER':
      return HH_MANAGER_BASE_PATH;
    case 'RECEPTIONIST':
      return HH_RECEPTIONIST_BASE_PATH;
    case 'USER':
    default:
      return HH_BASE_PATH;
  }
};

export const getHhBasePathFromPathname = (pathname = '') => {
  const path = String(pathname || '');
  if (path.startsWith(HH_MANAGER_BASE_PATH)) return HH_MANAGER_BASE_PATH;
  if (path.startsWith(HH_RECEPTIONIST_BASE_PATH)) return HH_RECEPTIONIST_BASE_PATH;
  return HH_BASE_PATH;
};

export const getHospitalManagementMenuItems = (basePath = HH_BASE_PATH) => [
  { id: 'dashboard', label: 'Dashboard', path: `${basePath}/dashboard`, navKey: 'dashboard' },
  { id: 'hospital', label: 'Hospital', path: `${basePath}/hospital`, navKey: 'hospital' },
  { id: 'doctors', label: 'Doctors', path: `${basePath}/doctors`, navKey: 'doctors' },
  { id: 'patients', label: 'Patients', path: `${basePath}/patients`, navKey: 'patients' },
  { id: 'appointments', label: 'Appointments', path: `${basePath}/appointments`, navKey: 'appointments' },
  { id: 'wards-beds', label: 'Wards & Beds', path: `${basePath}/wards-beds`, navKey: 'wards' },
  { id: 'admissions', label: 'Admissions', path: `${basePath}/admissions`, navKey: 'admissions' },
  { id: 'hospital-billing', label: 'Hospital Billing', path: `${basePath}/hospital-billing`, navKey: 'billing' },
  { id: 'pharmacy', label: 'Pharmacy', path: `${basePath}/pharmacy`, navKey: 'pharmacy' },
  { id: 'ledger', label: 'Ledger', path: `${basePath}/ledger`, navKey: 'ledger' },
  { id: 'daybook', label: 'Daybook', path: `${basePath}/daybook`, navKey: 'daybook' },
  { id: 'emr', label: 'EMR', path: `${basePath}/emr`, navKey: 'emr' },
  { id: 'lab', label: 'Lab', path: `${basePath}/lab`, navKey: 'lab' },
  { id: 'blood-bank', label: 'Blood Bank', path: `${basePath}/blood-bank`, navKey: 'bloodBank' },
  { id: 'inventory', label: 'Inventory', path: `${basePath}/inventory`, navKey: 'inventory' },
  { id: 'insurance', label: 'Insurance', path: `${basePath}/insurance`, navKey: 'insurance' },
  { id: 'reports', label: 'Reports', path: `${basePath}/reports`, navKey: 'reports' },
  { id: 'extra-admin', label: 'Extra admin', path: `${basePath}/extra-admin`, navKey: 'extraAdmin' },
  { id: 'adminsettings', label: 'Admin settings', path: `${basePath}/adminsettings`, navKey: 'adminSettings' },
  { id: 'subscription-billing', label: 'Billing', path: `${basePath}/billing`, navKey: null },
];

const HhBasePathContext = createContext(HH_BASE_PATH);

export const HhBasePathProvider = ({ basePath = HH_BASE_PATH, children }) => (
  <HhBasePathContext.Provider value={basePath}>
    {children}
  </HhBasePathContext.Provider>
);

export const useHhBasePath = () => useContext(HhBasePathContext) || HH_BASE_PATH;
