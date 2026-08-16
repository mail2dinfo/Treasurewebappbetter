import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../user_context';
import { usePlatformAccess } from '../platformAccess_context';

const MuttonStallContext = createContext();

const initialState = {
  stall: null,
  categories: [],
  products: [],
  customers: [],
  orders: [],
  bills: [],
  ledgerAccounts: [],
  ledgerEntries: [],
  ledgerCategories: [],
  daybook: null,
  dashboard: null,
  reports: null,
  isLoading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STALL':
      return { ...state, stall: action.payload, isLoading: false };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload, isLoading: false };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload, isLoading: false };
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload, isLoading: false };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload, isLoading: false };
    case 'SET_BILLS':
      return { ...state, bills: action.payload, isLoading: false };
    case 'SET_LEDGER_ACCOUNTS':
      return { ...state, ledgerAccounts: action.payload, isLoading: false };
    case 'SET_LEDGER_ENTRIES':
      return { ...state, ledgerEntries: action.payload, isLoading: false };
    case 'SET_LEDGER_CATEGORIES':
      return { ...state, ledgerCategories: action.payload, isLoading: false };
    case 'SET_DAYBOOK':
      return { ...state, daybook: action.payload, isLoading: false };
    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload, isLoading: false };
    case 'SET_REPORTS':
      return { ...state, reports: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}

