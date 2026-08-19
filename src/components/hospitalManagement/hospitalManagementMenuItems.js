import React, { createContext, useContext } from 'react';

export const HH_BASE_PATH = '/hospital-management/user';
export const HH_MANAGER_BASE_PATH = '/hospital-management/manager';
export const HH_RECEPTIONIST_BASE_PATH = '/hospital-management/receptionist';
export const HH_PHARMACIST_BASE_PATH = '/hospital-management/pharmacist';
export const HH_DOCTOR_BASE_PATH = '/hospital-management/doctor';
export const HH_DOCTOR_LOGIN_PATH = '/hospital-management/doctor/login';
export const HH_NURSE_BASE_PATH = '/hospital-management/nurse';
export const HH_COMPOUNDER_BASE_PATH = '/hospital-management/compounder';
export const HH_KITCHEN_BASE_PATH = '/hospital-management/kitchen';
export const HH_PATIENT_BASE_PATH = '/hospital-management/patient';
export const HH_PATIENT_LOGIN_PATH = HH_PATIENT_BASE_PATH;
export const HH_PATIENT_TAB_PATHS = {
  home: `${HH_PATIENT_BASE_PATH}/home`,
  medicines: `${HH_PATIENT_BASE_PATH}/medicines`,
  bills: `${HH_PATIENT_BASE_PATH}/bills`,
  appointments: `${HH_PATIENT_BASE_PATH}/appointments`,
  records: `${HH_PATIENT_BASE_PATH}/records`,
  labs: `${HH_PATIENT_BASE_PATH}/labs`,
  blood: `${HH_PATIENT_BASE_PATH}/blood-bank`,
  stay: `${HH_PATIENT_BASE_PATH}/ward`,
  food: `${HH_PATIENT_BASE_PATH}/food`,
  profile: `${HH_PATIENT_BASE_PATH}/profile`,
};

export const getHhPatientTabFromPathname = (pathname = '') => {
  const path = String(pathname || '');
  const match = Object.entries(HH_PATIENT_TAB_PATHS).find(([, tabPath]) => path === tabPath);
  return match ? match[0] : 'home';
};

export const HH_STAFF_LOGIN_PATHS = {
  MANAGER: '/hospital-management/manager/login',
  RECEPTIONIST: '/hospital-management/receptionist/login',
  PHARMACIST: '/hospital-management/pharmacist/login',
  DOCTOR: HH_DOCTOR_LOGIN_PATH,
  NURSE: '/hospital-management/nurse/login',
  COMPOUNDER: '/hospital-management/compounder/login',
  KITCHEN_STAFF: '/hospital-management/kitchen/login',
};

export const getHhStaffLoginPathFromPathname = (pathname = '') => {
  const path = String(pathname || '');
  if (path.startsWith(HH_MANAGER_BASE_PATH)) return HH_STAFF_LOGIN_PATHS.MANAGER;
  if (path.startsWith(HH_RECEPTIONIST_BASE_PATH)) return HH_STAFF_LOGIN_PATHS.RECEPTIONIST;
  if (path.startsWith(HH_PHARMACIST_BASE_PATH)) return HH_STAFF_LOGIN_PATHS.PHARMACIST;
  if (path.startsWith(HH_DOCTOR_BASE_PATH)) return HH_STAFF_LOGIN_PATHS.DOCTOR;
  if (path.startsWith(HH_NURSE_BASE_PATH)) return HH_STAFF_LOGIN_PATHS.NURSE;
  if (path.startsWith(HH_COMPOUNDER_BASE_PATH)) return HH_STAFF_LOGIN_PATHS.COMPOUNDER;
  if (path.startsWith(HH_KITCHEN_BASE_PATH)) return HH_STAFF_LOGIN_PATHS.KITCHEN_STAFF;
  return '/login';
};

export const HH_ROLE_HOME_SUFFIX = {
  MANAGER: '/dashboard',
  RECEPTIONIST: '/dashboard',
  PHARMACIST: '/pharmacy-desk',
  COMPOUNDER: '/pharmacy-desk',
  DOCTOR: '/doctor-desk',
  NURSE: '/admissions',
  KITCHEN_STAFF: '/kitchen-desk',
};

