import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { usePlatformAccess } from '../context/platformAccess_context';
import { FiBookmark, FiLogOut, FiShield, FiUsers, FiX, FiGrid, FiPlusCircle, FiMoreVertical } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MyTreasureBrand from '../components/MyTreasureBrand';
import { API_BASE_URL } from '../utils/apiConfig';
import { BILLING_APP_CODES, getBillingPathForApp } from '../utils/billingAppCodes';
import { BILLING_PLANS, mergePlansWithCatalog } from '../utils/billingPlans';

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
    MUTTON_STALL: {
        shortName: 'Mutton Stall POS',
        accent: '#9F1239',
        iconBg: 'bg-rose-800',
        softBg: 'bg-rose-50',
        border: 'border-rose-200 hover:border-rose-500',
        bar: 'bg-rose-800',
        ring: 'ring-rose-100',
    },
    HOSPITAL_MANAGEMENT: {
        shortName: 'Hospital Management',
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
        MANAGER: '/hostel-management/manager/dashboard',
        RECEPTIONIST: '/hostel-management/receptionist/dashboard',
        KITCHEN_STAFF: '/hostel-management/kitchenstaff/food-report',
        COLLECTOR: '/hostel-management/user/dashboard',
        ACCOUNTANT: '/hostel-management/user/dashboard',
        SUBSCRIBER: '/hostel-management/resident/dashboard',
    },
    MUTTON_STALL: {
        USER: '/mutton-stall/user/dashboard',
        MANAGER: '/mutton-stall/manager/dashboard',
        SALESMAN: '/mutton-stall/salesman/dashboard',
        COLLECTOR: '/mutton-stall/user/dashboard',
        ACCOUNTANT: '/mutton-stall/user/dashboard',
        SUBSCRIBER: '/mutton-stall/customer/dashboard',
    },
    HOSPITAL_MANAGEMENT: {
        USER: '/hospital-management/user/dashboard',
        MANAGER: '/hospital-management/manager/dashboard',
        RECEPTIONIST: '/hospital-management/receptionist/dashboard',
        DOCTOR: '/hospital-management/user/dashboard',
        ACCOUNTANT: '/hospital-management/user/dashboard',
        COLLECTOR: '/hospital-management/user/dashboard',
    },
};

const CUSTOMER_APP_PATHS = {
    CHIT_FUND: '/chit-fund/subscriber',
    DAILY_COLLECTION: '/daily-collection/customer/dashboard',
    VEHICLE_FINANCE: '/vehicle-finance/customer/dashboard',
    PERSONAL_LOAN: '/personal-loan/customer/dashboard',
    RENTAL_MANAGEMENT: '/rental-management/customer/dashboard',
    HOSTEL_MANAGEMENT: '/hostel-management/resident/dashboard',
    MUTTON_STALL: '/mutton-stall/customer/dashboard',
};

