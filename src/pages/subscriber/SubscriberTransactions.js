import React, { useState, useEffect } from 'react';
import { useSubscriberContext } from '../../context/subscriber/SubscriberContext';

const SubscriberTransactions = () => {
    const {
        transactionDashboard,
        fetchTransactionDashboard,
        loading
    } = useSubscriberContext();

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Load transactions only once when component mounts
    useEffect(() => {
        const loadTransactions = async () => {
            try {
                await fetchTransactionDashboard(currentPage, pageSize);
            } catch (error) {
                console.error('Failed to load transactions:', error);
            }
        };

        loadTransactions();
    }, []); // Empty dependency array - only run once

    const handlePageChange = (page) => {
        setCurrentPage(page);
        // Load new page data
        fetchTransactionDashboard(page, pageSize);
    };

    const handlePageSizeChange = (size) => {
        setPageSize(size);
        setCurrentPage(1);
        // Load new page data
        fetchTransactionDashboard(1, size);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'SUCCESS':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'FAILED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold mb-2">💳 Transaction History</h1>
                                <p className="text-red-100 text-lg">
                                    View all your payment and receipt transactions
                                </p>
                            </div>
                            <div className="hidden md:block">
                                <div className="bg-white/20 rounded-full p-4">
                                    <div className="text-4xl">📊</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {transactionDashboard && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <span className="text-2xl">✅</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                                    <p className="text-2xl font-bold text-gray-900">{transactionDashboard.totalItems}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <span className="text-2xl">💰</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatAmount(transactionDashboard.transactions?.reduce((sum, t) => sum + t.payment_amount, 0) || 0)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-purple-500">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <span className="text-2xl">📈</span>
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {transactionDashboard.transactions?.filter(t => t.payment_status === 'SUCCESS').length || 0}/
                                        {transactionDashboard.transactions?.length || 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Controls Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-semibold text-gray-700">Show:</label>
                            <select
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                            >
                                <option value={5}>5 per page</option>
                                <option value={10}>10 per page</option>
                                <option value={20}>20 per page</option>
                                <option value={50}>50 per page</option>
                            </select>
                        </div>

                        {transactionDashboard && (
                            <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                                <span className="font-semibold text-gray-800">{transactionDashboard.totalItems}</span> total transactions
                            </div>
                        )}
                    </div>
                </div>

                {/* Transactions List */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                            <p className="mt-4 text-gray-600">Loading transactions...</p>
                        </div>
                    ) : transactionDashboard?.transactions?.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {transactionDashboard.transactions.map((transaction, index) => {
                                // Log transaction details for debugging
                                console.log('🔍 Transaction Details:', {
                                    index,
                                    payment_method: transaction.payment_method,
                                    payment_type: transaction.payment_type,
                                    arrow: transaction.arrow,
                                    fullTransaction: transaction
                                });

                                return (
                                    <div key={transaction.id || index} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0">
                                                    {/* Up Arrow (Green) for Money Came In, Down Arrow (Red) for Money Gone Out */}
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${transaction.arrow === 'UP'
                                                        ? 'bg-green-500'
                                                        : 'bg-red-500'
                                                        }`}>
                                                        <span className={`text-2xl font-bold text-white`}>
                                                            {transaction.arrow === 'UP' ? '↑' : '↓'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <p className="text-lg font-semibold text-gray-900 truncate">
                                                            {transaction.name || 'Transaction'}
                                                        </p>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.payment_status)}`}>
                                                            {transaction.payment_status}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
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
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <p className={`text-2xl font-bold ${transaction.arrow === 'UP' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {transaction.arrow === 'UP' ? '+' : '-'}{formatAmount(transaction.payment_amount)}
                                                    </p>
                                                    <p className="text-sm text-gray-500 capitalize">
                                                        {transaction.arrow === 'UP' ? 'Received' : 'Paid Out'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="text-6xl mb-4">💳</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No transactions found</h3>
                            <p className="text-gray-600">Your transaction history will appear here once you make payments.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {transactionDashboard && transactionDashboard.totalPages > 1 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            {/* Pagination Info */}
                            <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                                Showing <span className="font-semibold text-gray-800">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                                <span className="font-semibold text-gray-800">{Math.min(currentPage * pageSize, transactionDashboard.totalItems)}</span> of{' '}
                                <span className="font-semibold text-gray-800">{transactionDashboard.totalItems}</span> transactions
                            </div>

                            {/* Pagination Controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg'
                                        }`}
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                >
                                    ← Previous
                                </button>

                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, transactionDashboard.totalPages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum
                                                    ? 'bg-red-600 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                onClick={() => handlePageChange(pageNum)}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === transactionDashboard.totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg'
                                        }`}
                                    disabled={currentPage === transactionDashboard.totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubscriberTransactions;
