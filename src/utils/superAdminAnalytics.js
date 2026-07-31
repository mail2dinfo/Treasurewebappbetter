export const SUPER_ADMIN_NAV = [
    {
        id: 'user-analytics',
        name: 'User Analytics',
        path: '/super-admin/user-analytics',
        icon: 'users',
    },
    {
        id: 'user-online',
        name: 'User Online',
        path: '/super-admin/user-online',
        icon: 'online',
    },
    {
        id: 'billing',
        name: 'Billing Control',
        path: '/super-admin/billing',
        icon: 'trending',
    },
    {
        id: 'jobs',
        name: 'Jobs',
        path: '/super-admin/jobs',
        icon: 'clock',
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
        id: 'user-online',
        name: 'User Online',
        description: 'Who is currently logged in and active in the portal',
        path: '/super-admin/user-online',
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