export function MuttonStallProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useUserContext();
  const platform = usePlatformAccess();

  const getAuth = useCallback(() => {
    const token = user?.results?.token || localStorage.getItem('token');
    const membershipId = platform?.activeContext?.parentMembershipId
      || user?.results?.userAccounts?.[0]?.parent_membership_id
      || localStorage.getItem('ms_parent_membership_id');
    if (membershipId) {
      try {
        localStorage.setItem('ms_parent_membership_id', String(membershipId));
      } catch {
        // ignore storage errors
      }
    }
    return { token, membershipId };
  }, [user, platform?.activeContext?.parentMembershipId]);

  const authHeaders = useCallback((token) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), []);

  const api = useCallback(async (path, options = {}) => {
    const { token, membershipId } = getAuth();
    if (!token) return { success: false, error: 'Not authenticated' };
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...authHeaders(token), ...(options.headers || {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      return { success: false, error: data.message || data.error || 'Request failed', data };
    }
    return { success: true, data: data.results ?? data.data ?? data, membershipId, message: data.message };
  }, [getAuth, authHeaders]);

  const withMembership = useCallback((payload = {}) => {
    const { membershipId } = getAuth();
    return { ...payload, parentMembershipId: membershipId };
  }, [getAuth]);

  const membershipQuery = useCallback(() => {
    const { membershipId } = getAuth();
    return `parent_membership_id=${membershipId}`;
  }, [getAuth]);

  const fetchStall = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await api(`/ms/stall?${membershipQuery()}`);
    if (result.success) {
      const stall = Array.isArray(result.data) ? result.data[0] : result.data;
      dispatch({ type: 'SET_STALL', payload: stall || null });
    } else dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api, membershipQuery]);

  const saveStall = useCallback(async (payload) => {
    const result = await api('/ms/stall', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchStall();
    return result;
  }, [api, withMembership, fetchStall]);

  const fetchCategories = useCallback(async () => {
    const result = await api(`/ms/categories?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_CATEGORIES', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createCategory = useCallback(async (payload) => {
    const result = await api('/ms/categories', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchCategories();
    return result;
  }, [api, withMembership, fetchCategories]);

  const fetchProducts = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await api(`/ms/products?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_PRODUCTS', payload: result.data || [] });
    else dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api, membershipQuery]);

  const createProduct = useCallback(async (payload) => {
    const result = await api('/ms/products', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchProducts();
    return result;
  }, [api, withMembership, fetchProducts]);

  const updateProduct = useCallback(async (id, payload) => {
    const result = await api(`/ms/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchProducts();
    return result;
  }, [api, fetchProducts]);

  const createStockMovement = useCallback(async (payload) => {
    const result = await api('/ms/stock/movements', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchProducts();
    return result;
  }, [api, withMembership, fetchProducts]);

  const fetchCustomers = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await api(`/ms/customers?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_CUSTOMERS', payload: result.data || [] });
    else dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api, membershipQuery]);

  const createCustomer = useCallback(async (payload) => {
    const result = await api('/ms/customers', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchCustomers();
    return result;
  }, [api, withMembership, fetchCustomers]);

  const fetchOrders = useCallback(async (params = {}) => {
    const q = new URLSearchParams({ parent_membership_id: getAuth().membershipId || '' });
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') q.set(key, value);
    });
    const result = await api(`/ms/orders?${q}`);
    if (result.success) dispatch({ type: 'SET_ORDERS', payload: result.data || [] });
    return result;
  }, [api, getAuth]);

  const createOrder = useCallback(async (payload) => {
    const result = await api('/ms/orders', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchOrders();
    return result;
  }, [api, withMembership, fetchOrders]);

  const updateOrderStatus = useCallback(async (id, status, extra = {}) => (
    api(`/ms/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra }),
    })
  ), [api]);

  const cancelOrder = useCallback(async (id) => (
    api(`/ms/orders/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) })
  ), [api]);

  const fetchBills = useCallback(async (params = {}) => {
    const q = new URLSearchParams({ parent_membership_id: getAuth().membershipId || '' });
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') q.set(key, value);
    });
    const result = await api(`/ms/bills?${q}`);
    if (result.success) dispatch({ type: 'SET_BILLS', payload: result.data || [] });
    return result;
  }, [api, getAuth]);

  const createBill = useCallback(async (payload) => {
    const result = await api('/ms/bills', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchBills();
    return result;
  }, [api, withMembership, fetchBills]);

  const fetchLedgerAccounts = useCallback(async () => {
    const result = await api(`/ms/ledger/accounts?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_LEDGER_ACCOUNTS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createLedgerAccount = useCallback(async (payload) => {
    const result = await api('/ms/ledger/accounts', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchLedgerAccounts();
    return result;
  }, [api, withMembership, fetchLedgerAccounts]);

  const fetchLedgerEntries = useCallback(async (filters = {}) => {
    const q = new URLSearchParams({ parent_membership_id: getAuth().membershipId || '' });
    Object.entries(filters).forEach(([key, value]) => {
      if (value != null && value !== '') q.set(key, value);
    });
    const result = await api(`/ms/ledger/entries?${q}`);
    if (result.success) {
      const payload = result.data;
      const entries = Array.isArray(payload) ? payload : (payload?.entries || []);
      dispatch({ type: 'SET_LEDGER_ENTRIES', payload: entries });
      return { ...result, data: entries, totals: payload?.totals || null };
    }
    return result;
  }, [api, getAuth]);

  const createLedgerEntry = useCallback(async (payload) => {
    const result = await api('/ms/ledger/entries', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) {
      await fetchLedgerAccounts();
      await fetchLedgerEntries();
    }
    return result;
  }, [api, withMembership, fetchLedgerAccounts, fetchLedgerEntries]);

  const fetchLedgerCategories = useCallback(async () => {
    const result = await api(`/ms/ledger/categories?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_LEDGER_CATEGORIES', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createLedgerCategory = useCallback(async (payload) => {
    const result = await api('/ms/ledger/categories', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchLedgerCategories();
    return result;
  }, [api, withMembership, fetchLedgerCategories]);

  const deleteLedgerCategory = useCallback(async (id) => {
    const result = await api(`/ms/ledger/categories/${id}?${membershipQuery()}`, {
      method: 'DELETE',
    });
    if (result.success) await fetchLedgerCategories();
    return result;
  }, [api, membershipQuery, fetchLedgerCategories]);

  const fetchDaybook = useCallback(async (bookDate, forceRecalculate = false) => {
    const q = new URLSearchParams({
      parent_membership_id: getAuth().membershipId || '',
      book_date: bookDate,
    });
    if (forceRecalculate) q.set('force_recalculate', 'true');
    const result = await api(`/ms/daybook?${q}`);
    if (result.success) dispatch({ type: 'SET_DAYBOOK', payload: result.data });
    return result;
  }, [api, getAuth]);

  const saveDaybook = useCallback(async (payload) => {
    const result = await api('/ms/daybook', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchDaybook(payload.bookDate || payload.book_date, true);
    return result;
  }, [api, withMembership, fetchDaybook]);

  const fetchDashboard = useCallback(async () => {
    const result = await api(`/ms/dashboard?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_DASHBOARD', payload: result.data });
    return result;
  }, [api, membershipQuery]);

  const fetchReports = useCallback(async (params = {}) => {
    const q = new URLSearchParams({ parent_membership_id: getAuth().membershipId || '' });
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') q.set(key, value);
    });
    const result = await api(`/ms/reports?${q}`);
    if (result.success) dispatch({ type: 'SET_REPORTS', payload: result.data });
    return result;
  }, [api, getAuth]);

  const value = {
    ...state,
    membershipId: getAuth().membershipId,
    fetchStall,
    saveStall,
    fetchCategories,
    createCategory,
    fetchProducts,
    createProduct,
    updateProduct,
    createStockMovement,
    fetchCustomers,
    createCustomer,
    fetchOrders,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    fetchBills,
    createBill,
    fetchLedgerAccounts,
    createLedgerAccount,
    fetchLedgerEntries,
    createLedgerEntry,
    fetchLedgerCategories,
    createLedgerCategory,
    deleteLedgerCategory,
    fetchDaybook,
    saveDaybook,
    fetchDashboard,
    fetchReports,
    api,
  };

  return (
    <MuttonStallContext.Provider value={value}>
      {children}
    </MuttonStallContext.Provider>
  );
}

export const useMuttonStall = () => useContext(MuttonStallContext);
