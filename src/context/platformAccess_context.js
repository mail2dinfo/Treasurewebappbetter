import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { API_BASE_URL, readApiResponse } from '../utils/apiConfig';
import {
    CHIT_MANAGER_DEFAULT_FEATURES,
    permissionGrantsFeature,
} from '../utils/chitPermissionCatalog';
import { vfPermissionGrantsFeature } from '../utils/vfPermissionCatalog';
import { useUserContext } from './user_context';

const STORAGE_KEY = 'platform_active_context';
const PlatformAccessContext = createContext(null);

const normalizeResults = (data) => data?.results ?? data ?? {};

const readStoredContext = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
};

const normalizePermission = (permission) => (
    typeof permission === 'string'
        ? permission
        : permission?.featureKey || permission?.feature_key || permission?.key
);

const getGrantedPermissions = (role) => {
    const fromPermissions = (role?.permissions || role?.effectivePermissions || [])
        .filter((permission) => typeof permission === 'string' || permission?.isGranted === true)
        .map(normalizePermission)
        .filter(Boolean);
    if (fromPermissions.length) return fromPermissions;
    return (role?.permissionDetails || [])
        .filter((permission) => permission?.isGranted === true)
        .map(normalizePermission)
        .filter(Boolean);
};

const roleHasPermissionMatrix = (role) => (
    Array.isArray(role?.permissionDetails) && role.permissionDetails.length > 0
);

const normalizeSession = (data) => {
    if (Array.isArray(data.organizations)) {
        return {
            isOwner: Boolean(data.isOwner ?? data.is_owner),
            organizations: data.organizations,
        };
    }

    const organizations = [];
    (data.access || []).forEach((access) => {
        let organization = organizations.find(
            (item) => String(item.parentMembershipId) === String(access.parentMembershipId)
        );
        if (!organization) {
            organization = { parentMembershipId: access.parentMembershipId, apps: [] };
            organizations.push(organization);
        }
        const permissions = access.effectivePermissions || [];
        organization.apps.push({
            appCode: access.appCode,
            displayName: access.displayName || access.appName,
            defaultRoute: access.defaultRoute,
            roles: (access.roles || []).map((role, index) => {
                const isRoleObject = typeof role === 'object' && role !== null;
                const roleCode = isRoleObject ? role.roleCode : role;
                return {
                    roleCode,
                    accountName: (isRoleObject && (role.accountName || role.account_name))
                        || roleCode,
                    enrollmentId: (isRoleObject && role.enrollmentId) || access.enrollmentIds?.[index],
                    permissions: isRoleObject ? getGrantedPermissions(role) : permissions,
                    permissionDetails: isRoleObject ? (role.permissionDetails || []) : [],
                };
            }),
        });
    });
    return {
        isOwner: Boolean(data.isOwner ?? data.is_owner),
        organizations,
    };
};

