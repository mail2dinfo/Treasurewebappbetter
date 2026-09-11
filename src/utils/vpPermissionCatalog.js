export const VP_FEATURES = Object.freeze({
  dashboard: 'vp_dashboard',
  checkin: 'vp_checkin',
  checkout: 'vp_checkout',
  viewVehicle: 'vp_view_vehicle',
  slots: 'vp_slots_manage',
  rates: 'vp_rates_manage',
  ledger: 'vp_ledger',
  reports: 'vp_reports',
  staff: 'vp_staff_manage',
  shifts: 'vp_shifts',
  settings: 'vp_settings',
  expenses: 'vp_expenses',
});

export const VP_MANAGER_DEFAULT_FEATURES = Object.values(VP_FEATURES);

export const VP_COLLECTOR_DEFAULT_FEATURES = [
  VP_FEATURES.dashboard,
  VP_FEATURES.checkin,
  VP_FEATURES.checkout,
  VP_FEATURES.viewVehicle,
];

export const VP_ACCOUNTANT_DEFAULT_FEATURES = [
  VP_FEATURES.dashboard,
  VP_FEATURES.viewVehicle,
  VP_FEATURES.ledger,
  VP_FEATURES.reports,
  VP_FEATURES.expenses,
];

export const vpPermissionGrantsFeature = (permission, requested) =>
  String(permission || '') === String(requested || '');
