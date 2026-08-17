import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../user_context';
import { usePlatformAccess } from '../platformAccess_context';

const HospitalManagementContext = createContext();

const initialState = {
  hospital: null,
  doctors: [],
  patients: [],
  appointments: [],
  wards: [],
  beds: [],
  admissions: [],
  receivables: [],
  medicines: [],
  pharmacySales: [],
  lowStockMedicines: [],
  pharmacySuppliers: [],
  pharmacyPurchases: [],
  pharmacyBills: [],
  pharmacyReturns: [],
  expiryAlerts: [],
  ledgerAccounts: [],
  ledgerEntries: [],
  ledgerCategories: [],
  daybook: null,
  dashboard: null,
  consultations: [],
  selectedConsultation: null,
  consultationVitals: [],
  consultationPrescriptions: [],
  emrHistory: [],
  labTests: [],
  labOrders: [],
  selectedLabOrder: null,
  bloodDonors: [],
  bloodUnits: [],
  bloodRequests: [],
  bloodIssues: [],
  bloodStock: null,
  bloodAlerts: [],
  inventoryItems: [],
  inventoryTransactions: [],
  inventoryAlerts: [],
  insurers: [],
  insuranceClaims: [],
  cashReport: null,
  reportsOverview: null,
  packages: [],
  templates: [],
  notificationSettings: null,
  patientPortalSummary: null,
  isLoading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_HOSPITAL':
      return { ...state, hospital: action.payload, isLoading: false };
    case 'SET_DOCTORS':
      return { ...state, doctors: action.payload, isLoading: false };
    case 'SET_PATIENTS':
      return { ...state, patients: action.payload, isLoading: false };
    case 'SET_APPOINTMENTS':
      return { ...state, appointments: action.payload, isLoading: false };
    case 'SET_WARDS':
      return { ...state, wards: action.payload, isLoading: false };
    case 'SET_BEDS':
      return { ...state, beds: action.payload, isLoading: false };
    case 'SET_ADMISSIONS':
      return { ...state, admissions: action.payload, isLoading: false };
    case 'SET_RECEIVABLES':
      return { ...state, receivables: action.payload, isLoading: false };
    case 'SET_MEDICINES':
      return { ...state, medicines: action.payload, isLoading: false };
    case 'SET_PHARMACY_SALES':
      return { ...state, pharmacySales: action.payload, isLoading: false };
    case 'SET_LOW_STOCK':
      return { ...state, lowStockMedicines: action.payload, isLoading: false };
    case 'SET_PHARMACY_SUPPLIERS':
      return { ...state, pharmacySuppliers: action.payload, isLoading: false };
    case 'SET_PHARMACY_PURCHASES':
      return { ...state, pharmacyPurchases: action.payload, isLoading: false };
    case 'SET_PHARMACY_BILLS':
      return { ...state, pharmacyBills: action.payload, isLoading: false };
    case 'SET_PHARMACY_RETURNS':
      return { ...state, pharmacyReturns: action.payload, isLoading: false };
    case 'SET_EXPIRY_ALERTS':
      return { ...state, expiryAlerts: action.payload, isLoading: false };
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
    case 'SET_CONSULTATIONS':
      return { ...state, consultations: action.payload, isLoading: false };
    case 'SET_SELECTED_CONSULTATION':
      return { ...state, selectedConsultation: action.payload, isLoading: false };
    case 'SET_CONSULTATION_VITALS':
      return { ...state, consultationVitals: action.payload, isLoading: false };
    case 'SET_CONSULTATION_PRESCRIPTIONS':
      return { ...state, consultationPrescriptions: action.payload, isLoading: false };
    case 'SET_EMR_HISTORY':
      return { ...state, emrHistory: action.payload, isLoading: false };
    case 'SET_LAB_TESTS':
      return { ...state, labTests: action.payload, isLoading: false };
    case 'SET_LAB_ORDERS':
      return { ...state, labOrders: action.payload, isLoading: false };
    case 'SET_SELECTED_LAB_ORDER':
      return { ...state, selectedLabOrder: action.payload, isLoading: false };
    case 'SET_BLOOD_DONORS':
      return { ...state, bloodDonors: action.payload, isLoading: false };
    case 'SET_BLOOD_UNITS':
      return { ...state, bloodUnits: action.payload, isLoading: false };
    case 'SET_BLOOD_REQUESTS':
      return { ...state, bloodRequests: action.payload, isLoading: false };
    case 'SET_BLOOD_ISSUES':
      return { ...state, bloodIssues: action.payload, isLoading: false };
    case 'SET_BLOOD_STOCK':
      return { ...state, bloodStock: action.payload, isLoading: false };
    case 'SET_BLOOD_ALERTS':
      return { ...state, bloodAlerts: action.payload, isLoading: false };
    case 'SET_INVENTORY_ITEMS':
      return { ...state, inventoryItems: action.payload, isLoading: false };
    case 'SET_INVENTORY_TRANSACTIONS':
      return { ...state, inventoryTransactions: action.payload, isLoading: false };
    case 'SET_INVENTORY_ALERTS':
      return { ...state, inventoryAlerts: action.payload, isLoading: false };
    case 'SET_INSURERS':
      return { ...state, insurers: action.payload, isLoading: false };
    case 'SET_INSURANCE_CLAIMS':
      return { ...state, insuranceClaims: action.payload, isLoading: false };
    case 'SET_CASH_REPORT':
      return { ...state, cashReport: action.payload, isLoading: false };
    case 'SET_REPORTS_OVERVIEW':
      return { ...state, reportsOverview: action.payload, isLoading: false };
    case 'SET_PACKAGES':
      return { ...state, packages: action.payload, isLoading: false };
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload, isLoading: false };
    case 'SET_NOTIFICATION_SETTINGS':
      return { ...state, notificationSettings: action.payload, isLoading: false };
    case 'SET_PATIENT_PORTAL_SUMMARY':
      return { ...state, patientPortalSummary: action.payload, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
}

