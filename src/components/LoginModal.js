import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { useLedgerAccountContext } from "../context/ledgerAccount_context";
import LoadingBar from './LoadingBar';
import Alert from './Alert';
import { API_BASE_URL } from '../utils/apiConfig';
import { isSuperAdminUser } from '../utils/superAdminUtils';
import { usePlatformAccess } from '../context/platformAccess_context';
import { clearAllAuthStorage } from '../utils/clearAuthStorage';
import { FiEye, FiEyeOff, FiPhone, FiLock, FiArrowRight, FiCheck, FiX } from 'react-icons/fi';

function LoginModal({ isOpen, onClose }) {
    const { login, updateUserRole } = useUserContext();
    const platform = usePlatformAccess();
    const { resetLedgerAccounts } = useLedgerAccountContext();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [list] = useState([]);
    const [alert, setAlert] = useState({ show: false, msg: '', type: '' });
    const [showSuccess, setShowSuccess] = useState(false);

    const history = useHistory();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setPhone('');
            setPassword('');
            setShowSuccess(false);
            setAlert({ show: false, msg: '', type: '' });
        }
    }, [isOpen]);

    const showAlert = (show = false, type = '', msg = '') => {
        setAlert({ show, type, msg });
    };

    const handleLogin = async (e) => {
        const apiUrl = `${API_BASE_URL}/signin`;
        e.preventDefault();
        setIsLoading(true);
        showAlert(false);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone, password }),
            });

            if (response.ok) {
                clearAllAuthStorage();
                resetLedgerAccounts();
                platform?.clearActiveContext?.();

                const data = await response.json();
                login(data);

                if (isSuperAdminUser(data)) {
                    updateUserRole('SuperAdmin');
                    onClose();
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
                onClose();
                history.push('/app-selection');
            } else {
                const eresponseData = await response.json();
                console.error('Sign-in failed');
                showAlert(true, 'danger', eresponseData.message);
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert(true, 'danger', 'Network error. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Define the condition for button disablement
    const isButtonDisabled = !phone || !password || isLoading;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                        <p className="text-sm text-gray-600 mt-1">Sign in to your Mytreasure account</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <FiX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}

                    {isLoading && <LoadingBar />}

                    {showSuccess ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiCheck className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Login Successful!</h3>
                            <p className="text-gray-600">Redirecting to your dashboard...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Phone Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <div className="relative">
                                    <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                        placeholder="Enter your password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isButtonDisabled}
                                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${isButtonDisabled
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
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
                    )}

                    {/* Signup Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <button
                                onClick={() => {
                                    onClose();
                                    // You can add logic to open signup modal here
                                }}
                                className="text-red-600 hover:underline font-medium"
                            >
                                Sign Up
                            </button>
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default LoginModal;
