import React from 'react';
import { useHistory } from 'react-router-dom';
import { Plus, Wallet, Users } from 'lucide-react';
import { getPersonalLoanMenuItems, PL_BASE_PATH } from './personalLoanMenuItems';

const PersonalLoanHighlights = ({ stats, basePath = PL_BASE_PATH }) => {
    const history = useHistory();
    const menuItems = getPersonalLoanMenuItems(basePath);

    const formatCurrency = (value) =>
        `₹${parseFloat(value || 0).toLocaleString('en-IN')}`;

    const collectionRate =
        stats.totalDisbursed > 0
            ? Math.round((stats.totalCollected / stats.totalDisbursed) * 100)
            : 0;

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg relative">
            <div className="absolute -top-4 left-6 bg-custom-red text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                Dashboard Highlights
            </div>

            <div className="p-6 pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="text-center">
                        <div className="w-28 h-28 mx-auto bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl flex flex-col items-center justify-center mb-3 shadow-sm">
                            <span className="text-2xl font-bold text-gray-800">{stats.activeLoans || 0}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">Active Loans</p>
                    </div>
                    <div className="text-center">
                        <div className="w-28 h-28 mx-auto bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl flex flex-col items-center justify-center mb-3 shadow-sm">
                            <span className="text-2xl font-bold text-gray-800">{stats.totalSubscribers || 0}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">Subscribers</p>
                    </div>
                    <div className="text-center">
                        <div className="w-28 h-28 mx-auto bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl flex flex-col items-center justify-center mb-3 shadow-sm">
                            <span className="text-lg font-bold text-indigo-700 px-2 text-center leading-tight">
                                {formatCurrency(stats.totalDisbursed)}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">Disbursed</p>
                    </div>
                    <div className="text-center">
                        <div className="w-28 h-28 mx-auto bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-2xl flex flex-col items-center justify-center mb-3 shadow-sm">
                            <span className="text-lg font-bold text-rose-700 px-2 text-center leading-tight">
                                {formatCurrency(stats.totalOutstanding)}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-700">Outstanding</p>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Financial Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                                {formatCurrency(stats.totalDisbursed)}
                            </div>
                            <div className="text-sm text-gray-600">Total Disbursed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(stats.totalCollected)}
                            </div>
                            <div className="text-sm text-gray-600">Total Collected</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(stats.totalOutstanding)}
                            </div>
                            <div className="text-sm text-gray-600">
                                Outstanding · {collectionRate}% collected
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Modules</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => history.push(item.path)}
                                className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-custom-red hover:shadow-md transition-all text-center"
                            >
                                <span className="text-2xl mb-2">{item.icon}</span>
                                <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                                <span className="text-xs text-gray-500 mt-1">{item.description}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        type="button"
                        className="bg-custom-red text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md flex items-center justify-center gap-2"
                        onClick={() => history.push(`${basePath}/loans`)}
                    >
                        <Plus size={16} />
                        Disburse Loan
                    </button>
                    <button
                        type="button"
                        className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md flex items-center justify-center gap-2"
                        onClick={() => history.push(`${basePath}/ledger`)}
                    >
                        <Wallet size={16} />
                        View Ledger
                    </button>
                    <button
                        type="button"
                        className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center gap-2"
                        onClick={() => history.push(`${basePath}/subscribers`)}
                    >
                        <Users size={16} />
                        Subscribers
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PersonalLoanHighlights;