export function HospitalManagementProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useUserContext();
  const platform = usePlatformAccess();

  const getAuth = useCallback(() => {
    const token = user?.results?.token || localStorage.getItem('token');
    const membershipId = platform?.activeContext?.parentMembershipId
      || user?.results?.userAccounts?.[0]?.parent_membership_id
      || localStorage.getItem('hh_parent_membership_id');
    if (membershipId) {
      try {
        localStorage.setItem('hh_parent_membership_id', String(membershipId));
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

  const queryWithParams = useCallback((params = {}) => {
    const q = new URLSearchParams({ parent_membership_id: getAuth().membershipId || '' });
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') q.set(key, value);
    });
    return q.toString();
  }, [getAuth]);

  const fetchHospital = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await api(`/hh/hospital?${membershipQuery()}`);
    if (result.success) {
      const hospital = Array.isArray(result.data) ? result.data[0] : result.data;
      dispatch({ type: 'SET_HOSPITAL', payload: hospital || null });
    } else dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api, membershipQuery]);

  const saveHospital = useCallback(async (payload) => {
    const result = await api('/hh/hospital', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchHospital();
    return result;
  }, [api, withMembership, fetchHospital]);

  const fetchDoctors = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await api(`/hh/doctors?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_DOCTORS', payload: result.data || [] });
    else dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api, membershipQuery]);

  const createDoctor = useCallback(async (payload) => {
    const result = await api('/hh/doctors', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchDoctors();
    return result;
  }, [api, withMembership, fetchDoctors]);

  const updateDoctor = useCallback(async (id, payload) => {
    const result = await api(`/hh/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchDoctors();
    return result;
  }, [api, fetchDoctors]);

  const deleteDoctor = useCallback(async (id) => {
    const result = await api(`/hh/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 0 }),
    });
    if (result.success) await fetchDoctors();
    return result;
  }, [api, fetchDoctors]);

  const fetchPatients = useCallback(async (params = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const result = await api(`/hh/patients?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_PATIENTS', payload: result.data || [] });
    else dispatch({ type: 'SET_ERROR', payload: result.error });
    return result;
  }, [api, queryWithParams]);

  const createPatient = useCallback(async (payload) => {
    const result = await api('/hh/patients', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchPatients();
    return result;
  }, [api, withMembership, fetchPatients]);

  const updatePatient = useCallback(async (id, payload) => {
    const result = await api(`/hh/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchPatients();
    return result;
  }, [api, fetchPatients]);

  const fetchAppointments = useCallback(async (params = {}) => {
    const result = await api(`/hh/appointments?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_APPOINTMENTS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const createAppointment = useCallback(async (payload) => {
    const result = await api('/hh/appointments', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchAppointments();
    return result;
  }, [api, withMembership, fetchAppointments]);

  const updateAppointmentStatus = useCallback(async (id, status, extra = {}) => (
    api(`/hh/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...extra }),
    })
  ), [api]);

  const fetchWards = useCallback(async () => {
    const result = await api(`/hh/wards?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_WARDS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createWard = useCallback(async (payload) => {
    const result = await api('/hh/wards', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchWards();
    return result;
  }, [api, withMembership, fetchWards]);

  const updateWard = useCallback(async (id, payload) => {
    const result = await api(`/hh/wards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchWards();
    return result;
  }, [api, fetchWards]);

  const fetchBeds = useCallback(async (params = {}) => {
    const result = await api(`/hh/beds?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_BEDS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const createBed = useCallback(async (payload) => {
    const result = await api('/hh/beds', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchBeds();
    return result;
  }, [api, withMembership, fetchBeds]);

  const updateBed = useCallback(async (id, payload) => {
    const result = await api(`/hh/beds/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchBeds();
    return result;
  }, [api, fetchBeds]);

  const fetchAdmissions = useCallback(async (params = {}) => {
    const result = await api(`/hh/admissions?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_ADMISSIONS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const createAdmission = useCallback(async (payload) => {
    const result = await api('/hh/admissions', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) {
      await fetchAdmissions();
      await fetchBeds();
    }
    return result;
  }, [api, withMembership, fetchAdmissions, fetchBeds]);

  const dischargeAdmission = useCallback(async (id, payload = {}) => {
    const result = await api(`/hh/admissions/${id}/discharge`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (result.success) {
      await fetchAdmissions();
      await fetchBeds();
    }
    return result;
  }, [api, fetchAdmissions, fetchBeds]);

  const fetchReceivables = useCallback(async (params = {}) => {
    const result = await api(`/hh/receivables?${queryWithParams(params)}`);
    if (result.success) {
      const rows = (result.data || []).map((r) => {
        const due = Number(r.amount_due ?? r.amountDue ?? 0);
        const paid = Number(r.amount_paid ?? r.amountPaid ?? 0);
        return { ...r, balance_amount: Math.max(0, due - paid), amount: due };
      });
      dispatch({ type: 'SET_RECEIVABLES', payload: rows });
      return { ...result, data: rows };
    }
    return result;
  }, [api, queryWithParams]);

  const createReceivable = useCallback(async (payload) => {
    const result = await api('/hh/receivables', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchReceivables();
    return result;
  }, [api, withMembership, fetchReceivables]);

  const recordPayment = useCallback(async (payload) => {
    const result = await api('/hh/receipts', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchReceivables();
    return result;
  }, [api, withMembership, fetchReceivables]);

  const fetchMedicines = useCallback(async () => {
    const result = await api(`/hh/medicines?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_MEDICINES', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createMedicine = useCallback(async (payload) => {
    const result = await api('/hh/medicines', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchMedicines();
    return result;
  }, [api, withMembership, fetchMedicines]);

  const updateMedicine = useCallback(async (id, payload) => {
    const result = await api(`/hh/medicines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchMedicines();
    return result;
  }, [api, fetchMedicines]);

  const fetchPharmacySales = useCallback(async (params = {}) => {
    const result = await api(`/hh/pharmacy/sales?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_PHARMACY_SALES', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const fetchLowStock = useCallback(async () => {
    const result = await api(`/hh/pharmacy/alerts?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_LOW_STOCK', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createPharmacySale = useCallback(async (payload) => {
    const result = await api('/hh/pharmacy/sales', {
      method: 'POST',
      body: JSON.stringify(withMembership({
        ...payload,
        qty: payload.qty ?? payload.quantity,
      })),
    });
    if (result.success) {
      await fetchPharmacySales();
      await fetchMedicines();
      await fetchLowStock();
    }
    return result;
  }, [api, withMembership, fetchPharmacySales, fetchMedicines, fetchLowStock]);

  const fetchPharmacySuppliers = useCallback(async () => {
    const result = await api(`/hh/pharmacy/suppliers?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_PHARMACY_SUPPLIERS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createPharmacySupplier = useCallback(async (payload) => {
    const result = await api('/hh/pharmacy/suppliers', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchPharmacySuppliers();
    return result;
  }, [api, withMembership, fetchPharmacySuppliers]);

  const updatePharmacySupplier = useCallback(async (id, payload) => {
    const result = await api(`/hh/pharmacy/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchPharmacySuppliers();
    return result;
  }, [api, fetchPharmacySuppliers]);

  const fetchPharmacyPurchases = useCallback(async (params = {}) => {
    const result = await api(`/hh/pharmacy/purchases?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_PHARMACY_PURCHASES', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const createPharmacyPurchase = useCallback(async (payload) => {
    const result = await api('/hh/pharmacy/purchases', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) {
      await fetchPharmacyPurchases();
      await fetchMedicines();
      await fetchLowStock();
    }
    return result;
  }, [api, withMembership, fetchPharmacyPurchases, fetchMedicines, fetchLowStock]);

  const getPharmacyPurchase = useCallback(async (id) => (
    api(`/hh/pharmacy/purchases/${id}?${membershipQuery()}`)
  ), [api, membershipQuery]);

  const fetchMedicineBatches = useCallback(async (medicineId) => (
    api(`/hh/pharmacy/batches?${queryWithParams({ medicineId })}`)
  ), [api, queryWithParams]);

  const searchPharmacyPos = useCallback(async (q) => (
    api(`/hh/pharmacy/pos/search?${queryWithParams({ q })}`)
  ), [api, queryWithParams]);

  const fetchPharmacyBills = useCallback(async (params = {}) => {
    const result = await api(`/hh/pharmacy/bills?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_PHARMACY_BILLS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const getPharmacyBill = useCallback(async (id) => (
    api(`/hh/pharmacy/bills/${id}?${membershipQuery()}`)
  ), [api, membershipQuery]);

  const pharmacyPosCheckout = useCallback(async (payload) => {
    const result = await api('/hh/pharmacy/pos/checkout', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) {
      await fetchPharmacyBills();
      await fetchMedicines();
      await fetchLowStock();
    }
    return result;
  }, [api, withMembership, fetchPharmacyBills, fetchMedicines, fetchLowStock]);

  const fetchPharmacyReturns = useCallback(async (params = {}) => {
    const result = await api(`/hh/pharmacy/returns?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_PHARMACY_RETURNS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const createPharmacyReturn = useCallback(async (payload) => {
    const result = await api('/hh/pharmacy/returns', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) {
      await fetchPharmacyReturns();
      await fetchPharmacyBills();
      await fetchMedicines();
    }
    return result;
  }, [api, withMembership, fetchPharmacyReturns, fetchPharmacyBills, fetchMedicines]);

  const fetchExpiryAlerts = useCallback(async () => {
    const result = await api(`/hh/pharmacy/expiry-alerts?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_EXPIRY_ALERTS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const fetchLedgerAccounts = useCallback(async () => {
    const result = await api(`/hh/ledger/accounts?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_LEDGER_ACCOUNTS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createLedgerAccount = useCallback(async (payload) => {
    const result = await api('/hh/ledger/accounts', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchLedgerAccounts();
    return result;
  }, [api, withMembership, fetchLedgerAccounts]);

  const fetchLedgerEntries = useCallback(async (filters = {}) => {
    const result = await api(`/hh/ledger/entries?${queryWithParams(filters)}`);
    if (result.success) {
      const payload = result.data;
      const entries = Array.isArray(payload) ? payload : (payload?.entries || []);
      dispatch({ type: 'SET_LEDGER_ENTRIES', payload: entries });
      return { ...result, data: entries, totals: payload?.totals || null };
    }
    return result;
  }, [api, queryWithParams]);

  const createLedgerEntry = useCallback(async (payload) => {
    const result = await api('/hh/ledger/entries', {
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
    const result = await api(`/hh/ledger/categories?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_LEDGER_CATEGORIES', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createLedgerCategory = useCallback(async (payload) => {
    const result = await api('/hh/ledger/categories', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchLedgerCategories();
    return result;
  }, [api, withMembership, fetchLedgerCategories]);

  const deleteLedgerCategory = useCallback(async (id) => {
    const result = await api(`/hh/ledger/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 0 }),
    });
    if (result.success) await fetchLedgerCategories();
    return result;
  }, [api, fetchLedgerCategories]);

  const fetchDaybook = useCallback(async (bookDate, forceRecalculate = false) => {
    const q = new URLSearchParams({
      parent_membership_id: getAuth().membershipId || '',
      date: bookDate,
    });
    if (forceRecalculate) q.set('force_recalculate', 'true');
    const result = await api(`/hh/daybook?${q}`);
    if (result.success) dispatch({ type: 'SET_DAYBOOK', payload: result.data });
    return result;
  }, [api, getAuth]);

  const saveDaybook = useCallback(async (payload) => {
    const result = await api('/hh/daybook', {
      method: 'POST',
      body: JSON.stringify(withMembership({
        ...payload,
        date: payload.date || payload.bookDate || payload.book_date,
      })),
    });
    if (result.success) await fetchDaybook(payload.bookDate || payload.book_date || payload.date, true);
    return result;
  }, [api, withMembership, fetchDaybook]);

  const fetchDashboard = useCallback(async () => {
    const result = await api(`/hh/dashboard?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_DASHBOARD', payload: result.data });
    return result;
  }, [api, membershipQuery]);

  const fetchConsultations = useCallback(async (params = {}) => {
    const result = await api(`/hh/consultations?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_CONSULTATIONS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const createConsultation = useCallback(async (payload) => {
    const result = await api('/hh/consultations', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchConsultations();
    return result;
  }, [api, withMembership, fetchConsultations]);

  const fetchConsultation = useCallback(async (id) => {
    const result = await api(`/hh/consultations/${id}?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_SELECTED_CONSULTATION', payload: result.data });
    return result;
  }, [api, membershipQuery]);

  const updateConsultation = useCallback(async (id, payload) => {
    const result = await api(`/hh/consultations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) {
      await fetchConsultation(id);
      await fetchConsultations();
    }
    return result;
  }, [api, fetchConsultation, fetchConsultations]);

  const fetchConsultationVitals = useCallback(async (consultationId) => {
    const result = await api(`/hh/consultations/${consultationId}/vitals?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_CONSULTATION_VITALS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createConsultationVital = useCallback(async (consultationId, payload) => {
    const result = await api(`/hh/consultations/${consultationId}/vitals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchConsultationVitals(consultationId);
    return result;
  }, [api, fetchConsultationVitals]);

  const fetchConsultationPrescriptions = useCallback(async (consultationId) => {
    const result = await api(`/hh/consultations/${consultationId}/prescriptions?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_CONSULTATION_PRESCRIPTIONS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createConsultationPrescription = useCallback(async (consultationId, payload) => {
    const result = await api(`/hh/consultations/${consultationId}/prescriptions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchConsultationPrescriptions(consultationId);
    return result;
  }, [api, fetchConsultationPrescriptions]);

  const updatePrescription = useCallback(async (id, payload, consultationId) => {
    const result = await api(`/hh/prescriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success && consultationId) await fetchConsultationPrescriptions(consultationId);
    return result;
  }, [api, fetchConsultationPrescriptions]);

  const fetchEmrHistory = useCallback(async (patientId) => {
    const result = await api(`/hh/patients/${patientId}/emr-history?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_EMR_HISTORY', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const fetchLabTests = useCallback(async () => {
    const result = await api(`/hh/lab/tests?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_LAB_TESTS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createLabTest = useCallback(async (payload) => {
    const result = await api('/hh/lab/tests', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchLabTests();
    return result;
  }, [api, withMembership, fetchLabTests]);

  const updateLabTest = useCallback(async (id, payload) => {
    const result = await api(`/hh/lab/tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchLabTests();
    return result;
  }, [api, fetchLabTests]);

  const fetchLabOrders = useCallback(async (params = {}) => {
    const result = await api(`/hh/lab/orders?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_LAB_ORDERS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const createLabOrder = useCallback(async (payload) => {
    const result = await api('/hh/lab/orders', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchLabOrders();
    return result;
  }, [api, withMembership, fetchLabOrders]);

  const fetchLabOrder = useCallback(async (id) => {
    const result = await api(`/hh/lab/orders/${id}?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_SELECTED_LAB_ORDER', payload: result.data });
    return result;
  }, [api, membershipQuery]);

  const updateLabOrderStatus = useCallback(async (id, status) => {
    const result = await api(`/hh/lab/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (result.success) {
      await fetchLabOrder(id);
      await fetchLabOrders();
    }
    return result;
  }, [api, fetchLabOrder, fetchLabOrders]);

  const updateLabOrderResults = useCallback(async (id, items) => {
    const result = await api(`/hh/lab/orders/${id}/results`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
    if (result.success) {
      await fetchLabOrder(id);
      await fetchLabOrders();
    }
    return result;
  }, [api, fetchLabOrder, fetchLabOrders]);

  const fetchBloodDonors = useCallback(async (params = {}) => {
    const result = await api(`/hh/blood-bank/donors?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_BLOOD_DONORS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const createBloodDonor = useCallback(async (payload) => {
    const result = await api('/hh/blood-bank/donors', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchBloodDonors();
    return result;
  }, [api, withMembership, fetchBloodDonors]);

  const updateBloodDonor = useCallback(async (id, payload) => {
    const result = await api(`/hh/blood-bank/donors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchBloodDonors();
    return result;
  }, [api, fetchBloodDonors]);

  const fetchBloodUnits = useCallback(async (params = {}) => {
    const result = await api(`/hh/blood-bank/units?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_BLOOD_UNITS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const fetchBloodStock = useCallback(async () => {
    const result = await api(`/hh/blood-bank/stock?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_BLOOD_STOCK', payload: result.data });
    return result;
  }, [api, membershipQuery]);

  const fetchBloodAlerts = useCallback(async () => {
    const result = await api(`/hh/blood-bank/alerts?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_BLOOD_ALERTS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createBloodUnit = useCallback(async (payload) => {
    const result = await api('/hh/blood-bank/units', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) {
      await fetchBloodUnits();
      await fetchBloodStock();
      await fetchBloodAlerts();
    }
    return result;
  }, [api, withMembership, fetchBloodUnits, fetchBloodStock, fetchBloodAlerts]);

  const updateBloodUnitStatus = useCallback(async (id, status) => {
    const result = await api(`/hh/blood-bank/units/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (result.success) {
      await fetchBloodUnits();
      await fetchBloodStock();
      await fetchBloodAlerts();
    }
    return result;
  }, [api, fetchBloodUnits, fetchBloodStock, fetchBloodAlerts]);

  const fetchBloodRequests = useCallback(async (params = {}) => {
    const result = await api(`/hh/blood-bank/requests?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_BLOOD_REQUESTS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const createBloodRequest = useCallback(async (payload) => {
    const result = await api('/hh/blood-bank/requests', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchBloodRequests();
    return result;
  }, [api, withMembership, fetchBloodRequests]);

  const updateBloodRequestStatus = useCallback(async (id, status) => {
    const result = await api(`/hh/blood-bank/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (result.success) await fetchBloodRequests();
    return result;
  }, [api, fetchBloodRequests]);

  const fetchBloodIssues = useCallback(async (params = {}) => {
    const result = await api(`/hh/blood-bank/issues?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_BLOOD_ISSUES', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const createBloodIssue = useCallback(async (payload) => {
    const result = await api('/hh/blood-bank/issues', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) {
      await fetchBloodIssues();
      await fetchBloodUnits();
      await fetchBloodStock();
      await fetchBloodRequests();
    }
    return result;
  }, [api, withMembership, fetchBloodIssues, fetchBloodUnits, fetchBloodStock, fetchBloodRequests]);

  const returnBloodIssue = useCallback(async (payload) => {
    const result = await api('/hh/blood-bank/issues/return', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) {
      await fetchBloodIssues();
      await fetchBloodUnits();
      await fetchBloodStock();
    }
    return result;
  }, [api, withMembership, fetchBloodIssues, fetchBloodUnits, fetchBloodStock]);

  const fetchInventoryItems = useCallback(async () => {
    const result = await api(`/hh/inventory/items?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_INVENTORY_ITEMS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createInventoryItem = useCallback(async (payload) => {
    const result = await api('/hh/inventory/items', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchInventoryItems();
    return result;
  }, [api, withMembership, fetchInventoryItems]);

  const updateInventoryItem = useCallback(async (id, payload) => {
    const result = await api(`/hh/inventory/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchInventoryItems();
    return result;
  }, [api, fetchInventoryItems]);

  const fetchInventoryTransactions = useCallback(async (params = {}) => {
    const result = await api(`/hh/inventory/transactions?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_INVENTORY_TRANSACTIONS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const fetchInventoryAlerts = useCallback(async () => {
    const result = await api(`/hh/inventory/alerts?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_INVENTORY_ALERTS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createInventoryTransaction = useCallback(async (payload) => {
    const result = await api('/hh/inventory/transactions', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) {
      await fetchInventoryTransactions();
      await fetchInventoryItems();
      await fetchInventoryAlerts();
    }
    return result;
  }, [api, withMembership, fetchInventoryTransactions, fetchInventoryItems, fetchInventoryAlerts]);

  const fetchInsurers = useCallback(async () => {
    const result = await api(`/hh/insurers?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_INSURERS', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createInsurer = useCallback(async (payload) => {
    const result = await api('/hh/insurers', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchInsurers();
    return result;
  }, [api, withMembership, fetchInsurers]);

  const updateInsurer = useCallback(async (id, payload) => {
    const result = await api(`/hh/insurers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchInsurers();
    return result;
  }, [api, fetchInsurers]);

  const fetchInsuranceClaims = useCallback(async (params = {}) => {
    const result = await api(`/hh/insurance/claims?${queryWithParams(params)}`);
    if (result.success) dispatch({ type: 'SET_INSURANCE_CLAIMS', payload: result.data || [] });
    return result;
  }, [api, queryWithParams]);

  const createInsuranceClaim = useCallback(async (payload) => {
    const result = await api('/hh/insurance/claims', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchInsuranceClaims();
    return result;
  }, [api, withMembership, fetchInsuranceClaims]);

  const updateInsuranceClaim = useCallback(async (id, payload) => {
    const result = await api(`/hh/insurance/claims/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchInsuranceClaims();
    return result;
  }, [api, fetchInsuranceClaims]);

  const updateInsuranceClaimStatus = useCallback(async (id, status) => {
    const result = await api(`/hh/insurance/claims/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (result.success) await fetchInsuranceClaims();
    return result;
  }, [api, fetchInsuranceClaims]);

  const fetchCashReport = useCallback(async (from, to) => {
    const result = await api(`/hh/daybook/cash-report?${queryWithParams({ from, to })}`);
    if (result.success) dispatch({ type: 'SET_CASH_REPORT', payload: result.data });
    return result;
  }, [api, queryWithParams]);

  const fetchReportsOverview = useCallback(async (from, to) => {
    const result = await api(`/hh/reports/overview?${queryWithParams({ from, to })}`);
    if (result.success) dispatch({ type: 'SET_REPORTS_OVERVIEW', payload: result.data });
    return result;
  }, [api, queryWithParams]);

  const fetchPackages = useCallback(async () => {
    const result = await api(`/hh/packages?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_PACKAGES', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createPackage = useCallback(async (payload) => {
    const result = await api('/hh/packages', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchPackages();
    return result;
  }, [api, withMembership, fetchPackages]);

  const updatePackage = useCallback(async (id, payload) => {
    const result = await api(`/hh/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchPackages();
    return result;
  }, [api, fetchPackages]);

  const fetchTemplates = useCallback(async () => {
    const result = await api(`/hh/templates?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_TEMPLATES', payload: result.data || [] });
    return result;
  }, [api, membershipQuery]);

  const createTemplate = useCallback(async (payload) => {
    const result = await api('/hh/templates', {
      method: 'POST',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchTemplates();
    return result;
  }, [api, withMembership, fetchTemplates]);

  const updateTemplate = useCallback(async (id, payload) => {
    const result = await api(`/hh/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (result.success) await fetchTemplates();
    return result;
  }, [api, fetchTemplates]);

  const fetchNotificationSettings = useCallback(async () => {
    const result = await api(`/hh/notification-settings?${membershipQuery()}`);
    if (result.success) dispatch({ type: 'SET_NOTIFICATION_SETTINGS', payload: result.data });
    return result;
  }, [api, membershipQuery]);

  const updateNotificationSettings = useCallback(async (payload) => {
    const result = await api('/hh/notification-settings', {
      method: 'PUT',
      body: JSON.stringify(withMembership(payload)),
    });
    if (result.success) await fetchNotificationSettings();
    return result;
  }, [api, withMembership, fetchNotificationSettings]);

  const patientPortalLogin = useCallback(async (phone, parentMembershipId) => {
    const res = await fetch(`${API_BASE_URL}/hh/patient-portal/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, parentMembershipId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      return { success: false, error: data.message || data.error || 'Login failed', data };
    }
    return { success: true, data: data.results ?? data.data ?? data };
  }, []);

  const fetchPatientPortalSummary = useCallback(async (patientId, parentMembershipId) => {
    const q = new URLSearchParams({
      parent_membership_id: parentMembershipId || getAuth().membershipId || '',
      patient_id: patientId,
    });
    const res = await fetch(`${API_BASE_URL}/hh/patient-portal/summary?${q}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      return { success: false, error: data.message || data.error || 'Request failed', data };
    }
    const summary = data.results ?? data.data ?? data;
    dispatch({ type: 'SET_PATIENT_PORTAL_SUMMARY', payload: summary });
    return { success: true, data: summary };
  }, [getAuth]);

  const value = {
    ...state,
    membershipId: getAuth().membershipId,
    fetchHospital,
    saveHospital,
    fetchDoctors,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    fetchPatients,
    createPatient,
    updatePatient,
    fetchAppointments,
    createAppointment,
    updateAppointmentStatus,
    fetchWards,
    createWard,
    updateWard,
    fetchBeds,
    createBed,
    updateBed,
    fetchAdmissions,
    createAdmission,
    dischargeAdmission,
    fetchReceivables,
    createReceivable,
    recordPayment,
    fetchMedicines,
    createMedicine,
    updateMedicine,
    fetchPharmacySales,
    createPharmacySale,
    fetchLowStock,
    fetchPharmacySuppliers,
    createPharmacySupplier,
    updatePharmacySupplier,
    fetchPharmacyPurchases,
    createPharmacyPurchase,
    getPharmacyPurchase,
    fetchMedicineBatches,
    searchPharmacyPos,
    pharmacyPosCheckout,
    fetchPharmacyBills,
    getPharmacyBill,
    createPharmacyReturn,
    fetchPharmacyReturns,
    fetchExpiryAlerts,
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
    fetchConsultations,
    createConsultation,
    fetchConsultation,
    updateConsultation,
    fetchConsultationVitals,
    createConsultationVital,
    fetchConsultationPrescriptions,
    createConsultationPrescription,
    updatePrescription,
    fetchEmrHistory,
    fetchLabTests,
    createLabTest,
    updateLabTest,
    fetchLabOrders,
    createLabOrder,
    fetchLabOrder,
    updateLabOrderStatus,
    updateLabOrderResults,
    fetchBloodDonors,
    createBloodDonor,
    updateBloodDonor,
    fetchBloodUnits,
    createBloodUnit,
    updateBloodUnitStatus,
    fetchBloodStock,
    fetchBloodRequests,
    createBloodRequest,
    updateBloodRequestStatus,
    fetchBloodIssues,
    createBloodIssue,
    returnBloodIssue,
    fetchBloodAlerts,
    fetchInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    fetchInventoryTransactions,
    createInventoryTransaction,
    fetchInventoryAlerts,
    fetchInsurers,
    createInsurer,
    updateInsurer,
    fetchInsuranceClaims,
    createInsuranceClaim,
    updateInsuranceClaim,
    updateInsuranceClaimStatus,
    fetchCashReport,
    fetchReportsOverview,
    fetchPackages,
    createPackage,
    updatePackage,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    fetchNotificationSettings,
    updateNotificationSettings,
    patientPortalLogin,
    fetchPatientPortalSummary,
    api,
  };

  return (
    <HospitalManagementContext.Provider value={value}>
      {children}
    </HospitalManagementContext.Provider>
  );
}

export const useHospitalManagement = () => useContext(HospitalManagementContext);
