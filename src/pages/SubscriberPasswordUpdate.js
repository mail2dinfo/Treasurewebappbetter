import React, { useState, useEffect } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';
import Alert from '../components/Alert';
import loadingImage from '../images/preloader.gif';

const SubscriberPasswordUpdate = () => {
    const { id: subscriberId } = useParams();
    const history = useHistory();
    const location = useLocation();
    const { user } = useUserContext();
    const profilePath = location.pathname.replace(/\/update-password\/?$/, '')
        || `/chit-fund/user/subscriber/${subscriberId}`;

    const [loading, setLoading] = useState(false);
    const [subscriberData, setSubscriberData] = useState({
        name: '',
        phone: '',
        user_image: '',
        user_image_from_s3: '',
        user_image_base64format: ''
    });
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

    const showAlert = (show = false, type = '', msg = '') => {
        setAlert({ show, type, msg });
    };

    // Fetch subscriber data to populate the form
    const fetchSubscriberData = async () => {
        try {
            setLoading(true);
            const apiUrl = `${API_BASE_URL}/subscribers/${subscriberId}`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Failed to fetch subscriber data');

            const data = await response.json();
            if (data.results?.subscriberDetailsResult?.length > 0) {
                const subscriber = data.results.subscriberDetailsResult[0];
                setSubscriberData({
                    name: subscriber.name || subscriber.firstname + ' ' + subscriber.lastname || '',
                    phone: subscriber.phone || '',
                    user_image: subscriber.user_image || '',
                    user_image_from_s3: subscriber.user_image_from_s3 || '',
                    user_image_base64format: subscriber.user_image_base64format || ''
                });

                // Pre-populate password with first 4 digits of phone
                if (subscriber.phone) {
                    setNewPassword(subscriber.phone.substring(0, 4));
                    setConfirmPassword(subscriber.phone.substring(0, 4));
                }
            }
        } catch (error) {
            console.error('Error fetching subscriber data:', error);
            showAlert(true, 'danger', 'Failed to load subscriber data');
        } finally {
            setLoading(false);
        }
    };

    // Handle password update
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showAlert(true, 'danger', 'Passwords do not match');
            return;
        }

        if (newPassword.length < 4) {
            showAlert(true, 'danger', 'Password must be at least 4 characters long');
            return;
        }

        try {
            setLoading(true);
            const apiUrl = `${API_BASE_URL}/subscribers/${subscriberId}/update-password`;
            const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    newPassword: newPassword
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showAlert(true, 'success', data.message || 'Password updated successfully');
                setTimeout(() => {
                    history.push(profilePath);
                }, 2000);
            } else {
                const errorMsg = typeof data.errors === 'string'
                    ? data.errors
                    : (data.message || 'Failed to update password');
                showAlert(true, 'danger', errorMsg);
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showAlert(true, 'danger', 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (subscriberId) {
            fetchSubscriberData();
        }
    }, [subscriberId]);

    if (loading && !subscriberData.name) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <img src={loadingImage} alt="Loading..." className="mx-auto mb-4" />
                    <p className="text-gray-600">Loading subscriber data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-gray-900">Update Subscriber Password</h1>
                            <button
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                onClick={() => history.push(profilePath)}
                            >
                                ← Back to Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Alert */}
                {alert.show && (
                    <div className="mb-6">
                        <Alert {...alert} removeAlert={showAlert} />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Subscriber Info Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="text-center mb-6">
                                <div className="relative inline-block">
                                    {subscriberData.user_image_from_s3 || subscriberData.user_image_base64format || subscriberData.user_image ? (
                                        <img
                                            src={subscriberData.user_image_from_s3 || subscriberData.user_image_base64format || subscriberData.user_image}
                                            alt="Subscriber Avatar"
                                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                                            onError={(e) => {
                                                // Fallback to avatar if image fails to load
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className={`w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg ${subscriberData.user_image_from_s3 || subscriberData.user_image_base64format || subscriberData.user_image ? 'hidden' : ''}`}
                                    >
                                        {subscriberData.name ? subscriberData.name.charAt(0).toUpperCase() : 'S'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscriber Information</h3>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                                            {subscriberData.name || 'N/A'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                                            {subscriberData.phone || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Password Update Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <form onSubmit={handlePasswordUpdate} className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Password</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                                New Password
                                            </label>
                                            <input
                                                type="password"
                                                id="newPassword"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                                required
                                                minLength="4"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                            <p className="mt-2 text-sm text-gray-500">
                                                Password is pre-populated with first 4 digits of phone number. You can edit it to your preference.
                                            </p>
                                        </div>

                                        <div>
                                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                                Confirm Password
                                            </label>
                                            <input
                                                type="password"
                                                id="confirmPassword"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                                required
                                                minLength="4"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="submit"
                                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Updating...
                                            </>
                                        ) : (
                                            'Update Password'
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => history.push(profilePath)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SubscriberPasswordUpdate;
