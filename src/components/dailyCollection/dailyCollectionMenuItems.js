export const DC_BASE_PATH = '/daily-collection/user';

export const getDailyCollectionMenuItems = (basePath = DC_BASE_PATH) => [
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
        id: 'products',
        label: 'Products',
        path: `${basePath}/products`,
        icon: '📦',
        description: 'Loan products',
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
