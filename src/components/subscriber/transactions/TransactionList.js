import React from 'react';

const TransactionList = ({ transactions, loading }) => {
    if (loading) {
        return (
            <div className="p-6">
                <div className="space-y-4">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="animate-pulse">
                            <div className="flex items-center space-x-4">
                                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-12 px-6">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No transactions found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                    Your transaction history will appear here when you make payments or receive receipts.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden md:grid md:grid-cols-5 bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-700">Type</div>
                <div className="text-sm font-medium text-gray-700">Method</div>
                <div className="text-sm font-medium text-gray-700">Amount</div>
                <div className="text-sm font-medium text-gray-700">Status</div>
                <div className="text-sm font-medium text-gray-700">Date</div>
            </div>

            {/* Transactions List */}
            <div className="divide-y divide-gray-200">
                {transactions.map((transaction, index) => (
                    <TransactionItem key={index} transaction={transaction} />
                ))}
            </div>
        </div>
    );
};

const TransactionItem = ({ transaction }) => {
    const {
        payment_method,
        payment_type,
        payment_amount,
        payment_status,
        created_at,
        arrow
    } = transaction;

    const getStatusConfig = (status) => {
        switch (status) {
            case 'SUCCESS':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-800',
                    icon: '✅'
                };
            case 'PENDING':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-800',
                    icon: '⏳'
                };
            case 'FAILED':
                return {
                    bg: 'bg-red-100',
                    text: 'text-red-800',
                    icon: '❌'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-800',
                    icon: '❓'
                };
        }
    };

    const getArrowIcon = (arrow) => {
        return arrow === 'UP' ? '⬆️' : '⬇️';
    };

    const getPaymentTypeLabel = (type) => {
        switch (type) {
            case 'MONTHLY_PAYMENT': return 'Monthly Payment';
            case 'AUCTION_PAYMENT': return 'Auction Payment';
            case 'ADVANCE_PAYMENT': return 'Advance Payment';
            default: return type;
        }
    };

    const getTransactionType = (arrow) => {
        return arrow === 'UP' ? 'Payment Made' : 'Receipt Received';
    };

    const statusConfig = getStatusConfig(payment_status);
    const isPayment = arrow === 'UP';

    return (
        <>
            {/* Desktop View */}
            <div className="hidden md:grid md:grid-cols-5 items-center px-6 py-4 hover:bg-gray-50 transition-colors">
                {/* Type */}
                <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isPayment ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                        {getArrowIcon(arrow)}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">
                            {getTransactionType(arrow)}
                        </div>
                        <div className="text-sm text-gray-500">
                            {getPaymentTypeLabel(payment_type)}
                        </div>
                    </div>
                </div>

                {/* Method */}
                <div className="text-gray-900">
                    {payment_method || 'N/A'}
                </div>

                {/* Amount */}
                <div className={`font-semibold ${isPayment ? 'text-red-600' : 'text-green-600'}`}>
                    {isPayment ? '-' : '+'}₹{payment_amount?.toLocaleString() || '0'}
                </div>

                {/* Status */}
                <div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        <span className="mr-1">{statusConfig.icon}</span>
                        {payment_status}
                    </span>
                </div>

                {/* Date */}
                <div className="text-sm text-gray-600">
                    <div>{new Date(created_at).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">
                        {new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden p-4 border-b border-gray-200">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isPayment ? 'bg-red-100' : 'bg-green-100'
                            }`}>
                            {getArrowIcon(arrow)}
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">
                                {getTransactionType(arrow)}
                            </div>
                            <div className="text-sm text-gray-500">
                                {getPaymentTypeLabel(payment_type)}
                            </div>
                        </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        <span className="mr-1">{statusConfig.icon}</span>
                        {payment_status}
                    </span>
                </div>

                <div className="flex justify-between items-center">
                    <div>
                        <div className={`text-lg font-semibold ${isPayment ? 'text-red-600' : 'text-green-600'}`}>
                            {isPayment ? '-' : '+'}₹{payment_amount?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-gray-500">
                            {payment_method || 'N/A'}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-600">
                            {new Date(created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                            {new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TransactionList;
