// WhatsApp business number (country code + number, no + or spaces)
// Override in .env: REACT_APP_WHATSAPP_NUMBER=919942393237
export const WHATSAPP_NUMBER = (process.env.REACT_APP_WHATSAPP_NUMBER || '919942393237').replace(/\D/g, '');

// QR image shown on the demo success screen
export const WHATSAPP_QR_URL = process.env.REACT_APP_WHATSAPP_QR_URL || '/whatsapp-demo-qr.png';

/**
 * Builds an api.whatsapp.com/send link (same format as GRT Jewellers).
 * Works on both mobile (opens the app) and desktop (opens WhatsApp Web).
 */
export const buildWhatsAppSendUrl = (message = '') => {
    const base = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}`;
    return message ? `${base}&text=${encodeURIComponent(message)}` : base;
};

export const buildWhatsAppDemoUrl = (name, mobile) => {
    const message = `Hi, I'm ${name}. My mobile number is ${mobile}. I'd like to request a demo of MyTreasure chit fund software.`;
    return buildWhatsAppSendUrl(message);
};

export const buildWhatsAppChatUrl = (
    message = 'Hi, I would like to know more about MyTreasure chit fund software.'
) => buildWhatsAppSendUrl(message);

// Keep legacy alias so any other imports don't break
export const WHATSAPP_QR_CHAT_URL = buildWhatsAppSendUrl();

export const normalizeMobileNumber = (value) => value.replace(/\D/g, '');
