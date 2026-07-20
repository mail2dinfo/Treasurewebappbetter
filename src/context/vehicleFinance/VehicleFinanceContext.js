import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { API_BASE_URL, readApiResponse } from '../../utils/apiConfig';
import { useUserContext } from '../user_context';

const VehicleFinanceContext = createContext();

const getStoredPlatformMembershipId = () => {
    try {
        const stored = JSON.parse(localStorage.getItem('platform_active_context') || 'null');
        return stored?.parentMembershipId ?? null;
    } catch {
        return null;
    }
};

const getMembershipId = (user) => {
    const accounts = user?.results?.userAccounts || [];
    const ownerAccount = accounts.find(
        (account) => String(account?.accountName || '').toLowerCase() === 'user'
    );
    return getStoredPlatformMembershipId()
        ?? ownerAccount?.parent_membership_id
        ?? accounts[0]?.parent_membership_id
        ?? accounts[0]?.membershipId
        ?? user?.results?.membershipId
        ?? null;
};

/** Align API loan shape with UI fields (loan_amount / closing_balance + PL-style aliases). */
const normalizeVfLoan = (loan) => {
    if (!loan || typeof loan !== 'object') return loan;
    const loanAmount = loan.loan_amount ?? loan.principal_amount ?? 0;
    const outstanding = loan.closing_balance ?? loan.total_outstanding ?? loan.outstanding_principal ?? 0;
    const disbursedDate = loan.loan_disbursement_date ?? loan.disbursed_date ?? null;
    return {
        ...loan,
        loan_amount: loanAmount,
        principal_amount: loan.principal_amount ?? loanAmount,
        closing_balance: outstanding,
        total_outstanding: loan.total_outstanding ?? outstanding,
        outstanding_principal: loan.outstanding_principal ?? outstanding,
        loan_disbursement_date: disbursedDate,
        disbursed_date: loan.disbursed_date ?? disbursedDate,
        loan_mode: loan.loan_mode ?? loan.repayment_mode ?? loan.tenure_mode ?? null,
        repayment_mode: loan.repayment_mode ?? loan.tenure_mode ?? null,
    };
};

const normalizeVfLoans = (loans) => (
    Array.isArray(loans) ? loans.map(normalizeVfLoan) : []
);

const initialState = {
    companies: [],
    subscribers: [],
    loans: [],
    receivables: [],
    receipts: [],
    ledgerAccounts: [],
    ledgerEntries: [],
    ledgerSummary: null,
    isLoading: false,
    error: null,
};

