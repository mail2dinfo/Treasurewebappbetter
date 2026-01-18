import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Personal Loan Context
import { PersonalLoanProvider } from '../../context/personalLoan/PersonalLoanContext';

// Personal Loan Components
import PersonalLoanNavbar from './PersonalLoanNavbar';

// Personal Loan Pages
import PersonalLoanDashboard from '../../pages/personalLoan/PersonalLoanDashboard';
import PersonalLoanCompanyManagement from '../../pages/personalLoan/PersonalLoanCompanyManagement';
import PersonalLoanSubscribersPage from '../../pages/personalLoan/PersonalLoanSubscribersPage';
import PersonalLoanLoansPage from '../../pages/personalLoan/PersonalLoanLoansPage';
import PersonalLoanLedgerPage from '../../pages/personalLoan/PersonalLoanLedgerPage';
import PrivateRoute from '../../pages/PrivateRoute';

// Placeholder component for future pages
const PlaceholderPage = () => {
    return (
        <div className="min-h-[calc(100vh-128px)] flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-gray-400">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Under Development</h2>
                <p className="text-gray-600 mb-4">
                    This feature is currently being built and will be available soon.
                </p>
                <p className="text-sm text-gray-500">
                    Thank you for your patience!
                </p>
            </div>
        </div>
    );
};

const PersonalLoanAdminLayout = () => {
    return (
        <PersonalLoanProvider>
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
        </PersonalLoanProvider>
    );
};

export default PersonalLoanAdminLayout;
