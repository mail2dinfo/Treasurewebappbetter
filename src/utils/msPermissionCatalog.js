/**
 * Granular Mutton Stall POS feature permissions.
 * Owner (USER) assigns these to Manager; Manager may hire Salesman.
 */

export const MS_FEATURE_CATEGORIES = [
  'Overview',
  'Stock',
  'Orders',
  'Customers',
  'Billing',
  'Reports',
  'Ledger',
  'Daybook',
  'Settings',
  'Employee',
  'Manager',
  'Salesman',
];

export const MS_ADMINISTRATION_CATEGORIES = ['Employee', 'Manager', 'Salesman'];

export const MS_LEGACY_TO_GRANULAR = {};

export const MS_HIDDEN_FEATURE_KEYS = new Set([]);

/** @type {{ featureKey: string, displayName: string, category: string, defaultRoles: string[] }[]} */
export const MS_GRANULAR_FEATURES = [
  { featureKey: 'ms_dashboard', displayName: 'View Dashboard', category: 'Overview', defaultRoles: ['MANAGER', 'SALESMAN'] },

  { featureKey: 'ms_stock_view', displayName: 'View Stock', category: 'Stock', defaultRoles: ['MANAGER'] },
  { featureKey: 'ms_stock_update', displayName: 'Update Stock', category: 'Stock', defaultRoles: ['MANAGER'] },

  { featureKey: 'ms_orders_view', displayName: 'View Orders', category: 'Orders', defaultRoles: ['MANAGER', 'SALESMAN'] },
  { featureKey: 'ms_orders_update', displayName: 'Update Order Status', category: 'Orders', defaultRoles: ['MANAGER', 'SALESMAN'] },

  { featureKey: 'ms_customers_view', displayName: 'View Customers', category: 'Customers', defaultRoles: ['MANAGER'] },
  { featureKey: 'ms_customers_manage', displayName: 'Manage Customers', category: 'Customers', defaultRoles: ['MANAGER'] },

  { featureKey: 'ms_billing_view', displayName: 'View Billing', category: 'Billing', defaultRoles: ['MANAGER'] },
  { featureKey: 'ms_billing_create', displayName: 'Create Bills', category: 'Billing', defaultRoles: ['MANAGER'] },

  { featureKey: 'ms_reports_view', displayName: 'View Reports', category: 'Reports', defaultRoles: ['MANAGER'] },

  { featureKey: 'ms_ledger_view', displayName: 'View Ledger', category: 'Ledger', defaultRoles: ['MANAGER'] },
  { featureKey: 'ms_ledger_manage', displayName: 'Manage Ledger', category: 'Ledger', defaultRoles: ['MANAGER'] },

  { featureKey: 'ms_daybook_view', displayName: 'View Daybook', category: 'Daybook', defaultRoles: ['MANAGER'] },

  { featureKey: 'ms_settings', displayName: 'Admin Settings', category: 'Settings', defaultRoles: [] },

  { featureKey: 'ms_employee_manage', displayName: 'Manage All Employees', category: 'Employee', defaultRoles: [] },
  { featureKey: 'ms_manager_view', displayName: 'View Managers', category: 'Manager', defaultRoles: [] },
  { featureKey: 'ms_manager_add', displayName: 'Add Manager', category: 'Manager', defaultRoles: [] },

  { featureKey: 'ms_salesman_view', displayName: 'View Salesmen', category: 'Salesman', defaultRoles: ['MANAGER'] },
  { featureKey: 'ms_salesman_add', displayName: 'Add Salesman', category: 'Salesman', defaultRoles: ['MANAGER'] },
  { featureKey: 'ms_salesman_edit', displayName: 'Edit Salesman', category: 'Salesman', defaultRoles: ['MANAGER'] },
  { featureKey: 'ms_salesman_delete', displayName: 'Delete Salesman', category: 'Salesman', defaultRoles: ['MANAGER'] },
];

export const MS_NAV_ANY = {
  dashboard: ['ms_dashboard'],
  stock: ['ms_stock_view', 'ms_stock_update'],
  orders: ['ms_orders_view', 'ms_orders_update'],
  customers: ['ms_customers_view', 'ms_customers_manage'],
  billing: ['ms_billing_view', 'ms_billing_create'],
  reports: ['ms_reports_view'],
  ledger: ['ms_ledger_view', 'ms_ledger_manage'],
  daybook: ['ms_daybook_view'],
  employees: [
    'ms_employee_manage',
    'ms_manager_view',
    'ms_manager_add',
    'ms_salesman_view',
    'ms_salesman_add',
    'ms_salesman_edit',
    'ms_salesman_delete',
    'people_access_manage',
  ],
  adminSettings: [
    'ms_settings',
    'ms_stock_view',
    'ms_stock_update',
    'ms_employee_manage',
    'ms_manager_view',
    'ms_manager_add',
    'ms_salesman_view',
    'ms_salesman_add',
    'ms_salesman_edit',
    'ms_salesman_delete',
    'people_access_manage',
  ],
};

export const MS_MANAGER_DEFAULT_FEATURES = MS_GRANULAR_FEATURES.map((f) => f.featureKey);

export const MS_SALESMAN_DEFAULT_FEATURES = [
  'ms_dashboard',
  'ms_orders_view',
  'ms_orders_update',
];

export const expandMsPermissionMatches = (featureKey) => {
  const key = String(featureKey || '');
  const matches = new Set([key]);
  (MS_LEGACY_TO_GRANULAR[key] || []).forEach((item) => matches.add(item));
  return [...matches];
};

export const msPermissionGrantsFeature = (assignedPermission, requestedFeature) => {
  const assigned = String(assignedPermission || '');
  const requested = String(requestedFeature || '');
  if (!assigned || !requested) return false;
  if (assigned === requested || assigned === '*') return true;
  return expandMsPermissionMatches(assigned).includes(requested);
};

export const toMsFallbackFeature = (feature) => ({
  featureKey: feature.featureKey,
  displayName: feature.displayName,
  category: feature.category,
  defaultRoles: feature.defaultRoles,
});

/** HR keys never delegated onto Salesman enrollments. */
export const MS_ROLE_PACKAGE_EXCLUDED_KEYS = new Set([
  'people_access_manage',
  'ms_employee_manage',
  'ms_manager_view',
  'ms_manager_add',
  'ms_salesman_view',
  'ms_salesman_add',
  'ms_salesman_edit',
  'ms_salesman_delete',
  'ms_settings',
  ...MS_HIDDEN_FEATURE_KEYS,
]);

export const msFeaturesAssignableToRole = (features, roleCode, getFeatureKeyFn, getDefaultRolesFn) => {
  const normalizedRole = String(roleCode || '').toUpperCase();
  if (normalizedRole === 'MANAGER') return [];
  return (features || []).filter((feature) => {
    const featureKey = getFeatureKeyFn?.(feature) || feature.featureKey || feature.feature_key;
    if (featureKey && MS_ROLE_PACKAGE_EXCLUDED_KEYS.has(featureKey)) return false;
    if (featureKey && MS_HIDDEN_FEATURE_KEYS.has(featureKey)) return false;
    const defaults = (getDefaultRolesFn?.(feature) || feature.defaultRoles || feature.default_roles || [])
      .map((role) => String(role).toUpperCase());
    if (normalizedRole === 'SALESMAN') {
      return defaults.includes('SALESMAN');
    }
    return Boolean(featureKey);
  });
};
