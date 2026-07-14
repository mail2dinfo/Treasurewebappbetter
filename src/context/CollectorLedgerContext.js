import React, { createContext, useReducer, useContext, useCallback } from 'react';
import { useCollector } from './CollectorProvider';
import { API_BASE_URL } from '../utils/apiConfig';
import { toast } from 'react-toastify';

const CollectorLedgerContext = createContext();

const initialState = {
    ledgerEntries: [],
    ledgerAccounts: [],
    isLoading: false,
    error: null,
    page: 1,
    limit: 20,
    totalPages: 1,
    filters: {
        startDate: '',
        endDate: '',
        category: '', // No category filter - show all
        entryType: '', // No entry type filter - show all
    }
};

const ACTIONS = {
    FETCH_START: 'FETCH_START',
    FETCH_ENTRIES_SUCCESS: 'FETCH_ENTRIES_SUCCESS',
    FETCH_ACCOUNTS_SUCCESS: 'FETCH_ACCOUNTS_SUCCESS',
    FETCH_ERROR: 'FETCH_ERROR',
    SET_PAGE: 'SET_PAGE',
    SET_LIMIT: 'SET_LIMIT',
    SET_FILTERS: 'SET_FILTERS',
    ADD_ENTRY_SUCCESS: 'ADD_ENTRY_SUCCESS',
};

function collectorLedgerReducer(state, action) {
    switch (action.type) {
        case ACTIONS.FETCH_START:
            return { ...state, isLoading: true, error: null };

        case ACTIONS.FETCH_ENTRIES_SUCCESS:
            return {
                ...state,
                isLoading: false,
                ledgerEntries: action.payload.entries,
                totalPages: action.payload.totalPages,
            };

        case ACTIONS.FETCH_ACCOUNTS_SUCCESS:
            return {
                ...state,
                isLoading: false,
                ledgerAccounts: action.payload,
            };

        case ACTIONS.FETCH_ERROR:
            return { ...state, isLoading: false, error: action.payload };

        case ACTIONS.SET_PAGE:
            return { ...state, page: action.payload };

        case ACTIONS.SET_LIMIT:
            return { ...state, limit: action.payload };

        case ACTIONS.SET_FILTERS:
            return { ...state, filters: { ...state.filters, ...action.payload } };

        case ACTIONS.ADD_ENTRY_SUCCESS:
            return { ...state, isLoading: false };

        default:
            return state;
    }
}

