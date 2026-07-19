import React, { useState, useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { FiPlus, FiDollarSign, FiUser, FiCalendar, FiTrendingUp, FiTrendingDown, FiEye, FiX, FiDownload } from 'react-icons/fi';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useVehicleFinanceContext } from '../../context/vehicleFinance/VehicleFinanceContext';
import { useUserContext } from '../../context/user_context';
import VehicleFinanceLoanDisbursementForm from '../../components/vehicleFinance/VehicleFinanceLoanDisbursementForm';
import VehicleFinanceLoanCollectionForm from '../../components/vehicleFinance/VehicleFinanceLoanCollectionForm';
import VehicleFinanceLoanForeclosureModal from '../../components/vehicleFinance/VehicleFinanceLoanForeclosureModal';
import VehicleFinanceLoanDetails from '../../components/vehicleFinance/VehicleFinanceLoanDetails';
import VehicleFinanceListPDF from '../../components/vehicleFinance/PDF/VehicleFinanceListPDF';
import { useVfPermission } from '../../components/vehicleFinance/useVfPermission';

const VehicleFinanceLoansPage = () => {
    const history = useHistory();
    const location = useLocation();
    const { loans, fetchLoans, isLoading, error, companies, fetchCompanies } = useVehicleFinanceContext();
    const { user } = useUserContext();
    const { canAccess, canAccessModule } = useVfPermission();
    // Loans category permissions from People & Access (no Collections fallback).
    const canViewLoans = canAccess('vf_loan_view') && canAccessModule('loans');
    const canDisburse = canViewLoans && canAccess('vf_loan_disburse');
    const canCollectLoan = canViewLoans && canAccess('vf_loan_collect');
    const canForeclose = canViewLoans && canAccess('vf_loan_foreclose');
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [showDisbursementForm, setShowDisbursementForm] = useState(false);
    const [showCollectionForm, setShowCollectionForm] = useState(false);
    const [showForeclosureModal, setShowForeclosureModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [selectedLoanId, setSelectedLoanId] = useState(null);
    const [viewLoan, setViewLoan] = useState(null);
    const hasFetchedRef = useRef(false);

    // Fetch loans and companies when component mounts
    useEffect(() => {
        if (!canViewLoans) return;
        fetchLoans();
        if (fetchCompanies) {
            fetchCompanies();
        }
        hasFetchedRef.current = true;
    }, [canViewLoans]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch loans when route changes (user navigates back to this page)
    useEffect(() => {
        if (hasFetchedRef.current && location.pathname === '/vehicle-finance/user/loans') {
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

    const handleViewDetails = (loan) => {
        setViewLoan(loan);
        setSelectedLoanId(loan.id);
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

    if (!canViewLoans) {
        return (
            <div className="min-h-screen bg-gray-50 py-16 px-4 text-center">
                <h1 className="text-2xl font-bold text-gray-900">Loans access denied</h1>
                <p className="text-gray-600 mt-2">You do not have permission to view loans.</p>
            </div>
        );
    }

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
                                    <VehicleFinanceListPDF
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
                        {canDisburse && (
                            <button
                                onClick={() => setShowDisbursementForm(true)}
                                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md"
                            >
                                <FiPlus className="w-5 h-5 mr-2" />
                                Disburse New Loan
                            </button>
                        )}
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
                            {formatCurrency(loans.reduce((sum, loan) => sum + (parseFloat(loan.loan_amount ?? loan.principal_amount) || 0), 0))}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-orange-500">
                        <p className="text-sm text-gray-600">Total Outstanding</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(loans.reduce((sum, loan) => sum + (parseFloat(loan.closing_balance ?? loan.total_outstanding) || 0), 0))}
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
                                                            {loan.subscriber?.vf_cust_name || 'N/A'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {loan.subscriber?.vf_cust_phone || ''}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(loan.loan_amount ?? loan.principal_amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(loan.closing_balance ?? loan.total_outstanding)}
                                                </div>
                                                {parseFloat(loan.interest_amount || 0) > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        Interest: {formatCurrency(loan.interest_amount)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                    {loan.repayment_mode || loan.tenure_mode || loan.loan_mode || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(loan.loan_disbursement_date || loan.disbursed_date)}
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
                                                            {canCollectLoan && (
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
                                                            )}
                                                            {canForeclose && (
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
                                                            )}
                                                        </>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            event.stopPropagation();
                                                            handleViewDetails(loan);
                                                        }}
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
                    <VehicleFinanceLoanDisbursementForm
                        onClose={() => setShowDisbursementForm(false)}
                        onSuccess={handleDisburseSuccess}
                    />
                )}

                {showCollectionForm && selectedLoan && (
                    <VehicleFinanceLoanCollectionForm
                        loan={selectedLoan}
                        onClose={() => {
                            setShowCollectionForm(false);
                            setSelectedLoan(null);
                        }}
                        onSuccess={handleCollectionSuccess}
                    />
                )}

                {showForeclosureModal && selectedLoan && (
                    <VehicleFinanceLoanForeclosureModal
                        loan={selectedLoan}
                        onClose={() => {
                            setShowForeclosureModal(false);
                            setSelectedLoan(null);
                        }}
                        onSuccess={handleForecloseSuccess}
                    />
                )}

                {selectedLoanId && (
                    <VehicleFinanceLoanDetails
                        loanId={selectedLoanId}
                        initialLoan={viewLoan}
                        onClose={() => {
                            setSelectedLoanId(null);
                            setViewLoan(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default VehicleFinanceLoansPage;
