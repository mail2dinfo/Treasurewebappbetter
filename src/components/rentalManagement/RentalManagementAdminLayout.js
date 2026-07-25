import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RentalManagementProvider } from '../../context/rentalManagement/RentalManagementContext';
import { BillingProvider } from '../../context/billing_context';
import BillingAppGuards from '../BillingAppGuards';
import RentalManagementNavbar from './RentalManagementNavbar';
import RentalManagementAppMenuBar from './RentalManagementAppMenuBar';
import { RM_BASE_PATH } from './rentalManagementMenuItems';
import RentalManagementDashboard from '../../pages/rentalManagement/RentalManagementDashboard';
import RentalManagementPrepareAgreementPage from '../../pages/rentalManagement/RentalManagementPrepareAgreementPage';
import RentalManagementCompanyPage from '../../pages/rentalManagement/RentalManagementCompanyPage';
import RentalManagementTenantsPage from '../../pages/rentalManagement/RentalManagementTenantsPage';
import RentalManagementPropertiesPage from '../../pages/rentalManagement/RentalManagementPropertiesPage';
import RentalManagementAgreementsPage from '../../pages/rentalManagement/RentalManagementAgreementsPage';
import RentalManagementEditAgreementPage from '../../pages/rentalManagement/RentalManagementEditAgreementPage';
import RentalManagementCollectionsPage from '../../pages/rentalManagement/RentalManagementCollectionsPage';
import MyBillingPage from '../../pages/MyBillingPage';
import PrivateRoute from '../../pages/PrivateRoute';

const RentalManagementAdminLayout = () => (
  <RentalManagementProvider>
    <BillingProvider
      appCode="RENTAL_MANAGEMENT"
      billingPath="/rental-management/user/billing"
    >
      <BillingAppGuards>
        <div className="min-h-screen bg-gray-50">
          <RentalManagementNavbar />
          <RentalManagementAppMenuBar basePath={RM_BASE_PATH} />
          <div className="min-h-[calc(100vh-112px)]">
            <Switch>
              <PrivateRoute exact path="/rental-management/user" component={RentalManagementDashboard} />
              <PrivateRoute exact path="/rental-management/user/dashboard" component={RentalManagementDashboard} />
              <PrivateRoute exact path="/rental-management/user/prepare-agreement" component={RentalManagementPrepareAgreementPage} />
              <PrivateRoute exact path="/rental-management/user/company" component={RentalManagementCompanyPage} />
              <PrivateRoute exact path="/rental-management/user/tenants" component={RentalManagementTenantsPage} />
              <PrivateRoute exact path="/rental-management/user/properties" component={RentalManagementPropertiesPage} />
              <PrivateRoute exact path="/rental-management/user/agreements" component={RentalManagementAgreementsPage} />
              <PrivateRoute exact path="/rental-management/user/agreements/:id" component={RentalManagementEditAgreementPage} />
              <PrivateRoute exact path="/rental-management/user/collections" component={RentalManagementCollectionsPage} />
              <PrivateRoute exact path="/rental-management/user/billing" component={MyBillingPage} />
              <Route path="/rental-management/user" component={RentalManagementDashboard} />
            </Switch>
          </div>
          <footer className="bg-white border-t border-gray-200 py-4">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Rental Management. Part of MyTreasure Finance Hub.
            </p>
          </footer>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </BillingAppGuards>
    </BillingProvider>
  </RentalManagementProvider>
);

export default RentalManagementAdminLayout;
