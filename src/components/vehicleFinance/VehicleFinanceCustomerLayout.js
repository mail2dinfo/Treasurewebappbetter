import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MyTreasureBrand from '../MyTreasureBrand';

const VehicleFinanceCustomerDashboard = () => (
    <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Vehicle Finance Customer Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">My Loans</h2>
                    <p className="text-gray-600">View your active and closed vehicle loans</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment History</h2>
                    <p className="text-gray-600">Track your payment records</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Profile</h2>
                    <p className="text-gray-600">Manage your account information</p>
                </div>
            </div>
        </div>
    </div>
);

const VehicleFinanceCustomerLayout = () => (
    <div className="min-h-screen bg-gray-50">
        <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
                <MyTreasureBrand to="/app-selection" subtitle="Vehicle Finance Customer" inverse />
            </div>
        </header>
        <div className="min-h-[calc(100vh-128px)]">
            <Switch>
                <Route path="/vehicle-finance/customer" exact>
                    <Redirect to="/vehicle-finance/customer/dashboard" />
                </Route>
                <Route path="/vehicle-finance/customer/dashboard" component={VehicleFinanceCustomerDashboard} />
                <Route path="/vehicle-finance/customer/loans" component={VehicleFinanceCustomerDashboard} />
                <Route path="/vehicle-finance/customer/payments" component={VehicleFinanceCustomerDashboard} />
                <Route path="/vehicle-finance/customer/profile" component={VehicleFinanceCustomerDashboard} />
            </Switch>
        </div>
        <footer className="bg-white border-t border-gray-200 py-4">
            <p className="text-center text-sm text-gray-500">
                © Vehicle Finance Customer. Part of MyTreasure Finance Hub.
            </p>
        </footer>
        <ToastContainer position="top-right" autoClose={3000} />
    </div>
);

export default VehicleFinanceCustomerLayout;
