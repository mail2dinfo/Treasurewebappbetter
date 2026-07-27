import React, { createContext, useReducer, useContext, useEffect } from "react";
import { useUserContext } from "./user_context";
import { API_BASE_URL } from "../utils/apiConfig";

const LedgerCategoryContext = createContext();

const initialState = {
  categories: [],
  isLoading: false,
  error: null,
};

const ledgerCategoryReducer = (state, action) => {
  switch (action.type) {
    case "LEDGER_CATEGORY_FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "LEDGER_CATEGORY_FETCH_SUCCESS":
      return { ...state, isLoading: false, categories: action.payload };
    case "LEDGER_CATEGORY_FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    case "LEDGER_CATEGORY_ADD_SUCCESS":
      return { ...state, categories: [...state.categories, action.payload] };
    case "LEDGER_CATEGORY_DELETE_SUCCESS":
      return {
        ...state,
        categories: state.categories.filter((item) => item.id !== action.payload),
      };
    default:
      return state;
  }
};

export const LedgerCategoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ledgerCategoryReducer, initialState);
  const { user } = useUserContext();

  const fetchLedgerCategories = async () => {
    if (!user?.results?.token) return;
    dispatch({ type: "LEDGER_CATEGORY_FETCH_START" });
    try {
      const res = await fetch(`${API_BASE_URL}/ledger/categories`, {
        headers: {
          Authorization: `Bearer ${user.results.token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch ledger categories");

      dispatch({
        type: "LEDGER_CATEGORY_FETCH_SUCCESS",
        payload: data.results || [],
      });
    } catch (err) {
      dispatch({
        type: "LEDGER_CATEGORY_FETCH_ERROR",
        payload: err.message || "Unknown error",
      });
    }
  };

  const addLedgerCategory = async (formData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ledger/categories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add category");

      dispatch({
        type: "LEDGER_CATEGORY_ADD_SUCCESS",
        payload: data.results,
      });
      fetchLedgerCategories();

      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const deleteLedgerCategory = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ledger/categories/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete category");
      }

      const data = await res.json();
      dispatch({ type: "LEDGER_CATEGORY_DELETE_SUCCESS", payload: id });

      return { success: true, message: data.message || "Deleted successfully" };
    } catch (err) {
      return { success: false, message: err.message || "Something went wrong" };
    }
  };

  useEffect(() => {
    if (user?.results?.token) {
      fetchLedgerCategories();
    }
  }, [user?.results?.token]);

  return (
    <LedgerCategoryContext.Provider
      value={{
        categories: state.categories,
        isLoading: state.isLoading,
        error: state.error,
        fetchLedgerCategories,
        addLedgerCategory,
        deleteLedgerCategory,
      }}
    >
      {children}
    </LedgerCategoryContext.Provider>
  );
};

export const useLedgerCategoryContext = () => useContext(LedgerCategoryContext);
