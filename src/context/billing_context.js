import React, { createContext, useReducer, useContext, useEffect, useMemo } from 'react';
import { useUserContext } from './user_context';
import { API_BASE_URL, IS_PRODUCTION_DEPLOY } from '../utils/apiConfig';
import { BILLING_PLANS, mergePlansWithCatalog } from '../utils/billingPlans';
import {
    DEFAULT_BILLING_APP_CODE,
    getBillingPathForApp,
    normalizeBillingAppCode,
} from '../utils/billingAppCodes';

const BillingContext = createContext();

const initialState = {
    subscription: null,
    payments: [],
    billingCycleChangeWindow: null,
    availablePlans: [],
    access: null,
    showTrialWelcome: false,
    trialInfo: null,
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
                access: action.payload.access ?? state.access,
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
        case 'SET_ACCESS':
            return {
                ...state,
                access: action.payload,
            };
        case 'SHOW_TRIAL_WELCOME':
            return {
                ...state,
                showTrialWelcome: true,
                trialInfo: action.payload,
            };
        case 'DISMISS_TRIAL_WELCOME':
            return {
                ...state,
                showTrialWelcome: false,
            };
        case 'FETCH_ERROR':
            return { ...state, isLoading: false, isRefreshing: false, error: action.payload };
        case 'RESET_BILLING':
            return initialState;
        default:
            return state;
    }
}

const withAppCodeQuery = (url, appCode) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}app_code=${encodeURIComponent(appCode)}`;
};

export const BillingProvider = ({
    children,
    appCode = DEFAULT_BILLING_APP_CODE,
    billingPath,
}) => {
    const { user } = useUserContext();
    const [state, dispatch] = useReducer(billingReducer, initialState);
    const resolvedAppCode = useMemo(
        () => normalizeBillingAppCode(appCode),
        [appCode]
    );
    const resolvedBillingPath = billingPath || getBillingPathForApp(resolvedAppCode);

    useEffect(() => {
        dispatch({ type: 'RESET_BILLING' });
    }, [resolvedAppCode]);

    useEffect(() => {
        if (user?.results?.token) {
            bootstrapBilling();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.results?.token, resolvedAppCode]);

    const getMembershipId = () => {
        const account = user?.results?.userAccounts?.[0];
        return account?.parent_membership_id || account?.membership_id || null;
    };

    const authHeaders = (extra = {}) => ({
        Authorization: `Bearer ${user.results.token}`,
        ...extra,
    });

    const ensureAppSubscription = async () => {
        const membershipId = getMembershipId();
        if (!membershipId || !user?.results?.token) return { success: false };

        try {
            const res = await fetch(
                withAppCodeQuery(
                    `${API_BASE_URL}/billing-subscription/${membershipId}/ensure`,
                    resolvedAppCode
                ),
                {
                    method: 'POST',
                    headers: authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ app_code: resolvedAppCode }),
                }
            );
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Failed to ensure app subscription');
            }
            const data = await res.json();
            if (data?.data?.access) {
                dispatch({ type: 'SET_ACCESS', payload: data.data.access });
            }
            if (data?.data?.created) {
                dispatch({
                    type: 'SHOW_TRIAL_WELCOME',
                    payload: data.data.trial || {
                        plan_id: 'VeryBasic',
                        monthly_amount: 100,
                        trial_days: 30,
                        status: 'paid',
                    },
                });
            }
            return {
                success: true,
                created: Boolean(data?.data?.created),
                trial: data?.data?.trial || null,
                access: data?.data?.access || null,
            };
        } catch (error) {
            console.error('Ensure app subscription error:', error.message);
            return { success: false, error: error.message };
        }
    };

    const dismissTrialWelcome = () => {
        dispatch({ type: 'DISMISS_TRIAL_WELCOME' });
    };

    const resumeAppSubscription = async () => {
        if (!user?.results?.token) {
            return { success: false, error: 'User not authenticated' };
        }
        const membershipId = getMembershipId();
        if (!membershipId) {
            return { success: false, error: 'Membership ID not found' };
        }

        try {
            const response = await fetch(
                withAppCodeQuery(
                    `${API_BASE_URL}/billing-subscription/${membershipId}/resume`,
                    resolvedAppCode
                ),
                {
                    method: 'POST',
                    headers: authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ app_code: resolvedAppCode }),
                }
            );
            const result = await response.json();
            if (response.ok && result.success) {
                await fetchCurrentSubscription({ silent: true });
                await fetchPaymentHistory({ silent: true });
                return { success: true, data: result.data };
            }
            return { success: false, error: result.message || 'Failed to resume' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const bootstrapBilling = async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            await ensureAppSubscription();
            await fetchCurrentSubscription({ silent: true });
            await fetchPaymentHistory({ silent: true });
            await fetchAvailablePlans();
        } catch (error) {
            dispatch({ type: 'FETCH_ERROR', payload: error.message || 'Failed to load billing' });
        }
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
            const res = await fetch(
                withAppCodeQuery(
                    `${API_BASE_URL}/billing-subscription/${membershipId}`,
                    resolvedAppCode
                ),
                { headers: authHeaders() }
            );

            if (!res.ok) {
                throw new Error(`Failed to fetch subscription: ${res.status}`);
            }

            const data = await res.json();

            if (data.success && data.data) {
                dispatch({
                    type: 'FETCH_SUBSCRIPTION_SUCCESS',
                    payload: {
                        subscription: data.data.subscription,
                        access: data.data.access || null,
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
            const res = await fetch(
                withAppCodeQuery(
                    `${API_BASE_URL}/billing-payments/${membershipId}`,
                    resolvedAppCode
                ),
                { headers: authHeaders() }
            );

            if (!res.ok) {
                throw new Error(`Failed to fetch payments: ${res.status}`);
            }

            const data = await res.json();

            if (data.success && data.data) {
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
                headers: authHeaders(),
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
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    membership_id: membershipId,
                    app_code: resolvedAppCode,
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
            const requestBody = {
                membership_id: membershipId,
                app_code: resolvedAppCode,
                ...paymentData
            };

            const response = await fetch(`${API_BASE_URL}/billing-payments`, {
                method: 'POST',
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const result = await response.json();
                await fetchCurrentSubscription({ silent: true });
                await fetchPaymentHistory({ silent: true });
                return { success: true, data: result };
            } else {
                const errorData = await response.json();
                return { success: false, error: errorData.message || 'Payment failed' };
            }
        } catch (error) {
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
            const response = await fetch(
                withAppCodeQuery(
                    `${API_BASE_URL}/billing-payments/${membershipId}/pay-cycle`,
                    resolvedAppCode
                ),
                {
                    method: 'POST',
                    headers: authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({
                        ...cyclePaymentData,
                        app_code: resolvedAppCode,
                    })
                }
            );

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
                withAppCodeQuery(
                    `${API_BASE_URL}/billing-subscription/${membershipId}/change-billing-cycle`,
                    resolvedAppCode
                ),
                {
                    method: 'POST',
                    headers: authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({
                        billing_cycle: billingCycle,
                        app_code: resolvedAppCode,
                    }),
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
                headers: authHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    force: !IS_PRODUCTION_DEPLOY,
                    membership_id: membershipId,
                    app_code: resolvedAppCode,
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
                appCode: resolvedAppCode,
                billingPath: resolvedBillingPath,
                subscription: state.subscription,
                payments: state.payments,
                access: state.access,
                showTrialWelcome: state.showTrialWelcome,
                trialInfo: state.trialInfo,
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
                resumeAppSubscription,
                dismissTrialWelcome,
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
