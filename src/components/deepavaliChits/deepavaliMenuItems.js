export const DP_BASE_PATH = '/deepavali-chits/user';
export const DP_COLLECTOR_PATH = '/deepavali-chits/collector';

export const DP_APP_MENU_IDS = [
    'subscribers',
    'groups',
    'collections',
    'payables',
    'adminsettings',
    'ledger',
    'reports',
];

export const DP_COLLECTOR_MENU_IDS = ['subscribers', 'collections'];

export const DP_FEATURE_TO_MENU = {
    dp_subscribers: 'subscribers',
    dp_subscriber_add: 'subscribers',
    dp_subscriber_edit: 'subscribers',
    dp_subscriber_delete: 'subscribers',
    dp_collections: 'collections',
    dp_groups: 'groups',
    dp_payables: 'payables',
    dp_ledger: 'ledger',
    dp_reports: 'reports',
    dp_employee_manage: 'adminsettings',
    dp_company_manage: 'adminsettings',
};

export const DP_COLLECTOR_DEFAULT_FEATURES = ['dp_dashboard', 'dp_subscribers', 'dp_collections'];

export const DP_COLLECTOR_OPT_IN_FEATURES = [
    'dp_subscriber_add',
    'dp_subscriber_edit',
    'dp_subscriber_delete',
];

export const menusFromGrantedFeatures = (hasPermission, fallback = DP_COLLECTOR_MENU_IDS) => {
    const menus = [];
    Object.entries(DP_FEATURE_TO_MENU).forEach(([feature, menu]) => {
        if (typeof hasPermission === 'function' && hasPermission(feature) && !menus.includes(menu)) {
            menus.push(menu);
        }
    });
    return menus.length ? menus : fallback;
};

export const DP_ROLE_MENU_IDS = {
    Admin: DP_APP_MENU_IDS,
    Manager: ['groups', 'subscribers', 'collections', 'payables', 'adminsettings', 'reports'],
    Accountant: ['adminsettings', 'ledger', 'collections', 'payables', 'reports'],
    Collector: DP_COLLECTOR_MENU_IDS,
    Cashier: ['collections', 'payables'],
    Supervisor: ['groups', 'collections', 'reports'],
};

export const DP_ROLE_RESPONSIBILITIES = [
    { id: 'subscribers', label: 'Add / view subscribers' },
    { id: 'groups', label: 'View groups and slots' },
    { id: 'collections', label: 'Collect receivables and issue receipts' },
    { id: 'payables', label: 'Pay / settle subscribers' },
    { id: 'adminsettings', label: 'Admin settings (company, employees, groups, categories)' },
    { id: 'ledger', label: 'View ledger accounts' },
    { id: 'reports', label: 'View reports and audit' },
];

export const menusForRole = (role, fallback = DP_COLLECTOR_MENU_IDS) => {
    const menus = role?.permissions?.menus;
    if (Array.isArray(menus) && menus.length) {
        return [...new Set(menus.map((id) => (
            id === 'employees' || id === 'company' || id === 'ledgercategories' ? 'adminsettings' : id
        )))];
    }
    const name = String(role?.role_name || '').toLowerCase();
    if (DP_ROLE_MENU_IDS[role?.role_name]) return DP_ROLE_MENU_IDS[role.role_name];
    if (name === 'collector') return DP_COLLECTOR_MENU_IDS;
    return fallback;
};

export const getDeepavaliMenuItems = (basePath = DP_BASE_PATH) => [
    {
        id: 'home',
        label: 'Home',
        path: `${basePath}/dashboard`,
        icon: '🏠',
        description: 'Overview',
    },
    {
        id: 'subscribers',
        label: 'Subscribers',
        path: `${basePath}/subscribers`,
        icon: '👥',
        description: 'Customers',
    },
    {
        id: 'groups',
        label: 'Groups',
        path: `${basePath}/groups`,
        icon: '🪔',
        description: 'Chit groups',
    },
    {
        id: 'collections',
        label: 'Receivables',
        path: `${basePath}/receivables`,
        icon: '💳',
        description: 'Collect dues',
    },
    {
        id: 'payables',
        label: 'Payables',
        path: `${basePath}/payables`,
        icon: '🏆',
        description: 'Settle amount to subscribers',
    },
    {
        id: 'adminsettings',
        label: 'Admin settings',
        path: `${basePath}/adminsettings`,
        icon: '⚙️',
        description: 'Company, employees, groups and categories',
    },
    {
        id: 'ledger',
        label: 'Ledger',
        path: `${basePath}/ledger`,
        icon: '📒',
        description: 'Accounts and entries',
    },
    {
        id: 'reports',
        label: 'Reports',
        path: `${basePath}/reports`,
        icon: '📈',
        description: 'Reports and audit',
    },
    {
        id: 'billing',
        label: 'Billing',
        path: `${basePath}/billing`,
        icon: '🧾',
        description: 'App subscription',
    },
];

export const getDeepavaliAppMenuItems = (basePath = DP_BASE_PATH, menuIds = DP_APP_MENU_IDS) => {
    const all = getDeepavaliMenuItems(basePath);
    return all.filter((item) => item.id === 'home' || menuIds.includes(item.id));
};
