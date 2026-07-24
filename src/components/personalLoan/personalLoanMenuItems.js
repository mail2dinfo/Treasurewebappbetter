export const PL_BASE_PATH = '/personal-loan/user';

/** Sticky app menu bar modules under the Personal Loan navbar. */
export const PL_APP_MENU_IDS = [
    'subscribers',
    'loans',
    'ledger',
    'collections',
    'reports',
];

export const getPersonalLoanMenuItems = (basePath = PL_BASE_PATH) => [
    {
        id: 'company',
        label: 'Company',
        path: `${basePath}/company`,
        icon: '🏢',
        description: 'Company profile setup',
    },
    {
        id: 'subscribers',
        label: 'Subscribers',
        path: `${basePath}/subscribers`,
        icon: '👥',
        description: 'Customer management',
    },
    {
        id: 'loans',
        label: 'Loans',
        path: `${basePath}/loans`,
        icon: '💰',
        description: 'Disburse & manage loans',
    },
    {
        id: 'ledger',
        label: 'Ledger',
        path: `${basePath}/ledger`,
        icon: '📒',
        description: 'Accounts & day book',
    },
    {
        id: 'collections',
        label: 'Collections',
        path: `${basePath}/collections`,
        icon: '💳',
        description: 'Collect receivables',
    },
    {
        id: 'reports',
        label: 'Reports',
        path: `${basePath}/reports`,
        icon: '📈',
        description: 'Business reports',
    },
    {
        id: 'billing',
        label: 'Billing',
        path: `${basePath}/billing`,
        icon: '🧾',
        description: 'App subscription & payments',
    },
];

export const getPersonalLoanAppMenuItems = (basePath = PL_BASE_PATH) => {
    const homeItem = {
        id: 'home',
        label: 'Home',
        path: `${basePath}/dashboard`,
        description: 'Dashboard overview',
    };
    const moduleItems = getPersonalLoanMenuItems(basePath).filter((item) =>
        PL_APP_MENU_IDS.includes(item.id)
    );
    return [homeItem, ...moduleItems];
};
