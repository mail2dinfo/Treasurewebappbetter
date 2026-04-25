import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import { useUserContext } from '../../context/user_context';
import { SimpleBarChart, SimplePieChart, SimpleLineChart, MetricCard } from '../../components/dailyCollection/Charts';
import {
    FiTrendingUp,
    FiUsers,
    FiDollarSign,
    FiCreditCard,
    FiBarChart,
    FiBriefcase,
    FiRefreshCw,
    FiCalendar,
    FiAlertCircle,
    FiCheckCircle,
    FiClock,
    FiEye
} from 'react-icons/fi';

const PersonalLoanDashboard = () => {
    const history = useHistory();
    const { user } = useUserContext();
    const {
        companies,
        subscribers,
        loans,
        receipts,
        ledgerAccounts,
        fetchCompanies,
        fetchSubscribers,
        fetchLoans,
        fetchReceipts,
        fetchLedgerAccounts,
        isLoading
    } = usePersonalLoanContext();

    const [dashboardStats, setDashboardStats] = useState({
        totalCompanies: 0,
        totalSubscribers: 0,
        totalLoans: 0,
        activeLoans: 0,
        closedLoans: 0,
        foreclosedLoans: 0,
        totalDisbursed: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        totalOutstandingPrincipal: 0,
        totalOutstandingInterest: 0,
        totalReceipts: 0,
        totalLedgerAccounts: 0,
        loanStatusBreakdown: {},
        loanModeBreakdown: {},
        monthlyDisbursements: [],
        monthlyCollections: []
    });

    const [userImage, setUserImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Fetch user image
    useEffect(() => {
        const fetchImage = async () => {
            const imageUrl =
                user?.results?.userDetail?.user_image_s3_image ||
                user?.results?.user_image_s3_image ||
                user?.results?.userDetail?.userImage ||
                user?.results?.user_image;

            if (imageUrl) {
                try {
                    // Check if it's already a data URL or direct URL
                    if (imageUrl.startsWith('data:') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
                        setPreviewUrl(imageUrl);
                    } else {
                        // Try to fetch from S3 or other sources
                        const response = await fetch(imageUrl);
                        if (response.ok) {
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            setPreviewUrl(url);
                        } else {
                            setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
                        }
                    }
                } catch (error) {
                    console.error('Error loading image:', error);
                    setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
                }
            } else {
                setPreviewUrl('https://i.imgur.com/ndu6pfe.png');
            }
        };

        if (user) {
            fetchImage();
        }
    }, [user]);

    // Fetch all data on mount and refresh
    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                await Promise.all([
                    fetchCompanies(),
                    fetchSubscribers(),
                    fetchLoans(),
                    fetchReceipts(),
                    fetchLedgerAccounts()
                ]);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        };

        loadDashboardData();
    }, [refreshKey, fetchCompanies, fetchSubscribers, fetchLoans, fetchReceipts, fetchLedgerAccounts]);

    // Calculate statistics when data changes
    useEffect(() => {
        if (loans && receipts) {
            const activeLoans = loans.filter(loan => loan.status === 'ACTIVE');
            const closedLoans = loans.filter(loan => loan.status === 'CLOSED');
            const foreclosedLoans = loans.filter(loan => loan.status === 'FORECLOSED');

            // Calculate total disbursed
            const totalDisbursed = loans.reduce((sum, loan) => {
                return sum + (parseFloat(loan.principal_amount) || 0);
            }, 0);

            // Calculate total collected
            const totalCollected = receipts.reduce((sum, receipt) => {
                return sum + (parseFloat(receipt.received_amount) || 0);
            }, 0);

            // Calculate outstanding amounts
            const totalOutstandingPrincipal = loans.reduce((sum, loan) => {
                return sum + (parseFloat(loan.outstanding_principal) || 0);
            }, 0);

            const totalOutstandingInterest = loans.reduce((sum, loan) => {
                return sum + (parseFloat(loan.outstanding_interest) || 0);
            }, 0);

            const totalOutstanding = totalOutstandingPrincipal + totalOutstandingInterest;

            // Loan status breakdown
            const loanStatusBreakdown = {
                'Active': activeLoans.length,
                'Closed': closedLoans.length,
                'Foreclosed': foreclosedLoans.length
            };

            // Loan mode breakdown
            const loanModeBreakdown = {
                'Interest-Free': loans.filter(loan => loan.loan_mode === 'INTEREST_FREE').length,
                'Interest-Only': loans.filter(loan => loan.loan_mode === 'INTEREST_ONLY').length
            };

            // Monthly disbursements (last 6 months)
            const monthlyDisbursements = calculateMonthlyData(loans, 'disbursed_date', 'principal_amount', 6);
            
            // Monthly collections (last 6 months)
            const monthlyCollections = calculateMonthlyData(receipts, 'payment_date', 'received_amount', 6);

            setDashboardStats({
                totalCompanies: companies?.length || 0,
                totalSubscribers: subscribers?.length || 0,
                totalLoans: loans?.length || 0,
                activeLoans: activeLoans.length,
                closedLoans: closedLoans.length,
                foreclosedLoans: foreclosedLoans.length,
                totalDisbursed,
                totalCollected,
                totalOutstanding,
                totalOutstandingPrincipal,
                totalOutstandingInterest,
                totalReceipts: receipts?.length || 0,
                totalLedgerAccounts: ledgerAccounts?.length || 0,
                loanStatusBreakdown,
                loanModeBreakdown,
                monthlyDisbursements,
                monthlyCollections
            });
        }
    }, [companies, subscribers, loans, receipts, ledgerAccounts]);

    // Helper function to calculate monthly data
    const calculateMonthlyData = (data, dateField, amountField, months = 6) => {
        const now = new Date();
        const monthlyData = [];

        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
            
            const monthData = data.filter(item => {
                if (!item[dateField]) return false;
                const itemDate = new Date(item[dateField]);
                return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
            });

            const total = monthData.reduce((sum, item) => {
                return sum + (parseFloat(item[amountField]) || 0);
            }, 0);

            monthlyData.push({
                label: monthKey,
                value: total
            });
        }

        return monthlyData;
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleNavigate = (path) => {
        history.push(path);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // Get recent receipts (last 10)
    const recentReceipts = receipts
        ?.slice()
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        .slice(0, 10) || [];

    // Get recent loans (last 5)
    const recentLoans = loans
        ?.slice()
        .sort((a, b) => new Date(b.disbursed_date) - new Date(a.disbursed_date))
        .slice(0, 5) || [];

    const getUserName = () => {
        return (
            user?.results?.userDetail?.userName ||
            user?.results?.userDetail?.name ||
            user?.results?.userName ||
            user?.results?.name ||
            'User'
        );
    };

    const getUserRole = () => {
        return (
            user?.results?.userDetail?.role ||
            user?.results?.role ||
            'Member'
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header with User Info */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Personal Loan Dashboard</h1>
                        <p className="text-gray-600 mt-1">Overview of your personal loan business</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* User Info */}
                        <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                            <div className="relative">
                                <img
                                    src={previewUrl || 'https://i.imgur.com/ndu6pfe.png'}
                                    alt="User"
                                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                    onError={(e) => {
                                        e.target.src = 'https://i.imgur.com/ndu6pfe.png';
                                    }}
                                />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-semibold text-gray-900">{getUserName()}</p>
                                <p className="text-xs text-gray-500">{getUserRole()}</p>
                            </div>
                        </div>
                        {/* Refresh Button */}
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiRefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Companies"
                        value={dashboardStats.totalCompanies}
                        icon={FiBriefcase}
                        color="blue"
                    />
                    <MetricCard
                        title="Total Subscribers"
                        value={dashboardStats.totalSubscribers}
                        icon={FiUsers}
                        color="green"
                    />
                    <MetricCard
                        title="Active Loans"
                        value={dashboardStats.activeLoans}
                        icon={FiCreditCard}
                        color="purple"
                    />
                    <MetricCard
                        title="Total Loans"
                        value={dashboardStats.totalLoans}
                        icon={FiBarChart}
                        color="indigo"
                    />
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricCard
                        title="Total Disbursed"
                        value={dashboardStats.totalDisbursed}
                        icon={FiTrendingUp}
                        color="green"
                        format="currency"
                    />
                    <MetricCard
                        title="Total Collected"
                        value={dashboardStats.totalCollected}
                        icon={FiDollarSign}
                        color="blue"
                        format="currency"
                    />
                    <MetricCard
                        title="Outstanding Principal"
                        value={dashboardStats.totalOutstandingPrincipal}
                        icon={FiAlertCircle}
                        color="orange"
                        format="currency"
                    />
                    <MetricCard
                        title="Outstanding Interest"
                        value={dashboardStats.totalOutstandingInterest}
                        icon={FiClock}
                        color="red"
                        format="currency"
                    />
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Closed Loans</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.closedLoans}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <FiCheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Foreclosed Loans</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.foreclosedLoans}</p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-lg">
                                <FiAlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Receipts</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{dashboardStats.totalReceipts}</p>
                            </div>
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <FiDollarSign className="w-6 h-6 text-indigo-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Loan Status Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Status Breakdown</h3>
                        <div className="h-64">
                            <SimplePieChart data={dashboardStats.loanStatusBreakdown} />
                        </div>
                    </div>

                    {/* Loan Mode Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Mode Breakdown</h3>
                        <div className="h-64">
                            <SimplePieChart data={dashboardStats.loanModeBreakdown} />
                        </div>
                    </div>
                </div>

                {/* Trends Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Monthly Disbursements */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Disbursements (Last 6 Months)</h3>
                        <div className="h-64">
                            <SimpleLineChart data={dashboardStats.monthlyDisbursements} />
                        </div>
                    </div>

                    {/* Monthly Collections */}
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Collections (Last 6 Months)</h3>
                        <div className="h-64">
                            <SimpleLineChart data={dashboardStats.monthlyCollections} />
                        </div>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Recent Payments */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
                        </div>
                        <div className="overflow-y-auto max-h-96">
                            {recentReceipts.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {recentReceipts.map((receipt) => {
                                        const loan = loans?.find(l => l.id === receipt.loan_id);
                                        const subscriber = subscribers?.find(s => s.id === loan?.subscriber_id);
                                        return (
                                            <div key={receipt.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {subscriber?.name || 'Unknown Subscriber'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(receipt.payment_date).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-green-600">
                                                            {formatCurrency(receipt.received_amount)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {receipt.payment_mode || 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <FiDollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No recent payments</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Loans */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Loans</h3>
                        </div>
                        <div className="overflow-y-auto max-h-96">
                            {recentLoans.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {recentLoans.map((loan) => {
                                        const subscriber = subscribers?.find(s => s.id === loan.subscriber_id);
                                        return (
                                            <div key={loan.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {subscriber?.name || 'Unknown Subscriber'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(loan.disbursed_date).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {loan.loan_mode === 'INTEREST_FREE' ? 'Interest-Free' : 'Interest-Only'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-purple-600">
                                                            {formatCurrency(loan.principal_amount)}
                                                        </p>
                                                        <p className={`text-xs mt-1 ${
                                                            loan.status === 'ACTIVE' ? 'text-green-600' :
                                                            loan.status === 'CLOSED' ? 'text-blue-600' :
                                                            'text-red-600'
                                                        }`}>
                                                            {loan.status}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <FiCreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No recent loans</p>
                                </div>
                            )}
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
            </div>
        </div>
    );
};

export default PersonalLoanDashboard;
