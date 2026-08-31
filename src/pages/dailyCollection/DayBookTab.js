import React, { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import Loading from '../../components/Loading';

const DayBookTab = ({ dayBook, fetchDayBook }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isLoading, setIsLoading] = useState(false);
    const prevDateRef = useRef(null);

    // Load day book when date changes
    useEffect(() => {
        // Only fetch if date actually changed
        if (prevDateRef.current !== selectedDate) {
            prevDateRef.current = selectedDate;
            setIsLoading(true);
            fetchDayBook(selectedDate).finally(() => {
                setIsLoading(false);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    // Initial load on mount - always fetch today's data by default
    useEffect(() => {
        // On mount, always fetch for the selected date (which defaults to today)
        setIsLoading(true);
        fetchDayBook(selectedDate).finally(() => {
            setIsLoading(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Listen for loan deletion events and refresh day book if affected
    useEffect(() => {
        const handleLoanDeleted = (event) => {
            const { affectedDates, cascadeFromDate } = event.detail;
            const selectedDateStr = selectedDate;
            
            // Check if current selected date is affected or is after the cascade date
            const isAffected = affectedDates?.includes(selectedDateStr) || 
                              (cascadeFromDate && selectedDateStr >= cascadeFromDate);
            
            if (isAffected) {
                console.log('🔄 Loan deleted - refreshing day book for', selectedDateStr);
                setIsLoading(true);
                // Force recalculate to ensure fresh data
                fetchDayBook(selectedDateStr, true).finally(() => {
                    setIsLoading(false);
                });
            }
        };

        window.addEventListener('loanDeleted', handleLoanDeleted);
        return () => {
            window.removeEventListener('loanDeleted', handleLoanDeleted);
        };
    }, [selectedDate, fetchDayBook]);

    const formatCurrency = (amount) => {
        return `₹${Number(amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };


    const handleRefresh = () => {
        setIsLoading(true);
        // Force recalculate by passing forceRecalculate flag
        fetchDayBook(selectedDate, true).then(() => {
            setIsLoading(false);
        }).catch(() => {
            setIsLoading(false);
        });
    };

    const handleDateChange = (e) => {
        setSelectedDate(e.target.value);
    };

    const navigateDate = (direction) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + direction);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            {/* Date Navigation */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigateDate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Previous Day"
                        >
                            <FiChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex items-center gap-2">
                            <FiCalendar className="w-5 h-5 text-gray-500" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {isToday && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                    Today
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => navigateDate(1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Next Day"
                            disabled={isToday}
                        >
                            <FiChevronRight className={`w-5 h-5 ${isToday ? 'text-gray-300' : 'text-gray-600'}`} />
                        </button>
                        <span className="text-sm text-gray-600">
                            {formatDate(selectedDate)}
                        </span>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && !dayBook && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                    <Loading />
                    <p className="text-gray-600">Loading day book data...</p>
                </div>
            )}

            {/* Balance Summary Card */}
            {dayBook && !isLoading && (
                <>
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Balance Summary</h3>
                            <span className="text-blue-100 text-sm">{formatDate(dayBook.date)}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-blue-100 text-xs mb-1 font-medium">Opening Balance</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(dayBook.opening_balance)}</p>
                                <p className="text-blue-200 text-xs mt-1">(Previous day's closing)</p>
                            </div>
                            <div>
                                <p className="text-blue-100 text-xs mb-1 font-medium">Total Received</p>
                                <p className="text-2xl font-bold text-green-200">{formatCurrency(dayBook.total_received)}</p>
                                <p className="text-blue-200 text-xs mt-1">{dayBook.collections_by_category?.length || 0} categories</p>
                            </div>
                            <div>
                                <p className="text-blue-100 text-xs mb-1 font-medium">Total Spent</p>
                                <p className="text-2xl font-bold text-red-200">{formatCurrency(Math.abs(dayBook.total_spent))}</p>
                                <p className="text-blue-200 text-xs mt-1">{dayBook.expenses_by_category?.length || 0} categories</p>
                            </div>
                            <div>
                                <p className="text-blue-100 text-xs mb-1 font-medium">Closing Balance</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(dayBook.closing_balance)}</p>
                                <p className="text-blue-200 text-xs mt-1">(Opening + Received - Spent)</p>
                            </div>
                        </div>
                    </div>

                    {/* Ledger Table - Day Book Format */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <span className="text-blue-600">📖</span>
                                Day Book - {formatDate(dayBook.date)}
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase">Narration</th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 uppercase">Credit</th>
                                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700 uppercase">Debit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {/* Opening Balance Row */}
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">Opening Balance</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">
                                            {formatCurrency(Math.max(0, dayBook.opening_balance))}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">
                                            {dayBook.opening_balance < 0 ? formatCurrency(Math.abs(dayBook.opening_balance)) : ''}
                                        </td>
                                    </tr>

                                    {/* Collections (Credits) */}
                                    {dayBook.collections_by_category && dayBook.collections_by_category.map((item, index) => {
                                        const narration = item.subcategory
                                            ? `${item.category} - ${item.subcategory}`
                                            : item.category || 'Unknown';
                                        return (
                                            <tr key={`collection-${index}`} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-900">{narration}</td>
                                                <td className="px-6 py-4 text-sm font-semibold text-green-600 text-right">
                                                    {formatCurrency(item.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-right"></td>
                                            </tr>
                                        );
                                    })}

                                    {/* Expenses (Debits) */}
                                    {dayBook.expenses_by_category && dayBook.expenses_by_category.map((item, index) => {
                                        const narration = item.subcategory
                                            ? `${item.category} - ${item.subcategory}`
                                            : item.category || 'Unknown';
                                        return (
                                            <tr key={`expense-${index}`} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-900">{narration}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 text-right"></td>
                                                <td className="px-6 py-4 text-sm font-semibold text-red-600 text-right">
                                                    {formatCurrency(Math.abs(item.amount))}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {/* Grand Total Row */}
                                    {(() => {
                                        const openingCredit = Math.max(0, dayBook.opening_balance);
                                        const openingDebit = Math.abs(Math.min(0, dayBook.opening_balance));
                                        const grandTotalCredit = openingCredit + (dayBook.total_received || 0);
                                        const grandTotalDebit = openingDebit + Math.abs(dayBook.total_spent || 0);

                                        return (
                                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                                <td className="px-6 py-4 text-sm text-gray-800">Grand total</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">
                                                    {formatCurrency(grandTotalCredit)}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-800 text-right">
                                                    {formatCurrency(grandTotalDebit)}
                                                </td>
                                            </tr>
                                        );
                                    })()}

                                    {/* Closing Balance Row */}
                                    <tr className="bg-blue-50 font-bold border-t-2 border-blue-300">
                                        <td className="px-6 py-4 text-sm text-gray-800">Closing Balance</td>
                                        <td className="px-6 py-4 text-sm font-bold text-blue-700 text-right">
                                            {dayBook.closing_balance >= 0 ? formatCurrency(dayBook.closing_balance) : ''}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-blue-700 text-right">
                                            {dayBook.closing_balance < 0 ? formatCurrency(Math.abs(dayBook.closing_balance)) : ''}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Empty State - Show when no data and not loading */}
            {!dayBook && !isLoading && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📖</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Day Book Data</h3>
                    <p className="text-gray-600 mb-6">
                        No transactions found for {formatDate(selectedDate)}
                    </p>
                </div>
            )}
        </div>
    );
};

export default DayBookTab;

