export const PL_BASE_PATH = '/personal-loan/user';

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
        id: 'billing',
        label: 'Billing',
        path: `${basePath}/billing`,
        icon: '🧾',
        description: 'App subscription & payments',
    },
];
