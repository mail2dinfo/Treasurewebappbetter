import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { useUserContext } from './user_context';
import { API_BASE_URL, IS_PRODUCTION_DEPLOY } from '../utils/apiConfig';
import { BILLING_PLANS, mergePlansWithCatalog } from '../utils/billingPlans';

const BillingContext = createContext();

const initialState = {
    subscription: null,
    payments: [],
    billingCycleChangeWindow: null,
    availablePlans: [],
    isLoading: false,
    isRefreshing: false,
    hasLoaded: false,
    error: null,
};

function billingReducer(state, action) {
    switch (action.type) {
        case 'FETCH_START':
            return {
                ...state,
                isLoading: !state.hasLoaded,
                isRefreshing: state.hasLoaded,
                error: null,
            };
        case 'FETCH_SUBSCRIPTION_SUCCESS':
            return {
                ...state,
                isLoading: false,
                isRefreshing: false,
                hasLoaded: true,
                subscription: action.payload.subscription,
                billingCycleChangeWindow: action.payload.billingCycleChangeWindow ?? state.billingCycleChangeWindow,
            };
        case 'FETCH_PAYMENTS_SUCCESS':
            return {
                ...state,
                isLoading: false,
                isRefreshing: false,
                hasLoaded: true,
                payments: action.payload.payments,
                billingCycleChangeWindow: action.payload.billingCycleChangeWindow || state.billingCycleChangeWindow,
            };
        case 'FETCH_PLANS_SUCCESS':
            return {
                ...state,
                isLoading: false,
                availablePlans: action.payload,
            };
        case 'FETCH_ERROR':
            return { ...state, isLoading: false, isRefreshing: false, error: action.payload };
        case 'RESET_BILLING':
            return initialState;
        default:
            return state;
    }
}

