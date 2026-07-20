import React from 'react';

const AdvanceModal = ({ isOpen, onClose, advanceData }) => {
    if (!isOpen) return null;

    const {
        total_collection_credit = 0,
        total_advance_credit = 0,
        total_credit = 0,
        total_debit = 0,
        total_balance = 0,
        advance_transactions = []
    } = advanceData || {};

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">💰</span>
                            <div>
                                <h3 className="text-2xl font-bold">Advance History</h3>
                                <p className="text-sm text-purple-100 mt-1">Complete breakdown of your advance transactions</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                            <p className="text-sm text-green-600 font-medium mb-1">Total Credit</p>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(total_credit)}</p>
                            <p className="text-xs text-green-600 mt-1">Collections + Advance</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                            <p className="text-sm text-red-600 font-medium mb-1">Total Debit</p>
                            <p className="text-2xl font-bold text-red-700">{formatCurrency(total_debit)}</p>
                            <p className="text-xs text-red-600 mt-1">Withdrawals</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                            <p className="text-sm text-blue-600 font-medium mb-1">Current Balance</p>
                            <p className="text-2xl font-bold text-blue-700">{formatCurrency(total_balance)}</p>
                            <p className="text-xs text-blue-600 mt-1">Available Advance</p>
                        </div>
                    </div>

                    {/* Breakdown Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-green-700 font-semibold">📊 Collections</span>
                                <span className="text-lg font-bold text-green-800">{formatCurrency(total_collection_credit)}</span>
                            </div>
                            <p className="text-xs text-green-600">Credit from collections</p>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-blue-700 font-semibold">💵 Advance</span>
                                <span className="text-lg font-bold text-blue-800">{formatCurrency(total_advance_credit)}</span>
                            </div>
                            <p className="text-xs text-blue-600">Credit from advance</p>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
                            <span>📜 Transaction History</span>
                            <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                                {advance_transactions.length} {advance_transactions.length === 1 ? 'transaction' : 'transactions'}
                            </span>
                        </h4>

                        {advance_transactions.length > 0 ? (
                            <div className="space-y-3">
                                {advance_transactions.map((tx, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-start gap-3 p-4 rounded-lg transition-all duration-200 hover:shadow-md ${tx.type === 'CREDIT'
                                            ? 'bg-green-50 border-l-4 border-green-500'
                                            : 'bg-red-50 border-l-4 border-red-500'
                                            }`}
                                    >
                                        <div className="flex-shrink-0 mt-1">
                                            {tx.type === 'CREDIT' ? (
                                                <span className="text-green-600 text-2xl">✅</span>
                                            ) : (
                                                <span className="text-red-600 text-2xl">⚡</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="font-semibold text-gray-700">
                                                    {formatDate(tx.date)}
                                                </span>
                                                <span
                                                    className={`font-bold text-lg ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                                                        }`}
                                                >
                                                    {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 text-sm mb-1 break-words">
                                                {tx.description || 'No description'}
                                            </p>
                                            {tx.sub_category && (
                                                <span className="inline-block text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                                                    {tx.sub_category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-4xl">📊</span>
                                </div>
                                <p className="text-gray-500 text-base">No transactions yet</p>
                                <p className="text-gray-400 text-sm mt-1">Transactions will appear here once recorded</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdvanceModal;

