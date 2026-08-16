import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';

/**
 * Live order updates via SSE. On each event, calls onEvent (typically refetch).
 * EventSource cannot send Authorization headers, so token is passed as a query param.
 *
 * Staff: scope=membership + parent_membership_id
 * Public customer page: scope=public + orderToken (hits /ms/public/:orderToken/stream)
 */
export function useMsOrdersStream({
  enabled = true,
  scope = 'membership',
  parentMembershipId,
  orderToken,
  token,
  onEvent,
}) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !token) return;

    let url;
    if (scope === 'customer') {
      const params = new URLSearchParams({
        token,
        scope: 'customer',
      });
      if (parentMembershipId) {
        params.set('parent_membership_id', String(parentMembershipId));
      }
      url = `${API_BASE_URL}/ms/orders/stream?${params.toString()}`;
    } else if (scope === 'public') {
      // Legacy token links (kept for compatibility)
      if (!orderToken) return;
      const params = new URLSearchParams();
      if (token) params.set('token', token);
      const qs = params.toString();
      url = `${API_BASE_URL}/ms/public/${encodeURIComponent(orderToken)}/stream${qs ? `?${qs}` : ''}`;
    } else {
      if (!parentMembershipId) return;
      const params = new URLSearchParams({
        token,
        scope: 'membership',
        parent_membership_id: String(parentMembershipId),
      });
      url = `${API_BASE_URL}/ms/orders/stream?${params.toString()}`;
    }

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

    es.addEventListener('order', (event) => {
      if (!closed) handlePayload(event.data);
    });

    es.addEventListener('connected', () => {
      if (!closed) onEventRef.current?.({ action: 'connected' });
    });

    es.onmessage = (event) => {
      if (!closed) handlePayload(event.data);
    };

    es.onerror = () => {
      // Browser auto-reconnects; no polling fallback
    };

    return () => {
      closed = true;
      es.close();
    };
  }, [enabled, scope, parentMembershipId, orderToken, token]);
}

export default useMsOrdersStream;
