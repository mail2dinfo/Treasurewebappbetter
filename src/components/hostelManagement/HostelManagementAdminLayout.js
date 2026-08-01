import React from 'react';
import { Switch, Route, Redirect, useLocation } from 'react-router-dom';
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
import {
  HM_BASE_PATH,
  HM_KITCHENSTAFF_BASE_PATH,
  HM_MANAGER_BASE_PATH,
  HM_RECEPTIONIST_BASE_PATH,
  HmBasePathProvider,
  getHmBasePathForRole,
  useHmBasePath,
} from './hostelManagementMenuItems';

const HmPermissionGate = ({ featureKeys, children }) => {
  const basePath = useHmBasePath();
  const { canAny, enforceAccess, isHmOpsRole, nav } = useHmPermission();
  const isSpecialOrders = Array.isArray(featureKeys)
    && featureKeys.some((k) => String(k).includes('hm_special_orders'));
  if (enforceAccess && isSpecialOrders && (isHmOpsRole || nav.specialOrders)) {
    return children;
  }
  if (enforceAccess && !canAny(featureKeys)) {
    return <Redirect to={`${basePath}/dashboard`} />;
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

const HostelEmployeesPage = () => {
  const basePath = useHmBasePath();
  return (
    <PlatformEmployeesPage
      appScope="HOSTEL_MANAGEMENT"
      managerMode
      embedded
      backPath={`${basePath}/dashboard`}
      pageTitle="Hostel Employees"
    />
  );
};

const HostelOwnerEmployeesPage = () => {
  const basePath = useHmBasePath();
  return (
    <PlatformEmployeesPage
      appScope="HOSTEL_MANAGEMENT"
      embedded
      backPath={`${basePath}/dashboard`}
      pageTitle="Hostel Employees & Access"
    />
  );
};

const HostelEmployeesGateway = () => {
  const { enforceAccess, roleCode } = useHmPermission();
  if (enforceAccess && roleCode === 'MANAGER') {
    return <HostelEmployeesPage />;
  }
  return <HostelOwnerEmployeesPage />;
};

/** Keep staff on their role URL prefix (like Chit Fund). */
const HmRoleBaseGuard = ({ basePath, children }) => {
  const location = useLocation();
  const { enforceAccess, roleCode, isOwner } = useHmPermission();

  if (enforceAccess && roleCode === 'KITCHEN_STAFF') {
    return <Redirect to={`${HM_KITCHENSTAFF_BASE_PATH}/food-report`} />;
  }

  const expected = getHmBasePathForRole(roleCode, { isOwner: isOwner && !enforceAccess });
  if (enforceAccess && expected !== basePath && (
    roleCode === 'MANAGER' || roleCode === 'RECEPTIONIST'
  )) {
    const suffix = location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : '/dashboard';
    return <Redirect to={`${expected}${suffix || '/dashboard'}${location.search || ''}`} />;
  }

  if (!enforceAccess && basePath !== HM_BASE_PATH) {
    // Owner should use /user
    const suffix = location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : '/dashboard';
    return <Redirect to={`${HM_BASE_PATH}${suffix || '/dashboard'}${location.search || ''}`} />;
  }

  return children;
};

const HostelManagementAdminShell = ({ basePath }) => (
  <HmBasePathProvider basePath={basePath}>
    <HmRoleBaseGuard basePath={basePath}>
      <BillingProvider appCode="HOSTEL_MANAGEMENT" billingPath={`${HM_BASE_PATH}/billing`}>
        <BillingAppGuards>
          <div className="min-h-screen bg-gray-50">
            <HostelManagementNavbar />
            <HostelManagementAppMenuBar />
            <div className="min-h-[calc(100vh-112px)]">
              <Switch>
                <PrivateRoute exact path={basePath} component={HostelManagementDashboard} />
                <PrivateRoute exact path={`${basePath}/dashboard`} component={HostelManagementDashboard} />
                <PermissionRoute exact path={`${basePath}/hostels`} component={HostelManagementHostelsPage} featureKeys={HM_NAV_ANY.hostels} />
                <PermissionRoute exact path={`${basePath}/floors-rooms`} component={HostelManagementFloorsRoomsPage} featureKeys={HM_NAV_ANY.floorsRooms} />
                <PermissionRoute exact path={`${basePath}/residents`} component={HostelManagementResidentsPage} featureKeys={HM_NAV_ANY.residents} />
                <PermissionRoute exact path={`${basePath}/dues-deck`} component={HostelManagementDuesDeckPage} featureKeys={HM_NAV_ANY.duesDeck} />
                <PermissionRoute exact path={`${basePath}/receivables`} component={HostelManagementReceivablesPage} featureKeys={HM_NAV_ANY.receivables} />
                <PermissionRoute exact path={`${basePath}/outstanding`} component={HostelManagementOutstandingPage} featureKeys={HM_NAV_ANY.outstanding} />
                <PermissionRoute exact path={`${basePath}/payments`} component={HostelManagementPaymentsPage} featureKeys={HM_NAV_ANY.payments} />
                <PermissionRoute exact path={`${basePath}/food-report`} component={HostelManagementFoodReportPage} featureKeys={HM_NAV_ANY.foodReport} />
                <PermissionRoute exact path={`${basePath}/special-orders`} component={HostelManagementSpecialOrdersPage} featureKeys={HM_NAV_ANY.specialOrders} />
                <PermissionRoute exact path={`${basePath}/turfs`} component={HostelManagementTurfsPage} featureKeys={HM_NAV_ANY.turfs} />
                <PermissionRoute exact path={`${basePath}/shuttle-courts`} component={HostelManagementShuttleCourtsPage} featureKeys={HM_NAV_ANY.shuttleCourts} />
                <PermissionRoute exact path={`${basePath}/ledger`} component={HostelManagementLedgerPage} featureKeys={HM_NAV_ANY.ledger} />
                <PermissionRoute exact path={`${basePath}/employees`} component={HostelEmployeesGateway} featureKeys={HM_NAV_ANY.employees} />
                <PermissionRoute exact path={`${basePath}/adminsettings`} component={HostelManagementAdminSettingsPage} featureKeys={HM_NAV_ANY.adminSettings} />
                {basePath === HM_BASE_PATH && (
                  <PrivateRoute exact path={`${basePath}/billing`} component={MyBillingPage} />
                )}
                <Route path={basePath} component={HostelManagementDashboard} />
              </Switch>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </BillingAppGuards>
      </BillingProvider>
    </HmRoleBaseGuard>
  </HmBasePathProvider>
);

const HostelManagementAdminLayout = ({ basePath = HM_BASE_PATH }) => (
  <HostelManagementProvider>
    <HostelManagementAdminShell basePath={basePath} />
  </HostelManagementProvider>
);

export const HostelManagementManagerLayout = () => (
  <HostelManagementAdminLayout basePath={HM_MANAGER_BASE_PATH} />
);

export const HostelManagementReceptionistLayout = () => (
  <HostelManagementAdminLayout basePath={HM_RECEPTIONIST_BASE_PATH} />
);

export default HostelManagementAdminLayout;
