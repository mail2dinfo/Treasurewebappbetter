import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { usePlatformAccess } from '../context/platformAccess_context';
import { FiLogOut, FiShield, FiUsers, FiX } from 'react-icons/fi';
import MyTreasureBrand from '../components/MyTreasureBrand';

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
    },
    PERSONAL_FINANCE: {
        USER: '/personal-finance/user/dashboard',
        MANAGER: '/personal-finance/user/dashboard',
        COLLECTOR: '/personal-finance/user/dashboard',
        ACCOUNTANT: '/personal-finance/user/dashboard',
    },
};

const CUSTOMER_APP_PATHS = {
    CHIT_FUND: '/chit-fund/subscriber',
    DAILY_COLLECTION: '/daily-collection/customer/dashboard',
    VEHICLE_FINANCE: '/vehicle-finance/customer/dashboard',
    PERSONAL_LOAN: '/personal-loan/customer/dashboard',
};

const PLATFORM_ACCOUNT_ROLE = {
    user: 'USER',
    manager: 'MANAGER',
    collector: 'COLLECTOR',
    accountant: 'ACCOUNTANT',
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
            name: 'MyTreasure - Chit Fund',
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
            name: 'MyTreasure - Daily Collection',
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
            name: 'MyTreasure - Personal Loan',
            description: 'Personal loan lending and collections',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 8.25a3 3 0 100 6 3 3 0 000-6z" />
                    <path d="M12 15.75a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm.75-4.5a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z" />
                </svg>
            ),
            path: '/personal-loan/user/dashboard',
            isActive: true
        },
        {
            id: 4,
            appCode: 'VEHICLE_FINANCE',
            name: 'MyTreasure - Vehicle Finance App',
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
            name: 'MyTreasure - Personal Finance',
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
            const baseName = item.displayName || knownApp?.name || item.appCode;
            const companyLabel = item.companyName ? ` · ${item.companyName}` : '';
            return {
                ...(knownApp || {
                    id: item.appCode,
                    icon: <FiShield className="w-full h-full" />,
                    isActive: true,
                }),
                id: `customer-${item.appCode}-${item.parentMembershipId}-${index}`,
                appCode: item.appCode,
                name: `${baseName} · Subscriber${companyLabel}`,
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
            name: 'Employee & Access · Owner',
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
            const baseName = app.displayName || app.name || app.appCode;
            const roles = Array.isArray(app.roles) ? app.roles : [];
            const staffRoles = roles.filter((role) => {
                const code = String(role.roleCode || '').toUpperCase();
                return ['USER', 'OWNER', 'MANAGER', 'COLLECTOR', 'ACCOUNTANT'].includes(code);
            });

            if (!staffRoles.length) {
                if (!isOwner) return [];
                return [{
                    ...app,
                    id: `staff-${app.appCode}-${app.parentMembershipId || 'org'}-USER`,
                    name: `${baseName} · Owner`,
                    description: 'Open as company owner / admin',
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
                    name: `${baseName} · ${roleLabel}`,
                    description: `Open as ${roleLabel}`,
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
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <MyTreasureBrand subtitle="Select which app to open" />

                        <div className="flex items-center space-x-4">
                            <div className="hidden sm:flex items-center space-x-3">
                                <div className="relative">
                                    <img
                                        src={user?.results?.userDetail?.user_image_s3_image || user?.results?.user_image_s3_image || 'https://i.imgur.com/ndu6pfe.png'}
                                        alt={displayName}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-md"
                                        onError={(e) => {
                                            e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                        }}
                                    />
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        Welcome, {displayName}!
                                    </p>
                                    {accountSubtitle ? (
                                        <p className="text-xs text-gray-500">
                                            {accountSubtitle}
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="sm:hidden">
                                <img
                                    src={user?.results?.userDetail?.user_image_s3_image || user?.results?.user_image_s3_image || 'https://i.imgur.com/ndu6pfe.png'}
                                    alt={displayName}
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 shadow-md"
                                    onError={(e) => {
                                        e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                            >
                                <FiLogOut className="w-4 h-4" />
                                <span>Logout</span>
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
                            : 'Select an application to get started'}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-5xl mx-auto">
                    {apps.length === 0 ? (
                        <div className="col-span-full text-center py-12 px-4 bg-gray-50 rounded-xl border border-gray-200">
                            <p className="text-gray-800 font-medium">No applications available yet</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Ask your organization owner to assign you an app role in Employee &amp; Access.
                            </p>
                        </div>
                    ) : null}
                    {apps.map((app, index) => (
                        <div
                            key={app.id || `${app.parentMembershipId || 'app'}-${app.appCode}-${app.accountLabel || index}`}
                            onClick={() => handleAppSelection(app)}
                            className={`
                group relative bg-white border-2 rounded-xl p-5 sm:p-6
                transition-all duration-300 ease-in-out
                flex flex-col items-center text-center gap-3 sm:gap-4
                shadow-sm hover:shadow-lg
                ${app.isActive
                                    ? 'border-custom-red cursor-pointer hover:-translate-y-1 hover:border-custom-red-dark'
                                    : 'border-gray-300 opacity-60 cursor-not-allowed'
                                }
              `}
                            style={{
                                animation: `fadeIn 0.4s ease-out ${index * 0.05}s backwards`
                            }}
                        >
                            <div className={`
                absolute top-0 left-0 w-full h-1 rounded-t-xl
                transition-transform duration-300 origin-left scale-x-0
                group-hover:scale-x-100
                ${app.isActive ? 'bg-custom-red' : 'bg-gray-400'}
              `} />

                            {app.accountLabel ? (
                                <span className={`absolute top-3 right-3 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    app.accountKind === 'subscriber'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-red-50 text-red-700'
                                }`}>
                                    {app.accountLabel}
                                </span>
                            ) : null}

                            <div className={`
                w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center
                transition-all duration-300 shadow-md
                group-hover:scale-105
                ${app.isActive ? 'bg-custom-red group-hover:bg-custom-red-dark' : 'bg-gray-400'}
              `}>
                                <div className="w-7 h-7 sm:w-8 sm:h-8 text-white">
                                    {app.icon}
                                </div>
                            </div>

                            <div className="flex-1">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">
                                    {app.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    {app.description}
                                </p>
                                {Array.isArray(app.roles) && app.roles.length > 1 ? (
                                    <p className="text-[11px] text-gray-500 mt-2">
                                        {app.roles.length} accounts available
                                    </p>
                                ) : null}
                            </div>

                            {!app.isActive && (
                                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gray-700 text-white text-[10px] sm:text-xs font-semibold px-2 py-1 rounded uppercase tracking-wide">
                                    Coming Soon
                                </div>
                            )}
                        </div>
                    ))}
                </div>

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
