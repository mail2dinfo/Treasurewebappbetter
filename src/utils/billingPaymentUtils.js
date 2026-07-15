import { getPlanCatalogPrice } from './billingPlans';

const GRACE_PERIOD_DAYS = 20;
const CYCLE_UNPAID_EXPIRE_WARNING_DAYS = 5;

export const getCyclePayments = (payments) => {
    if (Array.isArray(payments)) return payments;
    return payments?.cycle_payments || [];
};

export const getOutstandingCycles = (payments) => {
    return getCyclePayments(payments).filter(
        (cycle) => cycle.status === 'pending' || cycle.status === 'unpaid'
    );
};

export const getPreviousDueCycles = (payments) => {
    const cyclePayments = getCyclePayments(payments);
    if (payments?.previous_due_cycles?.length) {
        return payments.previous_due_cycles;
    }
    return cyclePayments.filter(
        (cycle) => cycle.is_previous_plan
            && (cycle.status === 'pending' || cycle.status === 'unpaid')
    );
};

export const getTotalOutstandingAmount = (payments) => {
    return getOutstandingCycles(payments).reduce(
        (sum, cycle) => sum + parseFloat(cycle.amount || 0),
        0
    );
};

export const getOldestOutstandingCycle = (payments) => {
    const outstanding = getOutstandingCycles(payments);
    if (outstanding.length === 0) return null;

    return [...outstanding].sort((a, b) => {
        const dateA = new Date(a.cycle_start_date || a.due_date || 0);
        const dateB = new Date(b.cycle_start_date || b.due_date || 0);
        return dateA - dateB;
    })[0];
};

export const getPaymentDeadline = (subscription, payments) => {
    const outstanding = getOldestOutstandingCycle(payments);
    if (!subscription) return null;

    if (outstanding?.due_date || outstanding?.cycle_end_date) {
        return new Date(outstanding.due_date || outstanding.cycle_end_date);
    }

    const startDate = new Date(subscription.plan_start_date);
    const deadline = new Date(startDate);
    deadline.setDate(deadline.getDate() + GRACE_PERIOD_DAYS);
    return deadline;
};

export const getDaysLeftToPay = (subscription, payments) => {
    const outstanding = getOutstandingCycles(payments);
    if (outstanding.length === 0) return null;

    const deadline = getPaymentDeadline(subscription, payments);
    if (!deadline) return subscription?.remaining_days ?? null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    return Math.max(0, Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)));
};

export const getDaysOverdue = (subscription, payments) => {
    const outstanding = getOutstandingCycles(payments);
    if (outstanding.length === 0) return 0;

    const deadline = getPaymentDeadline(subscription, payments);
    if (!deadline) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);

    return Math.max(0, Math.ceil((today - deadline) / (1000 * 60 * 60 * 24)));
};

export const getDaysUnpaidSinceCycleStart = (cycle) => {
    if (!cycle) return 0;

    const startDate = new Date(cycle.cycle_start_date || cycle.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    return Math.max(0, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));
};

export const getCycle2PlusExpiryStatus = (payments) => {
    const cycle2Plus = getOutstandingCycles(payments).filter(
        (cycle) => cycle.cycle_number >= 2
    );

    if (cycle2Plus.length === 0) {
        return {
            isAboutToExpire: false,
            daysUnpaid: 0,
            cycle: null,
            daysUntilWarning: CYCLE_UNPAID_EXPIRE_WARNING_DAYS,
        };
    }

    const oldestCycle2Plus = [...cycle2Plus].sort(
        (a, b) => a.cycle_number - b.cycle_number
    )[0];
    const daysUnpaid = getDaysUnpaidSinceCycleStart(oldestCycle2Plus);

    return {
        isAboutToExpire: daysUnpaid > CYCLE_UNPAID_EXPIRE_WARNING_DAYS,
        daysUnpaid,
        cycle: oldestCycle2Plus,
        daysUntilWarning: Math.max(0, CYCLE_UNPAID_EXPIRE_WARNING_DAYS - daysUnpaid),
    };
};

