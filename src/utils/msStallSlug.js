/** Slug for stall public URL — derived from stall profile name (no DB column). */
export const slugifyStallName = (name) =>
  String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export const stallPublicPath = (name) => {
  const slug = slugifyStallName(name);
  return slug ? `/${slug}` : '/mutton-stall/customer/dashboard';
};

/** Segments that must never be treated as stall slugs */
export const RESERVED_STALL_SLUGS = new Set([
  'login', 'signup', 'sign-up', 'verify-otp', 'forget-password', 'forgot-password',
  'app-selection', 'platform', 'super-admin', 'customer', 'collector', 'subscriber',
  'chit-fund', 'daily-collection', 'vehicle-finance', 'personal-loan', 'personal-finance',
  'rental-management', 'hostel-management', 'mutton-stall', 'stall', 'api', 'static',
  'assets', 'home', 'dashboard', 'billing', 'help', 'faq',
]);
