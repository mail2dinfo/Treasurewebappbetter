import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { useLedgerAccountContext } from "../context/ledgerAccount_context";
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import { API_BASE_URL } from '../utils/apiConfig';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import { usePlatformAccess } from '../context/platformAccess_context';
import { clearAllAuthStorage } from '../utils/clearAuthStorage';
import { FiEye, FiEyeOff, FiUser, FiLock, FiArrowRight } from 'react-icons/fi';

function Login() {
  const { login, updateUserRole } = useUserContext();
  const platform = usePlatformAccess();
  const { resetLedgerAccounts } = useLedgerAccountContext();

  const [list] = useState([]);
  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const history = useHistory();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    const apiUrl = `${API_BASE_URL}/signin`;
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password }),
      });

      if (response.ok) {
        // Wipe previous user's sessions before writing this user's
        clearAllAuthStorage();
        resetLedgerAccounts();
        platform?.clearActiveContext?.();

        const data = await response.json();
        login(data);

        if (isSuperAdminUser(data)) {
          updateUserRole('SuperAdmin');
          history.push('/super-admin');
          return;
        }

        const userAccounts = data?.results?.userAccounts || [];
        const customerApps = data?.results?.customerApps || [];
        const accountNames = userAccounts.map(
          (account) => String(account.accountName || '').toUpperCase()
        );
        const hasCollectorRole = accountNames.some((name) => name.includes('COLLECTOR'));
        const hasSubscriberRole = accountNames.some((name) => name.includes('SUBSCRIBER'))
          || customerApps.length > 0;

        // Pre-seed portal tokens only for the current user (after clear)
        if (hasCollectorRole && data?.results?.token) {
          localStorage.setItem('collector_token', data.results.token);
          localStorage.setItem('collector_user', JSON.stringify(data.results));
          localStorage.setItem('vf_collector_token', data.results.token);
          localStorage.setItem('vf_collector_user', JSON.stringify(data.results));
        }

        if (hasSubscriberRole && data?.results?.token) {
          localStorage.setItem('subscriber_token', data.results.token);
          localStorage.setItem('subscriber_user', JSON.stringify(data.results));
        }

        if (!userAccounts.length && !customerApps.length) {
          showAlert(true, 'danger', 'No active account found for this user.');
          return;
        }

        await platform?.loadSession(data?.results?.token);
        updateUserRole(userAccounts[0]?.accountName || accountNames[0] || 'Subscriber');
        // Every login goes to Finance Hub / App Selection
        history.push('/app-selection');
      } else {
        const eresponseData = await response.json();
        console.error('Sign-in failed');
        showAlert(true, 'danger', eresponseData.message);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const showAlert = (show = false, type = '', msg = '') => {
    setAlert({ show, type, msg });
  };
  const isButtonDisabled = !phone || !password || isLoading;

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

    </div>
  );
}

export default Login;
