import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../user_context';
import { usePlatformAccess } from '../platformAccess_context';

const HostelManagementContext = createContext();

const initialState = {
  hostels: [],
  floors: [],
  rooms: [],
  residents: [],
  receivables: [],
  duesDeck: [],
  duesSummary: null,
  duesPeriodLabel: null,
  unpaidDetails: [],
  ledgerAccounts: [],
  ledgerEntries: [],
  paymentSubmissions: [],
  foodReport: [],
  orgFoodReport: null,
  specialOrders: [],
  dashboard: null,
  selectedHostelId: null,
  isLoading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_HOSTELS':
      return { ...state, hostels: action.payload, isLoading: false };
    case 'SET_SELECTED_HOSTEL':
      return { ...state, selectedHostelId: action.payload };
    case 'SET_FLOORS':
      return { ...state, floors: action.payload, isLoading: false };
    case 'SET_ROOMS':
      return { ...state, rooms: action.payload, isLoading: false };
    case 'SET_RESIDENTS':
      return { ...state, residents: action.payload, isLoading: false };
    case 'SET_RECEIVABLES':
      return { ...state, receivables: action.payload, isLoading: false };
    case 'SET_DUES_DECK':
      return {
        ...state,
        duesDeck: action.payload?.floors || (Array.isArray(action.payload) ? action.payload : []),
        duesSummary: action.payload?.summary || null,
        duesPeriodLabel: action.payload?.period_label || null,
        unpaidDetails: action.payload?.unpaid_details || [],
        isLoading: false,
      };
    case 'SET_LEDGER_ACCOUNTS':
      return { ...state, ledgerAccounts: action.payload, isLoading: false };
    case 'SET_LEDGER_ENTRIES':
      return { ...state, ledgerEntries: action.payload, isLoading: false };
    case 'SET_PAYMENT_SUBMISSIONS':
      return { ...state, paymentSubmissions: action.payload, isLoading: false };
    case 'SET_FOOD_REPORT':
      return { ...state, foodReport: action.payload, isLoading: false };
    case 'SET_ORG_FOOD_REPORT':
      return { ...state, orgFoodReport: action.payload, isLoading: false };
    case 'SET_SPECIAL_ORDERS':
      return { ...state, specialOrders: action.payload, isLoading: false };
    case 'SET_DASHBOARD':
      return { ...state, dashboard: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}

export function HostelManagementProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useUserContext();
  const platform = usePlatformAccess();

  const getAuth = useCallback(() => {
    const token = user?.results?.token;
    const membershipId = platform?.activeContext?.parentMembershipId
      || user?.results?.userAccounts?.[0]?.parent_membership_id;
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
    if (data.error) return { success: false, error: data.message || 'Request failed', data };
    return { success: true, data: data.results ?? data.data ?? data, membershipId, message: data.message };
  }, [getAuth, authHeaders]);

  const setSelectedHostelId = (id) => dispatch({ type: 'SET_SELECTED_HOSTEL', payload: id });

  const fetchHostels = useCallback(async () => {
    const { membershipId } = getAuth();
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await api(`/hm/hostels?parent_membership_id=${membershipId}`);
    if (result.success) {
      dispatch({ type: 'SET_HOSTELS', payload: result.data || [] });
      if (!state.selectedHostelId && result.data?.[0]?.id) {
        dispatch({ type: 'SET_SELECTED_HOSTEL', payload: result.data[0].id });
      }
    } else dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api, getAuth, state.selectedHostelId]);

  const createHostel = useCallback(async (payload) => {
    const { membershipId } = getAuth();
    const result = await api('/hm/hostels', {
      method: 'POST',
      body: JSON.stringify({ ...payload, parentMembershipId: membershipId }),
    });
    if (result.success) await fetchHostels();
    return result;
  }, [api, getAuth, fetchHostels]);

  const updateHostel = useCallback(async (id, payload) => {
    const result = await api(`/hm/hostels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchHostels();
    return result;
  }, [api, fetchHostels]);

  const fetchFloors = useCallback(async (hostelId) => {
    if (!hostelId) return { success: false };
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await api(`/hm/floors?hostel_id=${hostelId}`);
    if (result.success) dispatch({ type: 'SET_FLOORS', payload: result.data || [] });
    else dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api]);

  const createFloor = useCallback(async (payload) => {
    const result = await api('/hm/floors', { method: 'POST', body: JSON.stringify(payload) });
    if (result.success && payload.hostelId) await fetchFloors(payload.hostelId);
    return result;
  }, [api, fetchFloors]);

  const deleteFloor = useCallback(async (id, hostelId) => {
    const result = await api(`/hm/floors/${id}`, { method: 'DELETE' });
    if (result.success && hostelId) await fetchFloors(hostelId);
    return result;
  }, [api, fetchFloors]);

  const fetchRooms = useCallback(async (hostelId, floorId) => {
    const q = new URLSearchParams();
    if (hostelId) q.set('hostel_id', hostelId);
    if (floorId) q.set('floor_id', floorId);
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await api(`/hm/rooms?${q}`);
    if (result.success) dispatch({ type: 'SET_ROOMS', payload: result.data || [] });
    else dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api]);

  const createRoom = useCallback(async (payload) => {
    const result = await api('/hm/rooms', { method: 'POST', body: JSON.stringify(payload) });
    if (result.success && payload.hostelId) await fetchRooms(payload.hostelId);
    return result;
  }, [api, fetchRooms]);

  const deleteRoom = useCallback(async (id, hostelId) => {
    const result = await api(`/hm/rooms/${id}`, { method: 'DELETE' });
    if (result.success && hostelId) await fetchRooms(hostelId);
    return result;
  }, [api, fetchRooms]);

  const fetchResidents = useCallback(async (hostelId) => {
    const { membershipId } = getAuth();
    const q = new URLSearchParams({ parent_membership_id: membershipId });
    if (hostelId) q.set('hostel_id', hostelId);
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await api(`/hm/residents?${q}`);
    if (result.success) dispatch({ type: 'SET_RESIDENTS', payload: result.data || [] });
    else dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api, getAuth]);

  const createResident = useCallback(async (payload) => {
    const { membershipId } = getAuth();
    const result = await api('/hm/residents', {
      method: 'POST',
      body: JSON.stringify({ ...payload, parentMembershipId: membershipId }),
    });
    if (result.success) await fetchResidents(payload.hostelId);
    return result;
  }, [api, getAuth, fetchResidents]);

  const checkoutResident = useCallback(async (id, hostelId, payload = {}) => {
    const result = await api(`/hm/residents/${id}/checkout`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchResidents(hostelId);
    return result;
  }, [api, fetchResidents]);

  const assignResidentBed = useCallback(async (id, bedId, hostelId) => {
    const result = await api(`/hm/residents/${id}/assign-bed`, {
      method: 'POST',
      body: JSON.stringify({ bedId }),
    });
    if (result.success && hostelId) {
      await fetchResidents(hostelId);
      await fetchRooms(hostelId);
    }
    return result;
  }, [api, fetchResidents, fetchRooms]);

  const checkoutPreview = useCallback(async (id) => (
    api(`/hm/residents/${id}/checkout-preview`)
  ), [api]);

  const generateReceivables = useCallback(async (payload) => {
    const { membershipId } = getAuth();
    return api('/hm/receivables/generate', {
      method: 'POST',
      body: JSON.stringify({ ...payload, parentMembershipId: membershipId }),
    });
  }, [api, getAuth]);

  const createAdhocReceivable = useCallback(async (payload) => {
    const { membershipId } = getAuth();
    return api('/hm/receivables/adhoc', {
      method: 'POST',
      body: JSON.stringify({ ...payload, parentMembershipId: membershipId }),
    });
  }, [api, getAuth]);

  const fetchReceivables = useCallback(async (hostelId, opts = {}) => {
    const { membershipId } = getAuth();
    const q = new URLSearchParams({ parent_membership_id: membershipId });
    if (hostelId) q.set('hostel_id', hostelId);
    if (opts.month) q.set('month', opts.month);
    if (opts.outstandingOnly) q.set('outstanding_only', '1');
    if (opts.status) q.set('status', opts.status);
    if (opts.residentId) q.set('resident_id', opts.residentId);
    // Skip global loading flag when fetching for a specific resident (bed history)
    if (!opts.residentId) dispatch({ type: 'SET_LOADING', payload: true });
    const result = await api(`/hm/receivables?${q}`);
    if (result.success) {
      const payload = result.data;
      const rows = Array.isArray(payload) ? payload : (payload?.rows || []);
      if (!opts.residentId) dispatch({ type: 'SET_RECEIVABLES', payload: rows });
      return { ...result, data: rows, summary: payload?.summary || null };
    }
    dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api, getAuth]);

  const fetchDuesDeck = useCallback(async (hostelId, period = 'all') => {
    const { membershipId } = getAuth();
    dispatch({ type: 'SET_LOADING', payload: true });
    const q = new URLSearchParams({
      hostel_id: hostelId,
      parent_membership_id: membershipId,
      period,
    });
    const result = await api(`/hm/dues-deck?${q}`);
    if (result.success) dispatch({ type: 'SET_DUES_DECK', payload: result.data || [] });
    else dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api, getAuth]);

  const recordPayment = useCallback(async (payload) => {
    return api('/hm/payments', { method: 'POST', body: JSON.stringify(payload) });
  }, [api]);

  const fetchPaymentSubmissions = useCallback(async (hostelId) => {
    const q = hostelId ? `?hostel_id=${hostelId}&status=PENDING` : '?status=PENDING';
    const result = await api(`/hm/payment-submissions${q}`);
    if (result.success) dispatch({ type: 'SET_PAYMENT_SUBMISSIONS', payload: result.data || [] });
    return result;
  }, [api]);

  const confirmPaymentSubmission = useCallback(async (id, payload) => {
    return api(`/hm/payment-submissions/${id}/confirm`, { method: 'POST', body: JSON.stringify(payload || {}) });
  }, [api]);

  const rejectPaymentSubmission = useCallback(async (id, rejectReason) => {
    return api(`/hm/payment-submissions/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectReason }),
    });
  }, [api]);

  const fetchLedgerAccounts = useCallback(async () => {
    const { membershipId } = getAuth();
    const result = await api(`/hm/ledger/accounts?parent_membership_id=${membershipId}`);
    if (result.success) dispatch({ type: 'SET_LEDGER_ACCOUNTS', payload: result.data || [] });
    return result;
  }, [api, getAuth]);

  const createLedgerAccount = useCallback(async (payload) => {
    const { membershipId } = getAuth();
    const result = await api('/hm/ledger/accounts', {
      method: 'POST',
      body: JSON.stringify({ ...payload, parentMembershipId: membershipId }),
    });
    if (result.success) await fetchLedgerAccounts();
    return result;
  }, [api, getAuth, fetchLedgerAccounts]);

  const fetchLedgerEntries = useCallback(async () => {
    const { membershipId } = getAuth();
    const result = await api(`/hm/ledger/entries?parent_membership_id=${membershipId}`);
    if (result.success) dispatch({ type: 'SET_LEDGER_ENTRIES', payload: result.data || [] });
    return result;
  }, [api, getAuth]);

  const fetchFoodReport = useCallback(async (hostelId, startDate, endDate) => {
    const q = new URLSearchParams({ hostel_id: hostelId, start_date: startDate });
    if (endDate) q.set('end_date', endDate);
    const result = await api(`/hm/meals/report?${q}`);
    if (result.success) dispatch({ type: 'SET_FOOD_REPORT', payload: result.data || [] });
    return result;
  }, [api]);

  const fetchOrgFoodReport = useCallback(async (parentMembershipId, startDate, endDate) => {
    const q = new URLSearchParams({
      parent_membership_id: parentMembershipId,
      start_date: startDate,
    });
    if (endDate) q.set('end_date', endDate);
    const result = await api(`/hm/meals/report/org?${q}`);
    if (result.success) dispatch({ type: 'SET_ORG_FOOD_REPORT', payload: result.data || null });
    return result;
  }, [api]);

  const fetchSpecialOrders = useCallback(async (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') q.set(key, value);
    });
    const result = await api(`/hm/special-orders?${q}`);
    if (result.success) dispatch({ type: 'SET_SPECIAL_ORDERS', payload: result.data || [] });
    return result;
  }, [api]);

  const createSpecialOrder = useCallback(async (payload) => (
    api('/hm/special-orders', { method: 'POST', body: JSON.stringify(payload) })
  ), [api]);

  const mySpecialOrders = useCallback(async () => (
    api('/hm/special-orders/mine')
  ), [api]);

  const updateSpecialOrderStatus = useCallback(async (id, status) => (
    api(`/hm/special-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  ), [api]);

  const upsertWeekMeals = useCallback(async (payload) => {
    return api('/hm/meals/week', { method: 'POST', body: JSON.stringify(payload) });
  }, [api]);

  const getWeekMeals = useCallback(async (residentId, startDate) => {
    return api(`/hm/meals/week?resident_id=${residentId}&start_date=${startDate}`);
  }, [api]);

  const fetchMealMenu = useCallback(async (parentMembershipId) => {
    const mid = parentMembershipId || getAuth()?.membershipId;
    if (!mid) return { success: false, error: 'Membership ID not found' };
    return api(`/hm/meal-menu?parent_membership_id=${mid}`);
  }, [api, getAuth]);

  const createMealCategory = useCallback((payload) => (
    api('/hm/meal-menu/categories', { method: 'POST', body: JSON.stringify(payload) })
  ), [api]);

  const updateMealCategory = useCallback((id, payload) => (
    api(`/hm/meal-menu/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  ), [api]);

  const deleteMealCategory = useCallback((id) => (
    api(`/hm/meal-menu/categories/${id}`, { method: 'DELETE' })
  ), [api]);

  const createMealItem = useCallback((payload) => (
    api('/hm/meal-menu/items', { method: 'POST', body: JSON.stringify(payload) })
  ), [api]);

  const updateMealItem = useCallback((id, payload) => (
    api(`/hm/meal-menu/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  ), [api]);

  const deleteMealItem = useCallback((id) => (
    api(`/hm/meal-menu/items/${id}`, { method: 'DELETE' })
  ), [api]);

  const fetchDashboard = useCallback(async () => {
    const { membershipId } = getAuth();
    const result = await api(`/hm/dashboard?parent_membership_id=${membershipId}`);
    if (result.success) dispatch({ type: 'SET_DASHBOARD', payload: result.data });
    return result;
  }, [api, getAuth]);

  const myResidentProfile = useCallback(async () => api('/hm/resident/me'), [api]);
  const myReceivables = useCallback(async (residentId) => api(`/hm/resident/receivables?resident_id=${residentId}`), [api]);
  const submitPayment = useCallback(async (payload) => api('/hm/payment-submissions', { method: 'POST', body: JSON.stringify(payload) }), [api]);
  const getReceipt = useCallback(async (id) => api(`/hm/receipts/${id}`), [api]);

  const fetchNearbyShops = useCallback(async (hostelId) => {
    if (!hostelId) return { success: false, data: [] };
    const result = await api(`/hm/nearby-shops?hostel_id=${hostelId}`);
    const rows = Array.isArray(result.data) ? result.data : [];
    return { ...result, data: rows };
  }, [api]);

  const createNearbyShop = useCallback(async (payload) => (
    api('/hm/nearby-shops', { method: 'POST', body: JSON.stringify(payload) })
  ), [api]);

  const deleteNearbyShop = useCallback(async (id) => (
    api(`/hm/nearby-shops/${id}`, { method: 'DELETE' })
  ), [api]);

  const fetchVenues = useCallback(async ({ venueType, hostelId, membershipScoped = true } = {}) => {
    const { membershipId } = getAuth();
    const q = new URLSearchParams();
    if (membershipScoped && membershipId) q.set('parent_membership_id', membershipId);
    if (hostelId) q.set('hostel_id', hostelId);
    if (venueType) q.set('venue_type', venueType);
    const result = await api(`/hm/venues?${q}`);
    const rows = Array.isArray(result.data) ? result.data : [];
    return { ...result, data: rows };
  }, [api, getAuth]);

  const createVenue = useCallback(async (payload) => {
    const { membershipId } = getAuth();
    const result = await api('/hm/venues', {
      method: 'POST',
      body: JSON.stringify({ ...payload, parentMembershipId: membershipId }),
    });
    return result;
  }, [api, getAuth]);

  const updateVenue = useCallback(async (id, payload) => (
    api(`/hm/venues/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  ), [api]);

  const deleteVenue = useCallback(async (id) => (
    api(`/hm/venues/${id}`, { method: 'DELETE' })
  ), [api]);

  const value = {
    ...state,
    setSelectedHostelId,
    fetchHostels,
    createHostel,
    updateHostel,
    fetchFloors,
    createFloor,
    deleteFloor,
    fetchRooms,
    createRoom,
    deleteRoom,
    fetchResidents,
    createResident,
    checkoutResident,
    assignResidentBed,
    checkoutPreview,
    generateReceivables,
    createAdhocReceivable,
    fetchReceivables,
    fetchDuesDeck,
    recordPayment,
    fetchPaymentSubmissions,
    confirmPaymentSubmission,
    rejectPaymentSubmission,
    fetchLedgerAccounts,
    createLedgerAccount,
    fetchLedgerEntries,
    fetchFoodReport,
    fetchOrgFoodReport,
    fetchSpecialOrders,
    createSpecialOrder,
    mySpecialOrders,
    updateSpecialOrderStatus,
    upsertWeekMeals,
    getWeekMeals,
    fetchMealMenu,
    createMealCategory,
    updateMealCategory,
    deleteMealCategory,
    createMealItem,
    updateMealItem,
    deleteMealItem,
    fetchDashboard,
    myResidentProfile,
    myReceivables,
    submitPayment,
    getReceipt,
    fetchNearbyShops,
    createNearbyShop,
    deleteNearbyShop,
    fetchVenues,
    createVenue,
    updateVenue,
    deleteVenue,
    membershipId: getAuth().membershipId,
  };

  return (
    <HostelManagementContext.Provider value={value}>
      {children}
    </HostelManagementContext.Provider>
  );
}

export const useHostelManagement = () => useContext(HostelManagementContext);
