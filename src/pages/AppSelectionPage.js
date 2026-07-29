import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { usePlatformAccess } from '../context/platformAccess_context';
import { FiBookmark, FiLogOut, FiShield, FiUsers, FiX } from 'react-icons/fi';
import MyTreasureBrand from '../components/MyTreasureBrand';

/** Distinct look per product so cards are easy to tell apart at a glance. */
const APP_THEMES = {
    CHIT_FUND: {
        shortName: 'Chit Fund App',
        accent: '#DC2626',
        iconBg: 'bg-red-600',
        softBg: 'bg-red-50',
        border: 'border-red-200 hover:border-red-500',
        bar: 'bg-red-600',
        ring: 'ring-red-100',
    },
    DAILY_COLLECTION: {
        shortName: 'Daily Collection App',
        accent: '#0D9488',
        iconBg: 'bg-teal-600',
        softBg: 'bg-teal-50',
        border: 'border-teal-200 hover:border-teal-500',
        bar: 'bg-teal-600',
        ring: 'ring-teal-100',
    },
    PERSONAL_LOAN: {
        shortName: 'Personal Loan App',
        accent: '#D97706',
        iconBg: 'bg-amber-600',
        softBg: 'bg-amber-50',
        border: 'border-amber-200 hover:border-amber-500',
        bar: 'bg-amber-600',
        ring: 'ring-amber-100',
    },
    VEHICLE_FINANCE: {
        shortName: 'Vehicle Finance App',
        accent: '#1D4ED8',
        iconBg: 'bg-blue-700',
        softBg: 'bg-blue-50',
        border: 'border-blue-200 hover:border-blue-500',
        bar: 'bg-blue-700',
        ring: 'ring-blue-100',
    },
    PERSONAL_FINANCE: {
        shortName: 'Personal Finance App',
        accent: '#059669',
        iconBg: 'bg-emerald-600',
        softBg: 'bg-emerald-50',
        border: 'border-emerald-200 hover:border-emerald-500',
        bar: 'bg-emerald-600',
        ring: 'ring-emerald-100',
    },
    RENTAL_MANAGEMENT: {
        shortName: 'Rental Agreement App',
        accent: '#EA580C',
        iconBg: 'bg-orange-600',
        softBg: 'bg-orange-50',
        border: 'border-orange-200 hover:border-orange-500',
        bar: 'bg-orange-600',
        ring: 'ring-orange-100',
    },
    HOSTEL_MANAGEMENT: {
        shortName: 'Hostel Management App',
        accent: '#0E7490',
        iconBg: 'bg-cyan-700',
        softBg: 'bg-cyan-50',
        border: 'border-cyan-200 hover:border-cyan-500',
        bar: 'bg-cyan-700',
        ring: 'ring-cyan-100',
    },
    PEOPLE_ACCESS: {
        shortName: 'Employee & Access',
        accent: '#44403C',
        iconBg: 'bg-stone-700',
        softBg: 'bg-stone-100',
        border: 'border-stone-300 hover:border-stone-500',
        bar: 'bg-stone-700',
        ring: 'ring-stone-200',
    },
};

const DEFAULT_APP_THEME = {
    shortName: null,
    accent: '#6B7280',
    iconBg: 'bg-gray-500',
    softBg: 'bg-gray-50',
    border: 'border-gray-200 hover:border-gray-400',
    bar: 'bg-gray-500',
    ring: 'ring-gray-100',
};

const getAppTheme = (appCode) => APP_THEMES[appCode] || DEFAULT_APP_THEME;

const bookmarkStorageKey = (user) => {
    const id = user?.results?.userDetail?.user_id
        || user?.results?.userDetail?.phone
        || user?.results?.phone
        || 'guest';
    return `mt_app_bookmarks_${id}`;
};

const getAppBookmarkId = (app) => (
    String(app.id || `${app.appCode}:${app.accountKind || 'staff'}:${app.parentMembershipId || 'org'}:${app.accountLabel || ''}`)
);

const cleanAppDisplayName = (appCode, rawName) => {
    const theme = getAppTheme(appCode);
    if (theme.shortName) return theme.shortName;
    const cleaned = String(rawName || appCode || '')
        .replace(/^MyTreasure\s*[-–—:]\s*/i, '')
        .replace(/\s*App$/i, '')
        .trim() || String(appCode || '');
    return cleaned ? `${cleaned} App` : String(appCode || '');
};

