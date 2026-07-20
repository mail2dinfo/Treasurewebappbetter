import React from 'react';
import { BILLING_PLANS } from '../utils/billingPlans';

const APP_LABELS = {
    CHIT_FUND: 'Chit Fund',
    DAILY_COLLECTION: 'Daily Collection',
    VEHICLE_FINANCE: 'Vehicle Finance',
    PERSONAL_LOAN: 'Personal Loan',
};

const BillingTrialWelcomeModal = ({
    open,
    appCode,
    trial,
    onContinue,
    onViewPlans,
}) => {
    if (!open) return null;

    const appLabel = APP_LABELS[appCode] || appCode;
    const plan = BILLING_PLANS.find((p) => p.id === 'VeryBasic') || BILLING_PLANS[0];
    const monthlyAmount = trial?.monthly_amount ?? plan?.price ?? 100;
    const trialDays = trial?.trial_days ?? 30;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="bg-custom-red px-6 py-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                        {appLabel}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">1 Month Free Trial</h2>
                    <p className="mt-2 text-sm text-white/90">
                        Your VeryBasic plan is active with paid (trial) status for {trialDays} days.
                    </p>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-green-800">VeryBasic plan</p>
                                <p className="text-xs text-green-700 mt-1">Trial Cycle 1 · Status: Paid</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-green-800">₹0</p>
                                <p className="text-xs text-green-700">for {trialDays} days</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                            After trial, monthly billing applies:
                        </p>
                        <ul className="space-y-2">
                            {BILLING_PLANS.map((item) => (
                                <li
                                    key={item.id}
                                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                                        item.id === 'VeryBasic'
                                            ? 'border-custom-red/30 bg-red-50'
                                            : 'border-gray-200 bg-gray-50'
                                    }`}
                                >
                                    <span className="font-medium text-gray-800">{item.name}</span>
                                    <span className="text-gray-700">₹{item.price}/month</span>
                                </li>
                            ))}
                        </ul>
                        <p className="mt-3 text-xs text-gray-500">
                            Current trial plan: VeryBasic (₹{monthlyAmount}/month after trial).
                            You can upgrade anytime from Billing.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 border-t border-gray-100 px-6 py-4">
                    {onViewPlans && (
                        <button
                            type="button"
                            onClick={onViewPlans}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            View billing
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onContinue}
                        className="flex-1 rounded-lg bg-custom-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                    >
                        Continue to {appLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillingTrialWelcomeModal;
