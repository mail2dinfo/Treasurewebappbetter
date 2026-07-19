import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FiArrowLeft, FiBarChart2, FiEdit2, FiEye, FiFileText, FiGrid, FiList, FiLogOut, FiMapPin, FiMinus, FiPlus, FiPower, FiTrash2, FiUsers, FiX } from 'react-icons/fi';
import { API_BASE_URL, readApiResponse } from '../utils/apiConfig';
import {
    CHIT_ADMINISTRATION_CATEGORIES,
    CHIT_FEATURE_CATEGORIES,
    CHIT_GRANULAR_FEATURES,
    CHIT_HIDDEN_FEATURE_KEYS,
    CHIT_LEGACY_TO_GRANULAR,
    CHIT_MANAGER_DEFAULT_FEATURES,
    featuresAssignableToRole,
    toFallbackFeature,
} from '../utils/chitPermissionCatalog';
import {
    VF_ADMINISTRATION_CATEGORIES,
    VF_GRANULAR_FEATURES,
    VF_LEGACY_TO_GRANULAR,
    expandVfPermissionMatches,
    toVfFallbackFeature,
} from '../utils/vfPermissionCatalog';
import { useUserContext } from '../context/user_context';
import { usePlatformAccess } from '../context/platformAccess_context';
import MyTreasureBrand from '../components/MyTreasureBrand';
import CollectorDashboardModal from '../components/CollectorDashboardModal';
import ChitFundOfferLetterPDF from '../components/chitFund/PDF/ChitFundOfferLetterPDF';
import VehicleFinanceOfferLetterPDF from '../components/vehicleFinance/PDF/VehicleFinanceOfferLetterPDF';
import VehicleFinanceCollectorAssignmentModal from '../components/vehicleFinance/VehicleFinanceCollectorAssignmentModal';

const MANAGER_SCOPE_PERMISSIONS = {
    CHIT_FUND: {
        appLabel: 'Chit Fund',
        accessAny: [
            'chit_employee_add',
            'chit_employee_manage',
            'chit_manager_view',
            'chit_collector_view',
            'chit_collector_add',
            'chit_collector_edit',
            'chit_collector_delete',
            'chit_collector_offer_letter',
            'chit_accountant_add',
            'chit_accountant_edit',
            'chit_accountant_delete',
            'chit_accountant_offer_letter',
        ],
        manageAll: 'chit_employee_manage',
        employeeAdd: 'chit_employee_add',
        collectorView: ['chit_collector_view', 'chit_collector_add', 'chit_collector_edit', 'chit_collector_delete', 'chit_collector_offer_letter', 'chit_employee_manage'],
        collectorAdd: 'chit_collector_add',
        collectorEdit: 'chit_collector_edit',
        collectorDelete: 'chit_collector_delete',
        collectorOffer: 'chit_collector_offer_letter',
        managerView: 'chit_manager_view',
        accountantAdd: 'chit_accountant_add',
        accountantEdit: 'chit_accountant_edit',
        accountantDelete: 'chit_accountant_delete',
        accountantOffer: 'chit_accountant_offer_letter',
        accountantViewKeys: ['chit_accountant_add', 'chit_accountant_edit', 'chit_accountant_delete', 'chit_accountant_offer_letter', 'chit_employee_manage'],
        blockedDelegation: [
            'people_access_manage',
            'chit_employee_add',
            'chit_employee_manage',
            'chit_manager_view',
            'chit_collector_view',
            'chit_collector_add',
            'chit_collector_edit',
            'chit_collector_delete',
            'chit_collector_offer_letter',
            'chit_collector_collect_receivables',
            'chit_accountant_add',
            'chit_accountant_edit',
            'chit_accountant_delete',
            'chit_accountant_offer_letter',
        ],
    },
    VEHICLE_FINANCE: {
        appLabel: 'Vehicle Finance',
        accessAny: [
            'vf_employee_add',
            'vf_employee_manage',
            'vf_offer_letter',
            'vf_collector_view',
            'vf_collector_add',
            'vf_collector_edit',
            'vf_collector_assign_area',
            'vf_accountant_view',
            'vf_accountant_add',
            'vf_accountant_edit',
            'vf_module_employees_view',
        ],
        manageAll: 'vf_employee_manage',
        employeeAdd: 'vf_employee_add',
        collectorView: ['vf_collector_view', 'vf_collector_add', 'vf_collector_edit', 'vf_collector_assign_area', 'vf_employee_manage', 'vf_employee_add'],
        collectorAdd: 'vf_collector_add',
        collectorEdit: 'vf_collector_edit',
        collectorDelete: 'vf_collector_edit',
        collectorAssignArea: 'vf_collector_assign_area',
        collectorOffer: 'vf_offer_letter',
        managerView: null,
        accountantAdd: 'vf_accountant_add',
        accountantEdit: 'vf_accountant_edit',
        accountantDelete: 'vf_accountant_edit',
        accountantOffer: 'vf_offer_letter',
        accountantViewKeys: ['vf_accountant_view', 'vf_accountant_add', 'vf_accountant_edit', 'vf_employee_manage', 'vf_employee_add', 'vf_offer_letter'],
        blockedDelegation: [
            'people_access_manage',
            'vf_employee_add',
            'vf_employee_manage',
            'vf_offer_letter',
            'vf_collector_view',
            'vf_collector_add',
            'vf_collector_edit',
            'vf_collector_assign_area',
            'vf_accountant_view',
            'vf_accountant_add',
            'vf_accountant_edit',
            'vf_module_employees_view',
        ],
    },
};

const emptyProfile = {
    name: '',
    phone: '',
    email: '',
    employeeCode: '',
    dateOfJoining: '',
    salary: '',
    loginPassword: '',
};

const APP_DISPLAY_ORDER = [
    'CHIT_FUND',
    'VEHICLE_FINANCE',
    'DAILY_COLLECTION',
    'PERSONAL_LOAN',
    'TWO_WHEELER_FINANCE',
    'UNASSIGNED',
];

const defaultAppLabel = (appCode) => {
    const labels = {
        CHIT_FUND: 'Chit Fund',
        VEHICLE_FINANCE: 'Vehicle Finance',
        DAILY_COLLECTION: 'Daily Collection',
        PERSONAL_LOAN: 'Personal Loan',
        TWO_WHEELER_FINANCE: 'Two Wheeler Finance',
        UNASSIGNED: 'Unassigned',
    };
    return labels[appCode] || appCode;
};

const unwrapList = (data, keys) => {
    const results = data?.results ?? data ?? [];
    if (Array.isArray(results)) return results;
    for (const key of keys) {
        if (Array.isArray(results?.[key])) return results[key];
    }
    return [];
};

const readOptionalPlatformList = async (response, keys) => {
    // A newly configured installation may not have the platform routes deployed
    // yet. Treat a missing list endpoint as an empty initial state.
    if (response.status === 404) return [];
    return unwrapList(await readApiResponse(response), keys);
};

const getAppCode = (app) => app.appCode || app.app_code || app.code;
const getRoleCode = (role) => (
    typeof role === 'string' ? role : role.roleCode || role.role_code || role.code
);
const getFeatureKey = (feature) => (
    typeof feature === 'string' ? feature : feature.featureKey || feature.feature_key || feature.key
);
const getFeatureLabel = (feature) => (
    typeof feature === 'string' ? feature : feature.displayName || feature.display_name || feature.name || getFeatureKey(feature)
);

const EMPLOYEE_ROLES = ['MANAGER', 'COLLECTOR', 'ACCOUNTANT'];
const fallbackFeature = (featureKey, displayName, category, defaultRoles) => ({
    featureKey,
    displayName,
    category,
    defaultRoles,
});
const FALLBACK_APP_CATALOG = [
    {
        appCode: 'CHIT_FUND',
        displayName: 'Chit Fund',
        description: 'Chit fund administration and collections',
        features: CHIT_GRANULAR_FEATURES.map(toFallbackFeature),
    },
    {
        appCode: 'VEHICLE_FINANCE',
        displayName: 'Vehicle Finance',
        description: 'Vehicle finance lending and collections',
        features: VF_GRANULAR_FEATURES.map(toVfFallbackFeature),
    },
    {
        appCode: 'DAILY_COLLECTION',
        displayName: 'Daily Collection',
        description: 'Daily collection lending operations',
        features: [
            fallbackFeature('dc_dashboard', 'View Dashboard', 'Overview', ['MANAGER', 'COLLECTOR', 'ACCOUNTANT']),
            fallbackFeature('dc_subscriber_manage', 'Manage Subscribers', 'Subscribers', ['MANAGER']),
            fallbackFeature('dc_loan_manage', 'Manage Loans', 'Loans', ['MANAGER']),
            fallbackFeature('dc_collections', 'Collections', 'Collections', ['MANAGER', 'COLLECTOR']),
            fallbackFeature('dc_ledger', 'Ledger', 'Accounting', ['ACCOUNTANT']),
            fallbackFeature('dc_reports', 'Reports', 'Reports', ['MANAGER', 'ACCOUNTANT']),
        ],
    },
    {
        appCode: 'PERSONAL_LOAN',
        displayName: 'Personal Loan',
        description: 'Personal loan lending operations',
        features: [
            fallbackFeature('pl_dashboard', 'View Dashboard', 'Overview', ['MANAGER', 'COLLECTOR', 'ACCOUNTANT']),
            fallbackFeature('pl_subscriber_manage', 'Manage Subscribers', 'Subscribers', ['MANAGER']),
            fallbackFeature('pl_loan_manage', 'Manage Loans', 'Loans', ['MANAGER']),
            fallbackFeature('pl_collections', 'Collections', 'Collections', ['MANAGER', 'COLLECTOR']),
            fallbackFeature('pl_ledger', 'Ledger', 'Accounting', ['ACCOUNTANT']),
            fallbackFeature('pl_reports', 'Reports', 'Reports', ['MANAGER', 'ACCOUNTANT']),
        ],
    },
];

const CHIT_FEATURE_ORDER = CHIT_MANAGER_DEFAULT_FEATURES;
const CHIT_CATEGORY_ORDER = CHIT_FEATURE_CATEGORIES;

const sortChitFeatures = (features) => [...features].sort((left, right) => {
    const leftKey = getFeatureKey(left);
    const rightKey = getFeatureKey(right);
    const leftIndex = CHIT_FEATURE_ORDER.indexOf(leftKey);
    const rightIndex = CHIT_FEATURE_ORDER.indexOf(rightKey);
    if (leftIndex === -1 && rightIndex === -1) return 0;
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
});

