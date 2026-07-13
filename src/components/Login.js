import React, { useState, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { useLedgerAccountContext } from "../context/ledgerAccount_context";
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import { API_BASE_URL } from '../utils/apiConfig';
import Modal from "../components/Modal";
import { FiEye, FiEyeOff, FiUser, FiLock, FiArrowRight } from 'react-icons/fi';

function Login() {
  const { login, updateUserRole } = useUserContext();
  const { resetLedgerAccounts } = useLedgerAccountContext();

  const [list, setList] = useState([]);
  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const history = useHistory();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userRole, setUserRole] = useState(null); // State to hold user details
  // Access the AuthContext
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userObjectFromAPI, setUserObjectFromAPI] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    const apiUrl = `${API_BASE_URL}/signin`;
    e.preventDefault();
    setIsLoading(true); // Show loading bar when login starts
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      });

      if (response.ok) {
        //Clear all the previus data:
        resetLedgerAccounts();
        // Successful sign-in, navigate to home page
        //userObjectFromAPI = await response.json(); // Capture the user object from the API

        const data = await response.json();
        setUserObjectFromAPI(data);
        // Set the user object in the AuthContext
        login(data);
        setUserRole(data?.results?.userAccounts); // Set the captured user object in the state

        // This logic is not working nee dto revisit
        if (data?.results?.userAccounts.length === 1) {
          // Redirect to the role choosing page
          const selectedRole = data?.results?.userAccounts[0]?.accountName || 'User';

          updateUserRole(selectedRole);
          redirectPage(selectedRole);

        } else {
          setShowModal(true);

        }





      } else {
        const eresponseData = await response.json();
        // Handle sign-in error
        console.error('Sign-in failed');
        showAlert(true, 'danger', eresponseData.message);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false); // Hide loading bar when login is complete
    }
  };
  const showAlert = (show = false, type = '', msg = '') => {

    setAlert({ show, type, msg });
  };
  // Define the condition for button disablement
  const isButtonDisabled = !phone || !password || isLoading;

  const handleRoleSelect = (selectedRole) => {
    updateUserRole(selectedRole);
    setShowModal(false); // Close the modal after role selection
    redirectPage(selectedRole)
  };

  const redirectPage = (selectedRole) => {

    console.log(selectedRole);
    console.log(userObjectFromAPI?.results?.userId);

    if (selectedRole.includes('User') || selectedRole.includes('Manager')) {
      history.push('/app-selection');
    } else if (selectedRole.includes('Subscriber')) {
      history.push('/chit-fund/subscriber');
    } else if (selectedRole.includes('Accountant')) {
      history.push('/accountant-page');
    } else if (selectedRole.includes('Collector')) {
      const collectorUser = userObjectFromAPI?.results;
      if (collectorUser?.token) {
        localStorage.setItem('collector_token', collectorUser.token);
        localStorage.setItem('collector_user', JSON.stringify(collectorUser));
      }
      history.push(`/chit-fund/collector/receivables`);
    } else {
      // Handle unknown account names
      history.push('/unknown-account-page');
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Alert */}
        {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-custom-red to-red-600 px-8 py-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              <FiUser className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-red-100 mt-2">Sign in to your Treasure account</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Phone Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isButtonDisabled}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${isButtonDisabled
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-custom-red to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Logging In...
                  </>
                ) : (
                  <>
                    Login
                    <FiArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 space-y-3 text-center">
              <p className="text-sm text-gray-600">
                New to Treasure?{' '}
                <Link
                  to="/signup"
                  className="text-custom-red hover:text-red-600 font-medium transition-colors duration-200"
                >
                  Create Account
                </Link>
              </p>
              <p className="text-sm">
                <Link
                  to="/forgotpassword"
                  className="text-gray-500 hover:text-custom-red transition-colors duration-200"
                >
                  Forgot Password?
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 Treasure. All rights reserved.
          </p>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Select Your Role</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {userRole && userRole.map((role) => (
                <label
                  key={role.accountName}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-custom-red cursor-pointer transition-all duration-200"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.accountName}
                    onChange={() => handleRoleSelect(role.accountName)}
                    className="w-4 h-4 text-custom-red border-gray-300 focus:ring-custom-red"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {role.accountName}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Login;
