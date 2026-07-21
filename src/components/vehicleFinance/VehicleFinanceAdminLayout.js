import React, { useEffect } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { VehicleFinanceProvider } from '../../context/vehicleFinance/VehicleFinanceContext';
import VehicleFinanceNavbar from './VehicleFinanceNavbar';
import VehicleFinanceAppMenuBar from './VehicleFinanceAppMenuBar';
import VehicleFinanceDashboard from '../../pages/vehicleFinance/VehicleFinanceDashboard';
import VehicleFinanceCompanyManagement from '../../pages/vehicleFinance/VehicleFinanceCompanyManagement';
import VehicleFinanceSubscribersPage from '../../pages/vehicleFinance/VehicleFinanceSubscribersPage';
import VehicleFinanceLoansPage from '../../pages/vehicleFinance/VehicleFinanceLoansPage';
import VehicleFinanceLedgerPage from '../../pages/vehicleFinance/VehicleFinanceLedgerPage';
import VehicleFinanceCollectionsPage from '../../pages/vehicleFinance/VehicleFinanceCollectionsPage';
import VehicleFinanceReportsPage from '../../pages/vehicleFinance/VehicleFinanceReportsPage';
import PlatformEmployeesPage from '../../pages/PlatformEmployeesPage';
import MyBillingPage from '../../pages/MyBillingPage';
import BillingAppGuards from '../BillingAppGuards';
import { BillingProvider } from '../../context/billing_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { getVehicleFinanceMenuItems } from './vehicleFinanceMenuItems';
import { passesVfModuleGate, VF_DASHBOARD_ANY, VF_NAV_ANY } from '../../utils/vfPermissionCatalog';