const sortChitCategories = (entries) => [...entries].sort((left, right) => {
    const leftIndex = CHIT_CATEGORY_ORDER.indexOf(left[0]);
    const rightIndex = CHIT_CATEGORY_ORDER.indexOf(right[0]);
    if (leftIndex === -1 && rightIndex === -1) return 0;
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
});

const mergeCatalogWithFallback = (catalogList) => {
    const source = catalogList.length ? catalogList : FALLBACK_APP_CATALOG;
    return source.map((app) => {
        const appCode = getAppCode(app);
        const fallbackApp = FALLBACK_APP_CATALOG.find((item) => getAppCode(item) === appCode);
        if (!fallbackApp) return app;

        // Chit / VF Step 3: server catalog is source of truth (API rejects unknown keys).
        // Fallback list only orders/labels keys that already exist in DB.
        if (appCode === 'CHIT_FUND' || appCode === 'VEHICLE_FINANCE') {
            const granularFeatures = getFeatures(fallbackApp);
            const serverFeatures = getFeatures(app);
            const serverKeys = new Set(serverFeatures.map(getFeatureKey).filter(Boolean));
            const legacyKeys = new Set(Object.keys(
                appCode === 'CHIT_FUND' ? CHIT_LEGACY_TO_GRANULAR : VF_LEGACY_TO_GRANULAR
            ));
            if (!serverKeys.size) {
                return {
                    ...app,
                    features: appCode === 'CHIT_FUND'
                        ? sortChitFeatures(granularFeatures)
                        : granularFeatures,
                };
            }
            // Prefer frontend category/labels so Administration → Collector → Add Area nests
            // correctly even when DB still has flat category "Administration".
            const orderedKnown = granularFeatures.map((feature) => {
                const key = getFeatureKey(feature);
                const fromServer = serverFeatures.find((item) => getFeatureKey(item) === key);
                if (!fromServer) return feature;
                return {
                    ...fromServer,
                    category: feature.category || fromServer.category || fromServer.category_name,
                    displayName: fromServer.displayName || fromServer.display_name || feature.displayName,
                    defaultRoles: feature.defaultRoles
                        || fromServer.defaultRoles
                        || fromServer.default_roles
                        || [],
                };
            });
            const orderedKeys = new Set(orderedKnown.map(getFeatureKey));
            const serverExtras = serverFeatures.filter((feature) => {
                const key = getFeatureKey(feature);
                return key
                    && !orderedKeys.has(key)
                    && !legacyKeys.has(key)
                    && !(appCode === 'CHIT_FUND' && CHIT_HIDDEN_FEATURE_KEYS.has(key));
            });
            const merged = [...orderedKnown, ...serverExtras].filter((feature) => {
                const key = getFeatureKey(feature);
                return !(appCode === 'CHIT_FUND' && key && CHIT_HIDDEN_FEATURE_KEYS.has(key));
            });
            return {
                ...app,
                features: appCode === 'CHIT_FUND' ? sortChitFeatures(merged) : merged,
            };
        }

        const existingKeys = new Set(getFeatures(app).map(getFeatureKey).filter(Boolean));
        const missingFeatures = getFeatures(fallbackApp).filter(
            (feature) => !existingKeys.has(getFeatureKey(feature))
        );
        return {
            ...app,
            features: missingFeatures.length
                ? [...getFeatures(app), ...missingFeatures]
                : getFeatures(app),
        };
    });
};

const getRoles = (app) => {
    const configuredRoles = app.roles || app.defaultRoles || app.default_roles;
    if (configuredRoles?.length) {
        const employeeRoles = configuredRoles.filter((role) => EMPLOYEE_ROLES.includes(getRoleCode(role)));
        if (employeeRoles.length) return employeeRoles;
    }
    return EMPLOYEE_ROLES.map((roleCode) => ({ roleCode }));
};
// Owner hub is gated by account ownership — not shown as a Step 3 checkbox.
const STEP3_HIDDEN_FEATURE_KEYS = new Set(['people_access_manage']);

const getFeatures = (app) => (app.features || []).flatMap((feature) => {
    if (!Array.isArray(feature.features)) return feature;
    return feature.features.map((nestedFeature) => ({
        ...nestedFeature,
        category: nestedFeature.category || feature.category || feature.name,
    }));
});

const getStep3Features = (app) => getFeatures(app).filter(
    (feature) => !STEP3_HIDDEN_FEATURE_KEYS.has(getFeatureKey(feature))
);
const getDefaultPermissions = (role, app) => {
    const configured = role.permissions || role.defaultPermissions || role.default_permissions || role.features;
    if (configured?.length) {
        return configured.map(getFeatureKey).filter((key) => key && !STEP3_HIDDEN_FEATURE_KEYS.has(key));
    }
    const roleCode = getRoleCode(role);
    const appCode = getAppCode(app);
    if (roleCode === 'MANAGER' && appCode !== 'VEHICLE_FINANCE') {
        // Chit Manager "Select all" = every granular feature in the catalog.
        return getStep3Features(app).map(getFeatureKey).filter(Boolean);
    }
    // VF Manager (and all other roles): catalog default_roles only.
    return getStep3Features(app)
        .filter((feature) => (feature.defaultRoles || feature.default_roles || []).includes(roleCode))
        .map(getFeatureKey)
        .filter(Boolean);
};

const expandGrantedPermissions = (appCode, permissionKeys = []) => {
    const expanded = new Set();
    permissionKeys.forEach((key) => {
        if (!key || STEP3_HIDDEN_FEATURE_KEYS.has(key)) return;
        if (appCode === 'VEHICLE_FINANCE') {
            expandVfPermissionMatches(key).forEach((item) => expanded.add(item));
            return;
        }
        if (appCode === 'CHIT_FUND' && CHIT_LEGACY_TO_GRANULAR[key]) {
            CHIT_LEGACY_TO_GRANULAR[key].forEach((item) => expanded.add(item));
            expanded.add(key);
            return;
        }
        expanded.add(key);
    });
    // Drop deactivated VF coarse keys so save never resubmits them.
    if (appCode === 'VEHICLE_FINANCE') {
        Object.keys(VF_LEGACY_TO_GRANULAR).forEach((legacyKey) => expanded.delete(legacyKey));
    }
    STEP3_HIDDEN_FEATURE_KEYS.forEach((key) => expanded.delete(key));
    return [...expanded];
};

const normalizeEnrollment = (enrollment) => {
    const appCode = enrollment.appCode || enrollment.app_code;
    const granted = (enrollment.permissions || [])
        .filter((permission) => (
            typeof permission === 'string'
            || permission?.isGranted === true
            || permission?.is_granted === true
        ))
        .map(getFeatureKey)
        .filter(Boolean);
    return {
        appCode,
        roleCode: enrollment.roleCode || enrollment.role_code,
        // Expand legacy coarse VF keys (vf_reports / vf_ledger / vf_collections) to granular.
        permissions: expandGrantedPermissions(appCode, granted),
    };
};

const normalizeLegacyChitEmployees = (rows) => {
    const employeesByUser = new Map();
    rows.forEach((row) => {
        const employeeUserId = row.employee_user_id || row.user_id || row.id;
        if (!employeeUserId) return;
        const key = String(employeeUserId);
        if (!employeesByUser.has(key)) {
            employeesByUser.set(key, {
                id: `legacy-${key}`,
                employeeUserId,
                employmentStatus: 'ACTIVE',
                sourceSystem: 'LEGACY',
                user: {
                    id: employeeUserId,
                    name: row.name,
                    phone: row.phone,
                    email: row.email,
                    user_image: row.user_image,
                },
                enrollments: [],
            });
        }
        const roleCode = String(row.role || row.role_code || '').toUpperCase();
        const employee = employeesByUser.get(key);
        if (EMPLOYEE_ROLES.includes(roleCode)
            && !employee.enrollments.some((item) => item.roleCode === roleCode)) {
            employee.enrollments.push({
                appCode: 'CHIT_FUND',
                roleCode,
                permissions: [],
                isActive: true,
            });
        }
    });
    return [...employeesByUser.values()].filter((employee) => employee.enrollments.length);
};

const formatDateInput = (value) => value ? String(value).slice(0, 10) : '';

