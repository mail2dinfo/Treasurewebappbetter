import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Chit Fund Accountant Contexts (Financial access only)
import { SubscriberProvider } from '../../context/subscriber/SubscriberContext';
import { LedgerAccountProvider } from '../../context/ledgerAccount_context';
import { CompanyLiveEventsProvider } from '../../context/companyLiveEvents_context';
import { LedgerEntryProvider } from '../../context/ledgerEntry_context';
import { LedgerCategoryProvider } from '../../context/ledgerCategory_context';
import { ReceivablesProvider } from '../../context/receivables_context';
import { PayablesProvider } from '../../context/payables_context';
import { DashboardProvider } from '../../context/dashboard_context';

// Chit Fund Accountant Components
import ChitFundAccountantNavbar from './ChitFundAccountantNavbar';

// Chit Fund Accountant Pages (Financial access only)
import HomePage from '../../pages/HomePage';
import DashboardPage from '../../pages/DashboardPage';
import Ledger from '../../pages/Ledger';
import Receivables from '../../pages/Receivables';
import Payables from '../../pages/Payables';

const ChitFundAccountantLayout = () => {
    return (
        <SubscriberProvider>
            <CompanyLiveEventsProvider>
            <LedgerAccountProvider>
                <LedgerEntryProvider>
                    <LedgerCategoryProvider>
                    <ReceivablesProvider>
                        <PayablesProvider>
                            <DashboardProvider>
                                <div className="min-h-screen bg-gray-50">
                                    <ChitFundAccountantNavbar />

                                    <div className="pt-16">
                                        <Switch>
                                            {/* Chit Fund Accountant Routes (Financial Access Only) */}
                                            <Route path="/chit-fund/accountant" exact component={HomePage} />
                                            <Route path="/chit-fund/accountant/home" component={HomePage} />
                                            <Route path="/chit-fund/accountant/dashboard" component={DashboardPage} />
                                            <Route path="/chit-fund/accountant/ledger" component={Ledger} />
                                            <Route path="/chit-fund/accountant/receivables" component={Receivables} />
                                            <Route path="/chit-fund/accountant/payables" component={Payables} />
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
                            </DashboardProvider>
                        </PayablesProvider>
                    </ReceivablesProvider>
                    </LedgerCategoryProvider>
                </LedgerEntryProvider>
            </LedgerAccountProvider>
            </CompanyLiveEventsProvider>
        </SubscriberProvider>
    );
};

export default ChitFundAccountantLayout;













