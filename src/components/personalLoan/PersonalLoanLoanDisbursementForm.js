import React, { useEffect, useMemo, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
    FiX, FiUser, FiDollarSign, FiCalendar, FiPercent, FiInfo,
    FiCheck, FiChevronRight, FiChevronLeft, FiDownload, FiShare2, FiMail, FiUpload, FiFile,
} from 'react-icons/fi';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import { uploadImage } from '../../utils/uploadImage';
import {
    PL_LOAN_MODE_OPTIONS,
    getPlLoanMode,
    getPlLoanModeLabel,
    plLoanModeNeedsInterest,
    plLoanModeNeedsTenure,
} from '../../utils/personalLoanModes';
import { buildPersonalLoanSchedulePreview, summarizeSchedule } from '../../utils/personalLoanSchedule';
import PersonalLoanAgreementPDF from './PDF/PersonalLoanAgreementPDF';

const formatCurrency = (v) =>
    `₹${parseFloat(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PersonalLoanLoanDisbursementForm = ({ onClose, onSuccess }) => {
    const {
        subscribers,
        disburseLoan,
        fetchSubscribers,
        ledgerAccounts,
        fetchLedgerAccounts,
        companies,
        fetchCompanies,
    } = usePersonalLoanContext();
    const { user } = useUserContext();

    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showModeHelp, setShowModeHelp] = useState(false);
    const [disbursedLoan, setDisbursedLoan] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [agreementFile, setAgreementFile] = useState(null);
    const [agreementPreview, setAgreementPreview] = useState(null);
    const [isUploadingAgreement, setIsUploadingAgreement] = useState(false);
    const [agreementUploaded, setAgreementUploaded] = useState(false);

    const [formData, setFormData] = useState({
        subscriberId: '',
        loanMode: 'INTEREST_FREE',
        principalAmount: '',
        interestRate: '',
        interestDueDay: '',
        tenureMonths: '',
        disbursedDate: new Date().toISOString().split('T')[0],
        ledgerAccountId: '',
    });

    const selectedMode = getPlLoanMode(formData.loanMode);
    const needsInterest = plLoanModeNeedsInterest(formData.loanMode);
    const needsTenure = plLoanModeNeedsTenure(formData.loanMode);
    const selectedSubscriber = subscribers.find((s) => s.pl_cust_id === formData.subscriberId);

    const schedulePreview = useMemo(
        () =>
            buildPersonalLoanSchedulePreview({
                loanMode: formData.loanMode,
                principal: formData.principalAmount,
                interestRate: formData.interestRate,
                tenureMonths: formData.tenureMonths,
                disbursedDate: formData.disbursedDate,
                dueDay: formData.interestDueDay,
            }),
        [formData]
    );
    const scheduleSummary = useMemo(() => summarizeSchedule(schedulePreview), [schedulePreview]);

    useEffect(() => {
        if (subscribers.length === 0) fetchSubscribers();
        if (ledgerAccounts.length === 0) fetchLedgerAccounts();
        if (fetchCompanies && (!companies || companies.length === 0)) fetchCompanies();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.subscriberId) newErrors.subscriberId = 'Subscriber is required';
        if (!formData.principalAmount || parseFloat(formData.principalAmount) <= 0) {
            newErrors.principalAmount = 'Valid principal amount is required';
        }
        if (!formData.disbursedDate) newErrors.disbursedDate = 'Disbursement date is required';
        if (!formData.ledgerAccountId) newErrors.ledgerAccountId = 'Ledger account is required';
        if (needsInterest) {
            if (!formData.interestRate || parseFloat(formData.interestRate) <= 0) {
                newErrors.interestRate = 'Interest rate is required';
            }
            if (
                !formData.interestDueDay
                || parseInt(formData.interestDueDay, 10) < 1
                || parseInt(formData.interestDueDay, 10) > 31
            ) {
                newErrors.interestDueDay = 'Valid collection due day (1-31) is required';
            }
        }
        if (needsTenure && (!formData.tenureMonths || parseInt(formData.tenureMonths, 10) < 1)) {
            newErrors.tenureMonths = 'Tenure (months) is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const goToReview = () => {
        if (validateStep1()) setCurrentStep(2);
    };

    const approveAndCreate = async () => {
        if (!validateStep1()) {
            setCurrentStep(1);
            return;
        }
        setIsLoading(true);
        setErrors({});
        try {
            const result = await disburseLoan({
                subscriberId: formData.subscriberId,
                loanMode: formData.loanMode,
                principalAmount: formData.principalAmount,
                interestRate: needsInterest ? formData.interestRate : null,
                interestDueDay: needsInterest ? formData.interestDueDay : null,
                tenureMonths: needsTenure ? formData.tenureMonths : null,
                disbursedDate: formData.disbursedDate,
                pl_ledger_accounts_id: formData.ledgerAccountId,
            });

            if (result.success) {
                await fetchLedgerAccounts();
                setDisbursedLoan(result.data);
                setSuccessMessage('Loan disbursed and collection schedule created successfully');
                setCurrentStep(3);
            } else {
                setErrors({ submit: result.error || 'Failed to disburse loan' });
            }
        } catch (error) {
            setErrors({ submit: error.message || 'An error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    const getCompanyDataForPDF = () => {
        const plCompany = companies?.[0];
        const chitFundCompany = user?.results?.userCompany?.[0];
        if (plCompany) {
            const logo =
                plCompany.company_logo_base64format
                || plCompany.company_logo_s3_image
                || plCompany.company_logo
                || null;
            return {
                company_name: plCompany.company_name || 'Personal Loan Company',
                name: plCompany.company_name || 'Personal Loan Company',
                company_logo_base64format: logo,
                logo_base64format: logo,
                company_logo: logo,
                contact_no: plCompany.contact_no || '',
                phone: plCompany.contact_no || '',
                address: plCompany.address || '',
                street_address: plCompany.address || '',
                email: plCompany.email || '',
                registration_no: plCompany.registration_no || '',
                company_since: plCompany.company_since || '',
            };
        }
        if (chitFundCompany) {
            return {
                company_name: chitFundCompany.name || 'Company',
                name: chitFundCompany.name || 'Company',
                company_logo_base64format: chitFundCompany.logo_base64format || null,
                logo_base64format: chitFundCompany.logo_base64format || null,
                phone: chitFundCompany.phone || 'N/A',
                contact_no: chitFundCompany.phone || 'N/A',
                street_address: chitFundCompany.street_address || '',
                address: chitFundCompany.street_address || '',
                city: chitFundCompany.city || '',
                state: chitFundCompany.state || '',
                email: chitFundCompany.email || '',
                registration_no: chitFundCompany.registration_no || '',
                company_since: chitFundCompany.company_since || '',
            };
        }
        return { name: 'Personal Loan', company_name: 'Personal Loan' };
    };

    const loanForPdf = disbursedLoan?.loan || {
        id: 'PENDING',
        loan_mode: formData.loanMode,
        principal_amount: formData.principalAmount,
        interest_rate: formData.interestRate,
        tenure_months: formData.tenureMonths,
        disbursed_date: formData.disbursedDate,
    };

    const shareOnWhatsApp = () => {
        const phone = (selectedSubscriber?.pl_cust_phone || '').replace(/\D/g, '');
        const msg = `
