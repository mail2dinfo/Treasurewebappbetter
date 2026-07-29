export const HM_BASE_PATH = '/hostel-management/user';
export const HM_RESIDENT_BASE_PATH = '/hostel-management/resident';

export const getHostelManagementMenuItems = (basePath = HM_BASE_PATH) => [
  { id: 'dashboard', label: 'Dashboard', path: `${basePath}/dashboard`, navKey: 'dashboard' },
  { id: 'residents', label: 'Residents', path: `${basePath}/residents`, navKey: 'residents' },
  { id: 'dues-deck', label: 'Bed Deck', path: `${basePath}/dues-deck`, navKey: 'duesDeck' },
  { id: 'receivables', label: 'Receivables', path: `${basePath}/receivables`, navKey: 'receivables' },
  { id: 'outstanding', label: 'Outstanding', path: `${basePath}/outstanding`, navKey: 'outstanding' },
  { id: 'food-report', label: 'Food Report', path: `${basePath}/food-report`, navKey: 'foodReport' },
  { id: 'special-orders', label: 'Special Orders', path: `${basePath}/special-orders`, navKey: 'foodReport' },
  { id: 'ledger', label: 'Ledger', path: `${basePath}/ledger`, navKey: 'ledger' },
  { id: 'adminsettings', label: 'Admin settings', path: `${basePath}/adminsettings`, navKey: 'adminSettings' },
  { id: 'billing', label: 'Billing', path: `${basePath}/billing`, navKey: null },
];
