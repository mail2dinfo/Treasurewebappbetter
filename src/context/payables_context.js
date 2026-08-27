import React, { createContext, useReducer, useContext, useEffect, useCallback, useRef } from "react";
import { useUserContext } from "./user_context";
import { API_BASE_URL } from "../utils/apiConfig";
import { useCollectorReceivablesStream } from "../components/collector/useCollectorReceivablesStream";
import { getChitCompanyMembershipId } from "../utils/chitMembership";

const PayablesContext = createContext();

const initialState = {
  payables: [],
  isLoading: false,
  error: null,
};

function payablesReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, isLoading: false, payables: action.payload };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

export const PayablesProvider = ({ children }) => {
  const { user } = useUserContext();
  const [state, dispatch] = useReducer(payablesReducer, initialState);

  const fetchPayables = useCallback(async (options = {}) => {
    if (!user?.results?.token) return;

    const membershipId = getChitCompanyMembershipId(user);
    if (!membershipId) {
      dispatch({ type: "FETCH_ERROR", payload: "Membership ID not found" });
      return;
    }

    if (!options.silent) {
      dispatch({ type: "FETCH_START" });
    }
    try {
      const res = await fetch(`${API_BASE_URL}/payables`, {
        headers: {
          Authorization: `Bearer ${user.results.token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch payables");
      const data = await res.json();
      dispatch({ type: "FETCH_SUCCESS", payload: data.results.payablesResult || [] });
    } catch (error) {
      if (!options.silent) {
        dispatch({ type: "FETCH_ERROR", payload: error.message });
      }
    }
  }, [user]);

  const fetchPayablesRef = useRef(fetchPayables);
  fetchPayablesRef.current = fetchPayables;

  const parentMembershipId = getChitCompanyMembershipId(user);

  useCollectorReceivablesStream({
    enabled: Boolean(user?.results?.token && parentMembershipId),
    token: user?.results?.token,
    parentMembershipId,
    onEvent: () => {
      fetchPayablesRef.current?.({ silent: true });
    },
  });

  useEffect(() => {
    if (user?.results?.token) {
      fetchPayables();
    }
  }, [user, fetchPayables]);

  return (
    <PayablesContext.Provider
      value={{
        payables: state.payables,
        isLoading: state.isLoading,
        error: state.error,
        fetchPayables
      }}
    >
      {children}
    </PayablesContext.Provider>
  );
};

export const usePayablesContext = () => {
  return useContext(PayablesContext);
};
