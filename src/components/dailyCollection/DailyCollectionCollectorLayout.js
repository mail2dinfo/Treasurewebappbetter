import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { CompanySubscriberProvider } from '../../context/companysubscriber_context';
import { DcLiveEventsProvider } from '../../context/dailyCollection/dcLiveEvents_context';
import DailyCollectionCollectorNavbar from './DailyCollectionCollectorNavbar';
import DailyCollectionCollectorDashboardPage from '../../pages/dailyCollection/DailyCollectionCollectorDashboardPage';
import DailyCollectionCollectorCustomersPage from '../../pages/dailyCollection/DailyCollectionCollectorCustomersPage';
import CollectionsPage from '../../pages/dailyCollection/CollectionsPage';

const DailyCollectionCollectorCollectionsPage = () => <CollectionsPage collectorScoped />;

const DailyCollectionCollectorLayout = () => {
    return (
        <CompanySubscriberProvider>
            <DcLiveEventsProvider>
            <div className="min-h-screen bg-gray-50">
                <DailyCollectionCollectorNavbar />

                <div className="min-h-[calc(100vh-128px)]">
                    <Switch>
                        <Route path="/daily-collection/collector" exact>
                            <Redirect to="/daily-collection/collector/dashboard" />
                        </Route>
                        <Route path="/daily-collection/collector/dashboard" component={DailyCollectionCollectorDashboardPage} />
                        <Route path="/daily-collection/collector/collections" component={DailyCollectionCollectorCollectionsPage} />
                        <Route path="/daily-collection/collector/customers" component={DailyCollectionCollectorCustomersPage} />
                        <Route path="/daily-collection/collector">
                            <Redirect to="/daily-collection/collector/dashboard" />
                        </Route>
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
            </DcLiveEventsProvider>
        </CompanySubscriberProvider>
    );
};

export default DailyCollectionCollectorLayout;
