export const BILLING_UPI_PHONE = '9942393237';
export const BILLING_UPI_PAYEE_NAME = 'MyTreasure';

export const BILLING_PAYMENT_METHODS = [
    { id: 'UPI', name: 'UPI', icon: '📱' },
    { id: 'NetBanking', name: 'Net Banking', icon: '🏦' },
    { id: 'Wallet', name: 'Wallet', icon: '💳' },
    { id: 'Cash', name: 'Cash', icon: '💵' },
];

export const buildUpiPaymentLink = (amount) => {
    const formattedAmount = Number(amount || 0).toFixed(2);
    const params = new URLSearchParams({
        pa: `${BILLING_UPI_PHONE}@ybl`,
        pn: BILLING_UPI_PAYEE_NAME,
        am: formattedAmount,
        cu: 'INR',
    });
    return `upi://pay?${params.toString()}`;
};

export const buildUpiQrCodeUrl = (amount, size = 220) => {
    const upiLink = buildUpiPaymentLink(amount);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiLink)}`;
};
