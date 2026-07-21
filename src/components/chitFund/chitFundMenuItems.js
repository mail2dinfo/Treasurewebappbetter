export const CHIT_BASE_PATH = '/chit-fund/user';

/** Sticky app menu bar modules under the Chit Fund navbar. */
export const getChitFundAppMenuItems = (basePath = CHIT_BASE_PATH) => [
    {
        id: 'home',
        label: 'Home',
        path: `${basePath}/home`,
        description: 'Dashboard overview',
    },
    {
        id: 'subscribers',
        label: 'Subscribers',
        path: `${basePath}/subscribers`,
        description: 'Customer management',
    },
    {
        id: 'groups',
        label: 'Groups',
        path: `${basePath}/groups`,
        description: 'Chit groups',
    },
    {
        id: 'receivables',
        label: 'Receivables',
        path: `${basePath}/receivables`,
        description: 'Amounts to collect',
    },
    {
        id: 'payables',
        label: 'Payables',
        path: `${basePath}/payables`,
        description: 'Amounts to pay',
    },
    {
        id: 'adminsettings',
        label: 'Admin settings',
        path: `${basePath}/adminsettings`,
        description: 'Administration & access',
    },
    {
        id: 'ledger',
        label: 'Ledger',
        path: `${basePath}/ledger`,
        description: 'Accounts & entries',
    },
    {
        id: 'products',
        label: 'Products',
        path: `${basePath}/products`,
        description: 'Chit products',
    },
];
