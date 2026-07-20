
// import { createContext, useContext, useReducer } from 'react';
// import React from 'react';

// const GroupDetailsContext = createContext();

// const initialState = {
//     data: null,
//     // other initial state properties...
// };

// const groupDetailsReducer = (state, action) => {
//     switch (action.type) {
//         case 'SET_DATA':
//             return { ...state, data: action.payload };
//         // handle other actions as needed...
//         default:
//             return state;
//     }
// };

// export const GroupDetailsProvider = ({ children }) => {
//     const [state, dispatch] = useReducer(groupDetailsReducer, initialState);

//     return (
//         <GroupDetailsContext.Provider value={{ state, dispatch }}>
//             {children}
//         </GroupDetailsContext.Provider>
//     );
// };


// export const useGroupDetailsContext = () => {
//     return useContext(GroupDetailsContext);
// };

// context/group_context.js
import React, { createContext, useContext } from "react";
import { useUserContext } from "./user_context";
import { API_BASE_URL } from "../utils/apiConfig";

const GroupDetailsContext = createContext();

const initialState = {
  data: null,
  isLoading: false,
  error: null,
  subscribers: [],
  noofSubscriber: 0,
  noofCompanySubscriber: 0

};

function groupDetailsReducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };
    case "FETCH_SUCCESS":
      return { ...state, isLoading: false, data: action.payload };
    case "FETCH_SUBSCRIBERS_SUCCESS":
      return {
        ...state,
        isLoading: false,
        subscribers: action.payload.subscriberList || [],
        noofSubscriber: action.payload.noofSubscriber || 0,
        noofCompanySubscriber: action.payload.noofCompanySubscriber || 0,
      };
    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };
    default:
      return state;
  }
}

