export const BILLING_PLANS = [
    {
        id: 'VeryBasic',
        name: 'VeryBasic',
        price: 100,
        features: [
            'Up to 25 subscribers',
            'Basic support',
            'Mobile app access',
            'Basic reporting'
        ]
    },
    {
        id: 'Basic',
        name: 'Basic',
        price: 350,
        features: [
            'Up to 50 subscribers',
            'Basic support',
            'Mobile app access',
            'Basic reporting'
        ]
    },
    {
        id: 'Medium',
        name: 'Medium',
        price: 500,
        features: [
            'Up to 250 subscribers',
            'Analytics dashboard',
            'Priority support',
            'Custom reporting',
            'SMS notifications'
        ]
    },
    {
        id: 'Advance',
        name: 'Advance',
        price: 1000,
        features: [
            'Unlimited subscribers',
            'Premium 24/7 support',
            'Full analytics suite',
            'Marketing automation',
            'API access',
            'Custom integrations'
        ]
    }
];

const catalogById = Object.fromEntries(BILLING_PLANS.map((plan) => [plan.id, plan]));

export const getPlanCatalogPrice = (planIdOrName) => {
    if (!planIdOrName) return null;
    const key = String(planIdOrName).replace(/\s+plan$/i, '').trim();
    return catalogById[key]?.price ?? null;
};

/** Prefer Super Admin / API monthly fee for this app; then subscription snapshot; then local catalog. */
export const getLivePlanPrice = (planIdOrName, availablePlans = [], fallbackAmount) => {
    const key = String(planIdOrName || '').replace(/\s+plan$/i, '').trim();
    const live = (availablePlans || []).find((plan) => {
        const id = String(plan.id || '').replace(/\s+plan$/i, '').trim();
        const name = String(plan.name || '').replace(/\s+plan$/i, '').trim();
        return id === key || name === key;
    });
    const livePrice = live?.price != null ? Number(live.price) : NaN;
    if (Number.isFinite(livePrice)) return livePrice;

    const snapshot = fallbackAmount != null && fallbackAmount !== '' ? Number(fallbackAmount) : NaN;
    if (Number.isFinite(snapshot)) return snapshot;

    return getPlanCatalogPrice(planIdOrName) ?? 0;
};

export const mergePlansWithCatalog = (apiPlans = []) => {
    const source = apiPlans.length > 0 ? apiPlans : BILLING_PLANS;

    return source.map((plan) => {
        const catalogPlan = catalogById[plan.id];
        if (!catalogPlan) return plan;

        const apiPrice = plan.price != null && plan.price !== ''
            ? Number(plan.price)
            : null;

        return {
            ...plan,
            name: catalogPlan.name,
            // Prefer live API / DB price; fall back to local catalog defaults
            price: Number.isFinite(apiPrice) ? apiPrice : catalogPlan.price,
            features: catalogPlan.features,
        };
    });
};
