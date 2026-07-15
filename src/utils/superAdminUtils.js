export const SUPER_ADMIN_EMAIL = 'superadmin@treasure.com';
export const SUPER_ADMIN_PHONE = '20171985';

export const isSuperAdminUser = (user = {}) => {
    const email = String(user?.results?.email || user?.email || '').toLowerCase();
    const phone = String(user?.results?.phone || user?.phone || '');

    return email === SUPER_ADMIN_EMAIL || phone === SUPER_ADMIN_PHONE;
};
