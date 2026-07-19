import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Chit Fund Manager Contexts (Limited access for manager role)
import { SubscriberProvider } from '../../context/subscriber/SubscriberContext';
import { GroupsDetailsProvider } from '../../context/groups_context';
import { GroupDetailsProvider } from '../../context/group_context';
import { CompanySubscriberProvider } from '../../context/companysubscriber_context';
import { DashboardProvider } from '../../context/dashboard_context';
import { AobProvider } from '../../context/aob_context';
import { ReceivablesProvider } from '../../context/receivables_context';
import { PayablesProvider } from '../../context/payables_context';
import { LedgerAccountProvider } from '../../context/ledgerAccount_context';
import { LedgerEntryProvider } from '../../context/ledgerEntry_context';
import { ProductProvider } from '../../context/product_context';
import { CollectorAreaProvider } from '../../context/collectorArea_context';

// Chit Fund Manager Components
import ChitFundManagerNavbar from './ChitFundManagerNavbar';
import ChitFundManagerHome from './ChitFundManagerHome';

// Chit Fund Manager Pages (Limited access - no billing, employees, etc.)
import GroupsPage from '../../pages/GroupsPage';
import DashboardPage from '../../pages/DashboardPage';
import Subscribers from '../Subscribers';
import GroupStepForm from '../../pages/MultiStepGroupCreation_New/MultiStepForm';
import SubscriberStepForm from '../../pages/MultiStepCustomerCreation/SubscriberStepForm';
import AuctionsPage from '../../pages/AuctionsPage';
import Winner from '../Winner';
import Receivables from '../../pages/Receivables';
import Payables from '../../pages/Payables';
import AddSub from '../../pages/AddSub';
import AddSubcriber from '../../pages/AddSubcriber';
import UserDue from '../../pages/UserDue';
import CustomerDue from '../../pages/CustomerDue';
import AddAob from '../AddAob';
import PlatformEmployeesPage from '../../pages/PlatformEmployeesPage';
import ChitFundManagerReports from '../../pages/chitFund/ChitFundManagerReports';
import SubscriberProfile from '../../pages/SubscriberProfile';
import SubscriberPasswordUpdate from '../../pages/SubscriberPasswordUpdate';
import ProductsPage from '../../pages/ProductsPage';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { CHIT_NAV_ANY } from '../../utils/chitPermissionCatalog';

