import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../user_context';

const DcLedgerContext = createContext();

const initialState = {
    accounts: [],
    entries: [],
    summary: null,
    dayBook: null,
    isLoading: false,
    error: null,
};

function dcLedgerReducer(state, action) {
    switch (action.type) {
        case 'SET_ACCOUNTS':
            return { ...state, accounts: action.payload, isLoading: false };
        case 'ADD_ACCOUNT':
            return {
                ...state,
                accounts: [action.payload, ...state.accounts],
                isLoading: false
            };
        case 'SET_ENTRIES':
            return { ...state, entries: action.payload, isLoading: false };
        case 'ADD_ENTRY':
            return {
                ...state,
                entries: [action.payload, ...state.entries],
                isLoading: false
            };
        case 'SET_SUMMARY':
            return { ...state, summary: action.payload, isLoading: false };
        case 'SET_DAY_BOOK':
            return { ...state, dayBook: action.payload, isLoading: false };
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

export function DcLedgerProvider({ children }) {
    const [state, dispatch] = useReducer(dcLedgerReducer, initialState);
    const { user } = useUserContext();

    // Fetch all ledger accounts
    const fetchAccounts = useCallback(async () => {
        console.log('=== FETCH DC LEDGER ACCOUNTS START ===');
        console.log('User token:', user?.results?.token ? 'Present' : 'Missing');

        if (!user?.results?.token) {
            console.log('❌ User not authenticated');
            return { success: false, error: "User not authenticated" };
        }

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        console.log('Membership ID:', membershipId);

        if (!membershipId) {
            console.log('❌ No membership ID found');
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const url = `${API_BASE_URL}/dc/ledger/accounts?parent_membership_id=${membershipId}`;
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
                throw new Error(errorData.message || "Failed to fetch ledger accounts");
            }

            const data = await res.json();
            console.log('✅ API Response:', data);
            console.log('Accounts from API:', data.results);

            dispatch({ type: 'SET_ACCOUNTS', payload: data.results || [] });
            dispatch({ type: 'CLEAR_ERROR' });
            console.log('=== FETCH DC LEDGER ACCOUNTS END ===');
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            console.error('❌ Error fetching ledger accounts:', error);
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Create new ledger account
    const createAccount = async (accountData) => {
        if (!user?.results?.token) return { success: false, error: "User not authenticated" };

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            return { success: false, error: "Membership ID not found" };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const payload = {
                account_name: accountData.account_name,
                opening_balance: parseFloat(accountData.opening_balance || 0),
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/dc/ledger/accounts`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                return { success: false, error: result.message || "Failed to create ledger account" };
            }

            dispatch({ type: 'ADD_ACCOUNT', payload: result.results });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error creating ledger account:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Fetch all ledger entries
    const fetchEntries = useCallback(async (filters = {}) => {
        console.log('=== FETCH DC LEDGER ENTRIES START ===');

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

            const url = `${API_BASE_URL}/dc/ledger/entries?${queryParams.toString()}`;
            console.log('Making request to:', url);

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
            console.log('✅ Entries API Response:', data);

            dispatch({ type: 'SET_ENTRIES', payload: data.results || [] });
            dispatch({ type: 'CLEAR_ERROR' });
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            console.error('❌ Error fetching ledger entries:', error);
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Create new ledger entry
    const createEntry = async (entryData) => {
        if (!user?.results?.token) return { success: false, error: "User not authenticated" };

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            return { success: false, error: "Membership ID not found" };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const payload = {
                dc_ledger_accounts_id: entryData.dc_ledger_accounts_id,
                category: entryData.category,
                subcategory: entryData.subcategory,
                amount: parseFloat(entryData.amount),
                description: entryData.description,
                reference_id: entryData.reference_id,
                reference_type: entryData.reference_type,
                payment_date: entryData.payment_date || new Date().toISOString().split('T')[0], // Default to today if not provided
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/dc/ledger/entries`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                return { success: false, error: result.message || "Failed to create ledger entry" };
            }

            dispatch({ type: 'ADD_ENTRY', payload: result.results });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error creating ledger entry:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Fetch ledger summary
    const fetchSummary = useCallback(async () => {
        if (!user?.results?.token) return { success: false, error: "User not authenticated" };

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const url = `${API_BASE_URL}/dc/ledger/summary?parent_membership_id=${membershipId}`;

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
            dispatch({ type: 'SET_SUMMARY', payload: data.results });
            dispatch({ type: 'CLEAR_ERROR' });
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error fetching ledger summary:', error);
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Clear error
    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    // Fetch Day Book for a specific date
    const fetchDayBook = useCallback(async (date = null, forceRecalculate = false) => {
        console.log('=== FETCH DAY BOOK START ===');
        console.log('Date:', date);
        console.log('Force Recalculate:', forceRecalculate);

        if (!user?.results?.token) {
            return { success: false, error: "User not authenticated" };
        }

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        try {
            const queryParams = new URLSearchParams({
                parent_membership_id: membershipId,
                ...(date ? { date: date } : {}),
                ...(forceRecalculate ? { force_recalculate: 'true' } : {}),
            });

            const url = `${API_BASE_URL}/dc/ledger/day-book?${queryParams.toString()}`;
            console.log('Making request to:', url);

            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to fetch day book");
            }

            const data = await res.json();
            console.log('✅ Day Book API Response:', data);

            dispatch({ type: 'SET_DAY_BOOK', payload: data.results || null });
            dispatch({ type: 'CLEAR_ERROR' });
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            console.error('❌ Error fetching day book:', error);
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    const value = {
        accounts: state.accounts,
        entries: state.entries,
        summary: state.summary,
        dayBook: state.dayBook,
        isLoading: state.isLoading,
        error: state.error,
        fetchAccounts,
        createAccount,
        fetchEntries,
        createEntry,
        fetchSummary,
        fetchDayBook,
        clearError,
    };

    return (
        <DcLedgerContext.Provider value={value}>
            {children}
        </DcLedgerContext.Provider>
    );
}

export const useDcLedgerContext = () => {
    const context = useContext(DcLedgerContext);
    if (!context) {
        throw new Error('useDcLedgerContext must be used within DcLedgerProvider');
    }
    return context;
};
