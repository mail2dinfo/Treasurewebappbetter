import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import { FiX, FiSearch, FiDollarSign, FiChevronRight, FiChevronLeft, FiCheck, FiDownload, FiPrinter, FiPhone, FiMail, FiTrendingUp, FiClock, FiPercent, FiShare2, FiUpload, FiFile } from 'react-icons/fi';
import LoanAgreementPDF from './PDF/LoanAgreementPDF';
import { uploadImage } from '../../utils/uploadImage';

const LoanDisbursementForm = ({ products, subscribers, onClose }) => {
    const { user } = useUserContext();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Form data
    const [formData, setFormData] = useState({
        subscriber_id: '',
        product_id: '',
        loan_amount: '',
        payment_method: '', // Will be selected from ledger accounts
        disbursement_date: new Date().toISOString().split('T')[0],
        first_due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        exclude_days: [], // Array of day numbers (0-6, where 0 is Sunday)
    });

    const [errors, setErrors] = useState({});
    const [generatedReceivables, setGeneratedReceivables] = useState([]);
    const [disbursedLoan, setDisbursedLoan] = useState(null);
    const [ledgerAccounts, setLedgerAccounts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [agreementFile, setAgreementFile] = useState(null);
    const [agreementPreview, setAgreementPreview] = useState(null);
    const [isUploadingAgreement, setIsUploadingAgreement] = useState(false);
    const [agreementUploaded, setAgreementUploaded] = useState(false);
    const printRef = useRef();

    // Fetch ledger accounts and companies on component mount
    useEffect(() => {
        const fetchLedgerAccounts = async () => {
            if (!user?.results?.token) return;

            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            if (!membershipId) return;

            try {
                const url = `${API_BASE_URL}/dc/ledger/accounts?parent_membership_id=${membershipId}`;
                const res = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${user.results.token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (res.ok) {
                    const data = await res.json();
                    setLedgerAccounts(data.results || []);
                }
            } catch (error) {
                console.error('Error fetching ledger accounts:', error);
            }
        };

        const fetchCompanies = async () => {
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
        };

        fetchLedgerAccounts();
        fetchCompanies();
    }, [user]);

    // Listen for loan deletion events and refresh ledger accounts (to update balances)
    useEffect(() => {
        const handleLoanDeleted = (event) => {
            const { accountBalanceUpdates } = event.detail;
            if (accountBalanceUpdates && accountBalanceUpdates.length > 0) {
                console.log('🔄 Loan deleted - refreshing ledger accounts for updated balances');
                // Refresh ledger accounts to get updated balances
                const fetchLedgerAccounts = async () => {
                    if (!user?.results?.token) return;
                    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
                    if (!membershipId) return;
                    try {
                        const url = `${API_BASE_URL}/dc/ledger/accounts?parent_membership_id=${membershipId}`;
                        const res = await fetch(url, {
                            method: 'GET',
                            headers: {
                                Authorization: `Bearer ${user.results.token}`,
                                "Content-Type": "application/json",
                            },
                        });
                        if (res.ok) {
                            const data = await res.json();
                            setLedgerAccounts(data.results || []);
                        }
                    } catch (error) {
                        console.error('Error refreshing ledger accounts:', error);
                    }
                };
                fetchLedgerAccounts();
            }
        };

        window.addEventListener('loanDeleted', handleLoanDeleted);
        return () => {
            window.removeEventListener('loanDeleted', handleLoanDeleted);
        };
    }, [user]);

    // Get selected data - Handle both DC subscribers (dc_cust_id) and legacy subscribers (id)
    const selectedSubscriber = subscribers.find(s =>
        s.dc_cust_id === formData.subscriber_id || s.id === formData.subscriber_id
    );
    const selectedProduct = products.find(p => p.id === formData.product_id);

    // Calculate cash in hand (loan amount - interest deduction)
    const cashInHand = useMemo(() => {
        if (!formData.loan_amount || !selectedProduct) return 0;

        const amount = parseFloat(formData.loan_amount);
        const interestRate = parseFloat(selectedProduct.interest_rate || 0);
        const interestAmount = (amount * interestRate) / 100;

        return (amount - interestAmount).toFixed(2);
    }, [formData.loan_amount, selectedProduct]);

    // Calculate per cycle due
    const perCycleDue = useMemo(() => {
        if (!formData.loan_amount || !selectedProduct) return 0;
        return (parseFloat(formData.loan_amount) / selectedProduct.duration).toFixed(2);
    }, [formData.loan_amount, selectedProduct]);

    // Filter subscribers based on search - Handle both DC subscribers and legacy subscribers
    const filteredSubscribers = useMemo(() => {
        if (!searchTerm) return subscribers;

        const term = searchTerm.toLowerCase();
        return subscribers.filter(sub => {
            // DC subscriber fields
            const name = sub.dc_cust_name || sub.name || sub.firstname || '';
            const phone = sub.dc_cust_phone || sub.phone || '';
            return name.toLowerCase().includes(term) || phone.includes(term);
        });
    }, [subscribers, searchTerm]);

    // Day names
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Dummy repayment statistics (will be replaced with real data later)
    const getRepaymentStats = (subscriberId) => {
        // Mock data - replace with actual API call later
        return {
            totalLoans: Math.floor(Math.random() * 5) + 1,
            completedLoans: Math.floor(Math.random() * 3) + 1,
            activeLoans: Math.floor(Math.random() * 2) + 1,
            onTimePayments: Math.floor(Math.random() * 20) + 15,
            latePayments: Math.floor(Math.random() * 5),
            averageDelay: Math.floor(Math.random() * 3) + 1,
            creditScore: Math.floor(Math.random() * 300) + 700, // 700-1000
            lastLoanDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            totalAmountBorrowed: (Math.random() * 100000 + 10000).toFixed(0),
            totalAmountRepaid: (Math.random() * 80000 + 5000).toFixed(0)
        };
    };

    // Toggle exclude day
    const toggleExcludeDay = (dayNumber) => {
        setFormData(prev => ({
            ...prev,
            exclude_days: prev.exclude_days.includes(dayNumber)
                ? prev.exclude_days.filter(d => d !== dayNumber)
                : [...prev.exclude_days, dayNumber]
        }));
    };

    // Handle agreement file selection
    const handleAgreementFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setErrors({ general: 'File size must be less than 10MB' });
                return;
            }

            setAgreementFile(file);

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

            setErrors({});
        }
    };

    // Handle upload signed agreement
    const handleUploadAgreement = async () => {
        if (!agreementFile || !disbursedLoan?.loan?.id) {
            setErrors({ general: 'Please select a file to upload' });
            return;
        }

        setIsUploadingAgreement(true);
        setErrors({});

        try {
            // Upload the file
            const imageUrl = await uploadImage(agreementFile, API_BASE_URL);

            if (!imageUrl) {
                throw new Error('Failed to upload agreement document');
            }

            // Update loan with agreement document
            const response = await fetch(`${API_BASE_URL}/dc/loans/${disbursedLoan.loan.id}/agreement`, {
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

            setAgreementUploaded(true);
            setSuccessMessage('Signed agreement uploaded and saved successfully!');
        } catch (error) {
            console.error('Error uploading agreement:', error);
            setErrors({ general: error.message || 'Failed to upload agreement. Please try again.' });
        } finally {
            setIsUploadingAgreement(false);
        }
    };

    // Generate receivables for Step 2 with proper carry-forward logic
    const generateReceivablesPreview = () => {
        console.log('🔄 Generating receivables preview...');
        console.log('Selected product:', selectedProduct);
        console.log('Loan amount:', formData.loan_amount);
        console.log('First due date:', formData.first_due_date);

        if (!selectedProduct || !formData.loan_amount || !formData.first_due_date) {
            console.log('❌ Missing required fields');
            setErrors({ general: 'Please fill all required fields' });
            return;
        }

        const receivables = [];
        let currentBalance = parseFloat(formData.loan_amount);
        let currentDate = new Date(formData.first_due_date);
        let cycleCount = 0;
        let carryForward = 0; // Track carry-forward amount

        while (cycleCount < selectedProduct.duration) {
            const dayOfWeek = currentDate.getDay();

            // Skip if this day is excluded
            if (!formData.exclude_days.includes(dayOfWeek)) {
                // Calculate due amount: regular due + carry forward from previous day
                const regularDue = parseFloat(perCycleDue);
                const totalDueAmount = regularDue + carryForward;

                // Calculate closing balance (assuming full payment for preview)
                const closingBalance = currentBalance - totalDueAmount;

                receivables.push({
                    day_no: cycleCount + 1,
                    due_date: currentDate.toISOString().split('T')[0],
                    opening_balance: currentBalance.toFixed(2),
                    due_amount: totalDueAmount.toFixed(2),
                    carry_forward: 0, // Reset carry forward for preview (assuming full payment)
                    closing_balance: closingBalance.toFixed(2),
                    regular_due: regularDue.toFixed(2), // Regular due amount
                    carry_forward_amount: carryForward.toFixed(2), // Show carry forward amount
                });

                // Update for next iteration
                currentBalance = closingBalance;
                carryForward = 0; // Reset carry forward (assuming full payment in preview)
                cycleCount++;
            }

            // Increment date
            if (selectedProduct.frequency === 'DAILY') {
                currentDate.setDate(currentDate.getDate() + 1);
            } else {
                currentDate.setDate(currentDate.getDate() + 7);
            }
        }

        console.log('✅ Generated receivables:', receivables);
        console.log('✅ Generated receivables count:', receivables.length);
        setGeneratedReceivables(receivables);
        console.log('🚀 Moving to Step 3');
        setCurrentStep(3);
    };

    // Step 1 validation (only subscriber selection)
    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.subscriber_id) newErrors.subscriber_id = 'Please select a subscriber';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Step 2 validation (loan details)
    const validateStep2 = () => {
        console.log('🔍 Validating Step 2...');
        console.log('Form data for validation:', {
            product_id: formData.product_id,
            loan_amount: formData.loan_amount,
            disbursement_date: formData.disbursement_date,
            first_due_date: formData.first_due_date
        });

        const newErrors = {};

        if (!formData.product_id) newErrors.product_id = 'Please select a product';
        if (!formData.loan_amount || parseFloat(formData.loan_amount) <= 0) {
            newErrors.loan_amount = 'Please enter a valid amount';
        }
        if (!formData.disbursement_date) newErrors.disbursement_date = 'Please select disbursement date';
        if (!formData.first_due_date) newErrors.first_due_date = 'Please select first due date';

        console.log('Validation errors:', newErrors);
        setErrors(newErrors);
        const isValid = Object.keys(newErrors).length === 0;
        console.log('Step 2 validation result:', isValid);
        return isValid;
    };

    // Handle continue from Step 1
    const handleContinueFromStep1 = () => {
        if (validateStep1()) {
            setCurrentStep(2);
        }
    };

    // Handle continue from Step 2
    const handleContinueFromStep2 = () => {
        console.log('🚀 Step 2 Continue clicked');
        console.log('Form data:', formData);
        console.log('Selected product:', selectedProduct);

        if (validateStep2()) {
            console.log('✅ Step 2 validation passed, generating receivables preview...');
            // Just generate receivables preview, don't create loan yet
            generateReceivablesPreview();
        } else {
            console.log('❌ Step 2 validation failed');
        }
    };

    // Approve and create loan in database (Step 3)
    const approveAndCreateInDB = async () => {
        console.log('🚀 Approving and creating loan in database...');
        console.log('Current step:', currentStep);
        console.log('Generated receivables:', generatedReceivables);
        console.log('Generated receivables length:', generatedReceivables?.length);

        setIsLoading(true);

        try {
            // Validate required fields
            const requiredFields = ['subscriber_id', 'product_id', 'loan_amount', 'disbursement_date', 'first_due_date'];
            const missingFields = requiredFields.filter(field => !formData[field]);

            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Validate receivables
            if (!generatedReceivables || generatedReceivables.length === 0) {
                throw new Error('No receivables generated. Please go back to Step 2 and generate receivables first.');
            }

            console.log('✅ Validation passed. Generated receivables count:', generatedReceivables.length);

            // Prepare loan data according to improved backend API structure
            const loanPayload = {
                subscriberId: formData.subscriber_id,
                productId: formData.product_id,
                principalAmount: parseFloat(formData.loan_amount),
                cashInHand: parseFloat(cashInHand), // Use the computed cashInHand (loan amount - interest)
                loanMode: formData.loan_mode || selectedProduct?.frequency,
                paymentMethod: formData.payment_method,
                membershipId: user?.results?.userAccounts?.[0]?.parent_membership_id,
                // Dates from frontend
                loanDisbursementDate: formData.disbursement_date,
                loanDueStartDate: formData.first_due_date,
                // Receivables from frontend
                receivables: generatedReceivables
            };

            console.log('Loan payload to send to backend:', loanPayload);

            // Check API URL
            const apiUrl = `${API_BASE_URL}/dc/loans/disburse`;

            // Call existing backend API: POST /dc/loans/disburse
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loanPayload)
            });

            console.log('API response status:', response.status);

            if (!response.ok) {
                console.error('❌ HTTP Error:', response.status, response.statusText);
                const errorResult = await response.json();
                console.error('❌ Error response:', errorResult);
                throw new Error(errorResult.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('API response:', result);

            // Check for success using the actual backend response structure
            if (result.error === false && result.code === 200) {
                console.log('✅ Loan and receivables created successfully in database:', result);

                // Backend response structure:
                // {
                //   message: "Loan disbursed successfully and receivables generated",
                //   error: false,
                //   code: 200,
                //   results: {
                //     loan: { id: "uuid", ... },
                //     receivables_count: 30
                //   }
                // }

                setDisbursedLoan(result.results);
                setSuccessMessage(result.message || 'Loan disbursed successfully and receivables generated');
                setErrors({}); // Clear any previous errors
                setCurrentStep(4); // Move to Step 4 for download/share options
            } else {
                console.error('❌ API returned error=true or invalid response:', result);
                setErrors({ general: result.message || 'API returned error=true' });
            }
        } catch (error) {
            console.error('❌ Error creating loan and receivables:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            setErrors({ general: error.message || 'Failed to create loan and receivables. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };


    // PDF generation is now handled by PDFDownloadLink component with @react-pdf/renderer

    // Print function
    const handlePrint = () => {
        window.print();
    };

    // WhatsApp sharing function
    const shareOnWhatsApp = () => {
        const loanDetails = `
🏦 *Loan Agreement - MyTreasure Finance Hub*

👤 *Borrower:* ${selectedSubscriber?.dc_cust_name || selectedSubscriber?.name || selectedSubscriber?.firstname}
📱 *Phone:* ${selectedSubscriber?.dc_cust_phone || selectedSubscriber?.phone || ''}
💰 *Loan Amount:* ₹${parseFloat(formData.loan_amount).toFixed(2)}
📋 *Product:* ${selectedProduct?.product_name}
📅 *Disbursement Date:* ${formData.disbursement_date}
📊 *Total Installments:* ${generatedReceivables.length}
💳 *Per Cycle Due:* ₹${perCycleDue}

Loan ID: ${disbursedLoan?.loan?.id}

Please download the complete agreement from the app.
        `.trim();

        const encodedMessage = encodeURIComponent(loanDetails);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    // Email sharing function
    const shareViaEmail = () => {
        const subject = `Loan Agreement - ${selectedSubscriber?.name || selectedSubscriber?.firstname} - ${selectedProduct?.product_name}`;
        const body = `
Dear ${selectedSubscriber?.name || selectedSubscriber?.firstname},

Please find attached your loan agreement details:

Loan ID: ${disbursedLoan?.loan?.id}
Loan Amount: ₹${parseFloat(formData.loan_amount).toFixed(2)}
Product: ${selectedProduct?.product_name}
Disbursement Date: ${formData.disbursement_date}
Total Installments: ${generatedReceivables.length}
Per Cycle Due: ₹${perCycleDue}

Please download the complete agreement from the MyTreasure Finance Hub app.

Best regards,
MyTreasure Finance Hub Team
        `.trim();

        const mailtoUrl = `mailto:${selectedSubscriber?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Loan Disbursement Form</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Step {currentStep} of 4: {
                                    currentStep === 1 ? 'Choose Subscriber' :
                                        currentStep === 2 ? 'Loan Details' :
                                            currentStep === 3 ? 'Review & Approve' :
                                                'Download & Share Agreement'
                                }
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={isLoading}
                        >
                            <FiX className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-2 mt-4">
                        <div className={`flex-1 h-2 rounded-full ${currentStep >= 1 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${currentStep >= 2 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${currentStep >= 3 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                        <div className={`flex-1 h-2 rounded-full ${currentStep >= 4 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                    </div>
                </div>

                <div className="p-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                    {/* STEP 1: Choose Subscriber */}
                    {currentStep === 1 && (
                        <div className="space-y-5">
                            {/* Subscriber Selection with Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Choose Subscriber <span className="text-red-500">*</span>
                                </label>

                                {/* Search Box */}
                                <div className="relative mb-3">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Subscriber List */}
                                <div className="border border-gray-300 rounded-lg max-h-96 overflow-y-auto">
                                    {filteredSubscribers.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500 text-sm">No subscribers found</div>
                                    ) : (
                                        filteredSubscribers.map((sub) => {
                                            // Handle both DC subscribers (dc_cust_id) and legacy subscribers (id)
                                            const subscriberId = sub.dc_cust_id || sub.id;
                                            const subscriberName = sub.dc_cust_name || sub.name || sub.firstname || 'N/A';
                                            const subscriberPhone = sub.dc_cust_phone || sub.phone || '';
                                            const stats = getRepaymentStats(subscriberId);
                                            const isSelected = formData.subscriber_id === subscriberId;

                                            return (
                                                <div
                                                    key={subscriberId}
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, subscriber_id: subscriberId }));
                                                        setErrors(prev => ({ ...prev, subscriber_id: '' }));
                                                    }}
                                                    className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
                                                >
                                                    <div className="flex items-start gap-4">
                                                        {/* Avatar */}
                                                        {sub.dc_cust_photo_s3_image ? (
                                                            <img
                                                                src={sub.dc_cust_photo_s3_image}
                                                                alt={subscriberName}
                                                                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                                                                {subscriberName.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}

                                                        {/* Main Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h3 className="font-semibold text-gray-900 text-lg">{subscriberName}</h3>
                                                                {isSelected && (
                                                                    <FiCheck className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                                                {subscriberPhone && (
                                                                    <div className="flex items-center gap-1">
                                                                        <FiPhone className="w-4 h-4" />
                                                                        <span>{subscriberPhone}</span>
                                                                    </div>
                                                                )}
                                                                {sub.dc_cust_address && (
                                                                    <div className="flex items-center gap-1">
                                                                        <FiMail className="w-4 h-4" />
                                                                        <span className="truncate max-w-xs">{sub.dc_cust_address}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Repayment Stats */}
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                                <div className="bg-green-50 rounded-lg p-2">
                                                                    <div className="flex items-center gap-1 mb-1">
                                                                        <FiTrendingUp className="w-3 h-3 text-green-600" />
                                                                        <span className="font-medium text-green-800">Credit Score</span>
                                                                    </div>
                                                                    <p className="text-green-700 font-bold">{stats.creditScore}</p>
                                                                </div>

                                                                <div className="bg-blue-50 rounded-lg p-2">
                                                                    <div className="flex items-center gap-1 mb-1">
                                                                        <FiCheck className="w-3 h-3 text-blue-600" />
                                                                        <span className="font-medium text-blue-800">Completed</span>
                                                                    </div>
                                                                    <p className="text-blue-700 font-bold">{stats.completedLoans}/{stats.totalLoans}</p>
                                                                </div>

                                                                <div className="bg-orange-50 rounded-lg p-2">
                                                                    <div className="flex items-center gap-1 mb-1">
                                                                        <FiClock className="w-3 h-3 text-orange-600" />
                                                                        <span className="font-medium text-orange-800">On Time</span>
                                                                    </div>
                                                                    <p className="text-orange-700 font-bold">{stats.onTimePayments}</p>
                                                                </div>

                                                                <div className="bg-purple-50 rounded-lg p-2">
                                                                    <div className="flex items-center gap-1 mb-1">
                                                                        <FiPercent className="w-3 h-3 text-purple-600" />
                                                                        <span className="font-medium text-purple-800">Avg Delay</span>
                                                                    </div>
                                                                    <p className="text-purple-700 font-bold">{stats.averageDelay} days</p>
                                                                </div>
                                                            </div>

                                                            {/* Additional Stats */}
                                                            <div className="mt-2 text-xs text-gray-500">
                                                                <span>Total Borrowed: ₹{stats.totalAmountBorrowed} | </span>
                                                                <span>Repaid: ₹{stats.totalAmountRepaid} | </span>
                                                                <span>Last Loan: {new Date(stats.lastLoanDate).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                {errors.subscriber_id && (
                                    <p className="mt-1 text-sm text-red-500">{errors.subscriber_id}</p>
                                )}
                            </div>

                        </div>
                    )}

                    {/* STEP 2: Loan Details */}
                    {currentStep === 2 && (
                        <div className="space-y-5">
                            {/* Selected Subscriber Header */}
                            {selectedSubscriber && (
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar - Handle both DC subscribers and legacy subscribers */}
                                        {selectedSubscriber.dc_cust_photo_s3_image ? (
                                            <img
                                                src={selectedSubscriber.dc_cust_photo_s3_image}
                                                alt={selectedSubscriber.dc_cust_name || selectedSubscriber.name || selectedSubscriber.firstname}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                                {(selectedSubscriber.dc_cust_name || selectedSubscriber.name || selectedSubscriber.firstname || 'U').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-blue-900">
                                                {selectedSubscriber.dc_cust_name || selectedSubscriber.name || selectedSubscriber.firstname || 'N/A'}
                                            </h3>
                                            <div className="flex items-center gap-4 text-blue-700 mt-1">
                                                {(selectedSubscriber.dc_cust_phone || selectedSubscriber.phone) && (
                                                    <div className="flex items-center gap-1">
                                                        <FiPhone className="w-4 h-4" />
                                                        <span>{selectedSubscriber.dc_cust_phone || selectedSubscriber.phone}</span>
                                                    </div>
                                                )}
                                                {selectedSubscriber.dc_cust_address && (
                                                    <div className="flex items-center gap-1">
                                                        <FiMail className="w-4 h-4" />
                                                        <span className="truncate max-w-xs">{selectedSubscriber.dc_cust_address}</span>
                                                    </div>
                                                )}
                                                {selectedSubscriber.email && !selectedSubscriber.dc_cust_address && (
                                                    <div className="flex items-center gap-1">
                                                        <FiMail className="w-4 h-4" />
                                                        <span>{selectedSubscriber.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Product Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Loan Product <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.product_id}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, product_id: e.target.value }));
                                        setErrors(prev => ({ ...prev, product_id: '' }));
                                    }}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.product_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">-- Select Product --</option>
                                    {products.map((prod) => (
                                        <option key={prod.id} value={prod.id}>
                                            {prod.product_name} ({prod.frequency} - {prod.duration} cycles)
                                            {prod.interest_rate ? ` - ${prod.interest_rate}% interest` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.product_id && (
                                    <p className="mt-1 text-sm text-red-500">{errors.product_id}</p>
                                )}
                            </div>

                            {/* Loan Amount & Cash in Hand */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loan Amount <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500">₹</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.loan_amount}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, loan_amount: e.target.value }));
                                                setErrors(prev => ({ ...prev, loan_amount: '' }));
                                            }}
                                            className={`w-full pl-8 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.loan_amount ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="10000"
                                            step="0.01"
                                        />
                                    </div>
                                    {errors.loan_amount && (
                                        <p className="mt-1 text-sm text-red-500">{errors.loan_amount}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Method <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.payment_method}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, payment_method: e.target.value }));
                                            setErrors(prev => ({ ...prev, payment_method: '' }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.payment_method ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select Payment Method</option>
                                        {ledgerAccounts.map((account) => (
                                            <option key={account.id} value={account.account_name}>
                                                {account.account_name} (Balance: ₹{Number(account.current_balance).toLocaleString("en-IN")})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.payment_method && (
                                        <p className="mt-1 text-sm text-red-500">{errors.payment_method}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Cash in Hand
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500">₹</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={cashInHand}
                                            readOnly
                                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg bg-green-50 font-semibold text-green-700"
                                        />
                                    </div>
                                    {selectedProduct?.interest_rate && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Interest deducted: ₹{(parseFloat(formData.loan_amount || 0) - parseFloat(cashInHand)).toFixed(2)} ({selectedProduct.interest_rate}%)
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loan Disbursement Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.disbursement_date}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, disbursement_date: e.target.value }));
                                            setErrors(prev => ({ ...prev, disbursement_date: '' }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.disbursement_date ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.disbursement_date && (
                                        <p className="mt-1 text-sm text-red-500">{errors.disbursement_date}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Loan First Due Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.first_due_date}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, first_due_date: e.target.value }));
                                            setErrors(prev => ({ ...prev, first_due_date: '' }));
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.first_due_date ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.first_due_date && (
                                        <p className="mt-1 text-sm text-red-500">{errors.first_due_date}</p>
                                    )}
                                </div>
                            </div>

                            {/* Exclude Days */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Exclude Days (Optional)
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                                    {dayNames.map((day, index) => (
                                        <label
                                            key={index}
                                            className={`flex items-center justify-center gap-2 px-3 py-2.5 border-2 rounded-lg cursor-pointer transition-all ${formData.exclude_days.includes(index)
                                                ? 'border-red-500 bg-red-50 text-red-700 font-semibold'
                                                : 'border-gray-300 hover:border-gray-400 text-gray-700'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.exclude_days.includes(index)}
                                                onChange={() => toggleExcludeDay(index)}
                                                className="hidden"
                                            />
                                            <span className="text-sm">{day.substring(0, 3)}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    Selected days will be skipped in receivables generation
                                </p>
                            </div>

                            {/* Summary Preview */}
                            {selectedProduct && formData.loan_amount && (
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                                    <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                        <FiDollarSign className="w-5 h-5" />
                                        Loan Summary
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <p className="text-blue-700 mb-1">Loan Amount</p>
                                            <p className="font-bold text-blue-900 text-lg">₹{parseFloat(formData.loan_amount).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-blue-700 mb-1">Cash in Hand</p>
                                            <p className="font-bold text-green-700 text-lg">₹{cashInHand}</p>
                                        </div>
                                        <div>
                                            <p className="text-blue-700 mb-1">Per Cycle Due</p>
                                            <p className="font-bold text-blue-900 text-lg">₹{perCycleDue}</p>
                                        </div>
                                        <div>
                                            <p className="text-blue-700 mb-1">Total Cycles</p>
                                            <p className="font-bold text-blue-900 text-lg">{selectedProduct.duration}</p>
                                        </div>
                                        <div>
                                            <p className="text-blue-700 mb-1">Frequency</p>
                                            <p className="font-bold text-blue-900 text-lg">{selectedProduct.frequency}</p>
                                        </div>
                                        <div>
                                            <p className="text-blue-700 mb-1">Excluded Days</p>
                                            <p className="font-bold text-blue-900 text-lg">{formData.exclude_days.length}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Display for Step 2 */}
                            {errors.general && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">
                                        ❌ {errors.general}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: Review Receivables */}
                    {currentStep === 3 && (
                        <div className="space-y-5">
                            {/* Subscriber & Loan Details Header */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                                <div className="flex items-start gap-4">
                                    {/* Subscriber Avatar - Handle both DC subscribers and legacy subscribers */}
                                    {selectedSubscriber?.dc_cust_photo_s3_image ? (
                                        <img
                                            src={selectedSubscriber.dc_cust_photo_s3_image}
                                            alt={selectedSubscriber.dc_cust_name || selectedSubscriber.name || selectedSubscriber.firstname}
                                            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                                            {(selectedSubscriber?.dc_cust_name || selectedSubscriber?.name || selectedSubscriber?.firstname || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    {/* Subscriber Info */}
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-blue-900 mb-2">
                                            {selectedSubscriber?.dc_cust_name || selectedSubscriber?.name || selectedSubscriber?.firstname || 'N/A'}
                                        </h3>
                                        <div className="flex items-center gap-4 text-blue-700 mb-3">
                                            {(selectedSubscriber?.dc_cust_phone || selectedSubscriber?.phone) && (
                                                <div className="flex items-center gap-1">
                                                    <FiPhone className="w-4 h-4" />
                                                    <span className="font-medium">{selectedSubscriber?.dc_cust_phone || selectedSubscriber?.phone}</span>
                                                </div>
                                            )}
                                            {selectedSubscriber?.dc_cust_address && (
                                                <div className="flex items-center gap-1">
                                                    <FiMail className="w-4 h-4" />
                                                    <span className="font-medium truncate max-w-xs">{selectedSubscriber.dc_cust_address}</span>
                                                </div>
                                            )}
                                            {selectedSubscriber?.email && !selectedSubscriber?.dc_cust_address && (
                                                <div className="flex items-center gap-1">
                                                    <FiMail className="w-4 h-4" />
                                                    <span className="font-medium">{selectedSubscriber.email}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Loan Details */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                                                <p className="text-blue-600 font-medium mb-1">Product</p>
                                                <p className="font-bold text-blue-900">{selectedProduct?.product_name}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                                                <p className="text-blue-600 font-medium mb-1">Loan Amount</p>
                                                <p className="font-bold text-blue-900">₹{parseFloat(formData.loan_amount).toFixed(2)}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                                                <p className="text-blue-600 font-medium mb-1">Cash in Hand</p>
                                                <p className="font-bold text-green-700">₹{cashInHand}</p>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 border border-blue-200">
                                                <p className="text-blue-600 font-medium mb-1">Per Cycle</p>
                                                <p className="font-bold text-blue-900">₹{perCycleDue}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Approval Status */}
                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                        <FiCheck className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold">Ready for Approval</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                        <p className="text-green-100 mb-1">Total Receivables</p>
                                        <p className="font-semibold text-lg">{generatedReceivables.length} cycles</p>
                                    </div>
                                    <div>
                                        <p className="text-green-100 mb-1">Frequency</p>
                                        <p className="font-semibold">{selectedProduct?.frequency}</p>
                                    </div>
                                    <div>
                                        <p className="text-green-100 mb-1">Excluded Days</p>
                                        <p className="font-semibold">{formData.exclude_days.length} days</p>
                                    </div>
                                    <div>
                                        <p className="text-green-100 mb-1">First Due</p>
                                        <p className="font-semibold">{formData.first_due_date}</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
                                    <p className="text-sm text-green-100">
                                        📋 Review the payment schedule below and click "Approve & Create" to create the loan and all receivables.
                                    </p>
                                </div>
                            </div>

                            {/* Receivables Preview */}
                            <div>
                                <h4 className="font-semibold text-gray-800 mb-3">
                                    Payment Schedule ({generatedReceivables.length} Receivables)
                                </h4>

                                {/* Desktop Table */}
                                <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Day</th>
                                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Due Date</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Opening Balance</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Regular Due</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Carry Forward</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total Due</th>
                                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Closing Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {generatedReceivables.map((rec, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-gray-600 font-medium">#{rec.day_no}</td>
                                                    <td className="px-4 py-2 text-gray-800">{rec.due_date}</td>
                                                    <td className="px-4 py-2 text-right text-gray-600">₹{rec.opening_balance}</td>
                                                    <td className="px-4 py-2 text-right text-blue-600">₹{rec.regular_due}</td>
                                                    <td className="px-4 py-2 text-right text-orange-600">₹{rec.carry_forward_amount}</td>
                                                    <td className="px-4 py-2 text-right font-semibold text-gray-800">₹{rec.due_amount}</td>
                                                    <td className="px-4 py-2 text-right text-gray-600">₹{rec.closing_balance}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-2 max-h-96 overflow-y-auto">
                                    {generatedReceivables.map((rec, idx) => (
                                        <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-gray-800">Day #{rec.day_no}</span>
                                                <span className="text-sm text-gray-600">{rec.due_date}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                                <div>
                                                    <span className="text-gray-500">Opening Balance:</span>
                                                    <p className="font-semibold text-gray-800">₹{rec.opening_balance}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Total Due:</span>
                                                    <p className="font-semibold text-gray-800">₹{rec.due_amount}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-blue-600">Regular Due:</span>
                                                    <p className="font-semibold text-blue-700">₹{rec.regular_due}</p>
                                                </div>
                                                <div>
                                                    <span className="text-orange-600">Carry Forward:</span>
                                                    <p className="font-semibold text-orange-700">₹{rec.carry_forward_amount}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-500 text-xs">Closing Balance:</span>
                                                    <span className="font-semibold text-gray-800">₹{rec.closing_balance}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-800">
                                        ℹ️ {generatedReceivables.length} receivables will be created
                                        {formData.exclude_days.length > 0 && (
                                            <span> (excluding {formData.exclude_days.map(d => dayNames[d].substring(0, 3)).join(', ')})</span>
                                        )}
                                    </p>
                                </div>

                                {/* Error Display */}
                                {errors.general && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-800">
                                            ❌ {errors.general}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Download & Share Agreement */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            {/* Success Message */}
                            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white text-center">
                                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiCheck className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Loan & Receivables Created Successfully!</h3>
                                {successMessage && (
                                    <p className="text-green-100 mb-3 text-sm">
                                        ✅ {successMessage}
                                    </p>
                                )}
                                <p className="text-green-100 mb-2">
                                    Loan ID: <span className="font-semibold">{disbursedLoan?.loan?.id || 'N/A'}</span>
                                </p>
                                <p className="text-green-100">
                                    Receivables: <span className="font-semibold">{disbursedLoan?.receivables_count || generatedReceivables.length} cycles created</span>
                                </p>
                            </div>

                            {/* Loan Agreement Preview */}
                            <div ref={printRef} className="bg-white border-2 border-gray-200 rounded-lg p-6 print:border-0 print:shadow-none">
                                {/* Print-only styles */}
                                <style jsx>{`
                                    @media print {
                                        .no-print { display: none !important; }
                                        body { margin: 0; }
                                        .print-page { 
                                            page-break-inside: avoid;
                                            margin: 0;
                                            padding: 20px;
                                        }
                                    }
                                `}</style>

                                {/* Header */}
                                <div className="text-center mb-6 print-page">
                                    <h1 className="text-2xl font-bold text-gray-800 mb-2">LOAN AGREEMENT</h1>
                                    <div className="text-sm text-gray-600">
                                        <p>MyTreasure Finance Hub</p>
                                        <p>Daily Collection Division</p>
                                        <p>Date: {new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>

                                {/* Loan Details */}
                                <div className="mb-6 print-page">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                                        LOAN DETAILS
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium text-gray-600">Loan ID:</span>
                                            <span className="ml-2 text-gray-800">{disbursedLoan?.loan?.id || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Subscriber:</span>
                                            <span className="ml-2 text-gray-800">{selectedSubscriber?.dc_cust_name || selectedSubscriber?.name || selectedSubscriber?.firstname || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Phone:</span>
                                            <span className="ml-2 text-gray-800">{selectedSubscriber?.dc_cust_phone || selectedSubscriber?.phone || 'N/A'}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Product:</span>
                                            <span className="ml-2 text-gray-800">{selectedProduct?.product_name}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Loan Amount:</span>
                                            <span className="ml-2 text-gray-800 font-semibold">₹{parseFloat(formData.loan_amount).toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Cash in Hand:</span>
                                            <span className="ml-2 text-green-600 font-semibold">₹{cashInHand}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Interest Rate:</span>
                                            <span className="ml-2 text-gray-800">{selectedProduct?.interest_rate || 0}%</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Disbursement Date:</span>
                                            <span className="ml-2 text-gray-800">{formData.disbursement_date}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">First Due Date:</span>
                                            <span className="ml-2 text-gray-800">{formData.first_due_date}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Total Installments:</span>
                                            <span className="ml-2 text-gray-800 font-semibold">{generatedReceivables.length}</span>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Per Cycle Due:</span>
                                            <span className="ml-2 text-gray-800 font-semibold">₹{perCycleDue}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Schedule */}
                                <div className="mb-6 print-page">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                                        PAYMENT SCHEDULE
                                    </h2>

                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-sm border border-gray-300">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Day</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Due Date</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Opening Balance</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Regular Due</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Carry Forward</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Total Due</th>
                                                    <th className="border border-gray-300 px-3 py-2 text-right font-semibold">Closing Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {generatedReceivables.slice(0, 15).map((rec, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="border border-gray-300 px-3 py-2">#{rec.day_no}</td>
                                                        <td className="border border-gray-300 px-3 py-2">{rec.due_date}</td>
                                                        <td className="border border-gray-300 px-3 py-2 text-right">₹{rec.opening_balance}</td>
                                                        <td className="border border-gray-300 px-3 py-2 text-right">₹{rec.regular_due}</td>
                                                        <td className="border border-gray-300 px-3 py-2 text-right">₹{rec.carry_forward_amount}</td>
                                                        <td className="border border-gray-300 px-3 py-2 text-right font-semibold">₹{rec.due_amount}</td>
                                                        <td className="border border-gray-300 px-3 py-2 text-right">₹{rec.closing_balance}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {generatedReceivables.length > 15 && (
                                            <p className="text-sm text-gray-500 mt-2 text-center">
                                                ... and {generatedReceivables.length - 15} more cycles
                                            </p>
                                        )}
                                    </div>

                                    {/* Mobile Card View */}
                                    <div className="md:hidden space-y-2">
                                        {generatedReceivables.slice(0, 10).map((rec, idx) => (
                                            <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold text-gray-800">Day #{rec.day_no}</span>
                                                    <span className="text-sm text-gray-600">{rec.due_date}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                                                    <div>
                                                        <span className="text-gray-500">Opening:</span>
                                                        <p className="font-semibold text-gray-800">₹{rec.opening_balance}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Total Due:</span>
                                                        <p className="font-semibold text-gray-800">₹{rec.due_amount}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div>
                                                        <span className="text-blue-600">Regular:</span>
                                                        <p className="font-semibold text-blue-700">₹{rec.regular_due}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-orange-600">Carry:</span>
                                                        <p className="font-semibold text-orange-700">₹{rec.carry_forward_amount}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-gray-200">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-500 text-xs">Closing:</span>
                                                        <span className="font-semibold text-gray-800">₹{rec.closing_balance}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {generatedReceivables.length > 10 && (
                                            <p className="text-sm text-gray-500 text-center">
                                                ... and {generatedReceivables.length - 10} more cycles
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Terms and Conditions */}
                                <div className="mb-6 print-page">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-300 pb-2">
                                        TERMS AND CONDITIONS
                                    </h2>
                                    <div className="text-sm text-gray-700 space-y-2">
                                        <p>1. Borrower agrees to pay the loan amount as per the schedule above.</p>
                                        <p>2. Late payment charges may apply for overdue amounts.</p>
                                        <p>3. This agreement is subject to the terms and conditions of MyTreasure Finance Hub.</p>
                                        <p>4. Borrower acknowledges receipt of the loan amount and agrees to the payment terms.</p>
                                    </div>
                                </div>

                                {/* Signature Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print-page">
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-4">BORROWER SIGNATURE</h3>
                                        <div className="border-b-2 border-gray-400 h-12 mb-2"></div>
                                        <p className="text-sm text-gray-600">Date: _______________</p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800 mb-4">AUTHORIZED SIGNATURE</h3>
                                        <div className="border-b-2 border-gray-400 h-12 mb-2"></div>
                                        <p className="text-sm text-gray-600">Date: _______________</p>
                                    </div>
                                </div>
                            </div>

                            {/* Upload Signed Agreement Section */}
                            {disbursedLoan && (
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <FiFile className="w-5 h-5 text-blue-600" />
                                        Upload Signed Agreement
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        After the customer signs the printed agreement, please scan and upload it here.
                                    </p>

                                    {!agreementUploaded ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Select Signed Agreement (PDF/Image)
                                                </label>
                                                <div className="flex items-center gap-4">
                                                    <label className="flex-1 cursor-pointer">
                                                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:bg-blue-50 transition-colors">
                                                            {agreementPreview ? (
                                                                <div className="space-y-2">
                                                                    <img
                                                                        src={agreementPreview}
                                                                        alt="Agreement preview"
                                                                        className="max-w-full max-h-48 mx-auto rounded-lg"
                                                                    />
                                                                    <p className="text-sm text-gray-600">{agreementFile?.name}</p>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    <FiUpload className="w-8 h-8 text-blue-500 mx-auto" />
                                                                    <p className="text-sm text-gray-600">Click to select file</p>
                                                                    <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.png,.jpg,.jpeg"
                                                            onChange={handleAgreementFileChange}
                                                            className="hidden"
                                                            disabled={isUploadingAgreement}
                                                        />
                                                    </label>
                                                </div>
                                            </div>

                                            {agreementFile && (
                                                <button
                                                    onClick={handleUploadAgreement}
                                                    disabled={isUploadingAgreement}
                                                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                    {isUploadingAgreement ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiUpload className="w-5 h-5" />
                                                            Upload Signed Agreement
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-green-800">
                                                <FiCheck className="w-5 h-5" />
                                                <p className="font-medium">Signed agreement uploaded successfully!</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons - Only show after database creation */}
                            {disbursedLoan && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 no-print">
                                    <PDFDownloadLink
                                        document={
                                            (() => {
                                                // Prepare subscriber data with all fields
                                                const pdfSubscriber = {
                                                    ...selectedSubscriber,
                                                    // Ensure base64 format is available for PDF
                                                    dc_cust_photo_base64format: selectedSubscriber?.dc_cust_photo_base64format || selectedSubscriber?.dc_cust_photo || '',
                                                    dc_cust_aadhaar_frontside_base64format: selectedSubscriber?.dc_cust_aadhaar_frontside_base64format || selectedSubscriber?.dc_cust_aadhaar_frontside || '',
                                                    dc_cust_aadhaar_backside_base64format: selectedSubscriber?.dc_cust_aadhaar_backside_base64format || selectedSubscriber?.dc_cust_aadhaar_backside || '',
                                                    dc_cust_name: selectedSubscriber?.dc_cust_name || selectedSubscriber?.name || selectedSubscriber?.firstname || 'N/A',
                                                    dc_cust_dob: selectedSubscriber?.dc_cust_dob || selectedSubscriber?.dob || null,
                                                    dc_cust_age: selectedSubscriber?.dc_cust_age || selectedSubscriber?.age || null,
                                                    dc_cust_phone: selectedSubscriber?.dc_cust_phone || '',
                                                    dc_cust_address: selectedSubscriber?.dc_cust_address || selectedSubscriber?.street_name || '',
                                                    dc_nominee_name: selectedSubscriber?.dc_nominee_name || selectedSubscriber?.nominee || '',
                                                    dc_nominee_phone: selectedSubscriber?.dc_nominee_phone || ''
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

                                                console.log('📄 PDF Data Debug:', {
                                                    subscriber: pdfSubscriber,
                                                    company: pdfCompany,
                                                    subscriberPhoto: pdfSubscriber.dc_cust_photo_base64format ? 'Present' : 'Missing',
                                                    companyLogo: pdfCompany.company_logo_base64format ? 'Present' : 'Missing'
                                                });

                                                return (
                                                    <LoanAgreementPDF
                                                        loanData={{
                                                            loan: disbursedLoan.loan,
                                                            subscriber: pdfSubscriber,
                                                            product: selectedProduct,
                                                            receivables: generatedReceivables,
                                                            cashInHand: cashInHand,
                                                            perCycleDue: perCycleDue
                                                        }}
                                                        companyData={pdfCompany}
                                                    />
                                                );
                                            })()
                                        }
                                        fileName={`loan-agreement-${disbursedLoan?.loan?.id || 'temp'}.pdf`}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        {({ loading }) => (
                                            <>
                                                <FiDownload className="w-5 h-5" />
                                                <span className="hidden sm:inline">
                                                    {loading ? 'Preparing PDF...' : 'Download PDF'}
                                                </span>
                                                <span className="sm:hidden">
                                                    {loading ? '...' : 'PDF'}
                                                </span>
                                            </>
                                        )}
                                    </PDFDownloadLink>
                                    <button
                                        onClick={handlePrint}
                                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FiPrinter className="w-5 h-5" />
                                        <span className="hidden sm:inline">Print</span>
                                        <span className="sm:hidden">Print</span>
                                    </button>
                                    <button
                                        onClick={shareOnWhatsApp}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FiShare2 className="w-5 h-5" />
                                        <span className="hidden sm:inline">WhatsApp</span>
                                        <span className="sm:hidden">WA</span>
                                    </button>
                                    <button
                                        onClick={shareViaEmail}
                                        className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FiMail className="w-5 h-5" />
                                        <span className="hidden sm:inline">Email</span>
                                        <span className="sm:hidden">Email</span>
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FiCheck className="w-5 h-5" />
                                        <span className="hidden sm:inline">Complete</span>
                                        <span className="sm:hidden">Done</span>
                                    </button>
                                </div>
                            )}

                            {/* Error Display for Step 4 */}
                            {errors.general && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">
                                        ❌ {errors.general}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Buttons - Only show for Steps 1, 2, and 3 */}
                {currentStep < 4 && (
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
                        <div className="flex justify-between gap-3">
                            {/* Back/Cancel */}
                            {currentStep === 1 ? (
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                                    disabled={isLoading}
                                >
                                    <FiChevronLeft className="w-4 h-4" />
                                    Back
                                </button>
                            )}

                            {/* Continue/Submit */}
                            {currentStep === 1 ? (
                                <button
                                    onClick={handleContinueFromStep1}
                                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                    disabled={!formData.subscriber_id}
                                >
                                    Continue
                                    <FiChevronRight className="w-4 h-4" />
                                </button>
                            ) : currentStep === 2 ? (
                                <button
                                    onClick={handleContinueFromStep2}
                                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    Continue
                                    <FiChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={approveAndCreateInDB}
                                    disabled={isLoading}
                                    className="px-6 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Creating Loan...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck className="w-4 h-4" />
                                            Approve & Create
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoanDisbursementForm;

