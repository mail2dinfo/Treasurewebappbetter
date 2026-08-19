import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';

const LIVE_STREAM_PATH = '/hh/opd/visits/stream';

const connections = new Map();

const connectionKey = (token, parentMembershipId, streamPath = '', extra = '') =>
  `${token}::${parentMembershipId}::${streamPath}::${extra}`;

const parsePayload = (raw) => {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
};

const ensureConnection = (token, parentMembershipId, streamPath, extraParams = {}) => {
  const path = streamPath || LIVE_STREAM_PATH;
  const key = connectionKey(token, parentMembershipId, path, extraParams.patient_id || '');
  const existing = connections.get(key);
  if (existing) return existing;

  const params = new URLSearchParams({
    token,
    parent_membership_id: String(parentMembershipId),
    ...extraParams,
  });
  const url = `${API_BASE_URL}${path}?${params.toString()}`;
  const es = new EventSource(url);
  const listeners = new Set();
  const entry = { es, listeners, key };

  const emit = (data) => {
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch {
        // ignore listener errors
      }
    });
  };

  es.addEventListener('clinical', (event) => {
    const data = parsePayload(event.data);
    if (data) emit(data);
  });
  es.addEventListener('connected', (event) => {
    const data = parsePayload(event.data) || {};
    emit({ action: 'connected', ...data });
  });
  es.onmessage = (event) => {
    const data = parsePayload(event.data);
    if (data) emit(data);
  };
  es.onerror = () => {
    // Browser auto-reconnects
  };

  connections.set(key, entry);
  return entry;
};

const releaseConnection = (key, listener) => {
  const entry = connections.get(key);
  if (!entry) return;
  entry.listeners.delete(listener);
  if (entry.listeners.size > 0) return;
  entry.es.close();
  connections.delete(key);
};

/**
 * Live hospital updates via SSE. Multiple desks share one EventSource
 * per login + hospital so role-to-role popups work without extra connections.
 */
export function useHhClinicalStream({
  enabled = true,
  streamPath,
  parentMembershipId,
  token,
  patientId,
  onEvent,
}) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !token || !parentMembershipId) return undefined;

    const path = streamPath || LIVE_STREAM_PATH;
    const extraParams = patientId ? { patient_id: String(patientId) } : {};
    const extraKey = extraParams.patient_id || '';
    const key = connectionKey(token, parentMembershipId, path, extraKey);
    const entry = ensureConnection(token, parentMembershipId, path, extraParams);
    const listener = (data) => onEventRef.current?.(data);
    entry.listeners.add(listener);

    return () => releaseConnection(key, listener);
  }, [enabled, token, parentMembershipId, streamPath, patientId]);
}

export default useHhClinicalStream;
