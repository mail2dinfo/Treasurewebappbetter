import { useCallback, useMemo } from 'react';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { MS_NAV_ANY } from '../../utils/msPermissionCatalog';

/**
 * Mutton Stall permission helpers.
 * Owners bypass; Managers/Salesmen use granted feature keys.
 */
export const useMsPermission = () => {
  const platform = usePlatformAccess();
  const roleCode = String(platform?.activeContext?.roleCode || '').toUpperCase();
  const appCode = String(platform?.activeContext?.appCode || '').toUpperCase();
  const enforceAccess = Boolean(
    platform?.isAvailable
    && appCode === 'MUTTON_STALL'
    && ['MANAGER', 'SALESMAN'].includes(roleCode)
  );
  const isMsOpsRole = ['MANAGER', 'SALESMAN'].includes(roleCode);

  const can = useCallback((featureKey) => {
    if (!enforceAccess) return true;
    return platform.hasPermission(featureKey);
  }, [enforceAccess, platform]);

  const canAny = useCallback((featureKeys = []) => {
    if (!enforceAccess) return true;
    if (!featureKeys.length) return true;
    return platform.hasAnyPermission(featureKeys);
  }, [enforceAccess, platform]);

  const nav = useMemo(() => ({
    dashboard: canAny(MS_NAV_ANY.dashboard),
    stock: canAny(MS_NAV_ANY.stock),
    orders: !enforceAccess || isMsOpsRole || canAny(MS_NAV_ANY.orders),
    customers: canAny(MS_NAV_ANY.customers),
    billing: canAny(MS_NAV_ANY.billing),
    reports: canAny(MS_NAV_ANY.reports),
    ledger: canAny(MS_NAV_ANY.ledger),
    daybook: canAny(MS_NAV_ANY.daybook),
    employees: canAny(MS_NAV_ANY.employees),
    adminSettings: canAny(MS_NAV_ANY.adminSettings),
  }), [canAny, enforceAccess, isMsOpsRole]);

  return {
    enforceAccess,
    can,
    canAny,
    nav,
    isOwner: Boolean(platform?.isOwner) && !enforceAccess,
    isMsOpsRole,
    roleCode,
  };
};

export default useMsPermission;
