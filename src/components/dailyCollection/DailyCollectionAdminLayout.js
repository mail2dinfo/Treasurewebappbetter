import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Daily Collection Admin Contexts
import { DailyCollectionProvider } from '../../context/dailyCollection/DailyCollectionContext';
import { DcLedgerProvider } from '../../context/dailyCollection/dcLedgerContext';
import { AnalyticsProvider } from '../../context/dailyCollection/AnalyticsContext';
import { CompanySubscriberProvider } from '../../context/companysubscriber_context';
import { DcSubscriberProvider } from '../../context/dailyCollection/DcSubscriberContext';
import { BillingProvider } from '../../context/billing_context';

// Daily Collection Admin Components
import DailyCollectionNavbar from './DailyCollectionNavbar';
import DailyCollectionAppMenuBar from './DailyCollectionAppMenuBar';
import { DC_BASE_PATH } from './dailyCollectionMenuItems';

// Daily Collection Admin Pages
import CompanyManagement from '../../pages/dailyCollection/CompanyManagement';
import SubscribersPage from '../../pages/dailyCollection/SubscribersPage';
import ProductManagement from '../../pages/dailyCollection/ProductManagement';
import LoansPage from '../../pages/dailyCollection/LoansPage';
import DcLedgerPage from '../../pages/dailyCollection/dcLedgerPage';
import CollectionsPage from '../../pages/dailyCollection/CollectionsPage';
import DashboardPage from '../../pages/dailyCollection/DashboardPage';
import ReportsPage from '../../pages/dailyCollection/ReportsPage';
import MyBillingPage from '../../pages/MyBillingPage';
import BillingAppGuards from '../BillingAppGuards';
import PrivateRoute from '../../pages/PrivateRoute';

const DailyCollectionAdminLayout = () => {
    return (
        <CompanySubscriberProvider>
            <DcSubscriberProvider>
                <DailyCollectionProvider>
                    <DcLedgerProvider>
                        <AnalyticsProvider>
                            <BillingProvider
                                appCode="DAILY_COLLECTION"
                                billingPath="/daily-collection/user/billing"
                            >
                                <BillingAppGuards>
                                <div className="min-h-screen bg-gray-50">
                                    {/* Daily Collection Admin Navbar */}
                                    <DailyCollectionNavbar />
                                    <DailyCollectionAppMenuBar basePath={DC_BASE_PATH} />

                                    {/* Main Content Area */}
                                    <div className="min-h-[calc(100vh-112px)]">
                                        <Switch>
                                            {/* Daily Collection User Routes */}
                                        <PrivateRoute exact path="/daily-collection/user" component={DashboardPage} />
                                        <PrivateRoute exact path="/daily-collection/user/home" component={DashboardPage} />
                                        <PrivateRoute exact path="/daily-collection/user/dashboard" component={DashboardPage} />
                                            <PrivateRoute exact path="/daily-collection/user/companies" component={CompanyManagement} />
                                            <PrivateRoute exact path="/daily-collection/user/company" component={CompanyManagement} />
                                            <PrivateRoute exact path="/daily-collection/user/subscribers" component={SubscribersPage} />
                                            <PrivateRoute exact path="/daily-collection/user/products" component={ProductManagement} />
                                            <PrivateRoute exact path="/daily-collection/user/loans" component={LoansPage} />
                                            <PrivateRoute exact path="/daily-collection/user/ledger" component={DcLedgerPage} />
                                            <PrivateRoute exact path="/daily-collection/user/collections" component={CollectionsPage} />
                                            <PrivateRoute exact path="/daily-collection/user/reports" component={ReportsPage} />
                                            <PrivateRoute exact path="/daily-collection/user/billing" component={MyBillingPage} />

                                            {/* Default redirect to dashboard */}
                                            <Route path="/daily-collection/user">
                                                <DashboardPage />
                                            </Route>
                                        </Switch>
                                    </div>

                                    {/* Footer */}
                                    <footer className="bg-white border-t border-gray-200 py-4">
                                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                            <p className="text-center text-sm text-gray-500">
                                                © 2024 Daily Collection Admin. Part of MyTreasure Finance Hub.
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
                            </BillingAppGuards>
                            </BillingProvider>
                        </AnalyticsProvider>
                    </DcLedgerProvider>
                </DailyCollectionProvider>
            </DcSubscriberProvider>
        </CompanySubscriberProvider>
    );
};

export default DailyCollectionAdminLayout;