export const CollectorLedgerProvider = ({ children }) => {
    const { user } = useCollector();
    const [state, dispatch] = useReducer(collectorLedgerReducer, initialState);

    // Get parent membership ID from collector's user data
    // IMPORTANT: Collectors are EMPLOYEES, not owners. They must ALWAYS use
    // parent_membership_id to access the organization's data, NOT their own membership ID.
    const getMembershipId = useCallback(() => {
        const accounts = user?.userAccounts || user?.results?.userAccounts || [];
        const collectorAccount = accounts.find(
            (account) => account.accountName?.toLowerCase().includes('collector')
        );
        return collectorAccount?.parent_membership_id
            || accounts.find((account) => account.parent_membership_id)?.parent_membership_id
            || accounts[0]?.parent_membership_id
            || null;
    }, [user]);

    // Fetch ledger entries (advance payment history)
    const fetchLedgerEntries = useCallback(async (filters = {}) => {
        const token = user?.token || user?.results?.token;
        if (!token) {
            console.log('❌ No token found, cannot fetch ledger entries');
            return;
        }

        const parentMembershipId = getMembershipId();
        if (!parentMembershipId) {
            const errorMsg = 'Parent Membership ID not found. Please ensure you are logged in as a collector.';
            dispatch({ type: ACTIONS.FETCH_ERROR, payload: errorMsg });
            toast.error(errorMsg);
            console.error('❌ Parent Membership ID not found');
            console.error('   User data:', user);
            return;
        }

        dispatch({ type: ACTIONS.FETCH_START });

        try {
            // Merge current filters with new filters
            const currentFilters = { ...state.filters, ...filters };

            console.log('🔍 Current filters:', currentFilters);
            console.log('🔍 State filters:', state.filters);
            console.log('🔍 Passed filters:', filters);

            // Build query params - only add filters if they have values
            const queryParams = new URLSearchParams({
                page: state.page,
                limit: state.limit,
            });

            // Only add filters if they have actual values (not empty strings)
            if (currentFilters.startDate && currentFilters.startDate.trim()) {
                queryParams.append('startDate', currentFilters.startDate);
            }
            if (currentFilters.endDate && currentFilters.endDate.trim()) {
                queryParams.append('endDate', currentFilters.endDate);
            }
            if (currentFilters.category && currentFilters.category.trim()) {
                queryParams.append('category', currentFilters.category);
            }
            if (currentFilters.entryType && currentFilters.entryType.trim()) {
                queryParams.append('entryType', currentFilters.entryType);
            }

            console.log('🔄 Fetching ledger entries for parent membershipId:', parentMembershipId);
            console.log('🔄 Query params:', queryParams.toString());
            console.log('🔄 Full API URL:', `${API_BASE_URL}/ledger/entry/${parentMembershipId}?${queryParams.toString()}`);

            const response = await fetch(`${API_BASE_URL}/ledger/entry/${parentMembershipId}?${queryParams.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) throw new Error('Failed to fetch ledger entries');

            const data = await response.json();
            console.log('✅ Ledger entries response:', data);
            console.log('✅ data.results:', data.results);
            console.log('✅ data.results.results:', data.results?.results);
            console.log('✅ data.results type:', typeof data.results);
            console.log('✅ data.results is array:', Array.isArray(data.results));
            console.log('✅ data.results.results is array:', Array.isArray(data.results?.results));
            console.log('✅ data.results.results length:', data.results?.results?.length);

            // FIX: Backend returns data.results.results (nested structure)
            const entriesArray = data.results?.results || data.results || [];
            console.log('✅ Final entries array:', entriesArray);
            console.log('✅ Final entries length:', entriesArray.length);

            dispatch({
                type: ACTIONS.FETCH_ENTRIES_SUCCESS,
                payload: {
                    entries: entriesArray,
                    totalPages: data.results?.totalPages || data.totalPages || 1,
                },
            });

            console.log('✅ Dispatched', entriesArray.length, 'entries to state');

            // Update filters in state
            if (Object.keys(filters).length > 0) {
                dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
            }
        } catch (error) {
            console.log('❌ Fetch ledger entries error:', error);
            dispatch({ type: ACTIONS.FETCH_ERROR, payload: error.message });
            toast.error('Failed to fetch ledger entries');
        }
    }, [user, state.page, state.limit, state.filters, getMembershipId]);

    // Fetch ledger accounts (payment methods)
    const fetchLedgerAccounts = useCallback(async () => {
        const token = user?.token || user?.results?.token;
        if (!token) {
            console.log('❌ No token found, cannot fetch ledger accounts');
            return;
        }

        const parentMembershipId = getMembershipId();
        if (!parentMembershipId) {
            const errorMsg = 'Parent Membership ID not found. Please ensure you are logged in as a collector.';
            dispatch({ type: ACTIONS.FETCH_ERROR, payload: errorMsg });
            toast.error(errorMsg);
            console.error('❌ Parent Membership ID not found');
            console.error('   User data:', user);
            return;
        }

        dispatch({ type: ACTIONS.FETCH_START });

        try {
            console.log('🔄 Fetching ledger accounts for parent membershipId:', parentMembershipId);

            const response = await fetch(`${API_BASE_URL}/ledger/accounts/${parentMembershipId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) throw new Error('Failed to fetch ledger accounts');

            const data = await response.json();
            console.log('✅ Ledger accounts response:', data);

            dispatch({
                type: ACTIONS.FETCH_ACCOUNTS_SUCCESS,
                payload: data.results || [],
            });
        } catch (error) {
            console.log('❌ Fetch ledger accounts error:', error);
            dispatch({ type: ACTIONS.FETCH_ERROR, payload: error.message });
            toast.error('Failed to fetch payment methods');
        }
    }, [user, getMembershipId]);

    // Add ledger entry (for recording new advance payments)
    const addLedgerEntry = useCallback(async (entry) => {
        const token = user?.token || user?.results?.token;
        if (!token) {
            toast.error('User not authenticated');
            return { success: false, message: 'User not authenticated' };
        }

        dispatch({ type: ACTIONS.FETCH_START });

        try {
            console.log('🔄 Adding ledger entry:', entry);

            const response = await fetch(`${API_BASE_URL}/ledger/entry`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entry),
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add ledger entry');
            }

            const data = await response.json();
            console.log('✅ Add ledger entry response:', data);

            dispatch({ type: ACTIONS.ADD_ENTRY_SUCCESS });
            toast.success('Advance payment recorded successfully');

            // Refresh ledger entries after adding new entry
            fetchLedgerEntries();

            return { success: true, data };
        } catch (error) {
            console.log('❌ Add ledger entry error:', error);
            dispatch({ type: ACTIONS.FETCH_ERROR, payload: error.message });
            toast.error(error.message || 'Failed to record advance payment');
            return { success: false, message: error.message };
        }
    }, [user, fetchLedgerEntries]);

    // Add multiple ledger entries (for recording advances from multiple subscribers)
    const addMultipleLedgerEntries = useCallback(async (entries) => {
        const token = user?.token || user?.results?.token;
        if (!token) {
            toast.error('User not authenticated');
            return { success: false, message: 'User not authenticated' };
        }

        dispatch({ type: ACTIONS.FETCH_START });

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        try {
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];

                try {
                    const response = await fetch(`${API_BASE_URL}/ledger/entry`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(entry),
                    });

                    const responseData = await response.json();

                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                        errors.push(`Entry ${i + 1}: ${responseData.message || 'Failed to add entry'}`);
                    }
                } catch (error) {
                    errorCount++;
                    errors.push(`Entry ${i + 1}: ${error.message}`);
                }
            }

            dispatch({ type: ACTIONS.ADD_ENTRY_SUCCESS });

            if (successCount > 0) {
                if (errorCount > 0) {
                    toast.warning(`Successfully recorded ${successCount} entries. ${errorCount} failed.`);
                } else {
                    toast.success(`Successfully recorded ${successCount} advance payments!`);
                }

                // Refresh ledger entries after adding new entries
                fetchLedgerEntries();

                return { success: true, successCount, errorCount, errors };
            } else {
                toast.error('No entries were recorded successfully');
                return { success: false, message: 'No entries were recorded successfully', errors };
            }
        } catch (error) {
            console.log('❌ Add multiple ledger entries error:', error);
            dispatch({ type: ACTIONS.FETCH_ERROR, payload: error.message });
            toast.error('Failed to record advance payments');
            return { success: false, message: error.message };
        }
    }, [user, fetchLedgerEntries]);

    // Set page
    const setPage = useCallback((page) => {
        dispatch({ type: ACTIONS.SET_PAGE, payload: page });
    }, []);

    // Set limit
    const setLimit = useCallback((limit) => {
        dispatch({ type: ACTIONS.SET_LIMIT, payload: limit });
    }, []);

    // Set filters
    const setFilters = useCallback((filters) => {
        dispatch({ type: ACTIONS.SET_FILTERS, payload: filters });
    }, []);

    return (
        <CollectorLedgerContext.Provider
            value={{
                ledgerEntries: state.ledgerEntries,
                ledgerAccounts: state.ledgerAccounts,
                isLoading: state.isLoading,
                error: state.error,
                page: state.page,
                limit: state.limit,
                totalPages: state.totalPages,
                filters: state.filters,
                fetchLedgerEntries,
                fetchLedgerAccounts,
                addLedgerEntry,
                addMultipleLedgerEntries,
                setPage,
                setLimit,
                setFilters,
            }}
        >
            {children}
        </CollectorLedgerContext.Provider>
    );
};

export const useCollectorLedger = () => {
    const context = useContext(CollectorLedgerContext);
    if (!context) {
        throw new Error('useCollectorLedger must be used within CollectorLedgerProvider');
    }
    return context;
};

