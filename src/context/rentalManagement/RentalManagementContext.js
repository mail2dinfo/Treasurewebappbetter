import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../user_context';

const RentalManagementContext = createContext();

const initialState = {
  companies: [],
  tenants: [],
  properties: [],
  agreements: [],
  rentDues: [],
  dashboard: null,
  isLoading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_COMPANIES':
      return { ...state, companies: action.payload, isLoading: false };
    case 'SET_TENANTS':
      return { ...state, tenants: action.payload, isLoading: false };
    case 'SET_PROPERTIES':
      return { ...state, properties: action.payload, isLoading: false };
    case 'SET_AGREEMENTS':
      return { ...state, agreements: action.payload, isLoading: false };
    case 'SET_RENT_DUES':
      return { ...state, rentDues: action.payload, isLoading: false };
    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export function RentalManagementProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useUserContext();

  const getAuth = useCallback(() => {
    const token = user?.results?.token;
    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
    return { token, membershipId };
  }, [user]);

  const authHeaders = useCallback((token) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), []);

  const fetchCompanies = useCallback(async () => {
    const { token, membershipId } = getAuth();
    if (!token || !membershipId) return { success: false };
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(
        `${API_BASE_URL}/rm/companies?parent_membership_id=${membershipId}`,
        { headers: authHeaders(token) }
      );
      const data = await res.json();
      if (!data.error) {
        dispatch({ type: 'SET_COMPANIES', payload: data.results || data.data || [] });
        return { success: true };
      }
      dispatch({ type: 'SET_ERROR', payload: data.message || 'Failed to load companies' });
      return { success: false };
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
      return { success: false };
    }
  }, [getAuth, authHeaders]);

  const createCompany = useCallback(async (payload) => {
    const { token, membershipId } = getAuth();
    if (!token || !membershipId) return { success: false, error: 'Not authenticated' };
    const res = await fetch(`${API_BASE_URL}/rm/companies`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ...payload, membershipId }),
    });
    const data = await res.json();
    if (!data.error) {
      await fetchCompanies();
      return { success: true, data: data.results || data.data };
    }
    return { success: false, error: data.message || 'Failed' };
  }, [getAuth, authHeaders, fetchCompanies]);

  const fetchTenants = useCallback(async () => {
    const { token, membershipId } = getAuth();
    if (!token || !membershipId) return { success: false };
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(
        `${API_BASE_URL}/rm/subscribers?parent_membership_id=${membershipId}`,
        { headers: authHeaders(token) }
      );
      const data = await res.json();
      if (!data.error) {
        dispatch({ type: 'SET_TENANTS', payload: data.results || data.data || [] });
        return { success: true };
      }
      dispatch({ type: 'SET_ERROR', payload: data.message || 'Failed to load tenants' });
      return { success: false };
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
      return { success: false };
    }
  }, [getAuth, authHeaders]);

  const createTenant = useCallback(async (payload) => {
    const { token, membershipId } = getAuth();
    if (!token || !membershipId) return { success: false, error: 'Not authenticated' };
    const res = await fetch(`${API_BASE_URL}/rm/subscribers`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ...payload, membershipId }),
    });
    const data = await res.json();
    if (!data.error) {
      await fetchTenants();
      return { success: true, data: data.results || data.data, message: data.message };
    }
    return { success: false, error: data.message || 'Failed' };
  }, [getAuth, authHeaders, fetchTenants]);

  const fetchProperties = useCallback(async () => {
    const { token, membershipId } = getAuth();
    if (!token || !membershipId) return { success: false };
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(
        `${API_BASE_URL}/rm/properties?parent_membership_id=${membershipId}`,
        { headers: authHeaders(token) }
      );
      const data = await res.json();
      if (!data.error) {
        dispatch({ type: 'SET_PROPERTIES', payload: data.results || data.data || [] });
        return { success: true };
      }
      dispatch({ type: 'SET_ERROR', payload: data.message || 'Failed to load properties' });
      return { success: false };
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
      return { success: false };
    }
  }, [getAuth, authHeaders]);

  const createProperty = useCallback(async (payload) => {
    const { token, membershipId } = getAuth();
    if (!token || !membershipId) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${API_BASE_URL}/rm/properties`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ ...payload, membershipId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        return { success: false, error: data.message || `Failed to create property (${res.status})` };
      }
      await fetchProperties();
      return { success: true, data: data.results || data.data };
    } catch (e) {
      return { success: false, error: e.message || 'Failed to create property' };
    }
  }, [getAuth, authHeaders, fetchProperties]);

  const fetchAgreements = useCallback(async () => {
    const { token, membershipId } = getAuth();
    if (!token || !membershipId) return { success: false };
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(
        `${API_BASE_URL}/rm/agreements?parent_membership_id=${membershipId}`,
        { headers: authHeaders(token) }
      );
      const data = await res.json();
      if (!data.error) {
        dispatch({ type: 'SET_AGREEMENTS', payload: data.results || data.data || [] });
        return { success: true };
      }
      dispatch({ type: 'SET_ERROR', payload: data.message || 'Failed to load agreements' });
      return { success: false };
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
      return { success: false };
    }
  }, [getAuth, authHeaders]);

  const createAgreement = useCallback(async (payload) => {
    const { token, membershipId } = getAuth();
    if (!token || !membershipId) return { success: false, error: 'Not authenticated' };
    const res = await fetch(`${API_BASE_URL}/rm/agreements`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ ...payload, membershipId }),
    });
    const data = await res.json();
    if (!data.error) {
      await fetchAgreements();
      return { success: true, data: data.results || data.data };
    }
    return { success: false, error: data.message || 'Failed' };
  }, [getAuth, authHeaders, fetchAgreements]);

  const agreementAction = useCallback(async (id, path, method = 'POST', body) => {
    const { token } = getAuth();
    if (!token) return { success: false, error: 'Not authenticated' };
    const res = await fetch(`${API_BASE_URL}/rm/agreements/${id}${path}`, {
      method,
      headers: authHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!data.error) {
      await fetchAgreements();
      return { success: true, data: data.results || data.data, message: data.message };
    }
    return { success: false, error: data.message || 'Failed' };
  }, [getAuth, authHeaders, fetchAgreements]);

  const fetchRentDues = useCallback(async () => {
    const { token, membershipId } = getAuth();
    if (!token || !membershipId) return { success: false };
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(
        `${API_BASE_URL}/rm/rent-dues?parent_membership_id=${membershipId}`,
        { headers: authHeaders(token) }
      );
      const data = await res.json();
      if (!data.error) {
        dispatch({ type: 'SET_RENT_DUES', payload: data.results || data.data || [] });
        return { success: true };
      }
      dispatch({ type: 'SET_ERROR', payload: data.message || 'Failed to load rent dues' });
      return { success: false };
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
      return { success: false };
    }
  }, [getAuth, authHeaders]);

  const fetchDashboard = useCallback(async () => {
    const { token, membershipId } = getAuth();
    if (!token || !membershipId) return { success: false };
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const res = await fetch(
        `${API_BASE_URL}/rm/dashboard?parent_membership_id=${membershipId}`,
        { headers: authHeaders(token) }
      );
      const data = await res.json();
      if (!data.error) {
        dispatch({ type: 'SET_DASHBOARD', payload: data.results || data.data || null });
        return { success: true };
      }
      dispatch({ type: 'SET_ERROR', payload: data.message || 'Failed to load dashboard' });
      return { success: false };
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message });
      return { success: false };
    }
  }, [getAuth, authHeaders]);

  const markRentPaid = useCallback(async (id, paymentNote) => {
    const { token } = getAuth();
    if (!token) return { success: false, error: 'Not authenticated' };
    const res = await fetch(`${API_BASE_URL}/rm/rent-dues/${id}/mark-paid`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ paymentNote }),
    });
    const data = await res.json();
    if (!data.error) {
      await Promise.all([fetchRentDues(), fetchDashboard()]);
      return { success: true };
    }
    return { success: false, error: data.message || 'Failed' };
  }, [getAuth, authHeaders, fetchRentDues, fetchDashboard]);

  const prepareCompleteAgreement = useCallback(async (payload) => {
    const { token, membershipId } = getAuth();
    if (!token || !membershipId) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${API_BASE_URL}/rm/agreements/prepare-complete`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ ...payload, membershipId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        return { success: false, error: data.message || 'Failed to complete agreement' };
      }
      await Promise.all([fetchAgreements(), fetchProperties(), fetchRentDues(), fetchDashboard()]);
      return { success: true, data: data.results, message: data.message };
    } catch (e) {
      return { success: false, error: e.message || 'Failed' };
    }
  }, [getAuth, authHeaders, fetchAgreements, fetchProperties, fetchRentDues, fetchDashboard]);

  const closeAgreement = useCallback(async (id, body = {}) => {
    const { token } = getAuth();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${API_BASE_URL}/rm/agreements/${id}/close`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        return { success: false, error: data.message || 'Failed to close agreement' };
      }
      await Promise.all([fetchDashboard(), fetchAgreements(), fetchRentDues(), fetchProperties()]);
      return { success: true, data: data.results || data.data, message: data.message };
    } catch (e) {
      return { success: false, error: e.message || 'Failed' };
    }
  }, [getAuth, authHeaders, fetchDashboard, fetchAgreements, fetchRentDues, fetchProperties]);

  const activateAgreement = useCallback(async (id) => {
    const { token } = getAuth();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${API_BASE_URL}/rm/agreements/${id}/activate`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        return { success: false, error: data.message || 'Failed to activate agreement' };
      }
      await Promise.all([fetchDashboard(), fetchAgreements(), fetchRentDues(), fetchProperties()]);
      return { success: true, data: data.results || data.data, message: data.message };
    } catch (e) {
      return { success: false, error: e.message || 'Failed' };
    }
  }, [getAuth, authHeaders, fetchDashboard, fetchAgreements, fetchRentDues, fetchProperties]);

  const updateAgreement = useCallback(async (id, body = {}) => {
    const { token } = getAuth();
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const res = await fetch(`${API_BASE_URL}/rm/agreements/${id}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        return { success: false, error: data.message || 'Failed to update agreement' };
      }
      await Promise.all([fetchDashboard(), fetchAgreements()]);
      return { success: true, data: data.results || data.data, message: data.message };
    } catch (e) {
      return { success: false, error: e.message || 'Failed' };
    }
  }, [getAuth, authHeaders, fetchDashboard, fetchAgreements]);

  const value = {
    ...state,
    fetchCompanies,
    createCompany,
    fetchTenants,
    createTenant,
    fetchProperties,
    createProperty,
    fetchAgreements,
    createAgreement,
    prepareCompleteAgreement,
    closeAgreement,
    activateAgreement,
    updateAgreement,
    agreementAction,
    fetchRentDues,
    markRentPaid,
    fetchDashboard,
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
  };

  return (
    <RentalManagementContext.Provider value={value}>
      {children}
    </RentalManagementContext.Provider>
  );
}

export function useRentalManagementContext() {
  const ctx = useContext(RentalManagementContext);
  if (!ctx) {
    throw new Error('useRentalManagementContext must be used within RentalManagementProvider');
  }
  return ctx;
}
