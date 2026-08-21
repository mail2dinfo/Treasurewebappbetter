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
        <div className="w-full min-w-0 overflow-hidden">
            <div className="bg-custom-red text-white rounded-t-lg">
                <div
                    className="grid items-center gap-2 px-3 py-3 text-xs sm:text-sm font-semibold"
                    style={{ gridTemplateColumns: 'minmax(0, 1.3fr) repeat(3, minmax(0, 1fr))' }}
                >
                    <span className="truncate">Auction Date</span>
                    <span className="text-right truncate">Total</span>
                    <span className="text-right truncate">Paid</span>
                    <span className="text-right truncate">Due</span>
                </div>
            </div>
            <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg">
                {items?.map((item, index) => (
                    <div
                        key={index}
                        className="grid items-center gap-2 px-3 py-3 text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                        style={{ gridTemplateColumns: 'minmax(0, 1.3fr) repeat(3, minmax(0, 1fr))' }}
                    >
                        <div className="min-w-0 text-gray-700 font-medium truncate">
                            {formatDate(item.auct_date)}
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
