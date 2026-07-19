import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { passesVfModuleGate } from '../../utils/vfPermissionCatalog';

/**
 * VF feature checks.
 * - /vehicle-finance/user: Owner unrestricted
 * - /vehicle-finance/manager|collector: always enforce active role matrix (even if user is also Owner)
 */
export const useVfPermission = () => {
    const platform = usePlatformAccess();
    const location = useLocation();
    const onVfStaffPath = /\/vehicle-finance\/(manager|collector)/.test(location.pathname || '');
    const roleCode = String(platform?.activeContext?.roleCode || '').toUpperCase();
    const staffRoleActive = ['MANAGER', 'COLLECTOR', 'ACCOUNTANT'].includes(roleCode);
    const isOwner = Boolean(platform?.isOwner);
    const sessionReady = Boolean(platform?.isAvailable && platform?.hasLoaded);
    const hasVfContext = platform?.activeContext?.appCode === 'VEHICLE_FINANCE';

    // Owner bypass only on user path — never on manager/collector URLs.
    const ownerBypass = isOwner && !onVfStaffPath && !staffRoleActive;
    const enforceAccess = Boolean(
        !ownerBypass
        && (hasVfContext || onVfStaffPath)
        && sessionReady
    );
    const denyUntilReady = Boolean(onVfStaffPath && !sessionReady);

    const canAccess = useCallback(
        (featureKey) => {
            if (!featureKey) return true;
            if (ownerBypass) return true;
            if (denyUntilReady) return false;
            if (!enforceAccess) return !onVfStaffPath;
            return platform.hasPermission(featureKey);
        },
        [denyUntilReady, enforceAccess, onVfStaffPath, ownerBypass, platform]
    );

    const canAccessAny = useCallback(
        (featureKeys = []) => {
            if (!featureKeys.length) return true;
            if (ownerBypass) return true;
            if (denyUntilReady) return false;
            if (!enforceAccess) return !onVfStaffPath;
            return platform.hasAnyPermission(featureKeys);
        },
        [denyUntilReady, enforceAccess, onVfStaffPath, ownerBypass, platform]
    );

    const canAccessModule = useCallback(
        (moduleId) => {
            if (ownerBypass) return true;
            if (denyUntilReady) return false;
            if (!enforceAccess) return !onVfStaffPath;
            return passesVfModuleGate(canAccess, canAccessAny, moduleId);
        },
        [canAccess, canAccessAny, denyUntilReady, enforceAccess, onVfStaffPath, ownerBypass]
    );

    return { platform, enforceAccess, canAccess, canAccessAny, canAccessModule };
};
