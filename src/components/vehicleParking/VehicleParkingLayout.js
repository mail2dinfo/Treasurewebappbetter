import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BillingProvider } from '../../context/billing_context';
import { VehicleParkingProvider } from '../../context/vehicleParking_context';
import BillingAppGuards from '../BillingAppGuards';
import VehicleParkingNavbar from './VehicleParkingNavbar';
import VehicleParkingAppMenuBar from './VehicleParkingAppMenuBar';
import PrivateRoute from '../../pages/PrivateRoute';
import MyBillingPage from '../../pages/MyBillingPage';
import { useVpPermission } from './useVpPermission';
import {
    VehicleParkingDashboardPage,
    VehicleParkingCheckInPage,
    VehicleParkingPassesPage,
    VehicleParkingActivePage,
    VehicleParkingHistoryPage,
    VehicleParkingSlotsPage,
    VehicleParkingMastersPage,
    VehicleParkingShiftsPage,
    VehicleParkingReportsPage,
    VehicleParkingSettingsPage,
    VehicleParkingStaffPage,
} from '../../pages/vehicleParking/VehicleParkingPages';
import { VehicleParkingAccountsPage } from '../../pages/vehicleParking/VehicleParkingLedgerPage';

const VpGuard = ({ navKey, component: Component }) => {
    const { nav } = useVpPermission();
    if (navKey && !nav[navKey]) {
        return <Redirect to="/vehicle-parking/user/dashboard" />;
    }
    return <Component />;
};

const DashboardRoute = () => <VpGuard navKey="dashboard" component={VehicleParkingDashboardPage} />;
const CheckInRoute = () => <VpGuard navKey="checkin" component={VehicleParkingCheckInPage} />;
const PassesRoute = () => <VpGuard navKey="passes" component={VehicleParkingPassesPage} />;
const ActiveRoute = () => <VpGuard navKey="active" component={VehicleParkingActivePage} />;
const HistoryRoute = () => <VpGuard navKey="history" component={VehicleParkingHistoryPage} />;
const SlotsRoute = () => <VpGuard navKey="slots" component={VehicleParkingSlotsPage} />;
const MastersRoute = () => <VpGuard navKey="masters" component={VehicleParkingMastersPage} />;
const AccountsRoute = () => <VpGuard navKey="accounts" component={VehicleParkingAccountsPage} />;
const ShiftsRoute = () => <VpGuard navKey="shifts" component={VehicleParkingShiftsPage} />;
const ReportsRoute = () => <VpGuard navKey="reports" component={VehicleParkingReportsPage} />;
const SettingsRoute = () => <VpGuard navKey="settings" component={VehicleParkingSettingsPage} />;
const StaffRoute = () => <VpGuard navKey="staff" component={VehicleParkingStaffPage} />;

const VehicleParkingLayout = () => (
    <BillingProvider appCode="VEHICLE_PARKING" billingPath="/vehicle-parking/user/billing">
        <BillingAppGuards>
            <VehicleParkingProvider>
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                    <VehicleParkingNavbar />
                    <VehicleParkingAppMenuBar />
                    <Switch>
                        <Route path="/vehicle-parking/user" exact>
                            <Redirect to="/vehicle-parking/user/dashboard" />
                        </Route>
                        <PrivateRoute exact path="/vehicle-parking/user/dashboard" component={DashboardRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/check-in" component={CheckInRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/passes" component={PassesRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/active" component={ActiveRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/history" component={HistoryRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/slots" component={SlotsRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/masters" component={MastersRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/accounts" component={AccountsRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/shifts" component={ShiftsRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/reports" component={ReportsRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/settings" component={SettingsRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/staff" component={StaffRoute} />
                        <PrivateRoute exact path="/vehicle-parking/user/billing" component={MyBillingPage} />
                        <Route path="/vehicle-parking">
                            <Redirect to="/vehicle-parking/user/dashboard" />
                        </Route>
                    </Switch>
                    <ToastContainer position="top-right" autoClose={3000} />
                </div>
            </VehicleParkingProvider>
        </BillingAppGuards>
    </BillingProvider>
);

export default VehicleParkingLayout;
