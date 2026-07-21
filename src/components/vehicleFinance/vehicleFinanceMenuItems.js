import {
    VF_DASHBOARD_ANY,
    VF_DASHBOARD_MODULE_VIEW,
    VF_MODULE_GATES,
    VF_NAV_ANY,
} from '../../utils/vfPermissionCatalog';

export const getVehicleFinanceBasePath = (pathname) => {
    if (pathname.includes('/vehicle-finance/manager')) return '/vehicle-finance/manager';
    if (pathname.includes('/vehicle-finance/collector')) return '/vehicle-finance/collector';
    return '/vehicle-finance/user';
};

export const getVehicleFinanceMenuItems = (basePath) => [
    {
        id: 'dashboard',
        requiredAny: VF_DASHBOARD_ANY,
        label: 'Dashboard',
        path: `${basePath}/dashboard`,
        icon: '📊',
        description: 'Overview & metrics',
    },
    {
        id: 'company',
        requiredAny: VF_NAV_ANY.company,
        label: 'Company',
        path: `${basePath}/company`,
        icon: '🏢',
        description: 'Company profile setup',
    },
    {
        id: 'subscribers',
        moduleGate: 'subscribers',
        requiredAny: VF_NAV_ANY.subscribers,
        dashboardModuleView: VF_DASHBOARD_MODULE_VIEW.subscribers,
        contentAny: VF_MODULE_GATES.subscribers.contentAny,
        label: 'Subscribers',
        path: `${basePath}/subscribers`,
        icon: '👥',
        description: 'Customer management',
    },
    {
        id: 'loans',
        moduleGate: 'loans',
        requiredAny: VF_NAV_ANY.loans,
        dashboardModuleView: VF_DASHBOARD_MODULE_VIEW.loans,
        contentAny: VF_MODULE_GATES.loans.contentAny,
        label: 'Loans',
        path: `${basePath}/loans`,
        icon: '💰',
        description: 'Disburse & manage loans',
    },
    {
        id: 'ledger',
        moduleGate: 'ledger',
        requiredAny: VF_NAV_ANY.ledger,
        dashboardModuleView: VF_DASHBOARD_MODULE_VIEW.ledger,
        contentAny: VF_MODULE_GATES.ledger.contentAny,
        label: 'Ledger',
        path: `${basePath}/ledger`,
        icon: '📒',
        description: 'Accounts & day book',
    },
    {
        id: 'collections',
        moduleGate: 'collections',
        requiredAny: VF_NAV_ANY.collections,
        dashboardModuleView: VF_DASHBOARD_MODULE_VIEW.collections,
        contentAny: VF_MODULE_GATES.collections.contentAny,
        label: 'Collections',
        path: `${basePath}/collections`,
        icon: '💳',
        description: 'Collect receivables',
    },
    {
        id: 'reports',
        moduleGate: 'reports',
        requiredAny: VF_NAV_ANY.reports,
        dashboardModuleView: VF_DASHBOARD_MODULE_VIEW.reports,
        contentAny: VF_MODULE_GATES.reports.contentAny,
        label: 'Reports',
        path: `${basePath}/reports`,
        icon: '📈',
        description: 'Business reports',
    },
    {
        id: 'employees',
        moduleGate: 'employees',
        requiredAny: VF_NAV_ANY.employees,
        dashboardModuleView: VF_DASHBOARD_MODULE_VIEW.employees,
        contentAny: VF_MODULE_GATES.employees.contentAny,
        label: 'Employees',
        path: `${basePath}/employees`,
        icon: '👤',
        description: 'Staff & responsibilities',
    },
];

export const getVehicleFinanceOwnerBillingMenuItem = (basePath = '/vehicle-finance/user') => ({
    id: 'billing',
    label: 'Billing',
    path: `${basePath}/billing`,
    icon: '🧾',
    description: 'App subscription & payments',
    ownerOnly: true,
});

export const getVehicleFinanceMenuItemsWithBilling = (basePath, { includeBilling = false } = {}) => {
    const items = getVehicleFinanceMenuItems(basePath);
    if (includeBilling && basePath === '/vehicle-finance/user') {
        return [...items, getVehicleFinanceOwnerBillingMenuItem(basePath)];
    }
    return items;
};

/** Module bar under the navbar: Home + core modules (Company/Billing stay elsewhere). */
export const VF_APP_MENU_IDS = [
    'subscribers',
    'loans',
    'ledger',
    'daybook',
    'collections',
    'reports',
    'employees',
];

export const getVehicleFinanceAppMenuItems = (basePath) => {
    const homeItem = {
        id: 'home',
        requiredAny: VF_DASHBOARD_ANY,
        label: 'Home',
        path: `${basePath}/dashboard`,
        description: 'Dashboard overview',
    };
    const moduleItems = getVehicleFinanceMenuItems(basePath)
        .filter((item) => VF_APP_MENU_IDS.includes(item.id))
        .flatMap((item) => {
            if (item.id !== 'ledger') return [item];
            return [
                { ...item, label: 'Ledgers' },
                {
                    id: 'daybook',
                    moduleGate: 'ledger',
                    requiredAny: ['vf_ledger_view_daybook', 'vf_ledger'],
                    label: 'Day Book',
                    path: `${basePath}/ledger?tab=daybook`,
                    description: 'Daily opening, receipts, payments, closing',
                },
            ];
        });
    return [homeItem, ...moduleItems];
};
