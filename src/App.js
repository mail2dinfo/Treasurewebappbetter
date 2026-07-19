import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { ScrollToTop, SignUp, VerifyOTP, Login, ForgetPassword } from './components';
import { LandingPage, AppSelectionPage } from './pages';
import SuperAdminHome from './pages/SuperAdminHome';
import SuperAdminUserAnalytics from './pages/SuperAdminUserAnalytics';
import SuperAdminChitFundAnalytics from './pages/SuperAdminChitFundAnalytics';
import SuperAdminDailyFinanceAnalytics from './pages/SuperAdminDailyFinanceAnalytics';
import { UserProvider } from './context/user_context';
import { PlatformAccessProvider } from './context/platformAccess_context';
import { LedgerAccountProvider } from './context/ledgerAccount_context';
import PlatformEmployeesPage from './pages/PlatformEmployeesPage';

// New Business App Layouts
import ChitFundUserLayout from './components/chitFund/ChitFundUserLayout';
import ChitFundSubscriberLayout from './components/chitFund/ChitFundSubscriberLayout';
import ChitFundManagerLayout from './components/chitFund/ChitFundManagerLayout';
import ChitFundAccountantLayout from './components/chitFund/ChitFundAccountantLayout';
import ChitFundCollectorLayout from './components/chitFund/ChitFundCollectorLayout';
import DailyCollectionAdminLayout from './components/dailyCollection/DailyCollectionAdminLayout';
import DailyCollectionCustomerLayout from './components/dailyCollection/DailyCollectionCustomerLayout';
import DailyCollectionCollectorLayout from './components/dailyCollection/DailyCollectionCollectorLayout';
import TwoWheelerFinanceLayout from './components/twoWheelerFinance/TwoWheelerFinanceLayout';
import PersonalLoanAdminLayout from './components/personalLoan/PersonalLoanAdminLayout';
import VehicleFinanceAdminLayout from './components/vehicleFinance/VehicleFinanceAdminLayout';
import VehicleFinanceManagerLayout from './components/vehicleFinance/VehicleFinanceManagerLayout';
import VehicleFinanceCollectorLayout from './components/vehicleFinance/VehicleFinanceCollectorLayout';

// Legacy layouts for backward compatibility (can be removed later)
import SubscriberLayout from './components/subscriber/layout/SubscriberLayout';
import CollectorLayout from './components/collector/CollectorLayout';
import DailyCollectionLayout from './components/dailyCollection/DailyCollectionLayout';


import PrivateRoute from './pages/PrivateRoute';