🏦 *Personal Loan Agreement - MyTreasure*

👤 Borrower: ${selectedSubscriber?.pl_cust_name || ''}
📱 Phone: ${selectedSubscriber?.pl_cust_phone || ''}
💰 Principal: ${formatCurrency(formData.principalAmount)}
📋 Mode: ${getPlLoanModeLabel(formData.loanMode)}
📅 Disbursed: ${formData.disbursedDate}
🆔 Loan ID: ${loanForPdf.id}
📊 Installments: ${scheduleSummary.count}
💳 Total payable: ${formatCurrency(scheduleSummary.totalPayable)}

Please download the full agreement PDF from the app.
        `.trim();
        const url = phone.length >= 10
            ? `https://wa.me/91${phone.slice(-10)}?text=${encodeURIComponent(msg)}`
            : `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    const shareViaEmail = () => {
        const subject = `Personal Loan Agreement - ${selectedSubscriber?.pl_cust_name || ''} - ${loanForPdf.id}`;
        const body = `
Dear ${selectedSubscriber?.pl_cust_name || 'Customer'},

Please find your personal loan agreement details:

Loan ID: ${loanForPdf.id}
Principal: ${formatCurrency(formData.principalAmount)}
Mode: ${getPlLoanModeLabel(formData.loanMode)}
Disbursement Date: ${formData.disbursedDate}
Installments: ${scheduleSummary.count}
Total Payable: ${formatCurrency(scheduleSummary.totalPayable)}

