import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useDcCollectionsStream } from '../../components/dailyCollection/useDcCollectionsStream';
import { useUserContext } from '../user_context';
import { getChitCompanyMembershipId } from '../../utils/chitMembership';

const DcLiveEventsContext = createContext(null);

export const DcLiveEventsProvider = ({ children }) => {
    const { user } = useUserContext();
    const listenersRef = useRef(new Set());
    const parentMembershipId = getChitCompanyMembershipId(user);

    const emit = useCallback((data) => {
        listenersRef.current.forEach((fn) => {
            try {
                fn(data);
            } catch (error) {
                console.error('dcLiveEvents listener', error);
            }
        });
    }, []);

    useDcCollectionsStream({
        enabled: Boolean(user?.results?.token),
        token: user?.results?.token,
        parentMembershipId,
        onEvent: emit,
    });

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                emit({ action: 'focus-refetch' });
            }
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [emit]);

    const subscribe = useCallback((fn) => {
        listenersRef.current.add(fn);
        return () => listenersRef.current.delete(fn);
    }, []);

    return (
        <DcLiveEventsContext.Provider value={subscribe}>
            {children}
        </DcLiveEventsContext.Provider>
    );
};

export const useDcLiveEvents = (onEvent, enabled = true) => {
    const subscribe = useContext(DcLiveEventsContext);
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    useEffect(() => {
        if (!enabled || !subscribe) return undefined;
        return subscribe((data) => onEventRef.current?.(data));
    }, [subscribe, enabled]);
};
