import React from 'react';
import { useHistory } from 'react-router-dom';
import {
    Users,
    UserPlus,
    CreditCard,
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Plus,
} from 'lucide-react';
import { getVehicleFinanceMenuItems } from './vehicleFinanceMenuItems';
import { useVfPermission } from './useVfPermission';

const VehicleFinanceHighlights = ({ stats, basePath }) => {
    const history = useHistory();
    const { canAccess, canAccessModule } = useVfPermission();
    // Module tile needs Dashboard Module View + content View (e.g. Loans → View Loans).
    const menuItems = getVehicleFinanceMenuItems(basePath).filter((item) => {
        if (!item.moduleGate) return false;
        return canAccessModule(item.moduleGate);
    });

    const formatCurrency = (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN')}`;

    const canOpenLoans = canAccessModule('loans');
    const canOpenSubscribers = canAccessModule('subscribers');
    const canOpenLedger = canAccessModule('ledger');
    const canOpenCollections = canAccessModule('collections');
    const canOpenReports = canAccessModule('reports');

    const goToLoans = () => { if (canOpenLoans) history.push(`${basePath}/loans`); };
    const goToSubscribers = () => { if (canOpenSubscribers) history.push(`${basePath}/subscribers`); };
    const goToLedger = () => { if (canOpenLedger) history.push(`${basePath}/ledger`); };
    const goToCollections = () => { if (canOpenCollections) history.push(`${basePath}/collections`); };
    const goToReports = () => { if (canOpenReports) history.push(`${basePath}/reports`); };

    const collectionRate =
        stats.totalDisbursed > 0
            ? Math.round((stats.totalCollected / stats.totalDisbursed) * 100)
            : 0;

    const showActiveLoans = canAccess('vf_dashboard_active_loans');
    const showSubscribers = canAccess('vf_dashboard_subscribers');
    const canAddSubscriber = canAccess('vf_subscriber_add');
    const showDisbursed = canAccess('vf_dashboard_disbursed');
    const showCollected = canAccess('vf_dashboard_collected');
    const showOutstanding = canAccess('vf_dashboard_outstanding');
    const showFinanceSummary = canAccess('vf_dashboard_finance_summary');

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg relative">
            <div className="absolute -top-4 left-6 bg-custom-red text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                Dashboard Highlights
            </div>

            <div className="p-6 pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    {showActiveLoans && (
                        <div className="text-center">
                            <div
                                className="relative w-32 h-32 mx-auto bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl flex flex-col items-center justify-center mb-3 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 shadow-sm cursor-pointer"
                                onClick={goToLoans}
                                onKeyDown={(e) => e.key === 'Enter' && goToLoans()}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <CreditCard size={20} className="text-blue-600" />
                                    <span className="text-2xl font-bold text-gray-800">{stats.activeLoans}</span>
                                </div>
                                <button
                                    type="button"
                                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200 shadow-lg"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        goToLoans();
                                    }}
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                            <p className="text-sm font-medium text-gray-700">Active Loans</p>
                        </div>
                    )}

                    {showSubscribers && (
                        <div className="text-center">
                            <div
                                className="relative w-32 h-32 mx-auto bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl flex flex-col items-center justify-center mb-3 hover:from-purple-100 hover:to-purple-200 transition-all duration-200 shadow-sm cursor-pointer"
                                onClick={goToSubscribers}
                                onKeyDown={(e) => e.key === 'Enter' && goToSubscribers()}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <UserPlus size={20} className="text-purple-600" />
                                    <span className="text-2xl font-bold text-gray-800">{stats.totalSubscribers}</span>
                                </div>
                                {canAddSubscriber && (
                                    <button
                                        type="button"
                                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200 shadow-lg"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            goToSubscribers();
                                        }}
                                    >
                                        <Plus size={16} />
                                    </button>
                                )}
                            </div>
                            <p className="text-sm font-medium text-gray-700">Subscribers</p>
                        </div>
                    )}

                    {showDisbursed && (
                        <div
                            className="text-center cursor-pointer"
                            onClick={goToLoans}
                            onKeyDown={(e) => e.key === 'Enter' && goToLoans()}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-2xl flex flex-col items-center justify-center mb-3 hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 shadow-sm px-2">
                                <div className="flex items-center gap-1 mb-1">
                                    <Wallet size={18} className="text-indigo-600 shrink-0" />
                                    <span className="text-sm font-bold text-gray-800 leading-tight">
                                        {formatCurrency(stats.totalDisbursed)}
                                    </span>
                                </div>
                                <button type="button" className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200 shadow-lg">
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                            <p className="text-sm font-medium text-gray-700">Disbursed</p>
                        </div>
                    )}

                    {showCollected && (
                        <div
                            className="text-center cursor-pointer"
                            onClick={goToCollections}
                            onKeyDown={(e) => e.key === 'Enter' && goToCollections()}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-2xl flex flex-col items-center justify-center mb-3 hover:from-green-100 hover:to-green-200 transition-all duration-200 shadow-sm px-2">
                                <div className="flex items-center gap-1 mb-1">
                                    <TrendingUp size={18} className="text-green-600 shrink-0" />
                                    <span className="text-sm font-bold text-gray-800 leading-tight">
                                        {formatCurrency(stats.totalCollected)}
                                    </span>
                                </div>
                                <button type="button" className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200 shadow-lg">
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                            <p className="text-sm font-medium text-gray-700">Collected</p>
                        </div>
                    )}

                    {showOutstanding && (
                        <div
                            className="text-center cursor-pointer"
                            onClick={goToReports}
                            onKeyDown={(e) => e.key === 'Enter' && goToReports()}
                            role="button"
                            tabIndex={0}
                        >
                            <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-2xl flex flex-col items-center justify-center mb-3 hover:from-red-100 hover:to-red-200 transition-all duration-200 shadow-sm px-2">
                                <div className="flex items-center gap-1 mb-1">
                                    <TrendingDown size={18} className="text-red-600 shrink-0" />
                                    <span className="text-sm font-bold text-gray-800 leading-tight">
                                        {formatCurrency(stats.totalOutstanding)}
                                    </span>
                                </div>
                                <button type="button" className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors duration-200 shadow-lg">
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                            <p className="text-sm font-medium text-gray-700">Outstanding</p>
                        </div>
                    )}
                </div>

                {showFinanceSummary && (
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
                )}

                {menuItems.length > 0 && (
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
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {canOpenLoans && canAccess('vf_loan_disburse') && (
                        <button
                            type="button"
                            className="bg-custom-red text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md flex items-center justify-center gap-2"
                            onClick={goToLoans}
                        >
                            <Plus size={16} />
                            Disburse Loan
                        </button>
                    )}
                    {canOpenLedger && (
                        <button
                            type="button"
                            className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-md flex items-center justify-center gap-2"
                            onClick={goToLedger}
                        >
                            <Wallet size={16} />
                            View Ledger
                        </button>
                    )}
                    {canOpenCollections && (
                        <button
                            type="button"
                            className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md flex items-center justify-center gap-2"
                            onClick={goToCollections}
                        >
                            <Users size={16} />
                            Collections
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VehicleFinanceHighlights;
