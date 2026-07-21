import React, { useState, useEffect, useCallback } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useUserContext } from '../../context/user_context';
import { useOptionalVehicleFinanceCollector } from '../../context/vehicleFinance/VehicleFinanceCollectorProvider';
import { API_BASE_URL } from '../../utils/apiConfig';
import {
    FiFilter,
    FiMapPin,
    FiUser,
    FiSearch,
    FiRefreshCw,
    FiAlertCircle,
    FiCheck,
    FiDownload,
    FiX,
} from 'react-icons/fi';
import RouteMapModal from '../../components/RouteMapModal';
import { useVfPermission } from '../../components/vehicleFinance/useVfPermission';
import VehicleFinanceCollectionReceiptPDF from '../../components/vehicleFinance/PDF/VehicleFinanceCollectionReceiptPDF';


const VehicleFinanceCollectionsPage = ({ onPaymentSuccess }) => {
    const vfCollector = useOptionalVehicleFinanceCollector();
    const { user: mainUser } = useUserContext();
    const { canAccess } = useVfPermission();
    const canCollect = canAccess('vf_collections_collect')
        || canAccess('vf_collections')
        || Boolean(vfCollector?.isAuthenticated);

    const user = vfCollector?.isAuthenticated ? vfCollector.user : mainUser;
    const token = vfCollector?.token || mainUser?.results?.token;
    const collectorUserId = vfCollector?.isAuthenticated ? vfCollector.user?.userId : null;

    const membershipId =
        vfCollector?.parentMembershipId
        || user?.userAccounts?.[0]?.parent_membership_id
        || user?.results?.userAccounts?.[0]?.parent_membership_id;

    const [receivables, setReceivables] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedReceivable, setSelectedReceivable] = useState(null);
    const [ledgerAccounts, setLedgerAccounts] = useState([]);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [selectedSubscriberForRoute, setSelectedSubscriberForRoute] = useState(null);
    const [isPaying, setIsPaying] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [receiptData, setReceiptData] = useState(null);
    const [isDownloadingBill, setIsDownloadingBill] = useState(false);
    const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        subscriberName: '',
        amount: '',
        status: 'all',
        disbursementDate: '',
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
    });
    const [paymentFormErrors, setPaymentFormErrors] = useState({});

    const companyData = companies[0] || null;

    const fetchReceivables = useCallback(async () => {
        if (!token || !membershipId) return;

        setIsLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams({
                parent_membership_id: membershipId,
                ...(filters.status ? { status: filters.status } : {}),
                ...(filters.startDate ? { start_date: filters.startDate } : {}),
                ...(filters.endDate ? { end_date: filters.endDate } : {}),
                ...(filters.subscriberName ? { subscriber_name: filters.subscriberName } : {}),
                ...(filters.amount ? { amount: filters.amount } : {}),
                ...(filters.disbursementDate ? { disbursement_date: filters.disbursementDate } : {}),
            });
            if (collectorUserId != null) {
                queryParams.set('collector_user_id', String(collectorUserId));
            }

            const res = await fetch(`${API_BASE_URL}/vf/receivables?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (res.ok) {
                const data = await res.json();
                const receivablesData = data.results || data.data || data || [];
                setReceivables(Array.isArray(receivablesData) ? receivablesData : []);
            } else {
                const errorData = await res.json().catch(() => ({ message: 'Failed to fetch receivables' }));
                throw new Error(errorData.message || 'Failed to fetch receivables');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, membershipId, collectorUserId, filters]);

    const fetchLedgerAccounts = useCallback(async () => {
        if (!token || !membershipId) return;

        try {
            const res = await fetch(
                `${API_BASE_URL}/vf/ledger/accounts?parent_membership_id=${membershipId}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (res.ok) {
                const data = await res.json();
                setLedgerAccounts(data.results || []);
            }
        } catch (err) {
            console.error('Error fetching ledger accounts:', err);
        }
    }, [token, membershipId]);

    const fetchCompanies = useCallback(async () => {
        if (!token || !membershipId) return;
        try {
            const res = await fetch(
                `${API_BASE_URL}/vf/companies?parent_membership_id=${membershipId}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (res.ok) {
                const data = await res.json();
                setCompanies(data.results || []);
            }
        } catch (err) {
            console.error('Error fetching companies:', err);
        }
    }, [token, membershipId]);

    useEffect(() => {
        fetchReceivables();
        fetchLedgerAccounts();
        fetchCompanies();
    }, [fetchReceivables, fetchLedgerAccounts, fetchCompanies]);

    useEffect(() => {
        const handleLoanDeleted = () => {
            fetchLedgerAccounts();
            fetchReceivables();
        };
        window.addEventListener('loanDeleted', handleLoanDeleted);
        return () => window.removeEventListener('loanDeleted', handleLoanDeleted);
    }, [fetchLedgerAccounts, fetchReceivables]);

    const getFilteredReceivables = () => {
        let filtered = receivables;

        if (filters.subscriberName) {
            const searchTerm = filters.subscriberName.toLowerCase();
            filtered = filtered.filter((r) => {
                const subscriber = r.subscriber || r.loan?.subscriber;
                const subscriberName = (
                    subscriber?.vf_cust_name
                    || subscriber?.name
                    || subscriber?.firstname
                    || ''
                ).toLowerCase();
                return subscriberName.includes(searchTerm);
            });
        }

        if (filters.amount) {
            const amountFilter = parseFloat(filters.amount);
            if (!isNaN(amountFilter)) {
                filtered = filtered.filter((r) => {
                    const dueAmount = parseFloat(r.due_amount || r.amount || 0);
                    return Math.abs(dueAmount - amountFilter) < 0.01;
                });
            }
        }

        if (filters.disbursementDate) {
            filtered = filtered.filter((r) => {
                const loanDisbursementDate = r.loan?.loan_disbursement_date || r.loan?.disbursement_date;
                if (!loanDisbursementDate) return false;
                return String(loanDisbursementDate).slice(0, 10) === filters.disbursementDate;
            });
        }

        return filtered;
    };

    const getStatusBadge = (receivable) => {
        const today = new Date().toISOString().split('T')[0];
        const dueDate = receivable.due_date ? String(receivable.due_date).slice(0, 10) : '';

        if (receivable.is_paid) {
            return { text: 'Paid', color: 'bg-green-100 text-green-800' };
        }
        if (dueDate === today) {
            return { text: "Today's Due", color: 'bg-blue-100 text-blue-800' };
        }
        if (dueDate && dueDate < today) {
            return { text: 'Overdue', color: 'bg-red-100 text-red-800' };
        }
        return { text: 'Future', color: 'bg-gray-100 text-gray-800' };
    };

    const formatAmount = (amount) => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return '₹0';
        return `₹${numAmount.toLocaleString('en-IN')}`;
    };

    const handleNavigate = (receivable) => {
        const subscriber = receivable.subscriber || receivable.loan?.subscriber;
        if (!subscriber) {
            alert('Subscriber information not available');
            return;
        }

        const latitude = parseFloat(subscriber.latitude);
        const longitude = parseFloat(subscriber.longitude);
        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
            alert("Location not available for this subscriber.\n\nPlease update the subscriber's address with location coordinates.");
            return;
        }

        setSelectedSubscriberForRoute({
            name: subscriber.vf_cust_name || subscriber.name || subscriber.firstname || 'Subscriber',
            phone: subscriber.vf_cust_phone || subscriber.phone || '',
            latitude,
            longitude,
        });
        setShowRouteModal(true);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedReceivable(null);
        setReceiptData(null);
        setIsConfirmingPayment(false);
        setPaymentFormErrors({});
        setPaymentForm({
            amount: '',
            paymentMethod: '',
            paymentDate: new Date().toISOString().split('T')[0],
            notes: '',
        });
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const requestPaymentConfirmation = () => {
        const errors = {};
        if (!paymentForm.amount) {
            errors.amount = 'Please enter the amount';
        }
        if (!paymentForm.paymentMethod) {
            errors.paymentMethod = 'Choose the payment method';
        }
        if (Object.keys(errors).length > 0) {
            setPaymentFormErrors(errors);
            return;
        }
        setPaymentFormErrors({});
        if (!selectedReceivable || !token || !membershipId) return;
        setIsConfirmingPayment(true);
    };

    const handlePayment = async () => {
        if (!selectedReceivable || !token || !membershipId) return;

        setIsPaying(true);
        try {
            const payload = {
                receivableId: selectedReceivable.id,
                amount: parseFloat(paymentForm.amount),
                paymentMethod: paymentForm.paymentMethod,
                paymentDate: paymentForm.paymentDate,
                notes: paymentForm.notes,
                membershipId,
            };

            const res = await fetch(`${API_BASE_URL}/vf/collections/pay`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const result = await res.json();
                const paymentType = result.results?.paymentType;
                const remainingAmount = Number(result.results?.remainingAmount || 0);
                const receipt = result.results?.receipt || {};
                const loan = selectedReceivable.loan || {};
                const subscriber = selectedReceivable.subscriber || loan.subscriber || {};
                const amountPaid = parseFloat(paymentForm.amount);
                const dueAmountBefore = parseFloat(
                    selectedReceivable.due_amount || selectedReceivable.amount || 0
                );
                const closingBefore = parseFloat(loan.closing_balance ?? loan.total_outstanding ?? 0);
                const vehicleParts = [loan.vehicle_make, loan.vehicle_model].filter(Boolean);
                const vehicleLabel =
                    vehicleParts.join(' ')
                    || selectedReceivable.product?.product_name
                    || loan.product?.product_name
                    || loan.vehicle_type
                    || 'Vehicle Finance';

                setIsConfirmingPayment(false);
                setReceiptData({
                    billNumber: receipt.bill_number ?? receipt.billNumber ?? receipt.id,
                    receiptId: receipt.id,
                    subscriberName:
                        subscriber.vf_cust_name
                        || subscriber.name
                        || subscriber.firstname
                        || 'Subscriber',
                    subscriberPhone: subscriber.vf_cust_phone || subscriber.phone || '',
                    vehicleLabel,
                    vehicleNumber: loan.vehicle_number || '',
                    loanAmount: loan.loan_amount ?? loan.principal_amount,
                    interestAmount: loan.interest_amount,
                    totalRepayAmount: loan.total_repay_amount,
                    repaymentMode: loan.repayment_mode || loan.tenure_mode || '',
                    disbursedDate: formatDisplayDate(loan.loan_disbursement_date || loan.disbursed_date),
                    outstandingAfter: Math.max(0, closingBefore - amountPaid),
                    dueDate: formatDisplayDate(selectedReceivable.due_date),
                    dueAmount: dueAmountBefore,
                    amountPaid,
                    paymentType: paymentType === 'partial' ? 'Partial' : 'Full',
                    paymentMethod: paymentForm.paymentMethod,
                    paymentDate: paymentForm.paymentDate,
                    paymentDateFormatted: formatDisplayDate(paymentForm.paymentDate),
                    remainingAmount,
                    notes: paymentForm.notes || '',
                });

                fetchReceivables();
                fetchLedgerAccounts();
                window.dispatchEvent(new CustomEvent('vfCollectionPaid', {
                    detail: { paymentType, remainingAmount },
                }));
                if (typeof onPaymentSuccess === 'function') {
                    onPaymentSuccess();
                }
            } else {
                const errBody = await res.json();
                throw new Error(errBody.message || 'Payment failed');
            }
        } catch (err) {
            setIsConfirmingPayment(false);
            alert(`Payment failed: ${err.message}`);
        } finally {
            setIsPaying(false);
        }
    };

    const filteredReceivables = getFilteredReceivables();

    const getLoanProgress = useCallback((loanId, receivable) => {
        if (receivable?.collection_progress) {
            return {
                paid: Number(receivable.collection_progress.paid) || 0,
                total: Number(receivable.collection_progress.total) || 0,
            };
        }
        if (!loanId) return { paid: 0, total: 0 };

        const loanReceivables = receivables.filter((r) => {
            const rLoanId = r.loan_id || r.loan?.id;
            return String(rLoanId) === String(loanId);
        });
        const totalFromLoan = Number(receivable?.loan?.total_installments) || 0;
        const unpaid = loanReceivables.filter((r) => !r.is_paid).length;
        const total = Math.max(totalFromLoan, loanReceivables.length);
        const paid = total > 0 ? Math.max(0, total - unpaid) : loanReceivables.filter((r) => r.is_paid).length;
        return { paid, total };
    }, [receivables]);

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Collections</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage vehicle finance loan collections and payments</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setFilters({
                                startDate: '',
                                endDate: '',
                                subscriberName: '',
                                amount: '',
                                status: 'all',
                                disbursementDate: '',
                            })}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FiFilter className="w-4 h-4" />
                            Clear Filters
                        </button>
                        <button
                            type="button"
                            onClick={fetchReceivables}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FiFilter className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Today&apos;s Due + Overdue</option>
                                <option value="today">Today&apos;s Due</option>
                                <option value="overdue">Over Due</option>
                                <option value="future">Future Due</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subscriber</label>
                            <input
                                type="text"
                                value={filters.subscriberName}
                                onChange={(e) => setFilters({ ...filters, subscriberName: e.target.value })}
                                placeholder="Search subscriber"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                            <input
                                type="number"
                                value={filters.amount}
                                onChange={(e) => setFilters({ ...filters, amount: e.target.value })}
                                placeholder="Amount"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Disbursement Date</label>
                            <input
                                type="date"
                                value={filters.disbursementDate}
                                onChange={(e) => setFilters({ ...filters, disbursementDate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Receivables ({filteredReceivables.length})
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {filters.status === 'all' ? "Showing today's due and overdue amounts" :
                                        filters.status === 'today' ? "Showing today's due amounts only" :
                                            filters.status === 'overdue' ? 'Showing overdue amounts only' :
                                                filters.status === 'future' ? 'Showing future due amounts only' :
                                                    'Showing filtered results'}
                                </p>
                            </div>
                            {filteredReceivables.length > 0 && (
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">Total Amount</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {formatAmount(
                                            filteredReceivables.reduce(
                                                (sum, r) => sum + parseFloat(r.due_amount || r.amount || 0),
                                                0
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subscriber</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product / Loan</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Collection Progress</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Due Date</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Route</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <FiRefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                                                <p className="text-gray-500">Loading receivables...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <FiAlertCircle className="w-8 h-8 text-red-400" />
                                                <p className="text-red-500">Error: {error}</p>
                                                <button
                                                    type="button"
                                                    onClick={fetchReceivables}
                                                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                    Try again
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredReceivables.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <FiSearch className="w-8 h-8 text-gray-400" />
                                                <p className="text-gray-500">No receivables found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReceivables.map((receivable) => {
                                        const status = getStatusBadge(receivable);
                                        const loanId = receivable.loan_id || receivable.loan?.id;
                                        const progress = getLoanProgress(loanId, receivable);
                                        const subscriber = receivable.subscriber || receivable.loan?.subscriber;
                                        return (
                                            <tr key={receivable.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <FiUser className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {subscriber?.vf_cust_name
                                                                    || subscriber?.name
                                                                    || subscriber?.firstname
                                                                    || 'N/A'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {subscriber?.vf_cust_phone || subscriber?.phone || ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {receivable.product?.product_name
                                                            || receivable.loan?.product?.product_name
                                                            || receivable.loan?.vehicle_type
                                                            || 'Vehicle Finance'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {receivable.loan?.payment_method
                                                            || receivable.loan?.loan_mode
                                                            || ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {progress.total > 0 ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {progress.paid} / {progress.total} receivables
                                                            </span>
                                                            <span className="text-xs text-gray-500">completed</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {formatAmount(receivable.due_amount || receivable.amount)}
                                                    </span>
                                                    {receivable.due_amount
                                                        && receivable.amount
                                                        && Number(receivable.due_amount) !== Number(receivable.amount) && (
                                                        <div className="text-xs text-gray-500">
                                                            Total: {formatAmount(receivable.amount)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm text-gray-600">
                                                        {receivable.due_date
                                                            ? new Date(receivable.due_date).toLocaleDateString('en-GB')
                                                            : 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleNavigate(receivable)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center mx-auto gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                                        title="Get directions to subscriber location"
                                                    >
                                                        <FiMapPin className="w-4 h-4" />
                                                        <span className="text-xs">Route</span>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {!receivable.is_paid && canCollect && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedReceivable(receivable);
                                                                setReceiptData(null);
                                                                setIsConfirmingPayment(false);
                                                                setPaymentForm({
                                                                    amount: receivable.due_amount || receivable.amount || 0,
                                                                    paymentMethod: '',
                                                                    paymentDate: new Date().toISOString().split('T')[0],
                                                                    notes: '',
                                                                });
                                                                setPaymentFormErrors({});
                                                                setShowPaymentModal(true);
                                                            }}
                                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            Collect
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showPaymentModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                            {receiptData ? (
                                <div className="space-y-5">
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                                            <FiCheck className="w-8 h-8 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800">Payment Successful!</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {receiptData.paymentType === 'Partial'
                                                ? `Partial payment collected. Remaining: ${formatAmount(receiptData.remainingAmount)}`
                                                : 'Full payment collected and receivable closed.'}
                                        </p>
                                    </div>

                                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Bill No</span>
                                            <span className="font-semibold text-right break-all">{receiptData.billNumber}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Subscriber</span>
                                            <span className="font-semibold text-right">{receiptData.subscriberName}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Vehicle / Loan</span>
                                            <span className="font-semibold text-right">{receiptData.vehicleLabel}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Due Date</span>
                                            <span className="font-semibold">{receiptData.dueDate}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Due Amount</span>
                                            <span className="font-semibold">{formatAmount(receiptData.dueAmount)}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Amount Paid</span>
                                            <span className="font-semibold text-green-700">{formatAmount(receiptData.amountPaid)}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Payment Method</span>
                                            <span className="font-semibold">{receiptData.paymentMethod}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Payment Date</span>
                                            <span className="font-semibold">{receiptData.paymentDateFormatted}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <PDFDownloadLink
                                            key={`vf-bill-${receiptData.billNumber}`}
                                            document={
                                                <VehicleFinanceCollectionReceiptPDF
                                                    receiptData={receiptData}
                                                    companyData={companyData}
                                                />
                                            }
                                            fileName={`VF-Receipt-${receiptData.subscriberName || 'bill'}-${Date.now()}.pdf`}
                                            className="flex-1"
                                            onClick={() => {
                                                setIsDownloadingBill(true);
                                                setTimeout(() => setIsDownloadingBill(false), 2500);
                                            }}
                                        >
                                            {({ loading: pdfLoading }) => (
                                                <button
                                                    type="button"
                                                    className="w-full py-2.5 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <FiDownload className="w-4 h-4" />
                                                    {pdfLoading || isDownloadingBill ? 'Preparing Bill...' : 'Download Bill'}
                                                </button>
                                            )}
                                        </PDFDownloadLink>
                                        <button
                                            type="button"
                                            onClick={closePaymentModal}
                                            className="flex-1 py-2.5 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FiX className="w-4 h-4" />
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : isConfirmingPayment ? (
                                <div className="space-y-5">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-gray-800">Confirm Payment</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Please review the details before collecting payment.
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Subscriber</span>
                                            <span className="font-semibold text-right">
                                                {selectedReceivable?.subscriber?.vf_cust_name
                                                    || selectedReceivable?.loan?.subscriber?.vf_cust_name
                                                    || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Due Date</span>
                                            <span className="font-semibold">
                                                {formatDisplayDate(selectedReceivable?.due_date)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Due Amount</span>
                                            <span className="font-semibold">
                                                {formatAmount(selectedReceivable?.due_amount || selectedReceivable?.amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Amount to Collect</span>
                                            <span className="font-semibold text-green-700">
                                                {formatAmount(paymentForm.amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Payment Method</span>
                                            <span className="font-semibold">{paymentForm.paymentMethod}</span>
                                        </div>
                                        <div className="flex justify-between gap-3">
                                            <span className="text-gray-600">Payment Date</span>
                                            <span className="font-semibold">
                                                {formatDisplayDate(paymentForm.paymentDate)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsConfirmingPayment(false)}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                            disabled={isPaying}
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handlePayment}
                                            disabled={isPaying}
                                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <FiCheck className="w-4 h-4" />
                                            {isPaying ? 'Collecting...' : 'Confirm & Collect'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Collect Payment</h3>
                                    {selectedReceivable && (
                                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                            <div className="text-sm text-blue-800">
                                                <strong>Due Amount:</strong>{' '}
                                                {formatAmount(selectedReceivable.due_amount || selectedReceivable.amount)}
                                            </div>
                                            <div className="text-xs text-blue-600 mt-1">
                                                Enter less than due for partial payment (remaining stays pending / carried forward).
                                                Full payment closes the receivable. Both are recorded in the ledger.
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                                            <input
                                                type="number"
                                                value={paymentForm.amount}
                                                onChange={(e) => {
                                                    setPaymentForm({ ...paymentForm, amount: e.target.value });
                                                    if (paymentFormErrors.amount) {
                                                        setPaymentFormErrors({ ...paymentFormErrors, amount: '' });
                                                    }
                                                }}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                                    paymentFormErrors.amount ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                                step="0.01"
                                            />
                                            {paymentFormErrors.amount && (
                                                <p className="mt-1 text-sm text-red-600">{paymentFormErrors.amount}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                            <select
                                                value={paymentForm.paymentMethod}
                                                onChange={(e) => {
                                                    setPaymentForm({ ...paymentForm, paymentMethod: e.target.value });
                                                    if (paymentFormErrors.paymentMethod) {
                                                        setPaymentFormErrors({ ...paymentFormErrors, paymentMethod: '' });
                                                    }
                                                }}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                                                    paymentFormErrors.paymentMethod ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            >
                                                <option value="">Select Payment Method</option>
                                                {ledgerAccounts.map((account) => (
                                                    <option key={account.id} value={account.account_name}>
                                                        {account.account_name} (Balance: ₹{Number(account.current_balance || 0).toLocaleString('en-IN')})
                                                    </option>
                                                ))}
                                            </select>
                                            {ledgerAccounts.length === 0 && (
                                                <p className="mt-1 text-xs text-amber-600">
                                                    No ledger accounts found. Create an account under Ledger first.
                                                </p>
                                            )}
                                            {paymentFormErrors.paymentMethod && (
                                                <p className="mt-1 text-sm text-red-600">{paymentFormErrors.paymentMethod}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                                            <input
                                                type="date"
                                                value={paymentForm.paymentDate}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                                            <textarea
                                                value={paymentForm.notes}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                rows="3"
                                                placeholder="Optional notes"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={closePaymentModal}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                            disabled={isPaying}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={requestPaymentConfirmation}
                                            disabled={isPaying}
                                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                                        >
                                            Collect Payment
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {showRouteModal && selectedSubscriberForRoute && (
                    <RouteMapModal
                        isOpen={showRouteModal}
                        onClose={() => {
                            setShowRouteModal(false);
                            setSelectedSubscriberForRoute(null);
                        }}
                        subscriberData={selectedSubscriberForRoute}
                    />
                )}
            </div>
        </div>
    );
};

export default VehicleFinanceCollectionsPage;
