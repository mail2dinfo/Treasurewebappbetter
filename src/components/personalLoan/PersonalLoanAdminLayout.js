import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Personal Loan Context
import { PersonalLoanProvider } from '../../context/personalLoan/PersonalLoanContext';
import { BillingProvider } from '../../context/billing_context';

// Personal Loan Components
import PersonalLoanNavbar from './PersonalLoanNavbar';

// Personal Loan Pages
import PersonalLoanDashboard from '../../pages/personalLoan/PersonalLoanDashboard';
import PersonalLoanCompanyManagement from '../../pages/personalLoan/PersonalLoanCompanyManagement';
import PersonalLoanSubscribersPage from '../../pages/personalLoan/PersonalLoanSubscribersPage';
import PersonalLoanLoansPage from '../../pages/personalLoan/PersonalLoanLoansPage';
import PersonalLoanLedgerPage from '../../pages/personalLoan/PersonalLoanLedgerPage';
import MyBillingPage from '../../pages/MyBillingPage';
import BillingAppGuards from '../BillingAppGuards';
import PrivateRoute from '../../pages/PrivateRoute';

const PersonalLoanAdminLayout = () => {
    return (
        <PersonalLoanProvider>
            <BillingProvider
                appCode="PERSONAL_LOAN"
                billingPath="/personal-loan/user/billing"
            >
                <BillingAppGuards>
                <div className="min-h-screen bg-gray-50">
                    {/* Personal Loan Admin Navbar */}
                    <PersonalLoanNavbar />

                    {/* Main Content Area */}
                    <div className="min-h-[calc(100vh-56px)]">
                        <Switch>
                            {/* Personal Loan User Routes */}
                            <PrivateRoute exact path="/personal-loan/user" component={PersonalLoanDashboard} />
                            <PrivateRoute exact path="/personal-loan/user/dashboard" component={PersonalLoanDashboard} />
                            <PrivateRoute exact path="/personal-loan/user/company" component={PersonalLoanCompanyManagement} />
                            <PrivateRoute exact path="/personal-loan/user/subscribers" component={PersonalLoanSubscribersPage} />
                            <PrivateRoute exact path="/personal-loan/user/loans" component={PersonalLoanLoansPage} />
                            <PrivateRoute exact path="/personal-loan/user/ledger" component={PersonalLoanLedgerPage} />
                            <PrivateRoute exact path="/personal-loan/user/billing" component={MyBillingPage} />

                            {/* Default redirect to dashboard */}
                            <Route path="/personal-loan/user">
                                <PersonalLoanDashboard />
                            </Route>
                        </Switch>
                    </div>

                    {/* Footer */}
                    <footer className="bg-white border-t border-gray-200 py-4">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <p className="text-center text-sm text-gray-500">
                                © 2024 Personal Loan App. Part of MyTreasure Finance Hub.
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
        </PersonalLoanProvider>
    );
};

export default PersonalLoanAdminLayout;
