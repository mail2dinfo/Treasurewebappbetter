import React from 'react';
import { Switch, Route, Redirect, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HospitalManagementProvider } from '../../context/hospitalManagement/HospitalManagementContext';
import { BillingProvider } from '../../context/billing_context';
import BillingAppGuards from '../BillingAppGuards';
import HospitalManagementNavbar from './HospitalManagementNavbar';
import HospitalManagementAppMenuBar from './HospitalManagementAppMenuBar';
import PrivateRoute from '../../pages/PrivateRoute';
import HospitalManagementDashboard from '../../pages/hospitalManagement/HospitalManagementDashboard';
import HospitalManagementHospitalPage from '../../pages/hospitalManagement/HospitalManagementHospitalPage';
import HospitalManagementDoctorsPage from '../../pages/hospitalManagement/HospitalManagementDoctorsPage';
import HospitalManagementPatientsPage from '../../pages/hospitalManagement/HospitalManagementPatientsPage';
import HospitalManagementAppointmentsPage from '../../pages/hospitalManagement/HospitalManagementAppointmentsPage';
import HospitalManagementWardsBedsPage from '../../pages/hospitalManagement/HospitalManagementWardsBedsPage';
import HospitalManagementAdmissionsPage from '../../pages/hospitalManagement/HospitalManagementAdmissionsPage';
import HospitalManagementBillingPage from '../../pages/hospitalManagement/HospitalManagementBillingPage';
import HospitalManagementPharmacyPage from '../../pages/hospitalManagement/HospitalManagementPharmacyPage';
import HospitalManagementLedgerPage from '../../pages/hospitalManagement/HospitalManagementLedgerPage';
import HospitalManagementDaybookPage from '../../pages/hospitalManagement/HospitalManagementDaybookPage';
import HospitalManagementEmrPage from '../../pages/hospitalManagement/HospitalManagementEmrPage';
import HospitalManagementLabPage from '../../pages/hospitalManagement/HospitalManagementLabPage';
import HospitalManagementBloodBankPage from '../../pages/hospitalManagement/HospitalManagementBloodBankPage';
import HospitalManagementInventoryPage from '../../pages/hospitalManagement/HospitalManagementInventoryPage';
import HospitalManagementInsurancePage from '../../pages/hospitalManagement/HospitalManagementInsurancePage';
import HospitalManagementReportsPage from '../../pages/hospitalManagement/HospitalManagementReportsPage';
import HospitalManagementExtraAdminPage from '../../pages/hospitalManagement/HospitalManagementExtraAdminPage';
import HospitalManagementAdminSettingsPage from '../../pages/hospitalManagement/HospitalManagementAdminSettingsPage';
import MyBillingPage from '../../pages/MyBillingPage';
import PlatformEmployeesPage from '../../pages/PlatformEmployeesPage';
import { useHhPermission } from './useHhPermission';
import { HH_NAV_ANY } from '../../utils/hhPermissionCatalog';
import {
  HH_BASE_PATH,
  HH_MANAGER_BASE_PATH,
  HH_RECEPTIONIST_BASE_PATH,
  HhBasePathProvider,
  getHhBasePathForRole,
  useHhBasePath,
} from './hospitalManagementMenuItems';

const HhPermissionGate = ({ featureKeys, children }) => {
  const basePath = useHhBasePath();
  const { canAny, enforceAccess, isHhOpsRole, nav } = useHhPermission();
  const isAppointments = Array.isArray(featureKeys)
    && featureKeys.some((k) => String(k).includes('hh_appointment'));
  if (enforceAccess && isAppointments && (isHhOpsRole || nav.appointments)) {
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
      <HhPermissionGate featureKeys={featureKeys}>
        <Component {...props} />
      </HhPermissionGate>
    )}
  />
);

const HhEmployeesPage = () => {
  const basePath = useHhBasePath();
  return (
    <PlatformEmployeesPage
      appScope="HOSPITAL_MANAGEMENT"
      managerMode
      embedded
      backPath={`${basePath}/dashboard`}
      pageTitle="Hospital Employees"
    />
  );
};

const HhOwnerEmployeesPage = () => {
  const basePath = useHhBasePath();
  return (
    <PlatformEmployeesPage
      appScope="HOSPITAL_MANAGEMENT"
      embedded
      backPath={`${basePath}/dashboard`}
      pageTitle="Hospital Employees & Access"
    />
  );
};

const HhEmployeesGateway = () => {
  const { enforceAccess, roleCode } = useHhPermission();
  if (enforceAccess && roleCode === 'MANAGER') {
    return <HhEmployeesPage />;
  }
  return <HhOwnerEmployeesPage />;
};

const HhRoleBaseGuard = ({ basePath, children }) => {
  const location = useLocation();
  const { enforceAccess, roleCode, isOwner } = useHhPermission();

  const expected = getHhBasePathForRole(roleCode, { isOwner: isOwner && !enforceAccess });
  if (enforceAccess && expected !== basePath && (
    roleCode === 'MANAGER' || roleCode === 'RECEPTIONIST'
  )) {
    const suffix = location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : '/dashboard';
    return <Redirect to={`${expected}${suffix || '/dashboard'}${location.search || ''}`} />;
  }

  if (!enforceAccess && basePath !== HH_BASE_PATH) {
    const suffix = location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : '/dashboard';
    return <Redirect to={`${HH_BASE_PATH}${suffix || '/dashboard'}${location.search || ''}`} />;
  }

  return children;
};

