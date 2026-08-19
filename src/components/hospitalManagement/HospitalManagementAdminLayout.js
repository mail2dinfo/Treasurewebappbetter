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
import HospitalManagementDoctorsPage from '../../pages/hospitalManagement/HospitalManagementDoctorsPage';
import HospitalManagementPatientsPage from '../../pages/hospitalManagement/HospitalManagementPatientsPage';
import HospitalManagementAppointmentsPage from '../../pages/hospitalManagement/HospitalManagementAppointmentsPage';
import HospitalManagementReceptionPage from '../../pages/hospitalManagement/HospitalManagementReceptionPage';
import HospitalManagementDoctorDeskPage from '../../pages/hospitalManagement/HospitalManagementDoctorDeskPage';
import HospitalManagementPharmacyDeskPage from '../../pages/hospitalManagement/HospitalManagementPharmacyDeskPage';
import HospitalManagementKitchenDeskPage from '../../pages/hospitalManagement/HospitalManagementKitchenDeskPage';
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
  HH_PHARMACIST_BASE_PATH,
  HH_DOCTOR_BASE_PATH,
  HH_NURSE_BASE_PATH,
  HH_COMPOUNDER_BASE_PATH,
  HH_KITCHEN_BASE_PATH,
  HH_ROLE_HOME_SUFFIX,
  HhBasePathProvider,
  getHhBasePathForRole,
  useHhBasePath,
} from './hospitalManagementMenuItems';
import { HH_STAFF_ROLES } from '../../utils/hhPermissionCatalog';
import HhHospitalLiveAlerts from './HhHospitalLiveAlerts';

const HhPermissionGate = ({ featureKeys, children }) => {
  const basePath = useHhBasePath();
  const { canAny, enforceAccess, isHhOpsRole, nav, isOwner, roleCode } = useHhPermission();
  const keys = Array.isArray(featureKeys) ? featureKeys : [];
  const role = String(roleCode || '').toUpperCase();
  const isAppointments = keys.some((k) => String(k).includes('hh_appointment'));
  const isPharmacyDesk = keys.some((k) => String(k) === 'hh_pharmacy_desk');
  const isReception = keys.some((k) => String(k) === 'hh_reception_desk');
  const isDoctorDesk = keys.some((k) => String(k) === 'hh_doctor_desk');

  // Owners always pass; clinical desks stay open when related nav access exists.
  if (!enforceAccess || isOwner) return children;
  if (isAppointments && (isHhOpsRole || nav.appointments)) return children;
  if (isReception && (nav.reception || role === 'RECEPTIONIST' || role === 'MANAGER')) return children;
  if (isDoctorDesk && (nav.doctorDesk || role === 'DOCTOR' || role === 'MANAGER')) return children;
  if (isPharmacyDesk && (nav.pharmacyDesk || nav.pharmacy || role === 'PHARMACIST' || role === 'COMPOUNDER' || role === 'MANAGER')) {
    return children;
  }
  if (canAny(keys)) return children;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-3">
      <h1 className="text-lg font-semibold text-gray-900">Access not granted</h1>
      <p className="text-sm text-gray-500">You do not have permission for this hospital module.</p>
      <a href={`${basePath}/dashboard`} className="inline-block text-sm font-medium text-cyan-800 hover:underline">
        Back to dashboard
      </a>
    </div>
  );
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

const HhRoleHomeRedirect = () => {
  const basePath = useHhBasePath();
  const { roleCode } = useHhPermission();
  const suffix = HH_ROLE_HOME_SUFFIX[String(roleCode || '').toUpperCase()] || '/dashboard';
  return <Redirect to={`${basePath}${suffix}`} />;
};

const STAFF_BASE_PATHS = new Set([
  HH_PHARMACIST_BASE_PATH,
  HH_DOCTOR_BASE_PATH,
  HH_NURSE_BASE_PATH,
  HH_COMPOUNDER_BASE_PATH,
  HH_KITCHEN_BASE_PATH,
]);

