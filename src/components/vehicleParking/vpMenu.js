export const VP_BASE = '/vehicle-parking/user';

export const VP_MENU = [
    { id: 'dashboard', label: 'Dashboard', path: `${VP_BASE}/dashboard`, nav: 'dashboard' },
    { id: 'checkin', label: 'Check-In', path: `${VP_BASE}/check-in`, nav: 'checkin' },
    { id: 'passes', label: 'Passes', path: `${VP_BASE}/passes`, nav: 'passes' },
    { id: 'active', label: 'Active / Check-Out', path: `${VP_BASE}/active`, nav: 'active' },
    { id: 'history', label: 'History', path: `${VP_BASE}/history`, nav: 'history' },
    { id: 'slots', label: 'Slots', path: `${VP_BASE}/slots`, nav: 'slots' },
    { id: 'masters', label: 'Masters', path: `${VP_BASE}/masters`, nav: 'masters' },
    { id: 'accounts', label: 'Ledger', path: `${VP_BASE}/accounts`, nav: 'accounts' },
    { id: 'shifts', label: 'Shifts', path: `${VP_BASE}/shifts`, nav: 'shifts' },
    { id: 'reports', label: 'Reports', path: `${VP_BASE}/reports`, nav: 'reports' },
    { id: 'staff', label: 'Staff', path: `${VP_BASE}/staff`, nav: 'staff' },
    { id: 'settings', label: 'Settings', path: `${VP_BASE}/settings`, nav: 'settings' },
];
