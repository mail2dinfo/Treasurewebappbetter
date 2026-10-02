import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';

export function useDpCollectionsStream({
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

        const url = `${API_BASE_URL}/dp/collections/stream?${params.toString()}`;
        const es = new EventSource(url);
        let closed = false;
        let debounceTimer = null;

        const emit = (raw) => {
            try {
                const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
                onEventRef.current?.(data);
            } catch {
                onEventRef.current?.({ action: 'dp-receivable-change' });
            }
        };

        const onNamed = (event) => {
            if (closed) return;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => emit(event.data), 250);
        };

        es.addEventListener('dp-collections', onNamed);
        es.addEventListener('connected', () => {});
        es.onmessage = (event) => onNamed(event);
        es.onerror = () => {};

        return () => {
            closed = true;
            clearTimeout(debounceTimer);
            es.close();
        };
    }, [enabled, token, parentMembershipId]);
}

export default useDpCollectionsStream;