const VehicleFinanceAdminLayout = ({ basePath = '/vehicle-finance/user' }) => {
    const platform = usePlatformAccess();
    const isOwner = Boolean(platform?.isOwner);
    const onVfStaffPath = /\/vehicle-finance\/(manager|collector)/.test(basePath || '');
    const isOwnerBillingShell = basePath === '/vehicle-finance/user';
    const sessionReady = Boolean(platform?.isAvailable && platform?.hasLoaded);
    const roleCode = String(platform?.activeContext?.roleCode || '').toUpperCase();
    const staffRoleActive = ['MANAGER', 'COLLECTOR', 'ACCOUNTANT'].includes(roleCode);
    // Owner full access only on /vehicle-finance/user — manager URL always uses role matrix.
    const ownerBypass = isOwner && !onVfStaffPath && !staffRoleActive;

    // Refresh permissions when Manager opens VF so People & Access changes apply.
    useEffect(() => {
        if (onVfStaffPath && platform?.loadSession) {
            platform.loadSession();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onVfStaffPath]);

    const enforceAccess = Boolean(
        !ownerBypass
        && onVfStaffPath
        && sessionReady
        && platform.activeContext?.appCode === 'VEHICLE_FINANCE'
        && staffRoleActive
    );
    const denyUntilReady = Boolean(onVfStaffPath && !sessionReady);

    const canAccess = (featureKey) => {
        if (!featureKey) return true;
        if (ownerBypass) return true;
        if (denyUntilReady) return false;
        if (!enforceAccess) return !onVfStaffPath;
        return platform.hasPermission(featureKey);
    };
    const canAccessAny = (featureKeys) => {
        if (!featureKeys || !featureKeys.length) return true;
        if (ownerBypass) return true;
        if (denyUntilReady) return false;
        if (!enforceAccess) return !onVfStaffPath;
        return platform.hasAnyPermission(featureKeys);
    };
    const canAccessModule = (moduleId) => {
        if (ownerBypass) return true;
        if (denyUntilReady) return false;
        if (!enforceAccess) return !onVfStaffPath;
        return passesVfModuleGate(canAccess, canAccessAny, moduleId);
    };
    const canOpenMenuItem = (item) => {
        if (item.moduleGate) return canAccessModule(item.moduleGate);
        return canAccessAny(item.requiredAny);
    };
    const firstAllowedPath = getVehicleFinanceMenuItems(basePath)
        .find((item) => canOpenMenuItem(item))?.path || '/app-selection';
    const guardedComponent = (Component, { moduleGate, requiredAny } = {}) => {
        if (denyUntilReady) {
            return (
                <div className="py-20 text-center text-gray-500">Loading access…</div>
            );
        }
        const allowed = moduleGate
            ? canAccessModule(moduleGate)
            : canAccessAny(requiredAny);
        return allowed ? <Component /> : <Redirect to={firstAllowedPath} />;
    };

    // Manager URL requires a Manager/Collector/Accountant VF role context (not Owner bypass).
    if (
        onVfStaffPath
        && sessionReady
        && (
            platform.activeContext?.appCode !== 'VEHICLE_FINANCE'
            || !staffRoleActive
        )
    ) {
        return <Redirect to="/app-selection" />;
    }

    const shell = (
        <div className="min-h-screen bg-gray-50">
            <VehicleFinanceNavbar />
            <VehicleFinanceAppMenuBar basePath={basePath} />

            <div className="min-h-[calc(100vh-112px)]">
                <Switch>
                    <Route exact path={`${basePath}`} render={() => <Redirect to={firstAllowedPath} />} />
                    <Route
                        exact
                        path={`${basePath}/dashboard`}
                        render={() => guardedComponent(VehicleFinanceDashboard, { requiredAny: VF_DASHBOARD_ANY })}
                    />
                    <Route
                        exact
                        path={`${basePath}/company`}
                        render={() => guardedComponent(VehicleFinanceCompanyManagement, { requiredAny: VF_NAV_ANY.company })}
                    />
                    <Route
                        exact
                        path={`${basePath}/subscribers`}
                        render={() => guardedComponent(VehicleFinanceSubscribersPage, { moduleGate: 'subscribers' })}
                    />
                    <Route
                        exact
                        path={`${basePath}/loans`}
                        render={() => guardedComponent(VehicleFinanceLoansPage, { moduleGate: 'loans' })}
                    />
                    <Route
                        exact
                        path={`${basePath}/ledger`}
                        render={() => guardedComponent(VehicleFinanceLedgerPage, { moduleGate: 'ledger' })}
                    />
                    <Route
                        exact
                        path={`${basePath}/collections`}
                        render={() => guardedComponent(VehicleFinanceCollectionsPage, { moduleGate: 'collections' })}
                    />
                    <Route
                        exact
                        path={`${basePath}/reports`}
                        render={() => guardedComponent(VehicleFinanceReportsPage, { moduleGate: 'reports' })}
                    />
                    <Route
                        exact
                        path={`${basePath}/employees`}
                        render={() => {
                            if (denyUntilReady) {
                                return (
                                    <div className="py-20 text-center text-gray-500">Loading access…</div>
                                );
                            }
                            if (!canAccessModule('employees')) {
                                return <Redirect to={firstAllowedPath} />;
                            }
                            return (
                                <PlatformEmployeesPage
                                    appScope="VEHICLE_FINANCE"
                                    managerMode={onVfStaffPath}
                                    embedded
                                    backPath={`${basePath}/dashboard`}
                                    pageTitle="Vehicle Finance Employees"
                                />
                            );
                        }}
                    />
                    {isOwnerBillingShell && (
                        <Route
                            exact
                            path={`${basePath}/billing`}
                            render={() => <MyBillingPage />}
                        />
                    )}

                    <Route path={basePath}>
                        <Redirect to={firstAllowedPath} />
                    </Route>
                </Switch>
            </div>

            <footer className="bg-white border-t border-gray-200 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-gray-500">
                        © 2026 Vehicle Finance App. Part of MyTreasure Finance Hub.
                    </p>
                </div>
            </footer>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );

    return (
        <VehicleFinanceProvider>
            {isOwnerBillingShell ? (
                <BillingProvider
                    appCode="VEHICLE_FINANCE"
                    billingPath="/vehicle-finance/user/billing"
                >
                    <BillingAppGuards>
                    {shell}
                    </BillingAppGuards>
                </BillingProvider>
            ) : (
                shell
            )}
        </VehicleFinanceProvider>
    );
};

export default VehicleFinanceAdminLayout;
