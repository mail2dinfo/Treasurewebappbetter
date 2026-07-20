import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import ReactFlagsSelect from "react-flags-select";
import "./flags.css";
import LoadingBar from './LoadingBar';
import Alert from './Alert';
import { API_BASE_URL } from '../utils/apiConfig';
import { FiEye, FiEyeOff, FiLock, FiMail, FiPhone, FiArrowRight, FiCheck, FiX } from 'react-icons/fi';

function SignupModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        phone: '',
        email: '',
        password: '',
        country: 'Auto-detect',
        countryCode: 'auto',
        sourceSystem: 'WEB',
    });

    const [otp, setOtp] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('auto');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [list] = useState([]);
    const [alert, setAlert] = useState({ show: false, msg: '', type: '' });
    const [showSuccess, setShowSuccess] = useState(false);

    const countries = [
        { value: "IN", label: "India", countryCode: "+91" },
        { value: "GB", label: "United Kingdom", countryCode: "+44" },
        { value: "LK", label: "Srilanka", countryCode: "+94" },
        { value: "NP", label: "Nepal", countryCode: "+977" },
        { value: "MY", label: "Malaysia", countryCode: "+60" },
        { value: "AE", label: "United Arab Emirates", countryCode: "+971" },
        { value: "SG", label: "Singapore", countryCode: "+65" },
        { value: "PK", label: "Pakistan", countryCode: "+92" },
        { value: "NG", label: "Nigeria", countryCode: "+234" },
        { value: "GH", label: "Ghana", countryCode: "+233" },
        { value: "TT", label: "Trinidad and Tobago", countryCode: "+1-868" },
        { value: "KE", label: "Kenya", countryCode: "+254" },
        { value: "ZA", label: "South Africa", countryCode: "+27" }
    ];

    const showSelectedLabel = true;
    const searchable = true;
    const history = useHistory();

    const detectUserCountry = async () => {
        try {
            const response = await fetch('https://ip-api.com/json/');
            if (response.ok) {
                const data = await response.json();
                console.log('Detected Country Data:', data);
                // Find the corresponding country object in the countries array
                const detectedCountry = countries.find(
                    (country) => country.value === data.countryCode
                );

                if (detectedCountry) {
                    // Update the selectedCountry state with the detected country code
                    setSelectedCountry(detectedCountry.value);
                    // Update the formData with the detected country details
                    setFormData((prevData) => ({
                        ...prevData,
                        country: detectedCountry.label,
                        countryCode: detectedCountry.countryCode,
                    }));
                }
            }
        } catch (error) {
            console.error('Error detecting user country:', error);
        }
    };

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                phone: '',
                email: '',
                password: '',
                country: 'Auto-detect',
                countryCode: 'auto',
                sourceSystem: 'WEB',
            });
            setOtp('');
            setAgreedToTerms(false);
            setShowSuccess(false);
            setAlert({ show: false, msg: '', type: '' });
            setSelectedCountry('auto');
        }
    }, [isOpen]);

    // Detect user's country if not auto-detected
    useEffect(() => {
        if (selectedCountry === 'auto') {
            detectUserCountry();
        }
    }, [selectedCountry]);

    const showAlert = (show = false, type = '', msg = '') => {
        setAlert({ show, type, msg });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    const handleCountryChange = (value) => {
        setSelectedCountry(value);

        // Find the selected country object from the countries array
        const selectedCountryObj = countries.find((country) => country.value === value);

        if (selectedCountryObj) {
            // Reset the formData state with the country code and label from the selected country
            setFormData((prevData) => ({
                ...prevData,
                country: selectedCountryObj.label,
                countryCode: selectedCountryObj.countryCode,
            }));
        }
    };

    const handleCheckboxChange = (e) => {
        setAgreedToTerms(e.target.checked);
    };

    const handleSubmit = async (e) => {
        const apiUrl = `${API_BASE_URL}/signup`;

        e.preventDefault();
        setIsLoading(true);
        console.log(formData);

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            const responseData = await response.json();
            console.log('Signup response:', responseData);

            if (response.ok) {
                setShowSuccess(true);
                return;
            } else {
                showAlert(true, 'danger', responseData.message);
            }
        } catch (error) {
            console.error('Signup error:', error);
            showAlert(true, 'danger', 'Network error. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const isButtonDisabled = !agreedToTerms || !formData.phone || !formData.email || !formData.password;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Get Started Free</h2>
                        <p className="text-sm text-gray-600 mt-1">Join our finance management platform</p>
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
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Account Created!</h3>
                            <p className="text-gray-600">Please check your email for verification.</p>
                        </div>
                    ) : (
                        !showSuccess ? (
                            <>
                                {/* Country Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                    <div className="relative">
                                        <ReactFlagsSelect
                                            selected={selectedCountry}
                                            onSelect={handleCountryChange}
                                            countries={countries.map((country) => country.value)}
                                            showSelectedLabel={showSelectedLabel}
                                            searchable={searchable}
                                            className="w-full"
                                        />
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Phone Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FiPhone className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Enter your phone number"
                                                name="phone"
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                                            />
                                        </div>
                                    </div>

                                    {/* Email Input */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FiMail className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="Enter your email"
                                                name="email"
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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
                                                placeholder="Create a password"
                                                name="password"
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
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

                                    {/* Terms Checkbox */}
                                    <div className="flex items-start space-x-3">
                                        <div className="flex items-center h-5">
                                            <input
                                                type="checkbox"
                                                id="termsCheckbox"
                                                onChange={handleCheckboxChange}
                                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                            />
                                        </div>
                                        <label htmlFor="termsCheckbox" className="text-sm text-gray-600 leading-5">
                                            By continuing, you agree to our{' '}
                                            <span className="text-red-600 hover:text-red-600 cursor-pointer">Terms of Use</span>,{' '}
                                            <span className="text-red-600 hover:text-red-600 cursor-pointer">Privacy Policy</span>,{' '}
                                            <span className="text-red-600 hover:text-red-600 cursor-pointer">E-sign & communication Authorization</span>.
                                        </label>
                                    </div>

                                    {/* Sign Up Button */}
                                    <button
                                        type="submit"
                                        disabled={isButtonDisabled || isLoading}
                                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${isButtonDisabled || isLoading
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Signing Up...
                                            </>
                                        ) : (
                                            <>
                                                Create Account
                                                <FiArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>

                                {/* OTP Message */}
                                {otp && (
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm text-blue-700">OTP sent to your mobile: {otp}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Success State */
                            <div className="text-center py-8">
                                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                                    <FiCheck className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Mytreasure!</h2>
                                <p className="text-gray-600 mb-6">Your account has been created successfully.</p>
                                <button
                                    onClick={() => {
                                        onClose();
                                        // You can add logic to open login modal here
                                    }}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    <FiArrowRight className="w-4 h-4" />
                                    Sign In Now
                                </button>
                            </div>
                        )
                    )}

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                onClick={() => {
                                    onClose();
                                    history.push('/login');
                                }}
                                className="text-red-600 hover:underline font-medium"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignupModal;