function vehicleFinanceReducer(state, action) {
    switch (action.type) {
        case 'SET_COMPANIES':
            return { ...state, companies: action.payload, isLoading: false };
        case 'ADD_COMPANY':
            return {
                ...state,
                companies: [action.payload, ...state.companies],
                isLoading: false
            };
        case 'UPDATE_COMPANY':
            return {
                ...state,
                companies: state.companies.map(company =>
                    company.id === action.payload.id
                        ? action.payload
                        : company
                ),
                isLoading: false
            };
        case 'DELETE_COMPANY':
            return {
                ...state,
                companies: state.companies.filter(
                    company => company.id !== action.payload
                ),
                isLoading: false
            };
        case 'SET_SUBSCRIBERS':
            return { ...state, subscribers: action.payload, isLoading: false };
        case 'ADD_SUBSCRIBER':
            return {
                ...state,
                subscribers: [action.payload, ...state.subscribers],
                isLoading: false
            };
        case 'UPDATE_SUBSCRIBER':
            return {
                ...state,
                subscribers: state.subscribers.map(subscriber =>
                    subscriber.vf_cust_id === action.payload.vf_cust_id
                        ? action.payload
                        : subscriber
                ),
                isLoading: false
            };
        case 'DELETE_SUBSCRIBER':
            return {
                ...state,
                subscribers: state.subscribers.filter(
                    subscriber => subscriber.vf_cust_id !== action.payload
                ),
                isLoading: false
            };
        case 'SET_LOANS':
            return { ...state, loans: normalizeVfLoans(action.payload), isLoading: false };
        case 'ADD_LOAN':
            return {
                ...state,
                loans: [normalizeVfLoan(action.payload), ...state.loans],
                isLoading: false
            };
        case 'UPDATE_LOAN':
            return {
                ...state,
                loans: state.loans.map(loan =>
                    loan.id === action.payload.id
                        ? normalizeVfLoan(action.payload)
                        : loan
                ),
                isLoading: false
            };
        case 'DELETE_LOAN':
            return {
                ...state,
                loans: state.loans.filter((loan) => String(loan.id) !== String(action.payload)),
                isLoading: false,
            };
        case 'SET_RECEIVABLES':
            return { ...state, receivables: action.payload, isLoading: false };
        case 'SET_RECEIPTS':
            return { ...state, receipts: action.payload, isLoading: false };
        case 'SET_LEDGER_ACCOUNTS':
            return { ...state, ledgerAccounts: action.payload, isLoading: false };
        case 'ADD_LEDGER_ACCOUNT':
            return {
                ...state,
                ledgerAccounts: [action.payload, ...state.ledgerAccounts],
                isLoading: false
            };
        case 'SET_LEDGER_ENTRIES':
            return { ...state, ledgerEntries: action.payload, isLoading: false };
        case 'ADD_LEDGER_ENTRY':
            return {
                ...state,
                ledgerEntries: [action.payload, ...state.ledgerEntries],
                isLoading: false
            };
        case 'SET_LEDGER_SUMMARY':
            return { ...state, ledgerSummary: action.payload, isLoading: false };
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

export function VehicleFinanceProvider({ children }) {
    const [state, dispatch] = useReducer(vehicleFinanceReducer, initialState);
    const { user } = useUserContext();

    // Fetch all companies
    const fetchCompanies = useCallback(async () => {
        console.log('=== FETCH PL COMPANIES START ===');
        console.log('User token:', user?.results?.token ? 'Present' : 'Missing');
        console.log('API Base URL:', API_BASE_URL);

        if (!user?.results?.token) {
            console.log('❌ User not authenticated');
            return { success: false, error: "User not authenticated" };
        }

        // Get membership ID
        const membershipId = getMembershipId(user);
        console.log('Parent membership ID:', membershipId);

        if (!membershipId) {
            console.log('❌ No membership ID found');
            dispatch({ type: 'SET_ERROR', payload: 'Membership ID not found. Please log in again.' });
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const url = `${API_BASE_URL}/vf/companies?parent_membership_id=${membershipId}`;
            console.log('Making request to:', url);
            console.log('Membership ID being sent:', membershipId);

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    'Content-Type': 'application/json',
                },
            });

            console.log('Response status:', res.status);

            const data = await readApiResponse(res);
            console.log('✅ API Response:', data);

            dispatch({ type: 'SET_COMPANIES', payload: data.results || [] });
            dispatch({ type: 'CLEAR_ERROR' });
            console.log('=== FETCH PL COMPANIES END ===');
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || 'Unknown error occurred';
            console.error('❌ Error fetching companies:', error);
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Create company
    const createCompany = async (companyData) => {
        if (!user?.results?.token) {
            dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
            return { success: false, error: 'User not authenticated' };
        }

        const membershipId = getMembershipId(user);
        if (!membershipId) {
            dispatch({ type: 'SET_ERROR', payload: 'Membership ID not found. Please log in again.' });
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const payload = {
                companyName: companyData.company_name,
                companyLogo: companyData.company_logo || '',
                contactNo: companyData.contact_no || '',
                address: companyData.address || '',
                membershipId,
            };

            console.log('Creating VF company:', payload);

            const res = await fetch(`${API_BASE_URL}/vf/companies`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await readApiResponse(res);
            console.log('Create company success:', result);

            dispatch({ type: 'ADD_COMPANY', payload: result.results });
            dispatch({ type: 'CLEAR_ERROR' });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || 'Unknown error occurred';
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error creating company:', error);
            return { success: false, error: errorMessage };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Update company
    const updateCompany = async (companyId, companyData) => {
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const token = user?.results?.token;
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const payload = {
                companyId,
                companyName: companyData.company_name,
                companyLogo: companyData.company_logo || '',
                contactNo: companyData.contact_no || '',
                address: companyData.address || '',
            };

            const res = await fetch(`${API_BASE_URL}/vf/companies`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await readApiResponse(res);
            dispatch({ type: 'UPDATE_COMPANY', payload: result.results });
            dispatch({ type: 'CLEAR_ERROR' });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || 'Unknown error occurred';
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error updating company:', error);
            return { success: false, error: errorMessage };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Delete company
    const deleteCompany = async (companyId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;

            if (!token) {
                throw new Error('Authentication token not found');
            }

            const res = await fetch(`${API_BASE_URL}/vf/companies/${companyId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to delete company");
            }

            dispatch({ type: 'DELETE_COMPANY', payload: companyId });
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error deleting company:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Fetch all subscribers
    const fetchSubscribers = useCallback(async () => {
        console.log('=== FETCH PL SUBSCRIBERS START ===');
        if (!user?.results?.token) {
            return { success: false, error: "User not authenticated" };
        }

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const url = `${API_BASE_URL}/vf/subscribers?parent_membership_id=${membershipId}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to fetch subscribers");
            }

            const data = await res.json();
            dispatch({ type: 'SET_SUBSCRIBERS', payload: data.results || [] });
            dispatch({ type: 'CLEAR_ERROR' });
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Create subscriber
    const createSubscriber = async (subscriberData) => {
        if (!user?.results?.token) return { success: false, error: "User not authenticated" };

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            return { success: false, error: "Membership ID not found" };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const payload = {
                vf_cust_name: subscriberData.vf_cust_name,
                vf_cust_dob: subscriberData.vf_cust_dob || null,
                vf_cust_age: subscriberData.vf_cust_age || null,
                vf_cust_phone: subscriberData.vf_cust_phone || '',
                vf_cust_photo: subscriberData.vf_cust_photo || '',
                vf_cust_address: subscriberData.vf_cust_address || '',
                latitude: subscriberData.latitude || null,
                longitude: subscriberData.longitude || null,
                vf_cust_aadhaar_frontside: subscriberData.vf_cust_aadhaar_frontside || '',
                vf_cust_aadhaar_backside: subscriberData.vf_cust_aadhaar_backside || '',
                vf_nominee_name: subscriberData.vf_nominee_name || '',
                vf_nominee_phone: subscriberData.vf_nominee_phone || '',
                region: subscriberData.region?.trim() || '',
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/vf/subscribers`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                return { success: false, error: result.message || "Failed to create subscriber" };
            }

            dispatch({ type: 'ADD_SUBSCRIBER', payload: result.results });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error creating subscriber:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Update subscriber
    const updateSubscriber = async (subscriberId, subscriberData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;

            if (!token) {
                throw new Error('Authentication token not found');
            }

            const payload = {
                vf_cust_name: subscriberData.vf_cust_name,
                vf_cust_dob: subscriberData.vf_cust_dob || null,
                vf_cust_age: subscriberData.vf_cust_age || null,
                vf_cust_phone: subscriberData.vf_cust_phone || '',
                vf_cust_photo: subscriberData.vf_cust_photo || '',
                vf_cust_address: subscriberData.vf_cust_address || '',
                latitude: subscriberData.latitude || null,
                longitude: subscriberData.longitude || null,
                vf_cust_aadhaar_frontside: subscriberData.vf_cust_aadhaar_frontside || '',
                vf_cust_aadhaar_backside: subscriberData.vf_cust_aadhaar_backside || '',
                vf_nominee_name: subscriberData.vf_nominee_name || '',
                vf_nominee_phone: subscriberData.vf_nominee_phone || '',
                region: subscriberData.region?.trim() || '',
            };

            const res = await fetch(`${API_BASE_URL}/vf/subscribers/${subscriberId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const response = { data: await res.json() };

            if (!res.ok) {
                throw new Error(response.data.message || "Failed to update subscriber");
            }

            dispatch({ type: 'UPDATE_SUBSCRIBER', payload: response.data.results });
            return { success: true, data: response.data.results };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error updating subscriber:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Delete subscriber
    const deleteSubscriber = async (subscriberId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;

            if (!token) {
                throw new Error('Authentication token not found');
            }

            const res = await fetch(`${API_BASE_URL}/vf/subscribers/${subscriberId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to delete subscriber");
            }

            dispatch({ type: 'DELETE_SUBSCRIBER', payload: subscriberId });
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error deleting subscriber:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Fetch all loans
    const fetchLoans = useCallback(async (status = null) => {
        if (!user?.results?.token) {
            dispatch({ type: 'SET_LOADING', payload: false });
            return { success: false, error: "User not authenticated" };
        }

        const membershipId = getMembershipId(user);
        if (!membershipId) {
            dispatch({ type: 'SET_LOADING', payload: false });
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            let url = `${API_BASE_URL}/vf/loans?parent_membership_id=${membershipId}`;
            if (status) {
                url += `&status=${status}`;
            }

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to fetch loans");
            }

            const data = await res.json();
            const payload = Array.isArray(data.results)
                ? data.results
                : (data.results?.loans || []);
            dispatch({ type: 'SET_LOANS', payload });
            dispatch({ type: 'CLEAR_ERROR' });
            dispatch({ type: 'SET_LOADING', payload: false });
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            dispatch({ type: 'SET_LOADING', payload: false });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Disburse new loan
    const disburseLoan = async (loanData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) throw new Error('Authentication token not found');

            const membershipId = getMembershipId(user);
            if (!membershipId) {
                throw new Error('Membership ID not found');
            }

            const payload = { ...loanData, membershipId };

            const res = await fetch(`${API_BASE_URL}/vf/loans/disburse`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Failed to disburse loan");
            }

            dispatch({ type: 'ADD_LOAN', payload: result.results.loan });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error disbursing loan:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Get loan details — local fetch only (do not toggle page-level isLoading).
    const getLoanById = useCallback(async (loanId) => {
        try {
            const token = user?.results?.token;
            if (!token) {
                throw new Error('Authentication token not found');
            }

            const membershipId = getMembershipId(user);
            if (!membershipId) {
                throw new Error('Membership ID not found');
            }

            const res = await fetch(`${API_BASE_URL}/vf/loans/${loanId}?parent_membership_id=${membershipId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Failed to fetch loan details");
            }

            const details = result.results || {};
            const normalized = {
                ...details,
                loan: normalizeVfLoan(details.loan || details),
                receivables: Array.isArray(details.receivables) ? details.receivables : [],
            };

            return { success: true, data: normalized };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            console.error('Error fetching loan details:', error);
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Foreclose loan
    const forecloseLoan = async (foreclosureData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) throw new Error('Authentication token not found');

            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            if (!membershipId) {
                throw new Error('Membership ID not found');
            }

            const payload = {
                paymentDate: foreclosureData.paymentDate,
                paymentMode: foreclosureData.paymentMode,
                vf_ledger_accounts_id: foreclosureData.vf_ledger_accounts_id,
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/vf/loans/${foreclosureData.loanId}/foreclose`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Failed to foreclose loan");
            }

            // Refresh loans to get updated status
            await fetchLoans();
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            dispatch({ type: 'SET_LOADING', payload: false });
            return { success: false, error: errorMessage };
        }
    };

    // Collect payment
    const collectPayment = async (paymentData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) throw new Error('Authentication token not found');

            const membershipId = getMembershipId(user);
            if (!membershipId) {
                throw new Error('Membership ID not found');
            }

            const res = await fetch(`${API_BASE_URL}/vf/collections/pay`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    receivableId: paymentData.receivableId,
                    amount: parseFloat(paymentData.receivedAmount || paymentData.amount),
                    paymentMethod: paymentData.paymentMethod || paymentData.paymentMode,
                    paymentDate: paymentData.paymentDate,
                    notes: paymentData.notes || '',
                    membershipId,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Failed to collect payment");
            }

            // Refresh loans to get updated outstanding amounts
            await fetchLoans();
            dispatch({ type: 'SET_LOADING', payload: false });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    };

    // Delete loan (cascades receivables, receipts, ledger entries)
    const deleteLoan = async (loanId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) throw new Error('Authentication token not found');

            const membershipId = getMembershipId(user);
            if (!membershipId) throw new Error('Membership ID not found');

            const res = await fetch(`${API_BASE_URL}/vf/loans/${loanId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ membershipId }),
            });

            const result = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(result.message || 'Failed to delete loan');
            }

            dispatch({ type: 'DELETE_LOAN', payload: loanId });
            await fetchLoans();

            const responseData = result.data || result.results || result;
            window.dispatchEvent(new CustomEvent('loanDeleted', {
                detail: {
                    loanId,
                    accountBalanceUpdates: responseData?.accountBalanceUpdates || [],
                    affectedDates: responseData?.affectedDates || [],
                    cascadeFromDate: responseData?.cascadeFromDate,
                },
            }));

            dispatch({ type: 'SET_LOADING', payload: false });
            return { success: true, data: responseData };
        } catch (error) {
            const errorMessage = error.message || 'Unknown error occurred';
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage, message: errorMessage };
        }
    };

    // Fetch receivables for a loan
    const fetchReceivablesByLoan = async (loanId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) throw new Error('Authentication token not found');

            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;

            const res = await fetch(`${API_BASE_URL}/vf/receivables/loan/${loanId}?parent_membership_id=${membershipId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Failed to fetch receivables");
            }

            dispatch({ type: 'SET_RECEIVABLES', payload: result.results || [] });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    };

    // Fetch all receipts
    const fetchReceipts = useCallback(async () => {
        if (!user?.results?.token) {
            return { success: false, error: "User not authenticated" };
        }

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const url = `${API_BASE_URL}/vf/receipts?parent_membership_id=${membershipId}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to fetch receipts");
            }

            const data = await res.json();
            dispatch({ type: 'SET_RECEIPTS', payload: data.results || [] });
            dispatch({ type: 'CLEAR_ERROR' });
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Fetch all ledger accounts
    const fetchLedgerAccounts = useCallback(async () => {
        if (!user?.results?.token) {
            return { success: false, error: "User not authenticated" };
        }

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const url = `${API_BASE_URL}/vf/ledger/accounts?parent_membership_id=${membershipId}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to fetch ledger accounts");
            }

            const data = await res.json();
            dispatch({ type: 'SET_LEDGER_ACCOUNTS', payload: data.results || [] });
            dispatch({ type: 'CLEAR_ERROR' });
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Create ledger account
    const createLedgerAccount = async (accountData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) throw new Error('Authentication token not found');

            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            if (!membershipId) {
                throw new Error('Membership ID not found');
            }

            const payload = {
                account_name: accountData.account_name,
                opening_balance: accountData.opening_balance || 0,
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/vf/ledger/accounts`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Failed to create ledger account");
            }

            dispatch({ type: 'ADD_LEDGER_ACCOUNT', payload: result.results });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    };

    // Fetch all ledger entries
    const fetchLedgerEntries = useCallback(async (filters = {}) => {
        if (!user?.results?.token) {
            return { success: false, error: "User not authenticated" };
        }

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const queryParams = new URLSearchParams({
                parent_membership_id: membershipId,
                ...(filters.account_id ? { account_id: filters.account_id } : {}),
                ...(filters.category ? { category: filters.category } : {}),
                ...(filters.start_date ? { start_date: filters.start_date } : {}),
                ...(filters.end_date ? { end_date: filters.end_date } : {}),
            });

            const url = `${API_BASE_URL}/vf/ledger/entries?${queryParams.toString()}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to fetch ledger entries");
            }

            const data = await res.json();
            dispatch({ type: 'SET_LEDGER_ENTRIES', payload: data.results || [] });
            dispatch({ type: 'CLEAR_ERROR' });
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Create ledger entry
    const createLedgerEntry = async (entryData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) throw new Error('Authentication token not found');

            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            if (!membershipId) {
                throw new Error('Membership ID not found');
            }

            const payload = {
                vf_ledger_accounts_id: entryData.vf_ledger_accounts_id,
                category: entryData.category,
                subcategory: entryData.subcategory || '',
                amount: parseFloat(entryData.amount),
                description: entryData.description || '',
                reference_id: entryData.reference_id || null,
                reference_type: entryData.reference_type || null,
                payment_date: entryData.payment_date || new Date().toISOString().split('T')[0],
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/vf/ledger/entries`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Failed to create ledger entry");
            }

            dispatch({ type: 'ADD_LEDGER_ENTRY', payload: result.results });
            // Refresh accounts to update balances
            await fetchLedgerAccounts();
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    };

    // Fetch ledger summary
    const fetchLedgerSummary = useCallback(async () => {
        if (!user?.results?.token) {
            return { success: false, error: "User not authenticated" };
        }

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const url = `${API_BASE_URL}/vf/ledger/summary?parent_membership_id=${membershipId}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to fetch ledger summary");
            }

            const data = await res.json();
            dispatch({ type: 'SET_LEDGER_SUMMARY', payload: data.results });
            dispatch({ type: 'CLEAR_ERROR' });
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const value = {
        ...state,
        fetchCompanies,
        createCompany,
        updateCompany,
        deleteCompany,
        fetchSubscribers,
        createSubscriber,
        updateSubscriber,
        deleteSubscriber,
        fetchLoans,
        disburseLoan,
        getLoanById,
        forecloseLoan,
        collectPayment,
        deleteLoan,
        fetchReceivablesByLoan,
        fetchReceipts,
        fetchLedgerAccounts,
        createLedgerAccount,
        fetchLedgerEntries,
        createLedgerEntry,
        fetchLedgerSummary,
        clearError,
    };

    return (
        <VehicleFinanceContext.Provider value={value}>
            {children}
        </VehicleFinanceContext.Provider>
    );
}

export function useVehicleFinanceContext() {
    const context = useContext(VehicleFinanceContext);
    if (!context) {
        throw new Error('useVehicleFinanceContext must be used within VehicleFinanceProvider');
    }
    return context;
}