const PLATFORM_ACCOUNT_ROLE = {
    user: 'USER',
    manager: 'MANAGER',
    collector: 'COLLECTOR',
    accountant: 'ACCOUNTANT',
    receptionist: 'RECEPTIONIST',
    'kitchen staff': 'KITCHEN_STAFF',
    kitchen_staff: 'KITCHEN_STAFF',
    salesman: 'SALESMAN',
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
    if (key.includes('salesman') || key.includes('sales man')) return 'SALESMAN';
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
    const [billingSummary, setBillingSummary] = useState({
        loaded: false,
        subscribedCodes: [],
        unusedCodes: Object.values(BILLING_APP_CODES),
    });
    const [enablingAppCode, setEnablingAppCode] = useState('');
    const [planPicker, setPlanPicker] = useState(null); // { app, plans, loading, selectedPlanId }
    const [cardMenuAppId, setCardMenuAppId] = useState(null);
    const [unsubscribeModal, setUnsubscribeModal] = useState(null);
    // unsubscribeModal: { app, phase: 'confirm'|'blocked'|'working', outstanding }

    const membershipAccounts = useMemo(
        () => uniqueMembershipAccounts(user?.results?.userAccounts || []),
        [user?.results?.userAccounts]
    );

    useEffect(() => {
        try {
            const raw = localStorage.getItem(bookmarkStorageKey(user));
            const parsed = raw ? JSON.parse(raw) : [];
            setBookmarkedIds(Array.isArray(parsed) ? parsed.map(String) : []);
        } catch {
            setBookmarkedIds([]);
        }
    }, [user]);

    // After stall public landing → login, resume customer order app
    useEffect(() => {
        try {
            const redirect = sessionStorage.getItem('ms_post_login_redirect');
            if (redirect && user?.results?.token) {
                sessionStorage.removeItem('ms_post_login_redirect');
                history.replace(redirect);
            }
        } catch {
            // ignore
        }
    }, [user, history]);

    const token = user?.results?.token || localStorage.getItem('token') || '';

    const billingMembershipId = useMemo(() => {
        const fromOrg = platform?.organizations?.[0]?.parentMembershipId
            ?? platform?.organizations?.[0]?.parent_membership_id;
        if (fromOrg) return Number(fromOrg);
        const fromAccount = membershipAccounts[0]?.parent_membership_id
            ?? membershipAccounts[0]?.membershipId;
        return fromAccount ? Number(fromAccount) : null;
    }, [platform?.organizations, membershipAccounts]);

    const loadBillingAppsSummary = useCallback(async () => {
        if (!token || !billingMembershipId) {
            setBillingSummary({
                loaded: true,
                subscribedCodes: [],
                unusedCodes: Object.values(BILLING_APP_CODES),
            });
            return;
        }
        try {
            const res = await fetch(
                `${API_BASE_URL}/billing-subscription/${billingMembershipId}/apps-summary`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) {
                setBillingSummary({
                    loaded: true,
                    subscribedCodes: [],
                    unusedCodes: Object.values(BILLING_APP_CODES),
                });
                return;
            }
            const payload = data.data || {};
            setBillingSummary({
                loaded: true,
                subscribedCodes: (payload.subscribed_app_codes || []).map((c) => String(c).toUpperCase()),
                unusedCodes: (payload.unused_app_codes || Object.values(BILLING_APP_CODES))
                    .map((c) => String(c).toUpperCase()),
            });
        } catch {
            setBillingSummary({
                loaded: true,
                subscribedCodes: [],
                unusedCodes: Object.values(BILLING_APP_CODES),
            });
        }
    }, [token, billingMembershipId]);

    useEffect(() => {
        loadBillingAppsSummary();
    }, [loadBillingAppsSummary]);

    useEffect(() => {
        if (!cardMenuAppId) return undefined;
        const onDocClick = () => setCardMenuAppId(null);
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, [cardMenuAppId]);

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
        },
        {
            id: 8,
            appCode: 'MUTTON_STALL',
            name: 'Mutton Stall POS',
            description: 'Stock, customer orders, billing, daybook & reports',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 106 0v-.75a.75.75 0 011.5 0v.75a4.5 4.5 0 11-9 0v-.75a.75.75 0 011.5 0v.75z" clipRule="evenodd" />
                </svg>
            ),
            path: '/mutton-stall/user/dashboard',
            isActive: true
        },
        {
            id: 9,
            appCode: 'HOSPITAL_MANAGEMENT',
            name: 'Hospital Management',
            description: 'OPD, IPD, pharmacy, billing, ledger & daybook',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM8.25 9.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM12 15.75a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V16.5a.75.75 0 01.75-.75h.008z" clipRule="evenodd" />
                    <path d="M11.25 6.75h1.5v3.75h3.75v1.5h-3.75v3.75h-1.5v-3.75H7.5v-1.5h3.75V6.75z" />
                </svg>
            ),
            path: '/hospital-management/user/dashboard',
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
                return ['USER', 'OWNER', 'MANAGER', 'COLLECTOR', 'ACCOUNTANT', 'RECEPTIONIST', 'KITCHEN_STAFF', 'SALESMAN'].includes(code);
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

    const subscribedCodeSet = useMemo(
        () => new Set(billingSummary.subscribedCodes || []),
        [billingSummary.subscribedCodes]
    );

    const { bookmarkedApps, otherApps, yourApps, unusedApps } = useMemo(() => {
        // Your apps = openable cards that are actually billed (active/suspended),
        // plus customer portals and Employee & Access (not billing products).
        const using = apps.filter((app) => {
            const code = String(app.appCode || '').toUpperCase();
            if (code === 'PEOPLE_ACCESS') return true;
            if (app.isCustomerApp || app.accountKind === 'subscriber') return true;
            if (!billingSummary.loaded) return true; // avoid empty flash while loading
            // Non-billing catalog codes (none today) stay if user has access
            if (!Object.values(BILLING_APP_CODES).includes(code)) return true;
            return subscribedCodeSet.has(code);
        });

        const bookmarked = [];
        const others = [];
        using.forEach((app) => {
            if (bookmarkedIds.includes(getAppBookmarkId(app))) {
                bookmarked.push(app);
            } else {
                others.push(app);
            }
        });
        bookmarked.sort((a, b) => (
            bookmarkedIds.indexOf(getAppBookmarkId(a)) - bookmarkedIds.indexOf(getAppBookmarkId(b))
        ));

        const unused = allApps
            .filter((app) => {
                const code = String(app.appCode || '').toUpperCase();
                if (!billingSummary.loaded) return false;
                return !subscribedCodeSet.has(code);
            })
            .map((app) => ({
                ...app,
                name: cleanAppDisplayName(app.appCode, app.name),
                accountLabel: null,
                accountKind: 'unused',
                isCustomerApp: false,
                isStaffAccount: false,
                isUnused: true,
                isActive: false,
                id: `unused-${app.appCode}`,
            }));

        return {
            bookmarkedApps: bookmarked,
            otherApps: others,
            yourApps: using,
            unusedApps: unused,
        };
    }, [apps, allApps, bookmarkedIds, billingSummary.loaded, subscribedCodeSet]);

    const openPlanPicker = async (app) => {
        const appCode = String(app.appCode || '').toUpperCase();
        if (!isOwner) {
            toast.info('Ask your organization owner to enable this app for you.');
            return;
        }
        if (!billingMembershipId || !token) {
            toast.error('Cannot enable app — membership not found');
            return;
        }

        setPlanPicker({
            app,
            plans: BILLING_PLANS,
            loading: true,
            selectedPlanId: 'VeryBasic',
        });

        try {
            const res = await fetch(
                `${API_BASE_URL}/billing-subscription/plans/available?app_code=${encodeURIComponent(appCode)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json().catch(() => ({}));
            const apiPlans = Array.isArray(data.data) ? data.data : [];
            setPlanPicker((prev) => (prev ? {
                ...prev,
                loading: false,
                plans: mergePlansWithCatalog(apiPlans),
            } : null));
        } catch {
            setPlanPicker((prev) => (prev ? {
                ...prev,
                loading: false,
                plans: BILLING_PLANS,
            } : null));
        }
    };

    const enableUnusedApp = async (app, planId) => {
        const appCode = String(app.appCode || '').toUpperCase();
        if (!isOwner) {
            toast.info('Ask your organization owner to enable this app for you.');
            return;
        }
        if (!billingMembershipId || !token) {
            toast.error('Cannot enable app — membership not found');
            return;
        }
        if (!planId) {
            toast.error('Please select a plan');
            return;
        }

        setEnablingAppCode(appCode);
        try {
            const res = await fetch(
                `${API_BASE_URL}/billing-subscription/${billingMembershipId}/ensure`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ app_code: appCode, plan_id: planId }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.success === false) {
                toast.error(data.message || 'Failed to enable app');
                return;
            }
            toast.success(
                data.data?.reactivated
                    ? `${cleanAppDisplayName(appCode, app.name)} re-enabled on ${planId}`
                    : data.data?.created === false
                        ? `${cleanAppDisplayName(appCode, app.name)} already enabled`
                        : `${cleanAppDisplayName(appCode, app.name)} enabled on ${planId} (trial)`
            );
            setPlanPicker(null);
            await loadBillingAppsSummary();
        } catch (err) {
            toast.error(err.message || 'Failed to enable app');
        } finally {
            setEnablingAppCode('');
        }
    };

    const canManageBillingForApp = (app) => {
        if (!isOwner || !app) return false;
        if (app.isUnused || app.isCustomerApp || app.accountKind === 'subscriber') return false;
        const code = String(app.appCode || '').toUpperCase();
        if (code === 'PEOPLE_ACCESS') return false;
        return Object.values(BILLING_APP_CODES).includes(code);
    };

    const openUnsubscribeModal = (event, app) => {
        event.preventDefault();
        event.stopPropagation();
        setCardMenuAppId(null);
        if (!canManageBillingForApp(app)) return;
        setUnsubscribeModal({
            app,
            phase: 'confirm',
            outstanding: null,
        });
    };

    const confirmUnsubscribe = async () => {
        const app = unsubscribeModal?.app;
        if (!app || !billingMembershipId || !token) return;
        const appCode = String(app.appCode || '').toUpperCase();

        setUnsubscribeModal((prev) => (prev ? { ...prev, phase: 'working' } : null));
        try {
            const res = await fetch(
                `${API_BASE_URL}/billing-subscription/${billingMembershipId}/unsubscribe`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ app_code: appCode }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.success === false) {
                if (data.code === 'PENDING_DUES' || res.status === 400) {
                    setUnsubscribeModal({
                        app,
                        phase: 'blocked',
                        outstanding: data.data || null,
                        message: data.message,
                    });
                    return;
                }
                toast.error(data.message || 'Failed to unsubscribe');
                setUnsubscribeModal(null);
                return;
            }
            toast.success(`${cleanAppDisplayName(appCode, app.name)} unsubscribed — monthly bills stopped`);
            setUnsubscribeModal(null);
            await loadBillingAppsSummary();
        } catch (err) {
            toast.error(err.message || 'Failed to unsubscribe');
            setUnsubscribeModal(null);
        }
    };

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
        if (app.isUnused) {
            openPlanPicker(app);
            return;
        }
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

    const renderAppCard = (app, index, { showBookmark = true } = {}) => {
        const theme = getAppTheme(app.appCode);
        const bookmarkId = getAppBookmarkId(app);
        const isBookmarked = bookmarkedIds.includes(bookmarkId);
        const unused = Boolean(app.isUnused);
        const cardKey = app.id || `${app.parentMembershipId || 'app'}-${app.appCode}-${app.accountLabel || index}`;
        const menuOpen = cardMenuAppId === cardKey;
        const showBillingMenu = canManageBillingForApp(app);
        const title = String(app.name || theme.shortName || app.appCode)
            .replace(/^MyTreasure\s*[-–—:]\s*/i, '')
            .trim() || theme.shortName || app.appCode;

        return (
            <div
                key={cardKey}
                onClick={() => handleAppSelection(app)}
                className={`
                    group relative border-2 rounded-xl p-2.5 sm:p-3
                    transition-all duration-300 ease-in-out
                    flex flex-col items-center text-center gap-1.5 sm:gap-2
                    shadow-sm hover:shadow-md ring-1 cursor-pointer hover:-translate-y-0.5
                    ${theme.ring} ${theme.softBg} ${theme.border}
                    ${unused ? '' : (!app.isActive ? 'opacity-60 cursor-not-allowed' : '')}
                `}
                style={{
                    animation: `fadeIn 0.4s ease-out ${index * 0.05}s backwards`,
                    borderTopColor: (unused || app.isActive) ? theme.accent : undefined,
                    borderTopWidth: (unused || app.isActive) ? 3 : undefined,
                }}
            >
                <div className={`
                    absolute top-0 left-0 w-full h-1 rounded-t-[10px]
                    transition-transform duration-300 origin-left scale-x-0
                    group-hover:scale-x-100
                    ${theme.bar}
                `} />

                {showBookmark && !unused ? (
                    <button
                        type="button"
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark app'}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark for quick access'}
                        onClick={(event) => toggleBookmark(event, app)}
                        className={`
                            absolute top-1.5 left-1.5 z-10 p-1 rounded-md transition-colors
                            ${isBookmarked
                                ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                                : 'text-gray-400 bg-white/80 hover:text-amber-500 hover:bg-amber-50'
                            }
                        `}
                    >
                        <FiBookmark
                            className="w-3.5 h-3.5"
                            fill={isBookmarked ? 'currentColor' : 'none'}
                        />
                    </button>
                ) : null}

                <div className="absolute top-1.5 right-1.5 z-20 flex items-start gap-1">
                    {unused ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/95 text-gray-700 border border-gray-200 shadow-sm">
                            Not in use
                        </span>
                    ) : app.accountLabel ? (
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                            app.accountKind === 'subscriber'
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-white/90 text-gray-700 border border-gray-200'
                        }`}>
                            {app.accountLabel}
                        </span>
                    ) : null}

                    {showBillingMenu ? (
                        <div className="relative">
                            <button
                                type="button"
                                aria-label="App actions"
                                title="App actions"
                                onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setCardMenuAppId((prev) => (prev === cardKey ? null : cardKey));
                                }}
                                className="p-1 rounded-md bg-white/90 border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm"
                            >
                                <FiMoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {menuOpen ? (
                                <div
                                    className="absolute right-0 mt-1 w-44 rounded-xl border border-gray-200 bg-white shadow-lg py-1 text-left"
                                    onClick={(event) => event.stopPropagation()}
                                >
                                    <button
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                                        onClick={(event) => openUnsubscribeModal(event, app)}
                                    >
                                        Unsubscribe
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <div className={`
                    w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center
                    transition-all duration-300 shadow-sm mt-0.5
                    group-hover:scale-105
                    ${theme.iconBg}
                `}>
                    <div className="w-4 h-4 text-white">
                        {app.icon}
                    </div>
                </div>

                <div className="flex-1 min-w-0 w-full px-0.5">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-0.5 leading-snug">
                        {title}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-gray-600 leading-snug line-clamp-2">
                        {unused ? (app.description || 'Available on MyTreasure') : app.description}
                    </p>
                    {!unused && Array.isArray(app.roles) && app.roles.length > 1 ? (
                        <p className="text-[9px] text-gray-500 mt-0.5">
                            {app.roles.length} accounts available
                        </p>
                    ) : null}
                    {unused ? (
                        <p className="text-[9px] font-medium mt-1 inline-flex items-center gap-1 justify-center"
                            style={{ color: theme.accent }}
                        >
                            <FiPlusCircle className="w-3 h-3" />
                            {enablingAppCode === String(app.appCode || '').toUpperCase()
                                ? 'Enabling…'
                                : (isOwner ? 'Tap to choose plan & enable' : 'Ask owner to enable')}
                        </p>
                    ) : null}
                </div>

                {!unused && !app.isActive && (
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

    const yourAppsList = bookmarkedApps.length
        ? [...bookmarkedApps, ...otherApps]
        : yourApps;

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

            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
                        Choose your app
                    </h2>
                    <p className="text-sm sm:text-base text-gray-500 max-w-3xl">
                        Your apps are products with an active billing subscription. Unused apps can be enabled by the owner.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start mb-8 sm:mb-10">
                    {/* Left — apps in use */}
                    <section className="rounded-2xl border border-red-100 bg-gradient-to-b from-red-50/60 to-white p-4 sm:p-5 shadow-sm min-h-[20rem]">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shrink-0">
                                    <FiGrid className="w-4 h-4" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-gray-900">Your apps</h3>
                                    <p className="text-xs text-gray-500">
                                        Based on billing subscription
                                        {yourAppsList.length ? ` · ${yourAppsList.length}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {yourAppsList.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
                                <p className="text-gray-800 font-medium">No applications available yet</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Ask your organization owner to assign you an app role in Employee &amp; Access.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {bookmarkedApps.length > 0 ? (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2.5 px-0.5">
                                            <FiBookmark className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
                                            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                                Bookmarked
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                                            {bookmarkedApps.map((app, index) => renderAppCard(app, index))}
                                        </div>
                                    </div>
                                ) : null}

                                <div>
                                    {bookmarkedApps.length > 0 ? (
                                        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2.5 px-0.5">
                                            All your apps
                                        </h4>
                                    ) : null}
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                                        {(bookmarkedApps.length ? otherApps : yourApps).map((app, index) => (
                                            renderAppCard(app, index + bookmarkedApps.length)
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Right — unused / catalog */}
                    <section className="rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4 sm:p-5 shadow-sm min-h-[20rem] lg:sticky lg:top-20">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-stone-700 text-white shadow-sm shrink-0">
                                    <FiPlusCircle className="w-4 h-4" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-gray-900">Unused apps</h3>
                                    <p className="text-xs text-gray-500">
                                        No active subscription yet
                                        {unusedApps.length ? ` · ${unusedApps.length}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {unusedApps.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
                                <p className="text-gray-800 font-medium">You’re using every available app</p>
                                <p className="text-sm text-gray-500 mt-2">
                                    New products will show up here when they’re added to MyTreasure.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                                {unusedApps.map((app, index) => renderAppCard(app, index, { showBookmark: false }))}
                            </div>
                        )}
                    </section>
                </div>

                <div className="text-center pt-8 sm:pt-10 mt-4 border-t border-gray-200">
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

            {unsubscribeModal && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {unsubscribeModal.phase === 'blocked'
                                        ? 'Cannot unsubscribe yet'
                                        : 'Unsubscribe from app?'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {cleanAppDisplayName(
                                        unsubscribeModal.app.appCode,
                                        unsubscribeModal.app.name
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => unsubscribeModal.phase !== 'working' && setUnsubscribeModal(null)}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                                disabled={unsubscribeModal.phase === 'working'}
                            >
                                <FiX />
                            </button>
                        </div>

                        {unsubscribeModal.phase === 'blocked' ? (
                            <div className="mt-4 space-y-3">
                                <p className="text-sm text-gray-700">
                                    {unsubscribeModal.message
                                        || 'Clear pending bills for this app before unsubscribing.'}
                                </p>
                                {unsubscribeModal.outstanding?.outstanding_amount != null ? (
                                    <p className="text-sm font-semibold text-red-700">
                                        Pending: ₹
                                        {Number(unsubscribeModal.outstanding.outstanding_amount || 0)
                                            .toLocaleString('en-IN')}
                                        {unsubscribeModal.outstanding.outstanding_count
                                            ? ` · ${unsubscribeModal.outstanding.outstanding_count} cycle(s)`
                                            : ''}
                                    </p>
                                ) : null}
                                <p className="text-xs text-gray-500">
                                    Pay dues first. After that you can unsubscribe and stop new monthly bills.
                                </p>
                                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setUnsubscribeModal(null)}
                                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const path = getBillingPathForApp(unsubscribeModal.app.appCode);
                                            setUnsubscribeModal(null);
                                            history.push(path);
                                        }}
                                        className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                                    >
                                        Pay dues
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 space-y-3">
                                <ul className="text-sm text-gray-700 space-y-1.5 list-disc pl-5">
                                    <li>New monthly bills for this app will stop</li>
                                    <li>You can enable it again later from Unused apps</li>
                                    <li>Existing payment history is kept</li>
                                </ul>
                                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setUnsubscribeModal(null)}
                                        disabled={unsubscribeModal.phase === 'working'}
                                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmUnsubscribe}
                                        disabled={unsubscribeModal.phase === 'working'}
                                        className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {unsubscribeModal.phase === 'working' ? 'Unsubscribing…' : 'Unsubscribe'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {planPicker && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Choose a plan</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {cleanAppDisplayName(planPicker.app.appCode, planPicker.app.name)}
                                    {' · '}
                                    Starts with a free trial on the plan you select
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => !enablingAppCode && setPlanPicker(null)}
                                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                                disabled={Boolean(enablingAppCode)}
                            >
                                <FiX />
                            </button>
                        </div>

                        {planPicker.loading ? (
                            <p className="mt-8 text-center text-sm text-gray-500">Loading plans…</p>
                        ) : (
                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {(planPicker.plans || []).map((plan) => {
                                    const selected = planPicker.selectedPlanId === plan.id;
                                    return (
                                        <button
                                            key={plan.id}
                                            type="button"
                                            onClick={() => setPlanPicker((prev) => (
                                                prev ? { ...prev, selectedPlanId: plan.id } : null
                                            ))}
                                            className={`text-left rounded-xl border-2 px-4 py-3.5 transition-colors ${
                                                selected
                                                    ? 'border-red-600 bg-red-50 ring-1 ring-red-200'
                                                    : 'border-gray-200 hover:border-red-300 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-gray-900">{plan.name}</span>
                                                <span className="text-sm font-semibold tabular-nums text-gray-800">
                                                    ₹{Number(plan.price || 0).toLocaleString('en-IN')}/mo
                                                </span>
                                            </div>
                                            {Array.isArray(plan.features) && plan.features.length > 0 ? (
                                                <ul className="mt-2 space-y-1">
                                                    {plan.features.slice(0, 4).map((feature) => (
                                                        <li key={feature} className="text-xs text-gray-500">
                                                            · {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setPlanPicker(null)}
                                disabled={Boolean(enablingAppCode)}
                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!planPicker.selectedPlanId || Boolean(enablingAppCode) || planPicker.loading}
                                onClick={() => enableUnusedApp(planPicker.app, planPicker.selectedPlanId)}
                                className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                                {enablingAppCode
                                    ? 'Enabling…'
                                    : `Start trial on ${planPicker.selectedPlanId || 'plan'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
            <ToastContainer position="top-right" autoClose={3500} />
        </div>
    );
};

export default AppSelectionPage;
