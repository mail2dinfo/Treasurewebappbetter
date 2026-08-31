import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Modal from 'react-modal';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';
import { FiDownload } from 'react-icons/fi';
import { FaPlus, FaMinus, FaWhatsapp } from "react-icons/fa";
import { PDFDownloadLink } from '@react-pdf/renderer';
import Mypdf from '../components/PDF/Mypdf';
import ReceivableReceitPdf from "./PDF/ReceivableReceitPdf";
import { toast } from 'react-toastify';
import { useGroupDetailsContext } from "../context/group_context";
import Loading from './Loading';

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
            const { groupName } = data.results;

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

    const formatBillDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return String(dateStr);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatBillAmount = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

    const sendBillToSubscriber = (payment, auctionItem) => {
        const phoneSource =
            selectedSubscriber?.phone
            || selectedSubscriber?.mobile
            || auctionItem?.phone
            || subscriberData?.[0]?.phone
            || '';
        const digits = String(phoneSource).replace(/\D/g, '');
        if (digits.length < 10) {
            toast.error('Subscriber phone number is missing.');
            return;
        }
        const subscriberPhone = digits.length === 10 ? `91${digits}` : digits;
        const companyLabel = userCompany?.name ? ` from ${userCompany.name}` : '';
        const transactedDate = payment.transacted_date || payment.transactedDate || payment.created_at;
        const message = [
            `Payment Receipt${companyLabel}`,
            '',
            `Bill No: ${payment.id ?? '-'}`,
            `Subscriber Name: ${selectedSubscriber?.name || auctionItem?.name || '-'}`,
            `Receivable Date: ${formatBillDate(auctionItem?.auct_date)}`,
            `Group Name: ${groupName || '-'}`,
            `Auction Date: ${formatBillDate(auctionItem?.auct_date)}`,
            `Amount Paid (toward due): ${formatBillAmount(payment.payment_amount)}`,
            `Cash Collected: ${formatBillAmount(payment.payment_amount)}`,
            `Payment Method: ${payment.payment_method || '-'}`,
            `Payment Type: ${payment.payment_type || '-'}`,
            `Transacted Date: ${formatBillDate(transactedDate)}`,
            '',
            'Thank you for your payment.',
        ].join('\n');

        const url = `https://api.whatsapp.com/send?phone=${subscriberPhone}&text=${encodeURIComponent(message)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Table Component - Exact GroupAccountList pattern
    const renderSubscriberWiseTable = () => (
        <div className="w-full min-w-0 overflow-hidden">
            <div className="bg-custom-red text-white rounded-t-lg overflow-hidden">
                <div
                    className="grid items-center gap-2 px-3 py-3 text-xs sm:text-sm font-semibold"
                    style={{ gridTemplateColumns: 'minmax(0, 1.8fr) repeat(3, minmax(0, 1fr)) 72px' }}
                >
                    <span className="truncate">Subscriber</span>
                    <span className="text-right truncate">Total</span>
                    <span className="text-right truncate">Paid</span>
                    <span className="text-right truncate">Due</span>
                    <span className="text-center">View</span>
                </div>
            </div>
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg">
                {items?.map((item) => (
                    <div
                        key={item.subscriber_id}
                        className="grid items-center gap-2 px-3 py-3 text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                        style={{ gridTemplateColumns: 'minmax(0, 1.8fr) repeat(3, minmax(0, 1fr)) 72px' }}
                    >
                        <div className="min-w-0 font-medium text-gray-900 break-words leading-snug">
                            {item.name}
                        </div>
                        <div className="text-right font-bold text-custom-red tabular-nums whitespace-nowrap">
                            ₹{item.total_supposed_to_pay ?? 0}
                        </div>
                        <div className="text-right font-medium text-green-600 tabular-nums whitespace-nowrap">
                            ₹{item.total_paid_amount ?? 0}
                        </div>
                        <div className={`text-right font-medium tabular-nums whitespace-nowrap ${(item.total_outstanding_balance ?? 0) > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            ₹{item.total_outstanding_balance ?? 0}
                        </div>
                        <div className="flex justify-center">
                            <button
                                type="button"
                                className="px-3 py-1 bg-custom-red text-white text-xs sm:text-sm rounded-md hover:bg-red-700 transition-colors duration-200 shadow-sm shrink-0"
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
                            <Loading />
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
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Billno</th>
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Transacted Date</th>
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Created At</th>
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Method</th>
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Download</th>
                                                                                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">WhatsApp</th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                {item.payments.map((p) => (
                                                                                                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                                                                                                        <td className="px-3 py-2 text-sm font-semibold text-gray-800">{p.id}</td>
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
                                                                                                                key={`customer-due-receipt-${p.id}`}
                                                                                                                document={
                                                                                                                    <ReceivableReceitPdf
                                                                                                                        receivableData={{
                                                                                                                            subscriberName: selectedSubscriber.name,
                                                                                                                            billNumber: p.id,
                                                                                                                            receiptId: p.id,
                                                                                                                            paymentType: p.payment_type,
                                                                                                                            paymentMethod: p.payment_method,
                                                                                                                            groupName: groupName,
                                                                                                                            auctionDate: item.auct_date
                                                                                                                                ? new Date(item.auct_date).toLocaleDateString()
                                                                                                                                : '-',
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
                                                                                                                fileName={`Receipt-${p.id}-${selectedSubscriber.name}-${item.auct_date ? new Date(item.auct_date).toISOString().slice(0, 10) : Date.now()}.pdf`}
                                                                                                            >
                                                                                                                {({ loading }) => (
                                                                                                                    <button className="px-3 py-1 bg-custom-red text-white text-xs rounded-md border-none cursor-pointer flex items-center gap-1 hover:bg-red-700 transition-colors duration-200 shadow-sm hover:shadow-md">
                                                                                                                        <FiDownload size={12} />
                                                                                                                        {loading ? "Preparing..." : "Download"}
                                                                                                                    </button>
                                                                                                                )}
                                                                                                            </PDFDownloadLink>
                                                                                                        </td>
                                                                                                        <td className="px-3 py-2">
                                                                                                            <button
                                                                                                                type="button"
                                                                                                                onClick={() => sendBillToSubscriber(p, item)}
                                                                                                                className="px-3 py-1 bg-green-600 text-white text-xs rounded-md border-none cursor-pointer flex items-center gap-1 hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                                                                            >
                                                                                <FaWhatsapp size={12} />
                                                                                Send bill to subscriber
                                                                            </button>
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                ))}
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
