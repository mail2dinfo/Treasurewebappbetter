import { useCallback, useMemo } from 'react';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { HH_NAV_ANY } from '../../utils/hhPermissionCatalog';

/**
 * Hospital Management permission helpers.
 * Owners bypass; Managers/Receptionists use granted feature keys.
 */
export const useHhPermission = () => {
  const platform = usePlatformAccess();
  const roleCode = String(platform?.activeContext?.roleCode || '').toUpperCase();
  const appCode = String(platform?.activeContext?.appCode || '').toUpperCase();
  const enforceAccess = Boolean(
    platform?.isAvailable
    && appCode === 'HOSPITAL_MANAGEMENT'
    && ['MANAGER', 'RECEPTIONIST'].includes(roleCode)
  );
  const isHhOpsRole = ['MANAGER', 'RECEPTIONIST'].includes(roleCode);

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
    dashboard: canAny(HH_NAV_ANY.dashboard),
    hospital: canAny(HH_NAV_ANY.hospital),
    doctors: canAny(HH_NAV_ANY.doctors),
    patients: canAny(HH_NAV_ANY.patients),
    appointments: !enforceAccess || isHhOpsRole || canAny(HH_NAV_ANY.appointments),
    wards: canAny(HH_NAV_ANY.wards),
    admissions: canAny(HH_NAV_ANY.admissions),
    billing: canAny(HH_NAV_ANY.billing),
    pharmacy: canAny(HH_NAV_ANY.pharmacy),
    ledger: canAny(HH_NAV_ANY.ledger),
    daybook: canAny(HH_NAV_ANY.daybook),
    emr: canAny(HH_NAV_ANY.emr),
    lab: canAny(HH_NAV_ANY.lab),
    bloodBank: canAny(HH_NAV_ANY.bloodBank),
    inventory: canAny(HH_NAV_ANY.inventory),
    insurance: canAny(HH_NAV_ANY.insurance),
    reports: canAny(HH_NAV_ANY.reports),
    extraAdmin: canAny(HH_NAV_ANY.extraAdmin),
    employees: canAny(HH_NAV_ANY.employees),
    adminSettings: canAny(HH_NAV_ANY.adminSettings),
  }), [canAny, enforceAccess, isHhOpsRole]);

  return {
    enforceAccess,
    can,
    canAny,
    nav,
    isOwner: Boolean(platform?.isOwner) && !enforceAccess,
    isHhOpsRole,
    roleCode,
  };
};

export default useHhPermission;
