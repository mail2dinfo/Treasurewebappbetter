import React, { useEffect, useState, useCallback } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useDailyCollectionContext } from '../../context/dailyCollection/DailyCollectionContext';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import { uploadImage } from '../../utils/uploadImage';
import { FiX, FiUser, FiCalendar, FiDollarSign, FiCheckCircle, FiAlertCircle, FiTrash2, FiUpload, FiFile, FiCheck, FiDownload } from 'react-icons/fi';
import LoanAgreementPDF from './PDF/LoanAgreementPDF';

const LoanDetails = ({ loan, onClose }) => {
    const { getLoanDetails, deleteLoan } = useDailyCollectionContext();
    const { user } = useUserContext();
    const [loanData, setLoanData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Upload Agreement States
    const [agreementFile, setAgreementFile] = useState(null);
    const [agreementPreview, setAgreementPreview] = useState(null);
    const [isUploadingAgreement, setIsUploadingAgreement] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [companies, setCompanies] = useState([]);

    // Fetch companies for PDF generation
    const fetchCompanies = useCallback(async () => {
        if (!user?.results?.token) return;

        const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
        if (!membershipId) return;

        try {
            const url = `${API_BASE_URL}/dc/companies?parent_membership_id=${membershipId}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.ok) {
                const data = await res.json();
                setCompanies(data.results || []);
            }
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    }, [user]);

    useEffect(() => {
        loadLoanDetails();
    }, [loan.id]);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const loadLoanDetails = async () => {
        setIsLoading(true);
        const result = await getLoanDetails(loan.id);
        if (result.success) {
            setLoanData(result.data);
        }
        setIsLoading(false);
    };

    const handleDeleteLoan = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteLoan(loan.id);
            if (result.success) {
                alert('Loan deleted successfully!');
                onClose(); // Close the modal
            } else {
                alert('Failed to delete loan: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete loan error:', error);
            alert('Failed to delete loan: ' + error.message);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    // Handle agreement file selection
    const handleAgreementFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setUploadError('File size must be less than 10MB');
                return;
            }

            // Validate file type (PDF or Image)
            const isValidType = file.type === 'application/pdf' ||
                file.type.startsWith('image/') ||
                file.name.toLowerCase().endsWith('.pdf');

            if (!isValidType) {
                setUploadError('Please select a PDF or image file (JPEG, PNG)');
                return;
            }

            setAgreementFile(file);
            setUploadError(null);

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setAgreementPreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setAgreementPreview(null);
            }
        }
    };

    // Handle upload signed agreement
    const handleUploadAgreement = async () => {
        if (!agreementFile || !loan.id) {
            setUploadError('Please select a file to upload');
            return;
        }

        setIsUploadingAgreement(true);
        setUploadError(null);
        setUploadSuccess(false);

        try {
            // Upload the file
            const imageUrl = await uploadImage(agreementFile, API_BASE_URL);

            if (!imageUrl) {
                throw new Error('Failed to upload agreement document');
            }

            // Update loan with agreement document
            const response = await fetch(`${API_BASE_URL}/dc/loans/${loan.id}/agreement`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    loan_agreement_doc: imageUrl
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to save agreement document');
            }

            setUploadSuccess(true);
            setAgreementFile(null);
            setAgreementPreview(null);

            // Reload loan details to show updated agreement
            await loadLoanDetails();
        } catch (error) {
            console.error('Error uploading agreement:', error);
            setUploadError(error.message || 'Failed to upload agreement. Please try again.');
        } finally {
            setIsUploadingAgreement(false);
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl p-8">
                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 mt-4 text-center">Loading loan details...</p>
                </div>
            </div>
        );
    }

    const { loan: loanInfo, receivables = [] } = loanData || {};

    // Debug: Log the data structure
    console.log("=== LOAN DETAILS DEBUG ===");
    console.log("Loan data:", loanData);
    console.log("Receivables:", receivables);
    console.log("First receivable:", receivables[0]);
    console.log("First receivable receipts:", receivables[0]?.receipts);
    console.log("=== END DEBUG ===");

    const paidReceivables = receivables.filter(r => r.is_paid).length;
    const pendingReceivables = receivables.filter(r => !r.is_paid).length;
    const totalPaid = receivables.reduce((sum, r) => {
        const paidAmount = r.receipts?.reduce((s, receipt) => s + parseFloat(receipt.paid_amount || 0), 0) || 0;
        return sum + paidAmount;
    }, 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 overflow-y-auto" style={{ zIndex: 9999 }}>
            <div className="bg-white rounded-xl shadow-2xl w-full h-full max-h-[95vh] my-2 flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 rounded-t-xl">
                    <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Loan Details</h2>
                        <p className="text-sm text-gray-600">Payment schedule and collection history</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Download PDF Button */}
                        {loanInfo && loanInfo.subscriber && loanInfo.product && companies.length > 0 && (
                            <PDFDownloadLink
                                document={
                                    (() => {
                                        // Prepare subscriber data with all fields (similar to LoanDisbursementForm)
                                        const pdfSubscriber = {
                                            ...loanInfo.subscriber,
                                            // Ensure base64 format is available for PDF
                                            dc_cust_photo_base64format: loanInfo.subscriber?.dc_cust_photo_base64format || loanInfo.subscriber?.dc_cust_photo_s3_image || loanInfo.subscriber?.dc_cust_photo || '',
                                            dc_cust_aadhaar_frontside_base64format: loanInfo.subscriber?.dc_cust_aadhaar_frontside_base64format || loanInfo.subscriber?.dc_cust_aadhaar_frontside || '',
                                            dc_cust_aadhaar_backside_base64format: loanInfo.subscriber?.dc_cust_aadhaar_backside_base64format || loanInfo.subscriber?.dc_cust_aadhaar_backside || '',
                                            dc_cust_name: loanInfo.subscriber?.dc_cust_name || loanInfo.subscriber?.name || loanInfo.subscriber?.firstname || 'N/A',
                                            dc_cust_dob: loanInfo.subscriber?.dc_cust_dob || loanInfo.subscriber?.dob || null,
                                            dc_cust_age: loanInfo.subscriber?.dc_cust_age || loanInfo.subscriber?.age || null,
                                            dc_cust_phone: loanInfo.subscriber?.dc_cust_phone || '',
                                            dc_cust_address: loanInfo.subscriber?.dc_cust_address || loanInfo.subscriber?.street_name || '',
                                            dc_nominee_name: loanInfo.subscriber?.dc_nominee_name || loanInfo.subscriber?.nominee || '',
                                            dc_nominee_phone: loanInfo.subscriber?.dc_nominee_phone || ''
                                        };

                                        // Prepare company data with base64 logo
                                        const pdfCompany = {
                                            company_name: companies?.[0]?.company_name || 'MyTreasure Finance Hub',
                                            company_logo_base64format: companies?.[0]?.company_logo_base64format || companies?.[0]?.company_logo || '',
                                            company_logo: companies?.[0]?.company_logo_base64format || companies?.[0]?.company_logo || '',
                                            logo_base64format: companies?.[0]?.company_logo_base64format || companies?.[0]?.company_logo || '',
                                            contact_no: companies?.[0]?.contact_no || '',
                                            address: companies?.[0]?.address || '',
                                            companyName: companies?.[0]?.company_name || 'MyTreasure Finance Hub',
                                            name: companies?.[0]?.company_name || 'MyTreasure Finance Hub',
                                            phone: companies?.[0]?.contact_no || '',
                                            email: companies?.[0]?.email || '',
                                            district: companies?.[0]?.district || ''
                                        };

                                        // Calculate cash in hand (principal - interest)
                                        const principalAmount = parseFloat(loanInfo.principal_amount || 0);
                                        const interestRate = parseFloat(loanInfo.product?.interest_rate || 0);
                                        const interestAmount = (principalAmount * interestRate) / 100;
                                        const cashInHand = (principalAmount - interestAmount).toFixed(2);

                                        // Calculate per cycle due
                                        const perCycleDue = loanInfo.daily_due_amount || (principalAmount / (loanInfo.product?.duration || 1)).toFixed(2);

                                        return (
                                            <LoanAgreementPDF
                                                loanData={{
                                                    loan: loanInfo,
                                                    subscriber: pdfSubscriber,
                                                    product: loanInfo.product,
                                                    receivables: receivables,
                                                    cashInHand: cashInHand,
                                                    perCycleDue: perCycleDue
                                                }}
                                                companyData={pdfCompany}
                                            />
                                        );
                                    })()
                                }
                                fileName={`loan-agreement-${loanInfo?.id || 'temp'}.pdf`}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                            >
                                {({ loading }) => (
                                    <>
                                        <FiDownload className="w-4 h-4" />
                                        {loading ? 'Preparing PDF...' : 'Download PDF'}
                                    </>
                                )}
                            </PDFDownloadLink>
                        )}
                        <button
                            onClick={() => {
                                setShowUploadDialog(true);
                                setUploadError(null);
                                setUploadSuccess(false);
                            }}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <FiUpload className="w-4 h-4" />
                            Upload Agreement
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            Delete Loan
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Loan Summary */}
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-red-100 text-xs mb-1">Principal Amount</p>
                                <p className="text-2xl font-bold text-white">₹{parseFloat(loanInfo?.principal_amount || 0).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-red-100 text-xs mb-1">Outstanding Balance</p>
                                <p className="text-2xl font-bold text-white">₹{parseFloat(loanInfo?.closing_balance || 0).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-red-100 text-xs mb-1">Per Cycle Due</p>
                                <p className="text-2xl font-bold text-white">₹{parseFloat(loanInfo?.daily_due_amount || 0).toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-red-100 text-xs mb-1">Status</p>
                                <p className="text-2xl font-bold text-white">{loanInfo?.status || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-red-400 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <FiUser className="w-4 h-4" />
                                <span>{loanInfo?.subscriber?.name || loanInfo?.subscriber?.firstname || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiCalendar className="w-4 h-4" />
                                <span>Start: {loanInfo?.start_date || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FiDollarSign className="w-4 h-4" />
                                <span>{loanInfo?.product?.product_name || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Receivables Progress */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-gray-800">Collection Progress</h3>
                            <span className="text-sm text-gray-600">
                                {paidReceivables} / {receivables.length} cycles completed
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${receivables.length ? (paidReceivables / receivables.length) * 100 : 0}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-600">
                            <span>Collected: ₹{totalPaid.toFixed(2)}</span>
                            <span>Pending: {pendingReceivables} cycles</span>
                        </div>
                    </div>

                    {/* Receivables Table */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-4">Payment Schedule</h3>

                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Opening</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Due Amount</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Paid</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Carry Fwd</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Closing</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Payment Details</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {receivables.map((receivable, index) => {
                                        const paidAmount = receivable.receipts?.reduce((sum, r) => sum + parseFloat(r.paid_amount || 0), 0) || 0;
                                        const isPaid = receivable.is_paid;

                                        return (
                                            <tr key={receivable.id} className={`${isPaid ? 'bg-green-50' : ''} hover:bg-gray-50`}>
                                                <td className="px-4 py-3 text-sm">{receivable.due_date}</td>
                                                <td className="px-4 py-3 text-sm text-right">₹{parseFloat(receivable.opening_balance).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold">₹{parseFloat(receivable.due_amount).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-sm text-right text-green-600 font-semibold">
                                                    {paidAmount > 0 ? `₹${paidAmount.toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-orange-600">
                                                    {parseFloat(receivable.carry_forward) > 0 ? `₹${parseFloat(receivable.carry_forward).toFixed(2)}` : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right">₹{parseFloat(receivable.closing_balance).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {receivable.receipts && receivable.receipts.length > 0 ? (
                                                        <div className="text-xs">
                                                            {receivable.receipts.map((receipt, idx) => (
                                                                <div key={idx} className="text-green-600">
                                                                    ₹{parseFloat(receipt.paid_amount).toFixed(2)} via {receipt.payment_method}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {isPaid ? (
                                                        <FiCheckCircle className="w-5 h-5 text-green-600 inline" />
                                                    ) : (
                                                        <FiAlertCircle className="w-5 h-5 text-orange-500 inline" />
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                            {receivables.map((receivable, index) => {
                                const paidAmount = receivable.receipts?.reduce((sum, r) => sum + parseFloat(r.paid_amount || 0), 0) || 0;
                                const isPaid = receivable.is_paid;

                                return (
                                    <div
                                        key={receivable.id}
                                        className={`${isPaid ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'} border rounded-lg p-3`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-800">{receivable.due_date}</span>
                                                {isPaid ? (
                                                    <FiCheckCircle className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <FiAlertCircle className="w-4 h-4 text-orange-500" />
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500">Cycle #{index + 1}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-gray-500">Due:</span>
                                                <span className="font-semibold text-gray-800 ml-1">₹{parseFloat(receivable.due_amount).toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Paid:</span>
                                                <span className="font-semibold text-green-600 ml-1">
                                                    {paidAmount > 0 ? `₹${paidAmount.toFixed(2)}` : '-'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Opening:</span>
                                                <span className="font-semibold text-gray-800 ml-1">₹{parseFloat(receivable.opening_balance).toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Closing:</span>
                                                <span className="font-semibold text-gray-800 ml-1">₹{parseFloat(receivable.closing_balance).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* Payment Details for Mobile */}
                                        {receivable.receipts && receivable.receipts.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                <div className="text-xs text-gray-500 mb-1">Payment Details:</div>
                                                {receivable.receipts.map((receipt, idx) => (
                                                    <div key={idx} className="text-xs text-green-600 bg-green-50 rounded px-2 py-1 mb-1">
                                                        ₹{parseFloat(receipt.paid_amount).toFixed(2)} via {receipt.payment_method} on {receipt.payment_date}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Upload Agreement Dialog */}
                {showUploadDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <FiUpload className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">Upload Signed Agreement</h3>
                                            <p className="text-sm text-gray-600">Scan and upload the signed agreement document</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowUploadDialog(false);
                                            setAgreementFile(null);
                                            setAgreementPreview(null);
                                            setUploadError(null);
                                            setUploadSuccess(false);
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                                        disabled={isUploadingAgreement}
                                    >
                                        <FiX className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Success Message - Improved */}
                                {uploadSuccess && (
                                    <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <FiCheck className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-green-800">Upload Successful!</h4>
                                                <p className="text-sm text-green-700">The agreement has been uploaded and saved.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setShowUploadDialog(false);
                                                setUploadSuccess(false);
                                            }}
                                            className="w-full mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                                        >
                                            Close
                                        </button>
                                    </div>
                                )}

                                {/* Error Message - Improved */}
                                {uploadError && !uploadSuccess && (
                                    <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                                        <p className="text-sm font-medium text-red-800">{uploadError}</p>
                                    </div>
                                )}

                                {/* File Upload Section - Only show if not successful */}
                                {!uploadSuccess && (
                                    <>
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                                Select Signed Agreement (PDF/Image)
                                            </label>
                                            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${agreementFile
                                                ? 'border-blue-400 bg-blue-50'
                                                : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                                                }`}>
                                                <input
                                                    type="file"
                                                    id="agreement-file-input"
                                                    accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                                                    onChange={handleAgreementFileChange}
                                                    className="hidden"
                                                    disabled={isUploadingAgreement}
                                                />
                                                <label
                                                    htmlFor="agreement-file-input"
                                                    className={`cursor-pointer flex flex-col items-center ${isUploadingAgreement ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <FiFile className={`w-16 h-16 mb-3 ${agreementFile ? 'text-blue-600' : 'text-gray-400'}`} />
                                                    <span className={`text-sm font-medium mb-1 ${agreementFile ? 'text-blue-700' : 'text-gray-600'}`}>
                                                        {agreementFile ? agreementFile.name : 'Click to select file'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        Supports PDF, JPEG, PNG (Max 10MB)
                                                    </span>
                                                </label>
                                            </div>

                                            {/* File Preview (for images) */}
                                            {agreementPreview && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                                                    <div className="border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
                                                        <img
                                                            src={agreementPreview}
                                                            alt="Agreement preview"
                                                            className="w-full max-h-64 object-contain rounded"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* File Name Display (for PDFs) */}
                                            {agreementFile && !agreementPreview && (
                                                <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <FiFile className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{agreementFile.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {(agreementFile.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() => {
                                                    setShowUploadDialog(false);
                                                    setAgreementFile(null);
                                                    setAgreementPreview(null);
                                                    setUploadError(null);
                                                    setUploadSuccess(false);
                                                }}
                                                className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium"
                                                disabled={isUploadingAgreement}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleUploadAgreement}
                                                disabled={isUploadingAgreement || !agreementFile}
                                                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md hover:shadow-lg"
                                            >
                                                {isUploadingAgreement ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Uploading...
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiUpload className="w-5 h-5" />
                                                        Upload Agreement
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[101] p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                        <FiTrash2 className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">Delete Loan</h3>
                                        <p className="text-sm text-gray-600">This action cannot be undone</p>
                                    </div>
                                </div>

                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                    <h4 className="font-semibold text-red-800 mb-2">⚠️ Warning: This will permanently delete:</h4>
                                    <ul className="text-sm text-red-700 space-y-1">
                                        <li>• The loan record (dc_loan)</li>
                                        <li>• All receivables (dc_receivables)</li>
                                        <li>• All payment receipts (dc_receipts)</li>
                                        <li>• All related ledger entries</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <h4 className="font-semibold text-gray-800 mb-2">Loan Details:</h4>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p><strong>Subscriber:</strong> {loanInfo?.subscriber?.dc_cust_name || loanInfo?.subscriber?.name || loanInfo?.subscriber?.firstname || 'N/A'}</p>
                                        <p><strong>Amount:</strong> ₹{parseFloat(loanInfo?.principal_amount || 0).toFixed(2)}</p>
                                        <p><strong>Status:</strong> {loanInfo?.status || 'N/A'}</p>
                                        <p><strong>Receivables:</strong> {receivables.length} records</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        disabled={isDeleting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteLoan}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <FiTrash2 className="w-4 h-4" />
                                                Delete Permanently
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoanDetails;

