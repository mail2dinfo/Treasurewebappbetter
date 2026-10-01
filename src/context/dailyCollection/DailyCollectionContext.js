import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useUserContext } from '../user_context';

const DailyCollectionContext = createContext();

const initialState = {
    companies: [],
    products: [],
    loans: [],
    selectedLoan: null,
    isLoading: false,
    error: null,
};

function dailyCollectionReducer(state, action) {
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
        case 'SET_PRODUCTS':
            return { ...state, products: action.payload, isLoading: false };
        case 'ADD_PRODUCT':
            return {
                ...state,
                products: [action.payload, ...state.products],
                isLoading: false
            };
        case 'UPDATE_PRODUCT':
            if (!action.payload?.id) {
                return { ...state, isLoading: false };
            }
            return {
                ...state,
                products: state.products.map(product =>
                    product.id === action.payload.id
                        ? action.payload
                        : product
                ),
                isLoading: false
            };
        case 'DELETE_PRODUCT':
            return {
                ...state,
                products: state.products.filter(
                    product => product.id !== action.payload
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
        case 'SET_SELECTED_LOAN':
            return { ...state, selectedLoan: action.payload, isLoading: false };
        case 'DELETE_LOAN':
            return {
                ...state,
                loans: state.loans.filter(loan => loan.id !== action.payload),
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

export function DailyCollectionProvider({ children }) {
    const [state, dispatch] = useReducer(dailyCollectionReducer, initialState);
    const { user } = useUserContext();

    // Fetch all companies
    const fetchCompanies = useCallback(async () => {
        console.log('=== FETCH COMPANIES START ===');
        console.log('User token:', user?.results?.token ? 'Present' : 'Missing');
        console.log('API Base URL:', API_BASE_URL);

        if (!user?.results?.token) {
            console.log('❌ User not authenticated');
            return { success: false, error: "User not authenticated" };
        }

        // Get membership ID like other functions
        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        console.log('Parent membership ID:', membershipId);

        if (!membershipId) {
            console.log('❌ No membership ID found');
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const url = `${API_BASE_URL}/dc/companies?parent_membership_id=${membershipId}`;
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
            dispatch({ type: 'CLEAR_ERROR' }); // Clear any previous errors
            console.log('=== FETCH COMPANIES END ===');
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

            const res = await fetch(`${API_BASE_URL}/dc/companies`, {
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

            const res = await fetch(`${API_BASE_URL}/dc/companies`, {
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

            const res = await fetch(`${API_BASE_URL}/dc/company/${companyId}`, {
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

    // Fetch all products
    const fetchProducts = useCallback(async () => {
        console.log('=== FETCH PRODUCTS START ===');
        console.log('User token:', user?.results?.token ? 'Present' : 'Missing');
        console.log('API Base URL:', API_BASE_URL);
        console.log('Full user object:', user);
        console.log('User results:', user?.results);
        console.log('User accounts:', user?.results?.userAccounts);
        console.log('First account:', user?.results?.userAccounts?.[0]);
        console.log('Parent membership ID:', user?.results?.userAccounts?.[0]?.parent_membership_id);

        if (!user?.results?.token) {
            console.log('❌ User not authenticated');
            return { success: false, error: "User not authenticated" };
        }

        // Try to get membership ID from different possible locations
        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id ||
            user?.results?.userAccounts?.[0]?.membershipId ||
            user?.results?.membershipId ||
            user?.membershipId;

        console.log('Extracted membership ID:', membershipId);

        if (!membershipId) {
            console.log('❌ No membership ID found');
            return { success: false, error: 'Membership ID not found' };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            // Add membership ID as query parameter
            const url = `${API_BASE_URL}/dc/products?parent_membership_id=${membershipId}`;
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
                throw new Error(errorData.message || "Failed to fetch products");
            }

            const data = await res.json();
            console.log('✅ API Response:', data);
            console.log('Products from API:', data.results);

            dispatch({ type: 'SET_PRODUCTS', payload: data.results || [] });
            dispatch({ type: 'CLEAR_ERROR' }); // Clear any previous errors
            console.log('=== FETCH PRODUCTS END ===');
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            console.error('❌ Error fetching products:', error);
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Create product
    const createProduct = async (productData) => {
        if (!user?.results?.token) return { success: false, error: "User not authenticated" };

        // Try to get membership ID from different possible locations
        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id ||
            user?.results?.userAccounts?.[0]?.membershipId ||
            user?.results?.membershipId ||
            user?.membershipId;

        if (!membershipId) {
            return { success: false, error: "Membership ID not found" };
        }

        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const payload = {
                productName: productData.product_name,
                frequency: productData.frequency,
                duration: parseInt(productData.duration),
                interestRate: parseFloat(productData.interest_rate || 0),
                membershipId: membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/dc/products`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                return { success: false, error: result.message || "Failed to create product" };
            }

            dispatch({ type: 'ADD_PRODUCT', payload: result.results });
            return { success: true, data: result.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error creating product:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Update product
    const updateProduct = async (productId, productData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;

            if (!token) throw new Error('Authentication token not found');

            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id ||
                user?.results?.userAccounts?.[0]?.membershipId ||
                user?.results?.membershipId ||
                user?.membershipId;

            const payload = {
                productId: productId,
                productName: productData.product_name,
                frequency: productData.frequency,
                duration: parseInt(productData.duration, 10),
                interestRate: parseFloat(productData.interest_rate || 0),
                membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/dc/products`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to update product");
            }

            dispatch({ type: 'UPDATE_PRODUCT', payload: data.results });
            dispatch({ type: 'CLEAR_ERROR' });
            return { success: true, data: data.results };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            dispatch({ type: 'SET_LOADING', payload: false });
            console.error('Error updating product:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Delete product
    const deleteProduct = async (productId) => {
        console.log("=== DELETE PRODUCT START ===");
        console.log("Product ID to delete:", productId);

        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;

            if (!token) {
                console.error("❌ Authentication token not found");
                throw new Error('Authentication token not found');
            }

            console.log("Making DELETE request to:", `${API_BASE_URL}/dc/products/${productId}`);

            const res = await fetch(`${API_BASE_URL}/dc/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            console.log("Response status:", res.status);
            console.log("Response ok:", res.ok);

            if (!res.ok) {
                const errorData = await res.json();
                console.error("❌ Delete failed with error:", errorData);
                throw new Error(errorData.message || "Failed to delete product");
            }

            const result = await res.json();
            console.log("✅ Delete successful, result:", result);

            dispatch({ type: 'DELETE_PRODUCT', payload: productId });
            console.log("=== DELETE PRODUCT END ===");
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            console.error("❌ Error deleting product:", error);
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    };

    // Fetch all loans
    const fetchLoans = useCallback(async (status = null) => {
        console.log('=== FETCH LOANS START ===');
        console.log('Status parameter:', status);
        console.log('User token:', user?.results?.token ? 'Present' : 'Missing');

        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) {
                console.log('❌ No token found');
                return;
            }

            // Get membership ID from user context
            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            console.log('Membership ID:', membershipId);

            if (!membershipId) {
                console.log('❌ No membership ID found');
                throw new Error('Membership ID not found');
            }

            // Build URL with membership ID and status
            let url = `${API_BASE_URL}/dc/loans?parent_membership_id=${membershipId}`;
            if (status) {
                url += `&status=${status}`;
            }

            console.log('Fetching loans from URL:', url);

            const res = await fetch(url, {
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

                // Handle specific database schema errors
                if (errorData.message && errorData.message.includes('company_id')) {
                    throw new Error("Database schema issue: Missing company_id column. Please contact support.");
                }

                throw new Error(errorData.message || "Failed to fetch loans");
            }

            const response = { data: await res.json() };
            console.log('✅ API Response:', response.data);
            console.log('Loans from API:', response.data.results);
            console.log('Number of loans:', response.data.results?.length || 0);

            // Debug first loan structure
            if (response.data.results && response.data.results.length > 0) {
                console.log('=== API RESPONSE DEBUG ===');
                console.log('First loan from API:', JSON.stringify(response.data.results[0], null, 2));
                console.log('First loan product:', response.data.results[0]?.product);
                console.log('=== END API RESPONSE DEBUG ===');
            }

            dispatch({ type: 'SET_LOANS', payload: response.data.results || [] });
            console.log('=== FETCH LOANS END ===');
            return { success: true };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            console.error('❌ Error fetching loans:', error);
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            return { success: false, error: errorMessage };
        }
    }, [user]);

    // Disburse new loan (using existing backend API)
    const disburseLoan = async (loanData) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) throw new Error('Authentication token not found');

            const payload = {
                subscriberId: loanData.subscriberId || loanData.subscriber_id,
                productId: loanData.productId || loanData.product_id,
                principalAmount: parseFloat(loanData.principalAmount || loanData.principal_amount),
                startDate: loanData.startDate || loanData.start_date,
                firstDueDate: loanData.firstDueDate || loanData.first_due_date,
                excludeDays: loanData.excludeDays || loanData.exclude_days || [],
            };

            const res = await fetch(`${API_BASE_URL}/dc/loans/disburse`, {
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

            dispatch({ type: 'ADD_LOAN', payload: result.data.loan });
            return { success: true, data: result.data };
        } catch (error) {
            const errorMessage = error.message || "Unknown error occurred";
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error disbursing loan:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Get loan details with receivables
    const getLoanDetails = async (loanId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) throw new Error('Authentication token not found');

            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            if (!membershipId) throw new Error('Membership ID not found');

            const url = `${API_BASE_URL}/dc/loans/${loanId}?parent_membership_id=${membershipId}`;
            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to fetch loan details");
            }

            const response = { data: await res.json() };

            dispatch({ type: 'SET_SELECTED_LOAN', payload: response.data.results });
            return { success: true, data: response.data.results };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error fetching loan details:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Delete loan with cascade deletion
    const deleteLoan = async (loanId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const token = user?.results?.token;
            if (!token) throw new Error('Authentication token not found');

            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            if (!membershipId) throw new Error('Membership ID not found');

            const res = await fetch(`${API_BASE_URL}/dc/loans/${loanId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    membershipId: membershipId
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Failed to delete loan");
            }

            const result = await res.json();

            // Remove loan from state
            dispatch({ type: 'DELETE_LOAN', payload: loanId });

            // Refresh loans list to ensure UI is up to date
            await fetchLoans();

            // Trigger day book refresh event for any open day book tabs
            // This ensures UI updates immediately after loan deletion
            const responseData = result.data || result.results || result;
            window.dispatchEvent(new CustomEvent('loanDeleted', { 
                detail: { 
                    loanId, 
                    affectedDates: responseData?.affectedDates || [],
                    cascadeFromDate: responseData?.cascadeFromDate,
                    accountBalanceUpdates: responseData?.accountBalanceUpdates || []
                } 
            }));

            return { success: true, data: result };
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            console.error('Error deleting loan:', error);
            return { success: false, error: errorMessage };
        }
    };

    // Clear error
    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    const value = {
        companies: state.companies,
        products: state.products,
        loans: state.loans,
        selectedLoan: state.selectedLoan,
        isLoading: state.isLoading,
        error: state.error,
        fetchCompanies,
        createCompany,
        updateCompany,
        deleteCompany,
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
        fetchLoans,
        disburseLoan,
        getLoanDetails,
        deleteLoan,
        clearError,
    };

    return (
        <DailyCollectionContext.Provider value={value}>
            {children}
        </DailyCollectionContext.Provider>
    );
}

export const useDailyCollectionContext = () => {
    const context = useContext(DailyCollectionContext);
    if (!context) {
        throw new Error('useDailyCollectionContext must be used within DailyCollectionProvider');
    }
    return context;
};