export const GroupDetailsProvider = ({ children }) => {
  const { user } = useUserContext();
  const [state, dispatch] = React.useReducer(
    groupDetailsReducer,
    initialState
  );

  const fetchGroups = React.useCallback(async (groupId) => {
    if (!user?.results?.token || !groupId) return;

    dispatch({ type: "FETCH_START" });
    try {
      const res = await fetch(`${API_BASE_URL}/users/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${user.results.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch groups: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (error) {
      console.error("Error fetching groups:", error);
      dispatch({ type: "FETCH_ERROR", payload: error.message });
    }
  }, [user?.results?.token]);

  const fetchSubscribers = async (groupId) => {
    if (!user?.results?.token || !groupId) return;

    dispatch({ type: "FETCH_START" });
    try {
      const apiUrl = `${API_BASE_URL}/groups/${groupId}/subscribers`;
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscribers");
      }

      const data = await response.json();

      dispatch({
        type: "FETCH_SUBSCRIBERS_SUCCESS",
        payload: {
          subscriberList: data?.results?.subscriberList || [],
          noofSubscriber:
            data?.results?.subscriberCountList?.[0]?.No_of_Sub_Pending || 0,
          noofCompanySubscriber:
            data?.results?.compSubCountList?.[0]
              ?.no_of_company_subcribers || 0,
        },
      });
    } catch (error) {
      console.error(error);
      dispatch({ type: "FETCH_ERROR", payload: error.message });
    }
  };

  const deleteGroupSubscriber = async (id, groupId) => {
    if (!id) {
      return { success: false, message: "Subscriber ID is required" };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/groupsubscribers/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        // Refresh group data and subscribers
        if (groupId) {
          await fetchGroups(groupId);

        }

        return { success: true, message: "Subscriber removed successfully" };
      } else {
        const errorRes = await res.json();
        return { success: false, message: errorRes.message || "Failed to delete subscriber" };
      }
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      return { success: false, message: "An error occurred while deleting subscriber" };
    }
  };



  const deleteGroupSubscriberbyCompositekey = async (
    groupId,
    subscriberId,
    groupSubscriberId
  ) => {
    if (!groupId || !subscriberId || !groupSubscriberId) {
      return { success: false, message: "Missing required IDs for deletion" };
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/groupsubscribers/${groupId}/${subscriberId}/${groupSubscriberId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user?.results?.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await res.json();

      if (res.ok) {
        await fetchGroups(groupId);
        await fetchSubscribers(groupId); // refresh only subscribers
        return { success: true, message: result.message || "Subscriber removed successfully" };
      } else {
        return { success: false, message: result.message || "Failed to delete subscriber" };
      }
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      return { success: false, message: "An error occurred while deleting subscriber" };
    }
  };

  // Scenario 1: Check deletion scenario
  const checkDeletionScenario = async (groupId, subscriberId, groupSubscriberId) => {
    console.log('🔍 Frontend - checkDeletionScenario called with:', { groupId, subscriberId, groupSubscriberId });

    if (!groupId || !subscriberId || !groupSubscriberId) {
      return { success: false, message: "Missing required IDs for scenario analysis" };
    }

    try {
      const url = `${API_BASE_URL}/groupsubscribers/${groupId}/${subscriberId}/${groupSubscriberId}/scenario`;
      console.log('🔍 Frontend - API URL:', url);
      console.log('🔍 Frontend - Token available:', !!user?.results?.token);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      console.log('🔍 Frontend - checkDeletionScenario response:', result);
      console.log('🔍 Frontend - Response status:', res.status);
      console.log('🔍 Frontend - Response ok:', res.ok);

      if (res.ok) {
        console.log('🔍 Frontend - Success: returning data:', result.results);
        return { success: true, data: result.results };
      } else {
        console.log('🔍 Frontend - Error: response not ok, message:', result.message);
        return { success: false, message: result.message || "Failed to check deletion scenario" };
      }
    } catch (error) {
      console.error("Error checking deletion scenario:", error);
      return { success: false, message: "An error occurred while checking deletion scenario" };
    }
  };

  // Scenario 1: Enhanced deletion with scenario support
  const deleteGroupSubscriberWithScenario = async (groupId, subscriberId, groupSubscriberId, action = 'remove_only') => {
    console.log('🔍 Frontend - deleteGroupSubscriberWithScenario called with:', { groupId, subscriberId, groupSubscriberId, action });

    if (!groupId || !subscriberId || !groupSubscriberId) {
      return { success: false, message: "Missing required IDs for deletion" };
    }

    try {
      const requestBody = {
        action: action,
        ...(action === 'replace' && { replacementSubscriberId: groupSubscriberId }) // This will be updated when replacement is selected
      };

      const res = await fetch(
        `${API_BASE_URL}/groupsubscribers/${groupId}/${subscriberId}/${groupSubscriberId}/enhanced`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user?.results?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody)
        }
      );

      const result = await res.json();
      console.log('🔍 Frontend - deleteGroupSubscriberWithScenario response:', result);

      if (res.ok) {
        await fetchGroups(groupId);
        await fetchSubscribers(groupId);
        return { success: true, message: result.message || "Subscriber processed successfully" };
      } else {
        return { success: false, message: result.message || "Failed to process subscriber" };
      }
    } catch (error) {
      console.error("Error processing subscriber:", error);
      return { success: false, message: "An error occurred while processing subscriber" };
    }
  };

  // Scenario 1: Replace subscriber
  const replaceGroupSubscriber = async (groupId, oldSubscriberId, oldGroupSubscriberId, newSubscriberId, scenario = 1) => {
    console.log('🔍 Frontend - replaceGroupSubscriber called with:', { groupId, oldSubscriberId, oldGroupSubscriberId, newSubscriberId, scenario });

    if (!groupId || !oldSubscriberId || !oldGroupSubscriberId || !newSubscriberId) {
      return { success: false, message: "Missing required IDs for replacement" };
    }

    try {
      const requestBody = {
        group_id: groupId,
        old_subscriber_id: oldSubscriberId,
        group_subscriber_id: oldGroupSubscriberId,
        new_subscriber_id: newSubscriberId,
        scenario: scenario  // Use the passed scenario parameter
      };

      console.log('🔍 Frontend - replaceGroupSubscriber request body:', requestBody);
      console.log('🔍 Frontend - API URL:', `${API_BASE_URL}/groupsubscribers/replace`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const res = await fetch(
        `${API_BASE_URL}/groupsubscribers/replace`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user?.results?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      const result = await res.json();
      console.log('🔍 Frontend - replaceGroupSubscriber response:', result);

      if (res.ok) {
        await fetchGroups(groupId);
        await fetchSubscribers(groupId);
        return { success: true, message: result.message || "Subscriber replaced successfully" };
      } else {
        return { success: false, message: result.message || "Failed to replace subscriber" };
      }
    } catch (error) {
      console.error("🔍 Frontend - replaceGroupSubscriber error:", error);
      console.error("🔍 Frontend - Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        type: typeof error,
        cause: error.cause
      });

      // More specific error messages
      let errorMessage = "Unknown error occurred";
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage = "Network connection failed. Please check your internet connection.";
      } else if (error.name === "AbortError") {
        errorMessage = "Request was cancelled or timed out.";
      } else if (error.message.includes("Failed to fetch")) {
        errorMessage = "Server is not responding. Please try again later.";
      } else {
        errorMessage = `Network error: ${error.message}`;
      }

      return { success: false, message: errorMessage };
    }
  };


  const contextValue = React.useMemo(() => ({
    ...state,
    fetchGroups,
    fetchSubscribers,
    deleteGroupSubscriberbyCompositekey,
    deleteGroupSubscriber,
    checkDeletionScenario,
    deleteGroupSubscriberWithScenario,
    replaceGroupSubscriber
  }), [state, fetchGroups, fetchSubscribers, deleteGroupSubscriberbyCompositekey, deleteGroupSubscriber, checkDeletionScenario, deleteGroupSubscriberWithScenario, replaceGroupSubscriber]);

  return (
    <GroupDetailsContext.Provider value={contextValue}>
      {children}
    </GroupDetailsContext.Provider>
  );
};

export const useGroupDetailsContext = () => useContext(GroupDetailsContext);

