import React from 'react';
import { FiX } from 'react-icons/fi';
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
    onClose,
}) => {
    if (!open) return null;

    const appLabel = APP_LABELS[appCode] || appCode;
    const plan = BILLING_PLANS.find((p) => p.id === 'VeryBasic') || BILLING_PLANS[0];
    const monthlyAmount = trial?.monthly_amount ?? plan?.price ?? 100;
    const trialDays = trial?.trial_days ?? 30;
    const handleClose = onClose || onContinue;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
            <div
                className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby="trial-welcome-title"
            >
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-3 top-3 z-10 rounded-lg p-2 text-white/90 transition hover:bg-white/15 hover:text-white"
                    aria-label="Close and return to app selection"
                >
                    <FiX className="h-5 w-5" />
                </button>

                <div className="bg-custom-red px-6 py-5 pr-12 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                        {appLabel}
                    </p>
                    <h2 id="trial-welcome-title" className="mt-1 text-2xl font-bold">
                        1 Month Free Trial
                    </h2>
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

                <div className="flex border-t border-gray-100 px-6 py-4">
                    <button
                        type="button"
                        onClick={onContinue}
                        className="w-full rounded-lg bg-custom-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                    >
                        Continue to {appLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillingTrialWelcomeModal;
