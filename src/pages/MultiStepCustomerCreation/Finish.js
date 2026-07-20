import React, { useContext } from 'react';
import AppContext from './Context';
import { CheckCircle, Home, UserPlus } from 'lucide-react';

import { useUserContext } from '../../context/user_context';
import { useHistory } from 'react-router-dom';

const Finish = () => {
    const { isLoggedIn } = useUserContext();
    const myContext = useContext(AppContext);

    const { stepDetails, personalDetails, password: tempPassword } = myContext || {};
    const { setStep } = stepDetails || {};
    const password = tempPassword ?? "Not Available";
    const subscriberName = personalDetails?.subscriberName ?? "Subscriber";

    const history = useHistory();

    const handleBackButtonClick = () => {
        history.push('/chit-fund/user/home'); // Redirect to the home page
    };

    const handleMultiStepSubscriber = () => {
        if (setStep) {
            setStep(0); // Reset to step 0
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl">
                <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-8 text-center relative">
                    <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
                    <div className="relative z-10 mb-4 inline-block animate-pulse">
                        <CheckCircle size={48} />
                    </div>
                    <h2 className="relative z-10 text-3xl font-bold mb-2 font-['Poppins']">Registration Complete!</h2>
                    <p className="relative z-10 text-base opacity-95 leading-relaxed">
                        New Subscriber <strong>{subscriberName}</strong> has been created successfully.
                    </p>
                </div >

                <div className="p-8">
                    <div className="mb-6">
                        <p className="text-gray-600 leading-relaxed">
                            Thank you for providing your details. Your subscriber account is now active and ready to use.
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 mb-8 border-l-4 border-red-600">
                        <h4 className="text-red-600 text-lg font-semibold mb-4 font-['Poppins']">Account Information</h4>
                        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 flex justify-between items-center mb-3 transition-colors duration-300 hover:border-red-600">
                            <span className="font-medium text-gray-600">Temporary Password:</span>
                            <span className="font-bold text-red-600 font-mono text-lg bg-gray-50 px-2 py-1 rounded">
                                {password}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 italic">
                            Please save this password securely. You can change it after your first login.
                        </p>
                    </div>

                    <div className="flex gap-4 flex-wrap">
                        {isLoggedIn && (
                            <button
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold cursor-pointer transition-all duration-300 flex-1 justify-center min-w-[150px] hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/30"
                                onClick={handleBackButtonClick}
                            >
                                <Home size={18} />
                                Back to Home
                            </button>
                        )}

                        <button
                            className="flex items-center gap-2 px-6 py-3 bg-white text-red-600 border-2 border-red-600 rounded-lg font-semibold cursor-pointer transition-all duration-300 flex-1 justify-center min-w-[150px] hover:bg-red-600 hover:text-white hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/30"
                            onClick={handleMultiStepSubscriber}
                        >
                            <UserPlus size={18} />
                            Add Another Subscriber
                        </button>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default Finish;
