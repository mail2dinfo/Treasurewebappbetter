import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../utils/apiConfig';


const CollectorContext = createContext();

// Initial state
const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    isFetchingReceivables: false,
    receivables: [],
    summary: null,
    areaSummary: {},
    selectedArea: null,
    areaReceivables: [],
    error: null
};

// Action types
const ACTIONS = {
    SET_LOADING: 'SET_LOADING',
    SET_FETCHING_RECEIVABLES: 'SET_FETCHING_RECEIVABLES',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGOUT: 'LOGOUT',
    SET_RECEIVABLES: 'SET_RECEIVABLES',
    SET_AREA_RECEIVABLES: 'SET_AREA_RECEIVABLES',
    SET_ERROR: 'SET_ERROR',
    CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const collectorReducer = (state, action) => {
    switch (action.type) {
        case ACTIONS.SET_LOADING:
            return { ...state, isLoading: action.payload };

        case ACTIONS.SET_FETCHING_RECEIVABLES:
            return { ...state, isFetchingReceivables: action.payload };

        case ACTIONS.LOGIN_SUCCESS:
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };

        case ACTIONS.LOGOUT:
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                receivables: [],
                summary: null,
                areaSummary: {},
                selectedArea: null,
                areaReceivables: [],
                error: null
            };

        case ACTIONS.SET_RECEIVABLES:
            return {
                ...state,
                receivables: action.payload.receivables || [],
                summary: action.payload.summary || null,
                areaSummary: action.payload.areaSummary || {},
                isFetchingReceivables: false,
                error: null
            };

        case ACTIONS.SET_AREA_RECEIVABLES:
            return {
                ...state,
                selectedArea: action.payload.area,
                areaReceivables: action.payload.receivables,
                error: null
            };

        case ACTIONS.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                isLoading: false,
                isFetchingReceivables: false
            };

        case ACTIONS.CLEAR_ERROR:
            return { ...state, error: null };

        default:
            return state;
    }
};

