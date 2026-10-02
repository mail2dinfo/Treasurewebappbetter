import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlatformAccess } from '../../context/platformAccess_context';

export const useDpPermission = () => {
    const platform = usePlatformAccess();
    const location = useLocation();
    const onCollectorPath = /\/deepavali-chits\/collector/.test(location.pathname || '');
    const roleCode = String(platform?.activeContext?.roleCode || '').toUpperCase();
    const isOwner = Boolean(platform?.isOwner);
    const sessionReady = Boolean(platform?.isAvailable && platform?.hasLoaded);
    const hasDpContext = platform?.activeContext?.appCode === 'DEEPAVALI_CHITS';
    const ownerBypass = isOwner && !onCollectorPath && roleCode !== 'COLLECTOR';
    const enforceAccess = Boolean(
        !ownerBypass
        && (hasDpContext || onCollectorPath)
        && sessionReady
        && (onCollectorPath || roleCode === 'COLLECTOR')
    );
    const denyUntilReady = Boolean(onCollectorPath && !sessionReady);

    const canAccess = useCallback(
        (featureKey) => {
            if (!featureKey) return true;
            if (ownerBypass) return true;
            if (denyUntilReady) return false;
            if (!enforceAccess) return !onCollectorPath;
            return platform.hasPermission(featureKey);
        },
        [denyUntilReady, enforceAccess, onCollectorPath, ownerBypass, platform]
    );

    return { platform, enforceAccess, canAccess };
};
