import React from 'react';
import { mergePlansWithCatalog } from '../utils/billingPlans';

const PlansSelection = ({ currentPlan, availablePlans, onSelectPlan }) => {
    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const isCurrentPlan = (plan) => {
        if (!currentPlan || !currentPlan.name) return false;

        // Normalize plan names for comparison
        const currentPlanName = currentPlan.name.toLowerCase().trim();
        const planName = plan.name.toLowerCase().trim();

        // Direct exact match
        if (currentPlanName === planName) return true;

        // Handle variations like "VeryBasic Plan" vs "VeryBasic" 
        // Extract the core plan name (remove "Plan" suffix if present)
        const currentCoreName = currentPlanName.replace(/\s+plan$/, '');
        const planCoreName = planName.replace(/\s+plan$/, '');

        // Match core names exactly
        if (currentCoreName === planCoreName) return true;

        return false;
    };

    const plans = mergePlansWithCatalog(availablePlans);

    const getPlanCardClass = (plan) => {
        const baseClass = "relative rounded-lg shadow-sm border-2 p-6 transition-all duration-200";

        if (isCurrentPlan(plan)) {
            return `${baseClass} bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed`;
        }

        return `${baseClass} bg-white border-gray-200 hover:border-red-300 hover:shadow-md`;
    };

    const getPlanButtonClass = (plan) => {
        const baseClass = "w-full px-4 py-2 rounded-md font-medium transition duration-200";

        if (isCurrentPlan(plan)) {
            return `${baseClass} bg-gray-400 text-gray-600 cursor-not-allowed`;
        }

        return `${baseClass} bg-red-600 text-white hover:bg-red-700`;
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
                <p className="text-lg text-gray-600">
                    Select the perfect plan for your business needs
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {plans.map((plan) => {
                    const isCurrentPlanFlag = isCurrentPlan(plan);

                    return (
                        <div key={plan.id} className={getPlanCardClass(plan)}>
                            {isCurrentPlanFlag && (
                                <>
                                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                            Active Plan
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg z-5"></div>
                                </>
                            )}

                            <div className={`text-center ${isCurrentPlanFlag ? 'relative z-0' : ''}`}>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                                <div className="mb-4">
                                    <span className="text-4xl font-bold text-gray-900">
                                        {formatAmount(plan.price)}
                                    </span>
                                    <p className="text-sm text-gray-500 mt-1">Plan price</p>
                                </div>

                                <ul className="text-left space-y-2 mb-6">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <svg className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-sm text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => {
                                        if (!isCurrentPlanFlag) {
                                            onSelectPlan(plan);
                                        }
                                    }}
                                    disabled={isCurrentPlanFlag}
                                    className={getPlanButtonClass(plan)}
                                >
                                    {isCurrentPlanFlag ? 'Active Plan' : 'Select Plan'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Additional Information */}
            <div className="mt-12 text-center">
                <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help Choosing?</h3>
                    <p className="text-gray-600 mb-4">
                        All plans include 24/7 support and can be upgraded or downgraded at any time.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200">
                            Contact Support
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200">
                            View Features Comparison
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlansSelection;

