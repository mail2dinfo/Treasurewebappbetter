/**
 * Granular Hospital Management feature permissions.
 * Owner (USER) assigns these to Manager; Manager may hire Receptionist.
 */

export const HH_FEATURE_CATEGORIES = [
  'Overview',
  'Hospital',
  'Doctors',
  'Patients',
  'Appointments',
  'Wards',
  'Beds',
  'Admissions',
  'Billing',
  'Pharmacy',
  'Ledger',
  'Daybook',
  'EMR',
  'Lab',
  'BloodBank',
  'Inventory',
  'Insurance',
  'Reports',
  'ExtraAdmin',
  'Settings',
  'Employee',
  'Manager',
  'Receptionist',
];

export const HH_ADMINISTRATION_CATEGORIES = ['Employee', 'Manager', 'Receptionist'];

export const HH_LEGACY_TO_GRANULAR = {};

export const HH_HIDDEN_FEATURE_KEYS = new Set([]);

/** @type {{ featureKey: string, displayName: string, category: string, defaultRoles: string[] }[]} */
export const HH_GRANULAR_FEATURES = [
  { featureKey: 'hh_dashboard', displayName: 'View Dashboard', category: 'Overview', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },

  { featureKey: 'hh_hospital_view', displayName: 'View Hospital', category: 'Hospital', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_hospital_manage', displayName: 'Manage Hospital', category: 'Hospital', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_doctor_view', displayName: 'View Doctors', category: 'Doctors', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_doctor_manage', displayName: 'Manage Doctors', category: 'Doctors', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_patient_view', displayName: 'View Patients', category: 'Patients', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_patient_manage', displayName: 'Manage Patients', category: 'Patients', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },

  { featureKey: 'hh_appointment_view', displayName: 'View Appointments', category: 'Appointments', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_appointment_manage', displayName: 'Manage Appointments', category: 'Appointments', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },

  { featureKey: 'hh_ward_view', displayName: 'View Wards', category: 'Wards', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_ward_manage', displayName: 'Manage Wards', category: 'Wards', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_bed_view', displayName: 'View Beds', category: 'Beds', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_bed_manage', displayName: 'Manage Beds', category: 'Beds', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_admission_view', displayName: 'View Admissions', category: 'Admissions', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_admission_manage', displayName: 'Manage Admissions', category: 'Admissions', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_billing_view', displayName: 'View Billing', category: 'Billing', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_billing_manage', displayName: 'Record Payments', category: 'Billing', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },

  { featureKey: 'hh_pharmacy_view', displayName: 'View Pharmacy', category: 'Pharmacy', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_pharmacy_manage', displayName: 'Manage Pharmacy', category: 'Pharmacy', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_ledger_view', displayName: 'View Ledger', category: 'Ledger', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_ledger_manage', displayName: 'Manage Ledger', category: 'Ledger', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_daybook_view', displayName: 'View Daybook', category: 'Daybook', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_emr_view', displayName: 'View EMR', category: 'EMR', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_emr_manage', displayName: 'Manage EMR', category: 'EMR', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_lab_view', displayName: 'View Lab', category: 'Lab', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_lab_manage', displayName: 'Manage Lab', category: 'Lab', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_blood_bank_view', displayName: 'View Blood Bank', category: 'BloodBank', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_blood_bank_manage', displayName: 'Manage Blood Bank', category: 'BloodBank', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_inventory_view', displayName: 'View Inventory', category: 'Inventory', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_inventory_manage', displayName: 'Manage Inventory', category: 'Inventory', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_insurance_view', displayName: 'View Insurance', category: 'Insurance', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_insurance_manage', displayName: 'Manage Insurance', category: 'Insurance', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_reports_view', displayName: 'View Reports', category: 'Reports', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_extra_admin', displayName: 'Extra Admin Settings', category: 'ExtraAdmin', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_settings', displayName: 'Admin Settings', category: 'Settings', defaultRoles: [] },

  { featureKey: 'hh_employee_manage', displayName: 'Manage All Employees', category: 'Employee', defaultRoles: [] },
  { featureKey: 'hh_manager_view', displayName: 'View Managers', category: 'Manager', defaultRoles: [] },
  { featureKey: 'hh_manager_add', displayName: 'Add Manager', category: 'Manager', defaultRoles: [] },

  { featureKey: 'hh_receptionist_view', displayName: 'View Receptionists', category: 'Receptionist', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_receptionist_add', displayName: 'Add Receptionist', category: 'Receptionist', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_receptionist_edit', displayName: 'Edit Receptionist', category: 'Receptionist', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_receptionist_delete', displayName: 'Delete Receptionist', category: 'Receptionist', defaultRoles: ['MANAGER'] },
];

export const HH_NAV_ANY = {
  dashboard: ['hh_dashboard'],
  hospital: ['hh_hospital_view', 'hh_hospital_manage'],
  doctors: ['hh_doctor_view', 'hh_doctor_manage'],
  patients: ['hh_patient_view', 'hh_patient_manage'],
  appointments: ['hh_appointment_view', 'hh_appointment_manage'],
  wards: ['hh_ward_view', 'hh_ward_manage', 'hh_bed_view', 'hh_bed_manage'],
  admissions: ['hh_admission_view', 'hh_admission_manage'],
  billing: ['hh_billing_view', 'hh_billing_manage'],
  pharmacy: ['hh_pharmacy_view', 'hh_pharmacy_manage'],
  ledger: ['hh_ledger_view', 'hh_ledger_manage'],
  daybook: ['hh_daybook_view'],
  emr: ['hh_emr_view', 'hh_emr_manage'],
  lab: ['hh_lab_view', 'hh_lab_manage'],
  bloodBank: ['hh_blood_bank_view', 'hh_blood_bank_manage'],
  inventory: ['hh_inventory_view', 'hh_inventory_manage'],
  insurance: ['hh_insurance_view', 'hh_insurance_manage'],
  reports: ['hh_reports_view'],
  extraAdmin: ['hh_extra_admin'],
  employees: [
    'hh_employee_manage',
    'hh_manager_view',
    'hh_manager_add',
    'hh_receptionist_view',
    'hh_receptionist_add',
    'hh_receptionist_edit',
    'hh_receptionist_delete',
    'people_access_manage',
  ],
  adminSettings: [
    'hh_settings',
    'hh_hospital_view',
    'hh_hospital_manage',
    'hh_employee_manage',
    'hh_manager_view',
    'hh_manager_add',
    'hh_receptionist_view',
    'hh_receptionist_add',
    'hh_receptionist_edit',
    'hh_receptionist_delete',
    'people_access_manage',
  ],
};

export const HH_MANAGER_DEFAULT_FEATURES = HH_GRANULAR_FEATURES.map((f) => f.featureKey);

export const HH_RECEPTIONIST_DEFAULT_FEATURES = [
  'hh_dashboard',
  'hh_doctor_view',
  'hh_patient_view',
  'hh_patient_manage',
  'hh_appointment_view',
  'hh_appointment_manage',
  'hh_ward_view',
  'hh_bed_view',
  'hh_admission_view',
  'hh_billing_view',
  'hh_billing_manage',
  'hh_pharmacy_view',
  'hh_emr_view',
  'hh_lab_view',
  'hh_blood_bank_view',
];

export const expandHhPermissionMatches = (featureKey) => {
  const key = String(featureKey || '');
  const matches = new Set([key]);
  (HH_LEGACY_TO_GRANULAR[key] || []).forEach((item) => matches.add(item));
  return [...matches];
};

export const hhPermissionGrantsFeature = (assignedPermission, requestedFeature) => {
  const assigned = String(assignedPermission || '');
  const requested = String(requestedFeature || '');
  if (!assigned || !requested) return false;
  if (assigned === requested || assigned === '*') return true;
  return expandHhPermissionMatches(assigned).includes(requested);
};

export const toHhFallbackFeature = (feature) => ({
  featureKey: feature.featureKey,
  displayName: feature.displayName,
  category: feature.category,
  defaultRoles: feature.defaultRoles,
});

/** HR keys never delegated onto Receptionist enrollments. */
export const HH_ROLE_PACKAGE_EXCLUDED_KEYS = new Set([
  'people_access_manage',
  'hh_employee_manage',
  'hh_manager_view',
  'hh_manager_add',
  'hh_receptionist_view',
  'hh_receptionist_add',
  'hh_receptionist_edit',
  'hh_receptionist_delete',
  'hh_settings',
  'hh_extra_admin',
  ...HH_HIDDEN_FEATURE_KEYS,
]);

export const hhFeaturesAssignableToRole = (features, roleCode, getFeatureKeyFn, getDefaultRolesFn) => {
  const normalizedRole = String(roleCode || '').toUpperCase();
  if (normalizedRole === 'MANAGER') return [];
  return (features || []).filter((feature) => {
    const featureKey = getFeatureKeyFn?.(feature) || feature.featureKey || feature.feature_key;
    if (featureKey && HH_ROLE_PACKAGE_EXCLUDED_KEYS.has(featureKey)) return false;
    if (featureKey && HH_HIDDEN_FEATURE_KEYS.has(featureKey)) return false;
    const defaults = (getDefaultRolesFn?.(feature) || feature.defaultRoles || feature.default_roles || [])
      .map((role) => String(role).toUpperCase());
    if (normalizedRole === 'RECEPTIONIST') {
      return defaults.includes('RECEPTIONIST');
    }
    return Boolean(featureKey);
  });
};
