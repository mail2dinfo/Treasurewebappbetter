import { getPlanCatalogPrice } from './billingPlans';

export const BILLING_CYCLE_CHANGE_GAP_DAYS = 5;

export const BASE_PLAN_PRICES = {
    VeryBasic: 100,
    Basic: 350,
    Medium: 500,
    Advance: 1000,
};

export const BILLING_CYCLE_MULTIPLIERS = {
    monthly: 1,
    quarterly: 3,
    yearly: 12,
};

export const BILLING_CYCLE_DISCOUNTS = {
    monthly: 0,
    quarterly: 0.05,
    yearly: 0.1,
};

export const BILLING_CYCLE_OPTIONS = [
    { id: 'monthly', label: 'Monthly', period: '1 month' },
    { id: 'quarterly', label: 'Quarterly', period: '3 months' },
    { id: 'yearly', label: 'Yearly', period: '12 months' },
];

export const getBasePlanPrice = (planId, basePriceOverride) => {
    if (basePriceOverride != null) {
        return Number(basePriceOverride);
    }

    return BASE_PLAN_PRICES[planId] ?? getPlanCatalogPrice(planId);
};

export const calculateBillingCycleAmount = (basePlanPrice, billingCycle) => {
    const cycle = (billingCycle || 'monthly').toLowerCase();
    const multiplier = BILLING_CYCLE_MULTIPLIERS[cycle] ?? 1;
    const discount = BILLING_CYCLE_DISCOUNTS[cycle] ?? 0;

    return Math.round(Number(basePlanPrice || 0) * multiplier * (1 - discount));
};

export const getAmountForBillingCycle = (planId, billingCycle, basePriceOverride) => {
    const basePlanPrice = getBasePlanPrice(planId, basePriceOverride);
    if (!basePlanPrice) {
        return null;
    }

    return calculateBillingCycleAmount(basePlanPrice, billingCycle);
};

export const getBillingCycleOptionsForPlan = (basePlanPrice) => {
    const base = Number(basePlanPrice || 0);

    return BILLING_CYCLE_OPTIONS.map((option) => {
        const multiplier = BILLING_CYCLE_MULTIPLIERS[option.id];
        const discount = BILLING_CYCLE_DISCOUNTS[option.id];
        const baseAmount = Math.round(base * multiplier);
        const price = calculateBillingCycleAmount(base, option.id);
        const savings = baseAmount - price;

        return {
            ...option,
            multiplier,
            discountPercent: Math.round(discount * 100),
            baseAmount,
            price,
            savings,
            description:
                option.id === 'monthly'
                    ? `Plan price ₹${base}`
                    : option.id === 'quarterly'
                        ? `₹${base} × 3 · ${Math.round(discount * 100)}% off`
                        : `₹${base} × 12 · ${Math.round(discount * 100)}% off`,
        };
    });
};

export const formatBillingCycleLabel = (billingCycle) => {
    const option = BILLING_CYCLE_OPTIONS.find((item) => item.id === billingCycle);
    return option?.label || billingCycle;
};

/** @deprecated Use getBasePlanPrice */
export const getMonthlyPlanPrice = getBasePlanPrice;

/** @deprecated Use BASE_PLAN_PRICES */
export const MONTHLY_PLAN_PRICES = BASE_PLAN_PRICES;