const HhRoleBaseGuard = ({ basePath, children }) => {
  const location = useLocation();
  const { enforceAccess, roleCode, isOwner } = useHhPermission();
  const role = String(roleCode || '').toUpperCase();

  const expected = getHhBasePathForRole(role, { isOwner: isOwner && !enforceAccess });
  if (enforceAccess && expected !== basePath && (role === 'MANAGER' || HH_STAFF_ROLES.includes(role))) {
    const suffix = location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : (HH_ROLE_HOME_SUFFIX[role] || '/dashboard');
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

const HospitalManagementAdminShell = ({ basePath }) => {
  const useRoleHome = STAFF_BASE_PATHS.has(basePath);
  return (
  <HhBasePathProvider basePath={basePath}>
    <HhRoleBaseGuard basePath={basePath}>
      <BillingProvider appCode="HOSPITAL_MANAGEMENT" billingPath={`${HH_BASE_PATH}/billing`}>
        <BillingAppGuards>
          <div className="min-h-screen bg-gray-50">
            <HospitalManagementNavbar />
            <HospitalManagementAppMenuBar />
            <HhHospitalLiveAlerts />
            <div className="min-h-[calc(100vh-112px)]">
              {/* Switch children must be Route/Redirect only — Fragments break matching in RR v5 */}
              <Switch>
                <PrivateRoute
                  exact
                  path={basePath}
                  component={useRoleHome ? HhRoleHomeRedirect : HospitalManagementDashboard}
                />
                <PrivateRoute
                  exact
                  path={`${basePath}/dashboard`}
                  component={useRoleHome ? HhRoleHomeRedirect : HospitalManagementDashboard}
                />
                <Redirect exact from={`${basePath}/hospital`} to={`${basePath}/adminsettings`} />
                <PermissionRoute exact path={`${basePath}/doctors`} component={HospitalManagementDoctorsPage} featureKeys={HH_NAV_ANY.doctors} />
                <PermissionRoute exact path={`${basePath}/patients`} component={HospitalManagementPatientsPage} featureKeys={HH_NAV_ANY.patients} />
                <PermissionRoute exact path={`${basePath}/appointments`} component={HospitalManagementAppointmentsPage} featureKeys={HH_NAV_ANY.appointments} />
                <PermissionRoute exact path={`${basePath}/reception`} component={HospitalManagementReceptionPage} featureKeys={HH_NAV_ANY.reception} />
                <PermissionRoute exact path={`${basePath}/doctor-desk`} component={HospitalManagementDoctorDeskPage} featureKeys={HH_NAV_ANY.doctorDesk} />
                <PermissionRoute exact path={`${basePath}/pharmacy-desk`} component={HospitalManagementPharmacyDeskPage} featureKeys={HH_NAV_ANY.pharmacyDesk} />
                <PermissionRoute exact path={`${basePath}/kitchen-desk`} component={HospitalManagementKitchenDeskPage} featureKeys={HH_NAV_ANY.kitchenDesk} />
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
                {basePath === HH_BASE_PATH ? (
                  <PrivateRoute exact path={`${basePath}/billing`} component={MyBillingPage} />
                ) : null}
                <Route
                  path={basePath}
                  component={useRoleHome ? HhRoleHomeRedirect : HospitalManagementDashboard}
                />
              </Switch>
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
          </div>
        </BillingAppGuards>
      </BillingProvider>
    </HhRoleBaseGuard>
  </HhBasePathProvider>
  );
};

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

export const HospitalManagementPharmacistLayout = () => (
  <HospitalManagementAdminLayout basePath={HH_PHARMACIST_BASE_PATH} />
);

export const HospitalManagementDoctorLayout = () => (
  <HospitalManagementAdminLayout basePath={HH_DOCTOR_BASE_PATH} />
);

export const HospitalManagementNurseLayout = () => (
  <HospitalManagementAdminLayout basePath={HH_NURSE_BASE_PATH} />
);

export const HospitalManagementCompounderLayout = () => (
  <HospitalManagementAdminLayout basePath={HH_COMPOUNDER_BASE_PATH} />
);

export const HospitalManagementKitchenLayout = () => (
  <HospitalManagementAdminLayout basePath={HH_KITCHEN_BASE_PATH} />
);

export default HospitalManagementAdminLayout;