export const getHhBasePathForRole = (roleCode, { isOwner = false } = {}) => {
  const role = String(roleCode || '').toUpperCase();
  if (isOwner && (!role || role === 'USER')) return HH_BASE_PATH;
  switch (role) {
    case 'MANAGER':
      return HH_MANAGER_BASE_PATH;
    case 'RECEPTIONIST':
      return HH_RECEPTIONIST_BASE_PATH;
    case 'PHARMACIST':
      return HH_PHARMACIST_BASE_PATH;
    case 'DOCTOR':
      return HH_DOCTOR_BASE_PATH;
    case 'NURSE':
      return HH_NURSE_BASE_PATH;
    case 'COMPOUNDER':
      return HH_COMPOUNDER_BASE_PATH;
    case 'KITCHEN_STAFF':
      return HH_KITCHEN_BASE_PATH;
    case 'USER':
    default:
      return HH_BASE_PATH;
  }
};

export const getHhBasePathFromPathname = (pathname = '') => {
  const path = String(pathname || '');
  if (path.startsWith(HH_MANAGER_BASE_PATH)) return HH_MANAGER_BASE_PATH;
  if (path.startsWith(HH_RECEPTIONIST_BASE_PATH)) return HH_RECEPTIONIST_BASE_PATH;
  if (path.startsWith(HH_PHARMACIST_BASE_PATH)) return HH_PHARMACIST_BASE_PATH;
  if (path.startsWith(HH_DOCTOR_BASE_PATH)) return HH_DOCTOR_BASE_PATH;
  if (path.startsWith(HH_NURSE_BASE_PATH)) return HH_NURSE_BASE_PATH;
  if (path.startsWith(HH_COMPOUNDER_BASE_PATH)) return HH_COMPOUNDER_BASE_PATH;
  if (path.startsWith(HH_KITCHEN_BASE_PATH)) return HH_KITCHEN_BASE_PATH;
  return HH_BASE_PATH;
};

export const getHospitalManagementMenuItems = (basePath = HH_BASE_PATH) => [
  { id: 'dashboard', label: 'Dashboard', path: `${basePath}/dashboard`, navKey: 'dashboard' },
  { id: 'ledger', label: 'Ledger', path: `${basePath}/ledger`, navKey: 'ledger' },
  { id: 'adminsettings', label: 'Admin settings', path: `${basePath}/adminsettings`, navKey: 'adminSettings' },
  { id: 'doctors', label: 'Doctors', path: `${basePath}/doctors`, navKey: 'doctors' },
  { id: 'patients', label: 'Patients', path: `${basePath}/patients`, navKey: 'patients' },
  { id: 'appointments', label: 'Appointments', path: `${basePath}/appointments`, navKey: 'appointments' },
  { id: 'reception', label: 'Reception desk', path: `${basePath}/reception`, navKey: 'reception' },
  { id: 'doctor-desk', label: 'Doctor desk', path: `${basePath}/doctor-desk`, navKey: 'doctorDesk' },
  { id: 'pharmacy-desk', label: 'Pharmacy desk (Rx bills)', path: `${basePath}/pharmacy-desk`, navKey: 'pharmacyDesk' },
  { id: 'kitchen-desk', label: 'Kitchen desk', path: `${basePath}/kitchen-desk`, navKey: 'kitchenDesk' },
  { id: 'wards-beds', label: 'Wards & Beds', path: `${basePath}/wards-beds`, navKey: 'wards' },
  { id: 'admissions', label: 'Admissions', path: `${basePath}/admissions`, navKey: 'admissions' },
  { id: 'hospital-billing', label: 'Hospital Billing', path: `${basePath}/hospital-billing`, navKey: 'billing' },
  { id: 'pharmacy', label: 'Pharmacy POS', path: `${basePath}/pharmacy`, navKey: 'pharmacy' },
  { id: 'daybook', label: 'Daybook', path: `${basePath}/daybook`, navKey: 'daybook' },
  { id: 'emr', label: 'EMR', path: `${basePath}/emr`, navKey: 'emr' },
  { id: 'lab', label: 'Lab', path: `${basePath}/lab`, navKey: 'lab' },
  { id: 'blood-bank', label: 'Blood Bank', path: `${basePath}/blood-bank`, navKey: 'bloodBank' },
  { id: 'inventory', label: 'Inventory', path: `${basePath}/inventory`, navKey: 'inventory' },
  { id: 'insurance', label: 'Insurance', path: `${basePath}/insurance`, navKey: 'insurance' },
  { id: 'reports', label: 'Reports', path: `${basePath}/reports`, navKey: 'reports' },
  { id: 'extra-admin', label: 'Extra admin', path: `${basePath}/extra-admin`, navKey: 'extraAdmin' },
];

const HhBasePathContext = createContext(HH_BASE_PATH);

export const HhBasePathProvider = ({ basePath, children }) => (
  <HhBasePathContext.Provider value={basePath || HH_BASE_PATH}>
    {children}
  </HhBasePathContext.Provider>
);

export const useHhBasePath = () => useContext(HhBasePathContext) || HH_BASE_PATH;