const APP_ROUTES = {
    CHIT_FUND: {
        USER: '/chit-fund/user',
        MANAGER: '/chit-fund/manager/home',
        COLLECTOR: '/chit-fund/collector/receivables',
        ACCOUNTANT: '/chit-fund/accountant/dashboard',
        SUBSCRIBER: '/chit-fund/subscriber',
    },
    VEHICLE_FINANCE: {
        USER: '/vehicle-finance/user/dashboard',
        MANAGER: '/vehicle-finance/manager/dashboard',
        COLLECTOR: '/vehicle-finance/collector/dashboard',
        ACCOUNTANT: '/vehicle-finance/manager/dashboard',
        SUBSCRIBER: '/vehicle-finance/customer/dashboard',
    },
    DAILY_COLLECTION: {
        USER: '/daily-collection/user/dashboard',
        MANAGER: '/daily-collection/user/dashboard',
        COLLECTOR: '/daily-collection/collector/dashboard',
        ACCOUNTANT: '/daily-collection/user/dashboard',
        SUBSCRIBER: '/daily-collection/customer/dashboard',
    },
    PERSONAL_LOAN: {
        USER: '/personal-loan/user/dashboard',
        MANAGER: '/personal-loan/user/dashboard',
        COLLECTOR: '/personal-loan/user/dashboard',
        ACCOUNTANT: '/personal-loan/user/dashboard',
        SUBSCRIBER: '/personal-loan/customer/dashboard',
    },
    PERSONAL_FINANCE: {
        USER: '/personal-finance/user/dashboard',
        MANAGER: '/personal-finance/user/dashboard',
        COLLECTOR: '/personal-finance/user/dashboard',
        ACCOUNTANT: '/personal-finance/user/dashboard',
    },
    RENTAL_MANAGEMENT: {
        USER: '/rental-management/user/dashboard',
        MANAGER: '/rental-management/user/dashboard',
        COLLECTOR: '/rental-management/user/dashboard',
        ACCOUNTANT: '/rental-management/user/dashboard',
        SUBSCRIBER: '/rental-management/customer/dashboard',
    },
    HOSTEL_MANAGEMENT: {
        USER: '/hostel-management/user/dashboard',
        MANAGER: '/hostel-management/user/dashboard',
        RECEPTIONIST: '/hostel-management/user/dashboard',
        KITCHEN_STAFF: '/hostel-management/kitchen/food-report',
        COLLECTOR: '/hostel-management/user/dashboard',
        ACCOUNTANT: '/hostel-management/user/dashboard',
        SUBSCRIBER: '/hostel-management/resident/dashboard',
    },
};

const CUSTOMER_APP_PATHS = {
    CHIT_FUND: '/chit-fund/subscriber',
    DAILY_COLLECTION: '/daily-collection/customer/dashboard',
    VEHICLE_FINANCE: '/vehicle-finance/customer/dashboard',
    PERSONAL_LOAN: '/personal-loan/customer/dashboard',
    RENTAL_MANAGEMENT: '/rental-management/customer/dashboard',
    HOSTEL_MANAGEMENT: '/hostel-management/resident/dashboard',
};

const PLATFORM_ACCOUNT_ROLE = {
    user: 'USER',
    manager: 'MANAGER',
    collector: 'COLLECTOR',
    accountant: 'ACCOUNTANT',
    receptionist: 'RECEPTIONIST',
    'kitchen staff': 'KITCHEN_STAFF',
    kitchen_staff: 'KITCHEN_STAFF',
};

const resolveRoute = (app, role) => (
    APP_ROUTES[app.appCode]?.[String(role.roleCode || '').toUpperCase()]
    || app.path
    || app.defaultRoute
);

const formatAccountLabel = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw
        .split(/[\s_]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};

