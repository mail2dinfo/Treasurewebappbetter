import React, { useState, useEffect } from 'react';
import { useBilling } from '../context/billing_context';
import { useUserContext } from '../context/user_context';
import { API_BASE_URL, MANUAL_CRON_ENABLED } from '../utils/apiConfig';
import { getPlanCatalogPrice } from '../utils/billingPlans';
import {
    formatBillingAmount,
    getBillingPaymentSummary,
    getPreviousDueCycles,
} from '../utils/billingPaymentUtils';
import Loading from '../components/Loading';
import PlansSelection from '../components/PlansSelection';
import PlanUpgradeForm from '../components/PlanUpgradeForm';
import BillingPaymentModal from '../components/BillingPaymentModal';
import BillingCycleChangePanel from '../components/BillingCycleChangePanel';
import loadingImage from '../images/preloader.gif';

const MyBillingPage = () => {
    const { user } = useUserContext();
    const {
        subscription,
        payments,
        billingCycleChangeWindow,
        availablePlans,
        isLoading,
        hasLoaded,
        error,
        appCode,
        fetchCurrentSubscription,
        fetchPaymentHistory,
        fetchAvailablePlans,
        changePlan,
        changeBillingCycle,
        recordPayment,
        payCycleBill,
        triggerBillingCycle,
        resetBillingData
    } = useBilling();

    const appLabel = {
        CHIT_FUND: 'Chit Fund',
        DAILY_COLLECTION: 'Daily Collection',
        VEHICLE_FINANCE: 'Vehicle Finance',
        PERSONAL_LOAN: 'Personal Loan',
    }[appCode] || appCode;

    const [activeTab, setActiveTab] = useState('billing');
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showUpgradeForm, setShowUpgradeForm] = useState(false);
    const [showPaymentHistoryDebug, setShowPaymentHistoryDebug] = useState(false);
    const [paymentRefreshKey, setPaymentRefreshKey] = useState(0);
    const [isTriggeringCycle, setIsTriggeringCycle] = useState(false);
    const [payingPaymentId, setPayingPaymentId] = useState(null);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentModalContext, setPaymentModalContext] = useState(null);
    const [pendingCycle, setPendingCycle] = useState(null);
    const [pendingUpgradeData, setPendingUpgradeData] = useState(null);
    const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);
    const [paymentHistoryTab, setPaymentHistoryTab] = useState('current');


    useEffect(() => {
        fetchCurrentSubscription();
        fetchPaymentHistory();
        fetchAvailablePlans();
    }, [user]);

    // Debug billing cycles when data is loaded
    useEffect(() => {
        if (payments && subscription) {
            debugBillingCycles();
        }
    }, [payments, subscription]);

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCompactDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
        });
    };

    // Utility function to calculate next billing cycle date
    const calculateNextBillingDate = (lastPaymentDate, billingCycle) => {
        if (!lastPaymentDate) return null;

        const paymentDate = new Date(lastPaymentDate);
        const nextDate = new Date(paymentDate);

        switch (billingCycle) {
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'quarterly':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
            default:
                nextDate.setMonth(nextDate.getMonth() + 1);
        }

        return nextDate.toISOString().split('T')[0];
    };

    // Function to generate overdue cycles (simplified without grace period)
    const generateOverdueCycles = (subscription, payments) => {
        if (!subscription || !payments) return [];

        // For now, return empty array - overdue cycles should be created by backend
        // This function can be enhanced later if needed for frontend-generated cycles
        return [];
    };

    // Function to validate billing cycle dates
    const validateBillingCycle = (cycle, previousCycle) => {
        if (!cycle || !subscription?.billing_cycle) return { isValid: true, message: '' };

        // If this is the first cycle, it's valid
        if (!previousCycle) return { isValid: true, message: '' };

        // Calculate expected due date based on previous payment
        const expectedDueDate = calculateNextBillingDate(previousCycle.payment_date || previousCycle.due_date, subscription.billing_cycle);
        const actualDueDate = cycle.due_date;

        if (expectedDueDate !== actualDueDate) {
            return {
                isValid: false,
                message: `Expected: ${formatDate(expectedDueDate)}, Actual: ${formatDate(actualDueDate)}`
            };
        }

        return { isValid: true, message: '' };
    };

    // Comprehensive payment history analysis
    const analyzePaymentHistory = () => {
        // Handle both array and object structures
        const cyclePayments = Array.isArray(payments) ? payments : (payments?.cycle_payments || []);

        if (!cyclePayments || cyclePayments.length === 0) {
            return {
                totalCycles: 0,
                paidCycles: 0,
                unpaidCycles: 0,
                pendingCycles: 0,
                totalPaid: 0,
                totalDue: 0,
                issues: [],
                cycleDetails: []
            };
        }

        const analysis = {
            totalCycles: cyclePayments.length,
            paidCycles: 0,
            unpaidCycles: 0,
            pendingCycles: 0,
            totalPaid: 0,
            totalDue: 0,
            issues: [],
            cycleDetails: []
        };

        cyclePayments.forEach((cycle, index) => {
            const previousCycle = index > 0 ? cyclePayments[index - 1] : null;
            const validation = validateBillingCycle(cycle, previousCycle);

            // Count by status
            const displayStatus = cycle.status;

            if (displayStatus === 'paid' || displayStatus === 'success') {
                analysis.paidCycles++;
                analysis.totalPaid += parseFloat(cycle.amount) || 0;
            } else if (displayStatus === 'unpaid' || displayStatus === 'pending') {
                analysis.unpaidCycles++;
                analysis.totalDue += parseFloat(cycle.amount) || 0;
            } else {
                analysis.pendingCycles++;
            }

            // Check for issues
            if (!validation.isValid) {
                analysis.issues.push({
                    cycle: cycle.cycle_number,
                    issue: validation.message,
                    dueDate: cycle.due_date,
                    status: cycle.status
                });
            }

            // Store cycle details
            analysis.cycleDetails.push({
                cycleNumber: cycle.cycle_number,
                dueDate: cycle.due_date,
                paymentDate: cycle.payment_date,
                amount: cycle.amount,
                status: cycle.status,
                validation: validation,
                expectedNextDate: cycle.payment_date ? calculateNextBillingDate(cycle.payment_date, subscription?.billing_cycle) : null
            });
        });

        return analysis;
    };

    // Debug function to check billing cycle logic
    const debugBillingCycles = () => {
        const cyclePayments = Array.isArray(payments) ? payments : (payments?.cycle_payments || []);

        if (cyclePayments && cyclePayments.length > 0) {
            console.log('=== BILLING CYCLE DEBUG ===');
            console.log('Subscription billing cycle:', subscription?.billing_cycle);
            console.log('All cycle payments:', cyclePayments);

            const analysis = analyzePaymentHistory();
            console.log('Payment History Analysis:', analysis);

            cyclePayments.forEach((cycle, index) => {
                console.log(`Cycle ${cycle.cycle_number}:`);
                console.log(`  Due Date: ${cycle.due_date}`);
                console.log(`  Payment Date: ${cycle.payment_date || 'Not paid'}`);
                console.log(`  Status: ${cycle.status}`);

                // Validate against previous cycle
                const previousCycle = index > 0 ? cyclePayments[index - 1] : null;
                const validation = validateBillingCycle(cycle, previousCycle);

                if (!validation.isValid) {
                    console.warn(`  ⚠️ BILLING CYCLE ISSUE: ${validation.message}`);
                }

                if (cycle.payment_date && subscription?.billing_cycle) {
                    const expectedNextDate = calculateNextBillingDate(cycle.payment_date, subscription.billing_cycle);
                    console.log(`  Expected Next Date: ${expectedNextDate}`);
                }
            });
            console.log('===========================');
        }
    };

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setShowUpgradeForm(true);
    };

    const handleBackToPlans = () => {
        setShowUpgradeForm(false);
        setSelectedPlan(null);
    };

    const resetPaymentModal = () => {
        setPaymentModalOpen(false);
        setPaymentModalContext(null);
        setPendingCycle(null);
        setPendingUpgradeData(null);
    };

    const closePaymentModal = () => {
        if (isPaymentSubmitting) {
            return;
        }
        resetPaymentModal();
    };

    const openCyclePaymentModal = (cycle) => {
        setPendingCycle(cycle);
        setPendingUpgradeData(null);
        setPaymentModalContext('cycle');
        setPaymentModalOpen(true);
    };

    const openUpgradePaymentModal = (upgradeData) => {
        setPendingUpgradeData(upgradeData);
        setPendingCycle(null);
        setPaymentModalContext('upgrade');
        setPaymentModalOpen(true);
    };

    const handleProceedToPayment = (upgradeData) => {
        openUpgradePaymentModal(upgradeData);
    };

    const handleCyclePayment = async (cycleData) => {
        setPayingPaymentId(cycleData.payment_id || cycleData.id);
        setIsPaymentSubmitting(true);
        try {
            const result = await payCycleBill(cycleData);

            if (result.success) {
                alert(`Payment of ${formatAmount(cycleData.amount)} recorded successfully!`);
                setPaymentRefreshKey((prev) => prev + 1);
                resetPaymentModal();
            } else {
                alert(`Payment failed: ${result.error}`);
            }
        } catch (error) {
            alert(`Payment error: ${error.message}`);
        } finally {
            setPayingPaymentId(null);
            setIsPaymentSubmitting(false);
        }
    };

    const handleUpgradePayment = async (paymentData) => {
        if (!pendingUpgradeData) {
            return;
        }

        setIsPaymentSubmitting(true);
        try {
            const { billingDetails } = pendingUpgradeData;
            const combinedData = {
                membership_id: user?.results?.userAccounts?.[0]?.parent_membership_id,
                billing_details: {
                    plan_id: billingDetails.plan_id,
                    plan_name: billingDetails.plan_name,
                    amount: billingDetails.amount,
                    currency: billingDetails.currency || 'INR',
                    billing_cycle: billingDetails.billing_cycle,
                    features: billingDetails.features,
                },
                amount: billingDetails.amount,
                ...paymentData,
                status: 'success',
            };

            const result = await recordPayment(combinedData);
            if (result.success) {
                alert('Plan upgraded successfully!');
                setShowUpgradeForm(false);
                setSelectedPlan(null);
                resetPaymentModal();
                await fetchCurrentSubscription();
                await fetchPaymentHistory();
            } else {
                alert(`Payment failed: ${result.error}`);
            }
        } catch (error) {
            alert(`Payment error: ${error.message}`);
        } finally {
            setIsPaymentSubmitting(false);
        }
    };

    const handlePaymentModalConfirm = async (paymentData) => {
        if (paymentModalContext === 'cycle' && pendingCycle) {
            await handleCyclePayment({
                payment_id: pendingCycle.id,
                subscription_id: pendingCycle.subscription_id,
                cycle_number: pendingCycle.cycle_number,
                amount: parseFloat(pendingCycle.amount),
                payment_date: new Date().toISOString(),
                status: 'success',
                ...paymentData,
            });
            return;
        }

        if (paymentModalContext === 'upgrade') {
            await handleUpgradePayment(paymentData);
        }
    };

    const payCycle = (cycle) => {
        openCyclePaymentModal(cycle);
    };

    const downloadReceipt = (cycle) => {
        // Create receipt data
        const receiptData = {
            invoice_number: cycle.invoice_number,
            payment_date: cycle.payment_date,
            amount: cycle.amount,
            payment_method: cycle.payment_method,
            plan_name: cycle.plan_name,
            cycle_number: cycle.cycle_number
        };

        // Generate and download receipt
        const receiptContent = `
            RECEIPT
            =======
            Invoice: ${receiptData.invoice_number}
            Date: ${formatDate(receiptData.payment_date)}
            Plan: ${receiptData.plan_name}
            Cycle: ${receiptData.cycle_number}
            Amount: ${formatAmount(receiptData.amount)}
            Method: ${receiptData.payment_method}
            Status: Paid
        `;

        const blob = new Blob([receiptContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${receiptData.invoice_number}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const getCurrentPlan = () => {
        if (subscription) {
            const catalogPrice = getPlanCatalogPrice(subscription.plan_id || subscription.plan_name);
            return {
                id: subscription.id,
                name: subscription.plan_name || subscription.plan_id || 'VeryBasic Plan',
                price: catalogPrice ?? subscription.amount ?? 100
            };
        }
        return null;
    };

    const getDisplaySubscriptionAmount = () => {
        if (!subscription) return 0;
        return getPlanCatalogPrice(subscription.plan_id || subscription.plan_name) ?? subscription.amount ?? 0;
    };

    const handleTriggerBillingCycle = async () => {
        if (!MANUAL_CRON_ENABLED) {
            return;
        }

        const confirmed = window.confirm(
            'Run billing cron job manually?\n\nUse this only if the scheduled cron did not run.'
        );
        if (!confirmed) {
            return;
        }

        setIsTriggeringCycle(true);
        try {
            const result = await triggerBillingCycle();
            if (result.success) {
                const created = result.data?.created || [];
                const skipped = result.data?.skipped || [];
                const errors = result.data?.errors || [];

                if (created.length > 0) {
                    alert(
                        `${result.message}\n\n` +
                        created.map((c) => `✓ Cycle ${c.cycle_number} created — ₹${c.amount}`).join('\n')
                    );
                } else if (errors.length > 0) {
                    alert(
                        `Billing cycle error:\n\n` +
                        errors.map((e) => `• ${e.reason}`).join('\n')
                    );
                } else if (skipped.length > 0) {
                    alert(
                        `No new cycle created:\n\n` +
                        skipped.map((s) => `• ${s.reason}`).join('\n')
                    );
                } else {
                    alert(result.message || 'Billing cycle triggered — no changes made');
                }
                setPaymentRefreshKey((prev) => prev + 1);
            } else {
                const skipped = result.data?.skipped || [];
                const extra = skipped.length > 0
                    ? '\n\n' + skipped.map((s) => `• ${s.reason}`).join('\n')
                    : '';
                alert(`Failed: ${result.error}${extra}`);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            setIsTriggeringCycle(false);
        }
    };

    const paymentSummary = getBillingPaymentSummary(subscription, payments);
    const previousDueCycles = getPreviousDueCycles(payments);
    const previousDueTotal = previousDueCycles.reduce(
        (sum, cycle) => sum + parseFloat(cycle.amount || 0),
        0
    );

    const allCyclePayments = Array.isArray(payments) ? payments : (payments?.cycle_payments || []);
    const currentPlanHistory = allCyclePayments.filter((cycle) => !cycle.is_previous_plan);
    const previousPlanHistory = allCyclePayments.filter((cycle) => cycle.is_previous_plan);

    const renderPaymentHistoryTable = (cycles, emptyTitle, emptyMessage) => {
        if (!cycles || cycles.length === 0) {
            return (
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{emptyTitle}</h3>
                    <p className="text-gray-600">{emptyMessage}</p>
                </div>
            );
        }

        return (
            <div key={paymentRefreshKey}>
                <table className="w-full table-fixed divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="w-[11%] px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">Plan</th>
                            <th className="w-[7%] px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">Cycle</th>
                            <th className="w-[11%] px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">Start</th>
                            <th className="w-[11%] px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">End</th>
                            <th className="w-[9%] px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">Amount</th>
                            <th className="w-[9%] px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">Status</th>
                            <th className="w-[11%] px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">Paid On</th>
                            <th className="w-[14%] px-2 py-2 text-left text-[10px] font-medium uppercase tracking-wide text-gray-500">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {cycles.map((cycle, index) => {
                            const displayStatus = cycle.status;

                            return (
                                <tr
                                    key={cycle.id || `${cycle.subscription_id}-${cycle.cycle_number}-${index}`}
                                    className={cycle.is_previous_plan ? 'bg-amber-50/40' : undefined}
                                >
                                    <td className="px-2 py-2 text-xs text-gray-900">
                                        <span
                                            className="block truncate font-medium text-blue-600"
                                            title={cycle.plan_name || 'Unknown Plan'}
                                        >
                                            {cycle.plan_name || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 text-xs text-gray-900">#{cycle.cycle_number}</td>
                                    <td className="px-2 py-2 text-xs text-gray-900">
                                        {formatCompactDate(cycle.cycle_start_date || cycle.due_date)}
                                    </td>
                                    <td className="px-2 py-2 text-xs text-gray-900">
                                        {formatCompactDate(cycle.cycle_end_date)}
                                    </td>
                                    <td className="px-2 py-2 text-xs font-medium text-gray-900">
                                        {formatAmount(cycle.amount)}
                                    </td>
                                    <td className="px-2 py-2">
                                        <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                                            displayStatus === 'paid'
                                                ? 'bg-green-100 text-green-800'
                                                : displayStatus === 'unpaid'
                                                    ? 'bg-red-100 text-red-800'
                                                    : displayStatus === 'free'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {displayStatus === 'free' ? 'Free' : displayStatus}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 text-xs text-gray-900">
                                        {cycle.payment_date ? formatCompactDate(cycle.payment_date) : '-'}
                                    </td>
                                    <td className="px-2 py-2 text-xs text-gray-900">
                                        {(displayStatus === 'paid' || displayStatus === 'free') ? (
                                            <button
                                                onClick={() => downloadReceipt(cycle)}
                                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200 text-[10px] font-medium"
                                            >
                                                Receipt
                                            </button>
                                        ) : (displayStatus === 'unpaid' || displayStatus === 'pending') ? (
                                            <button
                                                onClick={() => payCycle(cycle)}
                                                disabled={payingPaymentId === cycle.id}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200 text-[10px] font-medium disabled:opacity-70"
                                            >
                                                {payingPaymentId === cycle.id ? (
                                                    <>
                                                        <Loading size="sm" />
                                                        ...
                                                    </>
                                                ) : (
                                                    'Pay'
                                                )}
                                            </button>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const getBillingStatus = () => {
        if (!subscription) return { status: 'unknown', message: 'No subscription', color: 'gray' };

        if (paymentSummary.hasMultipleOutstanding) {
            return { status: 'overdue', message: 'Multiple Cycles Due', color: 'red' };
        }

        if (paymentSummary.isPlanAboutToExpire) {
            return { status: 'expiring', message: 'Plan About to Expire', color: 'red' };
        }

        if (subscription.payment_status === 'overdue' || paymentSummary.isCycle1Pending) {
            return { status: 'overdue', message: 'Payment Due', color: 'red' };
        }

        if (paymentSummary.hasPendingPayment && paymentSummary.cycle2Expiry.cycle) {
            return {
                status: 'active',
                message: 'Active',
                color: 'green',
            };
        }

        if (subscription.payment_status === 'paid' || !paymentSummary.hasPendingPayment) {
            return { status: 'paid', message: 'Paid', color: 'green' };
        }

        return { status: 'overdue', message: 'Payment Due', color: 'red' };
    };

    if (isLoading && !hasLoaded) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center bg-gray-50">
                <img src={loadingImage} className="loading-img" alt="" style={{ marginTop: 0 }} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md mx-auto text-center">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="text-red-500 mb-4">
                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Billing Data</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    resetBillingData();
                                    fetchCurrentSubscription();
                                    fetchPaymentHistory();
                                    fetchAvailablePlans();
                                }}
                                className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
                            >
                                Retry Loading
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Billing</h1>
                            <p className="mt-2 text-gray-600">
                                Manage your {appLabel} subscription and view payment history.
                            </p>
                        </div>

                        {subscription && (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4">
                                <p className="text-sm font-medium text-gray-500">Current Plan</p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {subscription.plan_name || subscription.plan_id}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {formatAmount(getDisplaySubscriptionAmount())} / {subscription.billing_cycle || 'monthly'}
                                </p>

                                {paymentSummary.hasPendingPayment ? (
                                    <div className={`mt-3 rounded-md px-3 py-2 ${
                                        paymentSummary.isPlanAboutToExpire || paymentSummary.hasMultipleOutstanding
                                            ? 'bg-red-50 border border-red-200'
                                            : paymentSummary.isCycle1Pending
                                                ? 'bg-red-50'
                                                : 'bg-green-50 border border-green-200'
                                    }`}>
                                        <p className={`text-sm font-medium ${
                                            paymentSummary.isPlanAboutToExpire || paymentSummary.hasMultipleOutstanding
                                                ? 'text-red-800'
                                                : paymentSummary.isCycle1Pending
                                                    ? 'text-red-800'
                                                    : 'text-green-800'
                                        }`}>
                                            {paymentSummary.hasMultipleOutstanding
                                                ? `${paymentSummary.outstandingCount} cycles outstanding — ${formatBillingAmount(paymentSummary.totalDue)} due`
                                                : paymentSummary.isPlanAboutToExpire
                                                    ? 'Plan about to expire'
                                                    : paymentSummary.isCycle1Pending
                                                        ? `${formatBillingAmount(paymentSummary.totalDue)} pending`
                                                        : `${formatBillingAmount(paymentSummary.totalDue)} due for Cycle ${paymentSummary.cycle2Expiry.cycle?.cycle_number}`}
                                        </p>
                                        <p className={`text-xs ${
                                            paymentSummary.isPlanAboutToExpire || paymentSummary.hasMultipleOutstanding
                                                ? 'text-red-700'
                                                : paymentSummary.isCycle1Pending
                                                    ? 'text-red-700'
                                                    : 'text-green-700'
                                        }`}>
                                            {paymentSummary.hasMultipleOutstanding
                                                ? `Pay oldest cycles first in Payment History — ${paymentSummary.outstandingCount} month${paymentSummary.outstandingCount === 1 ? '' : 's'} of fees pending`
                                                : paymentSummary.isPlanAboutToExpire
                                                    ? `Cycle ${paymentSummary.cycle2Expiry.cycle?.cycle_number} unpaid for ${paymentSummary.cycle2Expiry.daysUnpaid} days — pay now to avoid expiry`
                                                    : paymentSummary.isCycle1Pending
                                                        ? `${paymentSummary.daysLeft} day${paymentSummary.daysLeft === 1 ? '' : 's'} left to pay`
                                                        : `${paymentSummary.cycle2Expiry.daysUntilWarning} day${paymentSummary.cycle2Expiry.daysUntilWarning === 1 ? '' : 's'} left before expiry warning`}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-3 rounded-md bg-green-50 px-3 py-2">
                                        <p className="text-sm font-medium text-green-800">All payments up to date</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('billing')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'billing'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Current Billing
                            </button>
                            <button
                                onClick={() => setActiveTab('plans')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'plans'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Upgrade Plans
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                {activeTab === 'billing' ? (
                    <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Side - Billing Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Current Plan Card */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>

                                {subscription ? (
                                    <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Plan Name</span>
                                                    <span className="font-medium">
                                                        {subscription.plan_name || 'Basic Plan'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Amount</span>
                                                    <span className="font-medium">
                                                        {formatAmount(getDisplaySubscriptionAmount())}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Billing Cycle</span>
                                                    <span className="font-medium capitalize">
                                                        {subscription.billing_cycle || 'monthly'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Start Date</span>
                                                    <span className="font-medium">
                                                        {formatDate(subscription.plan_start_date)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">End Date</span>
                                                    <span className="font-medium">
                                                        {formatDate(subscription.plan_end_date)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Status</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBillingStatus().color === 'green' ? 'bg-green-100 text-green-800' :
                                                        getBillingStatus().color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                                            getBillingStatus().color === 'red' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {getBillingStatus().message}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <BillingCycleChangePanel
                                        subscription={subscription}
                                        billingCycleChangeWindow={billingCycleChangeWindow}
                                        onChangeBillingCycle={changeBillingCycle}
                                    />
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                                        <p className="text-gray-600">You don't have an active subscription yet.</p>
                                        <button
                                            onClick={() => setActiveTab('plans')}
                                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
                                        >
                                            Choose a Plan
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>

                                <div className="space-y-4">
                                    <button
                                        onClick={() => setActiveTab('plans')}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                                    >
                                        Upgrade Plan
                                    </button>

                                    <button
                                        onClick={handleTriggerBillingCycle}
                                        disabled={!MANUAL_CRON_ENABLED || isTriggeringCycle}
                                        className={`w-full px-4 py-2 text-white rounded-md transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                                            MANUAL_CRON_ENABLED
                                                ? 'bg-yellow-600 hover:bg-yellow-700'
                                                : 'bg-gray-400'
                                        }`}
                                    >
                                        {isTriggeringCycle ? 'Running Cron...' : 'Run Cron job'}
                                    </button>
                                    <p className="text-xs text-gray-500">
                                        {MANUAL_CRON_ENABLED
                                            ? 'Manual fallback if the scheduled cron did not run.'
                                            : 'Disabled by default. Set REACT_APP_ENABLE_MANUAL_CRON=true to enable manual run.'}
                                    </p>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History - full width */}
                    <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
                                    {subscription && (
                                        <div className="text-sm text-gray-600">
                                            <span className="font-medium">Billing Cycle:</span> {subscription.billing_cycle || 'monthly'}
                                        </div>
                                    )}
                                </div>

                                {/* Payment History Summary */}
                                {(() => {
                                    const cyclePayments = Array.isArray(payments) ? payments : (payments?.cycle_payments || []);
                                    return cyclePayments && cyclePayments.length > 0;
                                })() && (() => {
                                    const analysis = analyzePaymentHistory();

                                    return (
                                        <div className="mb-4 space-y-3">
                                            {/* Outstanding cycles alert */}
                                            {paymentSummary.hasMultipleOutstanding && (
                                                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                                    <p className="text-sm font-medium text-red-800">
                                                        {paymentSummary.outstandingCount} billing cycles are unpaid
                                                    </p>
                                                    <p className="text-xs text-red-700">
                                                        Total outstanding: {formatBillingAmount(paymentSummary.totalDue)} — pay each cycle from oldest to newest.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <div className="text-sm text-blue-600 font-medium">Total Cycles</div>
                                                    <div className="text-lg font-bold text-blue-800">{analysis.totalCycles}</div>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded-lg">
                                                    <div className="text-sm text-green-600 font-medium">Paid</div>
                                                    <div className="text-lg font-bold text-green-800">{analysis.paidCycles}</div>
                                                </div>
                                                <div className="bg-red-50 p-3 rounded-lg">
                                                    <div className="text-sm text-red-600 font-medium">Unpaid</div>
                                                    <div className="text-lg font-bold text-red-800">{analysis.unpaidCycles}</div>
                                                </div>
                                                <div className="bg-yellow-50 p-3 rounded-lg">
                                                    <div className="text-sm text-yellow-600 font-medium">Pending</div>
                                                    <div className="text-lg font-bold text-yellow-800">{analysis.pendingCycles}</div>
                                                </div>
                                            </div>

                                            {/* Financial Summary */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-green-50 p-3 rounded-lg">
                                                    <div className="text-sm text-green-600 font-medium">Total Paid</div>
                                                    <div className="text-lg font-bold text-green-800">{formatAmount(analysis.totalPaid)}</div>
                                                </div>
                                                <div className="bg-red-50 p-3 rounded-lg">
                                                    <div className="text-sm text-red-600 font-medium">Total Due</div>
                                                    <div className="text-lg font-bold text-red-800">{formatAmount(analysis.totalDue)}</div>
                                                </div>
                                            </div>



                                            {/* Debug Toggle */}
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => setShowPaymentHistoryDebug(!showPaymentHistoryDebug)}
                                                    className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition duration-200"
                                                >
                                                    {showPaymentHistoryDebug ? 'Hide' : 'Show'} Debug Info
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Debug Panel */}
                                {showPaymentHistoryDebug && (() => {
                                    const cyclePayments = Array.isArray(payments) ? payments : (payments?.cycle_payments || []);
                                    return cyclePayments && cyclePayments.length > 0;
                                })() && (() => {
                                    const analysis = analyzePaymentHistory();

                                    return (
                                        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                            <h3 className="text-sm font-medium text-gray-800 mb-3">Payment History Debug Information</h3>
                                            <div className="space-y-2 text-xs">
                                                <div><strong>Raw Payment Data:</strong></div>
                                                <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-40">
                                                    {JSON.stringify(payments, null, 2)}
                                                </pre>

                                                <div><strong>Analysis Results:</strong></div>
                                                <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-40">
                                                    {JSON.stringify(analysis, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    );
                                })()}


                                {(allCyclePayments.length > 0) ? (
                                    <>
                                        <div className="mb-4 border-b border-gray-200">
                                            <nav className="-mb-px flex space-x-6">
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentHistoryTab('current')}
                                                    className={`py-2 px-1 border-b-2 text-sm font-medium ${
                                                        paymentHistoryTab === 'current'
                                                            ? 'border-red-500 text-red-600'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    Current Payment History
                                                    {currentPlanHistory.length > 0 && (
                                                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                                            {currentPlanHistory.length}
                                                        </span>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentHistoryTab('previous')}
                                                    className={`py-2 px-1 border-b-2 text-sm font-medium ${
                                                        paymentHistoryTab === 'previous'
                                                            ? 'border-red-500 text-red-600'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    Previous Payment History
                                                    {previousDueCycles.length > 0 && (
                                                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                                            {previousDueCycles.length} due
                                                        </span>
                                                    )}
                                                </button>
                                            </nav>
                                        </div>

                                        {paymentHistoryTab === 'current' && (
                                            <>
                                                {subscription && (
                                                    <p className="mb-3 text-sm text-gray-600">
                                                        Current plan: <strong>{subscription.plan_name}</strong> · {subscription.billing_cycle || 'monthly'} billing
                                                    </p>
                                                )}
                                                {renderPaymentHistoryTable(
                                                    currentPlanHistory,
                                                    'No current plan payment history',
                                                    'Payment cycles for your active plan will appear here.'
                                                )}
                                            </>
                                        )}

                                        {paymentHistoryTab === 'previous' && (
                                            <>
                                                {previousDueCycles.length > 0 && (
                                                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                                        <p className="text-sm font-medium text-amber-900">
                                                            {previousDueCycles.length} unpaid cycle{previousDueCycles.length === 1 ? '' : 's'} from previous plans
                                                        </p>
                                                        <p className="text-xs text-amber-800">
                                                            Total due: {formatBillingAmount(previousDueTotal)} — pay these before or along with your current plan cycles.
                                                        </p>
                                                    </div>
                                                )}
                                                {renderPaymentHistoryTable(
                                                    previousPlanHistory,
                                                    'No previous payment history',
                                                    'Cycles from earlier plans (before upgrade) will appear here.'
                                                )}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                                        <p className="text-gray-600">You haven't made any payments yet.</p>
                                    </div>
                                )}

                    </div>
                    </>
                ) : (
                    <div>
                        {showUpgradeForm ? (
                            <PlanUpgradeForm
                                selectedPlan={selectedPlan}
                                currentPlan={getCurrentPlan()}
                                onBack={handleBackToPlans}
                                onProceedToPayment={handleProceedToPayment}
                            />
                        ) : (
                            <PlansSelection
                                currentPlan={getCurrentPlan()}
                                availablePlans={availablePlans}
                                onSelectPlan={handlePlanSelect}
                            />
                        )}
                    </div>
                )}
            </div>

            <BillingPaymentModal
                isOpen={paymentModalOpen}
                onClose={closePaymentModal}
                amount={
                    paymentModalContext === 'cycle'
                        ? parseFloat(pendingCycle?.amount || 0)
                        : parseFloat(pendingUpgradeData?.amount || 0)
                }
                title={
                    paymentModalContext === 'upgrade'
                        ? 'Upgrade Plan Payment'
                        : 'Pay Billing Cycle'
                }
                description={
                    paymentModalContext === 'cycle' && pendingCycle
                        ? `${pendingCycle.is_previous_plan ? 'Previous plan due · ' : ''}Cycle ${pendingCycle.cycle_number} · ${pendingCycle.plan_name || subscription?.plan_name || 'Current plan'}`
                        : paymentModalContext === 'upgrade' && pendingUpgradeData
                            ? `${pendingUpgradeData.planName} (${pendingUpgradeData.billingCycleLabel})`
                            : undefined
                }
                onConfirm={handlePaymentModalConfirm}
                isSubmitting={isPaymentSubmitting}
            />
        </div>
    );
};

export default MyBillingPage;