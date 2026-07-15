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

export const mergePlansWithCatalog = (apiPlans = []) => {
    const source = apiPlans.length > 0 ? apiPlans : BILLING_PLANS;

    return source.map((plan) => {
        const catalogPlan = catalogById[plan.id];
        if (!catalogPlan) return plan;

        return {
            ...plan,
            name: catalogPlan.name,
            price: catalogPlan.price,
            features: catalogPlan.features
        };
    });
};
