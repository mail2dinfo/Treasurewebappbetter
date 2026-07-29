import { useCallback, useMemo } from 'react';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { HM_NAV_ANY } from '../../utils/hmPermissionCatalog';

/**
 * Hostel Management permission helpers.
 * Owners bypass; Managers/Receptionists use granted feature keys.
 */
export const useHmPermission = () => {
  const platform = usePlatformAccess();
  const roleCode = String(platform?.activeContext?.roleCode || '').toUpperCase();
  const appCode = String(platform?.activeContext?.appCode || '').toUpperCase();
  const enforceAccess = Boolean(
    platform?.isAvailable
    && appCode === 'HOSTEL_MANAGEMENT'
    && ['MANAGER', 'RECEPTIONIST', 'KITCHEN_STAFF'].includes(roleCode)
  );

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
    dashboard: canAny(HM_NAV_ANY.dashboard),
    hostels: canAny(HM_NAV_ANY.hostels),
    floorsRooms: canAny(HM_NAV_ANY.floorsRooms),
    residents: canAny(HM_NAV_ANY.residents),
    duesDeck: canAny(HM_NAV_ANY.duesDeck),
    receivables: canAny(HM_NAV_ANY.receivables),
    outstanding: canAny(HM_NAV_ANY.outstanding),
    payments: canAny(HM_NAV_ANY.payments),
    foodReport: canAny(HM_NAV_ANY.foodReport),
    specialOrders: canAny(HM_NAV_ANY.specialOrders),
    turfs: canAny(HM_NAV_ANY.turfs),
    shuttleCourts: canAny(HM_NAV_ANY.shuttleCourts),
    ledger: canAny(HM_NAV_ANY.ledger),
    employees: canAny(HM_NAV_ANY.employees),
    adminSettings: canAny(HM_NAV_ANY.adminSettings),
  }), [canAny]);

  return {
    enforceAccess,
    can,
    canAny,
    nav,
    isOwner: Boolean(platform?.isOwner) && !enforceAccess,
    roleCode,
  };
};

export default useHmPermission;
