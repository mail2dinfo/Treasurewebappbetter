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
import { usePlatformAccess } from '../../context/platformAccess_context';

// Protected Route Component
const ProtectedRoute = ({ children, requiredFeature }) => {
    const { isAuthenticated, token } = useCollector();
    const platform = usePlatformAccess();

    // Accept freshly written tokens from /login or app-selection (same tick as navigation).
    const hasSession = Boolean(
        isAuthenticated
        || token
        || localStorage.getItem('collector_token')
    );

    if (!hasSession) {
        return <Redirect to="/login" />;
    }
    const isPlatformEmployee = platform?.isAvailable && !platform.isOwner;
    // Only bounce when a different app context is already selected (null context is OK after direct collector login).
    if (
        isPlatformEmployee
        && platform.activeContext?.appCode
        && platform.activeContext.appCode !== 'CHIT_FUND'
    ) {
        return <Redirect to="/app-selection" />;
    }
    const enforceAccess = isPlatformEmployee
        && platform.activeContext?.appCode === 'CHIT_FUND'
        && String(platform.activeContext?.roleCode || '').toUpperCase() === 'COLLECTOR';
    if (
        enforceAccess
        && (
            !platform.hasPermission('chit.collector.portal')
            || (requiredFeature && !platform.hasPermission(requiredFeature))
        )
    ) {
        return <Redirect to="/app-selection" />;
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
                                <ProtectedRoute requiredFeature="chit.collector.dashboard">
                                    <CollectorHeader />
                                    <div className="pt-16">
                                        <CollectorDashboard />
                                    </div>
                                </ProtectedRoute>
                            </Route>
                            <Route path="/chit-fund/collector/receivables">
                                <ProtectedRoute requiredFeature="chit.collector.receivables">
                                    <CollectorHeader />
                                    <div className="pt-16">
                                        <CollectorReceivables />
                                    </div>
                                </ProtectedRoute>
                            </Route>
                            <Route path="/chit-fund/collector/advance-history">
                                <ProtectedRoute requiredFeature="chit.collector.advances">
                                    <CollectorHeader />
                                    <div className="pt-16">
                                        <CollectorAdvanceHistory />
                                    </div>
                                </ProtectedRoute>
                            </Route>

                            {/* Default redirect for /chit-fund/collector */}
                            <Redirect from="/chit-fund/collector" to="/login" />
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













