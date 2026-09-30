import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { DeepavaliProvider } from '../../context/deepavali/DeepavaliContext';
import { usePlatformAccess, staffHasAppRole } from '../../context/platformAccess_context';
import { BillingProvider } from '../../context/billing_context';
import BillingAppGuards from '../BillingAppGuards';
import PrivateRoute from '../../pages/PrivateRoute';
import MyBillingPage from '../../pages/MyBillingPage';
import DeepavaliNavbar from './DeepavaliNavbar';
import DeepavaliAppMenuBar from './DeepavaliAppMenuBar';
import {
    DP_APP_MENU_IDS,
    DP_BASE_PATH,
    DP_COLLECTOR_MENU_IDS,
    DP_COLLECTOR_PATH,
    menusFromGrantedFeatures,
} from './deepavaliMenuItems';
import DeepavaliDashboardPage from '../../pages/deepavaliChits/DeepavaliDashboardPage';
import DeepavaliEmployeesPage from '../../pages/deepavaliChits/DeepavaliEmployeesPage';
import DeepavaliAdminSettingsPage from '../../pages/deepavaliChits/DeepavaliAdminSettingsPage';
import DeepavaliLedgerPage from '../../pages/deepavaliChits/DeepavaliLedgerPage';
import DeepavaliGroupsPage from '../../pages/deepavaliChits/DeepavaliGroupsPage';
import DeepavaliGroupDetailPage from '../../pages/deepavaliChits/DeepavaliGroupDetailPage';
import DeepavaliSubscribersPage from '../../pages/deepavaliChits/DeepavaliSubscribersPage';
import DeepavaliCollectionsPage from '../../pages/deepavaliChits/DeepavaliCollectionsPage';
import DeepavaliPayablesPage from '../../pages/deepavaliChits/DeepavaliPayablesPage';
import DeepavaliReportsPage from '../../pages/deepavaliChits/DeepavaliReportsPage';

const DeepavaliChrome = ({ basePath, menuIds, showBilling }) => {
    const allow = (id) => {
        if (id === 'adminsettings') {
            return menuIds.includes('adminsettings')
                || menuIds.includes('employees')
                || menuIds.includes('ledgercategories');
        }
        return menuIds.includes(id);
    };
    return (
        <div className="min-h-screen bg-gray-50">
            <DeepavaliNavbar basePath={basePath} menuIds={menuIds} showBilling={showBilling} />
            <DeepavaliAppMenuBar basePath={basePath} menuIds={menuIds} />
            <div className="min-h-[calc(100vh-112px)]">
                <Switch>
                    <PrivateRoute exact path={`${basePath}`} component={DeepavaliDashboardPage} />
                    <PrivateRoute exact path={`${basePath}/dashboard`} component={DeepavaliDashboardPage} />
                    {allow('subscribers') && <PrivateRoute exact path={`${basePath}/subscribers`} component={DeepavaliSubscribersPage} />}
                    {allow('collections') && <PrivateRoute exact path={`${basePath}/receivables`} component={DeepavaliCollectionsPage} />}
                    {allow('collections') && <PrivateRoute exact path={`${basePath}/collections`} component={DeepavaliCollectionsPage} />}
                    {allow('adminsettings') && <PrivateRoute exact path={`${basePath}/adminsettings`} component={DeepavaliAdminSettingsPage} />}
                    {allow('adminsettings') && <PrivateRoute exact path={`${basePath}/employees`} component={DeepavaliEmployeesPage} />}
                    {allow('adminsettings') && (
                        <Route exact path={`${basePath}/ledger-categories`}>
                            <Redirect to={`${basePath}/adminsettings`} />
                        </Route>
                    )}
                    {allow('ledger') && <PrivateRoute exact path={`${basePath}/ledger`} component={DeepavaliLedgerPage} />}
                    {allow('groups') && <PrivateRoute exact path={`${basePath}/groups`} component={DeepavaliGroupsPage} />}
                    {allow('groups') && <PrivateRoute exact path={`${basePath}/groups/:groupId/subscribers/:subscriberId`} component={DeepavaliGroupDetailPage} />}
                    {allow('groups') && <PrivateRoute exact path={`${basePath}/groups/:groupId`} component={DeepavaliGroupDetailPage} />}
                    {allow('payables') && <PrivateRoute exact path={`${basePath}/payables`} component={DeepavaliPayablesPage} />}
                    {allow('reports') && <PrivateRoute exact path={`${basePath}/reports`} component={DeepavaliReportsPage} />}
                    {showBilling && (
                        <PrivateRoute exact path={`${basePath}/billing`} component={MyBillingPage} />
                    )}
                    <Route path={basePath} component={DeepavaliDashboardPage} />
                </Switch>
            </div>
            <footer className="bg-white border-t border-gray-200 py-4">
                <p className="text-center text-sm text-gray-500">Deepavali Chits · MyTreasure Finance Hub</p>
            </footer>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
        </div>
    );
};

const CollectorChrome = ({ basePath }) => {
    const platform = usePlatformAccess();
    const isPlatformEmployee = platform?.isAvailable && !platform.isOwner;
    if (isPlatformEmployee && platform.hasLoaded && !staffHasAppRole(platform, 'DEEPAVALI_CHITS', 'COLLECTOR')) {
        return <Redirect to="/app-selection" />;
    }
    if (
        isPlatformEmployee
        && platform.activeContext?.appCode
        && platform.activeContext.appCode !== 'DEEPAVALI_CHITS'
    ) {
        return <Redirect to="/app-selection" />;
    }
    const useGrants = platform.activeContext?.appCode === 'DEEPAVALI_CHITS'
        && String(platform.activeContext?.roleCode || '').toUpperCase() === 'COLLECTOR';
    const menuIds = useGrants
        ? menusFromGrantedFeatures(platform.hasPermission, DP_COLLECTOR_MENU_IDS)
        : DP_COLLECTOR_MENU_IDS;
    return <DeepavaliChrome basePath={basePath} menuIds={menuIds} showBilling={false} />;
};

const DeepavaliShell = ({ basePath, menuIds, showBilling = true, collector = false }) => (
    <DeepavaliProvider>
        <BillingProvider appCode="DEEPAVALI_CHITS" billingPath={`${basePath}/billing`}>
            <BillingAppGuards>
                {collector
                    ? <CollectorChrome basePath={basePath} />
                    : <DeepavaliChrome basePath={basePath} menuIds={menuIds} showBilling={showBilling} />}
            </BillingAppGuards>
        </BillingProvider>
    </DeepavaliProvider>
);

const DeepavaliAdminLayout = () => (
    <DeepavaliShell basePath={DP_BASE_PATH} menuIds={DP_APP_MENU_IDS} showBilling />
);

export const DeepavaliCollectorLayout = () => (
    <DeepavaliShell basePath={DP_COLLECTOR_PATH} menuIds={DP_COLLECTOR_MENU_IDS} showBilling={false} collector />
);

export default DeepavaliAdminLayout;
