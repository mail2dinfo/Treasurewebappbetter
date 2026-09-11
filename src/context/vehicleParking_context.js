import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useUserContext } from './user_context';
import { usePlatformAccess } from './platformAccess_context';
import { vpRequest } from '../utils/vpClient';

const VehicleParkingContext = createContext(null);
const LOC_KEY = 'vp_location_id';
const PARENT_KEY = 'vp_parent_membership_id';

const companyParentFromAccounts = (accounts = []) => {
    const withParent = accounts.find((a) => a?.parent_membership_id);
    return withParent?.parent_membership_id
        || accounts[0]?.parent_membership_id
        || accounts[0]?.membershipId
        || accounts[0]?.membership_id
        || '';
};

export const VehicleParkingProvider = ({ children }) => {
    const { user } = useUserContext();
    const platform = usePlatformAccess();
    const token = user?.results?.token || localStorage.getItem('token') || '';
    const parentMembershipId = String(
        platform?.activeContext?.parentMembershipId
        || companyParentFromAccounts(user?.results?.userAccounts)
        || localStorage.getItem(PARENT_KEY)
        || ''
    );
    const [boot, setBoot] = useState(null);
    const [locationId, setLocationIdState] = useState(() => localStorage.getItem(LOC_KEY) || '');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (parentMembershipId) {
            try { localStorage.setItem(PARENT_KEY, parentMembershipId); } catch { /* ignore */ }
        }
    }, [parentMembershipId]);

    const withParent = useCallback((opts = {}) => {
        const params = { ...(opts.params || {}) };
        const body = opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)
            ? { ...opts.body }
            : opts.body;
        if (parentMembershipId) {
            if (params.parent_membership_id == null && params.membershipId == null) {
                params.parent_membership_id = parentMembershipId;
            }
            if (body && typeof body === 'object' && !(body instanceof FormData)
                && body.parent_membership_id == null && body.membershipId == null) {
                body.parent_membership_id = parentMembershipId;
            }
        }
        return { ...opts, params, body };
    }, [parentMembershipId]);

    const vp = useCallback(
        (path, opts) => vpRequest(token, path, withParent(opts)),
        [token, withParent]
    );

    const reload = useCallback(async (loc) => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await vp('/vp/bootstrap', {
                params: { location_id: loc || locationId || undefined },
            });
            setBoot(data);
            const nextLoc = loc || data.location_id || data.locations?.[0]?.id || '';
            if (nextLoc) {
                setLocationIdState(nextLoc);
                localStorage.setItem(LOC_KEY, nextLoc);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to load parking');
        } finally {
            setLoading(false);
        }
    }, [token, locationId, vp]);

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, parentMembershipId]);

    const setLocationId = (id) => {
        setLocationIdState(id);
        localStorage.setItem(LOC_KEY, id);
        reload(id);
    };

    const value = useMemo(
        () => ({ token, boot, loading, locationId, setLocationId, reload, vp, parentMembershipId }),
        [token, boot, loading, locationId, reload, vp, parentMembershipId]
    );

    return (
        <VehicleParkingContext.Provider value={value}>
            {children}
        </VehicleParkingContext.Provider>
    );
};

export const useVehicleParking = () => {
    const ctx = useContext(VehicleParkingContext);
    if (!ctx) throw new Error('useVehicleParking must be inside VehicleParkingProvider');
    return ctx;
};
