import React, { createContext, useState, useContext, useReducer, useEffect, useRef } from 'react';
import reducer from '../reducers/user_reducer'
import { SIDEBAR_CLOSE, SIDEBAR_OPEN } from '../actions'
import { clearAllAuthStorage } from '../utils/clearAuthStorage'
import { API_BASE_URL } from '../utils/apiConfig'

const initialState = {
  isSidebarOpen: false,
}
const UserContext = createContext();
const HEARTBEAT_MS = 3 * 60 * 1000; // every 3 minutes

export const useUserContext = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole'));
  const heartbeatRef = useRef(null);

  const persistSessionId = (sessionId) => {
    if (!sessionId) return;
    localStorage.setItem('login_session_id', sessionId);
  };

  const sendSessionHeartbeat = async (token) => {
    if (!token) return;
    try {
      const sessionId = localStorage.getItem('login_session_id');
      const res = await fetch(`${API_BASE_URL}/users/session/heartbeat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const nextId = data?.results?.login_session_id;
      if (nextId) persistSessionId(nextId);
    } catch (error) {
      // Non-blocking analytics path
      console.warn('Session heartbeat failed:', error.message || error);
    }
  };

  const endSessionOnServer = async (token) => {
    const sessionId = localStorage.getItem('login_session_id');
    if (!token || !sessionId) return;
    try {
      await fetch(`${API_BASE_URL}/users/session/end`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      });
    } catch (_) {
      /* ignore */
    }
  };

  // Initialize user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');

    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsLoggedIn(true);
        if (!localStorage.getItem('userRole')) {
          const restoredRole = userData?.results?.userAccounts?.[0]?.accountName;
          if (restoredRole) {
            setUserRole(restoredRole);
            localStorage.setItem('userRole', restoredRole);
          }
        }
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        clearAllAuthStorage();
      }
    }
  }, []);

  // Heartbeat while logged in (powers hours spent)
  useEffect(() => {
    if (!isLoggedIn || !user?.results?.token) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return undefined;
    }

    const token = user.results.token;
    sendSessionHeartbeat(token);
    heartbeatRef.current = setInterval(() => {
      sendSessionHeartbeat(token);
    }, HEARTBEAT_MS);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [isLoggedIn, user?.results?.token]);

  const login = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.results?.token) {
      localStorage.setItem('token', userData.results.token);
    }
    const sessionId = userData.results?.login_session_id;
    if (sessionId) {
      persistSessionId(sessionId);
    }
  };

  const logout = () => {
    const token = user?.results?.token || localStorage.getItem('token');
    endSessionOnServer(token);
    setUser(null);
    setIsLoggedIn(false);
    setUserRole(null);
    clearAllAuthStorage();
  };

  const updateUserDetails = async (responseData) => {
    setUser({
      ...user,
      results: {
        ...user.results,
        firstname: responseData.results.firstname,
        lastname: responseData.results.lastname,
        dob: responseData.results.dob,
        gender: responseData.results.gender,
        user_image: responseData.results.user_image,
      },
    });
  };

  const updateUserCompany = (newUserCompany) => {
    setUser({
      ...user,
      results: {
        ...user.results,
        userCompany: newUserCompany,
      },
    });
  };

  const [state, dispatch] = useReducer(reducer, initialState)

  const openSidebar = () => {
    dispatch({ type: SIDEBAR_OPEN })
  }

  const closeSidebar = () => {
    dispatch({ type: SIDEBAR_CLOSE })
  }

  const updateUserRole = (role) => {
    setUserRole(role);
    if (role) {
      localStorage.setItem('userRole', role);
    } else {
      localStorage.removeItem('userRole');
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoggedIn, isLoading, setIsLoading, login, logout, ...state, openSidebar, closeSidebar, updateUserCompany, userRole, updateUserRole, updateUserDetails }}>
      {children}
    </UserContext.Provider>
  );
};
