/**
 * Vehicle Finance granular permission catalog.
 * Keep in sync with migrations/platform_vf_granular_permissions.sql
 */

/** @type {{ featureKey: string, displayName: string, category: string, defaultRoles: string[] }[]} */
export const VF_GRANULAR_FEATURES = [
    // Company
    { featureKey: 'vf_company_view', displayName: 'View', category: 'Company', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_company_add', displayName: 'Add', category: 'Company', defaultRoles: ['USER'] },
    { featureKey: 'vf_company_edit', displayName: 'Edit', category: 'Company', defaultRoles: ['USER'] },

    // Dashboard widgets
    { featureKey: 'vf_dashboard_active_loans', displayName: 'View Active Loans', category: 'Dashboard', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_dashboard_subscribers', displayName: 'View Subscribers', category: 'Dashboard', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_dashboard_disbursed', displayName: 'View Disbursed', category: 'Dashboard', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_dashboard_collected', displayName: 'View Collected', category: 'Dashboard', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_dashboard_outstanding', displayName: 'View Outstanding', category: 'Dashboard', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_dashboard_finance_summary', displayName: 'View Finance Summary', category: 'Dashboard', defaultRoles: ['USER', 'MANAGER'] },

    // Dashboard Modules (tiles on dashboard)
    { featureKey: 'vf_module_subscribers_view', displayName: 'View Subscribers Module', category: 'Dashboard Modules', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_module_loans_view', displayName: 'View Loans Module', category: 'Dashboard Modules', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_module_ledger_view', displayName: 'View Ledger Module', category: 'Dashboard Modules', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_module_collections_view', displayName: 'View Collections Module', category: 'Dashboard Modules', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_module_reports_view', displayName: 'View Reports Module', category: 'Dashboard Modules', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_module_employees_view', displayName: 'View Employees Module', category: 'Dashboard Modules', defaultRoles: ['USER', 'MANAGER'] },

    // Subscribers
    { featureKey: 'vf_subscriber_view', displayName: 'View Subscribers', category: 'Subscribers', defaultRoles: ['USER', 'MANAGER', 'COLLECTOR', 'ACCOUNTANT'] },
    { featureKey: 'vf_subscriber_add', displayName: 'Add Subscribers', category: 'Subscribers', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_subscriber_edit', displayName: 'Edit Subscribers', category: 'Subscribers', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_subscriber_delete', displayName: 'Delete Subscribers', category: 'Subscribers', defaultRoles: ['USER'] },

    // Loans
    { featureKey: 'vf_loan_view', displayName: 'View Loans', category: 'Loans', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_loan_disburse', displayName: 'Disburse New Loan', category: 'Loans', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_loan_collect', displayName: 'Collect Payment', category: 'Loans', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_loan_foreclose', displayName: 'Foreclose Loan', category: 'Loans', defaultRoles: ['USER', 'MANAGER'] },

    // Collections
    { featureKey: 'vf_collections_view', displayName: 'View Collections', category: 'Collections', defaultRoles: ['USER', 'MANAGER', 'COLLECTOR'] },
    { featureKey: 'vf_collections_collect', displayName: 'Collect', category: 'Collections', defaultRoles: ['USER', 'MANAGER', 'COLLECTOR'] },

    // Ledger
    { featureKey: 'vf_ledger_view_account', displayName: 'View Account', category: 'Ledger', defaultRoles: ['USER', 'MANAGER', 'ACCOUNTANT'] },
    { featureKey: 'vf_ledger_view_entry', displayName: 'View Entry', category: 'Ledger', defaultRoles: ['USER', 'MANAGER', 'ACCOUNTANT'] },
    // Not a Manager default — Owner must explicitly grant in Step 3 / People & Access.
    { featureKey: 'vf_ledger_view_daybook', displayName: 'View Day Book', category: 'Ledger', defaultRoles: ['USER'] },
    { featureKey: 'vf_ledger_add_account', displayName: 'Add Account', category: 'Ledger', defaultRoles: ['USER'] },
    { featureKey: 'vf_ledger_add_entry', displayName: 'Add Entry', category: 'Ledger', defaultRoles: ['USER', 'MANAGER', 'ACCOUNTANT'] },

    // Reports (granular — Manager/User/Accountant get all by default)
    { featureKey: 'vf_report_loan_summary', displayName: 'Subscriber / Loan Summary', category: 'Reports', defaultRoles: ['USER', 'MANAGER', 'ACCOUNTANT'] },
    { featureKey: 'vf_report_outstanding_due', displayName: 'Outstanding (Due for Payment)', category: 'Reports', defaultRoles: ['USER', 'MANAGER', 'ACCOUNTANT'] },
    { featureKey: 'vf_report_outstanding_loan_wise', displayName: 'Outstanding Loan-wise', category: 'Reports', defaultRoles: ['USER', 'MANAGER', 'ACCOUNTANT'] },
    { featureKey: 'vf_report_todays_demand', displayName: "Today's Collection On Demand", category: 'Reports', defaultRoles: ['USER', 'MANAGER', 'ACCOUNTANT'] },
    { featureKey: 'vf_report_collection', displayName: 'Collection Report', category: 'Reports', defaultRoles: ['USER', 'MANAGER', 'ACCOUNTANT'] },
    { featureKey: 'vf_report_financial_summary', displayName: 'Financial Summary', category: 'Reports', defaultRoles: ['USER', 'MANAGER', 'ACCOUNTANT'] },

    // Administration → Employee / Collector / Accountant (nested in Step 3 like Chit Fund)
    { featureKey: 'vf_employee_add', displayName: 'Add Employee', category: 'Employee', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_offer_letter', displayName: 'Generate Offer Letter', category: 'Employee', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_collector_view', displayName: 'View Collectors', category: 'Collector', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_collector_add', displayName: 'Add Collector', category: 'Collector', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_collector_edit', displayName: 'Edit Collector', category: 'Collector', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_collector_assign_area', displayName: 'Add Area', category: 'Collector', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_accountant_view', displayName: 'View Accountants', category: 'Accountant', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_accountant_add', displayName: 'Add Accountant', category: 'Accountant', defaultRoles: ['USER', 'MANAGER'] },
    { featureKey: 'vf_accountant_edit', displayName: 'Edit Accountant', category: 'Accountant', defaultRoles: ['USER', 'MANAGER'] },
];

/** HR categories grouped under Administration in People & Access Step 3. */
export const VF_ADMINISTRATION_CATEGORIES = ['Employee', 'Collector', 'Accountant'];

/** Legacy coarse keys still accepted; expand to granular replacements. */
export const VF_LEGACY_TO_GRANULAR = {
    vf_company: ['vf_company_view', 'vf_company_add', 'vf_company_edit'],
    vf_ledger: [
        'vf_ledger_view_account',
        'vf_ledger_view_entry',
        'vf_ledger_view_daybook',
        'vf_ledger_add_account',
        'vf_ledger_add_entry',
    ],
    vf_collections: ['vf_collections_view', 'vf_collections_collect'],
    vf_reports: [
        'vf_report_loan_summary',
        'vf_report_outstanding_due',
        'vf_report_outstanding_loan_wise',
        'vf_report_todays_demand',
        'vf_report_collection',
        'vf_report_financial_summary',
    ],
    vf_employee_manage: [
        'vf_employee_add',
        'vf_collector_view',
        'vf_collector_add',
        'vf_collector_edit',
        'vf_collector_assign_area',
        'vf_accountant_view',
        'vf_accountant_add',
        'vf_accountant_edit',
    ],
};

/**
 * Module entry (tile + route): User must grant Dashboard Module View AND a content View key.
 * Turning off Loans → View Loans must hide /loans even if module tile View is still on.
 */
export const VF_MODULE_GATES = {
    subscribers: {
        moduleView: 'vf_module_subscribers_view',
        contentAny: ['vf_subscriber_view'],
    },
    loans: {
        moduleView: 'vf_module_loans_view',
        contentAny: ['vf_loan_view'],
    },
    ledger: {
        moduleView: 'vf_module_ledger_view',
        contentAny: ['vf_ledger_view_account', 'vf_ledger_view_entry', 'vf_ledger'],
    },
    collections: {
        moduleView: 'vf_module_collections_view',
        contentAny: ['vf_collections_view', 'vf_collections'],
    },
    reports: {
        moduleView: 'vf_module_reports_view',
        contentAny: [
            'vf_reports',
            'vf_report_loan_summary',
            'vf_report_outstanding_due',
            'vf_report_outstanding_loan_wise',
            'vf_report_todays_demand',
            'vf_report_collection',
            'vf_report_financial_summary',
        ],
    },
    employees: {
        moduleView: 'vf_module_employees_view',
        contentAny: [
            'vf_employee_add',
            'vf_employee_manage',
            'vf_collector_view',
            'vf_accountant_view',
            'vf_offer_letter',
        ],
    },
};

/** @deprecated Prefer VF_MODULE_GATES; kept for company / simple OR checks. */
export const VF_NAV_ANY = {
    company: ['vf_company_view', 'vf_company', 'vf_company_add', 'vf_company_edit'],
    subscribers: [VF_MODULE_GATES.subscribers.moduleView, ...VF_MODULE_GATES.subscribers.contentAny],
    loans: [VF_MODULE_GATES.loans.moduleView, ...VF_MODULE_GATES.loans.contentAny],
    ledger: [VF_MODULE_GATES.ledger.moduleView, ...VF_MODULE_GATES.ledger.contentAny],
    collections: [VF_MODULE_GATES.collections.moduleView, ...VF_MODULE_GATES.collections.contentAny],
    reports: [VF_MODULE_GATES.reports.moduleView, ...VF_MODULE_GATES.reports.contentAny],
    employees: [VF_MODULE_GATES.employees.moduleView, ...VF_MODULE_GATES.employees.contentAny],
};

/** Dashboard Modules tile → dedicated View permission. */
export const VF_DASHBOARD_MODULE_VIEW = {
    subscribers: VF_MODULE_GATES.subscribers.moduleView,
    loans: VF_MODULE_GATES.loans.moduleView,
    ledger: VF_MODULE_GATES.ledger.moduleView,
    collections: VF_MODULE_GATES.collections.moduleView,
    reports: VF_MODULE_GATES.reports.moduleView,
    employees: VF_MODULE_GATES.employees.moduleView,
};

/** Any of these lets Manager open the VF dashboard (Step 3 grants only). */
export const VF_DASHBOARD_ANY = [
    'vf_company_view',
    'vf_company',
    'vf_dashboard_active_loans',
    'vf_dashboard_subscribers',
    'vf_dashboard_disbursed',
    'vf_dashboard_collected',
    'vf_dashboard_outstanding',
    'vf_dashboard_finance_summary',
    ...Object.values(VF_DASHBOARD_MODULE_VIEW),
];

/** True when module View + at least one content View are granted. */
export const passesVfModuleGate = (canAccess, canAccessAny, moduleId) => {
    const gate = VF_MODULE_GATES[moduleId];
    if (!gate) return true;
    if (!canAccess(gate.moduleView)) return false;
    if (!gate.contentAny?.length) return true;
    return canAccessAny(gate.contentAny);
};

export const VF_MANAGER_DEFAULT_FEATURES = VF_GRANULAR_FEATURES
    .filter((feature) => feature.defaultRoles.includes('MANAGER'))
    .map((feature) => feature.featureKey);

export const expandVfPermissionMatches = (featureKey) => {
    const key = String(featureKey || '');
    const matches = new Set([key]);
    (VF_LEGACY_TO_GRANULAR[key] || []).forEach((item) => matches.add(item));
    return [...matches];
};

export const vfPermissionGrantsFeature = (assignedPermission, requestedFeature) => {
    const assigned = String(assignedPermission || '');
    const requested = String(requestedFeature || '');
    if (!assigned || !requested) return false;
    if (assigned === requested || assigned === '*') return true;
    return expandVfPermissionMatches(assigned).includes(requested);
};

export const toVfFallbackFeature = (feature) => ({
    featureKey: feature.featureKey,
    displayName: feature.displayName,
    category: feature.category,
    defaultRoles: feature.defaultRoles,
});
