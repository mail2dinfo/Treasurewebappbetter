import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { FiPlus, FiDollarSign, FiUser, FiCalendar, FiTrendingUp, FiTrendingDown, FiEye, FiX, FiDownload } from 'react-icons/fi';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import { useUserContext } from '../../context/user_context';
import PersonalLoanLoanDisbursementForm from '../../components/personalLoan/PersonalLoanLoanDisbursementForm';
import PersonalLoanLoanCollectionForm from '../../components/personalLoan/PersonalLoanLoanCollectionForm';
import PersonalLoanLoanForeclosureModal from '../../components/personalLoan/PersonalLoanLoanForeclosureModal';
import PersonalLoanListPDF from '../../components/personalLoan/PDF/PersonalLoanListPDF';
import PersonalLoanDetailsPDF from '../../components/personalLoan/PDF/PersonalLoanDetailsPDF';

const PersonalLoanLoansPage = () => {
    const history = useHistory();
    const location = useLocation();
    const { loans, fetchLoans, isLoading, getLoanById, error, companies, fetchCompanies } = usePersonalLoanContext();
    const { user } = useUserContext();
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [showDisbursementForm, setShowDisbursementForm] = useState(false);
    const [showCollectionForm, setShowCollectionForm] = useState(false);
    const [showForeclosureModal, setShowForeclosureModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const hasFetchedRef = useRef(false);

    // Fetch loans and companies when component mounts
    useEffect(() => {
        fetchLoans();
        if (fetchCompanies) {
            fetchCompanies();
        }
        hasFetchedRef.current = true;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch loans when route changes (user navigates back to this page)
    useEffect(() => {
        if (hasFetchedRef.current && location.pathname === '/personal-loan/user/loans') {
            // Small delay to ensure context is ready
            const timer = setTimeout(() => {
                fetchLoans();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [location.pathname]); // Only depend on pathname, not fetchLoans

    const activeLoans = loans.filter(loan => loan.status === 'ACTIVE');
    const closedLoans = loans.filter(loan => loan.status === 'CLOSED' || loan.status === 'FORECLOSED');

    const handleDisburseSuccess = () => {
        setShowDisbursementForm(false);
        fetchLoans();
    };

    const handleCollectionSuccess = () => {
        setShowCollectionForm(false);
        setSelectedLoan(null);
        fetchLoans();
    };

    const handleForecloseSuccess = () => {
        setShowForeclosureModal(false);
        setSelectedLoan(null);
        fetchLoans();
    };

    const handleViewDetails = async (loan) => {
        // Fetch full loan details with receivables
        setIsLoadingDetails(true);
        try {
            const result = await getLoanById(loan.id);
            if (result.success) {
                setSelectedLoanDetails(result.data);
            } else {
                console.error('Failed to fetch loan details:', result.error);
                alert(`Failed to load loan details: ${result.error}`);
            }
        } catch (error) {
            console.error('Error fetching loan details:', error);
            alert(`Error loading loan details: ${error.message}`);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            ACTIVE: 'bg-green-100 text-green-800',
            CLOSED: 'bg-gray-100 text-gray-800',
            FORECLOSED: 'bg-red-100 text-red-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    const displayLoans = activeTab === 'ACTIVE' ? activeLoans : closedLoans;

    // Get company data for PDF
    const getCompanyDataForPDF = () => {
        const plCompany = companies?.[0];
        const chitFundCompany = user?.results?.userCompany?.[0];

        if (plCompany) {
            return {
                name: plCompany.company_name || 'Personal Loan Company',
                logo_base64format: plCompany.company_logo || null,
                phone: plCompany.contact_no || 'N/A',
                street_address: plCompany.address || '',
                city: '',
                state: '',
                zipcode: '',
                country: '',
                email: '',
                registration_no: plCompany.registration_no || '',
                company_since: plCompany.company_since || '',
            };
        } else if (chitFundCompany) {
            return {
                name: chitFundCompany.name || 'Company',
                logo_base64format: chitFundCompany.logo_base64format || null,
                phone: chitFundCompany.phone || 'N/A',
                street_address: chitFundCompany.street_address || '',
                city: chitFundCompany.city || '',
                state: chitFundCompany.state || '',
                zipcode: chitFundCompany.zipcode || '',
                country: chitFundCompany.country || '',
                email: chitFundCompany.email || '',
                registration_no: chitFundCompany.registration_no || '',
                company_since: chitFundCompany.company_since || '',
            };
        }
        return {
            name: 'Personal Loan Company',
            logo_base64format: null,
            phone: 'N/A',
            street_address: '',
            city: '',
            state: '',
            zipcode: '',
            country: '',
            email: '',
            registration_no: '',
            company_since: '',
        };
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Loans Management</h1>
                        <p className="text-gray-600 mt-1">Manage loan disbursements and collections</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center gap-3">
                        {activeTab === 'ACTIVE' && activeLoans.length > 0 && (
                            <PDFDownloadLink
                                document={
                                    <PersonalLoanListPDF
                                        loans={activeLoans}
                                        companyData={getCompanyDataForPDF()}
                                    />
                                }
                                fileName={`active-loans-${new Date().toISOString().split('T')[0]}.pdf`}
                                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
                            >
                                {({ loading }) => (
                                    <>
                                        <FiDownload className="w-5 h-5 mr-2" />
                                        {loading ? 'Generating PDF...' : 'Download PDF'}
                                    </>
                                )}
                            </PDFDownloadLink>
                        )}
                        <button
                            onClick={() => setShowDisbursementForm(true)}
                            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md"
                        >
                            <FiPlus className="w-5 h-5 mr-2" />
                            Disburse New Loan
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600">Active Loans</p>
                        <p className="text-2xl font-bold text-gray-900">{activeLoans.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                        <p className="text-sm text-gray-600">Closed Loans</p>
                        <p className="text-2xl font-bold text-gray-900">{closedLoans.length}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
                        <p className="text-sm text-gray-600">Total Disbursed</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(loans.reduce((sum, loan) => sum + (parseFloat(loan.principal_amount) || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
                        <p className="text-sm text-gray-600">Total Outstanding</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(loans.reduce((sum, loan) => sum + (parseFloat(loan.total_outstanding) || 0), 0))}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('ACTIVE')}
                                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'ACTIVE'
                                        ? 'border-red-600 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Active Loans ({activeLoans.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('CLOSED')}
                                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'CLOSED'
                                        ? 'border-red-600 text-red-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Closed Loans ({closedLoans.length})
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <p className="font-medium">Error loading loans</p>
                        <p className="text-sm">{error}</p>
                        <button
                            onClick={() => fetchLoans()}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Loans Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading loans...</p>
                        </div>
                    ) : displayLoans.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-gray-500">No {activeTab === 'ACTIVE' ? 'active' : 'closed'} loans found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Subscriber
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Loan Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Outstanding
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mode
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Disbursed Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {displayLoans.map((loan) => (
                                        <tr key={loan.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {loan.subscriber?.pl_cust_name || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {loan.subscriber?.pl_cust_phone || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(loan.principal_amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(loan.total_outstanding)}
                                                </div>
                                                {loan.loan_mode === 'INTEREST_ONLY' && loan.outstanding_interest > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        Interest: {formatCurrency(loan.outstanding_interest)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                    {loan.loan_mode === 'INTEREST_FREE' ? 'Interest-Free' : 'Interest-Only'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(loan.disbursed_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(loan.status)}`}>
                                                    {loan.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-2">
                                                    {loan.status === 'ACTIVE' && (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedLoan(loan);
                                                                    setShowCollectionForm(true);
                                                                }}
                                                                className="text-green-600 hover:text-green-900"
                                                                title="Collect Payment"
                                                            >
                                                                <FiDollarSign className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedLoan(loan);
                                                                    setShowForeclosureModal(true);
                                                                }}
                                                                className="text-red-600 hover:text-red-900"
                                                                title="Foreclose Loan"
                                                            >
                                                                <FiX className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => handleViewDetails(loan)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                        title="View Details"
                                                    >
                                                        <FiEye className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modals */}
                {showDisbursementForm && (
                    <PersonalLoanLoanDisbursementForm
                        onClose={() => setShowDisbursementForm(false)}
                        onSuccess={handleDisburseSuccess}
                    />
                )}

                {showCollectionForm && selectedLoan && (
                    <PersonalLoanLoanCollectionForm
                        loan={selectedLoan}
                        onClose={() => {
                            setShowCollectionForm(false);
                            setSelectedLoan(null);
                        }}
                        onSuccess={handleCollectionSuccess}
                    />
                )}

                {showForeclosureModal && selectedLoan && (
                    <PersonalLoanLoanForeclosureModal
                        loan={selectedLoan}
                        onClose={() => {
                            setShowForeclosureModal(false);
                            setSelectedLoan(null);
                        }}
                        onSuccess={handleForecloseSuccess}
                    />
                )}

                {/* Loan Details Modal */}
                {selectedLoanDetails && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Loan Details</h2>
                                <div className="flex items-center gap-3">
                                    <PDFDownloadLink
                                        document={
                                            <PersonalLoanDetailsPDF
                                                loanData={selectedLoanDetails}
                                                companyData={getCompanyDataForPDF()}
                                            />
                                        }
                                        fileName={`loan-details-${selectedLoanDetails.id}-${new Date().toISOString().split('T')[0]}.pdf`}
                                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
                                    >
                                        {({ loading }) => (
                                            <>
                                                <FiDownload className="w-5 h-5 mr-2" />
                                                {loading ? 'Generating...' : 'Download PDF'}
                                            </>
                                        )}
                                    </PDFDownloadLink>
                                    <button
                                        onClick={() => {
                                            setSelectedLoanDetails(null);
                                            setIsLoadingDetails(false);
                                            // Refresh loans when closing the modal to ensure data is up to date
                                            fetchLoans();
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <FiX className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            {isLoadingDetails ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                    <p className="text-gray-600 mt-4">Loading loan details...</p>
                                </div>
                            ) : (
                            <div className="p-6">
                                {/* Loan Info */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-500">Subscriber</p>
                                        <p className="text-lg font-semibold">{selectedLoanDetails.subscriber?.pl_cust_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Principal Amount</p>
                                        <p className="text-lg font-semibold">{formatCurrency(selectedLoanDetails.principal_amount || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Outstanding Principal</p>
                                        <p className="text-lg font-semibold text-red-600">{formatCurrency(selectedLoanDetails.outstanding_principal || 0)}</p>
                                    </div>
                                    {selectedLoanDetails.loan_mode === 'INTEREST_ONLY' && (
                                        <div>
                                            <p className="text-sm text-gray-500">Outstanding Interest</p>
                                            <p className="text-lg font-semibold text-orange-600">{formatCurrency(selectedLoanDetails.outstanding_interest || 0)}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-500">Loan Status</p>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedLoanDetails.status)}`}>
                                            {selectedLoanDetails.status || 'N/A'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Disbursed Date</p>
                                        <p className="text-sm font-semibold">{formatDate(selectedLoanDetails.disbursed_date)}</p>
                                    </div>
                                </div>

                                {/* Payment History Summary */}
                                {selectedLoanDetails.receipts && selectedLoanDetails.receipts.length > 0 && (
                                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-6 border border-green-200">
                                        <h3 className="text-lg font-semibold mb-3 text-gray-900">Payment Summary</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-600">Total Payments</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    {selectedLoanDetails.receipts.length}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600">Total Principal Paid</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {formatCurrency(
                                                        selectedLoanDetails.receipts.reduce((sum, r) => 
                                                            sum + parseFloat(r.principal_paid || 0), 0
                                                        )
                                                    )}
                                                </p>
                                            </div>
                                            {selectedLoanDetails.loan_mode === 'INTEREST_ONLY' && (
                                                <div>
                                                    <p className="text-xs text-gray-600">Total Interest Paid</p>
                                                    <p className="text-lg font-bold text-orange-600">
                                                        {formatCurrency(
                                                            selectedLoanDetails.receipts.reduce((sum, r) => 
                                                                sum + parseFloat(r.interest_paid || 0), 0
                                                            )
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-xs text-gray-600">Remaining Principal</p>
                                                <p className="text-lg font-bold text-red-600">
                                                    {formatCurrency(selectedLoanDetails.outstanding_principal)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Payment History - Date-wise Principal Payments */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold mb-3">Payment History (Date-wise)</h3>
                                    {selectedLoanDetails.receipts && selectedLoanDetails.receipts.length > 0 ? (
                                        <>
                                            {/* Desktop Table View */}
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Payment Date
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Principal Paid
                                                            </th>
                                                            {selectedLoanDetails.loan_mode === 'INTEREST_ONLY' && (
                                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                    Interest Paid
                                                                </th>
                                                            )}
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Total Amount
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Payment Mode
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Cumulative Principal Paid
                                                            </th>
                                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Remaining Principal
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {(() => {
                                                            // Sort receipts by payment date (oldest first)
                                                            const sortedReceipts = [...selectedLoanDetails.receipts].sort((a, b) => 
                                                                new Date(a.payment_date) - new Date(b.payment_date)
                                                            );
                                                            
                                                            let cumulativePrincipalPaid = 0;
                                                            const principalAmount = parseFloat(selectedLoanDetails.principal_amount || 0);
                                                            
                                                            return sortedReceipts.map((receipt, index) => {
                                                                const principalPaid = parseFloat(receipt.principal_paid || 0);
                                                                const interestPaid = parseFloat(receipt.interest_paid || 0);
                                                                const totalAmount = parseFloat(receipt.received_amount || 0);
                                                                
                                                                cumulativePrincipalPaid += principalPaid;
                                                                const remainingPrincipal = principalAmount - cumulativePrincipalPaid;
                                                                
                                                                return (
                                                                    <tr key={receipt.id} className="hover:bg-gray-50">
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                                            {formatDate(receipt.payment_date)}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">
                                                                            {formatCurrency(principalPaid)}
                                                                        </td>
                                                                        {selectedLoanDetails.loan_mode === 'INTEREST_ONLY' && (
                                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-orange-600">
                                                                                {formatCurrency(interestPaid)}
                                                                            </td>
                                                                        )}
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                                            {formatCurrency(totalAmount)}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                                                {receipt.payment_mode}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-600">
                                                                            {formatCurrency(cumulativePrincipalPaid)}
                                                                        </td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-red-600">
                                                                            {formatCurrency(remainingPrincipal)}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            });
                                                        })()}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Card View */}
                                            <div className="md:hidden space-y-3">
                                                {(() => {
                                                    // Sort receipts by payment date (oldest first)
                                                    const sortedReceipts = [...selectedLoanDetails.receipts].sort((a, b) => 
                                                        new Date(a.payment_date) - new Date(b.payment_date)
                                                    );
                                                    
                                                    let cumulativePrincipalPaid = 0;
                                                    const principalAmount = parseFloat(selectedLoanDetails.principal_amount || 0);
                                                    
                                                    return sortedReceipts.map((receipt, index) => {
                                                        const principalPaid = parseFloat(receipt.principal_paid || 0);
                                                        const interestPaid = parseFloat(receipt.interest_paid || 0);
                                                        const totalAmount = parseFloat(receipt.received_amount || 0);
                                                        
                                                        cumulativePrincipalPaid += principalPaid;
                                                        const remainingPrincipal = principalAmount - cumulativePrincipalPaid;
                                                        
                                                        return (
                                                            <div key={receipt.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-gray-900">
                                                                            {formatDate(receipt.payment_date)}
                                                                        </p>
                                                                        <span className="mt-1 inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                                            {receipt.payment_mode}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-lg font-bold text-gray-900">
                                                                        {formatCurrency(totalAmount)}
                                                                    </p>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2 text-sm mt-3 pt-3 border-t border-gray-200">
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Principal Paid</p>
                                                                        <p className="font-semibold text-green-600">{formatCurrency(principalPaid)}</p>
                                                                    </div>
                                                                    {selectedLoanDetails.loan_mode === 'INTEREST_ONLY' && (
                                                                        <div>
                                                                            <p className="text-xs text-gray-500">Interest Paid</p>
                                                                            <p className="font-semibold text-orange-600">{formatCurrency(interestPaid)}</p>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Cumulative Principal</p>
                                                                        <p className="font-semibold text-blue-600">{formatCurrency(cumulativePrincipalPaid)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs text-gray-500">Remaining Principal</p>
                                                                        <p className="font-semibold text-red-600">{formatCurrency(remainingPrincipal)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                                            <p>No payments recorded yet</p>
                                        </div>
                                    )}
                                </div>

                                {/* Receivables */}
                                <div className="mb-6">
                                    <h3 className="text-lg font-semibold mb-3">Receivables</h3>
                                    <div className="space-y-2">
                                        {selectedLoanDetails.receivables?.map((receivable) => (
                                            <div key={receivable.id} className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                            receivable.due_type === 'PRINCIPAL' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                            {receivable.due_type}
                                                        </span>
                                                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                                                            receivable.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                                            receivable.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {receivable.status}
                                                        </span>
                                                    </div>
                                                    <p className="font-semibold">{formatCurrency(receivable.due_amount)}</p>
                                                </div>
                                                {receivable.due_date && (
                                                    <p className="text-xs text-gray-500 mt-1">Due: {formatDate(receivable.due_date)}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalLoanLoansPage;
