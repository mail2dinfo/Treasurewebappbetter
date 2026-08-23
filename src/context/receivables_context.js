import React, { createContext, useReducer, useContext, useEffect, useCallback, useRef } from "react";
import { useUserContext } from "./user_context";
import { API_BASE_URL } from "../utils/apiConfig";
import { useCollectorReceivablesStream } from "../components/collector/useCollectorReceivablesStream";

const ReceivablesContext = createContext();

const initialState = {
  receivables: [],
  isLoading: false,
  error: null,
};

function receivablesReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, isLoading: false, receivables: action.payload };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

export const ReceivablesProvider = ({ children }) => {
  const { user } = useUserContext();
  const [state, dispatch] = useReducer(receivablesReducer, initialState);

  const fetchReceivables = useCallback(async (options = {}) => {
    if (!user?.results?.token) return;

    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
    if (!membershipId) {
      dispatch({ type: "FETCH_ERROR", payload: "Membership ID not found" });
      return;
    }

    if (!options.silent) {
      dispatch({ type: "FETCH_START" });
    }
    try {
        const res = await fetch(`${API_BASE_URL}/receivables`, {
        headers: {
          Authorization: `Bearer ${user.results.token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch receivables");
      const data = await res.json();
      dispatch({ type: "FETCH_SUCCESS", payload: data.results.receivablesResult || [] });
    } catch (error) {
      if (!options.silent) {
        dispatch({ type: "FETCH_ERROR", payload: error.message });
      }
    }
  }, [user]);

  const fetchReceivablesRef = useRef(fetchReceivables);
  fetchReceivablesRef.current = fetchReceivables;

  const parentMembershipId =
    user?.results?.userAccounts?.[0]?.parent_membership_id ||
    user?.results?.userAccounts?.[0]?.parentMembershipId ||
    null;

  useCollectorReceivablesStream({
    enabled: Boolean(user?.results?.token && parentMembershipId),
    token: user?.results?.token,
    parentMembershipId,
    onEvent: () => {
      fetchReceivablesRef.current?.({ silent: true });
    },
  });

  useEffect(() => {
    if (user?.results?.token) {
      fetchReceivables();
    }
  }, [user, fetchReceivables]);

 

  return (
    <ReceivablesContext.Provider
      value={{
        receivables: state.receivables,
        isLoading: state.isLoading,
        error: state.error,
        fetchReceivables
      }}
    >
      {children}
    </ReceivablesContext.Provider>
  );
};

export const useReceivablesContext = () => {
  return useContext(ReceivablesContext);
};
