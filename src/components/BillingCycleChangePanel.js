import React, { useEffect, useState } from 'react';
import Loading from './Loading';
import {
    formatBillingCycleLabel,
    getBillingCycleOptionsForPlan,
    getBasePlanPrice,
} from '../utils/billingCycleConfig';

const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

const BillingCycleChangePanel = ({
    subscription,
    billingCycleChangeWindow,
    onChangeBillingCycle,
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCycle, setSelectedCycle] = useState(subscription?.billing_cycle || 'monthly');

    const isWindowOpen = Boolean(billingCycleChangeWindow?.is_open);

    useEffect(() => {
        setSelectedCycle(subscription?.billing_cycle || 'monthly');
    }, [subscription?.billing_cycle, billingCycleChangeWindow?.is_open]);

    if (!subscription) {
        return null;
    }

    const planId = subscription.plan_id || subscription.plan_name;
    const currentCycle = subscription.billing_cycle || 'monthly';
    const nextCycleNumber = billingCycleChangeWindow?.next_cycle_number;
    const basePlanPrice = getBasePlanPrice(planId);
    const billingCycleOptions = getBillingCycleOptionsForPlan(basePlanPrice);

    const handleSubmit = async () => {
        if (!isWindowOpen) {
            return;
        }

        if (selectedCycle === currentCycle) {
            alert(`Billing cycle is already ${formatBillingCycleLabel(currentCycle)}.`);
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await onChangeBillingCycle(selectedCycle);
            if (result.success) {
                alert(result.message || 'Billing cycle updated successfully.');
            } else {
                alert(result.error || 'Failed to update billing cycle.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusMessage = () => {
        if (isWindowOpen) {
            return (
                <>
                    Cycle {billingCycleChangeWindow.latest_cycle_number} has ended. You have{' '}
                    <strong>{billingCycleChangeWindow.days_left} day{billingCycleChangeWindow.days_left === 1 ? '' : 's'}</strong>{' '}
                    to choose billing for Cycle {nextCycleNumber} before it is created.
                </>
            );
        }

        if (billingCycleChangeWindow?.message) {
            return billingCycleChangeWindow.message;
        }

        return (
            <>
                Billing cycle can be changed for <strong>5 days</strong> after your current cycle ends,
                before the next cycle is created.
            </>
        );
    };

    return (
        <div className="mt-6 border-t border-gray-200 pt-6">
            <div
                className={`mb-4 rounded-lg border p-4 ${
                    isWindowOpen
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 bg-gray-50'
                }`}
            >
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900">
                        Billing cycle for next period
                    </h3>
                    <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            isWindowOpen
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                        {isWindowOpen ? 'Change enabled' : 'Change disabled'}
                    </span>
                </div>
                <p className={`mt-1 text-sm ${isWindowOpen ? 'text-blue-800' : 'text-gray-600'}`}>
                    {getStatusMessage()}
                </p>
                {!isWindowOpen && billingCycleChangeWindow?.latest_cycle_end_date && (
                    <p className="mt-1 text-xs text-gray-500">
                        Latest cycle ends {billingCycleChangeWindow.latest_cycle_end_date}.
                    </p>
                )}
            </div>

            <p className="mb-3 text-sm text-gray-600">
                Current billing cycle:{' '}
                <span className="font-medium capitalize text-gray-900">
                    {formatBillingCycleLabel(currentCycle)}
                </span>
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {billingCycleOptions.map((option) => {
                    const amount = option.price;
                    const isSelected = selectedCycle === option.id;
                    const isCurrent = currentCycle === option.id;
                    const isDisabled = !isWindowOpen || isSubmitting;

                    return (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedCycle(option.id)}
                            disabled={isDisabled}
                            aria-disabled={isDisabled}
                            className={`overflow-hidden rounded-lg border-2 text-left transition ${
                                isDisabled
                                    ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
                                    : isSelected
                                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                                        : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                            }`}
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
                            <div className="p-4">
                                <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                                <p className="mt-1 text-lg font-bold text-gray-900">{formatAmount(amount)}</p>
                                <p className="text-xs text-gray-500">{option.description}</p>
                                {isCurrent && (
                                    <p className="mt-2 text-[10px] font-medium uppercase text-blue-700">Current</p>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                onClick={handleSubmit}
                disabled={!isWindowOpen || isSubmitting || selectedCycle === currentCycle}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {isSubmitting ? (
                    <>
                        <Loading size="sm" />
                        Saving...
                    </>
                ) : isWindowOpen ? (
                    `Save ${formatBillingCycleLabel(selectedCycle)} billing for Cycle ${nextCycleNumber}`
                ) : (
                    'Billing cycle change unavailable'
                )}
            </button>
        </div>
    );
};

export default BillingCycleChangePanel;
