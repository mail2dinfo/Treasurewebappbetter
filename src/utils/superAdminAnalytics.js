export const SUPER_ADMIN_NAV = [
    {
        id: 'user-analytics',
        name: 'User Analytics',
        path: '/super-admin/user-analytics',
        icon: 'users',
    },
    {
        id: 'chit-fund',
        name: 'Chit Fund',
        path: '/super-admin/chit-fund-analytics',
        icon: 'chart',
    },
    {
        id: 'daily-finance',
        name: 'Daily Finance',
        path: '/super-admin/daily-finance-analytics',
        icon: 'trending',
    },
];

export const SUPER_ADMIN_ANALYTICS = [
    {
        id: 'user-analytics',
        name: 'User Analytics',
        description: 'Login activity for all MyTreasure users (shared across apps)',
        path: '/super-admin/user-analytics',
        isActive: true,
    },
    {
        id: 'chit-fund',
        name: 'Chit Fund Analytics',
        description: 'Groups, companies, and subscriber stats',
        path: '/super-admin/chit-fund-analytics',
        isActive: true,
    },
    {
        id: 'daily-finance',
        name: 'Daily Finance Analytics',
        description: 'Daily collection companies and loan stats',
        path: '/super-admin/daily-finance-analytics',
        isActive: true,
    },
];

export const getSuperAdminAnalytics = (analyticsId) =>
    SUPER_ADMIN_ANALYTICS.find((item) => item.id === analyticsId);
