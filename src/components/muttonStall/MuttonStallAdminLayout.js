import React from 'react';
import { Switch, Route, Redirect, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MuttonStallProvider } from '../../context/muttonStall/MuttonStallContext';
import { BillingProvider } from '../../context/billing_context';
import BillingAppGuards from '../BillingAppGuards';
import MuttonStallNavbar from './MuttonStallNavbar';
import MuttonStallAppMenuBar from './MuttonStallAppMenuBar';
import PrivateRoute from '../../pages/PrivateRoute';
import MuttonStallDashboard from '../../pages/muttonStall/MuttonStallDashboard';
import MuttonStallStockPage from '../../pages/muttonStall/MuttonStallStockPage';
import MuttonStallOrdersPage from '../../pages/muttonStall/MuttonStallOrdersPage';
import MuttonStallCustomersPage from '../../pages/muttonStall/MuttonStallCustomersPage';
import MuttonStallBillingPage from '../../pages/muttonStall/MuttonStallBillingPage';
import MuttonStallReportsPage from '../../pages/muttonStall/MuttonStallReportsPage';
import MuttonStallLedgerPage from '../../pages/muttonStall/MuttonStallLedgerPage';
import MuttonStallDaybookPage from '../../pages/muttonStall/MuttonStallDaybookPage';
import MuttonStallAdminSettingsPage from '../../pages/muttonStall/MuttonStallAdminSettingsPage';
import MyBillingPage from '../../pages/MyBillingPage';
import PlatformEmployeesPage from '../../pages/PlatformEmployeesPage';
import { useMsPermission } from './useMsPermission';
import { MS_NAV_ANY } from '../../utils/msPermissionCatalog';
import {
  MS_BASE_PATH,
  MS_MANAGER_BASE_PATH,
  MS_SALESMAN_BASE_PATH,
  MsBasePathProvider,
  getMsBasePathForRole,
  useMsBasePath,
} from './muttonStallMenuItems';

const MsPermissionGate = ({ featureKeys, children }) => {
  const basePath = useMsBasePath();
  const { canAny, enforceAccess, isMsOpsRole, nav } = useMsPermission();
  const isOrders = Array.isArray(featureKeys)
    && featureKeys.some((k) => String(k).includes('ms_orders'));
  if (enforceAccess && isOrders && (isMsOpsRole || nav.orders)) {
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
      <MsPermissionGate featureKeys={featureKeys}>
        <Component {...props} />
      </MsPermissionGate>
    )}
  />
);

const MsEmployeesPage = () => {
  const basePath = useMsBasePath();
  return (
    <PlatformEmployeesPage
      appScope="MUTTON_STALL"
      managerMode
      embedded
      backPath={`${basePath}/dashboard`}
      pageTitle="Mutton Stall Employees"
    />
  );
};

const MsOwnerEmployeesPage = () => {
  const basePath = useMsBasePath();
  return (
    <PlatformEmployeesPage
      appScope="MUTTON_STALL"
      embedded
      backPath={`${basePath}/dashboard`}
      pageTitle="Mutton Stall Employees & Access"
    />
  );
};

const MsEmployeesGateway = () => {
  const { enforceAccess, roleCode } = useMsPermission();
  if (enforceAccess && roleCode === 'MANAGER') {
    return <MsEmployeesPage />;
  }
  return <MsOwnerEmployeesPage />;
};

const MsRoleBaseGuard = ({ basePath, children }) => {
  const location = useLocation();
  const { enforceAccess, roleCode, isOwner } = useMsPermission();

  const expected = getMsBasePathForRole(roleCode, { isOwner: isOwner && !enforceAccess });
  if (enforceAccess && expected !== basePath && (
    roleCode === 'MANAGER' || roleCode === 'SALESMAN'
  )) {
    const suffix = location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : '/dashboard';
    return <Redirect to={`${expected}${suffix || '/dashboard'}${location.search || ''}`} />;
  }

  if (!enforceAccess && basePath !== MS_BASE_PATH) {
    const suffix = location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : '/dashboard';
    return <Redirect to={`${MS_BASE_PATH}${suffix || '/dashboard'}${location.search || ''}`} />;
  }

  return children;
};

const MuttonStallAdminShell = ({ basePath }) => (
  <MsBasePathProvider basePath={basePath}>
    <MsRoleBaseGuard basePath={basePath}>
      <BillingProvider appCode="MUTTON_STALL" billingPath={`${MS_BASE_PATH}/billing`}>
        <BillingAppGuards>
          <div className="min-h-screen bg-gray-50">
            <MuttonStallNavbar />
            <MuttonStallAppMenuBar />
            <div className="min-h-[calc(100vh-112px)]">
              <Switch>
                <PrivateRoute exact path={basePath} component={MuttonStallDashboard} />
                <PrivateRoute exact path={`${basePath}/dashboard`} component={MuttonStallDashboard} />
                <PermissionRoute exact path={`${basePath}/orders`} component={MuttonStallOrdersPage} featureKeys={MS_NAV_ANY.orders} />
                <PermissionRoute exact path={`${basePath}/stock`} component={MuttonStallStockPage} featureKeys={MS_NAV_ANY.stock} />
                <PermissionRoute exact path={`${basePath}/customers`} component={MuttonStallCustomersPage} featureKeys={MS_NAV_ANY.customers} />
                <PermissionRoute exact path={`${basePath}/stall-billing`} component={MuttonStallBillingPage} featureKeys={MS_NAV_ANY.billing} />
                <PermissionRoute exact path={`${basePath}/reports`} component={MuttonStallReportsPage} featureKeys={MS_NAV_ANY.reports} />
                <PermissionRoute exact path={`${basePath}/ledger`} component={MuttonStallLedgerPage} featureKeys={MS_NAV_ANY.ledger} />
                <PermissionRoute exact path={`${basePath}/daybook`} component={MuttonStallDaybookPage} featureKeys={MS_NAV_ANY.daybook} />
                <PermissionRoute exact path={`${basePath}/employees`} component={MsEmployeesGateway} featureKeys={MS_NAV_ANY.employees} />
                <PermissionRoute exact path={`${basePath}/adminsettings`} component={MuttonStallAdminSettingsPage} featureKeys={MS_NAV_ANY.adminSettings} />
                {basePath === MS_BASE_PATH && (
                  <PrivateRoute exact path={`${basePath}/billing`} component={MyBillingPage} />
                )}
                <Route path={basePath} component={MuttonStallDashboard} />
              </Switch>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </BillingAppGuards>
      </BillingProvider>
    </MsRoleBaseGuard>
  </MsBasePathProvider>
);

const MuttonStallAdminLayout = ({ basePath = MS_BASE_PATH }) => (
  <MuttonStallProvider>
    <MuttonStallAdminShell basePath={basePath} />
  </MuttonStallProvider>
);

export const MuttonStallManagerLayout = () => (
  <MuttonStallAdminLayout basePath={MS_MANAGER_BASE_PATH} />
);

export const MuttonStallSalesmanLayout = () => (
  <MuttonStallAdminLayout basePath={MS_SALESMAN_BASE_PATH} />
);

export default MuttonStallAdminLayout;