const ChitFundManagerLayout = () => {
    const platform = usePlatformAccess();
    const enforceAccess = platform?.isAvailable
        && !platform.isOwner
        && platform.activeContext?.appCode === 'CHIT_FUND'
        && platform.activeContext?.roleCode === 'MANAGER';
    const canAccess = (featureKey) => !enforceAccess || platform.hasPermission(featureKey);
    const canAccessAny = (featureKeys) => !enforceAccess || platform.hasAnyPermission(featureKeys);
    const firstAllowedPath = [
        [CHIT_NAV_ANY.home, '/chit-fund/manager/home'],
        [CHIT_NAV_ANY.groups, '/chit-fund/manager/groups'],
        [CHIT_NAV_ANY.subscribers, '/chit-fund/manager/subscribers'],
        [CHIT_NAV_ANY.receivables, '/chit-fund/manager/receivables'],
        [CHIT_NAV_ANY.payables, '/chit-fund/manager/payables'],
        [CHIT_NAV_ANY.areas, '/chit-fund/manager/areas'],
        [CHIT_NAV_ANY.products, '/chit-fund/manager/products'],
        [CHIT_NAV_ANY.employees, '/chit-fund/manager/employees'],
        [CHIT_NAV_ANY.reportAreaWise, '/chit-fund/manager/reports/area-wise'],
        [CHIT_NAV_ANY.reportSubscriberOutstanding, '/chit-fund/manager/reports/subscriber-outstanding'],
    ].find(([featureKeys]) => canAccessAny(featureKeys))?.[1] || '/app-selection';
    const guardedRoute = (Component, featureKeys, routeProps) => (
        (Array.isArray(featureKeys) ? canAccessAny(featureKeys) : canAccess(featureKeys))
            ? <Component {...routeProps} />
            : <Redirect to={firstAllowedPath} />
    );

    return (
        <SubscriberProvider>
            <GroupsDetailsProvider>
                <GroupDetailsProvider>
                    <CompanySubscriberProvider>
                        <DashboardProvider>
                            <LedgerAccountProvider>
                                <LedgerEntryProvider>
                                    <AobProvider>
                                        <CollectorAreaProvider>
                                            <ReceivablesProvider>
                                                <PayablesProvider>
                                                    <ProductProvider>
                                        <div className="min-h-screen bg-gray-50">
                                            <ChitFundManagerNavbar />

                                            <div>
                                                <Switch>
                                                    <Route exact path="/chit-fund/manager" render={(props) => guardedRoute(ChitFundManagerHome, CHIT_NAV_ANY.home, props)} />
                                                    <Route exact path="/chit-fund/manager/home" render={(props) => guardedRoute(ChitFundManagerHome, CHIT_NAV_ANY.home, props)} />
                                                    <Route exact path="/chit-fund/manager/dashboard" render={(props) => guardedRoute(DashboardPage, CHIT_NAV_ANY.home, props)} />
                                                    <Route exact path="/chit-fund/manager/startagroup" render={(props) => guardedRoute(GroupStepForm, 'chit_group_start', props)} />
                                                    <Route exact path="/chit-fund/manager/add-subscriber" render={(props) => guardedRoute(SubscriberStepForm, 'chit_subscriber_add', props)} />
                                                    <Route exact path="/chit-fund/manager/addgroupsubscriber/:groupId" render={(props) => guardedRoute(AddSub, 'chit_subscriber_add', props)} />
                                                    <Route exact path="/chit-fund/manager/addgroupsubscriber/:groupId/addnew" render={(props) => guardedRoute(AddSubcriber, 'chit_subscriber_add', props)} />
                                                    <Route exact path="/chit-fund/manager/addgroupsubscriber/:groupId/addcompanysubcriber" render={(props) => (
                                                        canAccess('chit_subscriber_add')
                                                            ? <Subscribers {...props} canAddSubscriber={false} />
                                                            : <Redirect to={firstAllowedPath} />
                                                    )} />
                                                    <Route exact path="/chit-fund/manager/subscribers" render={(props) => (
                                                        canAccessAny(CHIT_NAV_ANY.subscribers)
                                                            ? <Subscribers {...props} addSubscriberPath="/chit-fund/manager/add-subscriber" canAddSubscriber={canAccess('chit_subscriber_add')} />
                                                            : <Redirect to={firstAllowedPath} />
                                                    )} />
                                                    <Route exact path="/chit-fund/manager/subscriber/:id/update-password" render={(props) => guardedRoute(SubscriberPasswordUpdate, 'chit_subscriber_change_password', props)} />
                                                    <Route exact path="/chit-fund/manager/subscriber/:id" render={(props) => guardedRoute(SubscriberProfile, 'chit_subscriber_view', props)} />
                                                    <Route exact path="/chit-fund/manager/groups/:groupId/auctions/winner/:reserve/winner" render={(props) => guardedRoute(Winner, 'chit_auction_manage', props)} />
                                                    <Route path="/chit-fund/manager/groups/:groupId/auctions" render={(props) => guardedRoute(AuctionsPage, 'chit_auction_manage', props)} />
                                                    <Route exact path="/chit-fund/manager/groups/:groupId/your-due" render={(props) => guardedRoute(UserDue, CHIT_NAV_ANY.receivables, props)} />
                                                    <Route exact path="/chit-fund/manager/groups/:groupId/customer-due" render={(props) => guardedRoute(CustomerDue, CHIT_NAV_ANY.receivables, props)} />
                                                    <Route exact path="/chit-fund/manager/groups/:groupId" render={(props) => guardedRoute(GroupsPage, CHIT_NAV_ANY.groups, props)} />
                                                    <Route exact path="/chit-fund/manager/groups" render={() => (
                                                        canAccessAny(CHIT_NAV_ANY.groups)
                                                            ? <ChitFundManagerHome showDashboard={false} />
                                                            : <Redirect to={firstAllowedPath} />
                                                    )} />
                                                    <Route exact path="/chit-fund/manager/receivables" render={(props) => guardedRoute(Receivables, CHIT_NAV_ANY.receivables, props)} />
                                                    <Route exact path="/chit-fund/manager/payables" render={(props) => guardedRoute(Payables, CHIT_NAV_ANY.payables, props)} />
                                                    <Route exact path="/chit-fund/manager/areas" render={(props) => guardedRoute(AddAob, CHIT_NAV_ANY.areas, props)} />
                                                    <Route exact path="/chit-fund/manager/products" render={(props) => guardedRoute(ProductsPage, CHIT_NAV_ANY.products, props)} />
                                                    <Route exact path="/chit-fund/manager/employees" render={() => (
                                                        canAccessAny(CHIT_NAV_ANY.employees)
                                                            ? (
                                                                <PlatformEmployeesPage
                                                                    appScope="CHIT_FUND"
                                                                    managerMode
                                                                    embedded
                                                                    backPath="/chit-fund/manager/home"
                                                                    pageTitle="Chit Fund Employees"
                                                                />
                                                            )
                                                            : <Redirect to={firstAllowedPath} />
                                                    )} />
                                                    <Route exact path="/chit-fund/manager/reports/area-wise" render={() => (
                                                        canAccessAny(CHIT_NAV_ANY.reportAreaWise)
                                                            ? <ChitFundManagerReports reportType="area" />
                                                            : <Redirect to={firstAllowedPath} />
                                                    )} />
                                                    <Route exact path="/chit-fund/manager/reports/subscriber-outstanding" render={() => (
                                                        canAccessAny(CHIT_NAV_ANY.reportSubscriberOutstanding)
                                                            ? <ChitFundManagerReports reportType="subscriber" />
                                                            : <Redirect to={firstAllowedPath} />
                                                    )} />
                                                    <Redirect to={firstAllowedPath} />
                                                </Switch>
                                            </div>

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
                                                    </ProductProvider>
                                                </PayablesProvider>
                                            </ReceivablesProvider>
                                        </CollectorAreaProvider>
                                    </AobProvider>
                                </LedgerEntryProvider>
                            </LedgerAccountProvider>
                        </DashboardProvider>
                    </CompanySubscriberProvider>
                </GroupDetailsProvider>
            </GroupsDetailsProvider>
        </SubscriberProvider>
    );
};

export default ChitFundManagerLayout;