function App() {
    return (
        <UserProvider>
            <PlatformAccessProvider>
                <LedgerAccountProvider>
                    <Router>
                    <ScrollToTop />
                    <Switch>
                        {/* Super Admin Portal */}
                        <PrivateRoute exact path="/super-admin/user-analytics" component={SuperAdminUserAnalytics} />
                        <PrivateRoute exact path="/super-admin/chit-fund-analytics" component={SuperAdminChitFundAnalytics} />
                        <PrivateRoute exact path="/super-admin/daily-finance-analytics" component={SuperAdminDailyFinanceAnalytics} />
                        <PrivateRoute exact path="/super-admin" component={SuperAdminHome} />
                        <Route path="/super-admin/apps/:appId" render={() => <Redirect to="/super-admin" />} />

                        {/* App Selection Page - Entry point */}
                        <PrivateRoute path="/app-selection" component={AppSelectionPage} />
                        <PrivateRoute exact path="/platform/employees" component={PlatformEmployeesPage} />


                        {/* Chit Fund App Routes */}
                        <Route path="/chit-fund/user" component={ChitFundUserLayout} />
                        <Route path="/chit-fund/subscriber" component={ChitFundSubscriberLayout} />
                        <Route path="/chit-fund/manager" component={ChitFundManagerLayout} />
                        <Route path="/chit-fund/accountant" component={ChitFundAccountantLayout} />
                        <Route path="/chit-fund/collector" component={ChitFundCollectorLayout} />

                        {/* Daily Collection App Routes - Specific routes first */}
                        <Route path="/daily-collection/user" component={DailyCollectionAdminLayout} />
                        <Route path="/daily-collection/customer" component={DailyCollectionCustomerLayout} />
                        <Route path="/daily-collection/collector" component={DailyCollectionCollectorLayout} />
                        {/* Redirect old routes to new structure */}
                        <Route path="/daily-collection/home" render={() => <Redirect to="/daily-collection/user/home" />} />

                        {/* Two Wheeler Finance - redirect to Vehicle Finance */}
                        <Route path="/two-wheeler-finance" render={() => <Redirect to="/vehicle-finance/user/dashboard" />} />

                        {/* Vehicle Finance App Routes */}
                        <Route
                            path="/vehicle-finance/user/collector"
                            render={() => <Redirect to="/login" />}
                        />
                        <Route path="/vehicle-finance/collector" component={VehicleFinanceCollectorLayout} />
                        <Route path="/vehicle-finance/user" component={VehicleFinanceAdminLayout} />
                        <Route path="/vehicle-finance/manager" component={VehicleFinanceManagerLayout} />

                        {/* Personal Loan App Routes */}
                        <Route path="/personal-loan/user" component={PersonalLoanAdminLayout} />

                        {/* Legacy Routes for Backward Compatibility */}
                        <Route path="/customer" render={() => <Redirect to="/chit-fund/subscriber" />} />
                        <Route path="/collector" component={CollectorLayout} />
                        <Route path="/daily-collection" component={DailyCollectionLayout} />

                        {/* Legacy Chit Fund Routes - Redirect to new structure */}
                        <Route path="/subscriber" render={() => <Redirect to="/chit-fund/subscriber" />} />
                        <Route path="/subscribers" render={() => <Redirect to="/chit-fund/user/subscribers" />} />
                        <Route path="/receivables" render={() => <Redirect to="/chit-fund/user/receivables" />} />
                        <Route path="/payables" render={() => <Redirect to="/chit-fund/user/payables" />} />
                        <Route path="/groups" render={() => <Redirect to="/chit-fund/user/groups" />} />
                        <Route path="/companies" render={() => <Redirect to="/chit-fund/user/companies" />} />
                        <Route path="/employees" render={() => <Redirect to="/chit-fund/user/employees" />} />
                        <Route path="/dashboard" render={() => <Redirect to="/chit-fund/user/dashboard" />} />
                        <Route path="/ledger" render={() => <Redirect to="/chit-fund/user/ledger" />} />
                        <Route path="/products" render={() => <Redirect to="/chit-fund/user/products" />} />
                        <Route path="/billing" render={() => <Redirect to="/chit-fund/user/billing" />} />
                        <Route path="/my-billing" render={() => <Redirect to="/chit-fund/user/billing" />} />
                        <Route path="/home" render={() => <Redirect to="/chit-fund/user/home" />} />
                        <Route path="/startagroup" render={() => <Redirect to="/chit-fund/user/startagroup" />} />
                        <Route path="/help" render={() => <Redirect to="/chit-fund/user/help" />} />
                        <Route path="/Faq" render={() => <Redirect to="/chit-fund/user/Faq" />} />
                        <Route path="/addgroupsubscriber/:groupId" render={(props) => <Redirect to={`/chit-fund/user/addgroupsubscriber/${props.match.params.groupId}`} />} />
                        <Route path="/addgroupsubscriber/:groupId/addnew" render={(props) => <Redirect to={`/chit-fund/user/addgroupsubscriber/${props.match.params.groupId}/addnew`} />} />
                        <Route path="/addgroupsubscriber/:groupId/addcompanysubcriber" render={(props) => <Redirect to={`/chit-fund/user/addgroupsubscriber/${props.match.params.groupId}/addcompanysubcriber`} />} />
                        <Route path="/addcompanymultisubscriber/:membershipId" render={(props) => <Redirect to={`/chit-fund/user/addcompanymultisubscriber/${props.match.params.membershipId}`} />} />
                        <Route path="/groups/:groupId" render={(props) => <Redirect to={`/chit-fund/user/groups/${props.match.params.groupId}`} />} />
                        <Route path="/admin-settings" render={() => <Redirect to="/chit-fund/user/adminsettings" />} />
                        <Route path="/personal-settings" render={() => <Redirect to="/chit-fund/user/personalsettings" />} />

                        {/* Public Routes */}
                        <Route path="/" exact component={LandingPage} />
                        <Route path="/signup" component={SignUp} />
                        <Route path="/verify-otp" component={VerifyOTP} />
                        <Route path="/login" component={Login} />
                        <Route path="/forget-password" component={ForgetPassword} />

                        {/* Default redirect to app selection */}
                        <Route path="/">
                            <LandingPage />
                        </Route>
                    </Switch>
                    </Router>
                </LedgerAccountProvider>
            </PlatformAccessProvider>
        </UserProvider>
    );
}

export default App;