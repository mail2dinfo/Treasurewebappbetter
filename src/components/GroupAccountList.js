import React from 'react';
import { Calendar, DollarSign, TrendingUp, Award, Hash, Wallet, Gift, Trash2 } from 'lucide-react';

const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedDate = new Date(dateString).toLocaleDateString(undefined, options);
    return formattedDate;
};

const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '₹0';
    return `₹${parseFloat(value).toLocaleString('en-IN')}`;
};

const getLastItemId = (items = []) => {
    if (!items.length) return null;
    let last = items[0];
    items.forEach((item) => {
        const lastSno = Number(last?.sno ?? -1);
        const itemSno = Number(item?.sno ?? -1);
        if (itemSno > lastSno) {
            last = item;
            return;
        }
        if (itemSno === lastSno) {
            const lastDate = new Date(last?.auctionDate || 0).getTime();
            const itemDate = new Date(item?.auctionDate || 0).getTime();
            if (itemDate >= lastDate) last = item;
        }
    });
    return last?.grpAccountId || null;
};

const DeleteCell = ({ item, isLast, allowDeleteLast, onDeleteClick }) => {
    if (!allowDeleteLast) return null;
    if (!isLast) {
        return <div className="text-center text-gray-300 text-xs">—</div>;
    }
    return (
        <div className="flex justify-center">
            <button
                type="button"
                title="Delete last group account"
                onClick={() => onDeleteClick?.(item)}
                className="p-1.5 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

const GroupAccountList = ({ items, type, allowDeleteLast = false, onDeleteClick }) => {
    const lastId = getLastItemId(items);
    const actionCol = allowDeleteLast ? ' 44px' : '';

    const renderFixedView = () => (
        <div className="overflow-x-auto">
            <div className="bg-custom-red text-white rounded-lg overflow-hidden">
                <div
                    className="grid p-4 text-sm font-semibold"
                    style={{
                        gridTemplateColumns: `50px 80px 1fr 1fr 1fr 1fr 1fr${actionCol}`,
                    }}
                >
                    <div className="flex items-center gap-1">
                        <Hash size={16} />
                        <span>S.No</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span>Date</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Wallet size={16} />
                        <span>Due</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp size={16} />
                        <span>Profit</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Award size={16} />
                        <span>Comm</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Gift size={16} />
                        <span>Prize</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        <span>Bid</span>
                    </div>
                    {allowDeleteLast && <div className="text-center text-xs">Del</div>}
                </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-b-lg">
                {items?.map((item, index) => {
                    const {
                        auctionDate,
                        auctionAmount,
                        commision,
                        profit,
                        customerDue,
                        auctionStatus,
                        prizeMoney,
                        sno,
                        grpAccountId,
                    } = item;
                    const formattedAuctionDate = formatDate(auctionDate);
                    const isLast = grpAccountId === lastId;

                    return (
                        <div
                            key={grpAccountId || index}
                            className="grid p-4 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                            style={{
                                gridTemplateColumns: `50px 80px 1fr 1fr 1fr 1fr 1fr${actionCol}`,
                            }}
                        >
                            <div className="font-medium text-gray-800">{sno ?? 0}</div>
                            <div
                                className={`${
                                    auctionStatus === 'completed'
                                        ? 'bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center'
                                        : 'text-gray-700'
                                }`}
                            >
                                <span>{formattedAuctionDate}</span>
                            </div>
                            <div className="font-medium text-gray-800">
                                {formatCurrency(customerDue)}
                            </div>
                            <div className="font-medium text-green-600">
                                {formatCurrency(profit)}
                            </div>
                            <div className="font-medium text-blue-600">
                                {formatCurrency(commision)}
                            </div>
                            <div className="font-medium text-purple-600">
                                {formatCurrency(prizeMoney)}
                            </div>
                            <div className="font-bold text-custom-red">
                                {formatCurrency(auctionAmount)}
                            </div>
                            <DeleteCell
                                item={item}
                                isLast={isLast}
                                allowDeleteLast={allowDeleteLast}
                                onDeleteClick={onDeleteClick}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderAccumulativeView = () => {
        return (
            <div className="overflow-x-auto">
                <div className="bg-custom-red text-white rounded-lg overflow-hidden">
                    <div
                        className="grid p-4 text-sm font-semibold"
                        style={{
                            gridTemplateColumns: `50px 80px 1fr 1fr 1fr 1fr${actionCol}`,
                        }}
                    >
                        <div className="flex items-center gap-1">
                            <Hash size={16} />
                            <span>S.No</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>Date</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <DollarSign size={16} />
                            <span>Auc Amt</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Award size={16} />
                            <span>Comm</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <TrendingUp size={16} />
                            <span>Reserve</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Wallet size={16} />
                            <span>Due</span>
                        </div>
                        {allowDeleteLast && <div className="text-center text-xs">Del</div>}
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-b-lg">
                    {items?.map((item, index) => {
                        const {
                            auctionDate,
                            auctionAmount,
                            commision,
                            reserve,
                            customerDue,
                            auctionStatus,
                            sno,
                            grpAccountId,
                        } = item;
                        const isLast = grpAccountId === lastId;

                        return (
                            <div
                                key={grpAccountId || index}
                                className="grid p-4 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                                style={{
                                    gridTemplateColumns: `50px 80px 1fr 1fr 1fr 1fr${actionCol}`,
                                }}
                            >
                                <div className="font-medium text-gray-800">{sno ?? 0}</div>
                                <div
                                    className={`${
                                        auctionStatus === 'completed'
                                            ? 'bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    {formatDate(auctionDate)}
                                </div>
                                <div className="font-bold text-custom-red">
                                    {formatCurrency(auctionAmount)}
                                </div>
                                <div className="font-medium text-blue-600">
                                    {formatCurrency(commision)}
                                </div>
                                <div className="font-medium text-purple-600">
                                    {formatCurrency(reserve)}
                                </div>
                                <div className="font-medium text-gray-800">
                                    {formatCurrency(customerDue)}
                                </div>
                                <DeleteCell
                                    item={item}
                                    isLast={isLast}
                                    allowDeleteLast={allowDeleteLast}
                                    onDeleteClick={onDeleteClick}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderDeductiveView = () => {
        return (
            <div className="overflow-x-auto">
                <div className="bg-custom-red text-white rounded-lg overflow-hidden">
                    <div
                        className="grid p-4 text-sm font-semibold"
                        style={{
                            gridTemplateColumns: `50px 80px 1fr 1fr 1fr 1fr${actionCol}`,
                        }}
                    >
                        <div className="flex items-center gap-1">
                            <Hash size={16} />
                            <span>S.No</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar size={16} />
                            <span>Date</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <DollarSign size={16} />
                            <span>Auc Amt</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Award size={16} />
                            <span>Comm</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <TrendingUp size={16} />
                            <span>Profit</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Wallet size={16} />
                            <span>Due</span>
                        </div>
                        {allowDeleteLast && <div className="text-center text-xs">Del</div>}
                    </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-b-lg">
                    {items?.map((item, index) => {
                        const {
                            auctionDate,
                            auctionAmount,
                            commision,
                            profit,
                            customerDue,
                            auctionStatus,
                            sno,
                            grpAccountId,
                        } = item;
                        const isLast = grpAccountId === lastId;

                        return (
                            <div
                                key={grpAccountId || index}
                                className="grid p-4 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                                style={{
                                    gridTemplateColumns: `50px 80px 1fr 1fr 1fr 1fr${actionCol}`,
                                }}
                            >
                                <div className="font-medium text-gray-800">{sno ?? 0}</div>
                                <div
                                    className={`${
                                        auctionStatus === 'completed'
                                            ? 'bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center'
                                            : 'text-gray-700'
                                    }`}
                                >
                                    {formatDate(auctionDate)}
                                </div>
                                <div className="font-bold text-custom-red">
                                    {formatCurrency(auctionAmount)}
                                </div>
                                <div className="font-medium text-blue-600">
                                    {formatCurrency(commision)}
                                </div>
                                <div className="font-medium text-green-600">
                                    {formatCurrency(profit)}
                                </div>
                                <div className="font-medium text-gray-800">
                                    {formatCurrency(customerDue)}
                                </div>
                                <DeleteCell
                                    item={item}
                                    isLast={isLast}
                                    allowDeleteLast={allowDeleteLast}
                                    onDeleteClick={onDeleteClick}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const normalizedType = String(type || '').trim().toUpperCase();
    if (normalizedType === 'FIXED' || normalizedType === 'ADAPTIVE') {
        return renderFixedView();
    } else if (normalizedType === 'DEDUCTIVE') {
        return renderDeductiveView();
    } else if (normalizedType === 'ACCUMULATIVE') {
        return renderAccumulativeView();
    } else {
        return <div>No data to display.</div>;
    }
};

export default GroupAccountList;
