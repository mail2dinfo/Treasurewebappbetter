import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';

/**
 * Live Daily Collection updates via SSE.
 * EventSource cannot send Authorization, so the JWT is passed as ?token=.
 */
export function useDcCollectionsStream({
    enabled = true,
    token,
    parentMembershipId,
    onEvent,
}) {
    const onEventRef = useRef(onEvent);
    onEventRef.current = onEvent;

    useEffect(() => {
        if (!enabled || !token) return undefined;

        const params = new URLSearchParams({ token });
        if (parentMembershipId) {
            params.set('parent_membership_id', String(parentMembershipId));
        }

        const url = `${API_BASE_URL}/dc/collections/stream?${params.toString()}`;
        const es = new EventSource(url);
        let closed = false;
        let debounceTimer = null;

        const emit = (raw) => {
            try {
                const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
                onEventRef.current?.(data);
            } catch {
                onEventRef.current?.({ action: 'collection-updated' });
            }
        };

        const onNamed = (event) => {
            if (closed) return;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => emit(event.data), 250);
        };

        es.addEventListener('dc-collections', onNamed);
        es.addEventListener('connected', () => {
            // Stream is alive; ignore.
        });
        es.onmessage = (event) => onNamed(event);

        es.onerror = () => {
            // Browser auto-reconnects
        };

        return () => {
            closed = true;
            clearTimeout(debounceTimer);
            es.close();
        };
    }, [enabled, token, parentMembershipId]);
}

export default useDcCollectionsStream;
