import React, { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiCheck, FiPhone, FiUser, FiX } from 'react-icons/fi';
import { API_BASE_URL } from '../utils/apiConfig';
import {
    WHATSAPP_QR_CHAT_URL,
    WHATSAPP_QR_URL,
    buildWhatsAppDemoUrl,
    normalizeMobileNumber,
} from '../utils/whatsappUtils';

const saveDemoRequest = async (name, mobile) => {
    const response = await fetch(`${API_BASE_URL}/marketing/demo-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name,
            mobile,
            source: 'landing_demo',
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Could not save demo request. Please try again.');
    }

    return data;
};

const RequestDemoModal = ({ isOpen, onClose }) => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedName, setSubmittedName] = useState('');
    const [whatsappUrl, setWhatsappUrl] = useState('');
    const [qrImageError, setQrImageError] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setName('');
        setMobile('');
        setError('');
        setIsSubmitted(false);
        setSubmittedName('');
        setIsSubmitting(false);
        setWhatsappUrl('');
        setQrImageError(false);
    }, [isOpen]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        const trimmedName = name.trim();
        const digits = normalizeMobileNumber(mobile);

        if (!trimmedName) {
            setError('Please enter your name.');
            return;
        }

        if (digits.length < 10) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }

        const formattedMobile = digits.length > 10 ? digits.slice(-10) : digits;
        const url = buildWhatsAppDemoUrl(trimmedName, formattedMobile);

        setIsSubmitting(true);

        try {
            await saveDemoRequest(trimmedName, formattedMobile);
            setSubmittedName(trimmedName);
            setWhatsappUrl(url);
            setIsSubmitted(true);
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayName = submittedName.trim().split(/\s+/)[0] || 'there';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Request a Demo</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            See MyTreasure chit fund software in action
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <FiX className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="demo-name" className="text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiUser className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="demo-name"
                                        type="text"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        placeholder="Your name"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white"
                                        autoComplete="name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="demo-mobile" className="text-sm font-medium text-gray-700">
                                    Mobile number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FiPhone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="demo-mobile"
                                        type="tel"
                                        value={mobile}
                                        onChange={(event) => setMobile(event.target.value)}
                                        placeholder="10-digit mobile number"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white"
                                        autoComplete="tel"
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 px-4 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <FaWhatsapp className="w-5 h-5" />
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>

                            <p className="text-xs text-center text-gray-500">
                                Our team will reach out to you shortly after you submit.
                            </p>
                        </form>
                    ) : (
                        <div className="text-center space-y-5">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <FiCheck className="w-8 h-8 text-green-600" />
                            </div>
                            <div className="rounded-xl border border-green-100 bg-green-50 px-5 py-6">
                                <h3 className="text-xl font-semibold text-gray-900 capitalize">
                                    Thank you, {displayName}!
                                </h3>
                                <p className="text-base text-gray-700 mt-3 leading-relaxed">
                                    We have received your demo request. Our team will call you soon on your
                                    registered mobile number.
                                </p>
                                <p className="text-sm text-gray-600 mt-3">
                                    Thanks a lot for your interest in MyTreasure chit fund software.
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-sm font-medium text-gray-800 mb-1">
                                    Chat with us on WhatsApp
                                </p>
                                <p className="text-xs text-gray-500 mb-3">
                                    Scan the QR code or tap below to start a chat instantly
                                </p>
                                <a
                                    href={whatsappUrl || WHATSAPP_QR_CHAT_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                                >
                                    <FaWhatsapp className="w-5 h-5" />
                                    Open WhatsApp Chat
                                </a>
                                {!qrImageError ? (
                                    <a
                                        href={WHATSAPP_QR_CHAT_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block mt-4"
                                        aria-label="Open WhatsApp chat via QR code"
                                    >
                                        <img
                                            src={WHATSAPP_QR_URL}
                                            alt="Scan to chat on WhatsApp"
                                            className="mx-auto h-44 w-44 rounded-lg border border-gray-200 bg-white object-contain p-2 transition hover:shadow-md"
                                            onError={() => setQrImageError(true)}
                                        />
                                    </a>
                                ) : (
                                    <a
                                        href={WHATSAPP_QR_CHAT_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-800"
                                    >
                                        Open WhatsApp chat link
                                    </a>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-3 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestDemoModal;
