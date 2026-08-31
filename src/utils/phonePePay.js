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

const buildUpiQuery = ({ phone, name, amount, note } = {}) => {
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
    return { ten, query: params.toString() };
};

/** Standard UPI link — Android Chrome opens PhonePe / GPay / others. */
export const buildUpiPayHref = (opts = {}) => {
    const built = buildUpiQuery(opts);
    return built ? `upi://pay?${built.query}` : null;
};

export const buildPhonePePayHref = (opts = {}) => {
    const built = buildUpiQuery(opts);
    return built ? `phonepe://pay?${built.query}` : null;
};

export const buildChitUserPhonePeHref = (groupDetails, user, amount, note) =>
    buildUpiPayHref({
        phone: getRawChitUserPhone(groupDetails, user),
        name: groupDetails?.chitUserName || user?.userCompany?.name || 'Chit fund',
        amount,
        note,
    });

export const openChitUserPhonePe = (groupDetails, user, amount, note) => {
    const phone = getRawChitUserPhone(groupDetails, user);
    const name = groupDetails?.chitUserName || user?.userCompany?.name || 'Chit fund';
    const built = buildUpiQuery({ phone, name, amount, note });
    if (!built) {
        window.alert('Chit fund user phone number is not available for PhonePe.');
        return;
    }

    const upiHref = `upi://pay?${built.query}`;
    const vpa = `${built.ten}@ybl`;
    const amt = Number(amount) > 0 ? `₹${Number(amount).toLocaleString('en-IN')}` : 'the due amount';

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobile = /android|iphone|ipad|ipod/i.test(ua);

    if (!isMobile) {
        window.alert(
            `Pay ${amt} in PhonePe to ${vpa}.\n\nOpen this page on your phone and tap Pay to launch PhonePe.`
        );
        return;
    }

    window.location.href = upiHref;
};
