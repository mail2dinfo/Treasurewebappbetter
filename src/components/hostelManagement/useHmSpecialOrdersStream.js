import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';

/**
 * Live special-order updates via SSE. On each event, calls onEvent (typically refetch).
 * EventSource cannot send Authorization headers, so token is passed as a query param.
 */
export function useHmSpecialOrdersStream({
  enabled = true,
  scope = 'membership',
  parentMembershipId,
  token,
  onEvent,
}) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !token) return;
    if (scope === 'membership' && !parentMembershipId) return;

    const params = new URLSearchParams({
      token,
      scope,
    });
    if (scope === 'membership') {
      params.set('parent_membership_id', String(parentMembershipId));
    }

    const url = `${API_BASE_URL}/hm/special-orders/stream?${params.toString()}`;
    const es = new EventSource(url);
    let closed = false;

    const handlePayload = (raw) => {
      try {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        onEventRef.current?.(data);
      } catch {
        // ignore malformed payloads
      }
    };

    es.addEventListener('special-order', (event) => {
      if (!closed) handlePayload(event.data);
    });

    es.addEventListener('connected', () => {
      // optional: could trigger a one-shot refresh on reconnect
      if (!closed) onEventRef.current?.({ action: 'connected' });
    });

    es.onerror = () => {
      // Browser auto-reconnects; no polling fallback
    };

    return () => {
      closed = true;
      es.close();
    };
  }, [enabled, scope, parentMembershipId, token]);
}

export default useHmSpecialOrdersStream;
