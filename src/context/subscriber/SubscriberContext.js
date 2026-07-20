import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';

const SubscriberContext = createContext();

export const SubscriberProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [groupDashboard, setGroupDashboard] = useState(null);
    const [transactionDashboard, setTransactionDashboard] = useState(null);
    const [groupDetails, setGroupDetails] = useState(null);

    // Check if user is a subscriber
    const isSubscriber = (userData) => {
        return userData?.results?.userAccounts?.some(account =>
            account.accountName === 'Subscriber'
        );
    };

    // Authentication methods
    const signIn = async (credentials) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/signin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (data.error === false && isSubscriber(data)) {
                setUser(data.results);
                setIsAuthenticated(true);
                localStorage.setItem('subscriber_token', data.results.token);
                localStorage.setItem('subscriber_user', JSON.stringify(data.results));
                return { success: true, data: data.results };
            } else {
                return { success: false, message: 'Not a subscriber account' };
            }
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, message: 'Sign in failed' };
        } finally {
            setLoading(false);
        }
    };

    const signOut = useCallback(() => {
        setUser(null);
        setIsAuthenticated(false);
        setGroupDashboard(null);
        setTransactionDashboard(null);
        setGroupDetails(null);
        localStorage.removeItem('subscriber_token');
        localStorage.removeItem('subscriber_user');
    }, []);

    // Data fetching methods
    const fetchGroupDashboard = useCallback(async (progress = 'INPROGRESS') => {
        if (!user?.token) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/subscribers/groups/dashboard?progress=${progress}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.error === false) {
                setGroupDashboard(data.results);
                return data.results;
            } else {
                throw new Error(data.message || 'Failed to fetch group dashboard');
            }
        } catch (error) {
            console.error('Error fetching group dashboard:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    const fetchTransactionDashboard = async (page = 1, size = 10) => {
        if (!user?.token) return;

        try {
            // Using the exact same endpoint as mobile app
            const response = await fetch(`${API_BASE_URL}/subscribers/group-transactions/dashboard?page=${page}&size=${size}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            // Check response exactly like mobile app does
            if (data.code === 200) {
                const transactionData = {
                    transactions: data.results.transactions || [],
                    totalItems: data.results.totalItems || 0,
                    totalPages: data.results.totalPages || 0,
                    currentPage: data.results.currentPage || page
                };
                setTransactionDashboard(transactionData);
                return transactionData;
            } else {
                throw new Error(data.message || 'Failed to fetch transaction dashboard');
            }
        } catch (error) {
            console.error('Error fetching transaction dashboard:', error);

            // If token expired, sign out
            if (error.message?.includes('Token Expired') || error.message?.includes('session has expired')) {
                signOut();
                return;
            }

            // Return empty state on error
            const emptyData = {
                transactions: [],
                totalItems: 0,
                totalPages: 0,
                currentPage: page
            };
            setTransactionDashboard(emptyData);
            return emptyData;
        }
    };

    const fetchGroupDetails = async (groupId, grpSubId) => {
        if (!user?.token) return;

        setLoading(true);
        try {
            const apiUrl = `${API_BASE_URL}/subscribers/groups/${groupId}/${grpSubId}`;
            console.log('🔍 ===== API CALL DEBUGGING =====');
            console.log('🔍 API URL:', apiUrl);
            console.log('🔍 Group ID:', groupId);
            console.log('🔍 Group Subscriber ID:', grpSubId);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log('🔍 API Response:', data);
            console.log('🔍 API Response Results:', data.results);

            if (data.results && data.results.outstandingAdvanceTransactionInfo) {
                console.log('🔍 Outstanding Advance Transaction Info:', data.results.outstandingAdvanceTransactionInfo);
                console.log('🔍 Outstanding Advance Transaction Info Length:', data.results.outstandingAdvanceTransactionInfo.length);
                if (data.results.outstandingAdvanceTransactionInfo.length > 0) {
                    console.log('🔍 First Transaction Sample:', data.results.outstandingAdvanceTransactionInfo[0]);
                    console.log('🔍 First Transaction Keys:', Object.keys(data.results.outstandingAdvanceTransactionInfo[0] || {}));
                }
            }

            if (data.error === false) {
                setGroupDetails(data.results);
                return data.results;
            } else {
                throw new Error(data.message || 'Failed to fetch group details');
            }
        } catch (error) {
            console.error('Error fetching group details:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Check authentication on app load
    useEffect(() => {
        const token = localStorage.getItem('subscriber_token');
        const userData = localStorage.getItem('subscriber_user');

        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Error parsing user data:', error);
                signOut();
            }
        }
    }, []);

    return (
        <SubscriberContext.Provider value={{
            user,
            isAuthenticated,
            loading,
            groupDashboard,
            transactionDashboard,
            groupDetails,
            signIn,
            signOut,
            fetchGroupDashboard,
            fetchTransactionDashboard,
            fetchGroupDetails,
            isSubscriber
        }}>
            {children}
        </SubscriberContext.Provider>
    );
};

export const useSubscriberContext = () => {
    const context = useContext(SubscriberContext);
    if (!context) {
        throw new Error('useSubscriberContext must be used within a SubscriberProvider');
    }
    return context;
};