// Provider component
export const CollectorProvider = ({ children }) => {
    const [state, dispatch] = useReducer(collectorReducer, initialState);

    // Check for existing token on mount
    useEffect(() => {
        console.log('🔍 CollectorProvider: Checking for existing auth...');
        const token = localStorage.getItem('collector_token');
        const user = localStorage.getItem('collector_user');

        console.log('  - token exists:', !!token);
        console.log('  - user exists:', !!user);

        if (token && user) {
            try {
                const userData = JSON.parse(user);
                console.log('  - parsed userData:', userData);
                dispatch({
                    type: ACTIONS.LOGIN_SUCCESS,
                    payload: { user: userData, token }
                });
                console.log('  - ✅ User authenticated from localStorage');
            } catch (error) {
                console.log('  - ❌ Error parsing user data:', error);
                localStorage.removeItem('collector_token');
                localStorage.removeItem('collector_user');
            }
        } else {
            console.log('  - ❌ No auth data found in localStorage');
        }
    }, []);

    // Login function
    const login = async (credentials) => {
        dispatch({ type: ACTIONS.SET_LOADING, payload: true });

        try {
            const response = await fetch(`${API_BASE_URL}/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (data.error === false && data.results) {
                // Check if user has Collector role
                const hasCollectorRole = data.results.userAccounts?.some(
                    account => account.accountName?.toLowerCase().includes('collector')
                );

                if (hasCollectorRole) {
                    console.log('✅ Login successful, storing user data:', data.results);
                    // Store in localStorage
                    localStorage.setItem('collector_token', data.results.token);
                    localStorage.setItem('collector_user', JSON.stringify(data.results));

                    dispatch({
                        type: ACTIONS.LOGIN_SUCCESS,
                        payload: { user: data.results, token: data.results.token }
                    });

                    console.log('✅ User data stored and dispatched');
                    toast.success('Login successful!');
                    return { success: true };
                } else {
                    console.log('❌ User does not have collector role');
                    throw new Error('Access denied. Collector role required.');
                }
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
            toast.error(error.message);
            return { success: false, error: error.message };
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('collector_token');
        localStorage.removeItem('collector_user');
        dispatch({ type: ACTIONS.LOGOUT });
        toast.success('Logged out successfully');
    };

    const fetchReceivables = useCallback(async () => {
        const collectorId =
            state.user?.id ||
            state.user?.userId ||
            state.user?.results?.userId;
        const authToken = state.token || state.user?.token;

        if (!collectorId || !authToken) {
            console.log('❌ Missing collector ID or token, cannot fetch receivables');
            return;
        }

        dispatch({ type: ACTIONS.SET_FETCHING_RECEIVABLES, payload: true });

        try {
            const response = await fetch(`${API_BASE_URL}/collector-area/${collectorId}/receivables`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();

                if (data.success === true || data.error === false) {
                    const receivablesData = data.results?.receivables || [];
                    dispatch({
                        type: ACTIONS.SET_RECEIVABLES,
                        payload: {
                            receivables: receivablesData,
                            summary: data.results?.summary || null,
                            areaSummary: data.results?.areaSummary || {},
                        }
                    });
                } else {
                    throw new Error(data.message || 'Failed to fetch receivables');
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch receivables');
            }
        } catch (error) {
            dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
            toast.error('Failed to fetch receivables');
        } finally {
            dispatch({ type: ACTIONS.SET_FETCHING_RECEIVABLES, payload: false });
        }
    }, [state.user, state.token]);

    // Fetch receivables for specific area
    const fetchAreaReceivables = useCallback((areaName) => {
        if (!state.receivables.length) return;

        const areaReceivables = state.receivables.filter(
            receivable => receivable.aob === areaName
        );

        dispatch({
            type: ACTIONS.SET_AREA_RECEIVABLES,
            payload: { area: areaName, receivables: areaReceivables }
        });
    }, [state.receivables]);

    const getCollectorId = useCallback(() => (
        state.user?.userId || state.user?.id || state.user?.results?.userId || null
    ), [state.user]);

    const getPaymentsList = useCallback((receivable) => {
        if (!receivable?.payments) return [];
        if (Array.isArray(receivable.payments)) return receivable.payments;
        if (typeof receivable.payments === 'string') {
            try {
                return JSON.parse(receivable.payments);
            } catch {
                return [];
            }
        }
        return [];
    }, []);

    const getPaymentsTotal = useCallback((receivable) => {
        return getPaymentsList(receivable).reduce(
            (sum, payment) => sum + parseFloat(payment.payment_amount || 0),
            0
        );
    }, [getPaymentsList]);

    const getTotalCollectedAmount = useCallback((receivable) => {
        const reportedPaid = parseFloat(receivable.rbpaid || receivable.collected_amount || 0);
        const paymentsTotal = getPaymentsTotal(receivable);
        return Math.max(reportedPaid, paymentsTotal);
    }, [getPaymentsTotal]);

    const getCollectorCollectedAmount = useCallback((receivable, collectorId) => {
        const reportedCollectorPaid = receivable?.collector_paid != null
            ? parseFloat(receivable.collector_paid || 0)
            : null;

        if (!collectorId && !state.user) {
            return reportedCollectorPaid ?? 0;
        }

        const collectorName = (
            state.user?.name ||
            `${state.user?.firstname || ''} ${state.user?.lastname || ''}`
        ).trim().toLowerCase();

        const paymentsTotal = getPaymentsList(receivable).reduce((sum, payment) => {
            const amount = parseFloat(payment.payment_amount || 0);
            const paymentCreatorId = payment.created_by;
            const paymentUserName = (payment.user_name || '').trim().toLowerCase();

            const isCollectorPayment =
                (collectorId && paymentCreatorId != null && String(paymentCreatorId) === String(collectorId)) ||
                (collectorName && paymentUserName === collectorName);

            return isCollectorPayment ? sum + amount : sum;
        }, 0);

        if (reportedCollectorPaid != null) {
            return Math.max(reportedCollectorPaid, paymentsTotal);
        }

        return paymentsTotal;
    }, [getPaymentsList, state.user]);

    const enrichDashboardSummary = useCallback((summary) => {
        const totalCollected = Number(summary.totalCollected ?? summary.totalCollectedAmount ?? 0);
        const collected = Number(summary.collected ?? 0);
        const collectedByOthers = Number(
            summary.collectedByOthers ?? Math.max(0, totalCollected - collected)
        );

        return {
            totalAmount: Number(summary.totalAmount ?? 0),
            totalCollected,
            collected,
            collectedByOthers,
            pending: Number(summary.pending ?? 0),
            collectionRate: summary.totalAmount > 0
                ? ((collected / summary.totalAmount) * 100).toFixed(1)
                : 0,
        };
    }, []);

    const enrichAreaSummary = useCallback((areaGroups) => {
        return Object.entries(areaGroups).reduce((acc, [areaName, area]) => {
            const totalCollected = Number(area.totalCollected ?? 0);
            const collected = Number(area.collected ?? 0);

            acc[areaName] = {
                ...area,
                collectedByOthers: Number(
                    area.collectedByOthers ?? Math.max(0, totalCollected - collected)
                ),
            };

            return acc;
        }, {});
    }, []);

    // Get area summary
    const getAreaSummary = useCallback(() => {
        if (state.areaSummary && Object.keys(state.areaSummary).length > 0) {
            return enrichAreaSummary(state.areaSummary);
        }

        if (!state.receivables.length) return {};

        const collectorId = getCollectorId();

        const areaGroups = state.receivables.reduce((acc, receivable) => {
            const area = receivable.aob;
            if (!acc[area]) {
                acc[area] = {
                    totalAmount: 0,
                    totalCollected: 0,
                    collected: 0,
                    collectedByOthers: 0,
                    pending: 0,
                    count: 0
                };
            }

            acc[area].totalAmount += parseFloat(receivable.rbtotal || receivable.total_amount || 0);
            acc[area].totalCollected += getTotalCollectedAmount(receivable);
            acc[area].collected += getCollectorCollectedAmount(receivable, collectorId);
            acc[area].pending += parseFloat(receivable.rbdue || receivable.pending_amount || 0);
            acc[area].count += 1;

            return acc;
        }, {});

        Object.values(areaGroups).forEach((area) => {
            area.collectedByOthers = Math.max(0, area.totalCollected - area.collected);
        });

        return areaGroups;
    }, [state.receivables, state.areaSummary, getCollectorId, getCollectorCollectedAmount, getTotalCollectedAmount, enrichAreaSummary]);

    // Get overall summary
    const getOverallSummary = useCallback(() => {
        if (state.summary) {
            return enrichDashboardSummary(state.summary);
        }

        if (!state.receivables.length) {
            return {
                totalAmount: 0,
                totalCollected: 0,
                collected: 0,
                collectedByOthers: 0,
                pending: 0,
                collectionRate: 0,
            };
        }

        const collectorId = getCollectorId();

        const summary = state.receivables.reduce((acc, receivable) => {
            acc.totalAmount += parseFloat(receivable.rbtotal || receivable.total_amount || 0);
            acc.totalCollected += getTotalCollectedAmount(receivable);
            acc.collected += getCollectorCollectedAmount(receivable, collectorId);
            acc.pending += parseFloat(receivable.rbdue || receivable.pending_amount || 0);
            return acc;
        }, { totalAmount: 0, totalCollected: 0, collected: 0, pending: 0 });

        summary.collectedByOthers = Math.max(0, summary.totalCollected - summary.collected);
        summary.collectionRate = summary.totalAmount > 0
            ? ((summary.collected / summary.totalAmount) * 100).toFixed(1)
            : 0;

        return summary;
    }, [state.receivables, state.summary, getCollectorId, getCollectorCollectedAmount, getTotalCollectedAmount, enrichDashboardSummary]);

    const getReceivablesSummary = useCallback((receivablesList = state.receivables) => {
        return receivablesList.reduce((acc, receivable) => {
            acc.totalDue += parseFloat(receivable.rbtotal || receivable.total_amount || 0);
            acc.paid += parseFloat(receivable.rbpaid || receivable.collected_amount || 0);
            acc.balance += parseFloat(receivable.rbdue || receivable.pending_amount || 0);
            return acc;
        }, { totalDue: 0, paid: 0, balance: 0 });
    }, []);

    const value = {
        ...state,
        login,
        logout,
        fetchReceivables,
        fetchAreaReceivables,
        getAreaSummary,
        getOverallSummary,
        getReceivablesSummary
    };

    return (
        <CollectorContext.Provider value={value}>
            {children}
        </CollectorContext.Provider>
    );
};

// Custom hook
export const useCollector = () => {
    const context = useContext(CollectorContext);
    if (!context) {
        throw new Error('useCollector must be used within a CollectorProvider');
    }
    return context;
};
