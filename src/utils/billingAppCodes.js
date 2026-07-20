export const BILLING_APP_CODES = Object.freeze({
  CHIT_FUND: 'CHIT_FUND',
  DAILY_COLLECTION: 'DAILY_COLLECTION',
  VEHICLE_FINANCE: 'VEHICLE_FINANCE',
  PERSONAL_LOAN: 'PERSONAL_LOAN',
});

export const DEFAULT_BILLING_APP_CODE = BILLING_APP_CODES.CHIT_FUND;

export const BILLING_PATHS = Object.freeze({
  CHIT_FUND: '/chit-fund/user/billing',
  DAILY_COLLECTION: '/daily-collection/user/billing',
  VEHICLE_FINANCE: '/vehicle-finance/user/billing',
  PERSONAL_LOAN: '/personal-loan/user/billing',
});

export const getBillingPathForApp = (appCode) =>
  BILLING_PATHS[appCode] || BILLING_PATHS.CHIT_FUND;

export const normalizeBillingAppCode = (value) => {
  if (value == null || value === '') return DEFAULT_BILLING_APP_CODE;
  const normalized = String(value).trim().toUpperCase();
  return Object.values(BILLING_APP_CODES).includes(normalized)
    ? normalized
    : DEFAULT_BILLING_APP_CODE;
};
