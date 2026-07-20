import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiArrowUp, FiDownload } from 'react-icons/fi';
import { FaMoneyBillWave, FaCheckCircle, FaExclamationCircle, FaPlus, FaMinus } from "react-icons/fa";
import { PDFDownloadLink } from '@react-pdf/renderer';
import AuctionWinnerReceiptPdf from '../components/PDF/AuctionWinnerReceiptPdf';
import ReceivableReceitPdf from '../components/PDF/ReceivableReceitPdf';
import { useUserContext } from '../context/user_context';
import { useGroupDetailsContext } from '../context/group_context';
import { useHistory } from 'react-router-dom';
import "../style/YourDue.css";


const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const normalizeAmount = (value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = Number(value);
    return Number.isNaN(num) ? 0 : num;
};

const getPaymentsList = (item) => {
    if (!item?.payments) return [];
    if (Array.isArray(item.payments)) return item.payments;
    if (typeof item.payments === 'string') {
        try {
            return JSON.parse(item.payments);
        } catch {
            return [];
        }
    }
    return [];
};

const YourDue = ({ data, GroupWiseOverallUserDuedata, groupDetailsData }) => {
    const { user } = useUserContext();
    const { state } = useGroupDetailsContext();
    const history = useHistory();
    const userCompany = user?.results?.userCompany;
    const groupData = groupDetailsData || state?.data;

    const [accountWiseData, setAccountWiseData] = useState([]);
    const [totalDue, setTotalDue] = useState('0');
    const [totalPaid, setTotalPaid] = useState('0');
    const [totalOutstanding, setTotalOutstanding] = useState('0');
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [expandedRowIndex, setExpandedRowIndex] = useState(null);

    const toggleExpandRow = (index) => {
        setExpandedRowIndex(expandedRowIndex === index ? null : index);
    };

    useEffect(() => {
        if (data?.results?.groupsAccountWiseResult) {
            setAccountWiseData(data.results.groupsAccountWiseResult);
        }

        if (GroupWiseOverallUserDuedata) {
            const {
                total_supposed_to_pay,
                total_paid_amount,
                total_outstanding_balance,
            } = GroupWiseOverallUserDuedata;

            setTotalDue(normalizeAmount(total_supposed_to_pay));
            setTotalPaid(normalizeAmount(total_paid_amount));
            setTotalOutstanding(normalizeAmount(total_outstanding_balance));
        }
    }, [data, GroupWiseOverallUserDuedata]);

    // Scroll event listener
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollButton(window.pageYOffset > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll to top function
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    // Back button handler
    const handleBackClick = () => {
        history.goBack();
    };

    const summaryItems = [
        {
            id: 1,
            icon: <FaMoneyBillWave className="icon" />, // Money bill for Total Amount
            label: 'Total Amount',
            value: totalDue,
            color: 'pink',
        },
        {
            id: 2,
            icon: <FaCheckCircle className="icon" />,
            label: 'Total Paid',
            value: totalPaid,
            color: 'green',
        },
        {
            id: 3,
            icon: <FaExclamationCircle className="icon" />, // Alert for outstanding
            label: 'Total Outstanding',
            value: totalOutstanding ?? '0',
            color: 'purple',
        },
    ];

    if (!data || !data.results) return <p>No data available.</p>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
                    {/* Back Button and Title */}
                    <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handleBackClick}
                                className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 border border-white/20 backdrop-blur-sm hover:scale-105"
                            >
                                <FiArrowLeft className="w-5 h-5" />
                                <span className="font-medium">Back</span>
                            </button>
                            <h1 className="text-3xl font-bold text-white text-center flex-1">Your Due</h1>
                            <div className="w-24"></div> {/* Spacer for centering */}
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {summaryItems.map(({ id, icon, label, value, color }) => (
                                <div key={id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-xl ${color === 'pink' ? 'bg-pink-100 text-pink-600' : color === 'green' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                                            {icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-1">₹{normalizeAmount(value)}</h3>
                                            <p className="text-gray-600 font-medium">{label}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Group Details Section */}
                {groupData?.results && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8">
                        <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-4">
                            <h2 className="text-2xl font-bold text-white text-center">Group Details</h2>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <span className="text-sm font-medium text-blue-600">Group Name</span>
                                    </div>
                                    <div className="text-xl font-bold text-blue-800">{groupData?.results?.groupName || groupData?.groupName || 'N/A'}</div>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        <span className="text-sm font-medium text-green-600">Group Amount</span>
                                    </div>
                                    <div className="text-xl font-bold text-green-800">₹{(groupData?.results?.amount || groupData?.amount)?.toLocaleString() || 'N/A'}</div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                                    <div className="flex items-center gap-3 mb-2">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm font-medium text-purple-600">Start Date</span>
                                    </div>
                                    <div className="text-xl font-bold text-purple-800">{formatDate(groupData?.results?.startDate) || formatDate(groupData?.results?.start_date) || formatDate(groupData?.startDate) || formatDate(groupData?.start_date) || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data Table */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    {/* Table Header - Desktop Only */}
                    <div className="hidden md:block bg-custom-red text-white rounded-lg overflow-hidden">
                        <div className="grid grid-cols-7 gap-4 px-6 py-4 font-semibold text-sm uppercase tracking-wide">
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>Auction Date</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Image</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Name</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span>Total Amount</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Paid</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span>Outstanding</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Download</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-gray-200">
                        {accountWiseData.map((item, index) => {
                            const {
                                auct_date,
                                groupaccountid,
                                user_image_from_s3,
                                user_image_base64format,
                                name,
                                total_supposed_to_pay,
                                total_paid_amount,
                                total_outstanding_balance,
                                payment_mode,
                            } = item;

                            const formattedAuctionDate = formatDate(auct_date);
                            const paymentsList = getPaymentsList(item);
                            const groupName = groupData?.results?.groupName || groupData?.groupName || 'N/A';
                            const rowKey = groupaccountid || `${auct_date}-${index}`;

                            const renderPaymentDownloads = () => {
                                if (!paymentsList.length) return null;

                                return (
                                    <div className="bg-gray-50 border-t border-gray-200 px-4 py-4 md:px-6">
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[640px]">
                                                    <thead>
                                                        <tr className="bg-gray-100">
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Billno</th>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Created At</th>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Method</th>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
                                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Download</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paymentsList.map((payment) => (
                                                            <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                                                                <td className="px-3 py-2 text-sm font-semibold text-gray-800">{payment.id}</td>
                                                                <td className="px-3 py-2 text-sm text-gray-700">
                                                                    {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}
                                                                </td>
                                                                <td className="px-3 py-2 text-sm font-medium text-gray-800">₹{payment.payment_amount}</td>
                                                                <td className="px-3 py-2 text-sm text-gray-600">{payment.payment_method || '-'}</td>
                                                                <td className="px-3 py-2 text-sm text-gray-600">{payment.payment_type || '-'}</td>
                                                                <td className="px-3 py-2">
                                                                    <PDFDownloadLink
                                                                        key={`your-due-payment-${payment.id}`}
                                                                        document={
                                                                            <ReceivableReceitPdf
                                                                                receivableData={{
                                                                                    subscriberName: name,
                                                                                    billNumber: payment.id,
                                                                                    paymentId: payment.id,
                                                                                    paymentType: payment.payment_type,
                                                                                    paymentMethod: payment.payment_method,
                                                                                    groupName,
                                                                                    auctionDate: formattedAuctionDate,
                                                                                    createdAt: payment.created_at
                                                                                        ? new Date(payment.created_at).toLocaleDateString()
                                                                                        : null,
                                                                                    created_at: payment.created_at,
                                                                                    paymentAmount: payment.payment_amount,
                                                                                }}
                                                                                companyData={userCompany}
                                                                            />
                                                                        }
                                                                        fileName={`Receipt-${payment.id}-${name}-${formattedAuctionDate}.pdf`}
                                                                    >
                                                                        {({ loading }) => (
                                                                            <button className="px-3 py-1 bg-custom-red text-white text-xs rounded-md border-none cursor-pointer flex items-center gap-1 hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow-md">
                                                                                <FiDownload size={12} />
                                                                                {loading ? 'Preparing...' : `Billno ${payment.id}`}
                                                                            </button>
                                                                        )}
                                                                    </PDFDownloadLink>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                );
                            };

                            return (
                                <div key={rowKey}>
                                    {/* Desktop View */}
                                    <div className="hidden md:grid grid-cols-7 gap-4 px-6 py-4 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                                        <div className="text-gray-700 flex items-center">
                                            {paymentsList.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpandRow(index)}
                                                    className="mr-2 p-1 text-custom-red hover:bg-red-100 rounded-full transition-colors duration-200"
                                                >
                                                    {expandedRowIndex === index ? <FaMinus size={12} /> : <FaPlus size={12} />}
                                                </button>
                                            )}
                                            {formattedAuctionDate}
                                        </div>

                                        <div className="flex items-center">
                                            <img
                                                src={user_image_from_s3 || "default-image.jpg"}
                                                alt={name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                                                onError={(e) => { e.target.src = "default-image.jpg"; }}
                                            />
                                        </div>

                                        <div className="font-medium text-gray-800">
                                            {name}
                                        </div>

                                        <div className="font-bold text-custom-red">
                                            ₹{normalizeAmount(total_supposed_to_pay)}
                                        </div>

                                        <div className="font-medium text-green-600">
                                            ₹{normalizeAmount(total_paid_amount)}
                                        </div>

                                        <div className={`font-medium ${normalizeAmount(total_outstanding_balance) > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                                            ₹{normalizeAmount(total_outstanding_balance)}
                                        </div>

                                        <div className="flex flex-col gap-2 items-start">
                                            <PDFDownloadLink
                                                document={
                                                    <AuctionWinnerReceiptPdf
                                                        winnerData={{
                                                            winnerImage: user_image_base64format,
                                                            winnerName: name,
                                                            auctionDate: formattedAuctionDate,
                                                            amountTaken: total_supposed_to_pay ?? 0,
                                                            prizeMoney: total_supposed_to_pay ?? 0,
                                                            balance: total_outstanding_balance ?? 0,
                                                            paymentMode: payment_mode ?? 'Online',
                                                            groupName,
                                                            amount: groupData?.results?.amount || groupData?.amount || 'N/A',
                                                            startDate: formatDate(groupData?.results?.startDate) || formatDate(groupData?.results?.start_date) || formatDate(groupData?.startDate) || formatDate(groupData?.start_date) || 'N/A',
                                                        }}
                                                        companyData={userCompany}
                                                    />
                                                }
                                                fileName={`Auction_Receipt_${name}_${formattedAuctionDate}.pdf`}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                                            >
                                                {({ loading }) => (
                                                    <>
                                                        {loading ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                Preparing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                Auction PDF
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </PDFDownloadLink>
                                            {paymentsList.length > 0 && (
                                                <span className="text-xs text-gray-500">Expand row for Billno downloads</span>
                                            )}
                                        </div>
                                    </div>

                                    {expandedRowIndex === index && renderPaymentDownloads()}

                                    {/* Mobile View */}
                                    <div className="md:hidden p-6 border-b border-gray-200 last:border-b-0">
                                        <div className="flex items-center gap-4 mb-4">
                                            <img
                                                src={user_image_from_s3 || "default-image.jpg"}
                                                alt={name}
                                                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                                                onError={(e) => { e.target.src = "default-image.jpg"; }}
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    {paymentsList.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpandRow(index)}
                                                            className="p-1 text-custom-red hover:bg-red-100 rounded-full transition-colors duration-200"
                                                        >
                                                            {expandedRowIndex === index ? <FaMinus size={12} /> : <FaPlus size={12} />}
                                                        </button>
                                                    )}
                                                    <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                                                </div>
                                                <p className="text-sm text-gray-600">{formattedAuctionDate}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <p className="text-xs text-blue-600 font-medium mb-1">Total Amount</p>
                                                <p className="text-lg font-bold text-blue-800">₹{normalizeAmount(total_supposed_to_pay)}</p>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-3">
                                                <p className="text-xs text-green-600 font-medium mb-1">Paid</p>
                                                <p className="text-lg font-bold text-green-800">₹{normalizeAmount(total_paid_amount)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="bg-red-50 rounded-lg p-3 flex-1 mr-4">
                                                <p className="text-xs text-red-600 font-medium mb-1">Outstanding</p>
                                                <p className={`text-lg font-bold ${normalizeAmount(total_outstanding_balance) > 0 ? 'text-red-800' : 'text-gray-800'}`}>
                                                    ₹{normalizeAmount(total_outstanding_balance)}
                                                </p>
                                            </div>
                                            <PDFDownloadLink
                                                document={
                                                    <AuctionWinnerReceiptPdf
                                                        winnerData={{
                                                            winnerImage: user_image_base64format,
                                                            winnerName: name,
                                                            auctionDate: formattedAuctionDate,
                                                            amountTaken: total_supposed_to_pay ?? 0,
                                                            prizeMoney: total_supposed_to_pay ?? 0,
                                                            balance: total_outstanding_balance ?? 0,
                                                            paymentMode: payment_mode ?? 'Online',
                                                            groupName,
                                                            amount: groupData?.results?.amount || groupData?.amount || 'N/A',
                                                            startDate: formatDate(groupData?.results?.startDate) || formatDate(groupData?.results?.start_date) || formatDate(groupData?.startDate) || formatDate(groupData?.start_date) || 'N/A',
                                                        }}
                                                        companyData={userCompany}
                                                    />
                                                }
                                                fileName={`Auction_Receipt_${name}_${formattedAuctionDate}.pdf`}
                                                className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                                            >
                                                {({ loading }) => (
                                                    <>
                                                        {loading ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                Preparing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                Auction PDF
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </PDFDownloadLink>
                                        </div>

                                        {expandedRowIndex === index && renderPaymentDownloads()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Scroll to Top Button */}
            {showScrollButton && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110 hover:shadow-red-500/25"
                    title="Scroll to top"
                >
                    <FiArrowUp className="w-6 h-6" />
                </button>
            )}
        </div>
    );
};

export default YourDue;


