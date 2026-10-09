import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useDcLiveEvents } from '../../context/dailyCollection/dcLiveEvents_context';
import { FiFilter, FiMapPin, FiUser, FiSearch, FiRefreshCw, FiAlertCircle, FiDownload, FiCheck, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import RouteMapModal from '../../components/RouteMapModal';
import { pdf } from '@react-pdf/renderer';
import CollectionsReportPDF from '../../components/dailyCollection/PDF/CollectionsReportPDF';
import CollectionReceiptPDF from '../../components/dailyCollection/PDF/CollectionReceiptPDF';

const downloadPdfBlob = async (documentNode, fileName) => {
    const blob = await pdf(documentNode).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const areaIdOf = (row) => String(
    row?.subscriber?.dc_aob_id
    || row?.subscriber?.area?.id
    || row?.dc_aob_id
    || ''
);

const areaNameOf = (row) => String(
    row?.subscriber?.area_name
    || row?.area_name
    || row?.subscriber?.area?.aob
    || ''
).trim();

const CollectionsPage = ({ collectorScoped = false }) => {
    const { user } = useUserContext();
    const [receivables, setReceivables] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedReceivable, setSelectedReceivable] = useState(null);
    const [ledgerAccounts, setLedgerAccounts] = useState([]);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [selectedSubscriberForRoute, setSelectedSubscriberForRoute] = useState(null);
    const [companies, setCompanies] = useState([]);
    const [receiptData, setReceiptData] = useState(null);
    const [isDownloadingBill, setIsDownloadingBill] = useState(false);
    const [isDownloadingReport, setIsDownloadingReport] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Filters - Default to show today's due and overdue
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        subscriberName: '',
        amount: '',
        status: 'due', // due (today + overdue), all, today, overdue, future
        disbursementDate: '',
        area: '',
    });
    const [areas, setAreas] = useState([]);
    const [filtersOpen, setFiltersOpen] = useState(true);

    // Payment form
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMethod: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Fetch receivables
    const fetchReceivables = useCallback(async ({ silent = false } = {}) => {
        if (!user?.results?.token) return;

        if (!silent) {
            setIsLoading(true);
            setError(null);
        }

        try {
            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            const queryParams = new URLSearchParams({
                parent_membership_id: membershipId,
                ...(collectorScoped ? { collector_scope: '1' } : {}),
                ...(filters.status ? { status: filters.status } : {}), // Send status including 'all'
                ...(filters.startDate ? { start_date: filters.startDate } : {}),
                ...(filters.endDate ? { end_date: filters.endDate } : {}),
                ...(filters.subscriberName ? { subscriber_name: filters.subscriberName } : {}),
                ...(filters.amount ? { amount: filters.amount } : {}),
                ...(filters.disbursementDate ? { disbursement_date: filters.disbursementDate } : {}),
            });

            const url = `${API_BASE_URL}/dc/receivables?${queryParams.toString()}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.ok) {
                const data = await res.json();
                const receivablesData = data.results || data.data || data || [];
                const list = Array.isArray(receivablesData) ? receivablesData : [];
                setReceivables(list);
                setSelectedReceivable((current) => {
                    if (!current) return current;
                    const updated = list.find((item) => item.id === current.id);
                    if (!updated || updated.is_paid) {
                        setShowPaymentModal(false);
                        return null;
                    }
                    return { ...current, ...updated };
                });
            } else {
                const errorData = await res.json().catch(() => ({ message: 'Failed to fetch receivables' }));
                throw new Error(errorData.message || 'Failed to fetch receivables');
            }
        } catch (error) {
            console.error('Error fetching receivables:', error);
            if (!silent) setError(error.message);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [user, filters, collectorScoped]);

    // Fetch ledger accounts for payment methods
    const fetchLedgerAccounts = useCallback(async () => {
        if (!user?.results?.token) return;

        try {
            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
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
    }, [user]);

    // Fetch companies for PDF
    const fetchCompanies = useCallback(async () => {
        if (!user?.results?.token) return;

        try {
            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
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

    const fetchAreas = useCallback(async () => {
        if (!user?.results?.token) return;
        try {
            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            const url = `${API_BASE_URL}/dc/aob?parent_membership_id=${membershipId}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
                },
            });
            if (res.ok) {
                const data = await res.json();
                setAreas(data.results || data.data || []);
            }
        } catch (error) {
            console.error('Error fetching areas:', error);
        }
    }, [user]);

    useEffect(() => {
        fetchReceivables();
        fetchLedgerAccounts();
        fetchCompanies();
        fetchAreas();
    }, [user, filters, fetchCompanies, fetchReceivables, fetchLedgerAccounts, fetchAreas]);

    useDcLiveEvents(() => {
        fetchReceivables({ silent: true });
        fetchLedgerAccounts();
    });

    useEffect(() => {
        const poll = () => {
            if (document.visibilityState !== 'visible') return;
            fetchReceivables({ silent: true });
            fetchLedgerAccounts();
        };
        const timer = setInterval(poll, 4000);
        return () => clearInterval(timer);
    }, [fetchReceivables, fetchLedgerAccounts]);

    // Listen for loan deletion events and refresh ledger accounts (to update balances)
    useEffect(() => {
        const handleLoanDeleted = (event) => {
            const { accountBalanceUpdates } = event.detail;
            if (accountBalanceUpdates && accountBalanceUpdates.length > 0) {
                console.log('🔄 Loan deleted - refreshing ledger accounts for updated balances');
                fetchLedgerAccounts();
            }
        };

        window.addEventListener('loanDeleted', handleLoanDeleted);
        return () => {
            window.removeEventListener('loanDeleted', handleLoanDeleted);
        };
    }, [fetchLedgerAccounts]);

    const filteredReceivables = useMemo(() => {
        let filtered = receivables;

        if (filters.subscriberName) {
            const searchTerm = filters.subscriberName.toLowerCase();
            filtered = filtered.filter(r => {
                const subscriberName = (
                    r.subscriber?.name ||
                    r.subscriber?.firstname ||
                    r.subscriber?.dc_cust_name ||
                    ''
                ).toLowerCase();
                return subscriberName.includes(searchTerm);
            });
        }

        if (filters.amount) {
            const amountFilter = parseFloat(filters.amount);
            if (!isNaN(amountFilter)) {
                filtered = filtered.filter(r => {
                    const dueAmount = parseFloat(r.due_amount || r.amount || 0);
                    return Math.abs(dueAmount - amountFilter) < 0.01;
                });
            }
        }

        if (filters.disbursementDate) {
            filtered = filtered.filter(r => {
                const loanDisbursementDate = r.loan?.loan_disbursement_date || r.loan?.disbursement_date;
                if (!loanDisbursementDate) return false;
                return loanDisbursementDate === filters.disbursementDate;
            });
        }

        if (filters.area) {
            const wanted = String(filters.area).trim().toLowerCase();
            filtered = filtered.filter((r) => {
                const id = areaIdOf(r).toLowerCase();
                const name = areaNameOf(r).toLowerCase();
                return id === wanted || name === wanted;
            });
        }

        return filtered;
    }, [receivables, filters.subscriberName, filters.amount, filters.disbursementDate, filters.area]);

    const areaFilterOptions = useMemo(() => {
        const byId = new Map();
        (areas || []).forEach((area) => {
            const id = String(area.id || '');
            const name = String(area.aob || '').trim();
            if (!id || !name) return;
            byId.set(id, { id, name, count: 0 });
        });
        receivables.forEach((row) => {
            const id = areaIdOf(row);
            const name = areaNameOf(row);
            if (!id && !name) return;
            const key = id || name.toLowerCase();
            const current = byId.get(key) || { id: key, name: name || 'Area', count: 0 };
            current.count += 1;
            if (name) current.name = name;
            byId.set(key, current);
        });
        return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    }, [areas, receivables]);

    const pagination = useMemo(() => {
        const totalItems = filteredReceivables.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
        const safePage = Math.min(currentPage, totalPages);
        const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);
        return {
            totalItems,
            totalPages,
            safePage,
            startIndex,
            endIndex,
            pageItems: filteredReceivables.slice(startIndex, endIndex),
        };
    }, [filteredReceivables, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, pageSize]);

    // Get status badge - User perspective
    const getStatusBadge = (receivable) => {
        const today = new Date().toISOString().split('T')[0];
        const dueDate = receivable.due_date;

        if (receivable.is_paid) {
            return { text: 'Paid', color: 'bg-green-100 text-green-800' };
        } else if (dueDate === today) {
            return { text: "Today's Due", color: 'bg-blue-100 text-blue-800' };
        } else if (dueDate < today) {
            return { text: 'Overdue', color: 'bg-red-100 text-red-800' };
        } else {
            return { text: 'Future', color: 'bg-gray-100 text-gray-800' };
        }
    };

    // Safe amount display to prevent NaN
    const formatAmount = (amount) => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return '₹0';
        return `₹${numAmount.toLocaleString("en-IN")}`;
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const companyDataForPdf = useMemo(() => {
        if (!companies[0]) return {};
        const company = companies[0];
        const logo = company?.company_logo_base64format || company?.company_logo || '';
        const companyName = company?.company_name || 'Daily Collection Company';
        return {
            company_name: companyName,
            company_logo_base64format: logo,
            company_logo: logo,
            logo_base64format: logo,
            contact_no: company?.contact_no || '',
            address: company?.address || '',
            companyName,
            name: companyName,
            phone: company?.contact_no || '',
            email: company?.email || '',
        };
    }, [companies]);

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setSelectedReceivable(null);
        setReceiptData(null);
        setIsPaying(false);
        setPaymentForm({
            amount: '',
            paymentMethod: '',
            paymentDate: new Date().toISOString().split('T')[0],
            notes: '',
        });
    };

    const buildWhatsAppBillUrl = (bill) => {
        if (!bill) return null;
        const digits = String(bill.subscriberPhone || '').replace(/\D/g, '');
        const subscriberPhone = digits.length >= 10
            ? (digits.length === 10 ? `91${digits}` : digits)
            : '';
        const companyLabel = companyDataForPdf.company_name ? ` from ${companyDataForPdf.company_name}` : '';
        const message = [
            `Payment Receipt${companyLabel}`,
            '',
            `Bill No: ${bill.billNumber ?? '-'}`,
            `Subscriber: ${bill.subscriberName || '-'}`,
            `Product / Loan: ${bill.productLabel || '-'}`,
            `Due Date: ${bill.dueDate || '-'}`,
            `Due Amount: ${formatAmount(bill.dueAmount)}`,
            `Amount Paid: ${formatAmount(bill.amountPaid)}`,
            `Payment Method: ${bill.paymentMethod || '-'}`,
            `Payment Type: ${bill.paymentType || '-'}`,
            `Payment Date: ${bill.paymentDateFormatted || '-'}`,
            bill.remainingAmount > 0
                ? `Remaining / Carry Forward: ${formatAmount(bill.remainingAmount)}`
                : null,
            '',
            'Thank you for your payment.',
        ].filter(Boolean).join('\n');
        const encoded = encodeURIComponent(message);
        return subscriberPhone
            ? `https://api.whatsapp.com/send?phone=${subscriberPhone}&text=${encoded}`
            : `https://api.whatsapp.com/send?text=${encoded}`;
    };

    const handleSendBillOnWhatsApp = () => {
        const url = buildWhatsAppBillUrl(receiptData);
        if (!url) return;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // Handle navigation to subscriber location
    const handleNavigate = (receivable) => {
        console.log('🗺️ handleNavigate called:', receivable);
        const subscriber = receivable.subscriber;
        console.log('👤 Subscriber data:', subscriber);

        // Check if subscriber has location data
        if (!subscriber) {
            alert('❌ Subscriber information not available');
            return;
        }

        const latitude = parseFloat(subscriber.latitude);
        const longitude = parseFloat(subscriber.longitude);
        console.log('📍 Coordinates:', { latitude, longitude });

        if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
            alert('❌ Location not available for this subscriber.\n\nPlease update the subscriber\'s address with location coordinates.');
            return;
        }

        // Open route modal with subscriber data
        const subscriberData = {
            name: subscriber.name || subscriber.firstname || subscriber.dc_cust_name || 'Subscriber',
            phone: subscriber.phone || subscriber.dc_cust_phone || '',
            latitude: latitude,
            longitude: longitude
        };
        console.log('✅ Opening modal with data:', subscriberData);
        setSelectedSubscriberForRoute(subscriberData);
        setShowRouteModal(true);
        console.log('✅ Modal state set to true');
    };

    // Handle payment
    const handlePayment = async () => {
        if (!paymentForm.amount || !paymentForm.paymentMethod) {
            alert('Please fill in amount and payment method');
            return;
        }

        setIsPaying(true);
        try {
            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            const payload = {
                receivableId: selectedReceivable.id,
                amount: parseFloat(paymentForm.amount),
                paymentMethod: paymentForm.paymentMethod,
                paymentDate: paymentForm.paymentDate,
                notes: paymentForm.notes,
                membershipId: membershipId
            };

            const res = await fetch(`${API_BASE_URL}/dc/collections/pay`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    "Content-Type": "application/json",
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
                const closingBefore = parseFloat(loan.closing_balance ?? 0);

                setReceiptData({
                    billNumber: receipt.bill_number ?? receipt.billNumber ?? '-',
                    receiptId: receipt.id,
                    subscriberName:
                        subscriber.name
                        || subscriber.firstname
                        || subscriber.dc_cust_name
                        || 'Subscriber',
                    subscriberPhone: subscriber.phone || subscriber.dc_cust_phone || '',
                    productLabel:
                        selectedReceivable.product?.product_name
                        || loan.product?.product_name
                        || 'Daily Collection Loan',
                    loanAmount: loan.loan_amount ?? loan.principal_amount,
                    interestAmount: loan.interest_amount,
                    repaymentMode: loan.payment_method || loan.repayment_mode || loan.tenure_mode || '',
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
            } else {
                const error = await res.json();
                throw new Error(error.message || 'Payment failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed: ' + error.message);
        } finally {
            setIsPaying(false);
        }
    };

    const loanProgressById = useMemo(() => {
        const map = {};
        receivables.forEach((r) => {
            const loanId = r.loan_id || r.loan?.id;
            if (!loanId) return;
            if (!map[loanId]) map[loanId] = { paid: 0, total: 0 };
            map[loanId].total += 1;
            if (r.is_paid) map[loanId].paid += 1;
        });
        return map;
    }, [receivables]);

    const getLoanProgress = useCallback((loanId) => {
        if (!loanId) return { paid: 0, total: 0 };
        return loanProgressById[loanId] || { paid: 0, total: 0 };
    }, [loanProgressById]);

    const handleDownloadCollectionsPdf = async () => {
        if (isDownloadingReport || filteredReceivables.length === 0) return;
        setIsDownloadingReport(true);
        try {
            await downloadPdfBlob(
                <CollectionsReportPDF
                    receivables={filteredReceivables}
                    companyData={companyDataForPdf}
                    filters={filters}
                />,
                `collections-report-${filters.status || 'all'}-${new Date().toISOString().split('T')[0]}.pdf`
            );
        } catch (err) {
            console.error('Collections PDF download failed', err);
        } finally {
            setIsDownloadingReport(false);
        }
    };

    const handleDownloadReceiptPdf = async () => {
        if (isDownloadingBill || !receiptData) return;
        setIsDownloadingBill(true);
        try {
            await downloadPdfBlob(
                <CollectionReceiptPDF
                    receiptData={receiptData}
                    companyData={companyDataForPdf}
                />,
                `DC-Receipt-${receiptData.subscriberName || 'bill'}-${Date.now()}.pdf`
            );
        } catch (err) {
            console.error('Receipt PDF download failed', err);
        } finally {
            setIsDownloadingBill(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                            {collectorScoped ? 'My Collections' : 'Collections'}
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {collectorScoped
                                ? 'Collect receivables only in your assigned areas'
                                : 'Manage loan collections and payments'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {filteredReceivables.length > 0 && companies.length > 0 && (
                            <button
                                type="button"
                                onClick={handleDownloadCollectionsPdf}
                                disabled={isDownloadingReport}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
                            >
                                <FiDownload className="w-4 h-4" />
                                {isDownloadingReport ? 'Generating PDF...' : 'Download PDF'}
                            </button>
                        )}
                        <button
                            onClick={() => setFilters({
                                startDate: '',
                                endDate: '',
                                subscriberName: '',
                                amount: '',
                                status: 'due',
                                disbursementDate: '',
                                area: '',
                            })}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FiFilter className="w-4 h-4" />
                            Clear Filters
                        </button>
                        <button
                            onClick={fetchReceivables}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                            <FiFilter className="w-5 h-5 text-gray-600 shrink-0" />
                            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                            {!filtersOpen && (
                                <span className="text-xs text-gray-500 truncate">
                                    {filters.area
                                        ? (areaFilterOptions.find((option) => String(option.id) === String(filters.area))?.name || 'Area')
                                        : 'All areas'}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setFiltersOpen((open) => !open)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 shrink-0"
                            aria-expanded={filtersOpen}
                        >
                            {filtersOpen ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                            {filtersOpen ? 'Minimize' : 'Maximize'}
                        </button>
                    </div>
                    {filtersOpen && (
                    <div className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All</option>
                                <option value="due">Today's Due + Overdue</option>
                                <option value="today">Today's Due</option>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Area</label>
                            <select
                                value={filters.area}
                                onChange={(e) => setFilters({ ...filters, area: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">All areas</option>
                                {areaFilterOptions.map((option) => (
                                    <option key={option.id} value={option.id}>{option.name}</option>
                                ))}
                            </select>
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
                    {areaFilterOptions.length > 0 && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 mr-1">
                                Areas
                            </span>
                            {areaFilterOptions.map((option) => {
                                const active = String(filters.area) === String(option.id);
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setFilters((p) => ({
                                            ...p,
                                            area: active ? '' : option.id,
                                        }))}
                                        className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors ${
                                            active
                                                ? 'bg-red-500 text-white border-red-500'
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-red-200 hover:text-red-700'
                                        }`}
                                    >
                                        {option.name}{option.count ? ` (${option.count})` : ''}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    </div>
                    )}
                </div>

                {/* Receivables Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Receivables ({filteredReceivables.length})
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {filters.status === 'all' ? "Showing all unpaid receivables" :
                                        filters.status === 'due' ? "Showing today's due and overdue amounts" :
                                        filters.status === 'today' ? "Showing today's due amounts only" :
                                            filters.status === 'overdue' ? "Showing overdue (unpaid history) amounts only" :
                                                filters.status === 'future' ? "Showing future due amounts only" :
                                                    "Showing filtered results"}
                                </p>
                            </div>
                            {filteredReceivables.length > 0 && (
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">Total Amount</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {formatAmount(filteredReceivables.reduce((sum, r) => sum + parseFloat(r.due_amount || r.amount || 0), 0))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subscriber</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
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
                                                <p className="text-sm text-gray-400">
                                                    {receivables.length === 0
                                                        ? "No receivables match the current filters. Try adjusting your filters or check if there are any receivables in the system."
                                                        : "No receivables match the current filters. Try adjusting your filters."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    pagination.pageItems.map((receivable) => {
                                        const status = getStatusBadge(receivable);
                                        const loanId = receivable.loan_id || receivable.loan?.id;
                                        const progress = getLoanProgress(loanId);
                                        return (
                                            <tr key={receivable.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <FiUser className="w-4 h-4 text-gray-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {receivable.subscriber?.name ||
                                                                    receivable.subscriber?.firstname ||
                                                                    receivable.subscriber?.dc_cust_name ||
                                                                    'N/A'}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {receivable.subscriber?.phone ||
                                                                    receivable.subscriber?.dc_cust_phone ||
                                                                    ''}
                                                                {(receivable.subscriber?.area_name || receivable.area_name) ? (
                                                                    <span className="block text-xs text-gray-400">
                                                                        {receivable.subscriber?.area_name || receivable.area_name}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {receivable.product?.product_name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {receivable.loan?.payment_method || ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {progress.total > 0 ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {progress.paid} / {progress.total} receivables
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                completed
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {formatAmount(receivable.due_amount || receivable.amount)}
                                                    </span>
                                                    {receivable.due_amount && receivable.amount && receivable.due_amount !== receivable.amount && (
                                                        <div className="text-xs text-gray-500">
                                                            Total: {formatAmount(receivable.amount)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm text-gray-600">
                                                        {receivable.due_date ? new Date(receivable.due_date).toLocaleDateString('en-GB') : 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleNavigate(receivable)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center mx-auto gap-1 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                                        title="Get directions to subscriber location"
                                                    >
                                                        <FiMapPin className="w-4 h-4" />
                                                        <span className="text-xs">Route</span>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {!receivable.is_paid && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setReceiptData(null);
                                                                setSelectedReceivable(receivable);
                                                                setPaymentForm({
                                                                    amount: receivable.due_amount || receivable.amount || 0,
                                                                    paymentMethod: '',
                                                                    paymentDate: new Date().toISOString().split('T')[0],
                                                                    notes: ''
                                                                });
                                                                setShowPaymentModal(true);
                                                            }}
                                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
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

                    {/* Mobile cards */}
                    <div className="md:hidden p-4 space-y-3">
                        {isLoading && (
                            <p className="text-center text-gray-500 py-8">Loading receivables...</p>
                        )}
                        {!isLoading && error && (
                            <p className="text-center text-red-500 py-8">Error: {error}</p>
                        )}
                        {!isLoading && !error && filteredReceivables.length === 0 && (
                            <p className="text-center text-gray-500 py-8">
                                {collectorScoped
                                    ? 'No receivables in your assigned areas'
                                    : 'No receivables found'}
                            </p>
                        )}
                        {!isLoading && !error && pagination.pageItems.map((receivable) => {
                            const status = getStatusBadge(receivable);
                            const loanId = receivable.loan_id || receivable.loan?.id;
                            const progress = getLoanProgress(loanId);
                            const name = receivable.subscriber?.name || receivable.subscriber?.firstname || receivable.subscriber?.dc_cust_name || 'N/A';
                            const phone = receivable.subscriber?.phone || receivable.subscriber?.dc_cust_phone || '';
                            return (
                                <div key={receivable.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{name}</p>
                                            <p className="text-xs text-gray-500">{phone}</p>
                                            {(receivable.subscriber?.area_name || receivable.area_name) ? (
                                                <p className="text-xs text-gray-400">
                                                    {receivable.subscriber?.area_name || receivable.area_name}
                                                </p>
                                            ) : null}
                                        </div>
                                        <span className={`shrink-0 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                                            {status.text}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-1">{receivable.product?.product_name || 'N/A'}</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Amount</p>
                                            <p className="font-semibold">{formatAmount(receivable.due_amount || receivable.amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Due</p>
                                            <p>{receivable.due_date ? new Date(receivable.due_date).toLocaleDateString('en-GB') : 'N/A'}</p>
                                        </div>
                                        {progress.total > 0 && (
                                            <div className="col-span-2">
                                                <p className="text-xs text-gray-500">Progress</p>
                                                <p>{progress.paid} / {progress.total} receivables</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleNavigate(receivable)}
                                            className="flex-1 min-w-[7rem] text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium"
                                        >
                                            Route
                                        </button>
                                        {!receivable.is_paid && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setReceiptData(null);
                                                    setSelectedReceivable(receivable);
                                                    setPaymentForm({
                                                        amount: receivable.due_amount || receivable.amount || 0,
                                                        paymentMethod: '',
                                                        paymentDate: new Date().toISOString().split('T')[0],
                                                        notes: ''
                                                    });
                                                    setShowPaymentModal(true);
                                                }}
                                                className="flex-1 min-w-[7rem] bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                                            >
                                                Collect
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {filteredReceivables.length > 0 && (
                    <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600">
                                <span>
                                    Showing{' '}
                                    <span className="font-semibold text-gray-900">{pagination.startIndex + 1}</span>
                                    {' '}to{' '}
                                    <span className="font-semibold text-gray-900">{pagination.endIndex}</span>
                                    {' '}of{' '}
                                    <span className="font-semibold text-gray-900">{pagination.totalItems}</span>
                                </span>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="dc-collections-page-size" className="text-sm text-gray-600">
                                        Per page
                                    </label>
                                    <select
                                        id="dc-collections-page-size"
                                        value={pageSize}
                                        onChange={(e) => setPageSize(Number(e.target.value))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                    >
                                        {PAGE_SIZE_OPTIONS.map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    type="button"
                                    disabled={pagination.safePage <= 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600 px-2">
                                    Page{' '}
                                    <span className="font-semibold text-gray-900">{pagination.safePage}</span>
                                    {' '}of{' '}
                                    <span className="font-semibold text-gray-900">{pagination.totalPages}</span>
                                </span>
                                <button
                                    type="button"
                                    disabled={pagination.safePage >= pagination.totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Modal */}
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
                                            <span className="text-gray-600">Product / Loan</span>
                                            <span className="font-semibold text-right">{receiptData.productLabel}</span>
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

                                    <div className="flex flex-col gap-3">
                                        <button
                                            type="button"
                                            onClick={handleDownloadReceiptPdf}
                                            disabled={isDownloadingBill}
                                            className="w-full py-2.5 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                                        >
                                            <FiDownload className="w-4 h-4" />
                                            {isDownloadingBill ? 'Preparing Bill...' : 'Download Bill'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSendBillOnWhatsApp}
                                            className="w-full py-2.5 px-4 bg-[#25D366] text-white font-semibold rounded-lg hover:bg-[#1ebe5d] transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FaWhatsapp className="w-5 h-5" />
                                            Send Bill on WhatsApp
                                        </button>
                                        <button
                                            type="button"
                                            onClick={closePaymentModal}
                                            className="w-full py-2.5 px-4 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <FiX className="w-4 h-4" />
                                            Close
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Collect Payment</h3>
                                    {selectedReceivable && (
                                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                            <div className="text-sm text-blue-800">
                                                <strong>Due Amount:</strong> {formatAmount(selectedReceivable.due_amount || selectedReceivable.amount)}
                                            </div>
                                            <div className="text-xs text-blue-600 mt-1">
                                                Enter less amount for partial payment (remaining will be carried forward)
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                                            <input
                                                type="number"
                                                value={paymentForm.amount}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                step="0.01"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                            <select
                                                value={paymentForm.paymentMethod}
                                                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            >
                                                <option value="">Select Payment Method</option>
                                                {ledgerAccounts.map((account) => (
                                                    <option key={account.id} value={account.account_name}>
                                                        {account.account_name} (Balance: ₹{Number(account.current_balance).toLocaleString("en-IN")})
                                                    </option>
                                                ))}
                                            </select>
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
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handlePayment}
                                            disabled={isPaying}
                                            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-60"
                                        >
                                            {isPaying ? 'Collecting...' : 'Collect Payment'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Route Map Modal */}
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

export default CollectionsPage;
