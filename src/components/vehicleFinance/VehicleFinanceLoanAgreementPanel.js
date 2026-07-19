import React, { useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
    FiDownload,
    FiShare2,
    FiMail,
    FiUpload,
    FiX,
    FiCheck,
    FiFile,
} from 'react-icons/fi';
import { API_BASE_URL } from '../../utils/apiConfig';
import { uploadImage } from '../../utils/uploadImage';
import { useUserContext } from '../../context/user_context';
import VehicleFinanceLoanAgreementPDF from './PDF/VehicleFinanceLoanAgreementPDF';
import {
    prepareVfPdfSubscriber,
    prepareVfPdfCompany,
    buildVfWhatsAppMessage,
    buildVfEmailContent,
} from './vfLoanAgreementUtils';

const VehicleFinanceLoanAgreementPanel = ({
    loan,
    subscriber,
    receivables = [],
    company,
    onAgreementUploaded,
    compact = false,
}) => {
    const { user } = useUserContext();
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [agreementFile, setAgreementFile] = useState(null);
    const [agreementPreview, setAgreementPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    if (!loan?.id) return null;

    const pdfSubscriber = prepareVfPdfSubscriber(subscriber);
    const pdfCompany = prepareVfPdfCompany(company);
    const installmentCount = receivables.length || loan.total_installments;
    const emiAmount = loan.installment_amount;

    const pdfDocument = (
        <VehicleFinanceLoanAgreementPDF
            loanData={{ loan, subscriber: pdfSubscriber, receivables }}
            companyData={pdfCompany}
        />
    );

    const shareOnWhatsApp = () => {
        const message = buildVfWhatsAppMessage({ loan, subscriber, emiAmount, installmentCount });
        const phone = (subscriber?.vf_cust_phone || '').replace(/\D/g, '');
        const waUrl = phone
            ? `https://wa.me/91${phone.slice(-10)}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');
    };

    const shareViaEmail = () => {
        const { subject, body } = buildVfEmailContent({ loan, subscriber, emiAmount, installmentCount });
        window.open(
            `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
            '_blank'
        );
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File size must be less than 10MB');
            return;
        }

        const isValid =
            file.type === 'application/pdf' ||
            file.type.startsWith('image/') ||
            file.name.toLowerCase().endsWith('.pdf');

        if (!isValid) {
            setUploadError('Please select a PDF or image file (JPEG, PNG)');
            return;
        }

        setAgreementFile(file);
        setUploadError(null);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setAgreementPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setAgreementPreview(null);
        }
    };

    const handleUploadAgreement = async () => {
        if (!agreementFile) {
            setUploadError('Please select a signed agreement file');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const docUrl = await uploadImage(agreementFile, API_BASE_URL);
            if (!docUrl) throw new Error('Failed to upload document');

            const res = await fetch(`${API_BASE_URL}/vf/loans/${loan.id}/agreement`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ loan_agreement_doc: docUrl }),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.message || 'Failed to save agreement');
            }

            setUploadSuccess(true);
            setAgreementFile(null);
            setAgreementPreview(null);
            onAgreementUploaded?.(result.results);
        } catch (err) {
            setUploadError(err.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const btnClass = compact
        ? 'flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors'
        : 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors';

    return (
        <>
            <div className={`grid grid-cols-2 ${compact ? 'sm:grid-cols-4' : 'sm:grid-cols-4'} gap-2`}>
                <PDFDownloadLink
                    document={pdfDocument}
                    fileName={`vehicle-loan-agreement-${loan.id}.pdf`}
                    className={`${btnClass} bg-blue-600 hover:bg-blue-700`}
                >
                    {({ loading }) => (
                        <>
                            <FiDownload className="w-4 h-4" />
                            {loading ? 'Preparing...' : 'Download PDF'}
                        </>
                    )}
                </PDFDownloadLink>

                <button type="button" onClick={shareOnWhatsApp} className={`${btnClass} bg-green-600 hover:bg-green-700`}>
                    <FiShare2 className="w-4 h-4" />
                    WhatsApp
                </button>

                <button type="button" onClick={shareViaEmail} className={`${btnClass} bg-purple-600 hover:bg-purple-700`}>
                    <FiMail className="w-4 h-4" />
                    Email
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setShowUploadDialog(true);
                        setUploadError(null);
                        setUploadSuccess(false);
                    }}
                    className={`${btnClass} bg-red-600 hover:bg-red-700`}
                >
                    <FiUpload className="w-4 h-4" />
                    Upload Signed
                </button>
            </div>

            {loan.loan_agreement_doc_s3_image && (
                <div className="text-xs text-green-700 mt-2 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1">
                        <FiCheck className="w-3.5 h-3.5" />
                        Signed agreement uploaded
                    </span>
                    <a
                        href={loan.loan_agreement_doc_s3_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        View signed copy
                    </a>
                </div>
            )}

            {showUploadDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Upload Signed Agreement</h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUploadDialog(false);
                                        setAgreementFile(null);
                                        setAgreementPreview(null);
                                        setUploadError(null);
                                        setUploadSuccess(false);
                                    }}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                    disabled={isUploading}
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">
                                Download the agreement, get it signed, then scan and upload the signed PDF or photo.
                            </p>

                            {uploadSuccess && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                                    Agreement uploaded successfully.
                                </div>
                            )}

                            {uploadError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    {uploadError}
                                </div>
                            )}

                            {!uploadSuccess && (
                                <>
                                    <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-red-400">
                                        <FiFile className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-600 block">
                                            {agreementFile ? agreementFile.name : 'Click to select PDF or image'}
                                        </span>
                                        <span className="text-xs text-gray-400">Max 10MB</span>
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            disabled={isUploading}
                                        />
                                    </label>

                                    {agreementPreview && (
                                        <img
                                            src={agreementPreview}
                                            alt="Agreement preview"
                                            className="mt-4 max-h-48 mx-auto rounded border"
                                        />
                                    )}

                                    <div className="flex gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setShowUploadDialog(false)}
                                            className="flex-1 px-4 py-2 border rounded-lg text-gray-700"
                                            disabled={isUploading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleUploadAgreement}
                                            disabled={!agreementFile || isUploading}
                                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                                        >
                                            {isUploading ? 'Uploading...' : 'Upload'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VehicleFinanceLoanAgreementPanel;
