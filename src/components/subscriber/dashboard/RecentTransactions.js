import React from 'react';
import { useHistory } from 'react-router-dom';

const RecentTransactions = ({ transactions, loading }) => {
    const history = useHistory();

    const handleViewAll = () => {
        history.push('/chit-fund/subscriber/transactions');
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                        <div className="flex items-center space-x-4 p-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="w-20 h-8 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No recent transactions</h3>
                <p className="text-gray-600 mb-6">Your transaction history will appear here.</p>
                <button
                    onClick={handleViewAll}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                    View All Transactions
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <button
                    onClick={handleViewAll}
                    className="text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                >
                    View All →
                </button>
            </div>

            <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction, index) => (
                    <div key={transaction.id || index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-shrink-0">
                            {/* Up Arrow (Green) for Money Came In, Down Arrow (Red) for Money Gone Out */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.arrow === 'UP'
                                ? 'bg-green-500'
                                : 'bg-red-500'
                                }`}>
                                <span className={`text-sm font-bold text-white`}>
                                    {transaction.arrow === 'UP' ? '↑' : '↓'}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                    {transaction.name || 'Transaction'}
                                </p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${transaction.payment_status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {transaction.payment_status}
                                </span>
                            </div>
                            <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                                <span className="flex items-center">
                                    <span className="mr-1">📅</span>
                                    {formatDate(transaction.created_at)}
                                </span>
                                <span className="flex items-center">
                                    <span className="mr-1">🏷️</span>
                                    {transaction.payment_type}
                                </span>
                                {transaction.group_name && (
                                    <span className="flex items-center">
                                        <span className="mr-1">👥</span>
                                        {transaction.group_name}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="text-right">
                                <p className={`text-sm font-bold ${transaction.arrow === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                                    {transaction.arrow === 'UP' ? '+' : '-'}{formatAmount(transaction.payment_amount)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentTransactions;
