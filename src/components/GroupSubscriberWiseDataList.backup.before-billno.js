import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Modal from 'react-modal';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';
import { FiDownload, FiPrinter } from 'react-icons/fi';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Mypdf from '../components/PDF/Mypdf';
import loadingImage from "../images/preloader.gif";
import { FaPlus, FaMinus } from "react-icons/fa"; // ✅ Add icons
import ReceivableReceitPdf from "./PDF/ReceivableReceitPdf";
import { useGroupDetailsContext } from "../context/group_context";

const GroupSubscriberWiseDataList = ({ items }) => {
    const { groupId } = useParams();
    const { data } = useGroupDetailsContext();
    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [subscriberData, setSubscriberData] = useState(null);
    const { user } = useUserContext();
    const [modalLoading, setModalLoading] = useState(false);
    const [pdfData, setPdfData] = useState(null);

    const [expandedRowIndex, setExpandedRowIndex] = useState(null); // ✅ new state

    const userCompany = user?.results?.userCompany;
    const [groupName, setGroupName] = useState([]);

    const generateFileName = () => {
        const today = new Date();
        const date = today.getDate().toString().padStart(2, '0');
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const year = today.getFullYear();
        return `SubscriberGroupWise_Receivable_${year}-${month}-${date}.pdf`;
    };

    useEffect(() => {
        if (data && data.results) {
            // Set groupTransactionInfo when data is available
            const { amount, type, commisionType, commissionAmount, groupName } = data.results;

            setGroupName(groupName);

        }
    }, [data]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (selectedSubscriber) {
                    setModalLoading(true);
                    const apiUrl = `${API_BASE_URL}/groups/${groupId}/customer-due/${selectedSubscriber.subscriber_id}`;

                    const response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${user?.results?.token}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log('Payment data structure:', data.results.groupsWiseSubscriberResult);
                        // Log first payment to see available fields
                        if (data.results.groupsWiseSubscriberResult?.[0]?.payments?.[0]) {
                            console.log('Sample payment object:', data.results.groupsWiseSubscriberResult[0].payments[0]);
                        }
                        setSubscriberData(data.results.groupsWiseSubscriberResult);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setModalLoading(false);
            }
        };

        if (selectedSubscriber) {
            fetchData();
        }
    }, [selectedSubscriber, groupId, user]);

    const openModal = (subscriber) => {
        setSelectedSubscriber(subscriber);
    };

    const closeModal = () => {
        setSelectedSubscriber(null);
        setSubscriberData(null);
        setModalLoading(false);
    };

    const handleGeneratePDFforindividualsubscriber = () => {
        if (!subscriberData) return;
        const formattedData = subscriberData.map(item => ({
            auct_date: item.auct_date,
            total_supposed_to_pay: item.total_supposed_to_pay,
            total_paid_amount: item.total_paid_amount,
            total_outstanding_balance: item.total_outstanding_balance
        }));
        setPdfData(formattedData);
    };

    const toggleExpandRow = (index) => {
        setExpandedRowIndex(expandedRowIndex === index ? null : index);
    };

    // Table Component - Exact GroupAccountList pattern
    const renderSubscriberWiseTable = () => (
        <div className="overflow-x-auto">
            <div className="bg-custom-red text-white rounded-lg overflow-hidden">
                <div className="grid grid-cols-5 gap-4 p-4 text-sm font-semibold">
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Subscriber</span>
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
                        <span>Paid Amount</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <span>Outstanding</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Actions</span>
                    </div>
                </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-b-lg">
                {items?.map((item) => (
                    <div key={item.subscriber_id} className="grid grid-cols-5 gap-2 p-4 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <div className="text-gray-900 font-medium">
                            {item.name}
                        </div>
                        <div className="font-bold text-custom-red">
                            ₹{item.total_supposed_to_pay ?? 0}
                        </div>
                        <div className="font-medium text-green-600">
                            ₹{item.total_paid_amount ?? 0}
                        </div>
                        <div className={`font-medium ${(item.total_outstanding_balance ?? 0) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            ₹{item.total_outstanding_balance ?? 0}
                        </div>
                        <div className="flex items-center">
                            <button
                                className="px-3 py-1 bg-custom-red text-white text-sm rounded-md hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                                onClick={() => openModal(item)}
                            >
                                View
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Empty State Component
    const EmptyState = () => (
        <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            </div>
            <p className="text-gray-500 font-medium">No subscriber data available</p>
        </div>
    );

    return (
        <div>
            {items?.length > 0 ? renderSubscriberWiseTable() : <EmptyState />}

            <Modal
                isOpen={!!selectedSubscriber}
                onRequestClose={closeModal}
                contentLabel="Subscriber Details"
                className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
                overlayClassName="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-[9999]"
            >
                <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                    {modalLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 px-8">
                            <img src={loadingImage} alt="loading" className="w-20 h-20 mb-4" />
                            <p className="text-gray-500 text-sm font-medium">
                                Loading subscriber details...
                            </p>
                        </div>
                    ) : (
                        selectedSubscriber && (
                            <div className="font-sans text-gray-800">
                                {/* Header + Action Buttons */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-3 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-red-100">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <img
                                                src={selectedSubscriber.user_image_from_s3}
                                                alt={selectedSubscriber.name}
                                                className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white"
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-custom-red rounded-full border-2 border-white"></div>
                                        </div>
                                        <h2 className="text-2xl font-semibold text-gray-800">
                                            {selectedSubscriber.name}'s Details
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        {pdfData ? (
                                            <PDFDownloadLink
                                                document={
                                                    <Mypdf
                                                        tableData={pdfData}
                                                        tableHeaders={[
                                                            { title: "Auction Date", value: "auct_date" },
                                                            { title: "Total", value: "total_supposed_to_pay" },
                                                            { title: "Paid", value: "total_paid_amount" },
                                                            { title: "Due", value: "total_outstanding_balance" },
                                                        ]}
                                                        heading="Subscriber Auction Wise Receivable"
                                                        companyData={userCompany}
                                                    />
                                                }
                                                fileName={generateFileName()}
                                            >
                                                {({ loading }) => (
                                                    <button
                                                        onClick={() => setTimeout(() => setPdfData(null), 500)}
                                                        className="px-4 py-2 bg-custom-red text-white rounded-lg border-none cursor-pointer flex items-center gap-2 hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                                                    >
                                                        <FiDownload size={16} />
                                                        {loading ? "Preparing..." : "Download PDF"}
                                                    </button>
                                                )}
                                            </PDFDownloadLink>
                                        ) : (
                                            <button
                                                onClick={handleGeneratePDFforindividualsubscriber}
                                                className="px-4 py-2 bg-custom-red text-white rounded-lg border-none cursor-pointer flex items-center gap-2 hover:bg-red-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                                            >
                                                <FiDownload size={16} /> Generate PDF
                                            </button>
                                        )}
                                        <button
                                            onClick={closeModal}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Financial Summary Section */}
                                <div className="p-3 sm:p-6 bg-white">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                                            <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Total Amount</p>
                                            <p className="text-xl font-bold text-gray-800">₹{selectedSubscriber.total_supposed_to_pay || 0}</p>
                                        </div>
                                        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                            <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Paid</p>
                                            <p className="text-xl font-bold text-gray-800">₹{selectedSubscriber.total_paid_amount || 0}</p>
                                        </div>
                                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                                            <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Outstanding</p>
                                            <p className="text-xl font-bold text-gray-800">₹{selectedSubscriber.total_outstanding_balance || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Auction Table */}
                                <div className="p-3 sm:p-6 pt-0">
                                    {subscriberData ? (
                                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[400px] sm:min-w-[600px]">
                                                    <thead>
                                                        <tr className="bg-custom-red text-white">
                                                            <th className="px-4 py-3 text-left text-sm font-semibold">Auction</th>
                                                            <th className="px-4 py-3 text-left text-sm font-semibold">Total</th>
                                                            <th className="px-4 py-3 text-left text-sm font-semibold">Paid</th>
                                                            <th className="px-4 py-3 text-left text-sm font-semibold">Outstanding</th>
                                                            <th className="px-4 py-3 text-left text-sm font-semibold">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {subscriberData.map((item, index) => (
                                                            <React.Fragment key={index}>
                                                                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                                                                    <td className="px-4 py-3 flex items-center">
                                                                        {item.payments?.length > 0 && (
                                                                            <button
                                                                                onClick={() => toggleExpandRow(index)}
                                                                                className="mr-3 p-1 text-custom-red hover:bg-red-100 rounded-full transition-colors duration-200"
                                                                            >
                                                                                {expandedRowIndex === index ? <FaMinus size={14} /> : <FaPlus size={14} />}
                                                                            </button>
                                                                        )}
                                                                        <span className="text-sm font-medium text-gray-800">{item.auct_date}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-sm font-bold text-custom-red">₹{item.total_supposed_to_pay || 0}</td>
                                                                    <td className="px-4 py-3 text-sm font-medium text-green-600">₹{item.total_paid_amount || 0}</td>
                                                                    <td className="px-4 py-3 text-sm font-medium text-orange-600">₹{item.total_outstanding_balance || 0}</td>
                                                                    <td className="px-4 py-3 text-xs text-gray-500">
                                                                        {item.payments?.length > 0 ? "Expand to download bills" : "-"}
                                                                    </td>
                                                                </tr>

                                                                {/* Expanded Payments */}
                                                                {expandedRowIndex === index && item.payments?.length > 0 && (
                                                                    <tr>
                                                                        <td colSpan="6" className="bg-gray-50 p-0">
                                                                            <div className="p-4">
                                                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                                                    <div className="overflow-x-auto">
                                                                                        <table className="w-full">
                                                                                            <thead>
                                                                                                <tr className="bg-gray-100">
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Transacted Date</th>
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Created At</th>
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Method</th>
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Download</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                {(() => {
                                                                                                    console.log('=== Receipt Details - All Payments ===');
                                                                                                    console.log('Auction Date:', item.auct_date);
                                                                                                    console.log('All payments for this auction:', item.payments);
                                                                                                    console.log('Number of payments:', item.payments?.length);
                                                                                                    return null;
                                                                                                })()}
                                                                                                {item.payments.map((p) => {
                                                                                                    console.log('--- Individual Payment/Receipt Object ---');
                                                                                                    console.log('Payment ID:', p.id);
                                                                                                    console.log('Full payment object:', p);
                                                                                                    console.log('Available fields:', Object.keys(p));
                                                                                                    console.log('transacted_date:', p.transacted_date);
                                                                                                    console.log('transactedDate:', p.transactedDate);
                                                                                                    console.log('created_at:', p.created_at);
                                                                                                    console.log('payment_amount:', p.payment_amount);
                                                                                                    console.log('payment_method:', p.payment_method);
                                                                                                    console.log('payment_type:', p.payment_type);
                                                                                                    return (
                                                                                                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                                                                                                            <td className="px-3 py-2 text-sm text-gray-700">
                                                                                                                {p.transacted_date
                                                                                                                    ? new Date(p.transacted_date).toLocaleDateString()
                                                                                                                    : (p.transactedDate
                                                                                                                        ? new Date(p.transactedDate).toLocaleDateString()
                                                                                                                        : 'N/A')}
                                                                                                            </td>
                                                                                                            <td className="px-3 py-2 text-sm text-gray-700">
                                                                                                                {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                                                                                                            </td>
                                                                                                            <td className="px-3 py-2 text-sm font-medium text-gray-800">₹{p.payment_amount}</td>
                                                                                                            <td className="px-3 py-2 text-sm text-gray-600">{p.payment_method}</td>
                                                                                                            <td className="px-3 py-2">
                                                                                                                <PDFDownloadLink
                                                                                                                    document={
                                                                                                                        <ReceivableReceitPdf
                                                                                                                            receivableData={{
                                                                                                                                subscriberName: selectedSubscriber.name,
                                                                                                                                paymentType: p.payment_type,
                                                                                                                                paymentMethod: p.payment_method,
                                                                                                                                groupName: groupName,
                                                                                                                                auctionDate: new Date(p.created_at).toLocaleDateString(),
                                                                                                                                transactedDate: p.transacted_date
                                                                                                                                    ? new Date(p.transacted_date).toLocaleDateString()
                                                                                                                                    : (p.transactedDate
                                                                                                                                        ? new Date(p.transactedDate).toLocaleDateString()
                                                                                                                                        : null),
                                                                                                                                transacted_date: p.transacted_date,
                                                                                                                                createdAt: p.created_at
                                                                                                                                    ? new Date(p.created_at).toLocaleDateString()
                                                                                                                                    : null,
                                                                                                                                created_at: p.created_at,
                                                                                                                                paymentAmount: p.payment_amount,
                                                                                                                            }}
                                                                                                                            companyData={userCompany}
                                                                                                                        />
                                                                                                                    }
                                                                                                                    fileName={`Bill_${selectedSubscriber.name}_${new Date(
                                                                                                                        p.created_at
                                                                                                                    ).toISOString().slice(0, 10)}.pdf`}
                                                                                                                >
                                                                                                                    {({ loading }) => (
                                                                                                                        <button className="px-3 py-1 bg-custom-red text-white text-xs rounded-md border-none cursor-pointer flex items-center gap-1 hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow-md">
                                                                                                                            <FiDownload size={12} />
                                                                                                                            {loading ? "Preparing..." : "Download"}
                                                                                                                        </button>
                                                                                                                    )}
                                                                                                                </PDFDownloadLink>
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    );
                                                                                                })}
                                                                                            </tbody>
                                                                                        </table>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-500 font-medium">No items available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default GroupSubscriberWiseDataList;
