import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../utils/apiConfig';

const VehicleFinanceCollectorContext = createContext(null);

/** Same storage keys pattern as Chit Fund collector — prefixed for VF */
const STORAGE_TOKEN = 'vf_collector_token';
const STORAGE_USER = 'vf_collector_user';

const emptyState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    vfEmployee: null,
    parentMembershipId: null,
};

/** Read session synchronously so ProtectedRoute does not bounce to /login before hydrate. */
const readStoredSession = () => {
    const token = localStorage.getItem(STORAGE_TOKEN);
    const user = localStorage.getItem(STORAGE_USER);
    if (!token || !user) return emptyState;

    try {
        return {
            ...emptyState,
            user: JSON.parse(user),
            token,
            vfEmployee: (() => {
                const raw = localStorage.getItem('vf_collector_employee');
                return raw ? JSON.parse(raw) : null;
            })(),
            parentMembershipId: localStorage.getItem('vf_collector_membership_id') || null,
            isAuthenticated: true,
        };
    } catch {
        localStorage.removeItem(STORAGE_TOKEN);
        localStorage.removeItem(STORAGE_USER);
        localStorage.removeItem('vf_collector_employee');
        localStorage.removeItem('vf_collector_membership_id');
        return emptyState;
    }
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                vfEmployee: action.payload.vfEmployee || null,
                parentMembershipId: action.payload.parentMembershipId || null,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };
        case 'LOGOUT':
            return { ...emptyState };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        default:
            return state;
    }
};

export const VehicleFinanceCollectorProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, null, readStoredSession);

    /**
     * Same login flow as Chit Fund CollectorProvider:
     * 1. POST /signin with phone + password
     * 2. Verify Collector role in userAccounts
     * 3. Verify VF collector employee record (VF-specific extra step)
     */
    const login = async (credentials) => {
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const response = await fetch(`${API_BASE_URL}/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (data.error !== false || !data.results) {
                throw new Error(data.message || 'Login failed');
            }

            const hasCollectorRole = data.results.userAccounts?.some(
                (account) => account.accountName?.toLowerCase().includes('collector')
            );

            if (!hasCollectorRole) {
                throw new Error('Access denied. Collector role required.');
            }

            const sessionRes = await fetch(`${API_BASE_URL}/vf/collector/session`, {
                headers: { Authorization: `Bearer ${data.results.token}` },
            });
            const sessionData = await sessionRes.json();

            if (!sessionRes.ok || sessionData.error !== false) {
                throw new Error(
                    sessionData.message ||
                        'You are not registered as a Vehicle Finance collector. Contact your manager.'
                );
            }

            const vfEmployee = sessionData.results?.vfEmployee;
            const parentMembershipId =
                sessionData.results?.parent_membership_id ||
                vfEmployee?.parent_membership_id ||
                data.results.userAccounts?.[0]?.parent_membership_id;

            localStorage.setItem(STORAGE_TOKEN, data.results.token);
            localStorage.setItem(STORAGE_USER, JSON.stringify(data.results));
            localStorage.setItem('vf_collector_employee', JSON.stringify(vfEmployee || {}));
            localStorage.setItem('vf_collector_membership_id', String(parentMembershipId || ''));

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                    user: data.results,
                    token: data.results.token,
                    vfEmployee,
                    parentMembershipId,
                },
            });

            toast.success('Login successful!');
            return { success: true };
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            toast.error(error.message);
            return { success: false, error: error.message };
        }
    };

    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_TOKEN);
        localStorage.removeItem(STORAGE_USER);
        localStorage.removeItem('vf_collector_employee');
        localStorage.removeItem('vf_collector_membership_id');
        dispatch({ type: 'LOGOUT' });
        toast.success('Logged out successfully');
    }, []);

    const value = {
        ...state,
        login,
        logout,
    };

    return (
        <VehicleFinanceCollectorContext.Provider value={value}>
            {children}
        </VehicleFinanceCollectorContext.Provider>
    );
};

export const useVehicleFinanceCollector = () => {
    const context = useContext(VehicleFinanceCollectorContext);
    if (!context) {
        throw new Error('useVehicleFinanceCollector must be used within VehicleFinanceCollectorProvider');
    }
    return context;
};

export const useOptionalVehicleFinanceCollector = () =>
    useContext(VehicleFinanceCollectorContext);

export default VehicleFinanceCollectorContext;
