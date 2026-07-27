import React from 'react'
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import {
  FaWhatsapp,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaUsers,
  FaHandshake,
  FaAward,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram
} from "react-icons/fa";

const Footer = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const stats = [
    { number: "10,000+", label: "Happy Clients", icon: FaUsers },
    { number: "50,000+", label: "Groups Created", icon: FaHandshake },
    { number: "₹100Cr+", label: "Amount Managed", icon: FaAward }
  ];

  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "Login", path: "/login" },
    { name: "Signup", path: "/signup" },
    { name: "Start a Group", path: "/startagroup" },
    { name: "Help", path: "/help" },
    { name: "FAQ", path: "/faq" }
  ];

  const legalLinks = [
    { name: "Terms & Conditions", path: "/Terms&Conditions" },
    { name: "Privacy Policy", path: "/Privacy&Policy" }
  ];

  const socialLinks = [
    { name: "Facebook", icon: FaFacebook, href: "#", color: "hover:text-blue-500" },
    { name: "Twitter", icon: FaTwitter, href: "#", color: "hover:text-blue-400" },
    { name: "LinkedIn", icon: FaLinkedin, href: "#", color: "hover:text-blue-600" },
    { name: "Instagram", icon: FaInstagram, href: "#", color: "hover:text-pink-500" }
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Stats Section - Only show on home page */}
      {isHomePage && (
        <div className="bg-red-600 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {stats.map((stat, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                  <div className="text-red-100 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Footer Content */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-6">
              <Link to="/" className="block">
                <img src={logo} alt="Treasure" className="h-12 w-auto" />
              </Link>

              <p className="text-gray-300 leading-relaxed">
                Revolutionizing the chit fund industry with modern technology and AI-powered solutions.
                Your trusted partner for secure and transparent financial management.
              </p>

              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className={`w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 transition-colors duration-300 ${social.color}`}
                    aria-label={social.name}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white border-b-2 border-red-600 pb-2 w-fit">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <Link
                      to={link.path}
                      className="text-gray-300 hover:text-red-400 transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white border-b-2 border-red-600 pb-2 w-fit">
                Contact Us
              </h3>
              <div className="space-y-4">
                {/* Address */}
                <div className="flex items-start space-x-3">
                  <FaMapMarkerAlt className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <div className="text-gray-300">
                    <p className="font-medium">Head Office</p>
                    <p className="text-sm">
                      Mytreasure Pvt Ltd,<br />
                      Raja Rajeshwari Nagar,<br />
                      Saravanampatti,<br />
                      Coimbatore, Tamil Nadu 641035,<br />
                      India
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center space-x-3">
                  <FaPhone className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div className="text-gray-300">
                    <p className="font-medium">Phone</p>
                    <p className="text-sm">+91 9942393237</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center space-x-3">
                  <FaEnvelope className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div className="text-gray-300">
                    <p className="font-medium">Email</p>
                    <p className="text-sm">support@mytreasure.in</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp & Legal */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white border-b-2 border-red-600 pb-2 w-fit">
                Get in Touch
              </h3>

              {/* WhatsApp Button */}
              <div className="space-y-4">
                <a
                  href={`https://api.whatsapp.com/send?phone=919942393237&text=${encodeURIComponent('Hi, I would like to know more about MyTreasure chit fund software.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <FaWhatsapp className="w-5 h-5 mr-2" />
                  Chat on WhatsApp
                </a>

                <p className="text-sm text-gray-400">
                  Get instant support and answers to your queries
                </p>
              </div>

              {/* Legal Links */}
              <div className="pt-4 border-t border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-3">Legal</h4>
                <ul className="space-y-2">
                  {legalLinks.map((link, index) => (
                    <li key={index}>
                      <Link
                        to={link.path}
                        className="text-gray-300 hover:text-red-400 transition-colors duration-300 text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2024 MyTreasure.in. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>Made with ❤️ in India</span>
              <span>•</span>
              <span>Powered by AI</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer;
