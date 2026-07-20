import React, { createContext, useReducer, useContext, useEffect, useCallback } from "react";
import { useUserContext } from "./user_context";
import { usePlatformAccess } from "./platformAccess_context";
import { API_BASE_URL } from "../utils/apiConfig";

const ProductContext = createContext();

const initialState = {
    products: [],
    loading: false,
    error: null,
};

function productReducer(state, action) {
    switch (action.type) {
        case "FETCH_START":
            return { ...state, loading: true, error: null };
        case "FETCH_SUCCESS":
            return { ...state, loading: false, products: action.payload };
        case "FETCH_ERROR":
            return { ...state, loading: false, error: action.payload };
        case "ADD_PRODUCT_SUCCESS":
            return { ...state, products: [...state.products, action.payload] };
        case "UPDATE_PRODUCT_SUCCESS":
            return {
                ...state,
                products: state.products.map(product =>
                    product.id === action.payload.id ? action.payload : product
                )
            };
        case "DELETE_PRODUCT_SUCCESS":
            return {
                ...state,
                products: state.products.filter(product => product.id !== action.payload)
            };
        case "RESET_PRODUCTS":
            return { ...state, products: [], loading: false, error: null };
        default:
            return state;
    }
}

export const ProductProvider = ({ children }) => {
    const { user } = useUserContext();
    const platform = usePlatformAccess();
    const [state, dispatch] = useReducer(productReducer, initialState);
    const userAccounts = user?.results?.userAccounts || [];
    const membershipId = platform?.activeContext?.parentMembershipId
        ?? userAccounts.find((account) => account?.parent_membership_id)?.parent_membership_id
        ?? userAccounts[0]?.parent_membership_id
        ?? userAccounts[0]?.membershipId;

    const loadProducts = useCallback(async () => {
        if (!user?.results?.token) return;

        if (!membershipId) {
            dispatch({ type: "FETCH_ERROR", payload: "Membership ID not found" });
            return;
        }

        dispatch({ type: "FETCH_START" });
        try {
            const res = await fetch(`${API_BASE_URL}/products`, {
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                },
            });

            if (!res.ok) throw new Error("Failed to fetch products");
            const data = await res.json();
            dispatch({ type: "FETCH_SUCCESS", payload: data.results || [] });
        } catch (error) {
            dispatch({ type: "FETCH_ERROR", payload: error.message });
        }
    }, [user?.results?.token, membershipId]);

    const addProduct = async (newProduct) => {
        if (!user?.results?.token) return { success: false, message: "User not authenticated" };

        try {
            console.log('ProductContext: Sending POST request to:', `${API_BASE_URL}/products`);
            console.log('ProductContext: Request body:', JSON.stringify(newProduct, null, 2));

            const startTime = Date.now();
            const res = await fetch(`${API_BASE_URL}/products`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newProduct),
            });

            const responseTime = Date.now() - startTime;
            console.log(`ProductContext: Response received in ${responseTime}ms:`, {
                status: res.status,
                statusText: res.statusText,
                ok: res.ok
            });

            return res;
        } catch (error) {
            console.error("Add product error:", error);
            return { success: false, message: error.message || "Unknown error occurred" };
        }
    };

    const updateProduct = async (productId, updatedProduct) => {
        if (!user?.results?.token) return { success: false, message: "User not authenticated" };

        try {
            console.log('ProductContext: Sending PUT request to:', `${API_BASE_URL}/products/${productId}`);
            console.log('ProductContext: Request body:', JSON.stringify(updatedProduct, null, 2));

            const startTime = Date.now();
            const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedProduct),
            });

            const responseTime = Date.now() - startTime;
            console.log(`ProductContext: Response received in ${responseTime}ms:`, {
                status: res.status,
                statusText: res.statusText,
                ok: res.ok
            });

            return res;
        } catch (error) {
            console.error("Update product error:", error);
            return { success: false, message: error.message || "Unknown error occurred" };
        }
    };

    const deleteProduct = async (productId) => {
        if (!user?.results?.token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) throw new Error("Failed to delete product");
            await loadProducts();
        } catch (error) {
            console.error("Delete product error:", error);
            throw error;
        }
    };

    const isProductNameUnique = (productName, excludeId = null) => {
        return !state.products.some(
            product =>
                product.productName?.toLowerCase() === productName.toLowerCase() &&
                product.id !== excludeId
        );
    };

    // Load products when user logs in
    useEffect(() => {
        if (user?.results?.token) {
            loadProducts();
        }
    }, [user?.results?.token, loadProducts]);

    return (
        <ProductContext.Provider
            value={{
                state,
                loadProducts,
                addProduct,
                updateProduct,
                deleteProduct,
                isProductNameUnique,
                membershipId,
            }}
        >
            {children}
        </ProductContext.Provider>
    );
};

export const useProductContext = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error("useProductContext must be used within a ProductProvider");
    }
    return context;
};
