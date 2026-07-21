import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Chit Fund User Contexts (Full access for business owner)
import { SubscriberProvider } from '../../context/subscriber/SubscriberContext';
import { EmployeeProvider } from '../../context/employee_context';
import { AobProvider } from '../../context/aob_context';
import { CollectorAreaProvider } from '../../context/collectorArea_context';
import { DashboardProvider } from '../../context/dashboard_context';
import { GroupsDetailsProvider } from '../../context/groups_context';
import { GroupDetailsProvider } from '../../context/group_context';
import { CompanySubscriberProvider } from '../../context/companysubscriber_context';
import { LedgerAccountProvider } from '../../context/ledgerAccount_context';
import { LedgerEntryProvider } from '../../context/ledgerEntry_context';
import { ReceivablesProvider } from '../../context/receivables_context';
import { PayablesProvider } from '../../context/payables_context';
import { ProductProvider } from '../../context/product_context';
import { BillingProvider } from '../../context/billing_context';
import BillingAppGuards from '../BillingAppGuards';

// Chit Fund User Components
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import ChitFundAppMenuBar from './ChitFundAppMenuBar';
import { CHIT_BASE_PATH } from './chitFundMenuItems';

// Chit Fund User Pages (Full access)
import HomePage from '../../pages/HomePage';
import Company from '../Company';
import GroupsPage from '../../pages/GroupsPage';
import SingleEmployeePage from '../../pages/SingleEmployeePage';
import AddAob from '../AddAob';
import DashboardPage from '../../pages/DashboardPage';
import Ledger from '../../pages/Ledger';
import Receivables from '../../pages/Receivables';
import Payables from '../../pages/Payables';
import ProductsPage from '../../pages/ProductsPage';
import MyBillingPage from '../../pages/MyBillingPage';
import Subscribers from '../Subscribers';
import GroupStepForm from '../../pages/MultiStepGroupCreation_New/MultiStepForm';
import SubscriberStepForm from '../../pages/MultiStepCustomerCreation/SubscriberStepForm';
import Help from '../../pages/Help';
import Faq from '../../pages/Faq';
import AdminSettings from '../AdminSettings';
import PersonalSettings from '../PersonalSettings';
import AddSub from '../../pages/AddSub';
import AddSubcriber from '../../pages/AddSubcriber';
import AuctionsPage from '../../pages/AuctionsPage';
import Winner from '../Winner';
import SubscriberProfile from '../../pages/SubscriberProfile';
import SubscriberPasswordUpdate from '../../pages/SubscriberPasswordUpdate';
import UserDue from '../../pages/UserDue';
import CustomerDue from '../../pages/CustomerDue';