const PlatformEmployeesPage = ({
    appScope = null,
    managerMode = false,
    embedded = false,
    backPath = '/app-selection',
    pageTitle = 'Employee & Access',
}) => {
    const history = useHistory();
    const { user, logout, userRole } = useUserContext();
    const platform = usePlatformAccess();
    const token = user?.results?.token || localStorage.getItem('token');
    const userAccounts = user?.results?.userAccounts || [];
    const legacyIsOwner = userAccounts.some(
        (account) => String(account?.accountName || '').toLowerCase() === 'user'
    );
    const isOwner = platform?.isOwner || (!platform?.isAvailable && legacyIsOwner);
    const accountLabel = String(
        platform?.activeContext?.accountName
        || userAccounts.find((account) => {
            const role = String(platform?.activeContext?.roleCode || '').toUpperCase();
            const name = String(account?.accountName || '').toLowerCase();
            if (!role) return false;
            if (role === 'OWNER' || role === 'USER') return name === 'user';
            return name === role.toLowerCase();
        })?.accountName
        || userRole
        || userAccounts[0]?.accountName
        || ''
    ).trim().replace(/_/g, ' ').replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
    const scopeConfig = MANAGER_SCOPE_PERMISSIONS[appScope] || MANAGER_SCOPE_PERMISSIONS.CHIT_FUND;
    const scopedAppLabel = scopeConfig.appLabel;
    const isVfScoped = appScope === 'VEHICLE_FINANCE';
    const isChitScoped = appScope === 'CHIT_FUND';
    // Chit Fund + Vehicle Finance (scoped page or /platform/employees):
    // Collector/Accountant use the same role-package Step 3 as manager/employees.
    const usesCollectorAccountantPackage = (roleCode, forAppCode = null) => {
        const role = String(roleCode || '').toUpperCase();
        if (!['COLLECTOR', 'ACCOUNTANT'].includes(role)) return false;
        if (managerMode) return true;
        const appCode = String(forAppCode || appScope || '').toUpperCase();
        return appCode === 'VEHICLE_FINANCE' || appCode === 'CHIT_FUND';
    };
    const isScopedManager = Boolean(
        managerMode
        && appScope
        && MANAGER_SCOPE_PERMISSIONS[appScope]
        && platform?.activeContext?.appCode === appScope
        && platform?.activeContext?.roleCode === 'MANAGER'
        && platform.hasAnyPermission(scopeConfig.accessAny)
    );
    const canManageEmployees = isOwner || isScopedManager;
    const contextHasGranted = (featureKey) => {
        if (!featureKey) return false;
        if (platform.hasPermission(featureKey)) return true;
        const details = platform?.activeContext?.permissionDetails || [];
        return details.some((item) => {
            const key = item?.featureKey || item?.feature_key;
            return key === featureKey && (item?.isGranted === true || item?.is_granted === true);
        });
    };
    const hasManageAll = isOwner || contextHasGranted(scopeConfig.manageAll);
    const canViewCollectors = isOwner
        || scopeConfig.collectorView.some((key) => contextHasGranted(key));
    const canCreateCollector = isOwner || contextHasGranted(scopeConfig.collectorAdd) || hasManageAll;
    const canEditCollector = isOwner || contextHasGranted(scopeConfig.collectorEdit) || hasManageAll;
    const canDeleteCollector = isOwner || contextHasGranted(scopeConfig.collectorDelete) || hasManageAll;
    // Owner grants vf_collector_assign_area on /platform/employees
    // (Vehicle Finance → Administration → Collector → Add Area). Then Manager sees Add Area on collector cards.
    const canAssignCollectorArea = isOwner
        || contextHasGranted('vf_collector_assign_area')
        || contextHasGranted(scopeConfig.collectorAssignArea)
        || hasManageAll
        || Boolean(platform?.hasPermission?.('vf_collector_assign_area'));
    const canOfferLetterCollector = isOwner || contextHasGranted(scopeConfig.collectorOffer) || hasManageAll;
    const canViewManagers = isOwner
        || (scopeConfig.managerView ? contextHasGranted(scopeConfig.managerView) : false)
        || hasManageAll;
    const canMutateManagers = isOwner; // Only User/Owner can create/edit/delete Managers
    const canCreateAccountant = isOwner || contextHasGranted(scopeConfig.accountantAdd) || hasManageAll;
    const canEditAccountant = isOwner || contextHasGranted(scopeConfig.accountantEdit) || hasManageAll;
    const canDeleteAccountant = isOwner || contextHasGranted(scopeConfig.accountantDelete) || hasManageAll;
    const canOfferLetterAccountant = isOwner || contextHasGranted(scopeConfig.accountantOffer) || hasManageAll;
    // Manager may add only roles they have Add permission for (Collector / Accountant).
    const canAddEmployee = canMutateManagers
        || canCreateCollector
        || canCreateAccountant;
    const canAssignRole = (roleCode) => {
        // Managers cannot create/assign another Manager (same role).
        if (managerMode && roleCode === 'MANAGER') return false;
        if (isOwner || !managerMode) return true;
        if (roleCode === 'COLLECTOR') return canCreateCollector;
        if (roleCode === 'ACCOUNTANT') return canCreateAccountant;
        return false;
    };
    const getEmployeeRoles = (employee) => (
        (employee.enrollments || employee.roles || [])
            .filter((enrollment) => enrollment.isActive !== false && enrollment.is_active !== false)
            .map(getRoleCode)
            .filter(Boolean)
    );
    const employeeHasRole = (employee, roleCode) => getEmployeeRoles(employee).includes(roleCode);
    const getAssignableRoles = (app) => {
        // Manager create/edit: always offer Collector + Accountant (enable only if Add permission exists).
        if (managerMode) {
            return [
                { roleCode: 'COLLECTOR', displayName: 'Collector' },
                { roleCode: 'ACCOUNTANT', displayName: 'Accountant' },
            ];
        }
        // Chit / VF (user employees or platform → that app): Manager + Collector + Accountant.
        const appCode = getAppCode(app);
        if (
            isVfScoped
            || isChitScoped
            || appCode === 'VEHICLE_FINANCE'
            || appCode === 'CHIT_FUND'
        ) {
            const fromCatalog = getRoles(app).filter((role) => EMPLOYEE_ROLES.includes(getRoleCode(role)));
            const byCode = new Map(fromCatalog.map((role) => [getRoleCode(role), role]));
            return ['MANAGER', 'COLLECTOR', 'ACCOUNTANT'].map((roleCode) => (
                byCode.get(roleCode) || { roleCode, displayName: roleCode.charAt(0) + roleCode.slice(1).toLowerCase() }
            ));
        }
        return getRoles(app).filter((role) => EMPLOYEE_ROLES.includes(getRoleCode(role)));
    };
    // HR keys must not be copied onto Collector/Accountant enrollments.
    const getFeaturesForRoleAssignment = (features, roleCode, forAppCode = null) => {
        const appCode = String(forAppCode || appScope || '').toUpperCase();
        if (!usesCollectorAccountantPackage(roleCode, appCode)) return features;
        const blockedKeys = new Set(
            (MANAGER_SCOPE_PERMISSIONS[appCode] || scopeConfig).blockedDelegation || []
        );
        const roleFeatures = featuresAssignableToRole(
            features,
            roleCode,
            getFeatureKey,
            (feature) => feature.defaultRoles || feature.default_roles || []
        );
        // With Add for that role, show the role’s default package — not only features
        // the Manager personally holds (Managers rarely hold Ledger/Reports themselves).
        const canGrantRolePackage = isOwner
            || (roleCode === 'COLLECTOR' && canCreateCollector)
            || (roleCode === 'ACCOUNTANT' && canCreateAccountant);
        return roleFeatures.filter((feature) => {
            const featureKey = getFeatureKey(feature);
            if (!featureKey || blockedKeys.has(featureKey)) return false;
            if (canGrantRolePackage) return true;
            return platform.hasPermission(featureKey) || contextHasGranted(featureKey);
        });
    };
    const ownerMembershipId =
        platform?.activeContext?.parentMembershipId
        ?? userAccounts.find((account) => account?.parent_membership_id)?.parent_membership_id
        ?? userAccounts.find((account) => {
            const id = account?.membershipId ?? account?.membership_id;
            return id != null && String(account?.parent_membership_id ?? id) === String(id);
        })?.membershipId
        ?? userAccounts.find((account) => account?.membershipId)?.membershipId
        ?? platform?.organizations?.[0]?.parentMembershipId
        ?? platform?.organizations?.[0]?.parent_membership_id;

    const [employees, setEmployees] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [profile, setProfile] = useState(emptyProfile);
    const [editorStep, setEditorStep] = useState(1);
    const [editorError, setEditorError] = useState('');
    const [selectedAppCodes, setSelectedAppCodes] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const showCollectorAccountantPackageHint = !managerMode && (
        isVfScoped
        || isChitScoped
        || selectedAppCodes.includes('VEHICLE_FINANCE')
        || selectedAppCodes.includes('CHIT_FUND')
    );
    const packageHintAppLabel = (
        isChitScoped || (selectedAppCodes.includes('CHIT_FUND') && !selectedAppCodes.includes('VEHICLE_FINANCE'))
    )
        ? 'Chit Fund'
        : (isVfScoped || selectedAppCodes.includes('VEHICLE_FINANCE'))
            ? 'Vehicle Finance'
            : 'Chit Fund / Vehicle Finance';
    const [isSaving, setIsSaving] = useState(false);
    const [dashboardCollector, setDashboardCollector] = useState(null);
    const [collectorModalTab, setCollectorModalTab] = useState('assign');
    const [vfAreaEmployee, setVfAreaEmployee] = useState(null);
    const [viewEmployee, setViewEmployee] = useState(null);
    const [offerLetterData, setOfferLetterData] = useState(null);
    const [offerLetterLoading, setOfferLetterLoading] = useState(false);
    const [viewMode, setViewMode] = useState(
        () => localStorage.getItem('chit_employee_view') || 'grid'
    );
    // App sections on the list page: undefined/true = expanded, false = collapsed.
    const [expandedListApps, setExpandedListApps] = useState({});
    // App sections in Step 3 role/permission editor.
    const [expandedEditorApps, setExpandedEditorApps] = useState({});
    const stepThreeEnteredAtRef = useRef(0);

    const visibleEmployees = useMemo(() => {
        if (!managerMode) return employees;
        return employees.filter((employee) => {
            const roles = getEmployeeRoles(employee);
            if (roles.includes('MANAGER')) return canViewManagers;
            if (roles.includes('COLLECTOR')) return canViewCollectors;
            if (roles.includes('ACCOUNTANT')) {
                return scopeConfig.accountantViewKeys.some((key) => contextHasGranted(key))
                    || canCreateAccountant
                    || canEditAccountant
                    || canDeleteAccountant
                    || canOfferLetterAccountant
                    || isOwner;
            }
            return false;
        });
    }, [
        employees,
        managerMode,
        canViewManagers,
        canViewCollectors,
        canCreateAccountant,
        canEditAccountant,
        canDeleteAccountant,
        canOfferLetterAccountant,
        scopeConfig,
        isOwner,
    ]);

    const getAppLabel = useCallback((appCode) => {
        const app = catalog.find((item) => getAppCode(item) === appCode);
        return app?.displayName || app?.display_name || defaultAppLabel(appCode);
    }, [catalog]);

    const employeesByApp = useMemo(() => {
        const groups = new Map();
        const push = (appCode, employee) => {
            if (!groups.has(appCode)) groups.set(appCode, []);
            groups.get(appCode).push(employee);
        };

        visibleEmployees.forEach((employee) => {
            const codes = [...new Set(
                (employee.enrollments || employee.roles || [])
                    .filter((enrollment) => enrollment.isActive !== false && enrollment.is_active !== false)
                    .map(getAppCode)
                    .filter(Boolean)
            )];
            const scopedCodes = appScope
                ? codes.filter((code) => code === appScope)
                : codes;
            if (!scopedCodes.length) {
                if (!appScope) push('UNASSIGNED', employee);
                else if (codes.includes(appScope) || !codes.length) push(appScope, employee);
                return;
            }
            scopedCodes.forEach((code) => push(code, employee));
        });

        return APP_DISPLAY_ORDER
            .filter((code) => groups.has(code))
            .concat([...groups.keys()].filter((code) => !APP_DISPLAY_ORDER.includes(code)))
            .map((appCode) => ({
                appCode,
                label: getAppLabel(appCode),
                employees: groups.get(appCode) || [],
            }));
    }, [visibleEmployees, appScope, getAppLabel]);

    const isListAppExpanded = (appCode) => expandedListApps[appCode] !== false;
    const toggleListApp = (appCode) => {
        setExpandedListApps((current) => ({
            ...current,
            [appCode]: current[appCode] === false,
        }));
    };

    const isEditorAppExpanded = (appCode) => expandedEditorApps[appCode] !== false;
    const toggleEditorApp = (appCode) => {
        setExpandedEditorApps((current) => ({
            ...current,
            [appCode]: current[appCode] === false,
        }));
    };

    const authHeaders = useMemo(() => ({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    }), [token]);

    const changeViewMode = (mode) => {
        setViewMode(mode);
        localStorage.setItem('chit_employee_view', mode);
    };

    const userName = String(
        user?.results?.firstname || user?.results?.name || 'User'
    ).trim().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

    const handleLogout = () => {
        platform?.clearActiveContext();
        logout();
        history.push('/login');
    };

    const openCollectorPanel = (employeeProfile, employeeUser, initialTab) => {
        setCollectorModalTab(initialTab);
        setDashboardCollector({
            ...employeeUser,
            id: employeeProfile.employeeUserId || employeeProfile.employee_user_id || employeeUser.id,
            role: 'Collector',
        });
    };

    const loadData = useCallback(async () => {
        if (!token || !ownerMembershipId || !canManageEmployees) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const [employeeResult, catalogResult, legacyResult] = await Promise.allSettled([
                fetch(`${API_BASE_URL}/platform/employees?parent_membership_id=${encodeURIComponent(ownerMembershipId)}${appScope ? `&app_code=${encodeURIComponent(appScope)}` : ''}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_BASE_URL}/platform/catalog`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                // Same legacy chit collectors as manager/employees — also on /platform/employees.
                (appScope === 'CHIT_FUND' || !appScope)
                    ? fetch(`${API_BASE_URL}/employee/all`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    : Promise.resolve(null),
            ]);
            let employeeList = [];
            let catalogList = [];
            let legacyList = [];
            if (employeeResult.status === 'fulfilled') {
                try {
                    employeeList = await readOptionalPlatformList(employeeResult.value, ['employees', 'items']);
                } catch (employeeError) {
                    if (!managerMode) throw employeeError;
                }
            } else if (!managerMode) {
                throw employeeResult.reason;
            }
            if (catalogResult.status === 'fulfilled') {
                try {
                    catalogList = await readOptionalPlatformList(catalogResult.value, ['apps', 'catalog']);
                } catch (catalogError) {
                    catalogList = [];
                }
            }
            if (legacyResult.status === 'fulfilled' && legacyResult.value) {
                try {
                    legacyList = normalizeLegacyChitEmployees(
                        await readOptionalPlatformList(legacyResult.value, ['employees', 'items'])
                    );
                } catch (legacyError) {
                    legacyList = [];
                }
            }
            const platformUserIds = new Set(
                employeeList.map((employee) => String(
                    employee.employeeUserId || employee.employee_user_id || employee.user?.id
                ))
            );
            const mergedEmployees = [
                ...employeeList,
                ...legacyList.filter((employee) => !platformUserIds.has(String(employee.employeeUserId))),
            ].sort((left, right) => String(
                left.user?.name || left.name || ''
            ).localeCompare(String(right.user?.name || right.name || '')));
            setEmployees(mergedEmployees);
            const availableCatalog = mergeCatalogWithFallback(catalogList);
            setCatalog(appScope
                ? availableCatalog.filter((app) => getAppCode(app) === appScope)
                : availableCatalog
            );
        } catch (loadError) {
            setCatalog(appScope
                ? FALLBACK_APP_CATALOG.filter((app) => getAppCode(app) === appScope)
                : FALLBACK_APP_CATALOG
            );
            setEmployees([]);
            setError(managerMode ? '' : 'Unable to load employees right now. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [ownerMembershipId, canManageEmployees, token, appScope]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openCreate = () => {
        if (!canAddEmployee) {
            setError(managerMode
                ? 'Add Collector or Add Accountant permission is required to create employees.'
                : 'You do not have permission to add employees.');
            return;
        }
        setEditingEmployee(null);
        setProfile(emptyProfile);
        setEditorStep(1);
        setEditorError('');
        setError('');
        // Manager flow is always scoped to the current app.
        const initialApps = appScope ? [appScope] : (managerMode ? ['CHIT_FUND'] : []);
        setSelectedAppCodes(initialApps);
        setEnrollments([]);
        setExpandedEditorApps(
            Object.fromEntries(initialApps.map((code) => [code, true]))
        );
        setIsEditorOpen(true);
    };

    const openEdit = (employee) => {
        if (managerMode && employeeHasRole(employee, 'MANAGER') && !canMutateManagers) {
            setError('Managers can view other Managers but cannot edit them.');
            return;
        }
        if (managerMode && employeeHasRole(employee, 'COLLECTOR') && !canEditCollector) {
            setError('Edit Collector permission is required.');
            return;
        }
        if (managerMode && employeeHasRole(employee, 'ACCOUNTANT') && !canEditAccountant) {
            setError('Edit Accountant permission is required.');
            return;
        }
        const sourceProfile = employee.profile || employee;
        const sourceUser = sourceProfile.user || employee.user || sourceProfile;
        setEditingEmployee(employee);
        setProfile({
            name: sourceUser.name || sourceProfile.employee_name || '',
            phone: sourceUser.phone || '',
            email: sourceUser.email || '',
            employeeCode: sourceProfile.employeeCode || sourceProfile.employee_code || '',
            dateOfJoining: formatDateInput(sourceProfile.dateOfJoining || sourceProfile.date_of_joining),
            salary: sourceProfile.salary ?? '',
            loginPassword: '',
        });
        const existingEnrollments = (employee.enrollments || employee.roles || [])
                .filter((enrollment) => enrollment.isActive !== false && enrollment.is_active !== false)
                .filter((enrollment) => EMPLOYEE_ROLES.includes(getRoleCode(enrollment)))
                .map(normalizeEnrollment);
        setEditorStep(1);
        setEditorError('');
        const appCodes = [...new Set(existingEnrollments.map((item) => item.appCode).filter(Boolean))];
        setSelectedAppCodes(appCodes);
        setEnrollments(existingEnrollments);
        setExpandedEditorApps(
            Object.fromEntries(appCodes.map((code) => [code, true]))
        );
        setIsEditorOpen(true);
    };

    const toggleApp = (appCode) => {
        if (appScope) return;
        const isSelected = selectedAppCodes.includes(appCode);
        setSelectedAppCodes((current) => isSelected
            ? current.filter((code) => code !== appCode)
            : [...current, appCode]
        );
        if (!isSelected) {
            setExpandedEditorApps((current) => ({ ...current, [appCode]: true }));
        }
        if (isSelected) {
            setEnrollments((current) => current.filter((item) => item.appCode !== appCode));
        }
        setEditorError('');
    };

    const toggleRole = (app, role) => {
        const appCode = getAppCode(app);
        const roleCode = getRoleCode(role);
        if (!EMPLOYEE_ROLES.includes(roleCode)) return;
        if (!canAssignRole(roleCode)) {
            setEditorError(`You do not have permission to assign the ${roleCode} role.`);
            return;
        }
        const exists = enrollments.some(
            (item) => item.appCode === appCode && item.roleCode === roleCode
        );
        setEnrollments((current) => exists
            ? current.filter((item) => !(item.appCode === appCode && item.roleCode === roleCode))
            : [...current, {
                appCode,
                roleCode,
                permissions: usesCollectorAccountantPackage(roleCode, appCode)
                    ? getFeaturesForRoleAssignment(getStep3Features(app), roleCode, appCode).map(getFeatureKey).filter(Boolean)
                    : getDefaultPermissions(role, app),
            }]
        );
    };

    const togglePermission = (appCode, roleCode, featureKey) => {
        setEnrollments((current) => current.map((item) => {
            if (item.appCode !== appCode || item.roleCode !== roleCode) return item;
            const selected = item.permissions.includes(featureKey);
            return {
                ...item,
                permissions: selected
                    ? item.permissions.filter((key) => key !== featureKey)
                    : [...item.permissions, featureKey],
            };
        }));
    };

    const setAllPermissions = (appCode, roleCode, featureKeys, isSelected) => {
        setEnrollments((current) => current.map((item) => (
            item.appCode === appCode && item.roleCode === roleCode
                ? { ...item, permissions: isSelected ? featureKeys : [] }
                : item
        )));
    };

    const setCategoryPermissions = (appCode, roleCode, categoryFeatureKeys, isSelected) => {
        const categoryKeys = new Set(categoryFeatureKeys.filter(Boolean));
        setEnrollments((current) => current.map((item) => {
            if (item.appCode !== appCode || item.roleCode !== roleCode) return item;
            const kept = item.permissions.filter((key) => !categoryKeys.has(key));
            return {
                ...item,
                permissions: isSelected
                    ? [...new Set([...kept, ...categoryKeys])]
                    : kept,
            };
        }));
    };

    const ensureDefaultEnrollmentsForSelectedApps = (appCodesOverride) => {
        const appCodes = managerMode
            ? [appScope || selectedAppCodes[0] || 'CHIT_FUND']
            : (appCodesOverride || selectedAppCodes);
        setEnrollments((current) => {
            let next = [...current];
            appCodes.forEach((appCode) => {
                if (next.some((item) => item.appCode === appCode)) return;
                const app = catalog.find((item) => getAppCode(item) === appCode);
                if (!app) return;
                // Manager: auto-pick only when exactly one create role is allowed.
                // Never prefer Collector when Accountant is also allowed.
                let defaultRoleCode = 'MANAGER';
                if (managerMode) {
                    if (canCreateCollector && !canCreateAccountant) defaultRoleCode = 'COLLECTOR';
                    else if (!canCreateCollector && canCreateAccountant) defaultRoleCode = 'ACCOUNTANT';
                    else defaultRoleCode = null;
                }
                if (!defaultRoleCode) return;
                const roleFeatures = getFeaturesForRoleAssignment(
                    getStep3Features(app),
                    defaultRoleCode,
                    appCode
                );
                const defaultPermissions = usesCollectorAccountantPackage(defaultRoleCode, appCode)
                    ? roleFeatures.map(getFeatureKey).filter(Boolean)
                    : getDefaultPermissions({ roleCode: defaultRoleCode }, app);
                next.push({
                    appCode,
                    roleCode: defaultRoleCode,
                    permissions: defaultPermissions,
                });
            });
            return next;
        });
    };

    const goToStep = (targetStep) => {
        const step = Number(targetStep);
        if (![1, 2, 3].includes(step) || step === editorStep) return;
        setEditorError('');

        // Always allow moving backward.
        if (step < editorStep) {
            setEditorStep(step);
            return;
        }

        const ensureScopedAppSelected = () => {
            if (!appScope) return;
            if (!selectedAppCodes.includes(appScope)) {
                setSelectedAppCodes([appScope]);
            }
        };

        const prepareStepThree = () => {
            ensureScopedAppSelected();
            if (!(appScope || selectedAppCodes.length)) {
                setEditorError('Select at least one application.');
                return false;
            }
            if (managerMode && !canAddEmployee) {
                setEditorError('Add Collector or Add Accountant permission is required.');
                return false;
            }
            ensureDefaultEnrollmentsForSelectedApps();
            // Auto-select the only allowed role for managers (e.g. Accountant-only).
            if (managerMode) {
                const scopedAppCode = appScope || 'CHIT_FUND';
                const app = catalog.find((item) => getAppCode(item) === scopedAppCode);
                const allowedRoleCodes = ['COLLECTOR', 'ACCOUNTANT'].filter((roleCode) => canAssignRole(roleCode));
                if (app && allowedRoleCodes.length === 1) {
                    const onlyRole = allowedRoleCodes[0];
                    setEnrollments((current) => {
                        const hasRole = current.some(
                            (item) => item.appCode === scopedAppCode && item.roleCode === onlyRole
                        );
                        if (hasRole) return current;
                        const roleFeatures = getFeaturesForRoleAssignment(
                            getStep3Features(app),
                            onlyRole,
                            scopedAppCode
                        );
                        return [{
                            appCode: scopedAppCode,
                            roleCode: onlyRole,
                            permissions: roleFeatures.map(getFeatureKey).filter(Boolean),
                        }];
                    });
                }
            }
            stepThreeEnteredAtRef.current = Date.now();
            return true;
        };

        // Edit mode: jump freely (profile/apps/roles already loaded).
        if (editingEmployee) {
            if (step === 3 && !prepareStepThree()) return;
            setEditorStep(step);
            return;
        }

        // Create mode: validate required earlier steps before jumping ahead.
        if (!profile.name.trim() || !profile.phone.trim() || !profile.dateOfJoining) {
            setEditorError('Enter the employee name, phone number, and date of joining.');
            return;
        }
        if (step >= 2 && appScope) {
            ensureScopedAppSelected();
        }
        if (step >= 3 && !prepareStepThree()) return;
        setEditorStep(step);
    };

    const goToNextStep = () => {
        if (editorStep === 1) goToStep(2);
        else if (editorStep === 2) goToStep(3);
    };

    const goToPreviousStep = () => {
        goToStep(Math.max(1, editorStep - 1));
    };

    const handleSave = async (event) => {
        event?.preventDefault();
        if (editorStep < 3) {
            goToNextStep();
            return;
        }
        if (Date.now() - stepThreeEnteredAtRef.current < 500) return;
        const assignableEnrollments = enrollments.filter((item) => EMPLOYEE_ROLES.includes(item.roleCode));
        if (managerMode && assignableEnrollments.some((item) => item.roleCode === 'MANAGER')) {
            setEditorError('Managers cannot create another Manager. Assign Collector or Accountant only.');
            return;
        }
        if (managerMode && assignableEnrollments.some((item) => !canAssignRole(item.roleCode))) {
            setEditorError('You can only create Collector or Accountant roles.');
            return;
        }
        const appsWithoutRoles = selectedAppCodes.filter(
            (appCode) => !assignableEnrollments.some((item) => item.appCode === appCode)
        );
        if (appsWithoutRoles.length) {
            setEditorError('Assign at least one role for every selected application.');
            return;
        }
        setIsSaving(true);
        setEditorError('');
        setError('');
        try {
            const employeeId = editingEmployee?.id || editingEmployee?.employeeId || editingEmployee?.employee_id;
            const payloadProfile = { ...profile };
            if (!payloadProfile.loginPassword) delete payloadProfile.loginPassword;
            const response = await fetch(
                employeeId
                    ? `${API_BASE_URL}/platform/employees/${employeeId}`
                    : `${API_BASE_URL}/platform/employees`,
                {
                    method: employeeId ? 'PUT' : 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({
                        parentMembershipId: ownerMembershipId,
                        profile: payloadProfile,
                        enrollments: assignableEnrollments.map((item) => {
                            let permissions = expandGrantedPermissions(
                                item.appCode,
                                item.permissions || []
                            );
                            // VF Collector/Accountant: keep only the role package (same as manager/employees).
                            if (usesCollectorAccountantPackage(item.roleCode, item.appCode)) {
                                const app = catalog.find((entry) => getAppCode(entry) === item.appCode);
                                if (app) {
                                    const allowed = new Set(
                                        getFeaturesForRoleAssignment(
                                            getStep3Features(app),
                                            item.roleCode,
                                            item.appCode
                                        ).map(getFeatureKey).filter(Boolean)
                                    );
                                    permissions = permissions.filter((key) => allowed.has(key));
                                }
                            }
                            return { ...item, permissions };
                        }),
                    }),
                }
            );
            if (response.status === 404) {
                throw new Error('Employee service is not available on the connected backend yet.');
            }
            await readApiResponse(response);
            setIsEditorOpen(false);
            await loadData();
        } catch (saveError) {
            setEditorError(saveError.message);
        } finally {
            setIsSaving(false);
        }
    };

    const deactivateEmployee = async (employee) => {
        if (managerMode && employeeHasRole(employee, 'MANAGER') && !canMutateManagers) {
            setError('Managers can view other Managers but cannot delete them.');
            return;
        }
        if (managerMode && employeeHasRole(employee, 'COLLECTOR') && !canDeleteCollector) {
            setError('Delete Collector permission is required.');
            return;
        }
        if (managerMode && employeeHasRole(employee, 'ACCOUNTANT') && !canDeleteAccountant) {
            setError('Delete Accountant permission is required.');
            return;
        }
        const employeeId = employee.id || employee.employeeId || employee.employee_id;
        const name = employee.profile?.name || employee.user?.name || employee.name || 'this employee';
        if (!employeeId || !window.confirm(`Delete/deactivate ${name}? They will lose platform access.`)) return;
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/platform/employees/${employeeId}/deactivate`, {
                method: 'POST',
                headers: authHeaders,
            });
            await readApiResponse(response);
            await loadData();
        } catch (deactivateError) {
            setError(deactivateError.message);
        }
    };

    const canGenerateOfferLetterFor = (employee) => {
        if (employeeHasRole(employee, 'COLLECTOR')) return canOfferLetterCollector;
        if (employeeHasRole(employee, 'ACCOUNTANT')) return canOfferLetterAccountant;
        // Owner may also generate for Managers from People & Access.
        if (isOwner && employeeHasRole(employee, 'MANAGER')) return true;
        return false;
    };

    const formatJoinDateDisplay = (value) => {
        const raw = formatDateInput(value);
        if (!raw) return '—';
        const parsed = new Date(`${raw}T00:00:00`);
        if (Number.isNaN(parsed.getTime())) return raw;
        return parsed.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const openOfferLetter = async (employee) => {
        if (!canGenerateOfferLetterFor(employee)) {
            setError('Generate Offer Letter permission is required.');
            return;
        }
        const employeeId = employee.id || employee.employeeId || employee.employee_id;
        if (!employeeId) return;
        setOfferLetterLoading(true);
        setOfferLetterData(null);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/platform/employees/${employeeId}/offer-letter`, {
                headers: authHeaders,
            });
            const data = await readApiResponse(response);
            setOfferLetterData(data?.results || data);
        } catch (offerError) {
            setError(offerError.message);
        } finally {
            setOfferLetterLoading(false);
        }
    };

    if (!platform?.hasLoaded) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600">Loading access…</div>;
    }

    if (!platform?.isLoading && !canManageEmployees) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
                    <h1 className="text-xl font-bold text-gray-900">Employee management access required</h1>
                    <p className="text-gray-600 mt-2">You do not have permission to manage employees.</p>
                    <button onClick={() => history.replace(backPath)} className="mt-6 px-5 py-2.5 bg-red-600 text-white rounded-lg">
                        Back to Finance Hub
                    </button>
                </div>
            </div>
        );
    }

    // Match Chit Fund user home card typography (Card.js): #333 / #444 / #888, red #d62828
    const textTitle = 'text-[#333] font-semibold';
    const textBody = 'text-[#444] font-medium';
    const textMuted = 'text-[#888]';
    const brandRed = 'text-[#d62828]';
    const btnPrimary = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#d62828] hover:bg-[#b81f1f] text-white text-sm font-semibold shadow-sm';
    const btnSecondary = 'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#d62828] bg-white text-[#d62828] text-sm font-medium hover:bg-[#d62828] hover:text-white';
    const btnAccent = 'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-[#d62828] text-sm font-medium hover:bg-red-100';

    return (
        <div className={`min-h-screen bg-[#f8f9fa] antialiased ${textBody}`}>
            {!embedded && <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 min-h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                        <MyTreasureBrand to={backPath} subtitle={pageTitle} />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right px-1 sm:px-2 min-w-0">
                            <p className={`text-sm ${textTitle} truncate max-w-[7rem] sm:max-w-none`}>Hi {userName}</p>
                            {accountLabel ? (
                                <p className={`hidden sm:block text-xs ${textMuted}`}>Logged in as {accountLabel}</p>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={handleLogout}
                            aria-label="Logout"
                            title="Logout"
                            className="p-2.5 rounded-lg text-[#444] hover:text-[#d62828] hover:bg-red-50"
                        >
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>}

            <div className={`${embedded ? 'w-full max-w-screen-2xl mx-auto px-3 sm:px-5 pt-0 pb-2' : 'max-w-7xl mx-auto px-4 sm:px-6 py-4'}`}>
                {!embedded && (
                    <div className="flex justify-center items-center gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => history.push(backPath)}
                            aria-label="Back to Hub"
                            title="Back to Hub"
                            className={btnPrimary}
                        >
                            <FiArrowLeft className="w-5 h-5" />
                            Back to Hub
                        </button>
                        {canAddEmployee && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className={btnPrimary}
                            >
                                <FiPlus className="w-5 h-5" />
                                Add Employee
                            </button>
                        )}
                    </div>
                )}
                {embedded && (
                    <div className="mb-3 py-2 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className={`text-lg ${textTitle}`}>{pageTitle}</h1>
                            <p className={`text-sm ${textMuted}`}>
                                {canAddEmployee
                                    ? `You can add ${[
                                        canCreateCollector ? 'Collector' : null,
                                        canCreateAccountant ? 'Accountant' : null,
                                    ].filter(Boolean).join(' or ')}.`
                                    : 'View team members. Add permission is not assigned.'}
                            </p>
                        </div>
                        {canAddEmployee && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className={btnPrimary}
                            >
                                <FiPlus className="w-5 h-5" />
                                Add Employee
                            </button>
                        )}
                    </div>
                )}
                {error && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
                {isLoading ? (
                    <div className="py-20" aria-busy="true" aria-label="Loading">
                        <div className="fixed top-0 left-0 right-0 z-[200] h-1 bg-red-100 overflow-hidden">
                            <div className="h-full w-1/3 bg-red-600 animate-[platformLoadBar_1.1s_ease-in-out_infinite]" />
                        </div>
                        <style>{`
                            @keyframes platformLoadBar {
                                0% { transform: translateX(-120%); }
                                100% { transform: translateX(320%); }
                            }
                        `}</style>
                    </div>
                ) : visibleEmployees.length === 0 ? (
                    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <div className="relative px-6 py-12 sm:px-12 sm:py-16 text-center">
                            <div className="w-16 h-16 mx-auto rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                                <FiUsers className="w-8 h-8 text-red-700" />
                            </div>
                            <h2 className={`text-2xl ${textTitle} mt-5`}>No employees added yet</h2>
                            <p className={`max-w-xl mx-auto text-sm ${textMuted} mt-2`}>
                                Add your first employee and control their role, feature access, and assigned areas.
                            </p>

                            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 text-left">
                                {[
                                    ['1', 'Employee details', 'Add profile and login information'],
                                    ['2', 'App details', (managerMode || isVfScoped || isChitScoped) ? `${scopedAppLabel} (current app)` : 'Confirm application access'],
                                    ['3', 'Roles & features', managerMode
                                        ? 'Collector or Accountant (by your permissions)'
                                        : ((isVfScoped || isChitScoped) ? 'Manager and Collector / Accountant' : 'Choose duties and permissions')],
                                ].map(([number, title, description]) => (
                                    <div key={number} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <div className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-semibold flex items-center justify-center">{number}</div>
                                        <h3 className={`${textTitle} mt-3`}>{title}</h3>
                                        <p className={`text-sm ${textMuted} mt-1`}>{description}</p>
                                    </div>
                                ))}
                            </div>

                            {canAddEmployee ? (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className={`mt-8 ${btnPrimary}`}
                                >
                                    <FiPlus className="w-5 h-5" />
                                    Add your first employee
                                </button>
                            ) : (
                                <p className={`mt-8 text-sm ${textMuted} bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 inline-block`}>
                                    You can view this page, but Add Collector / Add Accountant permission is required to create employees.
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="mb-3 py-2 border-b border-gray-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                                    <FiUsers className={`w-4 h-4 ${brandRed}`} />
                                </div>
                                <div>
                                    <p className={`text-sm ${textTitle}`}>Team members</p>
                                    <p className={`text-sm ${textMuted}`}>{visibleEmployees.length} employee{visibleEmployees.length === 1 ? '' : 's'}</p>
                                </div>
                            </div>
                            <div className="inline-flex bg-gray-100 rounded-lg p-1" role="group" aria-label="Change employee view">
                                <button
                                    type="button"
                                    onClick={() => changeViewMode('grid')}
                                    aria-pressed={viewMode === 'grid'}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'grid'
                                            ? 'bg-white text-[#d62828] shadow-sm'
                                            : `${textMuted} hover:text-[#333]`
                                    }`}
                                >
                                    <FiGrid /> Grid
                                </button>
                                <button
                                    type="button"
                                    onClick={() => changeViewMode('list')}
                                    aria-pressed={viewMode === 'list'}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'list'
                                            ? 'bg-white text-[#d62828] shadow-sm'
                                            : `${textMuted} hover:text-[#333]`
                                    }`}
                                >
                                    <FiList /> List
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {employeesByApp.map(({ appCode, label, employees: appEmployees }) => {
                                const expanded = isListAppExpanded(appCode);
                                return (
                                    <section
                                        key={appCode}
                                        className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                                    >
                                        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                                            <div className="min-w-0">
                                                <h3 className={`text-sm ${textTitle} truncate`}>{label}</h3>
                                                <p className={`text-sm ${textMuted}`}>
                                                    {appEmployees.length} employee{appEmployees.length === 1 ? '' : 's'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => toggleListApp(appCode)}
                                                aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
                                                aria-expanded={expanded}
                                                title={expanded ? 'Collapse' : 'Expand'}
                                                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-red-700 hover:bg-red-50"
                                            >
                                                {expanded ? <FiMinus className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {expanded && (
                                            <div className={`p-3 ${viewMode === 'grid'
                                                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3'
                                                : 'space-y-2.5'
                                            }`}>
                                                {appEmployees.map((employee, index) => {
                                                    const employeeProfile = employee.profile || employee;
                                                    const employeeUser = employeeProfile.user || employee.user || employeeProfile;
                                                    const employeeEnrollments = (employee.enrollments || employee.roles || []).filter(
                                                        (enrollment) => enrollment.isActive !== false && enrollment.is_active !== false
                                                    );
                                                    const isCollectorEmployee = employeeHasRole(employee, 'COLLECTOR');
                                                    const isManagerEmployee = employeeHasRole(employee, 'MANAGER');
                                                    const isAccountantEmployee = employeeHasRole(employee, 'ACCOUNTANT');
                                                    const canEditThis = isOwner
                                                        || (isCollectorEmployee && canEditCollector)
                                                        || (isAccountantEmployee && canEditAccountant)
                                                        || (isManagerEmployee && canMutateManagers);
                                                    const canDeleteThis = isOwner
                                                        || (isCollectorEmployee && canDeleteCollector)
                                                        || (isAccountantEmployee && canDeleteAccountant)
                                                        || (isManagerEmployee && canMutateManagers);
                                                    const isActive =
                                                        (employeeProfile.employmentStatus || employeeProfile.employment_status) === 'ACTIVE'
                                                        || (
                                                            employeeProfile.employmentStatus == null
                                                            && employeeProfile.employment_status == null
                                                            && (employee.isActive ?? employee.is_active ?? employee.status !== 'INACTIVE')
                                                        );
                                                    return (
                                                        <article
                                                            key={`${appCode}-${employee.id || employee.employeeId || index}`}
                                                            className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md hover:border-red-100 transition-all ${
                                                                viewMode === 'list' ? 'sm:flex sm:items-stretch' : ''
                                                            }`}
                                                        >
                                                            <div className={viewMode === 'list' ? 'h-1.5 sm:h-auto sm:w-1.5 bg-[#d62828]' : 'h-1.5 bg-[#d62828]'} />
                                                            <div className={`${viewMode === 'list' ? 'p-4 sm:flex sm:items-center sm:gap-5 sm:flex-1' : 'p-5'}`}>
                                                                <div className={`flex items-start justify-between gap-3 ${viewMode === 'list' ? 'sm:w-1/4' : ''}`}>
                                                                    <div>
                                                                        <h2 className={`text-[1.2rem] leading-tight ${textTitle}`}>
                                                                            {employeeUser.name || employeeProfile.employee_name || 'Unnamed employee'}
                                                                        </h2>
                                                                        <p className={`text-[0.9rem] ${textMuted}`}>
                                                                            {employeeProfile.employeeCode || employeeProfile.employee_code || 'No employee code'}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-[#444]'}`}>
                                                                        {isActive ? 'Active' : 'Inactive'}
                                                                    </span>
                                                                </div>
                                                                <div className={`mt-4 text-[0.9rem] space-y-1.5 ${viewMode === 'list' ? 'sm:mt-0 sm:w-1/4' : ''}`}>
                                                                    <p className={textBody}>
                                                                        <span className={textTitle}>Phone number: </span>
                                                                        {employeeUser.phone || '—'}
                                                                    </p>
                                                                    <p className={`truncate ${textBody}`}>
                                                                        <span className={textTitle}>Email: </span>
                                                                        {employeeUser.email || '—'}
                                                                    </p>
                                                                    <p className={textBody}>
                                                                        <span className={textTitle}>Date of joining: </span>
                                                                        {formatJoinDateDisplay(employeeProfile.dateOfJoining || employeeProfile.date_of_joining)}
                                                                    </p>
                                                                    {isCollectorEmployee && appCode === 'VEHICLE_FINANCE' && (() => {
                                                                        const regions = [...new Set(
                                                                            (employee.catchmentAreas || employee.areas || [])
                                                                                .map((area) => (typeof area === 'string' ? area : area?.region))
                                                                                .map((value) => String(value || '').trim())
                                                                                .filter(Boolean)
                                                                        )];
                                                                        return (
                                                                            <p className={textBody}>
                                                                                <span className={textTitle}>Areas: </span>
                                                                                {regions.length ? regions.join(', ') : '—'}
                                                                            </p>
                                                                        );
                                                                    })()}
                                                                </div>
                                                                <div className={`mt-4 flex flex-wrap gap-2 min-w-0 ${viewMode === 'list' ? 'sm:mt-0 sm:flex-1' : ''}`}>
                                                                    {employeeEnrollments.map((enrollment, enrollmentIndex) => (
                                                                        <span key={`${getAppCode(enrollment)}-${getRoleCode(enrollment)}-${enrollmentIndex}`} className={`text-xs font-medium bg-red-50 ${brandRed} border border-red-100 rounded-full px-2.5 py-1`}>
                                                                            {getAppLabel(getAppCode(enrollment))} · {getRoleCode(enrollment)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <div className={`mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2 ${viewMode === 'list' ? 'sm:mt-0 sm:pt-0 sm:border-t-0 sm:border-l sm:pl-5' : ''}`}>
                                                                    {(isOwner || canViewCollectors || canViewManagers) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setViewEmployee(employee)}
                                                                            className={btnSecondary}
                                                                        >
                                                                            <FiEye /> View
                                                                        </button>
                                                                    )}
                                                                    {isCollectorEmployee && appCode === 'VEHICLE_FINANCE' && canAssignCollectorArea && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setVfAreaEmployee({
                                                                                id: employeeProfile.id || employee.id,
                                                                                parent_membership_id:
                                                                                    employeeProfile.parentMembershipId
                                                                                    || employeeProfile.parent_membership_id
                                                                                    || ownerMembershipId,
                                                                                employee_user_id:
                                                                                    employeeProfile.employeeUserId
                                                                                    || employeeProfile.employee_user_id
                                                                                    || employeeUser.id,
                                                                                name: employeeUser.name || employeeProfile.employee_name || 'Collector',
                                                                                role: 'COLLECTOR',
                                                                                areas: employee.areas || [],
                                                                                catchmentAreas: employee.catchmentAreas || employee.areas || [],
                                                                            })}
                                                                            className={btnAccent}
                                                                            title="Add Area permission required"
                                                                        >
                                                                            <FiMapPin /> Add Area
                                                                        </button>
                                                                    )}
                                                                    {isCollectorEmployee && appCode === 'CHIT_FUND' && (
                                                                        <>
                                                                            {(isOwner || canViewCollectors) && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => openCollectorPanel(employeeProfile, employeeUser, 'dashboard')}
                                                                                    className={btnPrimary.replace('px-4 py-2.5', 'px-3 py-2')}
                                                                                >
                                                                                    <FiBarChart2 /> Dashboard
                                                                                </button>
                                                                            )}
                                                                            {(isOwner || canEditCollector) && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => openCollectorPanel(employeeProfile, employeeUser, 'assign')}
                                                                                    className={btnAccent}
                                                                                >
                                                                                    <FiMapPin /> Areas
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                    {canGenerateOfferLetterFor(employee) && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openOfferLetter(employee)}
                                                                            className={btnAccent}
                                                                        >
                                                                            <FiFileText /> Offer Letter
                                                                        </button>
                                                                    )}
                                                                    {canEditThis && (
                                                                        <button type="button" onClick={() => openEdit(employee)} className={btnSecondary}>
                                                                            <FiEdit2 /> Edit
                                                                        </button>
                                                                    )}
                                                                    {canDeleteThis && isActive && (
                                                                        <button type="button" onClick={() => deactivateEmployee(employee)} className={btnAccent}>
                                                                            <FiTrash2 /> Delete
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {embedded && canAddEmployee && (
                <button
                    type="button"
                    onClick={openCreate}
                    aria-label="Add employee"
                    title="Add employee"
                    className="fixed right-6 bottom-6 z-[60] w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center justify-center"
                >
                    <FiPlus className="w-6 h-6" />
                </button>
            )}

            {isEditorOpen && (
                <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-3 sm:p-6">
                    <form onSubmit={(event) => event.preventDefault()} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] overflow-hidden flex flex-col">
                        <div className="px-5 sm:px-7 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className={`text-xl ${textTitle}`}>{editingEmployee ? 'Edit employee access' : 'Add employee'}</h2>
                                <p className={`text-sm ${textMuted}`}>
                                    {managerMode
                                        ? `Step 1 profile → Step 2 ${scopedAppLabel} (locked) → Step 3 Collector/Accountant by your permissions.`
                                        : (isVfScoped || isChitScoped)
                                            ? `Step 1 profile → Step 2 ${scopedAppLabel} (locked) → Step 3 Manager and Collector/Accountant.`
                                            : 'Complete the employee, application, and role details.'}
                                </p>
                            </div>
                            <button type="button" onClick={() => setIsEditorOpen(false)} className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"><FiX /></button>
                        </div>

                        <div className="px-5 sm:px-7 py-4 border-b border-gray-100">
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    [1, 'Employee details'],
                                    [2, (managerMode || isVfScoped || isChitScoped) ? `App (${scopedAppLabel})` : 'App details'],
                                    [3, managerMode
                                        ? 'Collector / Accountant'
                                        : ((isVfScoped || isChitScoped) ? 'Manager · Collector / Accountant' : 'Roles assign')],
                                ].map(([step, label]) => (
                                    <button
                                        key={step}
                                        type="button"
                                        onClick={() => goToStep(step)}
                                        className={`min-w-0 text-left rounded-lg px-1 py-1 transition-colors ${
                                            editorStep === step
                                                ? 'bg-red-50'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`h-1.5 rounded-full ${editorStep >= step ? 'bg-red-600' : 'bg-gray-200'}`} />
                                        <p className={`mt-2 text-xs sm:text-sm font-semibold truncate ${editorStep === step ? 'text-red-700' : 'text-gray-500'}`}>
                                            Step {step}: {label}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-y-auto px-5 sm:px-7 py-6">
                            {editorError && (
                                <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3">
                                    {editorError}
                                </div>
                            )}

                            {editorStep === 1 && (
                                <section>
                                    <h3 className="font-semibold text-gray-900 mb-1">Employee details</h3>
                                    <p className="text-sm text-gray-500 mb-4">Enter the common profile and login details.</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            ['name', 'Name', 'text', true],
                                            ['phone', 'Phone', 'tel', true],
                                            ['email', 'Email', 'email', false],
                                            ['employeeCode', 'Employee code (optional)', 'text', false],
                                            ['dateOfJoining', 'Date of joining', 'date', true],
                                            ['salary', 'Salary', 'number', false],
                                            ['loginPassword', editingEmployee ? 'New login password (optional)' : 'Login password (optional)', 'password', false],
                                        ].map(([name, label, type, required]) => (
                                            <label key={name} className={name === 'loginPassword' ? 'sm:col-span-2' : ''}>
                                                <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>
                                                <input
                                                    name={name}
                                                    type={type}
                                                    required={required}
                                                    value={profile[name]}
                                                    onChange={(event) => {
                                                        setProfile((current) => ({ ...current, [name]: event.target.value }));
                                                        setEditorError('');
                                                    }}
                                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                                />
                                                {name === 'employeeCode' && (
                                                    <span className="block mt-1 text-xs text-gray-500">
                                                        Optional internal reference for HR, payroll, or an existing employee register. It is not used for login.
                                                    </span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {editorStep === 2 && (
                                <section>
                                    <h3 className="font-semibold text-gray-900">App details</h3>
                                    <p className="text-sm text-gray-500 mt-1 mb-4">
                                        {(managerMode || isVfScoped || isChitScoped)
                                            ? `Application is fixed to the app you are working in (${scopedAppLabel}).`
                                            : 'Choose which applications this employee can access.'}
                                    </p>
                                    {catalog.length === 0 ? (
                                        <div className="border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                                            No applications are available yet.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {catalog.map((app) => {
                                                const appCode = getAppCode(app);
                                                const isSelected = selectedAppCodes.includes(appCode);
                                                const lockedToScope = Boolean(appScope);
                                                return (
                                                    <label
                                                        key={appCode}
                                                        className={`rounded-xl border p-4 transition-colors ${
                                                            isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200'
                                                        } ${lockedToScope ? 'cursor-default' : 'cursor-pointer hover:border-red-200'}`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                disabled={lockedToScope}
                                                                onChange={() => toggleApp(appCode)}
                                                                className="mt-1 text-red-600 focus:ring-red-500 rounded"
                                                            />
                                                            <span>
                                                                <span className="block font-semibold text-gray-900">{app.displayName || app.display_name || appCode}</span>
                                                                <span className="block mt-1 text-xs text-gray-500">
                                                                    {lockedToScope
                                                                        ? `Locked to ${scopedAppLabel}.`
                                                                        : (app.description || 'Assign access to this application.')}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>
                            )}

                            {editorStep === 3 && (
                                <section>
                                    <h3 className="font-semibold text-gray-900">
                                        {managerMode
                                            ? 'Collector / Accountant'
                                            : ((isVfScoped || isChitScoped) ? 'Manager · Collector / Accountant' : 'Roles assign')}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1 mb-4">
                                        {managerMode
                                            ? 'Choose Collector and/or Accountant. A role is enabled only if you have its Add permission (from People & Access).'
                                            : (isVfScoped || isChitScoped || selectedAppCodes.includes('CHIT_FUND') || selectedAppCodes.includes('VEHICLE_FINANCE'))
                                                ? 'Assign Manager (duties & Administration), and/or Collector / Accountant with the same feature packages as on the Manager employees page.'
                                                : 'Manager is pre-selected with all features enabled. Uncheck only what you want to remove.'}
                                    </p>
                                    {managerMode && (
                                        <div className="mb-4 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 space-y-1">
                                            <p>
                                                Collector Add:{' '}
                                                <span className={canCreateCollector ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                                                    {canCreateCollector ? 'Yes' : 'No'}
                                                </span>
                                                {' · '}
                                                Accountant Add:{' '}
                                                <span className={canCreateAccountant ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold'}>
                                                    {canCreateAccountant ? 'Yes' : 'No'}
                                                </span>
                                            </p>
                                            {!canCreateAccountant && (
                                                <p className="text-amber-700">
                                                    Accountant is disabled because this Manager login does not have <code>{scopeConfig.accountantAdd}</code>.
                                                    In People & Access, enable Add Accountant for this Manager, save, then Manager must log out and log in again.
                                                </p>
                                            )}
                                            {!canCreateCollector && (
                                                <p className="text-amber-700">
                                                    Collector is disabled because this Manager login does not have <code>{scopeConfig.collectorAdd}</code>.
                                                    In People & Access, enable Add Collector for this Manager, save, then Manager must log out and log in again.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    {showCollectorAccountantPackageHint && (
                                        <div className="mb-4 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 space-y-1">
                                            <p>
                                                <span className="font-semibold text-gray-800">{packageHintAppLabel} → Collector / Accountant</span>
                                                {' — '}same feature packages as on Manager employees (Dashboard, Areas, collections, etc.).
                                                HR keys (Add Collector, Add Accountant, …) stay on the <span className="font-semibold">Manager</span> role under Administration.
                                            </p>
                                        </div>
                                    )}
                                <div className="space-y-4">
                                    {catalog.filter((app) => selectedAppCodes.includes(getAppCode(app))).map((app) => {
                                        const appCode = getAppCode(app);
                                        const appExpanded = isEditorAppExpanded(appCode);
                                        const appLabel = app.displayName || app.display_name || appCode;
                                        return (
                                            <div key={appCode} className="border border-gray-200 rounded-xl overflow-hidden">
                                                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                                                    <h4 className="font-semibold text-gray-900">{appLabel}</h4>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleEditorApp(appCode)}
                                                        aria-label={appExpanded ? `Collapse ${appLabel}` : `Expand ${appLabel}`}
                                                        aria-expanded={appExpanded}
                                                        title={appExpanded ? 'Collapse' : 'Expand'}
                                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-red-200 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        {appExpanded ? <FiMinus className="w-4 h-4" /> : <FiPlus className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                {appExpanded && (
                                                <div className="p-4 space-y-3">
                                                    {getAssignableRoles(app).map((role) => {
                                                        const roleCode = getRoleCode(role);
                                                        const selectedEnrollment = enrollments.find((item) => item.appCode === appCode && item.roleCode === roleCode);
                                                        const roleAssignable = canAssignRole(roleCode);
                                                        const roleFeatures = getFeaturesForRoleAssignment(
                                                            getStep3Features(app),
                                                            roleCode,
                                                            appCode
                                                        );
                                                        const featureGroups = roleFeatures.reduce((groups, feature) => {
                                                            const category = feature.category || 'General';
                                                            groups[category] = [...(groups[category] || []), feature];
                                                            return groups;
                                                        }, {});
                                                        const orderedFeatureGroups = appCode === 'CHIT_FUND'
                                                            ? sortChitCategories(Object.entries(featureGroups)).map(([category, features]) => [
                                                                category,
                                                                sortChitFeatures(features),
                                                            ])
                                                            : Object.entries(featureGroups);
                                                        return (
                                                            <div key={roleCode} className={`rounded-lg bg-gray-50 border border-gray-100 p-3 ${roleAssignable ? '' : 'opacity-60'}`}>
                                                                <label className="flex items-center gap-2 font-medium text-gray-800">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={Boolean(selectedEnrollment)}
                                                                        disabled={!roleAssignable && !selectedEnrollment}
                                                                        onChange={() => toggleRole(app, role)}
                                                                        className="text-red-600 focus:ring-red-500 rounded"
                                                                    />
                                                                    {role.displayName || role.display_name || roleCode}
                                                                    {!roleAssignable && !selectedEnrollment && (
                                                                        <span className="text-xs font-normal text-gray-500">(no Add permission)</span>
                                                                    )}
                                                                </label>
                                                                {selectedEnrollment && roleFeatures.length > 0 && (
                                                                    <div className="mt-3 pl-6 space-y-3">
                                                                        <label className="flex items-center gap-2 text-sm font-semibold text-red-700">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={roleFeatures.every((feature) =>
                                                                                    selectedEnrollment.permissions.includes(getFeatureKey(feature))
                                                                                )}
                                                                                onChange={(event) => setAllPermissions(
                                                                                    appCode,
                                                                                    roleCode,
                                                                                    roleFeatures.map(getFeatureKey).filter(Boolean),
                                                                                    event.target.checked
                                                                                )}
                                                                                className="text-red-600 focus:ring-red-500 rounded"
                                                                            />
                                                                            Select all permissions
                                                                        </label>
                                                                        <p className="text-xs text-gray-500">
                                                                            Each action is separate. Checking Add does not grant Edit or Delete.
                                                                        </p>
                                                                        {(() => {
                                                                            const renderCategoryBlock = (category, features) => {
                                                                                const categoryKeys = features.map(getFeatureKey).filter(Boolean);
                                                                                const allCategorySelected = categoryKeys.length > 0
                                                                                    && categoryKeys.every((key) => selectedEnrollment.permissions.includes(key));
                                                                                return (
                                                                                    <div key={category}>
                                                                                        <div className="flex items-center justify-between gap-2 mb-2">
                                                                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{category}</p>
                                                                                            <label className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={allCategorySelected}
                                                                                                    onChange={(event) => setCategoryPermissions(
                                                                                                        appCode,
                                                                                                        roleCode,
                                                                                                        categoryKeys,
                                                                                                        event.target.checked
                                                                                                    )}
                                                                                                    className="text-red-600 focus:ring-red-500 rounded"
                                                                                                />
                                                                                                All in {category}
                                                                                            </label>
                                                                                        </div>
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                            {features.map((feature) => {
                                                                                                const featureKey = getFeatureKey(feature);
                                                                                                return (
                                                                                                    <label key={featureKey} className="flex items-start gap-2 text-sm text-gray-600">
                                                                                                        <input
                                                                                                            type="checkbox"
                                                                                                            checked={selectedEnrollment.permissions.includes(featureKey)}
                                                                                                            onChange={() => togglePermission(appCode, roleCode, featureKey)}
                                                                                                            className="mt-0.5 text-red-600 focus:ring-red-500 rounded"
                                                                                                        />
                                                                                                        <span>{getFeatureLabel(feature)}</span>
                                                                                                    </label>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            };

                                                                            // Nest Employee / Collector / Accountant under Administration (Chit + VF).
                                                                            const adminCategories = appCode === 'CHIT_FUND'
                                                                                ? CHIT_ADMINISTRATION_CATEGORIES
                                                                                : (appCode === 'VEHICLE_FINANCE'
                                                                                    ? VF_ADMINISTRATION_CATEGORIES
                                                                                    : null);
                                                                            if (adminCategories) {
                                                                                const adminSet = new Set(adminCategories);
                                                                                const generalGroups = orderedFeatureGroups.filter(([category]) => !adminSet.has(category));
                                                                                // Also fold legacy flat "Administration" category into the nest when present.
                                                                                const legacyAdmin = orderedFeatureGroups.find(([name]) => name === 'Administration');
                                                                                const adminGroups = adminCategories
                                                                                    .map((category) => orderedFeatureGroups.find(([name]) => name === category))
                                                                                    .filter(Boolean);
                                                                                if (legacyAdmin?.[1]?.length) {
                                                                                    // Keep any leftover Administration keys visible under Employee.
                                                                                    const employeeGroup = adminGroups.find(([name]) => name === 'Employee');
                                                                                    if (employeeGroup) {
                                                                                        employeeGroup[1] = [...employeeGroup[1], ...legacyAdmin[1]];
                                                                                    } else {
                                                                                        adminGroups.unshift(['Employee', legacyAdmin[1]]);
                                                                                    }
                                                                                }
                                                                                const adminKeys = adminGroups.flatMap(([, features]) => features.map(getFeatureKey).filter(Boolean));
                                                                                const allAdminSelected = adminKeys.length > 0
                                                                                    && adminKeys.every((key) => selectedEnrollment.permissions.includes(key));
                                                                                return (
                                                                                    <>
                                                                                        {generalGroups.map(([category, features]) => renderCategoryBlock(category, features))}
                                                                                        {adminGroups.length > 0 && (
                                                                                            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
                                                                                                <div className="flex items-center justify-between gap-2">
                                                                                                    <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Administration</p>
                                                                                                    <label className="flex items-center gap-1.5 text-xs text-gray-500">
                                                                                                        <input
                                                                                                            type="checkbox"
                                                                                                            checked={allAdminSelected}
                                                                                                            onChange={(event) => setCategoryPermissions(
                                                                                                                appCode,
                                                                                                                roleCode,
                                                                                                                adminKeys,
                                                                                                                event.target.checked
                                                                                                            )}
                                                                                                            className="text-red-600 focus:ring-red-500 rounded"
                                                                                                        />
                                                                                                        All in Administration
                                                                                                    </label>
                                                                                                </div>
                                                                                                <div className="space-y-3 pl-1">
                                                                                                    {adminGroups.map(([category, features]) => renderCategoryBlock(category, features))}
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </>
                                                                                );
                                                                            }

                                                                            return orderedFeatureGroups.map(([category, features]) => renderCategoryBlock(category, features));
                                                                        })()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                </section>
                            )}
                        </div>
                        <div className="px-5 sm:px-7 py-4 border-t border-gray-200 flex items-center justify-between gap-3 bg-gray-50">
                            <button
                                type="button"
                                onClick={editorStep === 1 ? () => setIsEditorOpen(false) : goToPreviousStep}
                                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700"
                            >
                                {editorStep === 1 ? 'Cancel' : 'Back'}
                            </button>
                            {editorStep < 3 ? (
                                <button type="button" onClick={goToNextStep} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold">
                                    Next
                                </button>
                            ) : (
                                <button type="button" onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-semibold">
                                    {isSaving ? 'Saving…' : editingEmployee ? 'Save changes' : 'Create employee'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            {viewEmployee && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Employee details</h3>
                            <button type="button" onClick={() => setViewEmployee(null)} className="p-2 rounded-lg hover:bg-gray-100">
                                <FiX />
                            </button>
                        </div>
                        <div className="px-5 py-4 space-y-2 text-sm text-gray-700">
                            {(() => {
                                const profile = viewEmployee.profile || viewEmployee;
                                const userInfo = profile.user || viewEmployee.user || profile;
                                const roles = getEmployeeRoles(viewEmployee);
                                return (
                                    <>
                                        <p><span className="font-semibold">Name:</span> {userInfo.name || profile.employee_name || '—'}</p>
                                        <p><span className="font-semibold">Phone:</span> {userInfo.phone || '—'}</p>
                                        <p><span className="font-semibold">Email:</span> {userInfo.email || '—'}</p>
                                        <p><span className="font-semibold">Code:</span> {profile.employeeCode || profile.employee_code || '—'}</p>
                                        <p><span className="font-semibold">Join date:</span> {formatDateInput(profile.dateOfJoining || profile.date_of_joining) || '—'}</p>
                                        <p><span className="font-semibold">Salary:</span> {profile.salary ?? '—'}</p>
                                        <p><span className="font-semibold">Roles:</span> {roles.join(', ') || '—'}</p>
                                        {managerMode && roles.includes('MANAGER') && (
                                            <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                                View only — Managers cannot create, edit, or delete other Managers.
                                            </p>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
                            <button type="button" onClick={() => setViewEmployee(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {(offerLetterLoading || offerLetterData) && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-6">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Offer letter</h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setOfferLetterData(null);
                                    setOfferLetterLoading(false);
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100"
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="px-5 py-8">
                            {offerLetterLoading ? (
                                <p className="text-center text-gray-500">Preparing offer letter…</p>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600 text-center">
                                        Offer letter ready for{' '}
                                        <span className="font-semibold text-gray-900">
                                            {offerLetterData?.employee?.name || 'employee'}
                                        </span>
                                    </p>
                                    <p className="text-sm text-center text-gray-700">
                                        <span className="text-gray-500">Designation:</span>{' '}
                                        <span className="font-semibold">
                                            {offerLetterData?.designation
                                                || offerLetterData?.roleLabel
                                                || 'Employee'}
                                        </span>
                                    </p>
                                    <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-3 text-left">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                                            Roles & Responsibilities
                                        </p>
                                        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-gray-700">
                                            {(offerLetterData?.responsibilities || []).map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ol>
                                    </div>
                                    <div className="text-center">
                                        <PDFDownloadLink
                                            document={
                                                appScope === 'VEHICLE_FINANCE'
                                                    ? <VehicleFinanceOfferLetterPDF letterData={offerLetterData} />
                                                    : <ChitFundOfferLetterPDF letterData={offerLetterData} />
                                            }
                                            fileName={`offer-letter-${String(offerLetterData?.employee?.name || 'employee').replace(/\s+/g, '-')}.pdf`}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
                                        >
                                            {({ loading }) => (loading ? 'Building PDF…' : 'Download PDF')}
                                        </PDFDownloadLink>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {dashboardCollector && (
                <CollectorDashboardModal
                    isOpen
                    onClose={() => setDashboardCollector(null)}
                    collector={dashboardCollector}
                    initialTab={collectorModalTab}
                />
            )}

            {vfAreaEmployee && (
                <VehicleFinanceCollectorAssignmentModal
                    employee={vfAreaEmployee}
                    membershipId={ownerMembershipId}
                    token={token}
                    onClose={() => setVfAreaEmployee(null)}
                    onAssigned={() => {
                        setVfAreaEmployee(null);
                        loadData();
                    }}
                />
            )}
        </div>
    );
};

export default PlatformEmployeesPage;