export const PlatformAccessProvider = ({ children }) => {
    const { user, isLoggedIn } = useUserContext();
    const [session, setSession] = useState(null);
    const [activeContext, setActiveContext] = useState(readStoredContext);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [isAvailable, setIsAvailable] = useState(false);
    const [error, setError] = useState('');

    const loadSession = useCallback(async (tokenOverride) => {
        const token = tokenOverride || user?.results?.token || localStorage.getItem('token');
        if (!token) {
            setSession(null);
            setIsAvailable(false);
            setHasLoaded(true);
            return null;
        }

        setIsLoading(true);
        setHasLoaded(false);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/platform/access/session`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = normalizeResults(await readApiResponse(response));
            const normalizedSession = normalizeSession(data);
            setSession(normalizedSession);
            setIsAvailable(true);

            const stored = readStoredContext();
            if (stored) {
                const organization = normalizedSession.organizations.find(
                    (item) => String(item.parentMembershipId ?? item.parent_membership_id) === String(stored.parentMembershipId)
                );
                const app = organization?.apps?.find((item) => item.appCode === stored.appCode);
                const role = app?.roles?.find(
                    (item) => String(item.enrollmentId) === String(stored.enrollmentId)
                        || item.roleCode === stored.roleCode
                );
                if (!normalizedSession.isOwner && (!organization || !app || !role)) {
                    localStorage.removeItem(STORAGE_KEY);
                    setActiveContext(null);
                } else if (!normalizedSession.isOwner && role) {
                    const refreshedContext = {
                        ...stored,
                        displayName: app.displayName,
                        roleCode: role.roleCode,
                        enrollmentId: role.enrollmentId,
                        permissions: getGrantedPermissions(role),
                        permissionDetails: role.permissionDetails || [],
                        permissionsConfigured: roleHasPermissionMatrix(role),
                    };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshedContext));
                    setActiveContext(refreshedContext);
                }
            }
            return normalizedSession;
        } catch (loadError) {
            setSession(null);
            setIsAvailable(false);
            setError(loadError.message);
            return null;
        } finally {
            setIsLoading(false);
            setHasLoaded(true);
        }
    }, [user]);

    useEffect(() => {
        if (isLoggedIn && user?.results?.token) {
            loadSession();
        } else if (!isLoggedIn) {
            setSession(null);
            setIsAvailable(false);
            setActiveContext(null);
            setHasLoaded(false);
        }
    }, [isLoggedIn, user?.results?.token, loadSession]);

    const selectAppRole = useCallback((parentMembershipId, app, role) => {
        const roleCode = String(role?.roleCode || '').toUpperCase();
        const nextContext = {
            parentMembershipId,
            appCode: app?.appCode,
            displayName: app?.displayName,
            roleCode,
            accountName: role?.accountName || role?.roleCode,
            enrollmentId: role?.enrollmentId,
            permissions: getGrantedPermissions(role),
            permissionDetails: role?.permissionDetails || [],
            permissionsConfigured: roleHasPermissionMatrix(role),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextContext));
        setActiveContext(nextContext);

        const sharedUser = user?.results;
        if (roleCode === 'COLLECTOR' && sharedUser?.token) {
            if (nextContext.appCode === 'CHIT_FUND') {
                localStorage.setItem('collector_token', sharedUser.token);
                localStorage.setItem('collector_user', JSON.stringify(sharedUser));
            }
            if (nextContext.appCode === 'VEHICLE_FINANCE') {
                localStorage.setItem('vf_collector_token', sharedUser.token);
                localStorage.setItem('vf_collector_user', JSON.stringify(sharedUser));
                localStorage.setItem('vf_collector_membership_id', String(parentMembershipId || ''));
            }
        }
        return nextContext;
    }, [user]);

    const hasPermission = useCallback((featureKey) => {
        const key = String(featureKey || '');
        const isVfFeature = key.startsWith('vf_') || key.startsWith('vf.');
        const roleCode = String(activeContext?.roleCode || '').toUpperCase();
        // Owner bypass only for owner/user context — never when acting as Manager/Collector.
        const staffRoleActive = ['MANAGER', 'COLLECTOR', 'ACCOUNTANT'].includes(roleCode);
        if (session?.isOwner && !staffRoleActive) return true;

        // Fail closed for VF until session/context is known (never grant by default).
        if (!isAvailable || !hasLoaded) {
            return isVfFeature ? false : true;
        }
        if (!activeContext) {
            return isVfFeature ? false : true;
        }
        if (activeContext.appCode && activeContext.appCode !== 'VEHICLE_FINANCE' && isVfFeature) {
            return false;
        }
        // Dot-notation aliases → canonical feature keys only (no sibling expansion).
        const requestAliases = {
            'vf.company': ['vf_company_view', 'vf_company', 'vf_company_add', 'vf_company_edit'],
            'vf.subscribers': ['vf_module_subscribers_view', 'vf_subscriber_view'],
            'vf.loans': ['vf_module_loans_view', 'vf_loan_view'],
            'vf.ledger': ['vf_module_ledger_view', 'vf_ledger_view_account', 'vf_ledger_view_entry'],
            'vf.collections': ['vf_module_collections_view', 'vf_collections_view'],
            'vf.reports': ['vf_module_reports_view'],
            'vf.employees': ['vf_module_employees_view'],
            // Collector portal (/chit-fund/collector/*) — grantable on People & Access
            'chit.collector.dashboard': ['chit_collector_dashboard', 'chit_home_view_receivable', 'chit_dashboard'],
            'chit.collector.portal': [
                'chit_collector_dashboard',
                'chit_receivables_view',
                'chit_receivables_pay',
                'chit_collector_advances',
                'chit_collector_portal',
                'chit_collector_collect_receivables',
            ],
            'chit.collector.receivables': ['chit_receivables_view', 'chit_collector_receivables'],
            'chit.collector.collections': [
                'chit_receivables_pay',
                'chit_collector_collections',
                'chit_collector_collect_receivables',
            ],
            'chit.collector.receipts': [
                'chit_receivables_pay',
                'chit_collector_receipts',
                'chit_collector_collect_receivables',
            ],
            'chit.collector.advances': ['chit_collector_advances', 'chit_collector_collect_receivables'],
        };
        const requestedKeys = [
            featureKey,
            ...(requestAliases[featureKey] || []),
        ].filter(Boolean);

        const permissionDetails = activeContext.permissionDetails || [];
        const assignedPermissions = activeContext.permissions || [];
        const matrixConfigured = Boolean(activeContext.permissionsConfigured)
            || permissionDetails.length > 0;

        // Saved People & Access matrix is the only source of truth (no stale localStorage grants).
        if (matrixConfigured && permissionDetails.length) {
            return requestedKeys.some((requested) => {
                const detail = permissionDetails.find(
                    (item) => (item.featureKey || item.feature_key) === requested
                );
                return Boolean(detail && (detail.isGranted === true || detail.is_granted === true));
            });
        }

        // Wildcard from owner session payloads (owner/user context only)
        if (assignedPermissions.includes('*') && !staffRoleActive) return true;

        // VF Manager/Collector/Accountant: Step 3 matrix only — never catalog defaults.
        if (
            activeContext.appCode === 'VEHICLE_FINANCE'
            && staffRoleActive
        ) {
            if (!matrixConfigured) return false;
            return assignedPermissions.some((permission) => (
                requestedKeys.some((requested) => (
                    vfPermissionGrantsFeature(permission, requested)
                ))
            ));
        }

        let effectivePermissions = assignedPermissions;
        if (!assignedPermissions.length && !matrixConfigured && activeContext.roleCode === 'MANAGER') {
            if (activeContext.appCode === 'CHIT_FUND') {
                effectivePermissions = CHIT_MANAGER_DEFAULT_FEATURES;
            }
        }

        return effectivePermissions.some((permission) => (
            requestedKeys.some((requested) => (
                permissionGrantsFeature(permission, requested)
                || vfPermissionGrantsFeature(permission, requested)
            ))
        ));
    }, [activeContext, hasLoaded, isAvailable, session]);

    const hasAnyPermission = useCallback((featureKeys = []) => (
        featureKeys.some((featureKey) => hasPermission(featureKey))
    ), [hasPermission]);

    const clearActiveContext = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setActiveContext(null);
    }, []);

    const value = useMemo(() => ({
        session,
        organizations: session?.organizations || [],
        isOwner: Boolean(session?.isOwner),
        isLoading,
        hasLoaded,
        isAvailable,
        error,
        activeContext,
        loadSession,
        selectAppRole,
        hasPermission,
        hasAnyPermission,
        clearActiveContext,
    }), [
        session,
        isLoading,
        hasLoaded,
        isAvailable,
        error,
        activeContext,
        loadSession,
        selectAppRole,
        hasPermission,
        hasAnyPermission,
        clearActiveContext,
    ]);

    return (
        <PlatformAccessContext.Provider value={value}>
            {children}
        </PlatformAccessContext.Provider>
    );
};

export const usePlatformAccess = () => useContext(PlatformAccessContext) || {
    session: null,
    organizations: [],
    isOwner: false,
    isLoading: false,
    hasLoaded: false,
    isAvailable: false,
    error: '',
    activeContext: null,
    loadSession: async () => null,
    selectAppRole: () => null,
    // Fail closed when provider is missing — never grant VF access by default.
    hasPermission: () => false,
    hasAnyPermission: () => false,
    clearActiveContext: () => {},
};

