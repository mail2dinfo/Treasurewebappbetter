/**
 * Granular Chit Fund feature permissions.
 * Prefer these over legacy "manage" keys; aliases keep old grants working.
 */

export const CHIT_FEATURE_CATEGORIES = [
    // Collector portal (maps to /chit-fund/collector/*)
    'Collector Portal',
    'Home',
    'Groups',
    'Subscribers',
    'Receivables',
    'Payables',
    'Area',
    'Products',
    'Ledger',
    'Reports',
    'Auctions',
    // Shown together under Administration in People & Access Step 3
    'Employee',
    'Collector',
    'Accountant',
];

/** HR categories grouped under Administration (like Vehicle Finance). */
export const CHIT_ADMINISTRATION_CATEGORIES = ['Employee', 'Collector', 'Accountant'];

/**
 * Legacy / duplicate keys that must not appear in Step 3
 * (replaced by Collector Portal + Receivables View/Pay).
 */
export const CHIT_HIDDEN_FEATURE_KEYS = new Set([
    'chit_collector_collect_receivables',
    'chit_collections',
    'chit_collector_portal',
    'chit_collector_receivables',
    'chit_collector_collections',
    'chit_collector_receipts',
]);

/** @type {{ featureKey: string, displayName: string, category: string, defaultRoles: string[] }[]} */
export const CHIT_GRANULAR_FEATURES = [
    // Collector Portal — same screens as /chit-fund/collector/dashboard
    { featureKey: 'chit_collector_dashboard', displayName: 'Show Dashboard', category: 'Collector Portal', defaultRoles: ['COLLECTOR'] },
    { featureKey: 'chit_collector_advances', displayName: 'Show Advance History', category: 'Collector Portal', defaultRoles: ['COLLECTOR'] },

    // Home
    { featureKey: 'chit_home_view_receivable', displayName: 'View Receivable', category: 'Home', defaultRoles: ['MANAGER', 'ACCOUNTANT'] },
    { featureKey: 'chit_home_view_payable', displayName: 'View Payable', category: 'Home', defaultRoles: ['MANAGER', 'ACCOUNTANT'] },

    // Groups
    { featureKey: 'chit_group_view', displayName: 'View Groups', category: 'Groups', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_group_start', displayName: 'Start a Group', category: 'Groups', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_auction_manage', displayName: 'Manage Auctions', category: 'Auctions', defaultRoles: ['MANAGER'] },

    // Subscribers (not part of Collector portal)
    { featureKey: 'chit_subscriber_view', displayName: 'View Subscriber', category: 'Subscribers', defaultRoles: ['MANAGER', 'ACCOUNTANT'] },
    { featureKey: 'chit_subscriber_add', displayName: 'Add Subscriber', category: 'Subscribers', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_subscriber_delete', displayName: 'Delete Subscriber', category: 'Subscribers', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_subscriber_change_password', displayName: 'Change Password for Subscriber', category: 'Subscribers', defaultRoles: ['MANAGER'] },

    // Receivables — View + Pay (collector portal receivables)
    { featureKey: 'chit_receivables_view', displayName: 'View Receivables', category: 'Receivables', defaultRoles: ['MANAGER', 'ACCOUNTANT', 'COLLECTOR'] },
    { featureKey: 'chit_receivables_pay', displayName: 'Pay', category: 'Receivables', defaultRoles: ['MANAGER', 'COLLECTOR'] },

    // Payables
    { featureKey: 'chit_payables_view', displayName: 'View', category: 'Payables', defaultRoles: ['MANAGER', 'ACCOUNTANT'] },
    { featureKey: 'chit_payables_pay', displayName: 'Pay', category: 'Payables', defaultRoles: ['MANAGER', 'ACCOUNTANT'] },

    // Area
    { featureKey: 'chit_area_view', displayName: 'View', category: 'Area', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_area_add', displayName: 'Add', category: 'Area', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_area_delete', displayName: 'Delete', category: 'Area', defaultRoles: ['MANAGER'] },

    // Products
    { featureKey: 'chit_product_view', displayName: 'View', category: 'Products', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_product_add', displayName: 'Add', category: 'Products', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_product_edit', displayName: 'Edit', category: 'Products', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_product_delete', displayName: 'Delete', category: 'Products', defaultRoles: ['MANAGER'] },

    // Administration → Employee
    { featureKey: 'chit_employee_add', displayName: 'Add Employee', category: 'Employee', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_manager_view', displayName: 'View Managers', category: 'Employee', defaultRoles: ['MANAGER'] },

    // Administration → Collector (HR only — Manager assigns staff, not portal ops)
    { featureKey: 'chit_collector_view', displayName: 'View Collectors', category: 'Collector', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_collector_add', displayName: 'Add', category: 'Collector', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_collector_edit', displayName: 'Edit', category: 'Collector', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_collector_delete', displayName: 'Delete', category: 'Collector', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_collector_offer_letter', displayName: 'Generate Offer Letter', category: 'Collector', defaultRoles: ['MANAGER'] },

    // Administration → Accountant
    { featureKey: 'chit_accountant_add', displayName: 'Add', category: 'Accountant', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_accountant_edit', displayName: 'Edit', category: 'Accountant', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_accountant_delete', displayName: 'Delete', category: 'Accountant', defaultRoles: ['MANAGER'] },
    { featureKey: 'chit_accountant_offer_letter', displayName: 'Generate Offer Letter', category: 'Accountant', defaultRoles: ['MANAGER'] },

    // Ledger
    { featureKey: 'chit_ledger_view', displayName: 'View', category: 'Ledger', defaultRoles: ['MANAGER', 'ACCOUNTANT'] },
    { featureKey: 'chit_ledger_add_entry', displayName: 'Add Entry', category: 'Ledger', defaultRoles: ['MANAGER', 'ACCOUNTANT'] },

    // Reports
    { featureKey: 'chit_report_area_wise', displayName: 'View Area-wise Report', category: 'Reports', defaultRoles: ['MANAGER', 'ACCOUNTANT'] },
    { featureKey: 'chit_report_subscriber_outstanding', displayName: 'View Subscriber-wise Outstanding Report', category: 'Reports', defaultRoles: ['MANAGER', 'ACCOUNTANT'] },
];

/** Legacy broad keys still accepted; map to granular replacements. */
export const CHIT_LEGACY_TO_GRANULAR = {
    chit_dashboard: ['chit_home_view_receivable', 'chit_home_view_payable'],
    chit_group_manage: ['chit_group_view', 'chit_group_start'],
    chit_subscriber_manage: ['chit_subscriber_add', 'chit_subscriber_delete', 'chit_subscriber_change_password'],
    // Home receivable/payable are separate from Receivables/Payables pages.
    chit_receivables: ['chit_receivables_view', 'chit_receivables_pay'],
    chit_payables: ['chit_payables_view', 'chit_payables_pay'],
    chit_area_manage: ['chit_area_view', 'chit_area_add', 'chit_area_delete'],
    chit_product_manage: ['chit_product_view', 'chit_product_add', 'chit_product_edit', 'chit_product_delete'],
    chit_employee_manage: [
        'chit_employee_add',
        'chit_collector_add',
        'chit_collector_edit',
        'chit_collector_delete',
        'chit_accountant_add',
        'chit_accountant_edit',
        'chit_accountant_delete',
    ],
    chit_ledger: ['chit_ledger_view', 'chit_ledger_add_entry'],
    chit_reports: ['chit_report_area_wise', 'chit_report_subscriber_outstanding'],
    chit_collections: ['chit_receivables_view', 'chit_receivables_pay'],
    chit_collector_portal: [
        'chit_collector_dashboard',
        'chit_receivables_view',
        'chit_receivables_pay',
        'chit_collector_advances',
    ],
    chit_collector_receivables: ['chit_receivables_view'],
    chit_collector_collections: ['chit_receivables_pay'],
    chit_collector_receipts: ['chit_receivables_pay'],
    // advances is itself a grantable portal key (not expanded away)
};

/** Nav / route access: any of these grants menu visibility. */
export const CHIT_NAV_ANY = {
    home: ['chit_home_view_receivable', 'chit_home_view_payable', 'chit_dashboard'],
    groups: ['chit_group_view', 'chit_group_start', 'chit_group_manage'],
    subscribers: ['chit_subscriber_view', 'chit_subscriber_add', 'chit_subscriber_manage'],
    receivables: ['chit_receivables_view', 'chit_receivables_pay', 'chit_receivables'],
    payables: ['chit_payables_view', 'chit_payables_pay', 'chit_payables'],
    areas: ['chit_area_view', 'chit_area_add', 'chit_area_delete', 'chit_area_manage'],
    products: ['chit_product_view', 'chit_product_add', 'chit_product_edit', 'chit_product_delete', 'chit_product_manage'],
    employees: [
        'chit_employee_add',
        'chit_employee_manage',
        'chit_manager_view',
        'chit_collector_view',
        'chit_collector_add',
        'chit_collector_edit',
        'chit_collector_delete',
        'chit_collector_offer_letter',
        'chit_accountant_add',
        'chit_accountant_edit',
        'chit_accountant_delete',
        'chit_accountant_offer_letter',
    ],
    reports: ['chit_report_area_wise', 'chit_report_subscriber_outstanding', 'chit_reports'],
    reportAreaWise: ['chit_report_area_wise', 'chit_reports'],
    reportSubscriberOutstanding: ['chit_report_subscriber_outstanding', 'chit_reports'],
    ledger: ['chit_ledger_view', 'chit_ledger_add_entry', 'chit_ledger'],
};

export const CHIT_MANAGER_DEFAULT_FEATURES = CHIT_GRANULAR_FEATURES.map((feature) => feature.featureKey);

/**
 * Expand a granted key to what it covers.
 * One-way only: legacy broad keys → granular children.
 * Never expand granular → legacy (that incorrectly unlocked sibling actions).
 */
export const expandPermissionMatches = (featureKey) => {
    const key = String(featureKey || '');
    const matches = new Set([key]);
    (CHIT_LEGACY_TO_GRANULAR[key] || []).forEach((item) => matches.add(item));
    return [...matches];
};

/** True when an assigned permission grant covers the requested feature. */
export const permissionGrantsFeature = (assignedPermission, requestedFeature) => {
    const assigned = String(assignedPermission || '');
    const requested = String(requestedFeature || '');
    if (!assigned || !requested) return false;
    if (assigned === requested || assigned === '*') return true;
    return expandPermissionMatches(assigned).includes(requested);
};

export const toFallbackFeature = (feature) => ({
    featureKey: feature.featureKey,
    displayName: feature.displayName,
    category: feature.category,
    defaultRoles: feature.defaultRoles,
});

/** HR / People-management keys — never part of Collector or Accountant packages. */
const ROLE_PACKAGE_EXCLUDED_KEYS = new Set([
    'people_access_manage',
    'chit_employee_add',
    'chit_employee_manage',
    'chit_manager_view',
    'chit_collector_view',
    'chit_collector_add',
    'chit_collector_edit',
    'chit_collector_delete',
    'chit_collector_offer_letter',
    'chit_collector_collect_receivables',
    'chit_accountant_add',
    'chit_accountant_edit',
    'chit_accountant_delete',
    'chit_accountant_offer_letter',
    ...CHIT_HIDDEN_FEATURE_KEYS,
]);

/** Features a Manager may assign when creating a Collector / Accountant. */
export const featuresAssignableToRole = (features, roleCode, getFeatureKeyFn, getDefaultRolesFn) => {
    const normalizedRole = String(roleCode || '').toUpperCase();
    if (normalizedRole === 'MANAGER') return [];
    return (features || []).filter((feature) => {
        const featureKey = getFeatureKeyFn?.(feature) || feature.featureKey || feature.feature_key;
        if (featureKey && ROLE_PACKAGE_EXCLUDED_KEYS.has(featureKey)) return false;
        if (featureKey && CHIT_HIDDEN_FEATURE_KEYS.has(featureKey)) return false;
        const defaults = (getDefaultRolesFn?.(feature) || feature.defaultRoles || feature.default_roles || [])
            .map((role) => String(role).toUpperCase());
        if (normalizedRole === 'COLLECTOR') {
            // Portal package only: Dashboard, Advance History, View Receivables, Pay.
            return defaults.includes('COLLECTOR');
        }
        if (normalizedRole === 'ACCOUNTANT') {
            return defaults.includes('ACCOUNTANT')
                || ['ledger', 'reports', 'accounting'].includes(
                    String(feature.category || '').toLowerCase()
                );
        }
        return Boolean(featureKey);
    });
};
