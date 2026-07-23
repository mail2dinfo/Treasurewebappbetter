import React, { createContext, useState, useContext, useReducer, useEffect } from 'react';
import reducer from '../reducers/user_reducer'
import { SIDEBAR_CLOSE, SIDEBAR_OPEN } from '../actions'
import { clearAllAuthStorage } from '../utils/clearAuthStorage'
const initialState = {
  isSidebarOpen: false,
}
const UserContext = createContext();

export const useUserContext = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Store user details here
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole')); // Store user role here

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
        console.log('User restored from localStorage:', userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        clearAllAuthStorage();
      }
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.results?.token) {
      localStorage.setItem('token', userData.results.token);
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setUserRole(null);
    // Clear every auth/portal session so the next user cannot inherit this one
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

    console.log('After update');
    console.log(user);
  };
  useEffect(() => {
    console.log('After update');
    console.log(user);
  }, [user]);


  const [state, dispatch] = useReducer(reducer, initialState)

  const openSidebar = () => {
    dispatch({ type: SIDEBAR_OPEN })
  }

  const closeSidebar = () => {
    dispatch({ type: SIDEBAR_CLOSE })
  }

  // Function to update user role (for future role selection)
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