export const BillingProvider = ({ children }) => {
    const { user } = useUserContext();
    const [state, dispatch] = useReducer(billingReducer, initialState);

    // Fetch billing data when user is available
    useEffect(() => {
        if (user?.results?.token) {
            fetchCurrentSubscription();
            fetchPaymentHistory();
            fetchAvailablePlans();
        }
    }, [user?.results?.token]);

    const getMembershipId = () => {
        const account = user?.results?.userAccounts?.[0];
        return account?.parent_membership_id || account?.membership_id || null;
    };

    const fetchCurrentSubscription = async ({ silent = false } = {}) => {
        if (!user?.results?.token) return;

        const membershipId = getMembershipId();
        if (!membershipId) {
            dispatch({ type: 'FETCH_ERROR', payload: 'Membership ID not found' });
            return;
        }

        if (!silent) {
            dispatch({ type: 'FETCH_START' });
        }

        try {
            const res = await fetch(`${API_BASE_URL}/billing-subscription/${membershipId}`, {
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                },
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to fetch subscription: ${res.status}`);
            }

            const data = await res.json();

            if (data.success && data.data) {
                dispatch({
                    type: 'FETCH_SUBSCRIPTION_SUCCESS',
                    payload: {
                        subscription: data.data.subscription,
                        billingCycleChangeWindow: data.data.billing_cycle_change_window || null,
                    },
                });
            } else {
                dispatch({ type: 'FETCH_ERROR', payload: data.message || 'No subscription data found' });
            }
        } catch (error) {
            dispatch({ type: 'FETCH_ERROR', payload: error.message });
        }
    };

    const fetchPaymentHistory = async ({ silent = false } = {}) => {
        if (!user?.results?.token) return;

        const membershipId = getMembershipId();
        if (!membershipId) {
            dispatch({ type: 'FETCH_ERROR', payload: 'Membership ID not found' });
            return;
        }

        if (!silent) {
            dispatch({ type: 'FETCH_START' });
        }

        try {
            const res = await fetch(`${API_BASE_URL}/billing-payments/${membershipId}`, {
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                },
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to fetch payments: ${res.status}`);
            }

            const data = await res.json();

            if (data.success && data.data) {

                // Handle different data structures from backend
                let paymentData;
                if (data.data.cycle_payments) {
                    paymentData = {
                        cycle_payments: data.data.cycle_payments,
                        previous_due_cycles: data.data.previous_due_cycles || [],
                        current_plan_cycles: data.data.current_plan_cycles || [],
                    };
                } else if (Array.isArray(data.data)) {
                    paymentData = { cycle_payments: data.data, previous_due_cycles: [], current_plan_cycles: [] };
                } else {
                    paymentData = { cycle_payments: [], previous_due_cycles: [], current_plan_cycles: [] };
                }

                dispatch({
                    type: 'FETCH_PAYMENTS_SUCCESS',
                    payload: {
                        payments: paymentData,
                        billingCycleChangeWindow: data.data.billing_cycle_change_window || null,
                    },
                });
            } else {
                dispatch({
                    type: 'FETCH_PAYMENTS_SUCCESS',
                    payload: { payments: { cycle_payments: [] }, billingCycleChangeWindow: null },
                });
            }
        } catch (error) {
            console.error('Payment history fetch error:', error.message);
            dispatch({ type: 'FETCH_ERROR', payload: error.message });
        }
    };

    const fetchAvailablePlans = async () => {
        if (!user?.results?.token) return;

        dispatch({ type: 'FETCH_START' });

        try {
            const res = await fetch(`${API_BASE_URL}/billing-subscription/plans/available`, {
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                },
            });

            if (!res.ok) throw new Error('Failed to fetch plans');
            const data = await res.json();

            if (data.success && data.data) {
                dispatch({ type: 'FETCH_PLANS_SUCCESS', payload: mergePlansWithCatalog(data.data) });
            } else {
                dispatch({ type: 'FETCH_PLANS_SUCCESS', payload: BILLING_PLANS });
            }
        } catch (error) {
            console.log('Plans fetch error:', error.message);
            dispatch({ type: 'FETCH_PLANS_SUCCESS', payload: BILLING_PLANS });
        }
    };


    const changePlan = async (planChangeData) => {
        if (!user?.results?.token) return { success: false, error: 'User not authenticated' };

        const membershipId = getMembershipId();
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        try {
            dispatch({ type: 'FETCH_START' });

            const response = await fetch(`${API_BASE_URL}/billing-subscription/change-plan`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.results.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    membership_id: membershipId,
                    ...planChangeData
                })
            });

            if (response.ok) {
                const result = await response.json();
                await fetchCurrentSubscription({ silent: true });
                await fetchPaymentHistory({ silent: true });
                return { success: true, data: result };
            } else {
                const errorData = await response.json();
                dispatch({ type: 'FETCH_ERROR', payload: errorData.message || 'Plan change failed' });
                return { success: false, error: errorData.message };
            }
        } catch (error) {
            dispatch({ type: 'FETCH_ERROR', payload: error.message });
            return { success: false, error: error.message };
        }
    };

    const recordPayment = async (paymentData) => {
        if (!user?.results?.token) return { success: false, error: 'User not authenticated' };

        const membershipId = getMembershipId();
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        try {
            // Ensure membership_id is included in the request body
            const requestBody = {
                membership_id: membershipId,
                ...paymentData
            };

            console.log('Recording payment with data:', requestBody);

            const response = await fetch(`${API_BASE_URL}/billing-payments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.results.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Payment recorded successfully:', result);

                // Refresh billing data after successful payment
                await fetchCurrentSubscription({ silent: true });
                await fetchPaymentHistory({ silent: true });

                return { success: true, data: result };
            } else {
                const errorData = await response.json();
                console.error('Payment failed:', errorData);
                return { success: false, error: errorData.message || 'Payment failed' };
            }
        } catch (error) {
            console.error('Payment error:', error);
            return { success: false, error: error.message };
        }
    };

    const payCycleBill = async (cyclePaymentData) => {
        if (!user?.results?.token) return { success: false, error: 'User not authenticated' };

        const membershipId = getMembershipId();
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        try {
            const response = await fetch(`${API_BASE_URL}/billing-payments/${membershipId}/pay-cycle`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.results.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cyclePaymentData)
            });

            if (response.ok) {
                const result = await response.json();
                await fetchCurrentSubscription({ silent: true });
                await fetchPaymentHistory({ silent: true });
                return { success: true, data: result };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const resetBillingData = () => {
        dispatch({ type: 'RESET_BILLING' });
    };

    const changeBillingCycle = async (billingCycle) => {
        if (!user?.results?.token) {
            return { success: false, error: 'User not authenticated' };
        }

        const membershipId = getMembershipId();
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        try {
            const response = await fetch(
                `${API_BASE_URL}/billing-subscription/${membershipId}/change-billing-cycle`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${user.results.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ billing_cycle: billingCycle }),
                }
            );

            const result = await response.json();

            if (response.ok && result.success) {
                await fetchCurrentSubscription({ silent: true });
                await fetchPaymentHistory({ silent: true });
                return {
                    success: true,
                    message: result.message,
                    data: result.data,
                };
            }

            return {
                success: false,
                error: result.message || 'Failed to change billing cycle',
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const triggerBillingCycle = async () => {
        if (!user?.results?.token) {
            return { success: false, error: 'User not authenticated' };
        }

        const membershipId = getMembershipId();
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        try {
            const response = await fetch(`${API_BASE_URL}/billing-payments/trigger-cycle`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    force: !IS_PRODUCTION_DEPLOY,
                    membership_id: membershipId,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                await fetchCurrentSubscription({ silent: true });
                await fetchPaymentHistory({ silent: true });
                return {
                    success: true,
                    message: result.message,
                    data: result.data,
                };
            }

            const detail = result.error || result.data?.errors?.[0]?.reason || result.data?.skipped?.[0]?.reason;
            return {
                success: false,
                error: detail || result.message || 'Failed to trigger billing cycle',
                data: result.data,
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };


    return (
        <BillingContext.Provider
            value={{
                subscription: state.subscription,
                payments: state.payments,
                billingCycleChangeWindow: state.billingCycleChangeWindow,
                availablePlans: state.availablePlans,
                isLoading: state.isLoading,
                isRefreshing: state.isRefreshing,
                hasLoaded: state.hasLoaded,
                error: state.error,
                fetchCurrentSubscription,
                fetchPaymentHistory,
                fetchAvailablePlans,
                changePlan,
                changeBillingCycle,
                recordPayment,
                payCycleBill,
                triggerBillingCycle,
                resetBillingData,
            }}
        >
            {children}
        </BillingContext.Provider>
    );
};

export const useBilling = () => {
    const context = useContext(BillingContext);
    if (!context) {
        throw new Error('useBilling must be used within a BillingProvider');
    }
    return context;
};