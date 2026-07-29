import React, { useState } from "react";
import { FaPhone, FaRocket, FaWhatsapp } from "react-icons/fa";
import SignupModal from "./SignupModal";
import LoginModal from "./LoginModal";
import RequestDemoModal from "./RequestDemoModal";
import { buildWhatsAppChatUrl } from "../utils/whatsappUtils";
import TreasureBoxLogo from "./TreasureBoxLogo";

const APPS = [
    {
        code: "CF",
        color: "red",
        title: "Chit Fund",
        plain: "Groups, auctions & collections",
    },
    {
        code: "DC",
        color: "blue",
        title: "Daily Collection",
        plain: "Daily dues & collectors",
    },
    {
        code: "VF",
        color: "green",
        title: "Vehicle Finance",
        plain: "Two-wheeler loans & EMI",
    },
    {
        code: "PL",
        color: "orange",
        title: "Personal Loan",
        plain: "Loans & instalments",
    },
    {
        code: "HM",
        color: "teal",
        title: "Hostel",
        plain: "Beds, rent & food",
    },
    {
        code: "RM",
        color: "violet",
        title: "Rental",
        plain: "Properties & rent",
    },
];

const colorMap = {
    red: { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" },
    blue: { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200" },
    green: { bg: "bg-green-100", text: "text-green-700", ring: "ring-green-200" },
    orange: { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-200" },
    teal: { bg: "bg-teal-100", text: "text-teal-700", ring: "ring-teal-200" },
    violet: { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-200" },
};

/** MyTreasure at center; apps orbit around it */
const MyTreasureAppOrbit = () => {
    const count = APPS.length;

    return (
        <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-2xl p-4 sm:p-6 border border-red-100">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 text-center">
                One MyTreasure — many businesses
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4 text-center max-w-lg mx-auto">
                MyTreasure sits in the middle. Around it are the apps that help your work.
            </p>

            {/* Desktop / tablet: circular orbit */}
            <div
                className="relative mx-auto hidden sm:block w-full max-w-[28rem] md:max-w-[32rem] aspect-square"
                aria-label="MyTreasure connected to all business apps"
            >
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[78%] h-[78%] rounded-full border-2 border-dashed border-red-200/80 pointer-events-none"
                    aria-hidden
                />
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[52%] h-[52%] rounded-full bg-red-100/40 pointer-events-none"
                    aria-hidden
                />

                {/* Center hub */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white shadow-xl ring-4 ring-white">
                    <TreasureBoxLogo variant="inverse" className="w-10 h-10 md:w-12 md:h-12 mb-1" />
                    <span className="text-sm md:text-base font-bold leading-tight">MyTreasure</span>
                    <span className="text-[10px] text-red-100 mt-0.5">One login</span>
                </div>

                {/* Orbiting apps */}
                {APPS.map((app, index) => {
                    const angle = (360 / count) * index - 90;
                    const colors = colorMap[app.color];
                    return (
                        <div
                            key={app.code}
                            className="absolute left-1/2 top-1/2 z-10 w-[5.75rem] md:w-28"
                            style={{
                                transform: `rotate(${angle}deg) translate(min(36vw, 11rem)) rotate(${-angle}deg) translate(-50%, -50%)`,
                            }}
                        >
                            <div
                                className={`app-orbit-zoom rounded-2xl bg-white shadow-md border border-gray-100 p-2.5 md:p-3 text-center ring-2 ${colors.ring}`}
                                style={{ '--app-zoom-delay': `${index * 1.2}s` }}
                            >
                                <div
                                    className={`mx-auto mb-1.5 w-9 h-9 md:w-10 md:h-10 ${colors.bg} rounded-full flex items-center justify-center`}
                                >
                                    <span className={`text-xs md:text-sm font-bold ${colors.text}`}>
                                        {app.code}
                                    </span>
                                </div>
                                <p className="text-[11px] md:text-xs font-semibold text-gray-900 leading-tight">
                                    {app.title}
                                </p>
                                <p className="hidden md:block text-[10px] text-gray-500 mt-0.5 leading-snug">
                                    {app.plain}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile: center + surrounding apps */}
            <div className="sm:hidden space-y-4">
                <div className="flex justify-center">
                    <div className="flex flex-col items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white shadow-xl ring-4 ring-white">
                        <span className="text-sm font-bold">MyTreasure</span>
                        <span className="text-[10px] text-red-100">Center</span>
                    </div>
                </div>
                <p className="text-center text-xs text-gray-500 font-medium">Helps these businesses ↓</p>
                <div className="grid grid-cols-2 gap-2.5">
                    {APPS.map((app, index) => {
                        const colors = colorMap[app.color];
                        return (
                            <div
                                key={app.code}
                                className={`app-orbit-zoom flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 p-3 shadow-sm ring-1 ${colors.ring}`}
                                style={{ '--app-zoom-delay': `${index * 1.2}s` }}
                            >
                                <div
                                    className={`w-9 h-9 shrink-0 ${colors.bg} rounded-full flex items-center justify-center`}
                                >
                                    <span className={`text-xs font-bold ${colors.text}`}>{app.code}</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-gray-900 truncate">{app.title}</p>
                                    <p className="text-[10px] text-gray-500 leading-snug">{app.plain}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const Hero = () => {
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showDemoModal, setShowDemoModal] = useState(false);

    return (
        <section className="min-h-[100svh] bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center">
            <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
                <div className="w-full space-y-6 sm:space-y-8">
                    <div className="bg-gradient-to-r from-red-50 via-white to-blue-50 rounded-2xl border border-red-100 shadow-sm overflow-visible">
                        <div className="bg-red-600 text-white px-4 sm:px-6 md:px-8 py-4 sm:py-5 rounded-2xl overflow-visible">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-xl bg-white/15 p-1.5 ring-1 ring-white/30">
                                        <TreasureBoxLogo variant="inverse" className="w-full h-full" />
                                    </div>
                                    <div className="min-w-0">
                                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Mytreasure</h1>
                                        <p className="text-red-100 text-xs sm:text-sm truncate">
                                            Simple software for your finance business
                                        </p>
                                    </div>
                                </div>

                                <a
                                    href="tel:+919942393237"
                                    className="hero-call-cta group relative flex items-center gap-2 sm:gap-3 shrink-0 rounded-full bg-white/15 hover:bg-white/25 border border-white/40 px-2.5 py-1.5 sm:px-4 sm:py-2.5 transition-all duration-300 hover:scale-105 overflow-visible"
                                    aria-label="Need help? Call us at 9942393237"
                                >
                                    <span className="hero-call-icon relative inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-red-600 shadow-md overflow-visible">
                                        <span className="hero-call-wave hero-call-wave--3" aria-hidden />
                                        <FaPhone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </span>
                                    <span className="flex flex-col leading-tight pr-1">
                                        <span className="text-[10px] sm:text-xs text-red-100 font-medium">
                                            Need help? Call us
                                        </span>
                                        <span className="text-sm sm:text-base font-bold text-white tracking-wide">
                                            9942393237
                                        </span>
                                    </span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <MyTreasureAppOrbit />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => setShowDemoModal(true)}
                            className="inline-flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg text-sm sm:text-base w-full"
                        >
                            <FaWhatsapp className="w-5 h-5 mr-2 shrink-0" />
                            See a free demo
                        </button>
                        <a
                            href={buildWhatsAppChatUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-white text-green-700 font-semibold rounded-lg border-2 border-green-600 hover:bg-green-50 transition-colors shadow-md text-sm sm:text-base w-full"
                        >
                            <FaWhatsapp className="w-5 h-5 mr-2 shrink-0" />
                            Chat on WhatsApp
                        </a>
                        <button
                            type="button"
                            onClick={() => setShowSignupModal(true)}
                            className="inline-flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg text-sm sm:text-base w-full"
                        >
                            <FaRocket className="w-5 h-5 mr-2 shrink-0" />
                            Create free account
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowLoginModal(true)}
                            className="inline-flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base w-full"
                        >
                            Already a user? Login
                        </button>
                    </div>
                </div>
            </div>

            <SignupModal
                isOpen={showSignupModal}
                onClose={() => setShowSignupModal(false)}
            />
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
            />
            <RequestDemoModal
                isOpen={showDemoModal}
                onClose={() => setShowDemoModal(false)}
            />
        </section>
    );
};

export default Hero;
