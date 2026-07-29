import React from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { buildWhatsAppChatUrl } from '../utils/whatsappUtils';

const HELP_MESSAGE =
    'Hi, I need help with MyTreasure. Could you please assist me?';

/**
 * Persistent WhatsApp chat entry point — fixed on the right so users can ping support anytime.
 */
const WhatsAppFloatingButton = () => (
    <a
        href={buildWhatsAppChatUrl(HELP_MESSAGE)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        title="Chat on WhatsApp"
        className="
            fixed z-[90] right-4 sm:right-6 top-1/2 -translate-y-1/2
            flex items-center gap-2
            pl-3.5 pr-4 py-3
            rounded-full
            bg-[#25D366] hover:bg-[#1ebe57]
            text-white font-semibold text-sm
            shadow-lg hover:shadow-xl
            transition-all duration-200
            hover:scale-105
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500
        "
    >
        <FaWhatsapp className="w-6 h-6 shrink-0" aria-hidden />
        <span className="hidden sm:inline">WhatsApp</span>
    </a>
);

export default WhatsAppFloatingButton;
