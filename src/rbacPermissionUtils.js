import rbacData from '../src/rbac.json'

export const hasPermission = (role, permission) => {
    const roleKey = Object.keys(rbacData.roles).find(
        (configuredRole) => configuredRole.toLowerCase() === String(role || '').toLowerCase()
    );
    return Boolean(roleKey && rbacData.roles[roleKey].includes(permission));
};