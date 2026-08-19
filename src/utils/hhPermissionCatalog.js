/**
 * Granular Hospital Management feature permissions.
 * Owner assigns to Manager; Manager hires staff roles with responsibility packages.
 */

export const HH_STAFF_ROLES = ['RECEPTIONIST', 'PHARMACIST', 'DOCTOR', 'NURSE', 'COMPOUNDER', 'KITCHEN_STAFF'];

export const HH_FEATURE_CATEGORIES = [
  'Overview',
  'Hospital',
  'Doctors',
  'Patients',
  'Appointments',
  'Clinical',
  'Wards',
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
  'Pharmacist',
  'DoctorStaff',
  'Nurse',
  'Compounder',
  'Kitchen',
  'KitchenStaff',
];

export const HH_ADMINISTRATION_CATEGORIES = [
  'Employee',
  'Manager',
  'Receptionist',
  'Pharmacist',
  'DoctorStaff',
  'Nurse',
  'Compounder',
  'KitchenStaff',
];

export const HH_LEGACY_TO_GRANULAR = {};

export const HH_HIDDEN_FEATURE_KEYS = new Set([]);

/** @type {{ featureKey: string, displayName: string, category: string, defaultRoles: string[] }[]} */
export const HH_GRANULAR_FEATURES = [
  { featureKey: 'hh_dashboard', displayName: 'View Dashboard', category: 'Overview', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'PHARMACIST', 'DOCTOR', 'NURSE', 'COMPOUNDER', 'KITCHEN_STAFF'] },

  { featureKey: 'hh_hospital_view', displayName: 'View Hospital', category: 'Hospital', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_hospital_manage', displayName: 'Manage Hospital', category: 'Hospital', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_doctor_view', displayName: 'View Doctors', category: 'Doctors', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'DOCTOR'] },
  { featureKey: 'hh_doctor_manage', displayName: 'Manage Doctors', category: 'Doctors', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_patient_view', displayName: 'View Patients', category: 'Patients', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'PHARMACIST', 'DOCTOR', 'NURSE', 'COMPOUNDER', 'KITCHEN_STAFF'] },
  { featureKey: 'hh_patient_manage', displayName: 'Manage Patients', category: 'Patients', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'DOCTOR'] },

  { featureKey: 'hh_appointment_view', displayName: 'View Appointments', category: 'Appointments', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'DOCTOR'] },
  { featureKey: 'hh_appointment_manage', displayName: 'Manage Appointments', category: 'Appointments', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'DOCTOR'] },

  { featureKey: 'hh_reception_desk', displayName: 'Reception Desk', category: 'Clinical', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_doctor_desk', displayName: 'Doctor Desk', category: 'Clinical', defaultRoles: ['MANAGER', 'DOCTOR'] },
  { featureKey: 'hh_pharmacy_desk', displayName: 'Pharmacy Desk', category: 'Clinical', defaultRoles: ['MANAGER', 'PHARMACIST', 'COMPOUNDER'] },
  { featureKey: 'hh_kitchen_desk', displayName: 'Kitchen Desk', category: 'Clinical', defaultRoles: ['MANAGER', 'KITCHEN_STAFF'] },
  { featureKey: 'hh_kitchen_menu', displayName: 'Kitchen Menu', category: 'Kitchen', defaultRoles: ['MANAGER', 'KITCHEN_STAFF'] },
  { featureKey: 'hh_kitchen_order', displayName: 'Order Ward Food', category: 'Kitchen', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'NURSE', 'DOCTOR', 'KITCHEN_STAFF'] },

  { featureKey: 'hh_ward_view', displayName: 'View Wards & Beds', category: 'Wards', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'DOCTOR', 'NURSE'] },
  { featureKey: 'hh_ward_manage', displayName: 'Manage Wards & Beds', category: 'Wards', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_admission_view', displayName: 'View Admissions', category: 'Admissions', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'PHARMACIST', 'DOCTOR', 'NURSE', 'KITCHEN_STAFF'] },
  { featureKey: 'hh_admission_manage', displayName: 'Manage Admissions', category: 'Admissions', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'NURSE'] },

  { featureKey: 'hh_billing_view', displayName: 'View Billing', category: 'Billing', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },
  { featureKey: 'hh_billing_manage', displayName: 'Record Payments', category: 'Billing', defaultRoles: ['MANAGER', 'RECEPTIONIST'] },

  { featureKey: 'hh_pharmacy_view', displayName: 'View Pharmacy', category: 'Pharmacy', defaultRoles: ['MANAGER', 'PHARMACIST', 'COMPOUNDER'] },
  { featureKey: 'hh_pharmacy_manage', displayName: 'Manage Pharmacy', category: 'Pharmacy', defaultRoles: ['MANAGER', 'PHARMACIST'] },

  { featureKey: 'hh_ledger_view', displayName: 'View Ledger', category: 'Ledger', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_ledger_manage', displayName: 'Manage Ledger', category: 'Ledger', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_daybook_view', displayName: 'View Daybook', category: 'Daybook', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_emr_view', displayName: 'View EMR', category: 'EMR', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'DOCTOR', 'NURSE'] },
  { featureKey: 'hh_emr_manage', displayName: 'Manage EMR', category: 'EMR', defaultRoles: ['MANAGER', 'DOCTOR', 'NURSE'] },

  { featureKey: 'hh_lab_view', displayName: 'View Lab', category: 'Lab', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'DOCTOR', 'NURSE'] },
  { featureKey: 'hh_lab_manage', displayName: 'Manage Lab', category: 'Lab', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_blood_bank_view', displayName: 'View Blood Bank', category: 'BloodBank', defaultRoles: ['MANAGER', 'RECEPTIONIST', 'NURSE'] },
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

  { featureKey: 'hh_pharmacist_view', displayName: 'View Pharmacists', category: 'Pharmacist', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_pharmacist_add', displayName: 'Add Pharmacist', category: 'Pharmacist', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_pharmacist_edit', displayName: 'Edit Pharmacist', category: 'Pharmacist', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_pharmacist_delete', displayName: 'Delete Pharmacist', category: 'Pharmacist', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_doctor_staff_view', displayName: 'View Doctors (staff)', category: 'DoctorStaff', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_doctor_staff_add', displayName: 'Add Doctor (staff)', category: 'DoctorStaff', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_doctor_staff_edit', displayName: 'Edit Doctor (staff)', category: 'DoctorStaff', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_doctor_staff_delete', displayName: 'Delete Doctor (staff)', category: 'DoctorStaff', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_nurse_view', displayName: 'View Nurses', category: 'Nurse', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_nurse_add', displayName: 'Add Nurse', category: 'Nurse', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_nurse_edit', displayName: 'Edit Nurse', category: 'Nurse', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_nurse_delete', displayName: 'Delete Nurse', category: 'Nurse', defaultRoles: ['MANAGER'] },

  { featureKey: 'hh_compounder_view', displayName: 'View Compounders', category: 'Compounder', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_compounder_add', displayName: 'Add Compounder', category: 'Compounder', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_compounder_edit', displayName: 'Edit Compounder', category: 'Compounder', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_compounder_delete', displayName: 'Delete Compounder', category: 'Compounder', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_kitchen_staff_view', displayName: 'View Kitchen Staff', category: 'KitchenStaff', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_kitchen_staff_add', displayName: 'Add Kitchen Staff', category: 'KitchenStaff', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_kitchen_staff_edit', displayName: 'Edit Kitchen Staff', category: 'KitchenStaff', defaultRoles: ['MANAGER'] },
  { featureKey: 'hh_kitchen_staff_delete', displayName: 'Delete Kitchen Staff', category: 'KitchenStaff', defaultRoles: ['MANAGER'] },
];

export const HH_NAV_ANY = {
  dashboard: ['hh_dashboard'],
  hospital: ['hh_hospital_view', 'hh_hospital_manage'],
  doctors: ['hh_doctor_view', 'hh_doctor_manage'],
  patients: ['hh_patient_view', 'hh_patient_manage'],
  appointments: ['hh_appointment_view', 'hh_appointment_manage'],
  reception: ['hh_reception_desk'],
  doctorDesk: ['hh_doctor_desk'],
  pharmacyDesk: ['hh_pharmacy_desk', 'hh_pharmacy_view', 'hh_pharmacy_manage', 'hh_billing_manage'],
  kitchenDesk: ['hh_kitchen_desk'],
  kitchenMenu: ['hh_kitchen_menu'],
  kitchenOrder: ['hh_kitchen_order'],
  wards: ['hh_ward_view', 'hh_ward_manage'],
  admissions: ['hh_admission_view', 'hh_admission_manage'],
  billing: ['hh_billing_view', 'hh_billing_manage'],
  pharmacy: ['hh_pharmacy_view', 'hh_pharmacy_manage', 'hh_pharmacy_desk'],
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
    'hh_pharmacist_view',
    'hh_pharmacist_add',
    'hh_pharmacist_edit',
    'hh_pharmacist_delete',
    'hh_doctor_staff_view',
    'hh_doctor_staff_add',
    'hh_doctor_staff_edit',
    'hh_doctor_staff_delete',
    'hh_nurse_view',
    'hh_nurse_add',
    'hh_nurse_edit',
    'hh_nurse_delete',
    'hh_compounder_view',
    'hh_compounder_add',
    'hh_compounder_edit',
    'hh_compounder_delete',
    'hh_kitchen_staff_view',
    'hh_kitchen_staff_add',
    'hh_kitchen_staff_edit',
    'hh_kitchen_staff_delete',
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
    'hh_pharmacist_view',
    'hh_pharmacist_add',
    'hh_pharmacist_edit',
    'hh_pharmacist_delete',
    'hh_doctor_staff_view',
    'hh_doctor_staff_add',
    'hh_doctor_staff_edit',
    'hh_doctor_staff_delete',
    'hh_nurse_view',
    'hh_nurse_add',
    'hh_nurse_edit',
    'hh_nurse_delete',
    'hh_compounder_view',
    'hh_compounder_add',
    'hh_compounder_edit',
    'hh_compounder_delete',
    'hh_kitchen_staff_view',
    'hh_kitchen_staff_add',
    'hh_kitchen_staff_edit',
    'hh_kitchen_staff_delete',
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
  'hh_admission_view',
  'hh_billing_view',
  'hh_billing_manage',
  'hh_emr_view',
  'hh_lab_view',
  'hh_blood_bank_view',
  'hh_reception_desk',
  'hh_kitchen_order',
];

export const HH_PHARMACIST_DEFAULT_FEATURES = [
  'hh_dashboard',
  'hh_patient_view',
  'hh_admission_view',
  'hh_pharmacy_desk',
  'hh_pharmacy_view',
  'hh_pharmacy_manage',
];

export const HH_DOCTOR_DEFAULT_FEATURES = [
  'hh_dashboard',
  'hh_doctor_view',
  'hh_patient_view',
  'hh_patient_manage',
  'hh_appointment_view',
  'hh_appointment_manage',
  'hh_doctor_desk',
  'hh_ward_view',
  'hh_admission_view',
  'hh_emr_view',
  'hh_emr_manage',
  'hh_lab_view',
];

export const HH_NURSE_DEFAULT_FEATURES = [
  'hh_dashboard',
  'hh_patient_view',
  'hh_ward_view',
  'hh_admission_view',
  'hh_admission_manage',
  'hh_emr_view',
  'hh_emr_manage',
  'hh_lab_view',
  'hh_blood_bank_view',
  'hh_kitchen_order',
];

export const HH_COMPOUNDER_DEFAULT_FEATURES = [
  'hh_dashboard',
  'hh_patient_view',
  'hh_pharmacy_desk',
  'hh_pharmacy_view',
];

export const HH_KITCHEN_DEFAULT_FEATURES = [
  'hh_dashboard',
  'hh_patient_view',
  'hh_admission_view',
  'hh_kitchen_desk',
  'hh_kitchen_menu',
  'hh_kitchen_order',
];

/** Bed keys were never seeded on the API; ward permissions cover beds. */
const HH_FEATURE_ALIASES = {
  hh_ward_view: ['hh_bed_view'],
  hh_ward_manage: ['hh_bed_manage'],
  hh_bed_view: ['hh_ward_view'],
  hh_bed_manage: ['hh_ward_manage'],
};

export const expandHhPermissionMatches = (featureKey) => {
  const key = String(featureKey || '');
  const matches = new Set([key]);
  (HH_LEGACY_TO_GRANULAR[key] || []).forEach((item) => matches.add(item));
  (HH_FEATURE_ALIASES[key] || []).forEach((item) => matches.add(item));
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

/** HR keys never delegated onto staff enrollments. */
export const HH_ROLE_PACKAGE_EXCLUDED_KEYS = new Set([
  'people_access_manage',
  'hh_employee_manage',
  'hh_manager_view',
  'hh_manager_add',
  'hh_receptionist_view',
  'hh_receptionist_add',
  'hh_receptionist_edit',
  'hh_receptionist_delete',
  'hh_pharmacist_view',
  'hh_pharmacist_add',
  'hh_pharmacist_edit',
  'hh_pharmacist_delete',
  'hh_doctor_staff_view',
  'hh_doctor_staff_add',
  'hh_doctor_staff_edit',
  'hh_doctor_staff_delete',
  'hh_nurse_view',
  'hh_nurse_add',
  'hh_nurse_edit',
  'hh_nurse_delete',
  'hh_compounder_view',
  'hh_compounder_add',
  'hh_compounder_edit',
  'hh_compounder_delete',
  'hh_kitchen_staff_view',
  'hh_kitchen_staff_add',
  'hh_kitchen_staff_edit',
  'hh_kitchen_staff_delete',
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
    if (HH_STAFF_ROLES.includes(normalizedRole)) {
      return defaults.includes(normalizedRole);
    }
    return Boolean(featureKey);
  });
};
