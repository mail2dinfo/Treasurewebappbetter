import React from 'react';
import { useHistory } from 'react-router-dom';
import { FiTrendingUp, FiUsers, FiDollarSign, FiCreditCard, FiBarChart, FiBriefcase } from 'react-icons/fi';

const PersonalLoanDashboard = () => {
    const history = useHistory();

    const handleNavigate = (path) => {
        history.push(path);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Personal Loan Dashboard</h1>
                    <p className="text-gray-600 mt-1">Overview of your personal loan business</p>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FiBriefcase className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <FiCreditCard className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Disbursed</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">₹0</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <FiTrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Collected</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">₹0</p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <FiDollarSign className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => handleNavigate('/personal-loan/user/company')}
                            className="flex items-center justify-center px-6 py-4 bg-custom-red hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                        >
                            <FiBriefcase className="w-5 h-5 mr-2" />
                            Manage Companies
                        </button>
                        <button
                            onClick={() => handleNavigate('/personal-loan/user/subscribers')}
                            className="flex items-center justify-center px-6 py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                        >
                            <FiUsers className="w-5 h-5 mr-2" />
                            Manage Subscribers
                        </button>
                        <button
                            onClick={() => handleNavigate('/personal-loan/user/loans')}
                            className="flex items-center justify-center px-6 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                        >
                            <FiCreditCard className="w-5 h-5 mr-2" />
                            Manage Loans
                        </button>
                        <button
                            onClick={() => handleNavigate('/personal-loan/user/ledger')}
                            className="flex items-center justify-center px-6 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                        >
                            <FiBarChart className="w-5 h-5 mr-2" />
                            View Ledger
                        </button>
                        <button
                            onClick={() => handleNavigate('/app-selection')}
                            className="flex items-center justify-center px-6 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                        >
                            <FiUsers className="w-5 h-5 mr-2" />
                            Back to Finance Hub
                        </button>
                    </div>
                </div>

                {/* Welcome Section */}
                <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                    <div className="max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-custom-red rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white text-4xl">💰</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Personal Loan App</h2>
                        <p className="text-gray-600 mb-6">
                            Get started by managing your companies and setting up your loan business.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => handleNavigate('/personal-loan/user/company')}
                                className="px-6 py-3 bg-custom-red hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Manage Companies
                            </button>
                            <button
                                onClick={() => handleNavigate('/personal-loan/user/subscribers')}
                                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Manage Subscribers
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalLoanDashboard;