const accountNameToRoleCode = (accountName) => {
    const key = String(accountName || '').trim().toLowerCase();
    if (!key) return null;
    if (PLATFORM_ACCOUNT_ROLE[key]) return PLATFORM_ACCOUNT_ROLE[key];
    // Membership names are sometimes "Chit Collector" / "VF Manager", etc.
    if (key.includes('kitchen')) return 'KITCHEN_STAFF';
    if (key.includes('receptionist')) return 'RECEPTIONIST';
    if (key.includes('accountant')) return 'ACCOUNTANT';
    if (key.includes('collector')) return 'COLLECTOR';
    if (key.includes('manager')) return 'MANAGER';
    if (key === 'user' || key.includes('owner')) return 'USER';
    return null;
};

const roleCodeToAccountName = (roleCode, membershipAccounts = []) => {
    const code = String(roleCode || '').toUpperCase();
    if (code === 'OWNER' || code === 'USER') {
        const userAccount = membershipAccounts.find(
            (account) => String(account.accountName || '').toLowerCase() === 'user'
        );
        return userAccount?.accountName || 'User';
    }
    const match = membershipAccounts.find(
        (account) => accountNameToRoleCode(account.accountName) === code
    );
    return match?.accountName || formatAccountLabel(code);
};

const uniqueMembershipAccounts = (userAccounts = []) => {
    const seen = new Set();
    return userAccounts.filter((account) => {
        const name = String(account?.accountName || '').trim().toLowerCase();
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
    });
};

