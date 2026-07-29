import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HostelManagementProvider } from '../../context/hostelManagement/HostelManagementContext';
import { BillingProvider } from '../../context/billing_context';
import BillingAppGuards from '../BillingAppGuards';
import HostelManagementNavbar from './HostelManagementNavbar';
import HostelManagementAppMenuBar from './HostelManagementAppMenuBar';
import PrivateRoute from '../../pages/PrivateRoute';
import HostelManagementDashboard from '../../pages/hostelManagement/HostelManagementDashboard';
import HostelManagementHostelsPage from '../../pages/hostelManagement/HostelManagementHostelsPage';
import HostelManagementFloorsRoomsPage from '../../pages/hostelManagement/HostelManagementFloorsRoomsPage';
import HostelManagementResidentsPage from '../../pages/hostelManagement/HostelManagementResidentsPage';
import HostelManagementDuesDeckPage from '../../pages/hostelManagement/HostelManagementDuesDeckPage';
import HostelManagementReceivablesPage from '../../pages/hostelManagement/HostelManagementReceivablesPage';
import HostelManagementOutstandingPage from '../../pages/hostelManagement/HostelManagementOutstandingPage';
import HostelManagementPaymentsPage from '../../pages/hostelManagement/HostelManagementPaymentsPage';
import HostelManagementFoodReportPage from '../../pages/hostelManagement/HostelManagementFoodReportPage';
import HostelManagementSpecialOrdersPage from '../../pages/hostelManagement/HostelManagementSpecialOrdersPage';
import {
  HostelManagementTurfsPage,
  HostelManagementShuttleCourtsPage,
} from '../../pages/hostelManagement/HostelManagementVenuesPage';
import HostelManagementLedgerPage from '../../pages/hostelManagement/HostelManagementLedgerPage';
import HostelManagementAdminSettingsPage from '../../pages/hostelManagement/HostelManagementAdminSettingsPage';
import MyBillingPage from '../../pages/MyBillingPage';
import PlatformEmployeesPage from '../../pages/PlatformEmployeesPage';
import { useHmPermission } from './useHmPermission';
import { HM_NAV_ANY } from '../../utils/hmPermissionCatalog';

const HmPermissionGate = ({ featureKeys, children }) => {
  const { canAny, enforceAccess } = useHmPermission();
  if (enforceAccess && !canAny(featureKeys)) {
    return <Redirect to="/hostel-management/user/dashboard" />;
  }
  return children;
};

const PermissionRoute = ({ component: Component, featureKeys, ...rest }) => (
  <PrivateRoute
    {...rest}
    component={(props) => (
      <HmPermissionGate featureKeys={featureKeys}>
        <Component {...props} />
      </HmPermissionGate>
    )}
  />
);

const HostelEmployeesPage = () => (
  <PlatformEmployeesPage
    appScope="HOSTEL_MANAGEMENT"
    managerMode
    embedded
    backPath="/hostel-management/user/dashboard"
    pageTitle="Hostel Employees"
  />
);

const HostelOwnerEmployeesPage = () => (
  <PlatformEmployeesPage
    appScope="HOSTEL_MANAGEMENT"
    embedded
    backPath="/hostel-management/user/dashboard"
    pageTitle="Hostel Employees & Access"
  />
);

const HostelEmployeesGateway = () => {
  const { enforceAccess, roleCode } = useHmPermission();
  if (enforceAccess && roleCode === 'MANAGER') {
    return <HostelEmployeesPage />;
  }
  return <HostelOwnerEmployeesPage />;
};

const HostelManagementAdminLayout = () => (
  <HostelManagementProvider>
    <BillingProvider appCode="HOSTEL_MANAGEMENT" billingPath="/hostel-management/user/billing">
      <BillingAppGuards>
        <div className="min-h-screen bg-gray-50">
          <HostelManagementNavbar />
          <HostelManagementAppMenuBar />
          <div className="min-h-[calc(100vh-112px)]">
            <Switch>
              <PrivateRoute exact path="/hostel-management/user" component={HostelManagementDashboard} />
              <PrivateRoute exact path="/hostel-management/user/dashboard" component={HostelManagementDashboard} />
              <PermissionRoute exact path="/hostel-management/user/hostels" component={HostelManagementHostelsPage} featureKeys={HM_NAV_ANY.hostels} />
              <PermissionRoute exact path="/hostel-management/user/floors-rooms" component={HostelManagementFloorsRoomsPage} featureKeys={HM_NAV_ANY.floorsRooms} />
              <PermissionRoute exact path="/hostel-management/user/residents" component={HostelManagementResidentsPage} featureKeys={HM_NAV_ANY.residents} />
              <PermissionRoute exact path="/hostel-management/user/dues-deck" component={HostelManagementDuesDeckPage} featureKeys={HM_NAV_ANY.duesDeck} />
              <PermissionRoute exact path="/hostel-management/user/receivables" component={HostelManagementReceivablesPage} featureKeys={HM_NAV_ANY.receivables} />
              <PermissionRoute exact path="/hostel-management/user/outstanding" component={HostelManagementOutstandingPage} featureKeys={HM_NAV_ANY.outstanding} />
              <PermissionRoute exact path="/hostel-management/user/payments" component={HostelManagementPaymentsPage} featureKeys={HM_NAV_ANY.payments} />
              <PermissionRoute exact path="/hostel-management/user/food-report" component={HostelManagementFoodReportPage} featureKeys={HM_NAV_ANY.foodReport} />
              <PermissionRoute exact path="/hostel-management/user/special-orders" component={HostelManagementSpecialOrdersPage} featureKeys={HM_NAV_ANY.specialOrders} />
              <PermissionRoute exact path="/hostel-management/user/turfs" component={HostelManagementTurfsPage} featureKeys={HM_NAV_ANY.turfs} />
              <PermissionRoute exact path="/hostel-management/user/shuttle-courts" component={HostelManagementShuttleCourtsPage} featureKeys={HM_NAV_ANY.shuttleCourts} />
              <PermissionRoute exact path="/hostel-management/user/ledger" component={HostelManagementLedgerPage} featureKeys={HM_NAV_ANY.ledger} />
              <PermissionRoute exact path="/hostel-management/user/employees" component={HostelEmployeesGateway} featureKeys={HM_NAV_ANY.employees} />
              <PermissionRoute exact path="/hostel-management/user/adminsettings" component={HostelManagementAdminSettingsPage} featureKeys={HM_NAV_ANY.adminSettings} />
              <PrivateRoute exact path="/hostel-management/user/billing" component={MyBillingPage} />
              <Route path="/hostel-management/user" component={HostelManagementDashboard} />
            </Switch>
          </div>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </BillingAppGuards>
    </BillingProvider>
  </HostelManagementProvider>
);

export default HostelManagementAdminLayout;
