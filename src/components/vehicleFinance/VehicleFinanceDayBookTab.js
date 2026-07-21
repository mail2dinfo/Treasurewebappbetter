import React, { useEffect, useMemo, useState } from 'react';
import { FiCalendar, FiRefreshCw, FiX } from 'react-icons/fi';

const todayIso = () => new Date().toISOString().split('T')[0];

const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const formatDateLabel = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

/**
 * Account-wise Day Book: Opening / Receipts / Payments / Closing per ledger account + Total.
 * Click Receipts or Payments to drill into that day's ledger entries.
 */
const VehicleFinanceDayBookTab = ({ dayBook, fetchDayBook, isLoading }) => {
    const [selectedDate, setSelectedDate] = useState(dayBook?.date || todayIso());
    const [drillDown, setDrillDown] = useState(null); // 'Receipts' | 'Payments' | null
    const [accountFilter, setAccountFilter] = useState('');

    useEffect(() => {
        fetchDayBook(selectedDate);
        setDrillDown(null);
        setAccountFilter('');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const accounts = dayBook?.accounts || [];
    const summaryRows = dayBook?.summary_rows || [];
    const entries = dayBook?.entries || [];

    const drillEntries = useMemo(() => {
        if (!drillDown) return [];
        let list = entries;
        if (drillDown === 'Receipts') {
            list = entries.filter((e) => Number(e.credit || 0) > 0 || Number(e.amount || 0) > 0);
        } else if (drillDown === 'Payments') {
            list = entries.filter((e) => Number(e.debit || 0) > 0 || Number(e.amount || 0) < 0);
        }
        if (accountFilter) {
            list = list.filter((e) => String(e.account_id) === String(accountFilter));
        }
        return list;
    }, [drillDown, entries, accountFilter]);

    const handleRefresh = () => {
        fetchDayBook(selectedDate, true);
        setDrillDown(null);
    };

    const openDrillDown = (particular, accountId = '') => {
        if (particular !== 'Receipts' && particular !== 'Payments') return;
        setDrillDown(particular);
        setAccountFilter(accountId || '');
    };

    const rowTone = (particular) => {
        if (particular === 'Opening Balance') return 'bg-blue-50 font-semibold';
        if (particular === 'Closing Balance') return 'bg-amber-50 font-semibold';
        if (particular === 'Receipts') return 'hover:bg-green-50 cursor-pointer';
        if (particular === 'Payments') return 'hover:bg-red-50 cursor-pointer';
        return '';
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                        <FiCalendar className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900">Day Book Date</p>
                        <p className="text-xs text-gray-500">Opening rolls forward from prior closing</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {isLoading && !dayBook && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading day book...</p>
                </div>
            )}

            {dayBook && (
                <>
                    {/* Snapshot cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                            <p className="text-xs text-gray-500 font-medium">Opening</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">
                                {formatCurrency(dayBook.totals?.opening_balance ?? dayBook.opening_balance)}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                            <p className="text-xs text-gray-500 font-medium">Receipts</p>
                            <p className="text-lg font-bold text-green-700 mt-1">
                                {formatCurrency(dayBook.totals?.receipts ?? dayBook.total_received)}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
                            <p className="text-xs text-gray-500 font-medium">Payments</p>
                            <p className="text-lg font-bold text-red-700 mt-1">
                                {formatCurrency(dayBook.totals?.payments ?? dayBook.total_spent)}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-amber-500">
                            <p className="text-xs text-gray-500 font-medium">Closing</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">
                                {formatCurrency(dayBook.totals?.closing_balance ?? dayBook.closing_balance)}
                            </p>
                        </div>
                    </div>

                    {/* Account-wise matrix */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Day Book — {formatDateLabel(dayBook.date)}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Click Receipts or Payments to see how the day&apos;s closing was reached
                            </p>
                        </div>

                        {accounts.length === 0 ? (
                            <div className="p-12 text-center text-gray-600">
                                No ledger accounts found. Create an account to see Day Book columns.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[640px]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50">
                                                Particular
                                            </th>
                                            {accounts.map((account) => (
                                                <th
                                                    key={account.id}
                                                    className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase whitespace-nowrap"
                                                >
                                                    {account.name}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase bg-gray-100">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {summaryRows.map((row) => (
                                            <tr
                                                key={row.particular}
                                                className={rowTone(row.particular)}
                                                onClick={() => openDrillDown(row.particular)}
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-900 sticky left-0 bg-inherit">
                                                    {row.particular}
                                                    {(row.particular === 'Receipts' || row.particular === 'Payments') && (
                                                        <span className="ml-2 text-xs text-gray-400 font-normal">
                                                            (details)
                                                        </span>
                                                    )}
                                                </td>
                                                {accounts.map((account) => (
                                                    <td
                                                        key={account.id}
                                                        className="px-4 py-3 text-right text-sm text-gray-800 whitespace-nowrap"
                                                        onClick={(e) => {
                                                            if (
                                                                row.particular === 'Receipts' ||
                                                                row.particular === 'Payments'
                                                            ) {
                                                                e.stopPropagation();
                                                                openDrillDown(row.particular, account.id);
                                                            }
                                                        }}
                                                    >
                                                        {formatCurrency(row.amounts?.[account.id] ?? 0)}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 bg-gray-50 whitespace-nowrap">
                                                    {formatCurrency(row.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Drill-down panel */}
                    {drillDown && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                            <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {drillDown} on {formatDateLabel(dayBook.date)}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Ledger entries that make up this line
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <select
                                        value={accountFilter}
                                        onChange={(e) => setAccountFilter(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    >
                                        <option value="">All accounts</option>
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDrillDown(null);
                                            setAccountFilter('');
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        <FiX className="w-4 h-4" />
                                        Close
                                    </button>
                                </div>
                            </div>

                            {drillEntries.length === 0 ? (
                                <div className="p-10 text-center text-gray-600">
                                    No {drillDown.toLowerCase()} for this date
                                    {accountFilter ? ' on the selected account' : ''}.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                    Account
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                    Category
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                                    Description
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                                    CR
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                                                    DB
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {drillEntries.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {entry.account_name}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">
                                                        {entry.category || '-'}
                                                        {entry.subcategory ? ` / ${entry.subcategory}` : ''}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">
                                                        {entry.description || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-green-700 font-medium">
                                                        {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-red-700 font-medium">
                                                        {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {!dayBook && !isLoading && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Day Book Data</h3>
                    <p className="text-gray-600 mb-6">Pick a date and refresh to load the day book.</p>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <FiRefreshCw className="w-5 h-5" />
                        Load Day Book
                    </button>
                </div>
            )}
        </div>
    );
};

export default VehicleFinanceDayBookTab;
