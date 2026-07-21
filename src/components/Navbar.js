import React from 'react';
import {
  FaBars,
  FaQuestionCircle,
  FaInfoCircle
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { links } from '../utils/constants';
import CartButtons from './CartButtons';
import { useUserContext } from '../context/user_context';
import { useBilling } from '../context/billing_context';
import { getNavBillingBadge } from '../utils/billingPaymentUtils';
import MyTreasureBrand from './MyTreasureBrand';
import FinanceHubNavButton from './FinanceHubNavButton';

const NAV_TOP_LINKS = links.filter(
  (link) => String(link.text || '').toLowerCase() !== 'start group'
);

const navLinkClass =
  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-white hover:text-red-100 hover:bg-white/10 transition-all duration-300';

const Nav = () => {
  const { isLoggedIn, openSidebar } = useUserContext();
  const { subscription, payments, billingPath } = useBilling();
  const billingBadge = getNavBillingBadge(subscription, payments);

  const getIconForLink = (text) => {
    switch (text.toLowerCase()) {
      case 'help':
        return <FaQuestionCircle className="w-4 h-4" />;
      case 'faq':
        return <FaInfoCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <MyTreasureBrand
              to="/chit-fund/user/home"
              subtitle="Chit Fund"
              inverse
              className="transition-transform duration-300 hover:scale-105"
            />
          </div>

          <div className="hidden lg:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <FinanceHubNavButton
                className={navLinkClass}
                iconClassName="w-4 h-4"
              />
              {isLoggedIn && (
                <Link
                  to={billingPath || '/chit-fund/user/billing'}
                  className={`${navLinkClass} relative`}
                >
                  <div className="relative">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    {billingBadge.status !== 'unknown' && (
                      <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${billingBadge.color === 'red' ? 'bg-red-500' :
                        billingBadge.color === 'blue' ? 'bg-blue-500' :
                          billingBadge.color === 'green' ? 'bg-green-500' : 'bg-gray-500'
                        }`}></span>
                    )}
                  </div>
                  <span>Billing</span>
                  {billingBadge.status !== 'unknown' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${billingBadge.color === 'red' ? 'bg-red-100 text-red-800' :
                      billingBadge.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        billingBadge.color === 'green' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                      {billingBadge.message}
                    </span>
                  )}
                </Link>
              )}
              {NAV_TOP_LINKS.map((link) => {
                const { id, text, url } = link;
                return (
                  <Link
                    key={id}
                    to={url}
                    className={navLinkClass}
                  >
                    {getIconForLink(text)}
                    {text}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:block">
            <CartButtons scrolled />
          </div>

          <div className="lg:hidden">
            <button
              type="button"
              onClick={openSidebar}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-red-100 hover:bg-white/10 transition-all duration-300"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <FaBars className="block h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
