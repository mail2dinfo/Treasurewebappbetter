import React, { useState, useEffect } from 'react';
import { useDailyCollectionContext } from '../../context/dailyCollection/DailyCollectionContext';
import { useDcSubscriberContext } from '../../context/dailyCollection/DcSubscriberContext';
import LoanDisbursementForm from '../../components/dailyCollection/LoanDisbursementForm';
import LoanDetails from '../../components/dailyCollection/LoanDetails';
import { FiPlus, FiEye, FiDollarSign, FiCalendar, FiCheckCircle, FiClock, FiImage, FiX, FiFilter, FiSearch } from 'react-icons/fi';

const LoansPage = () => {
    const { loans, products, isLoading, error, fetchLoans, fetchProducts, clearError } = useDailyCollectionContext();
    const { subscribers: dcSubscribers, fetchSubscribers } = useDcSubscriberContext();

    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [showLoanForm, setShowLoanForm] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [showLoanDetails, setShowLoanDetails] = useState(false);
    const [imagePreview, setImagePreview] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [filters, setFilters] = useState({
        name: '',
        phoneNumber: '',
        principal: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        console.log('=== LOANS PAGE INITIALIZATION ===');
        console.log('Fetching products, loans, and DC subscribers...');
        fetchProducts();
        fetchLoans();
        fetchSubscribers();
    }, [fetchProducts, fetchLoans, fetchSubscribers]);

    const filteredLoans = loans.filter(loan => {
        // Status filter
        const loanStatus = loan.status?.toUpperCase();
        const activeTabStatus = activeTab?.toUpperCase();
        if (loanStatus !== activeTabStatus) {
            return false;
        }

        // Name filter (case-insensitive)
        if (filters.name.trim()) {
            const subscriberName = loan.subscriber?.dc_cust_name || '';
            if (!subscriberName.toLowerCase().includes(filters.name.toLowerCase().trim())) {
                return false;
            }
        }

        // Phone number filter
        if (filters.phoneNumber.trim()) {
            const phoneNumber = loan.subscriber?.dc_cust_phone || '';
            if (!phoneNumber.includes(filters.phoneNumber.trim())) {
                return false;
            }
        }

        // Principal filter (numeric comparison)
        if (filters.principal.trim()) {
            const principalValue = parseFloat(filters.principal.trim());
            if (isNaN(principalValue)) {
                return false;
            }
            const loanPrincipal = parseFloat(loan.principal_amount || 0);
            if (loanPrincipal !== principalValue) {
                return false;
            }
        }

        return true;
    });

    // Debug logging for loans data
    useEffect(() => {
        console.log('=== LOANS DEBUG ===');
        console.log('Loans data:', loans);
        console.log('Loans length:', loans.length);
        console.log('Active tab:', activeTab);
        console.log('Filtered loans:', filteredLoans);
        console.log('Filtered loans length:', filteredLoans.length);
        console.log('Is loading:', isLoading);
        console.log('Error:', error);

        if (loans.length > 0) {
            console.log('First loan:', loans[0]);
            console.log('First loan status:', loans[0]?.status);
            console.log('First loan product:', loans[0]?.product);
            console.log('First loan product name:', loans[0]?.product?.product_name);
            console.log('First loan full object:', JSON.stringify(loans[0], null, 2));

            // Check all loan statuses
            const statuses = loans.map(loan => loan.status);
            console.log('All loan statuses:', statuses);
            console.log('Unique statuses:', [...new Set(statuses)]);

            // Check filtering logic
            console.log('Filtering loans with status:', activeTab);
            const manuallyFiltered = loans.filter(loan => loan.status === activeTab);
            console.log('Manual filtering result:', manuallyFiltered);
            console.log('Manual filtering length:', manuallyFiltered.length);

            // Check case-insensitive filtering
            const caseInsensitiveFiltered = loans.filter(loan =>
                loan.status?.toUpperCase() === activeTab?.toUpperCase()
            );
            console.log('Case-insensitive filtering result:', caseInsensitiveFiltered);
            console.log('Case-insensitive filtering length:', caseInsensitiveFiltered.length);

            // Show all loan details for debugging
            loans.forEach((loan, index) => {
                console.log(`Loan ${index}:`, {
                    id: loan.id,
                    status: loan.status,
                    statusType: typeof loan.status,
                    subscriber: loan.subscriber?.dc_cust_name || loan.subscriber?.name || loan.subscriber?.firstname,
                    subscriberPhoto: loan.subscriber?.dc_cust_photo,
                    subscriberPhotoS3: loan.subscriber?.dc_cust_photo_s3_image,
                    subscriberKeys: loan.subscriber ? Object.keys(loan.subscriber) : null,
                    loanAgreementDoc: loan.loan_agreement_doc,
                    loanAgreementDocS3: loan.loan_agreement_doc_s3_image,
                    principal: loan.principal_amount,
                    product: loan.product,
                    productName: loan.product?.product_name,
                    productFrequency: loan.product?.frequency
                });
            });
        } else {
            console.log('No loans found in data');
        }
        console.log('=== END LOANS DEBUG ===');
    }, [loans, activeTab, filteredLoans, isLoading, error]);

    const handleViewDetails = (loan) => {
        setSelectedLoan(loan);
        setShowLoanDetails(true);
    };

    const handleCloseLoanForm = () => {
        setShowLoanForm(false);
        fetchLoans(); // Refresh list
    };

    const handleDownloadAgreement = async (loan) => {
        try {
            // Use backend-prepared S3 signed URL if available (same pattern as company_logo_s3_image)
            let imageUrl = loan.loan_agreement_doc_s3_image || loan.loan_agreement_doc;

            if (!imageUrl) {
                alert('No loan agreement document found');
                return;
            }

            // If we have a signed URL, show it in preview modal (same as SubscribersPage)
            if (imageUrl) {
                setPreviewImageUrl(imageUrl);
                setImagePreview(true);
            }
        } catch (error) {
            console.error('❌ Error opening agreement:', error);
            alert(`Error opening agreement document: ${error.message || 'Please try again later.'}`);
        }
    };

    const stats = {
        active: loans.filter(l => l.status === 'ACTIVE').length,
        closed: loans.filter(l => l.status === 'CLOSED').length,
        totalDisbursed: loans.reduce((sum, l) => sum + parseFloat(l.principal_amount || 0), 0),
        totalOutstanding: loans
            .filter(l => l.status === 'ACTIVE')
            .reduce((sum, l) => sum + parseFloat(l.closing_balance || 0), 0),
    };

    // Debug stats
    console.log('Stats calculation:', stats);
    console.log('Active loans count:', stats.active);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Loan Management</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage disbursements, track collections, and monitor repayments</p>
                    </div>
                    <button
                        onClick={() => setShowLoanForm(true)}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg justify-center"
                    >
                        <FiPlus className="w-5 h-5" />
                        Disburse New Loan
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <FiCheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Active Loans</p>
                                <p className="text-xl font-bold text-gray-800">{stats.active}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FiClock className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Closed Loans</p>
                                <p className="text-xl font-bold text-gray-800">{stats.closed}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FiDollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Total Disbursed</p>
                                <p className="text-xl font-bold text-gray-800">₹{stats.totalDisbursed.toFixed(0)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <FiDollarSign className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium">Outstanding</p>
                                <p className="text-xl font-bold text-gray-800">₹{stats.totalOutstanding.toFixed(0)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex gap-4">
                            <button
                                onClick={() => setActiveTab('ACTIVE')}
                                className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'ACTIVE'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Active Loans ({stats.active})
                            </button>
                            <button
                                onClick={() => setActiveTab('CLOSED')}
                                className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === 'CLOSED'
                                    ? 'border-red-500 text-red-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                                    }`}
                            >
                                Closed Loans ({stats.closed})
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                        >
                            <FiFilter className="w-5 h-5" />
                            Filters
                            {(filters.name || filters.phoneNumber || filters.principal) && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                    {[filters.name, filters.phoneNumber, filters.principal].filter(Boolean).length}
                                </span>
                            )}
                        </button>
                        {((filters.name || filters.phoneNumber || filters.principal)) && (
                            <button
                                onClick={() => setFilters({ name: '', phoneNumber: '', principal: '' })}
                                className="text-sm text-gray-600 hover:text-gray-800 underline"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Name Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter by Name
                                </label>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Enter subscriber name..."
                                        value={filters.name}
                                        onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Phone Number Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter by Phone Number
                                </label>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Enter phone number..."
                                        value={filters.phoneNumber}
                                        onChange={(e) => setFilters({ ...filters, phoneNumber: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Principal Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filter by Principal Amount
                                </label>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="number"
                                        placeholder="Enter exact principal amount..."
                                        value={filters.principal}
                                        onChange={(e) => setFilters({ ...filters, principal: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active Filters Display */}
                    {((filters.name || filters.phoneNumber || filters.principal)) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Active filters:</p>
                            <div className="flex flex-wrap gap-2">
                                {filters.name && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Name: {filters.name}
                                        <button
                                            onClick={() => setFilters({ ...filters, name: '' })}
                                            className="ml-2 hover:text-blue-900"
                                        >
                                            <FiX className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.phoneNumber && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Phone: {filters.phoneNumber}
                                        <button
                                            onClick={() => setFilters({ ...filters, phoneNumber: '' })}
                                            className="ml-2 hover:text-blue-900"
                                        >
                                            <FiX className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {filters.principal && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Principal: ₹{filters.principal}
                                        <button
                                            onClick={() => setFilters({ ...filters, principal: '' })}
                                            className="ml-2 hover:text-blue-900"
                                        >
                                            <FiX className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="w-5 h-5 text-red-400 mr-3">
                                <svg fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-red-800">Error Loading Loans</h3>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                                <button
                                    onClick={() => {
                                        clearError();
                                        fetchLoans();
                                    }}
                                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && loans.length === 0 && (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading loans...</p>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredLoans.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">💰</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                            No {activeTab === 'ACTIVE' ? 'Active' : 'Closed'} Loans
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {activeTab === 'ACTIVE'
                                ? 'Get started by disbursing your first loan'
                                : 'No closed loans yet'
                            }
                        </p>

                        {/* Debug info for development */}
                        {process.env.NODE_ENV === 'development' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                                <h4 className="font-semibold text-yellow-800 mb-2">Debug Info:</h4>
                                <p className="text-sm text-yellow-700">Total loans: {loans.length}</p>
                                <p className="text-sm text-yellow-700">Active tab: {activeTab}</p>
                                <p className="text-sm text-yellow-700">Filtered loans: {filteredLoans.length}</p>
                                {loans.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm text-yellow-700">Available statuses:</p>
                                        <ul className="text-sm text-yellow-700 ml-4">
                                            {[...new Set(loans.map(l => l.status))].map(status => (
                                                <li key={status}>• {status}</li>
                                            ))}
                                        </ul>
                                        <div className="mt-2">
                                            <p className="text-sm text-yellow-700">First loan product debug:</p>
                                            <pre className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded mt-1 overflow-auto">
                                                {JSON.stringify(loans[0]?.product, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'ACTIVE' && (
                            <button
                                onClick={() => setShowLoanForm(true)}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                            >
                                <FiPlus className="w-5 h-5" />
                                Disburse Your First Loan
                            </button>
                        )}
                    </div>
                )}

                {/* Loans List - Desktop Table */}
                {!isLoading && filteredLoans.length > 0 && (
                    <>
                        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Subscriber</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Principal</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Outstanding</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Loan Disbursement Date</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Loan Due Start Date</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Loan Agreement</th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredLoans.map((loan) => {
                                        // Debug subscriber data for each loan
                                        const hasSubscriber = !!loan.subscriber;
                                        const imageUrl = loan.subscriber?.dc_cust_photo_s3_image || loan.subscriber?.dc_cust_photo;

                                        if (hasSubscriber && !imageUrl) {
                                            console.warn(`⚠️ Loan ${loan.id}: Subscriber exists but no image URL found:`, {
                                                subscriber: loan.subscriber,
                                                dc_cust_photo: loan.subscriber?.dc_cust_photo,
                                                dc_cust_photo_s3_image: loan.subscriber?.dc_cust_photo_s3_image,
                                                subscriberKeys: Object.keys(loan.subscriber || {})
                                            });
                                        }

                                        return (
                                            <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {/* Subscriber Image - Try S3 signed URL first, fallback to original, then initials */}
                                                        {imageUrl ? (
                                                            <img
                                                                src={imageUrl}
                                                                alt={loan.subscriber?.dc_cust_name || 'Subscriber'}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                                onError={(e) => {
                                                                    console.error(`❌ Failed to load subscriber image for loan ${loan.id}:`, imageUrl);
                                                                    e.target.style.display = 'none';
                                                                    // Show initials fallback
                                                                    const fallback = e.target.parentElement.querySelector('.subscriber-fallback');
                                                                    if (fallback) fallback.style.display = 'flex';
                                                                }}
                                                                onLoad={() => {
                                                                    console.log(`✅ Successfully loaded subscriber image for loan ${loan.id}:`, imageUrl);
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div
                                                            className={`w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 subscriber-fallback ${imageUrl ? 'hidden' : ''}`}
                                                        >
                                                            <span className="text-blue-600 font-bold text-sm">
                                                                {(loan.subscriber?.dc_cust_name || 'U').charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {loan.subscriber?.dc_cust_name || 'N/A'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {loan.subscriber?.dc_cust_phone || ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {loan.product?.product_name || loan['product.product_name'] || 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {loan.product?.frequency || loan['product.frequency'] || ''} | {loan.total_installments} cycles
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-sm font-semibold text-gray-800">₹{parseFloat(loan.principal_amount).toFixed(2)}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className={`text-sm font-semibold ${loan.status === 'ACTIVE' ? 'text-red-600' : 'text-green-600'}`}>
                                                        ₹{parseFloat(loan.closing_balance).toFixed(2)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                                                        <FiCalendar className="w-4 h-4" />
                                                        {loan.loan_disbursement_date || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                                                        <FiCalendar className="w-4 h-4" />
                                                        {loan.loan_due_start_date || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {/* Loan Agreement - Show icon like subscriber documents in SubscribersPage */}
                                                    {loan.loan_agreement_doc_s3_image ? (
                                                        <button
                                                            onClick={() => handleDownloadAgreement(loan)}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                                            title="View Loan Agreement"
                                                        >
                                                            <FiImage className="w-5 h-5" />
                                                        </button>
                                                    ) : loan.loan_agreement_doc ? (
                                                        <button
                                                            onClick={() => handleDownloadAgreement(loan)}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                                            title="View Loan Agreement"
                                                        >
                                                            <FiImage className="w-5 h-5" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">No docs</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loan.status === 'ACTIVE'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {loan.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleViewDetails(loan)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 ml-auto"
                                                    >
                                                        <FiEye className="w-4 h-4" />
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {filteredLoans.map((loan) => (
                                <div key={loan.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3 flex-1">
                                            {/* Subscriber Image - Exact same pattern as SubscribersPage */}
                                            {loan.subscriber?.dc_cust_photo_s3_image ? (
                                                <img
                                                    src={loan.subscriber.dc_cust_photo_s3_image}
                                                    alt={loan.subscriber?.dc_cust_name || 'Subscriber'}
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <span className="text-blue-600 font-bold text-lg">
                                                        {(loan.subscriber?.dc_cust_name || 'U').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {loan.subscriber?.dc_cust_name || 'N/A'}
                                                </h3>
                                                <p className="text-xs text-gray-500">{loan.subscriber?.dc_cust_phone || ''}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loan.status === 'ACTIVE'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {loan.status}
                                        </span>
                                    </div>

                                    {/* Product Info */}
                                    <div className="mb-3 pb-3 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-700 mb-1">
                                            {loan.product?.product_name || loan['product.product_name'] || 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {loan.product?.frequency || loan['product.frequency'] || ''} • {loan.total_installments} cycles
                                        </p>
                                    </div>

                                    {/* Financial Details */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Principal Amount</p>
                                            <p className="text-sm font-semibold text-gray-800">₹{parseFloat(loan.principal_amount).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Outstanding</p>
                                            <p className={`text-sm font-semibold ${loan.status === 'ACTIVE' ? 'text-red-600' : 'text-green-600'}`}>
                                                ₹{parseFloat(loan.closing_balance).toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Per Cycle</p>
                                            <p className="text-sm font-semibold text-gray-800">₹{parseFloat(loan.daily_due_amount).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Loan Disbursement Date</p>
                                            <p className="text-sm font-semibold text-gray-800">{loan.loan_disbursement_date || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Loan Due Start Date</p>
                                            <p className="text-sm font-semibold text-gray-800">{loan.loan_due_start_date || 'N/A'}</p>
                                        </div>
                                    </div>

                                    {/* Loan Agreement Section */}
                                    {(loan.loan_agreement_doc_s3_image || loan.loan_agreement_doc) && (
                                        <div className="mb-3 pb-3 border-b border-gray-100">
                                            <button
                                                onClick={() => handleDownloadAgreement(loan)}
                                                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FiImage className="w-4 h-4" />
                                                View Loan Agreement
                                            </button>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <button
                                        onClick={() => handleViewDetails(loan)}
                                        className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FiEye className="w-4 h-4" />
                                        View Details & Receivables
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Loan Disbursement Form Modal */}
                {showLoanForm && (
                    <LoanDisbursementForm
                        products={products}
                        subscribers={dcSubscribers}
                        onClose={handleCloseLoanForm}
                    />
                )}

                {/* Loan Details Modal */}
                {showLoanDetails && selectedLoan && (
                    <LoanDetails
                        loan={selectedLoan}
                        onClose={() => {
                            setShowLoanDetails(false);
                            setSelectedLoan(null);
                        }}
                    />
                )}

                {/* Image Preview Modal - Same as SubscribersPage */}
                {imagePreview && previewImageUrl && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-800">Loan Agreement Document</h3>
                                <button
                                    onClick={() => {
                                        setImagePreview(false);
                                        setPreviewImageUrl(null);
                                    }}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FiX className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex justify-center">
                                <img
                                    src={previewImageUrl}
                                    alt="Loan Agreement"
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoansPage;

