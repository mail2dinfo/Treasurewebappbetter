import React, { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Mypdf from '../components/PDF/Mypdf';
import { useUserContext } from '../context/user_context';


const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

const GroupAccountWiseDataList = ({ items }) => {
    const { user } = useUserContext();
    const [pdfData, setPdfData] = useState(null);
    const [previewImageUrl] = useState('');
    const userCompany = user?.results?.userCompany;
    const [companyName, setCompanyName] = useState(null);

    const generateFileName = () => {
        const today = new Date();
        return `SubscriberGroupWise_Receivable_${today.getFullYear()}-${(today.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}.pdf`;
    };



    useEffect(() => {
        if (userCompany?.[0]?.name) {
            setCompanyName(userCompany[0].name);

        }
    }, [user]);

    const handleGeneratePDF = () => {
        const formattedData = items.map((item) => ({
            auct_date: item.auct_date,
            total_supposed_to_pay: item.total_supposed_to_pay,
            total_paid_amount: item.total_paid_amount,
            total_outstanding_balance: item.total_outstanding_balance,
        }));
        setPdfData(formattedData);
    };

    // Download Button Component
    const DownloadButton = () => (
        <div className="flex justify-end mb-4">
            {pdfData ? (
                <PDFDownloadLink
                    document={
                        <Mypdf
                            tableData={pdfData}
                            previewImageUrl={previewImageUrl}
                            tableHeaders={[
                                { title: 'Auction Date', value: 'auct_date' },
                                { title: 'Total', value: 'total_supposed_to_pay' },
                                { title: 'Paid', value: 'total_paid_amount' },
                                { title: 'Due', value: 'total_outstanding_balance' },
                            ]}
                            heading="Group AuctionWise Receivable"
                            companyName={companyName}
                            companyData={userCompany}
                            base64Logo={previewImageUrl}
                        />
                    }
                    fileName={generateFileName()}
                >
                    {({ loading }) =>
                        loading ? (
                            <div className="px-4 py-2 bg-gray-400 text-white text-sm rounded-md flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Loading document...
                            </div>
                        ) : (
                            <button
                                className="px-4 py-2 bg-custom-red text-white text-sm rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                                onClick={() => setTimeout(() => setPdfData(null), 500)}
                            >
                                <FiDownload /> Download PDF
                            </button>
                        )
                    }
                </PDFDownloadLink>
            ) : (
                <button
                    className="px-4 py-2 bg-custom-red text-white text-sm rounded-md hover:bg-red-700 transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                    onClick={handleGeneratePDF}
                >
                    <FiDownload /> Generate PDF
                </button>
            )}
        </div>
    );

    // Table Component - Exact GroupAccountList pattern
    const renderAuctionWiseTable = () => (
        <div className="overflow-x-auto">
            <div className="bg-custom-red text-white rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 gap-4 p-4 text-sm font-semibold">
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Auction Date</span>
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
                </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-b-lg">
                {items?.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 p-4 text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                        <div className="text-gray-700 font-medium">
                            {formatDate(item.auct_date)}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <p className="text-gray-500 font-medium">No auction data available</p>
        </div>
    );

    return (
        <div>
            <DownloadButton />
            {items?.length > 0 ? renderAuctionWiseTable() : <EmptyState />}
        </div>
    );
};

export default GroupAccountWiseDataList;
