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
        <section className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="w-full">
                    {/* Content - Full Width */}
                    <div className="space-y-8">
                        {/* Main Content - Full Width */}
                        <div className="space-y-6">
                            {/* Hero Message */}
                            <div className="bg-gradient-to-r from-red-50 via-white to-blue-50 rounded-2xl border border-red-100 shadow-sm">
                                {/* Company Header */}
                                <div className="bg-red-600 text-white px-8 py-4 rounded-t-2xl">
                                    <div className="flex items-center space-x-3">
                                        {/* Company Logo */}
                                        <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                                            <img
                                                src="/logo.png"
                                                alt="Mytreasure Logo"
                                                className="w-full h-full object-contain"
                                                onError={(e) => {
                                                    // Fallback to text logo if image doesn't load
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                            <div className="w-full h-full bg-white rounded-lg flex items-center justify-center" style={{ display: 'none' }}>
                                                <span className="text-red-600 font-bold text-sm md:text-base">MT</span>
                                            </div>
                                        </div>

                                        <div>
                                            <h1 className="text-2xl md:text-3xl font-bold">Mytreasure</h1>
                                            <p className="text-red-100 text-sm">Finance Software & Apps Suite</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex-1">
                                            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                                                Complete Finance<br />
                                                <span className="text-red-600">Management Platform</span>
                                            </h2>

                                            <p className="text-xl text-gray-700 leading-relaxed">
                                                <span className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-bold mr-3">
                                                    One login, all apps!
                                                </span>
                                                Chit Funds, Daily Collections, Two Wheeler Loans - everything in one place.
                                            </p>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="flex items-center space-x-3 bg-white rounded-lg px-6 py-4 shadow-sm border border-red-200 ml-6">
                                            <FaPhone className="w-5 h-5 text-red-600" />
                                            <div>
                                                <p className="text-sm text-gray-500 font-medium">Call Now</p>
                                                <p className="text-lg font-bold text-gray-900">+91 9942393237</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Available Apps Section */}
                        <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-2xl p-6 border border-red-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Available Apps in MyTreasure</h3>
                            <p className="text-sm text-gray-600 mb-4 text-center">Access all apps with one login</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="flex flex-col items-center space-y-2 p-4 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                        <span className="text-red-600 font-bold text-lg">CF</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800 text-center">Chit Fund</span>
                                    <span className="text-xs text-gray-500 text-center">Management</span>
                                </div>
                                <div className="flex flex-col items-center space-y-2 p-4 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <span className="text-blue-600 font-bold text-lg">DC</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800 text-center">Daily Collection</span>
                                    <span className="text-xs text-gray-500 text-center">Tracking</span>
                                </div>
                                <div className="flex flex-col items-center space-y-2 p-4 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                        <span className="text-green-600 font-bold text-lg">2W</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800 text-center">Two Wheeler</span>
                                    <span className="text-xs text-gray-500 text-center">Loan</span>
                                </div>
                                <div className="flex flex-col items-center space-y-2 p-4 bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <span className="text-purple-600 font-bold text-lg">+</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-800 text-center">More Apps</span>
                                    <span className="text-xs text-gray-500 text-center">Coming Soon</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                            <button
                                onClick={() => setShowDemoModal(true)}
                                className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <FaWhatsapp className="w-5 h-5 mr-2" />
                                Request Demo
                            </button>
                            <a
                                href={buildWhatsAppChatUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-700 font-semibold rounded-lg border-2 border-green-600 hover:bg-green-50 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                            >
                                <FaWhatsapp className="w-5 h-5 mr-2" />
                                WhatsApp Me
                            </a>
                            <button
                                onClick={() => setShowSignupModal(true)}
                                className="inline-flex items-center justify-center px-8 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <FaRocket className="w-5 h-5 mr-2" />
                                Get Started Free
                            </button>
                            <button
                                onClick={() => setShowLoginModal(true)}
                                className="inline-flex items-center justify-center px-8 py-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-300"
                            >
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signup Modal */}
            <SignupModal
                isOpen={showSignupModal}
                onClose={() => setShowSignupModal(false)}
            />

            {/* Login Modal */}
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
