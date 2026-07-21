import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FiPlus, FiDollarSign, FiEye, FiX, FiDownload, FiTrash2 } from 'react-icons/fi';
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
    const location = useLocation();
    const { loans, fetchLoans, isLoading, companies, fetchCompanies, deleteLoan, clearError } = useVehicleFinanceContext();
    const { user } = useUserContext();
    const { canAccess, canAccessModule } = useVfPermission();
    // Loans category permissions from People & Access (no Collections fallback).
    const canViewLoans = canAccess('vf_loan_view') && canAccessModule('loans');
    const canDisburse = canViewLoans && canAccess('vf_loan_disburse');
    const canCollectLoan = canViewLoans && canAccess('vf_loan_collect');
    const canForeclose = canViewLoans && canAccess('vf_loan_foreclose');
    const canDeleteLoan = canViewLoans && (
        canAccess('vf_loan_disburse')
        || canAccess('vf_loan_foreclose')
        || canAccess('vf_loan_view')
    );
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [showDisbursementForm, setShowDisbursementForm] = useState(false);
    const [showCollectionForm, setShowCollectionForm] = useState(false);
    const [showForeclosureModal, setShowForeclosureModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [selectedLoanId, setSelectedLoanId] = useState(null);
    const [viewLoan, setViewLoan] = useState(null);
    const [loanToDelete, setLoanToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loansError, setLoansError] = useState(null);
    const hasFetchedRef = useRef(false);

    const loadLoans = async () => {
        setLoansError(null);
        if (typeof clearError === 'function') clearError();
        const result = await fetchLoans();
        if (result && result.success === false) {
            setLoansError(result.error || 'Failed to load loans');
        }
    };

    // Fetch loans and companies when component mounts
    useEffect(() => {
        if (!canViewLoans) return;
        loadLoans();
        if (fetchCompanies) {
            fetchCompanies();
        }
        hasFetchedRef.current = true;
    }, [canViewLoans]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch loans when route changes (user navigates back to this page)
    useEffect(() => {
        if (hasFetchedRef.current && location.pathname === '/vehicle-finance/user/loans') {
            const timer = setTimeout(() => {
                loadLoans();
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

    const handleDeleteLoan = async () => {
        if (!loanToDelete?.id) return;
        setIsDeleting(true);
        try {
            const result = await deleteLoan(loanToDelete.id);
            if (result.success) {
                alert('Loan and all related receivables deleted successfully.');
                setLoanToDelete(null);
                fetchLoans();
            } else {
                alert(`Failed to delete loan: ${result.message || result.error || 'Unknown error'}`);
            }
        } catch (err) {
            alert(`Failed to delete loan: ${err.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const getPaidAmount = (loan) => {
        const loanAmount = parseFloat(loan.loan_amount ?? loan.principal_amount ?? 0);
        const totalRepay = parseFloat(loan.total_repay_amount ?? loanAmount);
        const outstanding = parseFloat(loan.closing_balance ?? loan.total_outstanding ?? 0);
        const paid = totalRepay - outstanding;
        return paid > 0 ? paid : 0;
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
                {loansError && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <p className="font-medium">Could not load loans</p>
                        <p className="text-sm">{loansError}</p>
                        <button
                            onClick={() => loadLoans()}
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
                                            Total Due (Total+Int)
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Paid
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
                                            Action
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
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(
                                                    loan.total_repay_amount ??
                                                    ((parseFloat(loan.loan_amount ?? loan.principal_amount ?? 0) || 0) +
                                                        (parseFloat(loan.interest_amount ?? 0) || 0))
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-700">
                                                {formatCurrency(getPaidAmount(loan))}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(loan.closing_balance ?? loan.total_outstanding)}
                                                </div>
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
                                                    {canDeleteLoan && (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.preventDefault();
                                                                event.stopPropagation();
                                                                setLoanToDelete(loan);
                                                            }}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete Loan"
                                                        >
                                                            <FiTrash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
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
                            fetchLoans();
                        }}
                    />
                )}

                {loanToDelete && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                                    <FiTrash2 className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete Loan?</h3>
                                    <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-4">
                                <p className="text-sm font-bold text-red-800 mb-2">
                                    ⚠ Alarm: Both Loan and Receivables will be removed
                                </p>
                                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                                    <li>The loan record will be deleted permanently</li>
                                    <li>All receivables for this loan will be deleted</li>
                                    <li>Related receipts and ledger entries will also be removed</li>
                                </ul>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm text-gray-700 space-y-1">
                                <p><strong>Subscriber:</strong> {loanToDelete.subscriber?.vf_cust_name || 'N/A'}</p>
                                <p><strong>Loan Amount:</strong> {formatCurrency(loanToDelete.loan_amount || loanToDelete.principal_amount)}</p>
                                <p><strong>Outstanding:</strong> {formatCurrency(loanToDelete.closing_balance ?? loanToDelete.total_outstanding)}</p>
                                <p><strong>Status:</strong> {loanToDelete.status || 'N/A'}</p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setLoanToDelete(null)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteLoan}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleFinanceLoansPage;
