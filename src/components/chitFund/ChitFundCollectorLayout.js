import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { CollectorProvider, useCollector } from '../../context/CollectorProvider';
import { CollectorLedgerProvider } from '../../context/CollectorLedgerContext';
import { CollectorGroupsProvider } from '../../context/CollectorGroupsContext';
import CollectorHeader from '../collector/CollectorHeader';
import CollectorLogin from '../../pages/collector/CollectorLogin';
import CollectorReceivables from '../../pages/collector/CollectorReceivables';
import CollectorDashboard from '../../pages/collector/CollectorDashboard';
import CollectorAdvanceHistory from '../../pages/collector/CollectorAdvanceHistory';
import 'react-toastify/dist/ReactToastify.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useCollector();

    if (!isAuthenticated) {
        return <Redirect to="/chit-fund/collector/login" />;
    }

    return children;
};

const ChitFundCollectorLayout = () => {
    return (
        <CollectorProvider>
            <CollectorLedgerProvider>
                <CollectorGroupsProvider>
                    <div className="min-h-screen bg-gray-50">
                        <Switch>
                            {/* Login Route - Must come first */}
                            <Route path="/chit-fund/collector/login" component={CollectorLogin} />

                            {/* Protected Routes with Header */}
                            <Route path="/chit-fund/collector/dashboard">
                                <ProtectedRoute>
                                    <CollectorHeader />
                                    <div className="pt-16">
                                        <CollectorDashboard />
                                    </div>
                                </ProtectedRoute>
                            </Route>
                            <Route path="/chit-fund/collector/receivables">
                                <ProtectedRoute>
                                    <CollectorHeader />
                                    <div className="pt-16">
                                        <CollectorReceivables />
                                    </div>
                                </ProtectedRoute>
                            </Route>
                            <Route path="/chit-fund/collector/advance-history">
                                <ProtectedRoute>
                                    <CollectorHeader />
                                    <div className="pt-16">
                                        <CollectorAdvanceHistory />
                                    </div>
                                </ProtectedRoute>
                            </Route>

                            {/* Default redirect for /chit-fund/collector */}
                            <Redirect from="/chit-fund/collector" to="/chit-fund/collector/login" />
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
                </CollectorGroupsProvider>
            </CollectorLedgerProvider>
        </CollectorProvider>
    );
};

export default ChitFundCollectorLayout;













