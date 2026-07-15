import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBilling } from '../context/billing_context';
import { useUserContext } from '../context/user_context';
import {
    formatBillingAmount,
    getBillingPaymentSummary,
    getDismissStorageKey,
} from '../utils/billingPaymentUtils';

const BillingOverdueOverlay = ({ billingPath = '/chit-fund/user/billing' }) => {
    const location = useLocation();
    const { user } = useUserContext();
    const { subscription, payments, isLoading } = useBilling();
    const [isDismissed, setIsDismissed] = useState(false);

    const membershipId =
        user?.results?.userAccounts?.[0]?.parent_membership_id ||
        user?.results?.userAccounts?.[0]?.membership_id;

    const summary = useMemo(
        () => getBillingPaymentSummary(subscription, payments),
        [subscription, payments]
    );

    const dismissKey = useMemo(() => {
        if (!membershipId || !summary.shouldShowUrgentOverlay) return null;
        return getDismissStorageKey(
            membershipId,
            summary.totalDue,
            summary.outstandingCycles.length,
            summary.isPlanAboutToExpire
        );
    }, [membershipId, summary]);

    useEffect(() => {
        if (!dismissKey) {
            setIsDismissed(false);
            return;
        }
        setIsDismissed(sessionStorage.getItem(dismissKey) === 'true');
    }, [dismissKey]);

    const handleClose = () => {
        if (dismissKey) {
            sessionStorage.setItem(dismissKey, 'true');
        }
        setIsDismissed(true);
    };

    const isOnBillingPage = location.pathname.includes('/billing');

    if (isLoading || !summary.shouldShowUrgentOverlay || isDismissed) {
        return null;
    }

    const isExpiring = summary.isPlanAboutToExpire;
    const isMultiOutstanding = summary.hasMultipleOutstanding;
    const cycleNumber = summary.cycle2Expiry.cycle?.cycle_number;

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Close"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-6 pt-8">
                    <div className="mb-4 flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isExpiring || isMultiOutstanding ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {isMultiOutstanding
                                    ? 'Multiple Cycles Due'
                                    : isExpiring
                                        ? 'Plan About to Expire'
                                        : 'Payment Pending'}
                            </h2>
                            <p className="text-sm text-gray-600">{summary.planName} plan</p>
                        </div>
                    </div>

                    {isMultiOutstanding ? (
                        <>
                            <p className="mb-2 font-medium text-red-700">
                                You have {summary.outstandingCount} unpaid billing cycles.
                            </p>
                            <p className="mb-2 text-gray-800">
                                Total due:{' '}
                                <span className="font-semibold text-red-600">
                                    {formatBillingAmount(summary.totalDue)}
                                </span>
                            </p>
                            <p className="mb-4 text-sm text-gray-600">
                                Please pay each cycle starting from the oldest one in Payment History.
                            </p>
                        </>
                    ) : isExpiring ? (
                        <>
                            <p className="mb-2 font-medium text-red-700">
                                Your plan is about to expire.
                            </p>
                            <p className="mb-2 text-gray-800">
                                Cycle {cycleNumber} fee of{' '}
                                <span className="font-semibold text-red-600">
                                    {formatBillingAmount(summary.totalDue)}
                                </span>{' '}
                                has been unpaid for more than 5 days.
                            </p>
                            <p className="mb-4 text-sm text-gray-600">
                                Please pay immediately to keep your subscription active.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="mb-2 text-gray-800">
                                <span className="font-semibold text-red-600">
                                    {formatBillingAmount(summary.totalDue)}
                                </span>{' '}
                                subscription fee is pending for payment.
                            </p>
                            <p className="mb-4 text-sm text-gray-600">
                                {summary.daysLeft} day{summary.daysLeft === 1 ? '' : 's'} left to pay.
                            </p>
                        </>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                        {!isOnBillingPage && (
                            <Link
                                to={billingPath}
                                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-red-700"
                            >
                                Go to Billing
                            </Link>
                        )}
                        {isOnBillingPage && (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                Pay Now on Billing Page
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillingOverdueOverlay;
