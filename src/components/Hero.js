import React, { useState } from "react";
import { FaPhone, FaRocket, FaWhatsapp } from "react-icons/fa";
import SignupModal from "./SignupModal";
import LoginModal from "./LoginModal";
import RequestDemoModal from "./RequestDemoModal";
import { buildWhatsAppChatUrl } from "../utils/whatsappUtils";

const Hero = () => {
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showDemoModal, setShowDemoModal] = useState(false);

    return (
        <section className="min-h-[100svh] bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center">
            <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
                <div className="w-full space-y-6 sm:space-y-8">
                    {/* Hero Message */}
                    <div className="bg-gradient-to-r from-red-50 via-white to-blue-50 rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                        <div className="bg-red-600 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                                    <img
                                        src="/logo.png"
                                        alt="Mytreasure Logo"
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                    <div className="w-full h-full bg-white rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                                        <span className="text-red-600 font-bold text-sm md:text-base">MT</span>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Mytreasure</h1>
                                    <p className="text-red-100 text-xs sm:text-sm">Finance Software & Apps Suite</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 md:p-8">
                            <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-3 sm:mb-4">
                                        Complete Finance{' '}
                                        <br className="hidden sm:block" />
                                        <span className="text-red-600">Management Platform</span>
                                    </h2>

                                    <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed">
                                        <span className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 bg-red-100 text-red-700 rounded-full text-xs sm:text-sm font-bold mr-2 mb-2 align-middle">
                                            One login, all apps!
                                        </span>
                                        Chit Funds, Daily Collections, Two Wheeler Loans - everything in one place.
                                    </p>
                                </div>

                                <a
                                    href="tel:+919942393237"
                                    className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 sm:px-6 sm:py-4 shadow-sm border border-red-200 w-full sm:w-auto lg:ml-0 shrink-0"
                                >
                                    <FaPhone className="w-5 h-5 text-red-600 shrink-0" />
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-500 font-medium">Call Now</p>
                                        <p className="text-base sm:text-lg font-bold text-gray-900">+91 9942393237</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Available Apps */}
                    <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-2xl p-4 sm:p-6 border border-red-100">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 text-center">Available Apps in MyTreasure</h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 text-center">Access all apps with one login</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                            <div className="flex flex-col items-center space-y-1.5 sm:space-y-2 p-3 sm:p-4 bg-white rounded-xl shadow-md border border-gray-100">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <span className="text-red-600 font-bold text-base sm:text-lg">CF</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-800 text-center">Chit Fund</span>
                                <span className="text-[10px] sm:text-xs text-gray-500 text-center">Management</span>
                            </div>
                            <div className="flex flex-col items-center space-y-1.5 sm:space-y-2 p-3 sm:p-4 bg-white rounded-xl shadow-md border border-gray-100">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <span className="text-blue-600 font-bold text-base sm:text-lg">DC</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-800 text-center">Daily Collection</span>
                                <span className="text-[10px] sm:text-xs text-gray-500 text-center">Tracking</span>
                            </div>
                            <div className="flex flex-col items-center space-y-1.5 sm:space-y-2 p-3 sm:p-4 bg-white rounded-xl shadow-md border border-gray-100">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <span className="text-green-600 font-bold text-base sm:text-lg">2W</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-800 text-center">Two Wheeler</span>
                                <span className="text-[10px] sm:text-xs text-gray-500 text-center">Loan</span>
                            </div>
                            <div className="flex flex-col items-center space-y-1.5 sm:space-y-2 p-3 sm:p-4 bg-white rounded-xl shadow-md border border-gray-100">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <span className="text-purple-600 font-bold text-base sm:text-lg">+</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-800 text-center">More Apps</span>
                                <span className="text-[10px] sm:text-xs text-gray-500 text-center">Coming Soon</span>
                            </div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <button
                            type="button"
                            onClick={() => setShowDemoModal(true)}
                            className="inline-flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg text-sm sm:text-base w-full"
                        >
                            <FaWhatsapp className="w-5 h-5 mr-2 shrink-0" />
                            Request Demo
                        </button>
                        <a
                            href={buildWhatsAppChatUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-white text-green-700 font-semibold rounded-lg border-2 border-green-600 hover:bg-green-50 transition-colors shadow-md text-sm sm:text-base w-full"
                        >
                            <FaWhatsapp className="w-5 h-5 mr-2 shrink-0" />
                            WhatsApp Me
                        </a>
                        <button
                            type="button"
                            onClick={() => setShowSignupModal(true)}
                            className="inline-flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg text-sm sm:text-base w-full"
                        >
                            <FaRocket className="w-5 h-5 mr-2 shrink-0" />
                            Get Started Free
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowLoginModal(true)}
                            className="inline-flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base w-full"
                        >
                            Login
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
