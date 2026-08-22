import { createContext, useContext, useReducer } from 'react';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from './user_context';


const GroupsDetailsContext = createContext();

const initialState = {
    groups: [],               // All groups list
    premium: [],              // Earned Premium
    profits: [],              // Earned Profit
    selectedGroupDetails: {}, // One group detail
    isLoading: false,
    error: null,
};

const groupsDetailsReducer = (state, action) => {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, isLoading: true, error: null };

        case 'FETCH_ALL_GROUPS_SUCCESS':
            return {
                ...state,
                isLoading: false,
                groups: action.payload.groups || [],
                premium: action.payload.earnedPremium || [],
                profits: action.payload.earnedProfit || [],
            };

        case 'FETCH_SINGLE_GROUP_SUCCESS':
            return {
                ...state,
                isLoading: false,
                selectedGroupDetails: action.payload?.results || {},
            };

        case 'FETCH_ERROR':
            return { ...state, isLoading: false, error: action.payload };

        case 'DELETE_GROUP_START':
            return { ...state, isLoading: true, error: null };

        case 'DELETE_GROUP_SUCCESS':
            return {
                ...state,
                isLoading: false,
                groups: [], // Clear groups array - will be refetched
                premium: [],
                profits: [],
                selectedGroupDetails: {},
            };

        case 'DELETE_GROUP_ERROR':
            return { ...state, isLoading: false, error: action.payload };

        default:
            return state;
    }
};

export const GroupsDetailsProvider = ({ children }) => {
    const [state, dispatch] = useReducer(groupsDetailsReducer, initialState);
    const { user } = useUserContext();

    // ✅ Fetch all groups
    const fetchAllGroups = async () => {
        dispatch({ type: 'FETCH_START' });
        try {
            const response = await fetch(`${API_BASE_URL}/users/groups`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch all groups');

            const data = await response.json();
            console.log("From group context")
            console.log(data)
            dispatch({ type: 'FETCH_ALL_GROUPS_SUCCESS', payload: data.results });
        } catch (error) {
            dispatch({ type: 'FETCH_ERROR', payload: error.message });
            console.error('Error fetching all groups:', error);
        }
    };

    // ✅ Fetch one group by ID
    const fetchGroupById = async (groupId) => {
        dispatch({ type: 'FETCH_START' });
        try {
            const response = await fetch(`${API_BASE_URL}/users/groups/${groupId}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch group details');

            const data = await response.json();
            console.log('from Group details')
            console.log(data)
            dispatch({ type: 'FETCH_SINGLE_GROUP_SUCCESS', payload: data });
        } catch (error) {
            dispatch({ type: 'FETCH_ERROR', payload: error.message });
            console.error('Error fetching group by ID:', error);
        }
    };

    // ✅ Delete group and refetch all groups
    const deleteGroup = async (groupId) => {
        dispatch({ type: 'DELETE_GROUP_START' });
        try {
            const response = await fetch(`${API_BASE_URL}/groups/${groupId}/complete`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete group');
            }

            const data = await response.json();
            console.log('Group deleted successfully:', data);

            // Dispatch success and then refetch all groups
            dispatch({ type: 'DELETE_GROUP_SUCCESS', payload: { groupId } });

            // Refetch all groups to get the latest data
            await fetchAllGroups();

        } catch (error) {
            dispatch({ type: 'DELETE_GROUP_ERROR', payload: error.message });
            console.error('Error deleting group:', error);
            throw error; // Re-throw so component can handle it
        }
    };

    const previewDeleteGroup = async (groupId) => {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/complete/delete-preview`, {
            headers: {
                Authorization: `Bearer ${user?.results?.token}`,
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        if (!response.ok || data.error) {
            throw new Error(data.message || 'Failed to load delete preview');
        }
        return data.results || data;
    };

    return (
        <GroupsDetailsContext.Provider
            value={{
                state,
                dispatch,
                fetchAllGroups,
                fetchGroupById,
                deleteGroup,
                previewDeleteGroup,
            }}
        >
            {children}
        </GroupsDetailsContext.Provider>
    );
};

export const useGroupsDetailsContext = () => useContext(GroupsDetailsContext);
