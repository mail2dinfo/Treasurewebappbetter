import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../user_context';

const DcSubscriberContext = createContext();

const initialState = {
    subscribers: [],
    isLoading: false,
    error: null,
};

function dcSubscriberReducer(state, action) {
    switch (action.type) {
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
                    subscriber.dc_cust_id === action.payload.dc_cust_id
                        ? action.payload
                        : subscriber
                ),
                isLoading: false
            };
        case 'DELETE_SUBSCRIBER':
            return {
                ...state,
                subscribers: state.subscribers.filter(
                    subscriber => subscriber.dc_cust_id !== action.payload
                ),
                isLoading: false
            };
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

export function DcSubscriberProvider({ children }) {
    const [state, dispatch] = useReducer(dcSubscriberReducer, initialState);
    const { user } = useUserContext();

    // Fetch all subscribers by membership
    const fetchSubscribers = useCallback(async () => {
        console.log('=== FETCH DC SUBSCRIBERS START ===');
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
            const url = `${API_BASE_URL}/dc/subscribers?parent_membership_id=${membershipId}`;
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
                throw new Error(errorData.message || "Failed to fetch subscribers");
            }

            const data = await res.json();
            console.log('✅ API Response:', data);
            console.log('Subscribers from API:', data.results);

            dispatch({ type: 'SET_SUBSCRIBERS', payload: data.results?.subscribers || data.results || [] });
            dispatch({ type: 'CLEAR_ERROR' });
            console.log('=== FETCH DC SUBSCRIBERS END ===');
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            console.error('❌ Error fetching subscribers:', error);
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
                dc_cust_name: subscriberData.dc_cust_name,
                dc_cust_dob: subscriberData.dc_cust_dob || null,
                dc_cust_age: subscriberData.dc_cust_age || null,
                dc_cust_phone: subscriberData.dc_cust_phone || '',
                dc_cust_photo: subscriberData.dc_cust_photo || '',
                dc_cust_address: subscriberData.dc_cust_address || '',
                latitude: subscriberData.latitude || null,
                longitude: subscriberData.longitude || null,
                dc_cust_aadhaar_frontside: subscriberData.dc_cust_aadhaar_frontside || '',
                dc_cust_aadhaar_backside: subscriberData.dc_cust_aadhaar_backside || '',
                dc_nominee_name: subscriberData.dc_nominee_name || '',
                dc_nominee_phone: subscriberData.dc_nominee_phone || '',
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/dc/subscribers`, {
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

            dispatch({ type: 'ADD_SUBSCRIBER', payload: result.results?.subscriber || result.results });
            return {
                success: true,
                data: result.results?.subscriber || result.results,
                message: result.message || 'Subscriber created successfully',
            };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error creating subscriber:', error);
            return { success: false, error: errorMessage };
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
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
                dc_cust_name: subscriberData.dc_cust_name,
                dc_cust_dob: subscriberData.dc_cust_dob || null,
                dc_cust_age: subscriberData.dc_cust_age || null,
                dc_cust_phone: subscriberData.dc_cust_phone || '',
                dc_cust_photo: subscriberData.dc_cust_photo || '',
                dc_cust_address: subscriberData.dc_cust_address || '',
                latitude: subscriberData.latitude || null,
                longitude: subscriberData.longitude || null,
                dc_cust_aadhaar_frontside: subscriberData.dc_cust_aadhaar_frontside || '',
                dc_cust_aadhaar_backside: subscriberData.dc_cust_aadhaar_backside || '',
                dc_nominee_name: subscriberData.dc_nominee_name || '',
                dc_nominee_phone: subscriberData.dc_nominee_phone || '',
            };

            const res = await fetch(`${API_BASE_URL}/dc/subscribers/${subscriberId}`, {
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

            dispatch({ type: 'UPDATE_SUBSCRIBER', payload: response.data.results?.subscriber || response.data.results });
            return { success: true, data: response.data.results?.subscriber || response.data.results };
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

            const res = await fetch(`${API_BASE_URL}/dc/subscribers/${subscriberId}`, {
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

    // Clear error
    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const value = {
        subscribers: state.subscribers,
        isLoading: state.isLoading,
        error: state.error,
        fetchSubscribers,
        createSubscriber,
        updateSubscriber,
        deleteSubscriber,
        clearError,
    };

    return (
        <DcSubscriberContext.Provider value={value}>
            {children}
        </DcSubscriberContext.Provider>
    );
}

export const useDcSubscriberContext = () => {
    const context = useContext(DcSubscriberContext);
    if (!context) {
        throw new Error('useDcSubscriberContext must be used within DcSubscriberProvider');
    }
    return context;
};

