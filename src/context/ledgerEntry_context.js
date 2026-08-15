import React, { createContext, useReducer, useContext, useEffect, useRef } from "react";
import { useUserContext } from "./user_context";
import { API_BASE_URL } from "../utils/apiConfig";

const LedgerEntryContext = createContext();

const initialState = {
  ledgerEntries: [],
  isLoading: false,
  error: null,
  page: 1,
  limit: 20,
  totalPages: 1,
  totalCount: 0,
};

function ledgerEntryReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        ledgerEntries: action.payload.entries,
        totalPages: action.payload.totalPages,
        totalCount: action.payload.totalCount,
      };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    case "SET_LIMIT":
      return { ...state, limit: action.payload, page: 1 };
    default:
      return state;
  }
}

const normalizeEntriesPayload = (data) => {
  const payload = data?.results;
  if (Array.isArray(payload)) {
    return {
      entries: payload,
      totalPages: Number(data?.totalPages) || 1,
      totalCount: Number(data?.totalCount) || payload.length,
    };
  }
  if (payload && typeof payload === "object") {
    const entries = Array.isArray(payload.results) ? payload.results : [];
    return {
      entries,
      totalPages: Math.max(1, Number(payload.totalPages) || Number(data?.totalPages) || 1),
      totalCount: Number(payload.totalCount) || entries.length,
    };
  }
  return { entries: [], totalPages: 1, totalCount: 0 };
};

export const LedgerEntryProvider = ({ children }) => {
  const { user } = useUserContext();
  const [state, dispatch] = useReducer(ledgerEntryReducer, initialState);
  const filtersRef = useRef({});

  const fetchLedgerEntries = async (filters = filtersRef.current, options = {}) => {
    if (!user?.results?.token) return;

    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
    if (!membershipId) {
      dispatch({ type: "FETCH_ERROR", payload: "Membership ID not found" });
      return;
    }

    const nextFilters = filters && typeof filters === "object" ? filters : {};
    filtersRef.current = nextFilters;

    const page = options.page ?? state.page;
    const limit = options.limit ?? state.limit;

    dispatch({ type: "FETCH_START" });

    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(nextFilters.startDate ? { startDate: nextFilters.startDate } : {}),
        ...(nextFilters.endDate ? { endDate: nextFilters.endDate } : {}),
        ...(nextFilters.category ? { category: nextFilters.category } : {}),
        ...(nextFilters.entryType ? { entryType: nextFilters.entryType } : {}),
      });

      const res = await fetch(
        `${API_BASE_URL}/ledger/entry/${membershipId}?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${user.results.token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch ledger entries");
      const data = await res.json();
      const normalized = normalizeEntriesPayload(data);

      dispatch({
        type: "FETCH_SUCCESS",
        payload: normalized,
      });
    } catch (error) {
      dispatch({ type: "FETCH_ERROR", payload: error.message });
    }
  };

  useEffect(() => {
    if (user?.results?.token) {
      fetchLedgerEntries(filtersRef.current, { page: state.page, limit: state.limit });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, state.page, state.limit]);

  const addLedgerEntry = async (newEntry) => {
    if (!user?.results?.token) return { success: false, message: "User not authenticated" };

    try {
      const res = await fetch(`${API_BASE_URL}/ledger/entry`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.results.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEntry),
      });

      return res;
    } catch (error) {
      return { success: false, message: error.message || "Unknown error occurred" };
    }
  };

  const deleteLedgerEntry = async (entryId) => {
    if (!user?.results?.token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/ledger/entry/${entryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.results.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to delete ledger entry");
      await fetchLedgerEntries(filtersRef.current);
    } catch (error) {
      console.error("Delete ledger entry error:", error);
    }
  };

  const setPage = (page) => dispatch({ type: "SET_PAGE", payload: page });
  const setLimit = (limit) => dispatch({ type: "SET_LIMIT", payload: limit });

  return (
    <LedgerEntryContext.Provider
      value={{
        ledgerEntries: state.ledgerEntries,
        isLoading: state.isLoading,
        error: state.error,
        page: state.page,
        limit: state.limit,
        totalPages: state.totalPages,
        totalCount: state.totalCount,
        fetchLedgerEntries,
        addLedgerEntry,
        deleteLedgerEntry,
        setPage,
        setLimit,
      }}
    >
      {children}
    </LedgerEntryContext.Provider>
  );
};

export const useLedgerEntryContext = () => useContext(LedgerEntryContext);
