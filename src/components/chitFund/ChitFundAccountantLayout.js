import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { SubscriberProvider } from '../../context/subscriber/SubscriberContext';
import { AobProvider } from '../../context/aob_context';
import { GroupsDetailsProvider } from '../../context/groups_context';
import { GroupDetailsProvider } from '../../context/group_context';
import { CompanySubscriberProvider } from '../../context/companysubscriber_context';
import { LedgerAccountProvider } from '../../context/ledgerAccount_context';
import { CompanyLiveEventsProvider } from '../../context/companyLiveEvents_context';
import { LedgerEntryProvider } from '../../context/ledgerEntry_context';
import { LedgerCategoryProvider } from '../../context/ledgerCategory_context';
import { ReceivablesProvider } from '../../context/receivables_context';
import { PayablesProvider } from '../../context/payables_context';
import { DashboardProvider } from '../../context/dashboard_context';

import ChitFundAccountantNavbar from './ChitFundAccountantNavbar';

import HomePage from '../../pages/HomePage';
import DashboardPage from '../../pages/DashboardPage';
import Ledger from '../../pages/Ledger';
import Receivables from '../../pages/Receivables';
import Payables from '../../pages/Payables';
import GroupsPage from '../../pages/GroupsPage';
import AdaptiveGroupsPage from '../../pages/AdaptiveGroupsPage';
import FlexibleGroupsPage from '../../pages/FlexibleGroupsPage';
import AuctionsPage from '../../pages/AuctionsPage';
import Winner from '../Winner';
import UserDue from '../../pages/UserDue';
import CustomerDue from '../../pages/CustomerDue';

const accountantHome = (props) => (
    <HomePage
        {...props}
        basePath="/chit-fund/accountant"
        groupsOnly
        canCreateGroup={false}
        canDeleteGroup={false}
        canAddSubscriber={false}
        alwaysShowCreateGroup={false}
    />
);

const ChitFundAccountantLayout = () => {
    return (
        <SubscriberProvider>
            <AobProvider>
                <GroupsDetailsProvider>
                    <GroupDetailsProvider>
                        <CompanySubscriberProvider>
                            <CompanyLiveEventsProvider>
                                <LedgerAccountProvider>
                                    <LedgerEntryProvider>
                                        <LedgerCategoryProvider>
                                            <ReceivablesProvider>
                                                <PayablesProvider>
                                                    <DashboardProvider>
                                                        <div className="min-h-screen bg-gray-50">
                                                            <ChitFundAccountantNavbar />
                                                            <Switch>
                                                                <Route path="/chit-fund/accountant" exact render={accountantHome} />
                                                                <Route path="/chit-fund/accountant/home" render={accountantHome} />
                                                                <Route path="/chit-fund/accountant/dashboard" component={DashboardPage} />
                                                                <Route path="/chit-fund/accountant/ledger" component={Ledger} />
                                                                <Route path="/chit-fund/accountant/receivables" component={Receivables} />
                                                                <Route path="/chit-fund/accountant/payables" component={Payables} />
                                                                <Route path="/chit-fund/accountant/adaptive-groups/:groupId" component={AdaptiveGroupsPage} />
                                                                <Route path="/chit-fund/accountant/flexible-groups/:groupId" component={FlexibleGroupsPage} />
                                                                <Route path="/chit-fund/accountant/groups/:groupId/auctions/winner/:reserve/winner" component={Winner} />
                                                                <Route path="/chit-fund/accountant/groups/:groupId/auctions" component={AuctionsPage} />
                                                                <Route path="/chit-fund/accountant/groups/:groupId/auctions/*" component={AuctionsPage} />
                                                                <Route path="/chit-fund/accountant/groups/:groupId/your-due" component={UserDue} />
                                                                <Route path="/chit-fund/accountant/groups/:groupId/customer-due" component={CustomerDue} />
                                                                <Route path="/chit-fund/accountant/groups/:groupId" component={GroupsPage} />
                                                            </Switch>

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
                        </CompanySubscriberProvider>
                    </GroupDetailsProvider>
                </GroupsDetailsProvider>
            </AobProvider>
        </SubscriberProvider>
    );
};

export default ChitFundAccountantLayout;
