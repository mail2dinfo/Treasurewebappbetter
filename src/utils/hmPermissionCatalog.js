/**
 * Granular Hostel Management feature permissions.
 * Owner (USER) assigns these to Manager; Manager may hire Receptionist only.
 */

export const HM_FEATURE_CATEGORIES = [
  'Overview',
  'Hostels',
  'Floors & Rooms',
  'Residents',
  'Receivables',
  'Payments',
  'Meals',
  'Venues',
  'Ledger',
  'Employee',
  'Receptionist',
  'Kitchen Staff',
];

export const HM_ADMINISTRATION_CATEGORIES = ['Employee', 'Receptionist', 'Kitchen Staff'];

export const HM_HIDDEN_FEATURE_KEYS = new Set([
  'hm_hostel_manage',
  'hm_floor_room_manage',
  'hm_resident_manage',
  'hm_receivable_manage',
  'hm_meals_report',
  'hm_ledger_manage',
]);

/** @type {{ featureKey: string, displayName: string, category: string, defaultRoles: string[] }[]} */
export const HM_GRANULAR_FEATURES = [
  { featureKey: 'hm_dashboard', displayName: 'View Dashboard', category: 'Overview', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },

  { featureKey: 'hm_hostel_view', displayName: 'View', category: 'Hostels', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_hostel_create', displayName: 'Create', category: 'Hostels', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_hostel_delete', displayName: 'Delete', category: 'Hostels', defaultRoles: ['MANAGER'] },

  { featureKey: 'hm_floor_room_view', displayName: 'View', category: 'Floors & Rooms', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hm_floor_room_create', displayName: 'Create', category: 'Floors & Rooms', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_floor_room_delete', displayName: 'Delete', category: 'Floors & Rooms', defaultRoles: ['MANAGER'] },

  { featureKey: 'hm_resident_view', displayName: 'View', category: 'Residents', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hm_resident_create', displayName: 'Create', category: 'Residents', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hm_resident_delete', displayName: 'Checkout / Delete', category: 'Residents', defaultRoles: ['MANAGER'] },

  { featureKey: 'hm_receivable_view', displayName: 'View', category: 'Receivables', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hm_receivable_create', displayName: 'Create', category: 'Receivables', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_receivable_delete', displayName: 'Delete', category: 'Receivables', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_payment_record', displayName: 'Record Payment', category: 'Receivables', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },

  { featureKey: 'hm_payment_view', displayName: 'View Submissions', category: 'Payments', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_payment_verify', displayName: 'Verify', category: 'Payments', defaultRoles: ['MANAGER'] },

  { featureKey: 'hm_meals_view', displayName: 'View Food Report', category: 'Meals', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'KITCHEN_STAFF'] },

  { featureKey: 'hm_venue_view', displayName: 'View Turfs & Courts', category: 'Venues', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hm_venue_create', displayName: 'Create / Edit listings', category: 'Venues', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_venue_delete', displayName: 'Delete listings', category: 'Venues', defaultRoles: ['MANAGER'] },

  { featureKey: 'hm_ledger_view', displayName: 'View', category: 'Ledger', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_ledger_create', displayName: 'Create', category: 'Ledger', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_ledger_delete', displayName: 'Delete', category: 'Ledger', defaultRoles: ['MANAGER'] },

  { featureKey: 'hm_employee_add', displayName: 'Add Employee', category: 'Employee', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_manager_view', displayName: 'View Managers', category: 'Employee', defaultRoles: ['MANAGER'] },

  { featureKey: 'hm_receptionist_view', displayName: 'View', category: 'Receptionist', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_receptionist_add', displayName: 'Add', category: 'Receptionist', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_receptionist_edit', displayName: 'Edit', category: 'Receptionist', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_receptionist_delete', displayName: 'Delete', category: 'Receptionist', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_receptionist_offer_letter', displayName: 'Offer Letter', category: 'Receptionist', defaultRoles: ['MANAGER'] },

  { featureKey: 'hm_kitchen_view', displayName: 'View', category: 'Kitchen Staff', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_kitchen_add', displayName: 'Add', category: 'Kitchen Staff', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_kitchen_edit', displayName: 'Edit', category: 'Kitchen Staff', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_kitchen_delete', displayName: 'Delete', category: 'Kitchen Staff', defaultRoles: ['MANAGER'] },
  { featureKey: 'hm_kitchen_offer_letter', displayName: 'Offer Letter', category: 'Kitchen Staff', defaultRoles: ['MANAGER'] },
];

export const HM_LEGACY_TO_GRANULAR = {
  hm_hostel_manage: ['hm_hostel_view', 'hm_hostel_create', 'hm_hostel_delete'],
  hm_floor_room_manage: ['hm_floor_room_view', 'hm_floor_room_create', 'hm_floor_room_delete'],
  hm_resident_manage: ['hm_resident_view', 'hm_resident_create', 'hm_resident_delete'],
  hm_receivable_manage: ['hm_receivable_view', 'hm_receivable_create', 'hm_receivable_delete', 'hm_payment_record'],
  hm_meals_report: ['hm_meals_view'],
  hm_ledger_manage: ['hm_ledger_view', 'hm_ledger_create', 'hm_ledger_delete'],
};

export const HM_NAV_ANY = {
  dashboard: ['hm_dashboard'],
  hostels: ['hm_hostel_view', 'hm_hostel_create', 'hm_hostel_manage'],
  floorsRooms: ['hm_floor_room_view', 'hm_floor_room_create', 'hm_floor_room_manage'],
  residents: ['hm_resident_view', 'hm_resident_create', 'hm_resident_manage'],
  duesDeck: ['hm_receivable_view', 'hm_receivable_manage'],
  receivables: ['hm_receivable_view', 'hm_receivable_create', 'hm_receivable_manage'],
  outstanding: ['hm_receivable_view', 'hm_receivable_manage'],
  payments: ['hm_payment_view', 'hm_payment_verify', 'hm_receivable_manage'],
  foodReport: ['hm_meals_view', 'hm_meals_report'],
  turfs: ['hm_venue_view', 'hm_venue_create', 'hm_venue_manage', 'hm_hostel_view', 'hm_hostel_manage'],
  shuttleCourts: ['hm_venue_view', 'hm_venue_create', 'hm_venue_manage', 'hm_hostel_view', 'hm_hostel_manage'],
  ledger: ['hm_ledger_view', 'hm_ledger_create', 'hm_ledger_manage'],
  employees: [
    'hm_employee_add',
    'hm_employee_manage',
    'hm_manager_view',
    'hm_receptionist_view',
    'hm_receptionist_add',
    'hm_receptionist_edit',
    'hm_receptionist_delete',
    'hm_receptionist_offer_letter',
    'hm_kitchen_view',
    'hm_kitchen_add',
    'hm_kitchen_edit',
    'hm_kitchen_delete',
    'hm_kitchen_offer_letter',
    'people_access_manage',
  ],
  adminSettings: [
    'hm_hostel_view',
    'hm_hostel_create',
    'hm_hostel_manage',
    'hm_floor_room_view',
    'hm_floor_room_create',
    'hm_floor_room_manage',
    'hm_employee_add',
    'hm_employee_manage',
    'hm_manager_view',
    'hm_receptionist_view',
    'hm_receptionist_add',
    'hm_receptionist_edit',
    'hm_receptionist_delete',
    'hm_receptionist_offer_letter',
    'hm_kitchen_view',
    'hm_kitchen_add',
    'hm_kitchen_edit',
    'hm_kitchen_delete',
    'hm_kitchen_offer_letter',
    'people_access_manage',
  ],
};

export const HM_MANAGER_DEFAULT_FEATURES = HM_GRANULAR_FEATURES.map((f) => f.featureKey);

export const expandHmPermissionMatches = (featureKey) => {
  const key = String(featureKey || '');
  const matches = new Set([key]);
  (HM_LEGACY_TO_GRANULAR[key] || []).forEach((item) => matches.add(item));
  return [...matches];
};

export const hmPermissionGrantsFeature = (assignedPermission, requestedFeature) => {
  const assigned = String(assignedPermission || '');
  const requested = String(requestedFeature || '');
  if (!assigned || !requested) return false;
  if (assigned === requested || assigned === '*') return true;
  return expandHmPermissionMatches(assigned).includes(requested);
};

export const toHmFallbackFeature = (feature) => ({
  featureKey: feature.featureKey,
  displayName: feature.displayName,
  category: feature.category,
  defaultRoles: feature.defaultRoles,
});

/** HR keys never delegated onto Receptionist / Kitchen Staff enrollments. */
export const HM_ROLE_PACKAGE_EXCLUDED_KEYS = new Set([
  'people_access_manage',
  'hm_employee_add',
  'hm_employee_manage',
  'hm_manager_view',
  'hm_receptionist_view',
  'hm_receptionist_add',
  'hm_receptionist_edit',
  'hm_receptionist_delete',
  'hm_receptionist_offer_letter',
  'hm_kitchen_view',
  'hm_kitchen_add',
  'hm_kitchen_edit',
  'hm_kitchen_delete',
  'hm_kitchen_offer_letter',
  ...HM_HIDDEN_FEATURE_KEYS,
]);

export const hmFeaturesAssignableToRole = (features, roleCode, getFeatureKeyFn, getDefaultRolesFn) => {
  const normalizedRole = String(roleCode || '').toUpperCase();
  if (normalizedRole === 'MANAGER') return [];
  return (features || []).filter((feature) => {
    const featureKey = getFeatureKeyFn?.(feature) || feature.featureKey || feature.feature_key;
    if (featureKey && HM_ROLE_PACKAGE_EXCLUDED_KEYS.has(featureKey)) return false;
    if (featureKey && HM_HIDDEN_FEATURE_KEYS.has(featureKey)) return false;
    const defaults = (getDefaultRolesFn?.(feature) || feature.defaultRoles || feature.default_roles || [])
      .map((role) => String(role).toUpperCase());
    if (normalizedRole === 'RECEPTIONIST') {
      return defaults.includes('RECEPTIONIST');
    }
    if (normalizedRole === 'KITCHEN_STAFF') {
      return defaults.includes('KITCHEN_STAFF');
    }
    return Boolean(featureKey);
  });
};
