import React, { useState, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSubscriberContext } from '../../../context/subscriber/SubscriberContext';
import { buildChitUserPaySheet, copyText } from '../../../utils/phonePePay';

const CircleContentDisplay = ({ selectedCircle, groupDetails, auctionStatus, groupAccountId }) => {

    const { user } = useSubscriberContext();
    const {
        groupTransactionInfo,
        transactionInfo,
        outstandingAdvanceTransactionInfo,
    } = groupDetails;

    // State for sorting
    const [sortConfig, setSortConfig] = useState({ key: 'sno', direction: 'asc' });
    const [paySheet, setPaySheet] = useState(null);
    const [payCopied, setPayCopied] = useState(false);
    const paySheetLockRef = useRef(false);

    const openPaySheet = (amount, note) => {
        paySheetLockRef.current = true;
        setPayCopied(false);
        setPaySheet(buildChitUserPaySheet(groupDetails, user, amount, note));
        window.setTimeout(() => {
            paySheetLockRef.current = false;
        }, 700);
    };

    const closePaySheet = () => {
        if (paySheetLockRef.current) return;
        setPaySheet(null);
    };

    // Function to handle column header click for sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Sort icon component
    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) {
            return <span className="ml-1 text-gray-400">⇅</span>;
        }
        return sortConfig.direction === 'asc' ?
            <span className="ml-1 text-red-600">▲</span> :
            <span className="ml-1 text-red-600">▼</span>;
    };

    // Memoized sorted group transactions
    const sortedGroupTransactions = useMemo(() => {
        if (!groupTransactionInfo || groupTransactionInfo.length === 0) {
            return [];
        }

        const sorted = [...groupTransactionInfo].sort((a, b) => {
            let aValue, bValue;

            switch (sortConfig.key) {
                case 'sno':
                    aValue = a.sno || 0;
                    bValue = b.sno || 0;
                    break;
                case 'date':
                    aValue = new Date(a.date).getTime();
                    bValue = new Date(b.date).getTime();
                    break;
                case 'auctionAmount':
                    aValue = a.auctionAmount || 0;
                    bValue = b.auctionAmount || 0;
                    break;
                case 'commision':
                    aValue = a.commision || 0;
                    bValue = b.commision || 0;
                    break;
                case 'reserve':
                    aValue = a.reserve || 0;
                    bValue = b.reserve || 0;
                    break;
                case 'customerDue':
                    aValue = a.customerDue || 0;
                    bValue = b.customerDue || 0;
                    break;
                case 'prizeMoney':
                    aValue = a.prizeMoney || 0;
                    bValue = b.prizeMoney || 0;
                    break;
                case 'auctionStatus':
                    aValue = a.auctionStatus || '';
                    bValue = b.auctionStatus || '';
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return sorted;
    }, [groupTransactionInfo, sortConfig]);




    const renderContent = () => {
        const isFlexible = String(groupDetails?.type || '').toUpperCase() === 'FLEXIBLE';
        if (isFlexible && (selectedCircle === 'groups' || selectedCircle === 'due')) {
            return renderFlexibleDues(selectedCircle === 'due' ? 'Your dues' : 'Due schedule');
        }
        switch (selectedCircle) {
            case 'groups':
                return renderGroupAccounts();
            case 'due':
                return renderDueDetails();
            case 'auction':
                return renderAuctionDetails();
            case 'credit':
                return renderCreditDetails();
            default:
                return renderGroupAccounts(); // Default to Group Accounts
        }
    };

    const renderFlexibleDues = (title) => {
        const dueData = transactionInfo || groupDetails?.transactionInfo || [];
        const rows = getDueBreakdowns(dueData);

        if (!rows.length) {
            return (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
                    <div className="text-center text-gray-500 py-8">
                        <p>No dues yet</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4">
                    <h3 className="text-xl font-bold text-center">{title}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Due number</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Due month</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Total</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Paid</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Due</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={`${row.dueNumber}-${row.auctiondate}`} className="border-t border-gray-100">
                                    <td className="px-4 py-3 font-semibold">{row.dueNumber || '—'}</td>
                                    <td className="px-4 py-3">
                                        {row.auctiondate ? new Date(row.auctiondate).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-blue-700">{formatMoney(row.total)}</td>
                                    <td className="px-4 py-3 font-bold text-green-700">{formatMoney(row.paid)}</td>
                                    <td className="px-4 py-3 font-bold text-red-700">{formatMoney(row.due)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            isDuePaid(row) ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                        }`}>
                                            {isDuePaid(row) ? 'Paid' : 'Due'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderGroupAccounts = () => {
        if (!sortedGroupTransactions || sortedGroupTransactions.length === 0) {
            return (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Group Accounts</h3>
                    <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">📊</div>
                        <p>No group accounts data available</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold">Group Accounts (Click column headers to sort)</h3>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort('sno')}
                                >
                                    <div className="flex items-center">
                                        S.No
                                        <SortIcon columnKey="sno" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort('date')}
                                >
                                    <div className="flex items-center">
                                        Date
                                        <SortIcon columnKey="date" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort('auctionAmount')}
                                >
                                    <div className="flex items-center">
                                        Auction Amount
                                        <SortIcon columnKey="auctionAmount" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort('commision')}
                                >
                                    <div className="flex items-center">
                                        Commission
                                        <SortIcon columnKey="commision" />
                                    </div>
                                </th>
                                {groupDetails?.type === 'ACCUMULATIVE' && (
                                    <th
                                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                        onClick={() => handleSort('reserve')}
                                    >
                                        <div className="flex items-center">
                                            Reserve
                                            <SortIcon columnKey="reserve" />
                                        </div>
                                    </th>
                                )}
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort('customerDue')}
                                >
                                    <div className="flex items-center">
                                        Due
                                        <SortIcon columnKey="customerDue" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort('prizeMoney')}
                                >
                                    <div className="flex items-center">
                                        Prize Money
                                        <SortIcon columnKey="prizeMoney" />
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                                    onClick={() => handleSort('auctionStatus')}
                                >
                                    <div className="flex items-center">
                                        Status
                                        <SortIcon columnKey="auctionStatus" />
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedGroupTransactions.map((transaction, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                            #{transaction.sno}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        ₹{transaction.auctionAmount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        ₹{transaction.commision}
                                    </td>
                                    {groupDetails?.type === 'ACCUMULATIVE' && (
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            ₹{transaction.reserve}
                                        </td>
                                    )}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        ₹{transaction.customerDue}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">
                                        ₹{(transaction.prizeMoney || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.auctionStatus === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {transaction.auctionStatus === 'completed' ? '✅ Completed' : '⏳ Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View - Compact */}
                <div className="md:hidden p-4 space-y-4">
                    {sortedGroupTransactions.map((transaction, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        #{transaction.sno}
                                    </span>
                                </div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${transaction.auctionStatus === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {transaction.auctionStatus === 'completed' ? '✅ Completed' : '⏳ Pending'}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600 font-medium">Date:</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {new Date(transaction.date).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600 font-medium">Auction Amount:</span>
                                    <span className="text-base font-bold text-red-600">
                                        ₹{transaction.auctionAmount.toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600 font-medium">Commission:</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        ₹{transaction.commision}
                                    </span>
                                </div>

                                {groupDetails?.type === 'ACCUMULATIVE' && (
                                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                        <span className="text-sm text-gray-600 font-medium">Reserve:</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            ₹{transaction.reserve}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600 font-medium">Prize Money:</span>
                                    <span className="text-base font-bold text-green-600">
                                        ₹{(transaction.prizeMoney || 0).toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-3">
                                    <span className="text-sm text-gray-700 font-bold">Total Due:</span>
                                    <span className="text-lg font-extrabold text-blue-600">
                                        ₹{transaction.customerDue}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const formatDueDate = (value) => {
        if (!value) return 'N/A';
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
    };

    const formatMoney = (value) =>
        `₹${Number(value || 0).toLocaleString('en-IN')}`;

    const getDueBreakdowns = (dueData = []) => {
        const byKey = {};
        dueData.forEach((row, index) => {
            const key = String(row.dueNumber ?? row.auctiondate ?? index);
            if (!byKey[key]) {
                byKey[key] = {
                    dueNumber: row.dueNumber || index + 1,
                    auctiondate: row.auctiondate,
                    transacted_date: row.transacted_date || row.transactedDate,
                    date: row.date || row.createdAt,
                    total: 0,
                    paid: 0,
                    due: 0,
                };
            }
            const amount = Number(
                row.amount || row.receivableAmount || row.payment_amount || row.customerDue || 0
            );
            const status = String(row.status || '');
            if (status === 'Success' || status === 'Paid') {
                byKey[key].paid += amount;
                if (row.transacted_date || row.transactedDate) {
                    byKey[key].transacted_date = row.transacted_date || row.transactedDate;
                }
                if (row.date || row.createdAt) {
                    byKey[key].date = row.date || row.createdAt;
                }
            } else {
                byKey[key].due += amount;
            }
            byKey[key].total = byKey[key].paid + byKey[key].due;
        });
        return Object.values(byKey).sort(
            (a, b) => Number(a.dueNumber || 0) - Number(b.dueNumber || 0)
        );
    };

    const isDuePaid = (row) => Number(row.due || 0) <= 0;

    const PayDueButton = ({ className = '', amount = 0, note = '' }) => (
        <button
            type="button"
            onClick={() => openPaySheet(amount, note)}
            className={`inline-flex items-center justify-center rounded-md bg-red-600 text-white text-sm font-bold px-4 py-2 shadow ${className}`}
        >
            Pay
        </button>
    );

    const renderDueDetails = () => {
        const dueData = transactionInfo || groupDetails?.transactionInfo || groupDetails?.dueInfo || groupDetails?.receivableInfo || [];

        const dueRows = getDueBreakdowns(dueData);

        if (!dueRows.length) {
            return (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Due Details</h3>
                    <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">💰</div>
                        <p>No due details available</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold">Due Details</h3>
                </div>

                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auction Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transacted Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {dueRows.map((row) => (
                                <tr key={row.dueNumber} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                            #{row.dueNumber}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {formatDueDate(row.auctiondate)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {formatDueDate(row.transacted_date)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {formatDueDate(row.date)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-700">
                                        {formatMoney(row.total)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-700">
                                        {formatMoney(row.paid)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-700">
                                        {formatMoney(row.due)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            isDuePaid(row) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {isDuePaid(row) ? '✅ Paid' : '⏳ Due'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {!isDuePaid(row) ? (
                                            <PayDueButton
                                                amount={row.due}
                                                note={`Due #${row.dueNumber}`}
                                            />
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden p-3 space-y-3">
                    {dueRows.map((row) => (
                        <div key={row.dueNumber} className="bg-white rounded-lg p-3 border border-gray-200 shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                    #{row.dueNumber}
                                </span>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                    isDuePaid(row) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {isDuePaid(row) ? '✅ Paid' : '⏳ Due'}
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600 font-medium">Auction Date:</span>
                                    <span className="text-sm font-bold text-gray-900">{formatDueDate(row.auctiondate)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600 font-medium">Transacted Date:</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {formatDueDate(row.transacted_date)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600 font-medium">Created At:</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {formatDueDate(row.date)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                                        <p className="text-[10px] text-blue-600 font-medium uppercase">Total</p>
                                        <p className="text-sm font-bold text-blue-700">{formatMoney(row.total)}</p>
                                    </div>
                                    <div className="text-center p-2 bg-green-50 rounded-lg">
                                        <p className="text-[10px] text-green-600 font-medium uppercase">Paid</p>
                                        <p className="text-sm font-bold text-green-700">{formatMoney(row.paid)}</p>
                                    </div>
                                    <div className="text-center p-2 bg-red-50 rounded-lg">
                                        <p className="text-[10px] text-red-600 font-medium uppercase">Due</p>
                                        <p className="text-sm font-bold text-red-700">{formatMoney(row.due)}</p>
                                    </div>
                                </div>
                                {!isDuePaid(row) ? (
                                    <PayDueButton
                                        className="w-full mt-1"
                                        amount={row.due}
                                        note={`Due #${row.dueNumber}`}
                                    />
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderAuctionDetails = () => {
        const isAuctionOpen = auctionStatus === 'OPEN';

        // If auction is closed, show simple closed message
        if (!isAuctionOpen) {
            return (
                <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 border border-gray-100">
                    <div className="text-center">
                        <div className="text-4xl sm:text-5xl mb-4">🔴</div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-4">Auction is Closed</h3>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
                            This auction is currently closed. No new bids can be placed at this time.
                        </p>
                    </div>
                </div>
            );
        }

        // If auction is open, show auction status and history
        return (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 sm:p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl sm:text-2xl font-bold">Auction Details</h3>
                        <div className="px-3 py-1 rounded-full text-xs font-bold bg-green-500">
                            🟢 LIVE AUCTION
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Auction Status Info */}
                    <div className="mb-6 sm:mb-8 text-center">
                        <div className="text-4xl sm:text-5xl mb-4">🟢</div>
                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-4">Auction is Live!</h3>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 max-w-3xl mx-auto">
                            Click the green auction circle above to participate in the live auction and place your bids
                        </p>
                        <div className="bg-green-100 border border-green-300 rounded-lg p-3 max-w-2xl mx-auto">
                            <p className="text-xs text-green-800 font-semibold">
                                Debug: Status = {auctionStatus || 'undefined'}
                            </p>
                        </div>
                    </div>

                    {/* Auction History */}
                    {sortedGroupTransactions && sortedGroupTransactions.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-6 text-center">Auction History</h4>
                            {sortedGroupTransactions.map((transaction, index) => (
                                <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 sm:p-6 border-l-4 border-green-500 shadow-md">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                                        <div>
                                            <div className="text-xs sm:text-sm text-gray-500">Date</div>
                                            <div className="text-sm sm:text-base font-semibold text-gray-900">
                                                {new Date(transaction.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm text-gray-500">Amount</div>
                                            <div className="text-sm sm:text-base font-semibold text-gray-900">
                                                ₹{transaction.auctionAmount?.toLocaleString() || '0'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm text-gray-500">Commission</div>
                                            <div className="text-sm sm:text-base font-semibold text-gray-900">
                                                ₹{transaction.commision || '0'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm text-gray-500">Status</div>
                                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.auctionStatus === 'completed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {transaction.auctionStatus === 'completed' ? '✅ Completed' : '⏳ Pending'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Auction Status Info */}
                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-green-600">ℹ️</span>
                            <span className="text-sm sm:text-base font-medium text-green-800">Auction Status</span>
                        </div>
                        <p className="text-xs sm:text-sm text-green-700">
                            This auction is currently open. You can participate by clicking "Join Live Auction".
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const renderCreditDetails = () => {
        // Comprehensive logging for debugging
        console.log('🔍 ===== CREDIT DETAILS DEBUGGING =====');
        console.log('🔍 Full outstandingAdvanceTransactionInfo array:', outstandingAdvanceTransactionInfo);
        console.log('🔍 Array length:', outstandingAdvanceTransactionInfo?.length);

        if (outstandingAdvanceTransactionInfo && outstandingAdvanceTransactionInfo.length > 0) {
            console.log('🔍 First transaction sample:', outstandingAdvanceTransactionInfo[0]);
        }

        // Calculate total credit amount dynamically
        const calculateTotalCredit = () => {
            if (!outstandingAdvanceTransactionInfo || outstandingAdvanceTransactionInfo.length === 0) {
                return 0;
            }

            const totalCredit = outstandingAdvanceTransactionInfo.reduce((sum, transaction) => {
                const amount = parseFloat(transaction.amount) || 0;
                return sum + amount;
            }, 0);

            return totalCredit;
        };

        const totalCreditAmount = calculateTotalCredit();

        if (!outstandingAdvanceTransactionInfo || outstandingAdvanceTransactionInfo.length === 0) {
            return (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Credit Details</h3>
                    <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">📈</div>
                        <p>No credit details available</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                        <h3 className="text-base sm:text-lg font-semibold">Credit Details</h3>
                        <div className="text-left sm:text-right">
                            <div className="text-xs sm:text-sm text-blue-100">Total Credit</div>
                            <div className="text-lg sm:text-xl font-bold">₹{totalCreditAmount.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                <div className="p-3 sm:p-4 space-y-3">
                    {outstandingAdvanceTransactionInfo.map((transaction, index) => {
                        console.log('🔍 Transaction:', transaction);
                        return (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                    <div>
                                        <div className="text-xs sm:text-sm text-gray-500">Auction Date</div>
                                        <div className="text-sm sm:text-base font-semibold text-gray-900">
                                            {transaction.auctiondate ? new Date(transaction.auctiondate).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm text-gray-500">Payment Date</div>
                                        <div className="text-sm sm:text-base font-semibold text-gray-900">
                                            {transaction.date ? new Date(transaction.date).toLocaleString() : 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm text-gray-500">Amount</div>
                                        <div className="text-sm sm:text-base font-semibold text-green-600">
                                            ₹{transaction.amount?.toLocaleString() || '0'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs sm:text-sm text-gray-500">Status</div>
                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${transaction.status === 'Success'
                                            ? 'bg-green-100 text-green-800'
                                            : transaction.status === 'Due'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {transaction.status === 'Success'
                                                ? 'Received'
                                                : transaction.status === 'Due'
                                                    ? 'Due'
                                                    : transaction.status || 'Unknown'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="mt-6">
            {renderContent()}
            {paySheet && ReactDOM.createPortal(
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
                    style={{ zIndex: 2147483646 }}
                    onPointerUp={(event) => {
                        if (event.target !== event.currentTarget) return;
                        closePaySheet();
                    }}
                    role="presentation"
                >
                    <div
                        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 max-h-[90vh] overflow-y-auto"
                        onPointerUp={(event) => event.stopPropagation()}
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="pay-sheet-title"
                    >
                        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 sm:hidden" />
                        <h3 id="pay-sheet-title" className="text-lg font-bold text-gray-900 mb-1">Pay due</h3>
                        {paySheet.note ? (
                            <p className="text-sm text-gray-500 mb-4">{paySheet.note}</p>
                        ) : (
                            <p className="mb-4" />
                        )}

                        {paySheet.error ? (
                            <p className="text-sm text-red-600 mb-4">{paySheet.error}</p>
                        ) : (
                            <>
                                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-4 space-y-2">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-sm text-gray-600">Amount</span>
                                        <span className="text-base font-extrabold text-red-600">
                                            ₹{Number(paySheet.amount || 0).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-sm text-gray-600">Pay to</span>
                                        <span className="text-sm font-semibold text-gray-900 text-right">{paySheet.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center gap-3">
                                        <span className="text-sm text-gray-600">UPI ID</span>
                                        <span className="text-sm font-mono font-semibold text-gray-900">{paySheet.vpa}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <a
                                        href={paySheet.upiHref}
                                        onClick={() => {
                                            copyText(paySheet.vpa);
                                        }}
                                        className="inline-flex items-center justify-center rounded-md bg-red-600 text-white text-sm font-bold px-4 py-3"
                                    >
                                        Open PhonePe
                                    </a>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const ok = await copyText(paySheet.vpa);
                                            setPayCopied(ok);
                                        }}
                                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-800 text-sm font-semibold px-4 py-3"
                                    >
                                        {payCopied ? 'UPI ID copied' : 'Copy UPI ID'}
                                    </button>
                                </div>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => setPaySheet(null)}
                            onPointerUp={(event) => event.stopPropagation()}
                            className="mt-3 w-full text-sm font-medium text-gray-500 py-2"
                        >
                            Close
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default CircleContentDisplay;
