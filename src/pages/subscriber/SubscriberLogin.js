import React, { useState } from 'react';
import { useSubscriberContext } from '../../context/subscriber/SubscriberContext';
import { useHistory } from 'react-router-dom';
import { FiUser } from 'react-icons/fi';

const SubscriberLogin = () => {
    const { signIn, loading } = useSubscriberContext();
    const history = useHistory();

    const [credentials, setCredentials] = useState({
        phone: '',
        password: ''
    });
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
        setError(''); // Clear error when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!credentials.phone || !credentials.password) {
            setError('Please fill in all fields');
            return;
        }

        const result = await signIn(credentials);

        if (result.success) {
            history.push('/app-selection');
        } else {
            setError(result.message || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
                            <FiUser className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex items-center justify-center mb-4">
                            <img src="/logo.png" alt="Mytreasure" className="w-16 h-16 mr-4 rounded-xl shadow-lg object-contain bg-white/10 p-2" />
                            <h1 className="text-3xl font-bold text-white">Mytreasure</h1>
                        </div>
                        <p className="text-red-100 text-lg font-medium">Subscriber Portal</p>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Phone Input */}
                            <div className="space-y-2">
                                <label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={credentials.phone}
                                    onChange={handleInputChange}
                                    placeholder="Enter your phone number"
                                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                                    required
                                />
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={credentials.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                                    required
                                />
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                                    <p className="text-red-700 font-medium text-center">{error}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:transform-none disabled:shadow-none"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Signing In...</span>
                                    </div>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8">
                    <p className="text-gray-600 text-sm">
                        Secure access to your chit fund groups
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SubscriberLogin;
