import React, { useState, useEffect } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useHistory } from 'react-router-dom';
import {
    VehicleFinanceCollectorProvider,
    useVehicleFinanceCollector,
} from '../../context/vehicleFinance/VehicleFinanceCollectorProvider';
import { API_BASE_URL } from '../../utils/apiConfig';
import VehicleFinanceCollectorLogin from '../../pages/vehicleFinance/VehicleFinanceCollectorLogin';
import VehicleFinanceCollectionsPage from '../../pages/vehicleFinance/VehicleFinanceCollectionsPage';
import { FiLogOut, FiBarChart2 } from 'react-icons/fi';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { useUserContext } from '../../context/user_context';
import MyTreasureBrand from '../MyTreasureBrand';

const MAIN_LOGIN_PATH = '/login';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, token } = useVehicleFinanceCollector();
    // Also accept freshly written app-selection tokens (same tick as navigation).
    const hasSession = isAuthenticated || Boolean(token || localStorage.getItem('vf_collector_token'));
    if (!hasSession) {
        return <Redirect to={MAIN_LOGIN_PATH} />;
    }
    return children;
};

const CollectorHeader = () => {
    const history = useHistory();
    const { user, logout } = useVehicleFinanceCollector();
    const { logout: logoutMainUser } = useUserContext();
    const platform = usePlatformAccess();

    const handleLogout = () => {
        platform?.clearActiveContext();
        logout();
        // Clear shared /app-selection session so logout cannot bounce back into the portal.
        logoutMainUser();
        history.replace(MAIN_LOGIN_PATH);
    };

    return (
        <header className="bg-red-600 text-white shadow-lg fixed w-full top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <MyTreasureBrand
                        to="/vehicle-finance/collector/dashboard"
                        subtitle="Vehicle Finance Collector"
                        inverse
                    />
                    <nav className="hidden md:flex items-center space-x-4">
                        <button
                            type="button"
                            onClick={() => history.push('/vehicle-finance/collector/dashboard')}
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                        >
                            <FiBarChart2 className="h-4 w-4" />
                            <span>Dashboard</span>
                        </button>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <span className="hidden sm:inline text-sm font-medium">
                            {user?.firstname} {user?.lastname || ''}
                        </span>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                        >
                            <FiLogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

const VehicleFinanceCollectorDashboard = () => {
    const { user, token, parentMembershipId } = useVehicleFinanceCollector();
    const [data, setData] = useState(null);

    const membershipId =
        parentMembershipId ||
        user?.userAccounts?.[0]?.parent_membership_id;
    const userId = user?.userId;

    useEffect(() => {
        if (!membershipId || !token) return;
        fetch(
            `${API_BASE_URL}/vf/collector/dashboard?parent_membership_id=${membershipId}&collector_user_id=${userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
            .then((r) => r.json())
            .then((d) => setData(d.results));
    }, [membershipId, token, userId]);

    const summary = data?.summary || {};

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Collector Dashboard</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Due', value: summary.totalDue },
                    { label: "Today's Due", value: summary.todayDueAmount },
                    { label: 'Overdue', value: summary.overdueCount },
                    { label: 'Collected Today', value: summary.collectedToday },
                ].map((c) => (
                    <div key={c.label} className="bg-white border rounded-xl p-4">
                        <p className="text-sm text-gray-500">{c.label}</p>
                        <p className="text-2xl font-bold text-red-600">
                            ₹{parseFloat(c.value || 0).toLocaleString('en-IN')}
                        </p>
                    </div>
                ))}
            </div>
            <VehicleFinanceCollectionsPage />
        </div>
    );
};

const VehicleFinanceCollectorLayout = () => (
    <VehicleFinanceCollectorProvider>
        <div className="min-h-screen bg-gray-50">
            <Switch>
                <Route exact path="/vehicle-finance/collector/login" component={VehicleFinanceCollectorLogin} />

                <Route path="/vehicle-finance/collector/dashboard">
                    <ProtectedRoute>
                        <CollectorHeader />
                        <div className="pt-16">
                            <VehicleFinanceCollectorDashboard />
                        </div>
                    </ProtectedRoute>
                </Route>

                <Redirect exact from="/vehicle-finance/collector" to={MAIN_LOGIN_PATH} />
                <Redirect from="/vehicle-finance/user/collector" to={MAIN_LOGIN_PATH} />
            </Switch>

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    </VehicleFinanceCollectorProvider>
);

export default VehicleFinanceCollectorLayout;
