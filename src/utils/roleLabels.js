const ROLE_CODE_LABELS = {
    OWNER: 'Owner',
    USER: 'User',
    MANAGER: 'Manager',
    COLLECTOR: 'Collector',
    ACCOUNTANT: 'Accountant',
};

export const formatRoleLabel = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return raw
        .split(/[\s_]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Resolve display role for navbar "Logged in as {Role}".
 * Prefers platform active context, then userRole / accountName, then path fallback.
 */
export const getLoggedInRoleLabel = ({
    platform,
    userRole,
    userAccounts,
    pathname = '',
} = {}) => {
    const activeRoleCode = String(platform?.activeContext?.roleCode || '').toUpperCase();
    if (activeRoleCode && ROLE_CODE_LABELS[activeRoleCode]) {
        return ROLE_CODE_LABELS[activeRoleCode];
    }

    const normalizedUserRole = String(userRole || '').trim().toUpperCase();
    if (normalizedUserRole && ROLE_CODE_LABELS[normalizedUserRole]) {
        return ROLE_CODE_LABELS[normalizedUserRole];
    }

    const fromUserRole = formatRoleLabel(userRole);
    if (fromUserRole) return fromUserRole;

    const accounts = Array.isArray(userAccounts) ? userAccounts : [];
    const accountName = accounts.find((account) => account?.accountName)?.accountName;
    if (accountName) {
        const accountCode = String(accountName).trim().toUpperCase();
        if (ROLE_CODE_LABELS[accountCode]) return ROLE_CODE_LABELS[accountCode];
        return formatRoleLabel(accountName);
    }

    if (platform?.isOwner) return 'Owner';

    const path = String(pathname || '');
    if (path.includes('/manager')) return 'Manager';
    if (path.includes('/collector')) return 'Collector';
    if (path.includes('/accountant')) return 'Accountant';
    if (path.includes('/subscriber')) return 'Subscriber';
    if (path.includes('/user')) return 'User';

    return 'User';
};

export { ROLE_CODE_LABELS };