const AppSelectionPage = () => {
    const history = useHistory();
    const { user, logout, userRole, updateUserRole } = useUserContext();
    const platform = usePlatformAccess();
    const [accountChoice, setAccountChoice] = useState(null);
    const [bookmarkedIds, setBookmarkedIds] = useState([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(bookmarkStorageKey(user));
            const parsed = raw ? JSON.parse(raw) : [];
            setBookmarkedIds(Array.isArray(parsed) ? parsed.map(String) : []);
        } catch {
            setBookmarkedIds([]);
        }
    }, [user]);

    const toggleBookmark = (event, app) => {
        event.preventDefault();
        event.stopPropagation();
        const id = getAppBookmarkId(app);
        setBookmarkedIds((prev) => {
            const next = prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [id, ...prev];
            try {
                localStorage.setItem(bookmarkStorageKey(user), JSON.stringify(next));
            } catch {
                // ignore quota / private mode
            }
            return next;
        });
    };

    const membershipAccounts = useMemo(
        () => uniqueMembershipAccounts(user?.results?.userAccounts || []),
        [user?.results?.userAccounts]
    );

    const legacyIsOwner = membershipAccounts.some(
        (account) => String(account?.accountName || '').toLowerCase() === 'user'
    );
    const isOwner = platform?.isOwner || (!platform?.isAvailable && legacyIsOwner);

    const displayName = formatAccountLabel(
        user?.results?.userDetail?.userName
        || user?.results?.firstname
        || user?.results?.name
        || user?.results?.phone
        || 'Guest'
    );

    // Subtitle is always membership → account name (never hardcoded role labels).
    const accountSubtitle = useMemo(() => {
        if (!membershipAccounts.length) return '';

        const activeRole = String(platform?.activeContext?.roleCode || '').toUpperCase();
        if (activeRole) {
            return formatAccountLabel(roleCodeToAccountName(activeRole, membershipAccounts));
        }

        const roleFromContext = formatAccountLabel(userRole);
        if (roleFromContext) {
            const matched = membershipAccounts.find(
                (account) => formatAccountLabel(account.accountName).toLowerCase()
                    === roleFromContext.toLowerCase()
            );
            if (matched) return formatAccountLabel(matched.accountName);
        }

        if (membershipAccounts.length === 1) {
            return formatAccountLabel(membershipAccounts[0].accountName);
        }

        return membershipAccounts
            .map((account) => formatAccountLabel(account.accountName))
            .filter(Boolean)
            .join(' · ');
    }, [membershipAccounts, platform?.activeContext?.roleCode, userRole]);

    const allApps = useMemo(() => [
        {
            id: 1,
            appCode: 'CHIT_FUND',
            name: 'Chit Fund App',
            description: 'Manage chit groups and auctions',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
                </svg>
            ),
            path: '/chit-fund/user',
            isActive: true
        },
        {
            id: 2,
            appCode: 'DAILY_COLLECTION',
            name: 'Daily Collection App',
            description: 'Track daily loans and collections',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 7.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
                    <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
                    <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
                </svg>
            ),
            path: '/daily-collection/user/dashboard',
            isActive: true
        },
        {
            id: 3,
            appCode: 'PERSONAL_LOAN',
            name: 'Personal Loan App',
            description: 'Personal loan lending and collections',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM9.704 9.44c.446-.643.98-.99 1.548-.99.567 0 1.102.347 1.548.99a.75.75 0 001.212-.883C13.201 7.4 12.225 6.7 11.252 6.7c-.973 0-1.95.7-2.76 1.857A.75.75 0 009.704 9.44zM8.25 12a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6A.75.75 0 018.25 12zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" />
                </svg>
            ),
            path: '/personal-loan/user/dashboard',
            isActive: true
        },
        {
            id: 4,
            appCode: 'VEHICLE_FINANCE',
            name: 'Vehicle Finance App',
            description: 'Two wheeler, four wheeler and vehicle loan management',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 116 0h3a.75.75 0 00.75-.75V15z" />
                    <path d="M8.25 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zM15.75 6.75a.75.75 0 00-.75.75v11.25c0 .087.015.17.042.248a3 3 0 015.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 00-3.732-10.104 1.837 1.837 0 00-1.47-.725H15.75z" />
                    <path d="M19.5 19.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
                </svg>
            ),
            path: '/vehicle-finance/user/dashboard',
            isActive: true
        },
        {
            id: 5,
            appCode: 'PERSONAL_FINANCE',
            name: 'Personal Finance App',
            description: 'Categories, accounts, income & expense, and monthly reports',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10.464 8.646a.75.75 0 01.744.052l4.5 2.75a.75.75 0 010 1.304l-4.5 2.75A.75.75 0 019.75 14.75v-5.5a.75.75 0 01.714-.604z" />
                    <path fillRule="evenodd" d="M1.5 4.875C1.5 3.839 2.34 3 3.375 3h17.25c1.035 0 1.875.84 1.875 1.875v9.75c0 1.036-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 011.5 14.625v-9.75zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM18.75 9a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 00.75-.75V9.75a.75.75 0 00-.75-.75h-.008zM4.5 9.75A.75.75 0 015.25 9h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V9.75z" clipRule="evenodd" />
                    <path d="M2.25 18a.75.75 0 000 1.5c5.4 0 10.63.722 15.6 2.075 1.19.324 2.4-.558 2.4-1.82V18.75a.75.75 0 00-.75-.75H2.25z" />
                </svg>
            ),
            path: '/personal-finance/user/dashboard',
            isActive: true
        },
        {
            id: 6,
            appCode: 'RENTAL_MANAGEMENT',
            name: 'Rental Agreement App',
            description: 'Rental agreements, tenant review, monthly rent & collections',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                    <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                </svg>
            ),
            path: '/rental-management/user/dashboard',
            isActive: true
        },
        {
            id: 7,
            appCode: 'HOSTEL_MANAGEMENT',
            name: 'Hostel Management App',
            description: 'Hostels, rooms, residents, rent dues, food & ledger',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M3 2.25a.75.75 0 01.75.75v.54l1.838-.46a9.75 9.75 0 016.725.738l.108.054a8.25 8.25 0 005.58.052l3.109-.732a.75.75 0 01.917.78l-.817 14.704a.75.75 0 01-.917.78l-3.109-.732a9.75 9.75 0 00-6.725.738l-.108.054a8.25 8.25 0 01-5.58.052l-1.838-.46V21a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75z" clipRule="evenodd" />
                </svg>
            ),
            path: '/hostel-management/user/dashboard',
            isActive: true
        }
    ], []);

    const buildChoicesFromMembership = (app) => {
        const platformAccounts = membershipAccounts.filter((account) => {
            const roleCode = accountNameToRoleCode(account.accountName);
            if (!roleCode) return false;
            if (app.appCode === 'PEOPLE_ACCESS') return roleCode === 'USER';
            return Boolean(APP_ROUTES[app.appCode]?.[roleCode] || app.path || app.defaultRoute);
        });

        return platformAccounts.map((account) => {
            const roleCode = accountNameToRoleCode(account.accountName);
            return {
                roleCode: roleCode === 'USER' && isOwner ? 'USER' : roleCode,
                accountName: account.accountName,
                membershipId: account.membershipId,
                parentMembershipId: account.parent_membership_id,
                enrollmentId: null,
                permissions: roleCode === 'USER' && isOwner ? ['*'] : [],
                permissionDetails: [],
            };
        });
    };

    const getAccountChoices = (app) => {
        if (app.appCode === 'PEOPLE_ACCESS') {
            const ownerChoice = {
                roleCode: 'OWNER',
                accountName: roleCodeToAccountName('USER', membershipAccounts),
                enrollmentId: null,
                permissions: [],
                permissionDetails: [],
            };
            return [ownerChoice];
        }

        // Source of truth is app-specific enrollments from the platform session.
        // Do NOT reuse Manager/Collector memberships from other apps (e.g. Chit Fund
        // dual roles must not appear on Daily Collection).
        if (Array.isArray(app.roles) && app.roles.length) {
            const byRole = new Map();
            app.roles.forEach((role) => {
                const key = String(role.roleCode || '').toUpperCase();
                if (!key) return;
                byRole.set(key, {
                    ...role,
                    accountName: role.accountName
                        || roleCodeToAccountName(role.roleCode, membershipAccounts),
                });
            });
            return [...byRole.values()];
        }

        // Legacy fallback only when this app has no enrolled roles in the session.
        return buildChoicesFromMembership(app);
    };

    const customerApps = useMemo(() => {
        const list = user?.results?.customerApps || [];
        return list.map((item, index) => {
            const knownApp = allApps.find((app) => app.appCode === item.appCode);
            const path = item.path || CUSTOMER_APP_PATHS[item.appCode] || knownApp?.path || '#';
            const baseName = cleanAppDisplayName(item.appCode, item.displayName || knownApp?.name || item.appCode);
            const companyLabel = item.companyName ? ` · ${item.companyName}` : '';
            return {
                ...(knownApp || {
                    id: item.appCode,
                    icon: <FiShield className="w-full h-full" />,
                    isActive: true,
                }),
                id: `customer-${item.appCode}-${item.parentMembershipId}-${index}`,
                appCode: item.appCode,
                name: `${baseName}${companyLabel}`,
                description: item.companyName
                    ? `Open subscriber portal for ${item.companyName}`
                    : 'Open your subscriber / customer portal',
                path,
                parentMembershipId: item.parentMembershipId,
                accountLabel: 'Subscriber',
                accountKind: 'subscriber',
                isCustomerApp: true,
                isActive: true,
                roles: [{
                    roleCode: 'SUBSCRIBER',
                    accountName: 'Subscriber',
                    parentMembershipId: item.parentMembershipId,
                    enrollmentId: null,
                    permissions: [],
                    permissionDetails: [],
                }],
            };
        });
    }, [user?.results?.customerApps, allApps]);

    const apps = useMemo(() => {
        const peopleAccessApp = {
            id: 'people-access',
            appCode: 'PEOPLE_ACCESS',
            name: 'Employee & Access',
            description: 'Manage employees, app roles and feature permissions',
            path: '/platform/employees',
            isActive: true,
            accountLabel: 'Owner',
            accountKind: 'staff',
            icon: <FiUsers className="w-full h-full" />,
            roles: [{
                roleCode: 'OWNER',
                accountName: roleCodeToAccountName('USER', membershipAccounts),
                enrollmentId: null,
                permissions: [],
                permissionDetails: [],
            }],
        };

        let staffApps = [];

        if (platform?.isAvailable && platform.organizations?.length) {
            const sessionApps = platform.organizations.flatMap((organization) => (
                (organization.apps || []).map((sessionApp) => {
                    const knownApp = allApps.find((item) => item.appCode === sessionApp.appCode);
                    return {
                        ...(knownApp || {
                            id: sessionApp.appCode,
                            icon: <FiShield className="w-full h-full" />,
                            description: 'Open this application',
                            isActive: true,
                        }),
                        ...sessionApp,
                        name: sessionApp.displayName || knownApp?.name || sessionApp.appCode,
                        parentMembershipId: organization.parentMembershipId
                            ?? organization.parent_membership_id,
                        roles: sessionApp.roles || [],
                    };
                })
            ));

            const seen = new Set();
            const uniqueApps = sessionApps.filter((app) => {
                const key = `${app.parentMembershipId}:${app.appCode}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            staffApps = isOwner
                ? uniqueApps
                : uniqueApps.filter((app) => Array.isArray(app.roles) && app.roles.length > 0);
        } else if (isOwner) {
            staffApps = allApps.map((app) => ({
                ...app,
                roles: [{
                    roleCode: 'USER',
                    accountName: 'User',
                    enrollmentId: null,
                    permissions: ['*'],
                    permissionDetails: [],
                    parentMembershipId: membershipAccounts[0]?.parent_membership_id,
                }],
            }));
        } else if (membershipAccounts.length) {
            staffApps = allApps
                .map((app) => {
                    const choices = buildChoicesFromMembership(app);
                    if (!choices.length) return null;
                    return {
                        ...app,
                        roles: choices,
                        parentMembershipId: choices[0]?.parentMembershipId
                            ?? membershipAccounts[0]?.parent_membership_id,
                    };
                })
                .filter(Boolean);
        }

        // One card per staff role (Manager, Collector, Accountant, User) so dual-role
        // users can pick Manager vs Subscriber as separate accounts.
        const staffAccountCards = staffApps.flatMap((app) => {
            const baseName = cleanAppDisplayName(app.appCode, app.displayName || app.name || app.appCode);
            const roles = Array.isArray(app.roles) ? app.roles : [];
            const staffRoles = roles.filter((role) => {
                const code = String(role.roleCode || '').toUpperCase();
                return ['USER', 'OWNER', 'MANAGER', 'COLLECTOR', 'ACCOUNTANT', 'RECEPTIONIST', 'KITCHEN_STAFF'].includes(code);
            });

            if (!staffRoles.length) {
                if (!isOwner) return [];
                return [{
                    ...app,
                    id: `staff-${app.appCode}-${app.parentMembershipId || 'org'}-USER`,
                    name: baseName,
                    description: app.description || '',
                    accountLabel: 'Owner',
                    accountKind: 'staff',
                    isCustomerApp: false,
                    isStaffAccount: true,
                    singleRole: {
                        roleCode: 'USER',
                        accountName: 'User',
                        enrollmentId: null,
                        permissions: ['*'],
                        permissionDetails: [],
                    },
                }];
            }

            return staffRoles.map((role) => {
                const roleCode = String(role.roleCode || '').toUpperCase();
                const roleLabel = formatAccountLabel(
                    role.accountName || roleCodeToAccountName(roleCode, membershipAccounts) || roleCode
                );
                return {
                    ...app,
                    id: `staff-${app.appCode}-${app.parentMembershipId || 'org'}-${roleCode}`,
                    name: baseName,
                    description: app.description || '',
                    accountLabel: roleLabel,
                    accountKind: 'staff',
                    isCustomerApp: false,
                    isStaffAccount: true,
                    singleRole: {
                        ...role,
                        roleCode,
                        accountName: role.accountName || roleLabel,
                    },
                    roles: [role],
                };
            });
        });

        if (isOwner) {
            staffAccountCards.push(peopleAccessApp);
        }

        // Always show every subscriber portal alongside staff accounts.
        return [...staffAccountCards, ...customerApps];
    }, [
        isOwner,
        membershipAccounts,
        platform?.isAvailable,
        platform?.organizations,
        allApps,
        customerApps,
    ]);

    const { bookmarkedApps, otherApps } = useMemo(() => {
        const bookmarked = [];
        const others = [];
        apps.forEach((app) => {
            if (bookmarkedIds.includes(getAppBookmarkId(app))) {
                bookmarked.push(app);
            } else {
                others.push(app);
            }
        });
        // Keep bookmark order stable from storage (most recently bookmarked first).
        bookmarked.sort((a, b) => (
            bookmarkedIds.indexOf(getAppBookmarkId(a)) - bookmarkedIds.indexOf(getAppBookmarkId(b))
        ));
        return { bookmarkedApps: bookmarked, otherApps: others };
    }, [apps, bookmarkedIds]);

    const openWithAccount = (app, choice) => {
        const parentMembershipId = app.parentMembershipId
            ?? choice.parentMembershipId
            ?? platform.organizations?.[0]?.parentMembershipId
            ?? platform.organizations?.[0]?.parent_membership_id
            ?? membershipAccounts[0]?.parent_membership_id;

        platform.selectAppRole(parentMembershipId, app, choice);
        updateUserRole(formatAccountLabel(choice.accountName || choice.roleCode));
        setAccountChoice(null);
        history.push(resolveRoute(app, choice));
    };

    const handleAppSelection = (app) => {
        if (!app.isActive || app.path === '#') return;

        // Subscriber / customer portal (e.g. Chit Fund subscriber, DC customer)
        if (app.isCustomerApp) {
            if (app.appCode === 'CHIT_FUND' && user?.results?.token) {
                localStorage.setItem('subscriber_token', user.results.token);
                localStorage.setItem('subscriber_user', JSON.stringify(user.results));
            }
            updateUserRole('Subscriber');
            history.push(app.path);
            return;
        }

        // Staff account already flattened to one role per card
        if (app.isStaffAccount && app.singleRole) {
            openWithAccount(app, app.singleRole);
            return;
        }

        if (app.appCode === 'PEOPLE_ACCESS') {
            const choices = getAccountChoices(app);
            openWithAccount(app, choices[0] || app.roles?.[0] || { roleCode: 'OWNER', accountName: 'User' });
            return;
        }

        const choices = getAccountChoices(app);
        if (choices.length === 0) {
            history.push(app.path);
            return;
        }
        if (choices.length === 1) {
            openWithAccount(app, choices[0]);
            return;
        }
        setAccountChoice({ app, choices });
    };

    const handleLogout = () => {
        platform?.clearActiveContext();
        logout();
        history.push('/login');
    };

    const renderAppCard = (app, index) => {
        const theme = getAppTheme(app.appCode);
        const bookmarkId = getAppBookmarkId(app);
        const isBookmarked = bookmarkedIds.includes(bookmarkId);
        const title = String(app.name || theme.shortName || app.appCode)
            .replace(/^MyTreasure\s*[-–—:]\s*/i, '')
            .trim() || theme.shortName || app.appCode;

        return (
            <div
                key={app.id || `${app.parentMembershipId || 'app'}-${app.appCode}-${app.accountLabel || index}`}
                onClick={() => handleAppSelection(app)}
                className={`
                    group relative border-2 rounded-xl p-3 sm:p-4
                    transition-all duration-300 ease-in-out
                    flex flex-col items-center text-center gap-2 sm:gap-2.5
                    shadow-sm hover:shadow-md ring-1 ${theme.ring} ${theme.softBg}
                    ${app.isActive
                        ? `${theme.border} cursor-pointer hover:-translate-y-0.5`
                        : 'border-gray-300 opacity-60 cursor-not-allowed bg-gray-50'
                    }
                `}
                style={{
                    animation: `fadeIn 0.4s ease-out ${index * 0.05}s backwards`,
                    borderTopColor: app.isActive ? theme.accent : undefined,
                    borderTopWidth: app.isActive ? 3 : undefined,
                }}
            >
                <div className={`
                    absolute top-0 left-0 w-full h-1 rounded-t-[10px]
                    transition-transform duration-300 origin-left scale-x-0
                    group-hover:scale-x-100
                    ${app.isActive ? theme.bar : 'bg-gray-400'}
                `} />

                <button
                    type="button"
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark app'}
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark for quick access'}
                    onClick={(event) => toggleBookmark(event, app)}
                    className={`
                        absolute top-2 left-2 z-10 p-1.5 rounded-lg transition-colors
                        ${isBookmarked
                            ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                            : 'text-gray-400 bg-white/80 hover:text-amber-500 hover:bg-amber-50'
                        }
                    `}
                >
                    <FiBookmark
                        className="w-4 h-4"
                        fill={isBookmarked ? 'currentColor' : 'none'}
                    />
                </button>

                {app.accountLabel ? (
                    <span className={`absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        app.accountKind === 'subscriber'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-white/90 text-gray-700 border border-gray-200'
                    }`}>
                        {app.accountLabel}
                    </span>
                ) : null}

                <div className={`
                    w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center
                    transition-all duration-300 shadow-sm mt-1
                    group-hover:scale-105
                    ${app.isActive ? theme.iconBg : 'bg-gray-400'}
                `}>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 text-white">
                        {app.icon}
                    </div>
                </div>

                <div className="flex-1 min-w-0 w-full px-1">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-0.5 leading-snug">
                        {title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-600 leading-snug line-clamp-2">
                        {app.description}
                    </p>
                    {Array.isArray(app.roles) && app.roles.length > 1 ? (
                        <p className="text-[10px] text-gray-500 mt-1">
                            {app.roles.length} accounts available
                        </p>
                    ) : null}
                </div>

                {!app.isActive && (
                    <div className="absolute bottom-2 right-2 bg-gray-700 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide">
                        Coming Soon
                    </div>
                )}
            </div>
        );
    };

    if (!platform?.hasLoaded) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-gray-600">Loading your applications…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <MyTreasureBrand subtitle="Select which app to open" inverse />

                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-3">
                                <div className="relative">
                                    <img
                                        src={user?.results?.userDetail?.user_image_s3_image || user?.results?.user_image_s3_image || 'https://i.imgur.com/ndu6pfe.png'}
                                        alt={displayName}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white/40 shadow-md"
                                        onError={(e) => {
                                            e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                        }}
                                    />
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-white">
                                        Welcome, {displayName}!
                                    </p>
                                    {accountSubtitle ? (
                                        <p className="text-xs text-red-100">
                                            {accountSubtitle}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="sm:hidden">
                                <img
                                    src={user?.results?.userDetail?.user_image_s3_image || user?.results?.user_image_s3_image || 'https://i.imgur.com/ndu6pfe.png'}
                                    alt={displayName}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-white/40 shadow-md"
                                    onError={(e) => {
                                        e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleLogout}
                                className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 border border-white/30"
                            >
                                <FiLogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
                <div className="text-center mb-8 sm:mb-12">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                        Choose your app
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
                        {customerApps.length && apps.some((app) => app.accountKind === 'staff')
                            ? 'You have employee and subscriber access. Pick Manager / Collector for staff apps, or Subscriber for your customer portal.'
                            : 'Select an application to get started. Tap the bookmark to pin favorites to the top.'}
                    </p>
                </div>

                {apps.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-gray-50 rounded-xl border border-gray-200 mb-8 max-w-5xl mx-auto">
                        <p className="text-gray-800 font-medium">No applications available yet</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Ask your organization owner to assign you an app role in Employee &amp; Access.
                        </p>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto space-y-8 mb-8 sm:mb-10">
                        {bookmarkedApps.length > 0 ? (
                            <section>
                                <div className="flex items-center gap-2 mb-3 px-0.5">
                                    <FiBookmark className="w-4 h-4 text-amber-500" fill="currentColor" />
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                        Bookmarked
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                    {bookmarkedApps.map((app, index) => renderAppCard(app, index))}
                                </div>
                            </section>
                        ) : null}

                        <section>
                            {bookmarkedApps.length > 0 ? (
                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 px-0.5">
                                    All apps
                                </h3>
                            ) : null}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                {(bookmarkedApps.length ? otherApps : apps).map((app, index) => (
                                    renderAppCard(app, index + bookmarkedApps.length)
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                <div className="text-center pt-8 sm:pt-12 mt-8 sm:mt-12 border-t border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-500">
                        © 2024 Treasure Finance Hub. All rights reserved.
                    </p>
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

            {accountChoice && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Choose an account</h2>
                                <p className="text-sm text-gray-500 mt-1">{accountChoice.app.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setAccountChoice(null)}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="mt-5 space-y-3">
                            {accountChoice.choices.map((choice) => {
                                const label = formatAccountLabel(
                                    choice.accountName || roleCodeToAccountName(choice.roleCode, membershipAccounts)
                                );
                                return (
                                    <button
                                        key={`${choice.roleCode}-${choice.enrollmentId || choice.membershipId || label}`}
                                        type="button"
                                        onClick={() => openWithAccount(accountChoice.app, choice)}
                                        className="w-full text-left border border-gray-200 rounded-xl px-4 py-3 hover:border-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <span className="font-semibold text-gray-900">{label}</span>
                                        <span className="block text-xs text-gray-500 mt-1">
                                            Open {accountChoice.app.name} as {label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppSelectionPage;
