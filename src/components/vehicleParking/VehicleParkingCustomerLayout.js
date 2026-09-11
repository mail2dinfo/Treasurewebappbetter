import React, { useState } from 'react';
import { Switch, Route, Redirect, Link, useHistory } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FiLogOut } from 'react-icons/fi';
import MyTreasureBrand from '../MyTreasureBrand';
import AndroidAppNavButton from '../AndroidAppNavButton';
import VehicleParkingCustomerPage from '../../pages/vehicleParking/VehicleParkingCustomerPage';
import { useUserContext } from '../../context/user_context';

const VehicleParkingCustomerLayout = () => {
    const history = useHistory();
    const { user, logout } = useUserContext();
    const [menuOpen, setMenuOpen] = useState(false);
    const displayName = String(
        user?.results?.firstname || user?.results?.userDetail?.userName || 'User'
    ).trim() || 'User';
    const roleLabel = 'Subscriber';

    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
            <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
                    <MyTreasureBrand to="/app-selection" subtitle="Parking customer" inverse />
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden sm:block text-right px-2 border-l border-white/30">
                            <p className="text-sm font-semibold text-white truncate max-w-[10rem]">Hi {displayName}</p>
                            <p className="text-xs text-red-100">Role {roleLabel}</p>
                        </div>
                        <Link to="/app-selection" className="hidden sm:inline text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg px-2.5 py-1.5">Apps</Link>
                        <AndroidAppNavButton
                            className="hidden sm:flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10"
                            iconClassName="w-4 h-4"
                        />
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10"
                            aria-label="Logout"
                        >
                            <FiLogOut className="w-4 h-4" />
                            Logout
                        </button>
                        <div className="relative sm:hidden">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((v) => !v)}
                                className="w-9 h-9 rounded-full bg-white/20 text-white text-xs font-semibold"
                                aria-label={`${displayName}, ${roleLabel}`}
                            >
                                {displayName.charAt(0).toUpperCase()}
                            </button>
                            {menuOpen ? (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <p className="text-sm font-semibold text-gray-900">Hi {displayName}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">Role {roleLabel}</p>
                                    </div>
                                    <Link to="/app-selection" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                                        Apps
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center"
                                    >
                                        <FiLogOut className="w-4 h-4 mr-2" />
                                        Logout
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1">
                <Switch>
                    <Route path="/vehicle-parking/customer" exact>
                        <Redirect to="/vehicle-parking/customer/dashboard" />
                    </Route>
                    <Route path="/vehicle-parking/customer/dashboard" component={VehicleParkingCustomerPage} />
                    <Route path="/vehicle-parking/customer/bookings" component={VehicleParkingCustomerPage} />
                </Switch>
            </main>
            <footer className="bg-white/80 border-t border-gray-200 py-4">
                <p className="text-center text-sm text-gray-500">Vehicle Parking · MyTreasure</p>
            </footer>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default VehicleParkingCustomerLayout;