const ChitFundUserLayout = () => {
    return (
        <SubscriberProvider>
            <EmployeeProvider>
                <AobProvider>
                    <CollectorAreaProvider>
                        <DashboardProvider>
                            <GroupsDetailsProvider>
                                <GroupDetailsProvider>
                                    <CompanySubscriberProvider>
                                        <LedgerAccountProvider>
                                            <LedgerEntryProvider>
                                                <ReceivablesProvider>
                                                    <PayablesProvider>
                                                        <ProductProvider>
                                                            <BillingProvider appCode="CHIT_FUND" billingPath="/chit-fund/user/billing">
                                                                <BillingAppGuards>
                                                                <div className="min-h-screen bg-gray-50">
                                                                    <Navbar />
                                                                    {/* Spacer for fixed top navbar (h-20) */}
                                                                    <div className="h-20" aria-hidden="true" />
                                                                    <ChitFundAppMenuBar basePath={CHIT_BASE_PATH} />
                                                                    <Sidebar />
                                                                    <main className="main-content" style={{
                                                                        paddingTop: '0',
                                                                        minHeight: 'calc(100vh - 130px)',
                                                                        paddingLeft: '0',
                                                                        paddingRight: '0',
                                                                        paddingBottom: '0'
                                                                    }}>
                                                                        <Switch>
                                                                            {/* Chit Fund User Routes (Full Business Owner Access) */}
                                                                            <Route path="/chit-fund/user" exact component={HomePage} />
                                                                            <Route path="/chit-fund/user/home" component={HomePage} />
                                                                            <Route path="/chit-fund/user/companies" component={Company} />
                                                                            <Route path="/chit-fund/user/subscribers" component={Subscribers} />
                                                                            <Route path="/chit-fund/user/subscriber/:id/update-password" component={SubscriberPasswordUpdate} />
                                                                            <Route path="/chit-fund/user/subscriber/:id" component={SubscriberProfile} />
                                                                            <Route path="/chit-fund/user/groups/:groupId/auctions/winner/:reserve/winner" component={Winner} />
                                                                            <Route path="/chit-fund/user/groups/:groupId/auctions" component={AuctionsPage} />
                                                                            <Route path="/chit-fund/user/groups/:groupId/auctions/*" component={AuctionsPage} />
                                                                            <Route path="/chit-fund/user/groups/:groupId/your-due" component={UserDue} />
                                                                            <Route path="/chit-fund/user/groups/:groupId/customer-due" component={CustomerDue} />
                                                                            <Route path="/chit-fund/user/groups/:groupId" component={GroupsPage} />
                                                                            <Route
                                                                                exact
                                                                                path="/chit-fund/user/groups"
                                                                                render={() => (
                                                                                    <HomePage
                                                                                        basePath="/chit-fund/user"
                                                                                        groupsOnly
                                                                                        alwaysShowCreateGroup
                                                                                        canCreateGroup
                                                                                    />
                                                                                )}
                                                                            />
                                                                            <Route path="/chit-fund/user/addcompanymultisubscriber/:membershipId" component={SubscriberStepForm} />
                                                                            <Route path="/chit-fund/user/employees" component={SingleEmployeePage} />
                                                                            <Route path="/chit-fund/user/aob" component={AddAob} />
                                                                            <Route path="/chit-fund/user/dashboard" component={DashboardPage} />
                                                                            <Route path="/chit-fund/user/ledger" component={Ledger} />
                                                                            <Route path="/chit-fund/user/receivables" component={Receivables} />
                                                                            <Route path="/chit-fund/user/payables" component={Payables} />
                                                                            <Route path="/chit-fund/user/products" component={ProductsPage} />
                                                                            <Route path="/chit-fund/user/billing" component={MyBillingPage} />
                                                                            <Route path="/chit-fund/user/startagroup" component={GroupStepForm} />
                                                                            <Route path="/chit-fund/user/help" component={Help} />
                                                                            <Route path="/chit-fund/user/Faq" component={Faq} />
                                                                            <Route path="/chit-fund/user/adminsettings" component={AdminSettings} />
                                                                            <Route path="/chit-fund/user/personalsettings" component={PersonalSettings} />
                                                                            <Route exact path="/chit-fund/user/addgroupsubscriber/:groupId" component={AddSub} />
                                                                            <Route path="/chit-fund/user/addgroupsubscriber/:groupId/addnew" component={AddSubcriber} />
                                                                            <Route path="/chit-fund/user/addgroupsubscriber/:groupId/addcompanysubcriber" component={Subscribers} />
                                                                        </Switch>
                                                                    </main>

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
                                                        </ProductProvider>
                                                    </PayablesProvider>
                                                </ReceivablesProvider>
                                            </LedgerEntryProvider>
                                        </LedgerAccountProvider>
                                    </CompanySubscriberProvider>
                                </GroupDetailsProvider>
                            </GroupsDetailsProvider>
                        </DashboardProvider>
                    </CollectorAreaProvider>
                </AobProvider>
            </EmployeeProvider>
        </SubscriberProvider>
    );
};

export default ChitFundUserLayout;