export const getBillingPaymentSummary = (subscription, payments) => {
    const outstandingCycles = getOutstandingCycles(payments);
    const outstandingCount = outstandingCycles.length;
    const totalDue = getTotalOutstandingAmount(payments);
    const daysLeft = getDaysLeftToPay(subscription, payments);
    const daysOverdue = getDaysOverdue(subscription, payments);
    const hasPendingPayment = outstandingCount > 0;
    const oldestOutstanding = getOldestOutstandingCycle(payments);
    const cycle2Expiry = getCycle2PlusExpiryStatus(payments);
    const isCycle1Pending = oldestOutstanding?.cycle_number === 1 && outstandingCount === 1;
    const hasMultipleOutstanding = outstandingCount > 1;
    const isPlanAboutToExpire = cycle2Expiry.isAboutToExpire;

    let displayColor = 'green';
    let alertMessage = 'All payments up to date';

    if (hasPendingPayment) {
        if (hasMultipleOutstanding) {
            displayColor = 'red';
            alertMessage = `${outstandingCount} billing cycles outstanding — ${formatBillingAmount(totalDue)} total due`;
        } else if (isPlanAboutToExpire) {
            displayColor = 'red';
            alertMessage = `Plan about to expire — Cycle ${cycle2Expiry.cycle.cycle_number} unpaid for ${cycle2Expiry.daysUnpaid} days`;
        } else if (isCycle1Pending) {
            displayColor = 'red';
            alertMessage = `${formatBillingAmount(totalDue)} pending for Cycle 1`;
        } else if (cycle2Expiry.cycle) {
            displayColor = 'green';
            alertMessage = `Cycle ${cycle2Expiry.cycle.cycle_number} due — ${cycle2Expiry.daysUntilWarning} day${cycle2Expiry.daysUntilWarning === 1 ? '' : 's'} before expiry warning`;
        } else {
            displayColor = 'red';
            alertMessage = `${formatBillingAmount(totalDue)} pending`;
        }
    }

    return {
        outstandingCycles,
        outstandingCount,
        totalDue,
        daysLeft,
        daysOverdue,
        hasPendingPayment,
        hasMultipleOutstanding,
        isOverdue: hasPendingPayment && daysOverdue > 0,
        isPlanAboutToExpire,
        isCycle1Pending,
        cycle2Expiry,
        displayColor,
        alertMessage,
        shouldShowUrgentOverlay: hasPendingPayment && (hasMultipleOutstanding || isCycle1Pending || isPlanAboutToExpire),
        planName: subscription?.plan_name || subscription?.plan_id || 'Unknown Plan',
        deadline: getPaymentDeadline(subscription, payments),
    };
};

export const formatBillingAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

export const getDismissStorageKey = (membershipId, totalDue, cycleCount, isExpiring = false) => {
    return `billingOverdueDismissed_${membershipId}_${totalDue}_${cycleCount}_${isExpiring ? 'expire' : 'pending'}`;
};

export const getNavBillingBadge = (subscription, payments) => {
    if (!subscription) {
        return { status: 'unknown', message: '', color: 'gray', daysLeft: 0 };
    }

    const planName = subscription.plan_name || subscription.plan_id || 'Plan';
    const planAmount = getPlanCatalogPrice(subscription.plan_id || subscription.plan_name)
        ?? parseFloat(subscription.amount)
        ?? 0;
    const summary = getBillingPaymentSummary(subscription, payments);

    if (summary.isPlanAboutToExpire) {
        return {
            status: 'expiring',
            message: `${planName} · Plan about to expire`,
            color: 'red',
            daysLeft: 0,
        };
    }

    if (summary.hasPendingPayment && summary.hasMultipleOutstanding) {
        return {
            status: 'overdue',
            message: `${planName} · ${summary.outstandingCount} cycles · ${formatBillingAmount(summary.totalDue)} due`,
            color: 'red',
            daysLeft: summary.daysLeft ?? 0,
        };
    }

    if (summary.hasPendingPayment && summary.isCycle1Pending) {
        const dueLabel = formatBillingAmount(summary.totalDue);
        return {
            status: 'pending',
            message: `${planName} · ${dueLabel} · ${summary.daysLeft}d left`,
            color: 'red',
            daysLeft: summary.daysLeft,
        };
    }

    if (summary.hasPendingPayment && summary.cycle2Expiry.cycle) {
        return {
            status: 'active',
            message: `${planName} · ${formatBillingAmount(planAmount)} Active`,
            color: 'green',
            daysLeft: summary.cycle2Expiry.daysUntilWarning,
        };
    }

    if (summary.hasPendingPayment) {
        return {
            status: 'pending',
            message: `${planName} · ${formatBillingAmount(summary.totalDue)} Due`,
            color: 'red',
            daysLeft: summary.daysLeft,
        };
    }

    return {
        status: 'active',
        message: `${planName} · ${formatBillingAmount(planAmount)} Active`,
        color: 'green',
        daysLeft: subscription.remaining_days ?? 0,
    };
};