Please download the complete agreement PDF from MyTreasure Finance Hub.

Best regards,
MyTreasure Personal Loan Team
        `.trim();
        window.open(
            `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
            '_blank'
        );
    };

    const handleAgreementSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAgreementFile(file);
        if (file.type?.startsWith('image/')) {
            setAgreementPreview(URL.createObjectURL(file));
        } else {
            setAgreementPreview(null);
        }
        setAgreementUploaded(false);
    };

    const uploadSignedAgreement = async () => {
        if (!agreementFile || !loanForPdf?.id || loanForPdf.id === 'PENDING') {
            setErrors({ submit: 'Loan must be created before uploading agreement' });
            return;
        }
        setIsUploadingAgreement(true);
        setErrors({});
        try {
            const imageUrl = await uploadImage(agreementFile, API_BASE_URL);
            if (!imageUrl) throw new Error('Failed to upload agreement document');

            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            const res = await fetch(`${API_BASE_URL}/pl/loans/${loanForPdf.id}/agreement`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    loan_agreement_doc: imageUrl,
                    membershipId,
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to save agreement document');
            }
            setAgreementUploaded(true);
            setSuccessMessage('Signed agreement uploaded and saved successfully!');
        } catch (error) {
            setErrors({ submit: error.message || 'Failed to upload agreement' });
        } finally {
            setIsUploadingAgreement(false);
        }
    };

    const finish = () => {
        if (onSuccess) onSuccess(disbursedLoan);
        if (onClose) onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-6 max-h-[95vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 rounded-t-xl">
                    <div className="flex justify-between items-start gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Disburse Personal Loan</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Step {currentStep} of 3:{' '}
                                {currentStep === 1 && 'Fill loan details'}
                                {currentStep === 2 && 'Review, approve & confirm'}
                                {currentStep === 3 && 'Loan agreement — download / share / upload'}
                            </p>
                        </div>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <FiX className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <div className={`flex-1 h-2 rounded-full ${currentStep >= 1 ? 'bg-red-500' : 'bg-gray-200'}`} />
                        <div className={`flex-1 h-2 rounded-full ${currentStep >= 2 ? 'bg-red-500' : 'bg-gray-200'}`} />
                        <div className={`flex-1 h-2 rounded-full ${currentStep >= 3 ? 'bg-red-500' : 'bg-gray-200'}`} />
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {errors.submit && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errors.submit}
                        </div>
                    )}

                    {/* STEP 1 */}
                    {currentStep === 1 && (
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FiUser className="inline w-4 h-4 mr-1" /> Subscriber *
                                </label>
                                <select
                                    name="subscriberId"
                                    value={formData.subscriberId}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg ${errors.subscriberId ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Select Subscriber</option>
                                    {subscribers.map((s) => (
                                        <option key={s.pl_cust_id} value={s.pl_cust_id}>
                                            {s.pl_cust_name} ({s.pl_cust_phone})
                                        </option>
                                    ))}
                                </select>
                                {errors.subscriberId && <p className="mt-1 text-sm text-red-600">{errors.subscriberId}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FiInfo className="inline w-4 h-4 mr-1" /> Loan / Collection Mode *
                                </label>
                                <select
                                    name="loanMode"
                                    value={formData.loanMode}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                >
                                    {PL_LOAN_MODE_OPTIONS.map((mode) => (
                                        <option key={mode.id} value={mode.id}>{mode.label}</option>
                                    ))}
                                </select>
                                <p className="mt-2 text-sm text-gray-700">{selectedMode.summary}</p>
                                <p className="mt-1 text-xs text-gray-500"><strong>Collection:</strong> {selectedMode.collection}</p>
                                <button
                                    type="button"
                                    onClick={() => setShowModeHelp((v) => !v)}
                                    className="mt-2 text-xs font-semibold text-red-600"
                                >
                                    {showModeHelp ? 'Hide explanation' : 'Show detailed explanation'}
                                </button>
                                {showModeHelp && selectedMode.details && (
                                    <div className="mt-3 rounded-xl border border-red-100 bg-red-50/60 p-4 space-y-2 text-sm text-gray-700">
                                        <p className="font-bold text-gray-900">{selectedMode.details.title}</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {selectedMode.details.points.map((p) => <li key={p}>{p}</li>)}
                                        </ul>
                                        {selectedMode.details.exampleNote && (
                                            <p className="text-xs text-gray-600">{selectedMode.details.exampleNote}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FiDollarSign className="inline w-4 h-4 mr-1" /> Principal Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="principalAmount"
                                    value={formData.principalAmount}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-4 py-2 border rounded-lg ${errors.principalAmount ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.principalAmount && <p className="mt-1 text-sm text-red-600">{errors.principalAmount}</p>}
                            </div>

                            {needsInterest && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <FiPercent className="inline w-4 h-4 mr-1" /> {selectedMode.rateLabel} *
                                        </label>
                                        <input
                                            type="number"
                                            name="interestRate"
                                            value={formData.interestRate}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            className={`w-full px-4 py-2 border rounded-lg ${errors.interestRate ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.interestRate && <p className="mt-1 text-sm text-red-600">{errors.interestRate}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <FiCalendar className="inline w-4 h-4 mr-1" /> Collection Due Day (1-31) *
                                        </label>
                                        <input
                                            type="number"
                                            name="interestDueDay"
                                            value={formData.interestDueDay}
                                            onChange={handleChange}
                                            min="1"
                                            max="31"
                                            className={`w-full px-4 py-2 border rounded-lg ${errors.interestDueDay ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {errors.interestDueDay && <p className="mt-1 text-sm text-red-600">{errors.interestDueDay}</p>}
                                    </div>
                                </>
                            )}

                            {needsTenure && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <FiCalendar className="inline w-4 h-4 mr-1" /> Tenure (months) *
                                    </label>
                                    <input
                                        type="number"
                                        name="tenureMonths"
                                        value={formData.tenureMonths}
                                        onChange={handleChange}
                                        min="1"
                                        className={`w-full px-4 py-2 border rounded-lg ${errors.tenureMonths ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.tenureMonths && <p className="mt-1 text-sm text-red-600">{errors.tenureMonths}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FiCalendar className="inline w-4 h-4 mr-1" /> Disbursement Date *
                                </label>
                                <input
                                    type="date"
                                    name="disbursedDate"
                                    value={formData.disbursedDate}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg ${errors.disbursedDate ? 'border-red-500' : 'border-gray-300'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <FiDollarSign className="inline w-4 h-4 mr-1" /> Disbursement Ledger Account *
                                </label>
                                <select
                                    name="ledgerAccountId"
                                    value={formData.ledgerAccountId}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg ${errors.ledgerAccountId ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Select Ledger Account</option>
                                    {ledgerAccounts.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.account_name} (₹{parseFloat(a.current_balance || 0).toLocaleString('en-IN')})
                                        </option>
                                    ))}
                                </select>
                                {errors.ledgerAccountId && <p className="mt-1 text-sm text-red-600">{errors.ledgerAccountId}</p>}
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={goToReview}
                                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    Continue to Review <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {currentStep === 2 && (
                        <div className="space-y-5">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                Review the loan and collection schedule below. Click <strong>Approve & Confirm</strong> to create the loan and receivables.
                            </div>

                            {/* Subscriber + Interest highlight */}
                            <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
                                            <FiUser className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Subscriber</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {selectedSubscriber?.pl_cust_name || '—'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {selectedSubscriber?.pl_cust_phone || ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="sm:text-right">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 flex items-center gap-1 sm:justify-end">
                                            <FiPercent className="h-3.5 w-3.5" /> Interest Rate
                                        </p>
                                        {needsInterest ? (
                                            <p className="text-lg font-bold text-red-700">
                                                {parseFloat(formData.interestRate || 0).toFixed(2)}%
                                                <span className="ml-1 text-xs font-medium text-gray-500">
                                                    {formData.loanMode === 'INTEREST_ONLY' ? '(monthly)' : '(annual)'}
                                                </span>
                                            </p>
                                        ) : (
                                            <p className="text-lg font-bold text-gray-700">0% · Interest-Free</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                                <p><span className="text-gray-500">Mode:</span> <strong>{selectedMode.shortLabel}</strong></p>
                                <p><span className="text-gray-500">Principal:</span> <strong>{formatCurrency(formData.principalAmount)}</strong></p>
                                {formData.loanMode === 'INTEREST_ONLY' ? (
                                    <>
                                        <p>
                                            <span className="text-gray-500">Monthly interest:</span>{' '}
                                            <strong className="text-red-700">
                                                {formatCurrency(
                                                    scheduleSummary.monthlyInterest
                                                    ?? (parseFloat(formData.principalAmount || 0)
                                                        * (parseFloat(formData.interestRate || 0) / 100))
                                                )}
                                            </strong>
                                        </p>
                                        <p>
                                            <span className="text-gray-500">Interest %:</span>{' '}
                                            <strong>{parseFloat(formData.interestRate || 0).toFixed(2)}% / month</strong>
                                        </p>
                                        <p>
                                            <span className="text-gray-500">To close anytime:</span>{' '}
                                            <strong>
                                                {formatCurrency(
                                                    parseFloat(formData.principalAmount || 0)
                                                    + (scheduleSummary.monthlyInterest
                                                        ?? (parseFloat(formData.principalAmount || 0)
                                                            * (parseFloat(formData.interestRate || 0) / 100)))
                                                )}
                                            </strong>
                                            <span className="text-gray-500"> (principal + 1 month interest)</span>
                                        </p>
                                        <p><span className="text-gray-500">Timeline:</span> <strong>Open-ended (no fixed tenure)</strong></p>
                                    </>
                                ) : (
                                    <>
                                        <p><span className="text-gray-500">Total payable:</span> <strong>{formatCurrency(scheduleSummary.totalPayable)}</strong></p>
                                        <p><span className="text-gray-500">Installments:</span> <strong>{scheduleSummary.count}</strong></p>
                                        <p><span className="text-gray-500">Interest total:</span> <strong>{formatCurrency(scheduleSummary.totalInterest)}</strong></p>
                                    </>
                                )}
                                <p><span className="text-gray-500">Disburse date:</span> <strong>{formData.disbursedDate}</strong></p>
                                {needsInterest && formData.loanMode !== 'INTEREST_ONLY' && (
                                    <p>
                                        <span className="text-gray-500">Interest %:</span>{' '}
                                        <strong>{parseFloat(formData.interestRate || 0).toFixed(2)}%</strong>
                                    </p>
                                )}
                                {needsTenure && (
                                    <p>
                                        <span className="text-gray-500">Tenure:</span>{' '}
                                        <strong>{formData.tenureMonths} months</strong>
                                    </p>
                                )}
                            </div>

                            {formData.loanMode === 'INTEREST_ONLY' && (
                                <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-950 space-y-2">
                                    <p className="font-semibold">How this bullet loan works</p>
                                    <ul className="list-disc pl-5 space-y-1 text-indigo-900">
                                        <li>
                                            Monthly interest is charged on outstanding principal
                                            ({parseFloat(formData.interestRate || 0).toFixed(2)}% per month).
                                        </li>
                                        <li>Subscriber can keep paying only interest while holding the principal — no fixed end date.</li>
                                        <li>Any payment settles interest first; leftover amount reduces principal.</li>
                                        <li>After principal reduces, next month’s interest is calculated on the new outstanding principal.</li>
                                        <li>Pay full principal + current interest anytime to close the loan.</li>
                                    </ul>
                                </div>
                            )}

                            {scheduleSummary.lastAdjusted && formData.loanMode !== 'INTEREST_ONLY' && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                                    Amounts are rounded. Any rounding gap is adjusted in the <strong>final installment</strong>
                                    {scheduleSummary.lastInstallmentTotal
                                        ? ` (${formatCurrency(scheduleSummary.lastInstallmentTotal)})`
                                        : ''}
                                    , so total principal matches the loan amount exactly.
                                </div>
                            )}

                            {formData.loanMode === 'INTEREST_ONLY' ? (
                                <div className="rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                        Closing illustration (current principal)
                                    </div>
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-white">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Component</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            <tr>
                                                <td className="px-3 py-2">Outstanding principal</td>
                                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(formData.principalAmount)}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-3 py-2">Monthly interest ({parseFloat(formData.interestRate || 0).toFixed(2)}%)</td>
                                                <td className="px-3 py-2 text-right font-semibold text-orange-700">
                                                    {formatCurrency(
                                                        scheduleSummary.monthlyInterest
                                                        ?? (parseFloat(formData.principalAmount || 0)
                                                            * (parseFloat(formData.interestRate || 0) / 100))
                                                    )}
                                                </td>
                                            </tr>
                                            <tr className="bg-red-50/50">
                                                <td className="px-3 py-2 font-semibold">Pay to close now</td>
                                                <td className="px-3 py-2 text-right font-bold text-red-700">
                                                    {formatCurrency(
                                                        parseFloat(formData.principalAmount || 0)
                                                        + (scheduleSummary.monthlyInterest
                                                            ?? (parseFloat(formData.principalAmount || 0)
                                                                * (parseFloat(formData.interestRate || 0) / 100)))
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">#</th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Due</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Principal</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Interest</th>
                                            <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {schedulePreview.slice(0, 12).map((row) => {
                                            const showAdj =
                                                scheduleSummary.lastAdjusted
                                                && row.installmentNo === schedulePreview[schedulePreview.length - 1]?.installmentNo;
                                            return (
                                                <tr key={row.installmentNo} className={showAdj ? 'bg-blue-50/60' : undefined}>
                                                    <td className="px-3 py-2">
                                                        {row.installmentNo}
                                                        {showAdj && (
                                                            <span className="ml-1 text-[10px] font-semibold text-blue-700">adj</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">{row.dueDate || '—'}</td>
                                                    <td className="px-3 py-2 text-right">{formatCurrency(row.principal)}</td>
                                                    <td className="px-3 py-2 text-right">{formatCurrency(row.interest)}</td>
                                                    <td className="px-3 py-2 text-right font-semibold">{formatCurrency(row.total)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {schedulePreview.length > 0 && (
                                        <tfoot className="bg-gray-50 border-t border-gray-200">
                                            <tr>
                                                <td className="px-3 py-2 text-xs font-semibold text-gray-600" colSpan={2}>
                                                    Total ({scheduleSummary.count} inst.)
                                                </td>
                                                <td className="px-3 py-2 text-right text-xs font-semibold">
                                                    {formatCurrency(scheduleSummary.totalPrincipal)}
                                                </td>
                                                <td className="px-3 py-2 text-right text-xs font-semibold">
                                                    {formatCurrency(scheduleSummary.totalInterest)}
                                                </td>
                                                <td className="px-3 py-2 text-right text-xs font-bold text-red-700">
                                                    {formatCurrency(scheduleSummary.totalPayable)}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                                {schedulePreview.length > 12 && (
                                    <p className="text-xs text-center text-gray-500 py-2">
                                        ... and {schedulePreview.length - 12} more installments
                                        {scheduleSummary.lastAdjusted
                                            ? ` (final #${schedulePreview.length} includes rounding adjustment)`
                                            : ''}
                                    </p>
                                )}
                            </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    <FiChevronLeft /> Back
                                </button>
                                <button
                                    type="button"
                                    onClick={approveAndCreate}
                                    disabled={isLoading}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isLoading ? 'Creating…' : (<><FiCheck /> Approve & Confirm</>)}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white text-center">
                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                                    <FiCheck className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold">Loan Created Successfully</h3>
                                {successMessage && <p className="mt-2 text-sm text-green-100">{successMessage}</p>}
                                <p className="mt-2 text-sm text-green-100">
                                    Loan ID: <strong>{loanForPdf.id}</strong>
                                </p>
                                <p className="text-sm text-green-100">
                                    Receivables: <strong>{disbursedLoan?.receivables_count || schedulePreview.length}</strong>
                                </p>
                            </div>

                            <div className="rounded-xl border-2 border-gray-200 bg-white p-5">
                                <h3 className="text-lg font-bold text-center text-gray-900 mb-1">LOAN AGREEMENT</h3>
                                <p className="text-center text-sm text-gray-500 mb-4">Personal Loan Division · MyTreasure Finance Hub</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
                                    <p><span className="text-gray-500">Borrower:</span> <strong>{selectedSubscriber?.pl_cust_name}</strong></p>
                                    <p><span className="text-gray-500">Phone:</span> <strong>{selectedSubscriber?.pl_cust_phone}</strong></p>
                                    <p><span className="text-gray-500">Mode:</span> <strong>{getPlLoanModeLabel(formData.loanMode)}</strong></p>
                                    <p><span className="text-gray-500">Principal:</span> <strong>{formatCurrency(formData.principalAmount)}</strong></p>
                                    <p><span className="text-gray-500">Total payable:</span> <strong>{formatCurrency(scheduleSummary.totalPayable)}</strong></p>
                                    <p><span className="text-gray-500">Installments:</span> <strong>{scheduleSummary.count}</strong></p>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1 border-t border-gray-100 pt-3">
                                    <p>1. Borrower agrees to repay as per the selected loan mode and schedule.</p>
                                    <p>2. Delayed payments may attract follow-up as per company policy.</p>
                                    <p>3. This agreement is subject to MyTreasure Personal Loan terms.</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <PDFDownloadLink
                                    document={
                                        <PersonalLoanAgreementPDF
                                            loan={loanForPdf}
                                            subscriber={selectedSubscriber}
                                            companyData={getCompanyDataForPDF()}
                                            schedule={schedulePreview}
                                            modeLabel={getPlLoanModeLabel(formData.loanMode)}
                                        />
                                    }
                                    fileName={`pl-loan-agreement-${loanForPdf.id}.pdf`}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    {({ loading }) => (
                                        <>
                                            <FiDownload />
                                            {loading ? 'Preparing PDF…' : 'Download PDF'}
                                        </>
                                    )}
                                </PDFDownloadLink>
                                <button
                                    type="button"
                                    onClick={shareOnWhatsApp}
                                    className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1ebe57]"
                                >
                                    <FiShare2 /> WhatsApp
                                </button>
                                <button
                                    type="button"
                                    onClick={shareViaEmail}
                                    className="inline-flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-900"
                                >
                                    <FiMail /> Email
                                </button>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <FiUpload /> Upload signed agreement
                                </h4>
                                <p className="text-xs text-gray-600 mb-3">
                                    After the customer signs the printed agreement, scan/photo and upload it here.
                                </p>
                                {!agreementUploaded ? (
                                    <div className="space-y-3">
                                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-6 hover:border-red-300">
                                            {agreementPreview ? (
                                                <>
                                                    <img src={agreementPreview} alt="Agreement preview" className="mb-2 max-h-40 rounded object-contain" />
                                                    <p className="text-sm text-gray-600">{agreementFile?.name}</p>
                                                </>
                                            ) : agreementFile ? (
                                                <>
                                                    <FiFile className="mb-2 h-8 w-8 text-red-500" />
                                                    <p className="text-sm text-gray-700 font-medium">{agreementFile.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                                                </>
                                            ) : (
                                                <>
                                                    <FiFile className="mb-2 h-8 w-8 text-gray-400" />
                                                    <p className="text-sm text-gray-600">Click to select image/PDF scan</p>
                                                </>
                                            )}
                                            <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleAgreementSelect} />
                                        </label>
                                        {agreementFile && (
                                            <button
                                                type="button"
                                                onClick={uploadSignedAgreement}
                                                disabled={isUploadingAgreement}
                                                className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                                            >
                                                {isUploadingAgreement ? 'Uploading…' : 'Upload & Save Signed Agreement'}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                                        Signed agreement uploaded successfully.
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={finish}
                                    className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalLoanLoanDisbursementForm;
