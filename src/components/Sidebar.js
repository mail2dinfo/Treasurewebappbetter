import React from 'react'
import { Link } from 'react-router-dom'
import {
  FaTimes,
  FaQuestionCircle,
  FaInfoCircle
} from 'react-icons/fa'
import { links } from '../utils/constants'
import CartButtons from './CartButtons'
import { useUserContext } from '../context/user_context'
import { useBilling } from '../context/billing_context'
import { getNavBillingBadge } from '../utils/billingPaymentUtils'
import MyTreasureBrand from './MyTreasureBrand'
import FinanceHubNavButton from './FinanceHubNavButton'

const SIDEBAR_TOP_LINKS = links.filter(
  (link) => String(link.text || '').toLowerCase() !== 'start group'
);

const Sidebar = () => {
  const { isLoggedIn, isSidebarOpen, closeSidebar } = useUserContext();
  const { subscription, payments, billingPath } = useBilling();

  const billingBadge = getNavBillingBadge(subscription, payments);

  const getIconForLink = (text) => {
    switch (text.toLowerCase()) {
      case 'help':
        return <FaQuestionCircle className="w-5 h-5" />;
      case 'faq':
        return <FaInfoCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={closeSidebar}
        />

        <div className={`fixed inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <MyTreasureBrand
                to="/chit-fund/user/home"
                subtitle="Chit Fund"
                onClick={closeSidebar}
              />
              <button
                type="button"
                onClick={closeSidebar}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-6 py-6">
              <ul className="space-y-2">
                <li>
                  <FinanceHubNavButton
                    onClick={closeSidebar}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                    iconClassName="w-5 h-5"
                  />
                </li>
                {isLoggedIn && (
                  <li>
                    <Link
                      to={billingPath || '/chit-fund/user/billing'}
                      onClick={closeSidebar}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group relative"
                    >
                      <div className="relative">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </li>
                )}
                {SIDEBAR_TOP_LINKS.map((link) => {
                  const { id, text, url } = link;
                  return (
                    <li key={id}>
                      <Link
                        to={url}
                        onClick={closeSidebar}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                      >
                        {getIconForLink(text)}
                        {text}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="p-6 border-t border-gray-200">
              <CartButtons />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
