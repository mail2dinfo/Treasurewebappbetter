import { useCallback, useMemo } from 'react';
import { usePlatformAccess } from '../../context/platformAccess_context';
import {
  VP_FEATURES,
  VP_COLLECTOR_DEFAULT_FEATURES,
  VP_MANAGER_DEFAULT_FEATURES,
  VP_ACCOUNTANT_DEFAULT_FEATURES,
} from '../../utils/vpPermissionCatalog';

export const useVpPermission = () => {
  const platform = usePlatformAccess();
  const roleCode = String(platform?.activeContext?.roleCode || '').toUpperCase();
  const appCode = String(platform?.activeContext?.appCode || '').toUpperCase();
  const enforceAccess = Boolean(
    platform?.isAvailable
    && appCode === 'VEHICLE_PARKING'
    && ['MANAGER', 'COLLECTOR', 'ACCOUNTANT'].includes(roleCode)
  );

  const can = useCallback((featureKey) => {
    if (!enforceAccess) return true;
    if (platform.hasPermission(featureKey)) return true;
    const fallback = roleCode === 'COLLECTOR'
      ? VP_COLLECTOR_DEFAULT_FEATURES
      : roleCode === 'ACCOUNTANT'
        ? VP_ACCOUNTANT_DEFAULT_FEATURES
        : VP_MANAGER_DEFAULT_FEATURES;
    const details = platform.activeContext?.permissionDetails || [];
    if (details.length) return false;
    return fallback.includes(featureKey);
  }, [enforceAccess, platform, roleCode]);

  const nav = useMemo(() => ({
    dashboard: true,
    checkin: can(VP_FEATURES.checkin),
    passes: can(VP_FEATURES.checkin) || can(VP_FEATURES.rates),
    active: can(VP_FEATURES.viewVehicle) || can(VP_FEATURES.checkout),
    history: can(VP_FEATURES.viewVehicle) || can(VP_FEATURES.reports),
    slots: can(VP_FEATURES.slots) || !enforceAccess,
    masters: can(VP_FEATURES.rates),
    accounts: can(VP_FEATURES.ledger) || can(VP_FEATURES.expenses),
    shifts: can(VP_FEATURES.shifts),
    reports: can(VP_FEATURES.reports),
    staff: can(VP_FEATURES.staff),
    settings: can(VP_FEATURES.settings),
  }), [can, enforceAccess]);

  return { can, nav, enforceAccess, roleCode, isOwner: !enforceAccess };
};

export default useVpPermission;
