import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';

/**
 * Live collector receivables via SSE. EventSource cannot send Authorization,
 * so the JWT is passed as ?token= (same pattern as hostel/hospital streams).
 */
export function useCollectorReceivablesStream({
  enabled = true,
  token,
  parentMembershipId,
  onEvent,
}) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !token) return;

    const params = new URLSearchParams({ token });
    if (parentMembershipId) {
      params.set('parent_membership_id', String(parentMembershipId));
    }

    const url = `${API_BASE_URL}/collector-area/receivables/stream?${params.toString()}`;
    const es = new EventSource(url);
    let closed = false;
    let debounceTimer = null;

    const emit = (raw) => {
      try {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        onEventRef.current?.(data);
      } catch {
        // ignore malformed payloads
      }
    };

    es.addEventListener('collector-receivables', (event) => {
      if (closed) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => emit(event.data), 400);
    });

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

export default useCollectorReceivablesStream;
