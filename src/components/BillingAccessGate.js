import React, { useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useBilling } from '../context/billing_context';
import BillingPaymentModal from './BillingPaymentModal';
import { formatBillingAmount } from '../utils/billingPaymentUtils';

const APP_LABELS = {
    CHIT_FUND: 'Chit Fund',
    DAILY_COLLECTION: 'Daily Collection',
    VEHICLE_FINANCE: 'Vehicle Finance',
    PERSONAL_LOAN: 'Personal Loan',
};

/**
 * Blocks app content when suspended with dues, or unpaid while active.
 * Scenario 1 (suspended, no dues): offers Resume.
 * Scenario 2 (suspended/active with dues): pending due paywall.
 */
const BillingAccessGate = ({ children }) => {
    const history = useHistory();
    const {
        appCode,
        billingPath,
        access,
        subscription,
        payments,
        hasLoaded,
        payCycleBill,
        resumeAppSubscription,
        fetchCurrentSubscription,
        fetchPaymentHistory,
    } = useBilling();

    const [payingCycle, setPayingCycle] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resumeError, setResumeError] = useState(null);
    const [isResuming, setIsResuming] = useState(false);

    const outstandingCycles = useMemo(() => {
        if (access?.outstanding_cycles?.length) {
            return access.outstanding_cycles;
        }
        const cycles = payments?.cycle_payments || [];
        return cycles.filter(
            (c) =>
                (c.status === 'pending' || c.status === 'unpaid')
                && parseFloat(c.amount) > 0
        );
    }, [access, payments]);

    const totalDue = useMemo(
        () => outstandingCycles.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0),
        [outstandingCycles]
    );

    // Page loaders handle UI — never stack a second billing spinner here.
    if (!hasLoaded) {
        return children;
    }

    const needsPaywall = Boolean(access?.needs_paywall || (access?.has_outstanding && !access?.can_access));
    const canAutoResume = Boolean(access?.can_auto_resume);
    const isSuspended = subscription?.status === 'suspended';

    if (!needsPaywall && !canAutoResume) {
        return children;
    }

    const appLabel = APP_LABELS[appCode] || appCode;

    const handleResume = async () => {
        setResumeError(null);
        setIsResuming(true);
        try {
            const result = await resumeAppSubscription();
            if (!result.success) {
                setResumeError(result.error || 'Unable to resume');
            }
        } finally {
            setIsResuming(false);
        }
    };

    const handlePay = async (paymentData) => {
        if (!payingCycle) return;
        setIsSubmitting(true);
        try {
            const result = await payCycleBill({
                payment_id: payingCycle.id || payingCycle.payment_id,
                cycle_number: payingCycle.cycle_number,
                amount: payingCycle.amount,
                ...paymentData,
            });
            if (result.success) {
                setPayingCycle(null);
                await fetchCurrentSubscription({ silent: true });
                await fetchPaymentHistory({ silent: true });
            } else {
                alert(result.error || 'Payment failed');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4">
                <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
                    <div className="bg-slate-900 px-6 py-5 text-white">
                        <p className="text-xs uppercase tracking-wider text-white/70">{appLabel}</p>
                        <h2 className="mt-1 text-xl font-bold">
                            {needsPaywall ? 'Pending dues to continue' : 'Billing was stopped'}
                        </h2>
                        <p className="mt-2 text-sm text-white/80">
                            {needsPaywall
                                ? 'Pay outstanding billing cycles to reopen this app.'
                                : 'Customer service stopped automatic billing. You can resume since there are no pending dues.'}
                        </p>
                    </div>

                    <div className="px-6 py-5">
                        {needsPaywall ? (
                            <>
                                <p className="text-sm text-gray-600 mb-3">
                                    Total due:{' '}
                                    <span className="font-bold text-red-600">
                                        {formatBillingAmount(totalDue)}
                                    </span>
                                </p>
                                <div className="max-h-64 space-y-2 overflow-y-auto">
                                    {outstandingCycles.map((cycle) => (
                                        <div
                                            key={cycle.id || `${cycle.cycle_number}-${cycle.amount}`}
                                            className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-3"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    Cycle {cycle.cycle_number}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize">
                                                    {cycle.status}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-bold text-gray-900">
                                                    {formatBillingAmount(cycle.amount)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setPayingCycle(cycle)}
                                                    className="rounded-lg bg-custom-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                                                >
                                                    Pay
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-4 text-xs text-gray-500">
                                    Or contact customer service / Super Admin if you paid offline.
                                </p>
                            </>
                        ) : (
                            <>
                                {resumeError && (
                                    <p className="mb-3 text-sm text-red-600">{resumeError}</p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleResume}
                                    disabled={isResuming}
                                    className="w-full rounded-lg bg-custom-red px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                >
                                    {isResuming ? 'Resuming…' : 'Resume app & billing'}
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => history.push(billingPath || '/app-selection')}
                            className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {isSuspended ? 'Open billing page' : 'Go to billing'}
                        </button>
                        <button
                            type="button"
                            onClick={() => history.push('/app-selection')}
                            className="mt-2 w-full text-sm text-gray-500 hover:text-gray-700"
                        >
                            Back to Finance Hub
                        </button>
                    </div>
                </div>
            </div>

            <BillingPaymentModal
                isOpen={Boolean(payingCycle)}
                onClose={() => !isSubmitting && setPayingCycle(null)}
                onConfirm={handlePay}
                amount={payingCycle?.amount}
                isSubmitting={isSubmitting}
                title={`Pay Cycle ${payingCycle?.cycle_number || ''}`}
            />

            {/* Keep children mounted but inaccessible behind gate */}
            <div className="pointer-events-none select-none opacity-20" aria-hidden>
                {children}
            </div>
        </>
    );
};

export default BillingAccessGate;
