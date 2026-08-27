import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { useCollectorReceivablesStream } from "../components/collector/useCollectorReceivablesStream";
import { getChitCompanyMembershipId } from "../utils/chitMembership";
import { useUserContext } from "./user_context";

const CompanyLiveEventsContext = createContext(null);

/**
 * One SSE connection for the company. Payables / receivables / ledger subscribe
 * here instead of each opening EventSource (browsers cap ~6 connections per host).
 */
export const CompanyLiveEventsProvider = ({ children }) => {
  const { user } = useUserContext();
  const listenersRef = useRef(new Set());
  const parentMembershipId = getChitCompanyMembershipId(user);

  const emit = useCallback((data) => {
    listenersRef.current.forEach((fn) => {
      try {
        fn(data);
      } catch (error) {
        console.error("companyLiveEvents listener", error);
      }
    });
  }, []);

  useCollectorReceivablesStream({
    enabled: Boolean(user?.results?.token && parentMembershipId),
    token: user?.results?.token,
    parentMembershipId,
    onEvent: emit,
  });

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        emit({ action: "focus-refetch" });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [emit]);

  const subscribe = useCallback((fn) => {
    listenersRef.current.add(fn);
    return () => listenersRef.current.delete(fn);
  }, []);

  return (
    <CompanyLiveEventsContext.Provider value={subscribe}>
      {children}
    </CompanyLiveEventsContext.Provider>
  );
};

export const useCompanyLiveEvents = (onEvent, enabled = true) => {
  const subscribe = useContext(CompanyLiveEventsContext);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !subscribe) return undefined;
    return subscribe((data) => onEventRef.current?.(data));
  }, [subscribe, enabled]);
};
