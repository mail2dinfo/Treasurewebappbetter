import React, { useState, useEffect, useCallback } from 'react';
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
import { FiLogOut, FiBarChart2, FiRefreshCw } from 'react-icons/fi';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { useUserContext } from '../../context/user_context';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';

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
                        <FinanceHubNavButton
                            className="flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium text-white hover:bg-red-700"
                            iconClassName="w-4 h-4"
                        />
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
    const [isRefreshing, setIsRefreshing] = useState(false);

    const membershipId =
        parentMembershipId ||
        user?.userAccounts?.[0]?.parent_membership_id;
    const userId = user?.userId;

    const loadDashboard = useCallback(async () => {
        if (!membershipId || !token) return;
        setIsRefreshing(true);
        try {
            const res = await fetch(
                `${API_BASE_URL}/vf/collector/dashboard?parent_membership_id=${membershipId}&collector_user_id=${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const body = await res.json();
            setData(body.results || null);
        } catch (err) {
            console.error('Failed to load collector dashboard', err);
        } finally {
            setIsRefreshing(false);
        }
    }, [membershipId, token, userId]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    useEffect(() => {
        const handlePaid = () => {
            loadDashboard();
        };
        window.addEventListener('vfCollectionPaid', handlePaid);
        window.addEventListener('loanDeleted', handlePaid);
        return () => {
            window.removeEventListener('vfCollectionPaid', handlePaid);
            window.removeEventListener('loanDeleted', handlePaid);
        };
    }, [loadDashboard]);

    const summary = data?.summary || {};
    const formatMoney = (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN')}`;

    const cards = [
        {
            label: 'Total Due',
            hint: 'All unpaid dues assigned to you',
            value: summary.totalDue,
            color: 'text-gray-900',
            bg: 'bg-gray-100',
        },
        {
            label: "Today's Due",
            hint: 'Installments due today',
            value: summary.todayDueAmount ?? summary.todayDue,
            color: 'text-blue-700',
            bg: 'bg-blue-100',
        },
        {
            label: 'Today Collected',
            hint: 'Payments you recorded today',
            value: summary.collectedToday,
            color: 'text-green-700',
            bg: 'bg-green-100',
        },
        {
            label: 'Today Overdue',
            hint: 'Overdue amount to chase today',
            value: summary.todayOverdueAmount ?? summary.todayOverdue ?? summary.overdueAmount,
            color: 'text-orange-700',
            bg: 'bg-orange-100',
        },
        {
            label: 'Total Overdue',
            hint: 'All overdue unpaid amount',
            value: summary.totalOverdue ?? summary.overdueAmount,
            color: 'text-red-700',
            bg: 'bg-red-100',
        },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Collector Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Your collection targets and today&apos;s progress</p>
                </div>
                <button
                    type="button"
                    onClick={loadDashboard}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                    <FiRefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {cards.map((card) => (
                    <div key={card.label} className="bg-white border rounded-xl p-4 shadow-sm">
                        <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
                            <FiBarChart2 className={`w-4 h-4 ${card.color}`} />
                        </div>
                        <p className="text-sm font-medium text-gray-600">{card.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{card.hint}</p>
                        <p className={`text-2xl font-bold mt-2 ${card.color}`}>
                            {formatMoney(card.value)}
                        </p>
                    </div>
                ))}
            </div>

            <VehicleFinanceCollectionsPage onPaymentSuccess={loadDashboard} />
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
