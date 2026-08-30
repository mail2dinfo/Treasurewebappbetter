const getRawChitUserPhone = (groupDetails, user) => {
    const company = user?.userCompany;
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

/**
 * Opens PhonePe (UPI VPA = 10-digit number @ybl) with optional amount.
 * Android uses an intent so the PhonePe app is preferred over the dialer.
 */
export const buildPhonePePayHref = ({ phone, name, amount, note } = {}) => {
    const ten = getChitUserPhoneDigits(phone);
    if (ten.length !== 10) return null;

    const params = new URLSearchParams({
        pa: `${ten}@ybl`,
        pn: name || 'Chit fund',
        cu: 'INR',
    });
    if (Number(amount) > 0) {
        params.set('am', Number(amount).toFixed(2));
    }
    if (note) {
        params.set('tn', String(note).slice(0, 50));
    }

    const query = params.toString();
    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    if (isAndroid) {
        return `intent://pay?${query}#Intent;scheme=phonepe;package=com.phonepe.app;end`;
    }
    return `phonepe://pay?${query}`;
};

export const buildChitUserPhonePeHref = (groupDetails, user, amount, note) =>
    buildPhonePePayHref({
        phone: getRawChitUserPhone(groupDetails, user),
        name: groupDetails?.chitUserName || user?.userCompany?.name || 'Chit fund',
        amount,
        note,
    });
