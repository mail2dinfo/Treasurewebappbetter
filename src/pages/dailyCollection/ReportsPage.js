import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useDailyCollectionContext } from '../../context/dailyCollection/DailyCollectionContext';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import {
    LoanSummaryReportPDF,
    DemandReportPDF,
    OutstandingReportPDF,
} from '../../components/dailyCollection/PDF';
import Mypdf from '../../components/PDF/Mypdf';
import {
    exportLoanSummaryToExcel,
    exportDemandReportToExcel,
    exportOutstandingReportToExcel,
    exportDailyCollectionToExcel,
    formatCurrencyForExcel,
    generateDailyCollectionReportFilename,
} from '../../utils/dailyCollectionExportUtils';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';

const REPORT_TYPES = [
    { id: 'loan-summary', label: 'Loan Summary' },
    { id: 'demand-report', label: "Today's Demand" },
    { id: 'overdue-report', label: 'Overdue' },
    { id: 'outstanding-report', label: 'Outstanding' },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatPdfMoney = (amount) => {
    const num = Number(amount || 0);
    return `Rs. ${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const ReportsPage = () => {
    const { user } = useUserContext();
    const { companies, fetchCompanies } = useDailyCollectionContext();

    const [reportType, setReportType] = useState('loan-summary');
    const [report, setReport] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: 'all',
    });

    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
    const data = report?.data || {};
    const selectedMeta = REPORT_TYPES.find((item) => item.id === reportType) || REPORT_TYPES[0];

    const companyData = useMemo(() => {
        const company = companies?.[0];
        if (!company) {
            return {
                company_name: 'Daily Collection Company',
                name: 'Daily Collection Company',
                address: '',
                contact_no: '',
                phone: '',
            };
        }
        return {
            company_name: company.company_name,
            company_logo: company.company_logo,
            company_logo_base64format: company.company_logo_base64format || company.company_logo,
            contact_no: company.contact_no,
            address: company.address,
            name: company.company_name,
            phone: company.contact_no,
            street_address: company.address,
        };
    }, [companies]);

    const rows = useMemo(() => {
        if (reportType === 'demand-report') return Array.isArray(data.receivables) ? data.receivables : [];
        if (reportType === 'outstanding-report') return Array.isArray(data.customers) ? data.customers : [];
        return Array.isArray(data.loans) ? data.loans : [];
    }, [data, reportType]);

    const pagination = useMemo(() => {
        const totalItems = rows.length;
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
            pageItems: rows.slice(startIndex, endIndex),
        };
    }, [rows, currentPage, pageSize]);

    const kpis = useMemo(() => {
        if (reportType === 'loan-summary') {
            return [
                { label: 'Loans', value: data.totalLoans || 0 },
                { label: 'Active', value: data.activeLoans || 0 },
                { label: 'Disbursed', value: formatMoney(data.totalDisbursed) },
                { label: 'Outstanding', value: formatMoney(data.totalOutstanding) },
            ];
        }
        if (reportType === 'demand-report') {
            return [
                { label: 'Due today', value: formatMoney(data.totalDueAmount) },
                { label: 'Customers', value: data.totalCustomers || 0 },
                { label: 'Installments', value: data.totalReceivables || 0 },
                { label: 'Report date', value: formatDate(data.reportDate) },
            ];
        }
        if (reportType === 'overdue-report') {
            return [
                { label: 'Overdue loans', value: data.totalOverdueLoans || 0 },
                { label: 'Overdue amount', value: formatMoney(data.totalOverdueAmount) },
                { label: 'Missed dues', value: data.totalOverdueReceivables || 0 },
                { label: 'Avg overdue days', value: data.averageOverdueDays || 0 },
            ];
        }
        return [
            { label: 'Customers', value: data.totalCustomers || 0 },
            { label: 'Outstanding', value: formatMoney(data.totalOutstanding) },
            { label: 'Future due', value: formatMoney(data.totalFutureDue) },
            { label: 'Loans', value: rows.reduce((sum, customer) => sum + (customer.loans?.length || 0), 0) },
        ];
    }, [data, reportType, rows]);

    const loadReport = useCallback(async () => {
        if (!user?.results?.token || !membershipId) return;

        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/dc/reports/generate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reportType,
                    membershipId,
                    filters,
                }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload.message || 'Failed to load report');
            }
            setReport(payload.results || payload);
        } catch (err) {
            setReport(null);
            setError(err.message || 'Failed to load report');
        } finally {
            setIsLoading(false);
        }
    }, [user, membershipId, reportType, filters]);

    useEffect(() => {
        if (fetchCompanies) fetchCompanies();
    }, [fetchCompanies]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    useEffect(() => {
        setCurrentPage(1);
    }, [reportType, filters, pageSize]);

    const handleExportExcel = () => {
        if (!data || rows.length === 0) return;
        const filename = generateDailyCollectionReportFilename(reportType, 'xlsx');
        if (reportType === 'loan-summary') {
            exportLoanSummaryToExcel(data, filename);
            return;
        }
        if (reportType === 'demand-report') {
            exportDemandReportToExcel(data, filename);
            return;
        }
        if (reportType === 'outstanding-report') {
            exportOutstandingReportToExcel(data, filename);
            return;
        }
        const overdueRows = (data.loans || []).map((loan) => ({
            Customer: loan.customerName || '',
            Phone: loan.customerPhone || '',
            Product: loan.productName || '',
            Principal: formatCurrencyForExcel(loan.principalAmount || 0),
            Collected: formatCurrencyForExcel(loan.collectedAmount || 0),
            Overdue: formatCurrencyForExcel(loan.overdueAmount || 0),
            'Due date': loan.dueDate || '',
            'Overdue days': loan.overdueDays || 0,
            'Missed dues': loan.overdueReceivables || 0,
        }));
        exportDailyCollectionToExcel(overdueRows, filename);
    };

    const loanSummaryPdfRows = (data.loans || []).map((loan) => ({
        customerName: loan.customerName || 'N/A',
        productName: loan.productName || 'N/A',
        principalAmount: formatPdfMoney(loan.principalAmount),
        collectedAmount: formatPdfMoney(loan.collectedAmount),
        outstanding: formatPdfMoney(loan.closingBalance),
        status: loan.status || 'N/A',
        disbursementDate: formatDate(loan.disbursementDate),
    }));

    const demandPdfRows = (data.receivables || []).map((row) => ({
        customerName: row.customerName || 'N/A',
        customerPhone: row.customerPhone || '',
        productName: row.productName || 'N/A',
        dueAmount: formatPdfMoney(row.dueAmount),
        openingBalance: formatPdfMoney(row.openingBalance),
        closingBalance: formatPdfMoney(row.closingBalance),
    }));

    const outstandingPdfRows = (data.customers || []).flatMap((customer) => {
        if (customer.loans?.length) {
            return customer.loans.map((loan) => ({
                customerName: customer.customerName || 'N/A',
                customerPhone: customer.customerPhone || '',
                productName: loan.productName || 'N/A',
                outstanding: formatPdfMoney(loan.outstandingAmount),
                futureDue: formatPdfMoney(loan.futureDue),
            }));
        }
        return [{
            customerName: customer.customerName || 'N/A',
            customerPhone: customer.customerPhone || '',
            productName: '—',
            outstanding: formatPdfMoney(customer.totalOutstanding),
            futureDue: formatPdfMoney(customer.totalFutureDue),
        }];
    });

    const overduePdfRows = (data.loans || []).map((loan) => ({
        customer: loan.customerName || 'N/A',
        phone: loan.customerPhone || '',
        product: loan.productName || 'N/A',
        overdue: formatPdfMoney(loan.overdueAmount),
        days: String(loan.overdueDays || 0),
        dues: String(loan.overdueReceivables || 0),
    }));

    const pdfDocument = () => {
        const heading = selectedMeta.label;
        const reportDate = new Date().toISOString().slice(0, 10);
        if (reportType === 'loan-summary') {
            return (
                <LoanSummaryReportPDF
                    heading={heading}
                    companyData={companyData}
                    reportDate={reportDate}
                    summaryData={data}
                    tableHeaders={[
                        { title: 'Customer', value: 'customerName' },
                        { title: 'Product', value: 'productName' },
                        { title: 'Principal', value: 'principalAmount' },
                        { title: 'Collected', value: 'collectedAmount' },
                        { title: 'Outstanding', value: 'outstanding' },
                        { title: 'Status', value: 'status' },
                    ]}
                    tableData={loanSummaryPdfRows}
                />
            );
        }
        if (reportType === 'demand-report') {
            return (
                <DemandReportPDF
                    heading={heading}
                    companyData={companyData}
                    reportDate={reportDate}
                    summaryData={data}
                    tableHeaders={[
                        { title: 'Customer', value: 'customerName' },
                        { title: 'Phone', value: 'customerPhone' },
                        { title: 'Product', value: 'productName' },
                        { title: 'Due', value: 'dueAmount' },
                    ]}
                    tableData={demandPdfRows}
                />
            );
        }
        if (reportType === 'outstanding-report') {
            return (
                <OutstandingReportPDF
                    heading={heading}
                    companyData={companyData}
                    reportDate={reportDate}
                    summaryData={data}
                    tableHeaders={[
                        { title: 'Customer', value: 'customerName' },
                        { title: 'Phone', value: 'customerPhone' },
                        { title: 'Product', value: 'productName' },
                        { title: 'Outstanding', value: 'outstanding' },
                        { title: 'Future due', value: 'futureDue' },
                    ]}
                    tableData={outstandingPdfRows}
                />
            );
        }
        return (
            <Mypdf
                heading="Overdue Report"
                companyData={companyData}
                tableHeaders={[
                    { title: 'Customer', value: 'customer' },
                    { title: 'Phone', value: 'phone' },
                    { title: 'Product', value: 'product' },
                    { title: 'Overdue', value: 'overdue' },
                    { title: 'Days', value: 'days' },
                    { title: 'Missed dues', value: 'dues' },
                ]}
                tableData={overduePdfRows}
            />
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Reports</h1>
                        <p className="text-sm text-gray-600 mt-1">Live loan, demand, overdue, and outstanding reports</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={loadReport}
                            className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            disabled={rows.length === 0}
                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <FiDownload className="w-4 h-4" />
                            Excel
                        </button>
                        {rows.length > 0 && (
                            <PDFDownloadLink
                                key={`${reportType}-${report?.generatedAt || rows.length}`}
                                document={pdfDocument()}
                                fileName={`${reportType}-${new Date().toISOString().slice(0, 10)}.pdf`}
                                className="inline-flex"
                            >
                                {({ loading: pdfLoading }) => (
                                    <button
                                        type="button"
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FiDownload className="w-4 h-4" />
                                        {pdfLoading ? 'Preparing PDF…' : 'PDF'}
                                    </button>
                                )}
                            </PDFDownloadLink>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="flex overflow-x-auto border-b border-gray-200">
                        {REPORT_TYPES.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setReportType(item.id)}
                                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                                    reportType === item.id
                                        ? 'border-red-600 text-red-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-800'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    {reportType === 'loan-summary' && (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="all">All</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="CLOSED">Completed</option>
                                    <option value="OVERDUE">Overdue</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {kpis.map((kpi) => (
                        <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <p className="text-xs text-gray-500">{kpi.label}</p>
                            <p className="mt-1 text-base sm:text-lg font-bold text-gray-900 break-words">{kpi.value}</p>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800">{selectedMeta.label}</h2>
                        <span className="text-sm text-gray-500">{rows.length} rows</span>
                    </div>
                    {isLoading ? (
                        <p className="p-10 text-center text-gray-500">Loading report…</p>
                    ) : rows.length === 0 ? (
                        <p className="p-10 text-center text-gray-500">No records for this report.</p>
                    ) : (
                        <>
                        <div className="md:hidden divide-y divide-gray-200">
                            {reportType === 'loan-summary' && pagination.pageItems.map((loan) => (
                                <div key={loan.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 break-words">{loan.customerName}</p>
                                            <p className="text-sm text-gray-600">{loan.productName}</p>
                                        </div>
                                        <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">{loan.status}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div><p className="text-xs text-gray-500">Principal</p><p className="font-semibold">{formatMoney(loan.principalAmount)}</p></div>
                                        <div><p className="text-xs text-gray-500">Collected</p><p className="font-semibold text-green-700">{formatMoney(loan.collectedAmount)}</p></div>
                                        <div><p className="text-xs text-gray-500">Outstanding</p><p className="font-semibold text-red-700">{formatMoney(loan.closingBalance)}</p></div>
                                        <div><p className="text-xs text-gray-500">Disbursed</p><p className="font-medium">{formatDate(loan.disbursementDate)}</p></div>
                                    </div>
                                </div>
                            ))}
                            {reportType === 'demand-report' && pagination.pageItems.map((row) => (
                                <div key={row.id} className="p-4">
                                    <p className="font-semibold text-gray-900 break-words">{row.customerName}</p>
                                    <p className="text-sm text-gray-600">{row.productName}</p>
                                    <p className="text-sm text-gray-500">{row.customerPhone || '—'}</p>
                                    <div className="mt-2 flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Due {formatDate(row.dueDate)}</span>
                                        <span className="font-bold text-gray-900">{formatMoney(row.dueAmount)}</span>
                                    </div>
                                </div>
                            ))}
                            {reportType === 'overdue-report' && pagination.pageItems.map((loan) => (
                                <div key={loan.id} className="p-4">
                                    <p className="font-semibold text-gray-900 break-words">{loan.customerName}</p>
                                    <p className="text-sm text-gray-600">{loan.productName}</p>
                                    <p className="text-sm text-gray-500">{loan.customerPhone || '—'}</p>
                                    <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                        <div><p className="text-xs text-gray-500">Overdue</p><p className="font-semibold text-red-700">{formatMoney(loan.overdueAmount)}</p></div>
                                        <div><p className="text-xs text-gray-500">Days</p><p className="font-semibold">{loan.overdueDays}</p></div>
                                        <div><p className="text-xs text-gray-500">Missed</p><p className="font-semibold">{loan.overdueReceivables}</p></div>
                                    </div>
                                </div>
                            ))}
                            {reportType === 'outstanding-report' && pagination.pageItems.map((customer) => (
                                <div key={`${customer.customerName}-${customer.customerPhone}`} className="p-4">
                                    <p className="font-semibold text-gray-900 break-words">{customer.customerName}</p>
                                    <p className="text-sm text-gray-500">{customer.customerPhone || '—'}</p>
                                    <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                                        <div><p className="text-xs text-gray-500">Outstanding</p><p className="font-semibold text-red-700">{formatMoney(customer.totalOutstanding)}</p></div>
                                        <div><p className="text-xs text-gray-500">Future due</p><p className="font-semibold">{formatMoney(customer.totalFutureDue)}</p></div>
                                        <div><p className="text-xs text-gray-500">Loans</p><p className="font-semibold">{customer.loans?.length || 0}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="hidden md:block overflow-x-auto">
                            {reportType === 'loan-summary' && (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Principal</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Collected</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Outstanding</th>
                                            <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Disbursed</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {pagination.pageItems.map((loan) => (
                                            <tr key={loan.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{loan.customerName}</td>
                                                <td className="px-4 py-3 text-gray-700">{loan.productName}</td>
                                                <td className="px-4 py-3 text-right">{formatMoney(loan.principalAmount)}</td>
                                                <td className="px-4 py-3 text-right text-green-700">{formatMoney(loan.collectedAmount)}</td>
                                                <td className="px-4 py-3 text-right text-red-700">{formatMoney(loan.closingBalance)}</td>
                                                <td className="px-4 py-3 text-center">{loan.status}</td>
                                                <td className="px-4 py-3">{formatDate(loan.disbursementDate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {reportType === 'demand-report' && (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Due amount</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Due date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {pagination.pageItems.map((row) => (
                                            <tr key={row.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{row.customerName}</td>
                                                <td className="px-4 py-3 text-gray-700">{row.customerPhone}</td>
                                                <td className="px-4 py-3 text-gray-700">{row.productName}</td>
                                                <td className="px-4 py-3 text-right font-semibold">{formatMoney(row.dueAmount)}</td>
                                                <td className="px-4 py-3">{formatDate(row.dueDate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {reportType === 'overdue-report' && (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Overdue</th>
                                            <th className="px-4 py-3 text-center font-semibold text-gray-600">Days</th>
                                            <th className="px-4 py-3 text-center font-semibold text-gray-600">Missed dues</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {pagination.pageItems.map((loan) => (
                                            <tr key={loan.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{loan.customerName}</td>
                                                <td className="px-4 py-3 text-gray-700">{loan.customerPhone}</td>
                                                <td className="px-4 py-3 text-gray-700">{loan.productName}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-red-700">{formatMoney(loan.overdueAmount)}</td>
                                                <td className="px-4 py-3 text-center">{loan.overdueDays}</td>
                                                <td className="px-4 py-3 text-center">{loan.overdueReceivables}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {reportType === 'outstanding-report' && (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Outstanding</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-600">Future due</th>
                                            <th className="px-4 py-3 text-center font-semibold text-gray-600">Loans</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {pagination.pageItems.map((customer) => (
                                            <tr key={`${customer.customerName}-${customer.customerPhone}`} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">{customer.customerName}</td>
                                                <td className="px-4 py-3 text-gray-700">{customer.customerPhone}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-red-700">{formatMoney(customer.totalOutstanding)}</td>
                                                <td className="px-4 py-3 text-right">{formatMoney(customer.totalFutureDue)}</td>
                                                <td className="px-4 py-3 text-center">{customer.loans?.length || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        </>
                    )}
                </div>

                {rows.length > 0 && (
                    <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <span>
                                Showing {pagination.startIndex + 1} to {pagination.endIndex} of {pagination.totalItems}
                            </span>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="px-2 py-2 border border-gray-300 rounded-lg"
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>{size} / page</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={pagination.safePage <= 1}
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="whitespace-nowrap">Page {pagination.safePage} of {pagination.totalPages}</span>
                            <button
                                type="button"
                                disabled={pagination.safePage >= pagination.totalPages}
                                onClick={() => setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))}
                                className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsPage;
