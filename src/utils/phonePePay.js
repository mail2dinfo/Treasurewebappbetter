import { registerPlugin } from '@capacitor/core';

const UpiPay = registerPlugin('UpiPay', {
    web: {
        open: async ({ url }) => {
            if (url) {
                window.location.href = url;
            }
        },
    },
});

const getCompany = (user) => {
    const company = user?.userCompany || user?.results?.userCompany;
    if (Array.isArray(company)) return company[0] || null;
    return company || null;
};

const getRawChitUserPhone = (groupDetails, user) => {
    const company = getCompany(user);
    return (
        groupDetails?.chitUserPhone ||
        company?.phone ||
        company?.contactNumber ||
        company?.contact_no ||
        ''
    );
};

export const getChitUserPhoneDigits = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length >= 10) return digits.slice(-10);
    return '';
};

const buildUpiQuery = ({ phone, name, amount, note } = {}) => {
    const ten = getChitUserPhoneDigits(phone);
    if (ten.length !== 10) return null;

    const params = new URLSearchParams({
        pa: `${ten}@ybl`,
        pn: name || 'Chit fund',
        cu: 'INR',
        tr: `MT${Date.now()}`,
    });
    if (Number(amount) > 0) {
        params.set('am', Number(amount).toFixed(2));
    }
    if (note) {
        params.set('tn', String(note).slice(0, 50));
    }
    return { ten, query: params.toString() };
};

export const buildUpiPayHref = (opts = {}) => {
    const built = buildUpiQuery(opts);
    return built ? `upi://pay?${built.query}` : null;
};

export const buildPhonePePayHref = (opts = {}) => {
    const built = buildUpiQuery(opts);
    return built ? `phonepe://pay?${built.query}` : null;
};

export const buildChitUserPaySheet = (groupDetails, user, amount, note) => {
    const phone = getRawChitUserPhone(groupDetails, user);
    const name = groupDetails?.chitUserName || getCompany(user)?.name || 'Chit fund';
    const built = buildUpiQuery({ phone, name, amount, note });
    if (!built) {
        return {
            error: 'Chit fund user phone number is not available for UPI payment.',
            name,
            amount,
            note,
        };
    }
    return {
        error: null,
        name,
        amount,
        note,
        vpa: `${built.ten}@ybl`,
        upiHref: `upi://pay?${built.query}`,
        phonePeHref: `phonepe://pay?${built.query}`,
        intentHref: `intent://pay?${built.query}#Intent;scheme=upi;package=com.phonepe.app;end`,
    };
};

export const copyText = async (text) => {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (_) {
        /* fall through */
    }
    try {
        const input = document.createElement('textarea');
        input.value = text;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
        return true;
    } catch (_) {
        return false;
    }
};

export const launchUpiPay = async (hrefs = {}) => {
    const url = hrefs.upiHref || hrefs.phonePeHref || hrefs.intentHref;
    if (!url) return false;

    if (typeof window !== 'undefined' && window.MytreasureUpi && typeof window.MytreasureUpi.open === 'function') {
        window.MytreasureUpi.open(url);
        return true;
    }

    try {
        await UpiPay.open({ url, packageName: 'com.phonepe.app' });
        return true;
    } catch (_) {
        /* native plugin missing or rejected */
    }

    try {
        await UpiPay.open({ url: hrefs.phonePeHref || url });
        return true;
    } catch (_) {
        return false;
    }
};

export const buildChitUserPhonePeHref = (groupDetails, user, amount, note) =>
    buildUpiPayHref({
        phone: getRawChitUserPhone(groupDetails, user),
        name: groupDetails?.chitUserName || getCompany(user)?.name || 'Chit fund',
        amount,
        note,
    });
