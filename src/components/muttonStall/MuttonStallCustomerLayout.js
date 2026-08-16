import React from 'react';
import { Switch, Redirect, NavLink, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiShoppingBag, FiClipboard } from 'react-icons/fi';
import { MuttonStallProvider } from '../../context/muttonStall/MuttonStallContext';
import MuttonStallNavbar from './MuttonStallNavbar';
import PrivateRoute from '../../pages/PrivateRoute';
import MuttonStallCustomerPortalPage from '../../pages/muttonStall/MuttonStallCustomerPortalPage';
import { MS_CUSTOMER_BASE_PATH, MsBasePathProvider } from './muttonStallMenuItems';

const CustomerMenuBar = () => {
  const location = useLocation();
  const path = location.pathname || '';
  const orderActive = path.includes('/order') && !path.endsWith('/orders');
  const ordersActive = path.endsWith('/orders') || path.includes('/orders');

  return (
    <nav className="bg-white/95 border-b border-stone-200 sticky top-14 z-40 shadow-sm backdrop-blur" aria-label="Customer modules">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 py-2 overflow-x-auto">
        <NavLink
          to={`${MS_CUSTOMER_BASE_PATH}/order`}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
            orderActive || path.includes('/dashboard') || path === MS_CUSTOMER_BASE_PATH
              ? 'bg-rose-800 text-white shadow-sm'
              : 'text-stone-600 border border-transparent hover:bg-stone-50 hover:text-stone-900'
          }`}
        >
          <FiShoppingBag className="w-4 h-4" />
          Order
        </NavLink>
        <NavLink
          to={`${MS_CUSTOMER_BASE_PATH}/orders`}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
            ordersActive
              ? 'bg-rose-800 text-white shadow-sm'
              : 'text-stone-600 border border-transparent hover:bg-stone-50 hover:text-stone-900'
          }`}
        >
          <FiClipboard className="w-4 h-4" />
          My orders
        </NavLink>
      </div>
    </nav>
  );
};

/** Shared logged-in customer shell — one URL for all customers after login. */
const MuttonStallCustomerLayout = () => (
  <MuttonStallProvider>
    <MsBasePathProvider basePath={MS_CUSTOMER_BASE_PATH}>
      <div className="min-h-screen bg-gray-50">
        <MuttonStallNavbar />
        <CustomerMenuBar />
        <div className="min-h-[calc(100vh-112px)]">
          <Switch>
            <PrivateRoute exact path={MS_CUSTOMER_BASE_PATH} component={MuttonStallCustomerPortalPage} />
            <PrivateRoute exact path={`${MS_CUSTOMER_BASE_PATH}/dashboard`} component={MuttonStallCustomerPortalPage} />
            <PrivateRoute exact path={`${MS_CUSTOMER_BASE_PATH}/order`} component={MuttonStallCustomerPortalPage} />
            <PrivateRoute exact path={`${MS_CUSTOMER_BASE_PATH}/orders`} component={MuttonStallCustomerPortalPage} />
            <Redirect from={MS_CUSTOMER_BASE_PATH} to={`${MS_CUSTOMER_BASE_PATH}/dashboard`} />
          </Switch>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </MsBasePathProvider>
  </MuttonStallProvider>
);

export default MuttonStallCustomerLayout;
