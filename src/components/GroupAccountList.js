import React from 'react';
import { Calendar, DollarSign, TrendingUp, Award, Hash, Wallet, Gift } from 'lucide-react';

const formatDate = (dateString) => {
    console.log('formatDate');
    console.log(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const formattedDate = new Date(dateString).toLocaleDateString(undefined, options);
    return formattedDate;
};

const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '₹0';
    return `₹${parseFloat(value).toLocaleString('en-IN')}`;
};

const GroupAccountList = ({ items, removeItem, editItem, type }) => {


    const renderFixedView = () => (
        <div className="overflow-x-auto">
            <div className="bg-custom-red text-white rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 p-4 text-sm font-semibold" style={{ gridTemplateColumns: '50px 80px 1fr 1fr 1fr 1fr 1fr' }}>
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
                </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-b-lg">
                {items?.map((item, index) => {
                    const { auctionDate, auctionAmount, commision, profit, customerDue, auctionStatus, prizeMoney, sno } = item;
                    const formattedAuctionDate = formatDate(auctionDate);

                    return (
                        <div key={index} className="grid grid-cols-7 p-4 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200" style={{ gridTemplateColumns: '50px 80px 1fr 1fr 1fr 1fr 1fr' }}>
                            <div className="font-medium text-gray-800">
                                {sno ?? 0}
                            </div>
                            <div className={`${auctionStatus === 'completed' ? 'bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center' : 'text-gray-700'}`}>
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
                    <div className="grid grid-cols-6 p-4 text-sm font-semibold" style={{ gridTemplateColumns: '50px 80px 1fr 1fr 1fr 1fr' }}>
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
                            sno
                        } = item;

                        return (
                            <div key={index} className="grid grid-cols-6 p-4 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200" style={{ gridTemplateColumns: '50px 80px 1fr 1fr 1fr 1fr' }}>
                                <div className="font-medium text-gray-800">{sno ?? 0}</div>
                                <div className={`${auctionStatus === 'completed' ? 'bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center' : 'text-gray-700'}`}>
                                    {formatDate(auctionDate)}
                                </div>
                                <div className="font-bold text-custom-red">{formatCurrency(auctionAmount)}</div>
                                <div className="font-medium text-blue-600">{formatCurrency(commision)}</div>
                                <div className="font-medium text-purple-600">{formatCurrency(reserve)}</div>
                                <div className="font-medium text-gray-800">{formatCurrency(customerDue)}</div>
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
                    <div className="grid grid-cols-6 p-4 text-sm font-semibold" style={{ gridTemplateColumns: '50px 80px 1fr 1fr 1fr 1fr' }}>
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
                            sno
                        } = item;

                        return (
                            <div key={index} className="grid grid-cols-6 p-4 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200" style={{ gridTemplateColumns: '50px 80px 1fr 1fr 1fr 1fr' }}>
                                <div className="font-medium text-gray-800">{sno ?? 0}</div>
                                <div className={`${auctionStatus === 'completed' ? 'bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center justify-center' : 'text-gray-700'}`}>
                                    {formatDate(auctionDate)}
                                </div>
                                <div className="font-bold text-custom-red">{formatCurrency(auctionAmount)}</div>
                                <div className="font-medium text-blue-600">{formatCurrency(commision)}</div>
                                <div className="font-medium text-green-600">{formatCurrency(profit)}</div>
                                <div className="font-medium text-gray-800">{formatCurrency(customerDue)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };


    // Conditional return based on type
    if (type.trim() === 'FIXED') {
        return renderFixedView();
    } else if (type.trim() === 'DEDUCTIVE') {
        return renderDeductiveView();
    } else if (type.trim() === 'ACCUMULATIVE') {
        return renderAccumulativeView();
    } else {
        return <div>No data to display.</div>;
    }
};

export default GroupAccountList;
