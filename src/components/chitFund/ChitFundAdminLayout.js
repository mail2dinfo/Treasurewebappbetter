import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Chit Fund Admin Contexts
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

// Chit Fund Admin Components
import Navbar from '../Navbar';

// Chit Fund Admin Pages
import HomePage from '../../pages/HomePage';
import Company from '../Company';
import GroupsPage from '../../pages/GroupsPage';
import GroupAccountDetails from '../../pages/GroupAccountDetails';
import SingleEmployeePage from '../../pages/SingleEmployeePage';
import AddAob from '../AddAob';
import DashboardPage from '../../pages/DashboardPage';
import Ledger from '../../pages/Ledger';
import Receivables from '../../pages/Receivables';
import Payables from '../../pages/Payables';
import ProductsPage from '../../pages/ProductsPage';
import MyBillingPage from '../../pages/MyBillingPage';
import BillingOverdueOverlay from '../BillingOverdueOverlay';
import Subscribers from '../Subscribers';

const ChitFundAdminLayout = () => {
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
                                                            <BillingProvider appCode="CHIT_FUND" billingPath="/chit-fund/admin/billing">
                                                                <BillingOverdueOverlay />
                                                                <div className="min-h-screen bg-gray-50">
                                                                    <Navbar />
                                                                    <div className="pt-16">
                                                                        <Switch>
                                                                            {/* Chit Fund Admin Routes */}
                                                                            <Route path="/chit-fund/admin" exact component={HomePage} />
                                                                            <Route path="/chit-fund/admin/home" component={HomePage} />
                                                                            <Route path="/chit-fund/admin/companies" component={Company} />
                                                                            <Route path="/chit-fund/admin/subscribers" component={Subscribers} />
                                                                            <Route path="/chit-fund/admin/groups" component={GroupsPage} />
                                                                            <Route path="/chit-fund/admin/groups/:groupId" component={GroupAccountDetails} />
                                                                            <Route path="/chit-fund/admin/employees" component={SingleEmployeePage} />
                                                                            <Route path="/chit-fund/admin/aob" component={AddAob} />
                                                                            <Route path="/chit-fund/admin/dashboard" component={DashboardPage} />
                                                                            <Route path="/chit-fund/admin/ledger" component={Ledger} />
                                                                            <Route path="/chit-fund/admin/receivables" component={Receivables} />
                                                                            <Route path="/chit-fund/admin/payables" component={Payables} />
                                                                            <Route path="/chit-fund/admin/products" component={ProductsPage} />
                                                                            <Route path="/chit-fund/admin/billing" component={MyBillingPage} />
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

export default ChitFundAdminLayout;
