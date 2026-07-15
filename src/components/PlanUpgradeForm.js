import React, { useState } from 'react';
import {
    getBillingCycleOptionsForPlan,
} from '../utils/billingCycleConfig';

const PlanUpgradeForm = ({ selectedPlan, currentPlan, onBack, onProceedToPayment }) => {
    const [selectedBillingCycle, setSelectedBillingCycle] = useState('monthly');

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const getBillingCycleOptions = () => {
        return getBillingCycleOptionsForPlan(selectedPlan?.price || 0);
    };

    const handleProceed = () => {
        const billingCycleOptions = getBillingCycleOptions();
        const selectedOption = billingCycleOptions.find(option => option.id === selectedBillingCycle);

        const startDate = new Date().toISOString().split('T')[0];

        const billingDetails = {
            subscription_id: currentPlan?.id,
            plan_id: selectedPlan.id,
            plan_name: selectedPlan.name,
            plan_type: selectedOption.label,
            amount: selectedOption.price,
            currency: 'INR',
            billing_cycle: selectedBillingCycle,
            plan_start_date: startDate,
            plan_end_date: null,
            status: 'active',
            remaining_days: selectedOption.multiplier * 30,
            auto_renew: false,
            features: selectedPlan.features,
        };

        onProceedToPayment({
            billingDetails,
            amount: selectedOption.price,
            planName: selectedPlan.name,
            billingCycleLabel: selectedOption.label,
        });
    };

    const billingCycleOptions = getBillingCycleOptions();
    const selectedOption = billingCycleOptions.find(option => option.id === selectedBillingCycle);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Plan Upgrade</h2>
                    <p className="text-gray-600">Review your plan upgrade details and choose billing cycle before proceeding to payment.</p>
                </div>

                {/* Current Plan */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Plan</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-gray-900">{currentPlan?.name || 'No Plan'}</h4>
                                <p className="text-sm text-gray-600">Current subscription</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-900">{formatAmount(currentPlan?.price || 0)}</p>
                                <p className="text-sm text-gray-600">Plan price</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selected Plan */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">New Plan</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-medium text-gray-900">{selectedPlan?.name}</h4>
                                <p className="text-sm text-gray-600">Upgraded subscription</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-red-600">{formatAmount(selectedPlan?.price)}</p>
                                <p className="text-sm text-gray-600">Plan price</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Billing Cycle Selection */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Choose Billing Cycle</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {billingCycleOptions.map((option) => (
                            <div
                                key={option.id}
                                className={`overflow-hidden rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedBillingCycle === option.id
                                    ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                                    : 'border-gray-200 hover:border-red-300'
                                    }`}
                                onClick={() => setSelectedBillingCycle(option.id)}
                            >
                                {option.discountPercent > 0 && (
                                    <div className="bg-emerald-600 px-3 py-2 text-center">
                                        <p className="text-sm font-bold uppercase tracking-wide text-white">
                                            {option.discountPercent}% OFF
                                        </p>
                                        <p className="text-xs font-bold text-emerald-100">
                                            Save {formatAmount(option.savings)}
                                        </p>
                                    </div>
                                )}
                                <div className="p-4 text-center">
                                    <h4 className="font-semibold text-gray-900 mb-1">{option.label}</h4>
                                    <p className="text-2xl font-bold text-gray-900 mb-1">
                                        {formatAmount(option.price)}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">for {option.period}</p>
                                    <p className="text-xs text-gray-500">{option.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Summary</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">{selectedPlan?.name} Plan ({selectedOption.label})</span>
                                <span className="font-medium">{formatAmount(selectedOption.price)}</span>
                            </div>
                            {selectedOption.savings > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Discount ({selectedOption.discountPercent}%)</span>
                                    <span className="font-medium">-{formatAmount(selectedOption.savings)}</span>
                                </div>
                            )}
                            <hr className="my-2" />
                            <div className="flex justify-between text-lg font-semibold">
                                <span>Total Amount to Pay</span>
                                <span className="text-red-600">{formatAmount(selectedOption.price)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Comparison */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Plan Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">{currentPlan?.name || 'Current Plan'}</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Basic features</li>
                                <li>• Standard support</li>
                            </ul>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">{selectedPlan?.name}</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                {selectedPlan?.features?.map((feature, index) => (
                                    <li key={index}>• {feature}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <button
                        onClick={onBack}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
                    >
                        Back to Plans
                    </button>
                    <button
                        onClick={handleProceed}
                        className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
                    >
                        Pay {formatAmount(selectedOption.price)} Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlanUpgradeForm;
