// WhatsApp business number (country code + number, no + or spaces)
// Override in .env: REACT_APP_WHATSAPP_NUMBER=919942393237
export const WHATSAPP_NUMBER = (process.env.REACT_APP_WHATSAPP_NUMBER || '919942393237').replace(/\D/g, '');

// Direct WhatsApp chat link (QR short link)
// Override in .env: REACT_APP_WHATSAPP_QR_CHAT_URL=https://wa.me/qr/UHG5URAKABGAO1
export const WHATSAPP_QR_CHAT_URL =
    process.env.REACT_APP_WHATSAPP_QR_CHAT_URL || 'https://wa.me/qr/UHG5URAKABGAO1';

// QR image shown on the demo success screen
export const WHATSAPP_QR_URL = process.env.REACT_APP_WHATSAPP_QR_URL || '/whatsapp-demo-qr.png';

export const buildWhatsAppDemoUrl = (name, mobile) => {
    const message = `Hi, I'm ${name}. My mobile number is ${mobile}. I'd like to request a demo of MyTreasure chit fund software.`;
    // QR short link opens direct chat; pre-filled text when supported
    return `${WHATSAPP_QR_CHAT_URL}?text=${encodeURIComponent(message)}`;
};

export const buildWhatsAppChatUrl = (
    message = 'Hi, I would like to know more about MyTreasure chit fund software.'
) => `${WHATSAPP_QR_CHAT_URL}?text=${encodeURIComponent(message)}`;

export const normalizeMobileNumber = (value) => value.replace(/\D/g, '');