const HospitalManagementAdminShell = ({ basePath }) => (
  <HhBasePathProvider basePath={basePath}>
    <HhRoleBaseGuard basePath={basePath}>
      <BillingProvider appCode="HOSPITAL_MANAGEMENT" billingPath={`${HH_BASE_PATH}/billing`}>
        <BillingAppGuards>
          <div className="min-h-screen bg-gray-50">
            <HospitalManagementNavbar />
            <HospitalManagementAppMenuBar />
            <div className="min-h-[calc(100vh-112px)]">
              <Switch>
                <PrivateRoute exact path={basePath} component={HospitalManagementDashboard} />
                <PrivateRoute exact path={`${basePath}/dashboard`} component={HospitalManagementDashboard} />
                <PermissionRoute exact path={`${basePath}/hospital`} component={HospitalManagementHospitalPage} featureKeys={HH_NAV_ANY.hospital} />
                <PermissionRoute exact path={`${basePath}/doctors`} component={HospitalManagementDoctorsPage} featureKeys={HH_NAV_ANY.doctors} />
                <PermissionRoute exact path={`${basePath}/patients`} component={HospitalManagementPatientsPage} featureKeys={HH_NAV_ANY.patients} />
                <PermissionRoute exact path={`${basePath}/appointments`} component={HospitalManagementAppointmentsPage} featureKeys={HH_NAV_ANY.appointments} />
                <PermissionRoute exact path={`${basePath}/wards-beds`} component={HospitalManagementWardsBedsPage} featureKeys={HH_NAV_ANY.wards} />
                <PermissionRoute exact path={`${basePath}/admissions`} component={HospitalManagementAdmissionsPage} featureKeys={HH_NAV_ANY.admissions} />
                <PermissionRoute exact path={`${basePath}/hospital-billing`} component={HospitalManagementBillingPage} featureKeys={HH_NAV_ANY.billing} />
                <PermissionRoute exact path={`${basePath}/pharmacy`} component={HospitalManagementPharmacyPage} featureKeys={HH_NAV_ANY.pharmacy} />
                <PermissionRoute exact path={`${basePath}/ledger`} component={HospitalManagementLedgerPage} featureKeys={HH_NAV_ANY.ledger} />
                <PermissionRoute exact path={`${basePath}/daybook`} component={HospitalManagementDaybookPage} featureKeys={HH_NAV_ANY.daybook} />
                <PermissionRoute exact path={`${basePath}/emr`} component={HospitalManagementEmrPage} featureKeys={HH_NAV_ANY.emr} />
                <PermissionRoute exact path={`${basePath}/lab`} component={HospitalManagementLabPage} featureKeys={HH_NAV_ANY.lab} />
                <PermissionRoute exact path={`${basePath}/blood-bank`} component={HospitalManagementBloodBankPage} featureKeys={HH_NAV_ANY.bloodBank} />
                <PermissionRoute exact path={`${basePath}/inventory`} component={HospitalManagementInventoryPage} featureKeys={HH_NAV_ANY.inventory} />
                <PermissionRoute exact path={`${basePath}/insurance`} component={HospitalManagementInsurancePage} featureKeys={HH_NAV_ANY.insurance} />
                <PermissionRoute exact path={`${basePath}/reports`} component={HospitalManagementReportsPage} featureKeys={HH_NAV_ANY.reports} />
                <PermissionRoute exact path={`${basePath}/extra-admin`} component={HospitalManagementExtraAdminPage} featureKeys={HH_NAV_ANY.extraAdmin} />
                <PermissionRoute exact path={`${basePath}/employees`} component={HhEmployeesGateway} featureKeys={HH_NAV_ANY.employees} />
                <PermissionRoute exact path={`${basePath}/adminsettings`} component={HospitalManagementAdminSettingsPage} featureKeys={HH_NAV_ANY.adminSettings} />
                {basePath === HH_BASE_PATH && (
                  <PrivateRoute exact path={`${basePath}/billing`} component={MyBillingPage} />
                )}
                <Route path={basePath} component={HospitalManagementDashboard} />
              </Switch>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </BillingAppGuards>
      </BillingProvider>
    </HhRoleBaseGuard>
  </HhBasePathProvider>
);

const HospitalManagementAdminLayout = ({ basePath = HH_BASE_PATH }) => (
  <HospitalManagementProvider>
    <HospitalManagementAdminShell basePath={basePath} />
  </HospitalManagementProvider>
);

export const HospitalManagementManagerLayout = () => (
  <HospitalManagementAdminLayout basePath={HH_MANAGER_BASE_PATH} />
);

export const HospitalManagementReceptionistLayout = () => (
  <HospitalManagementAdminLayout basePath={HH_RECEPTIONIST_BASE_PATH} />
);

export default HospitalManagementAdminLayout;
