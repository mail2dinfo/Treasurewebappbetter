import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../user_context';

const PersonalLoanContext = createContext();

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

function personalLoanReducer(state, action) {
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
                    subscriber.pl_cust_id === action.payload.pl_cust_id
                        ? action.payload
                        : subscriber
                ),
                isLoading: false
            };
        case 'DELETE_SUBSCRIBER':
            return {
                ...state,
                subscribers: state.subscribers.filter(
                    subscriber => subscriber.pl_cust_id !== action.payload
                ),
                isLoading: false
            };
        case 'SET_LOANS':
            return { ...state, loans: action.payload, isLoading: false };
        case 'ADD_LOAN':
            return {
                ...state,
                loans: [action.payload, ...state.loans],
                isLoading: false
            };
        case 'UPDATE_LOAN':
            return {
                ...state,
                loans: state.loans.map(loan =>
                    loan.id === action.payload.id
                        ? action.payload
                        : loan
                ),
                isLoading: false
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

export function PersonalLoanProvider({ children }) {
    const [state, dispatch] = useReducer(personalLoanReducer, initialState);
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
        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        console.log('Parent membership ID:', membershipId);

        if (!membershipId) {
            console.log('❌ No membership ID found');
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const url = `${API_BASE_URL}/pl/companies?parent_membership_id=${membershipId}`;
            console.log('Making request to:', url);
            console.log('Membership ID being sent:', membershipId);

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            console.log('Response status:', res.status);
            console.log('Response ok:', res.ok);

            if (!res.ok) {
                const errorData = await res.json();
                console.error('❌ API Error:', errorData);
                throw new Error(errorData.message || "Failed to fetch companies");
            }

            const data = await res.json();
            console.log('✅ API Response:', data);
            console.log('Companies from API:', data.results);

            dispatch({ type: 'SET_COMPANIES', payload: data.results || [] });
            dispatch({ type: 'CLEAR_ERROR' });
            console.log('=== FETCH PL COMPANIES END ===');
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            console.error('❌ Error fetching companies:', error);
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Create company
    const createCompany = async (companyData) => {
        if (!user?.results?.token) return { success: false, error: "User not authenticated" };

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            return { success: false, error: "Membership ID not found" };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            // Transform frontend data to backend format
            const payload = {
                companyName: companyData.company_name,
                companyLogo: companyData.company_logo || '',
                contactNo: companyData.contact_no,
                address: companyData.address,
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/pl/companies`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                return { success: false, error: result.message || "Failed to create company" };
            }

            dispatch({ type: 'ADD_COMPANY', payload: result.results });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error creating company:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Update company
    const updateCompany = async (companyId, companyData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;

            if (!token) {
                throw new Error('Authentication token not found');
            }

            // Transform frontend data to backend format
            const payload = {
                companyId: companyId,
                companyName: companyData.company_name,
                companyLogo: companyData.company_logo || '',
                contactNo: companyData.contact_no,
                address: companyData.address,
            };

            const res = await fetch(`${API_BASE_URL}/pl/companies`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const response = { data: await res.json() };

            dispatch({ type: 'UPDATE_COMPANY', payload: response.data.results });
            return { success: true, data: response.data.results };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error updating company:', error);
            return { success: false, error: errorMessage };
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

            const res = await fetch(`${API_BASE_URL}/pl/companies/${companyId}`, {
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
            const url = `${API_BASE_URL}/pl/subscribers?parent_membership_id=${membershipId}`;
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
                pl_cust_name: subscriberData.pl_cust_name,
                pl_cust_dob: subscriberData.pl_cust_dob || null,
                pl_cust_age: subscriberData.pl_cust_age || null,
                pl_cust_phone: subscriberData.pl_cust_phone || '',
                pl_cust_photo: subscriberData.pl_cust_photo || '',
                pl_cust_address: subscriberData.pl_cust_address || '',
                latitude: subscriberData.latitude || null,
                longitude: subscriberData.longitude || null,
                pl_cust_aadhaar_frontside: subscriberData.pl_cust_aadhaar_frontside || '',
                pl_cust_aadhaar_backside: subscriberData.pl_cust_aadhaar_backside || '',
                pl_nominee_name: subscriberData.pl_nominee_name || '',
                pl_nominee_phone: subscriberData.pl_nominee_phone || '',
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/pl/subscribers`, {
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
                pl_cust_name: subscriberData.pl_cust_name,
                pl_cust_dob: subscriberData.pl_cust_dob || null,
                pl_cust_age: subscriberData.pl_cust_age || null,
                pl_cust_phone: subscriberData.pl_cust_phone || '',
                pl_cust_photo: subscriberData.pl_cust_photo || '',
                pl_cust_address: subscriberData.pl_cust_address || '',
                latitude: subscriberData.latitude || null,
                longitude: subscriberData.longitude || null,
                pl_cust_aadhaar_frontside: subscriberData.pl_cust_aadhaar_frontside || '',
                pl_cust_aadhaar_backside: subscriberData.pl_cust_aadhaar_backside || '',
                pl_nominee_name: subscriberData.pl_nominee_name || '',
                pl_nominee_phone: subscriberData.pl_nominee_phone || '',
            };

            const res = await fetch(`${API_BASE_URL}/pl/subscribers/${subscriberId}`, {
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

            const res = await fetch(`${API_BASE_URL}/pl/subscribers/${subscriberId}`, {
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

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            dispatch({ type: 'SET_LOADING', payload: false });
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            let url = `${API_BASE_URL}/pl/loans?parent_membership_id=${membershipId}`;
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
            dispatch({ type: 'SET_LOANS', payload: data.results || [] });
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

            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            if (!membershipId) {
                throw new Error('Membership ID not found');
            }

            const payload = {
                subscriberId: loanData.subscriberId,
                loanMode: loanData.loanMode,
                principalAmount: parseFloat(loanData.principalAmount),
                interestRate: loanData.loanMode === 'INTEREST_ONLY' ? parseFloat(loanData.interestRate) : null,
                interestDueDay: loanData.loanMode === 'INTEREST_ONLY' ? parseInt(loanData.interestDueDay) : null,
                disbursedDate: loanData.disbursedDate,
                pl_ledger_accounts_id: loanData.pl_ledger_accounts_id,
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/pl/loans/disburse`, {
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

    // Get loan details
    const getLoanById = async (loanId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) {
                dispatch({ type: 'SET_LOADING', payload: false });
                throw new Error('Authentication token not found');
            }

            const res = await fetch(`${API_BASE_URL}/pl/loans/${loanId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            const result = await res.json();

            if (!res.ok) {
                dispatch({ type: 'SET_LOADING', payload: false });
                throw new Error(result.message || "Failed to fetch loan details");
            }

            dispatch({ type: 'SET_LOADING', payload: false });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            dispatch({ type: 'SET_LOADING', payload: false });
            console.error('Error fetching loan details:', error);
            return { success: false, error: errorMessage };
        }
    };

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
                pl_ledger_accounts_id: foreclosureData.pl_ledger_accounts_id,
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/pl/loans/${foreclosureData.loanId}/foreclose`, {
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

            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            if (!membershipId) {
                throw new Error('Membership ID not found');
            }

            const payload = {
                loanId: paymentData.loanId,
                receivableId: paymentData.receivableId,
                receivedAmount: parseFloat(paymentData.receivedAmount),
                principalPaid: parseFloat(paymentData.principalPaid || 0),
                interestPaid: parseFloat(paymentData.interestPaid || 0),
                paymentDate: paymentData.paymentDate,
                paymentMode: paymentData.paymentMode,
                pl_ledger_accounts_id: paymentData.pl_ledger_accounts_id,
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/pl/receipts/collect`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || "Failed to collect payment");
            }

            // Refresh loans to get updated outstanding amounts
            await fetchLoans();
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    };

    // Fetch receivables for a loan
    const fetchReceivablesByLoan = async (loanId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) throw new Error('Authentication token not found');

            const res = await fetch(`${API_BASE_URL}/pl/receivables/loan/${loanId}`, {
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
            const url = `${API_BASE_URL}/pl/ledger/accounts?parent_membership_id=${membershipId}`;
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

            const res = await fetch(`${API_BASE_URL}/pl/ledger/accounts`, {
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

            const url = `${API_BASE_URL}/pl/ledger/entries?${queryParams.toString()}`;
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
                pl_ledger_accounts_id: entryData.pl_ledger_accounts_id,
                category: entryData.category,
                subcategory: entryData.subcategory || '',
                amount: parseFloat(entryData.amount),
                description: entryData.description || '',
                reference_id: entryData.reference_id || null,
                reference_type: entryData.reference_type || null,
                payment_date: entryData.payment_date || new Date().toISOString().split('T')[0],
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/pl/ledger/entries`, {
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
            const url = `${API_BASE_URL}/pl/ledger/summary?parent_membership_id=${membershipId}`;
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
        fetchReceivablesByLoan,
        fetchLedgerAccounts,
        createLedgerAccount,
        fetchLedgerEntries,
        createLedgerEntry,
        fetchLedgerSummary,
        clearError,
    };

    return (
        <PersonalLoanContext.Provider value={value}>
            {children}
        </PersonalLoanContext.Provider>
    );
}

export function usePersonalLoanContext() {
    const context = useContext(PersonalLoanContext);
    if (!context) {
        throw new Error('usePersonalLoanContext must be used within PersonalLoanProvider');
    }
    return context;
}
