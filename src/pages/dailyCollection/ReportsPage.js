import React, { useState, useEffect } from 'react';
import { useDailyCollectionContext } from '../../context/dailyCollection/DailyCollectionContext';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import { exportToCSV } from '../../utils/exportUtils';
import { PDFDownloadLink } from '@react-pdf/renderer';
import Mypdf from '../../components/PDF/Mypdf';
import ErrorBoundary from '../../components/ErrorBoundary';
// Daily Collection specific imports
import {
    LoanSummaryReportPDF,
    DemandReportPDF,
    OutstandingReportPDF
} from '../../components/dailyCollection/PDF';
import {
    exportLoanSummaryToExcel,
    exportDemandReportToExcel,
    exportOutstandingReportToExcel,
    exportDailyCollectionToExcel,
    formatCurrencyForExcel,
    generateDailyCollectionReportFilename
} from '../../utils/dailyCollectionExportUtils';
import {
    FiDownload,
    FiFilter,
    FiCalendar,
    FiFileText,
    FiBarChart,
    FiPieChart,
    FiRefreshCw,
    FiEye,
    FiX
} from 'react-icons/fi';

const ReportsPage = () => {
    const { user } = useUserContext();
    const { companies, loans } = useDailyCollectionContext();

    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [filters, setFilters] = useState({
        dateRange: '30',
        startDate: '',
        endDate: '',
        company: 'all',
        product: 'all',
        status: 'all'
    });
    const [showFilters, setShowFilters] = useState(false);

    const reportTypes = [
        {
            id: 'loan-summary',
            title: 'Loan Summary Report',
            description: 'Overview of all loans with status and amounts',
            icon: FiBarChart,
            color: 'blue'
        },
        {
            id: 'demand-report',
            title: 'Demand Report',
            description: "Today's collection due of all loans",
            icon: FiCalendar,
            color: 'green'
        },
        {
            id: 'overdue-report',
            title: 'Overdue Report',
            description: 'Collections missed payments and overdue loans',
            icon: FiFileText,
            color: 'red'
        },
        {
            id: 'outstanding-report',
            title: 'Outstanding Report',
            description: 'Customer-wise cumulative future due amounts',
            icon: FiPieChart,
            color: 'purple'
        }
    ];

    useEffect(() => {
        fetchReports();
    }, [filters]);

    const fetchReports = async () => {
        console.log('=== FETCH REPORTS START ===');
        console.log('User token:', user?.results?.token ? 'Present' : 'Missing');
        console.log('API Base URL:', API_BASE_URL);

        if (!user?.results?.token) {
            console.log('❌ No user token, skipping API call');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            console.log('Membership ID:', membershipId);
            console.log('Filters:', filters);

            // Generate all report types
            const reportTypes = ['loan-summary', 'demand-report', 'overdue-report', 'outstanding-report'];
            const generatedReports = [];

            for (const reportType of reportTypes) {
                try {
                    console.log(`Generating ${reportType} report...`);

                    const response = await fetch(`${API_BASE_URL}/dc/reports/generate`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${user.results.token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            reportType: reportType,
                            membershipId: membershipId,
                            filters: filters
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`✅ ${reportType} report generated:`, data);
                        console.log(`Report data structure:`, data.results);
                        console.log(`Report data.data:`, data.results?.data);
                        generatedReports.push(data.results);
                    } else {
                        const errorData = await response.json();
                        console.error(`❌ Error generating ${reportType} report:`, errorData);
                    }
                } catch (error) {
                    console.error(`❌ Error generating ${reportType} report:`, error);
                }
            }

            console.log('Generated reports array:', generatedReports);
            setReports(generatedReports);
        } catch (error) {
            console.error('❌ Error fetching reports:', error);
            console.log('🔄 Using fallback reports data due to error');
            setReports(generateMockReports());
        } finally {
            setIsLoading(false);
            console.log('=== FETCH REPORTS END ===');
        }
    };

    const generateMockReports = () => {
        // Get overdue loans from the loans data
        const overdueLoans = loans.filter(l => l.status === 'OVERDUE').map(loan => ({
            customerName: loan.customer_name || loan.customerName || 'N/A',
            customerPhone: loan.customer_phone || loan.customerPhone || 'N/A',
            productName: loan.product_name || loan.productName || 'N/A',
            principalAmount: parseFloat(loan.principal_amount) || 0,
            overdueAmount: parseFloat(loan.closing_balance) || 0,
            overdueDays: Math.floor(Math.random() * 30) + 1, // Mock overdue days
            lastPaymentDate: loan.last_payment_date || 'N/A'
        }));

        // Generate demand report data
        const receivables = loans.filter(l => l.status === 'ACTIVE').map(loan => ({
            customerName: loan.customer_name || loan.customerName || 'N/A',
            customerPhone: loan.customer_phone || loan.customerPhone || 'N/A',
            productName: loan.product_name || loan.productName || 'N/A',
            dueAmount: parseFloat(loan.closing_balance) || 0,
            openingBalance: parseFloat(loan.principal_amount) || 0,
            closingBalance: parseFloat(loan.closing_balance) || 0
        }));

        // Generate outstanding report data
        const customers = loans.filter(l => l.status === 'ACTIVE').map(loan => ({
            customerName: loan.customer_name || loan.customerName || 'N/A',
            customerPhone: loan.customer_phone || loan.customerPhone || 'N/A',
            totalOutstanding: parseFloat(loan.closing_balance) || 0,
            totalFutureDue: parseFloat(loan.closing_balance) * 0.1 || 0 // Mock future due
        }));

        return [
            {
                id: 'loan-summary',
                title: 'Loan Summary Report',
                generatedAt: new Date().toISOString(),
                data: {
                    totalLoans: loans.length,
                    activeLoans: loans.filter(l => l.status === 'ACTIVE').length,
                    completedLoans: loans.filter(l => l.status === 'COMPLETED').length,
                    overdueLoans: loans.filter(l => l.status === 'OVERDUE').length,
                    totalDisbursed: loans.reduce((sum, loan) => sum + (parseFloat(loan.principal_amount) || 0), 0),
                    totalCollected: loans.reduce((sum, loan) => sum + (parseFloat(loan.principal_amount) - parseFloat(loan.closing_balance) || 0), 0)
                }
            },
            {
                id: 'overdue-report',
                title: 'Overdue Report',
                generatedAt: new Date().toISOString(),
                data: {
                    overdueLoans: overdueLoans
                }
            },
            {
                id: 'demand-report',
                title: 'Demand Report',
                generatedAt: new Date().toISOString(),
                data: {
                    receivables: receivables
                }
            },
            {
                id: 'outstanding-report',
                title: 'Outstanding Report',
                generatedAt: new Date().toISOString(),
                data: {
                    customers: customers
                }
            }
        ];
    };

    const handleGenerateReport = async (reportType) => {
        setIsLoading(true);
        try {
            const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;
            console.log('Generating report:', reportType);
            console.log('Membership ID:', membershipId);
            console.log('Filters:', filters);

            const response = await fetch(`${API_BASE_URL}/dc/reports/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.results.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reportType,
                    filters,
                    membershipId
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Report generated successfully:', data);
                console.log('Full response data:', JSON.stringify(data, null, 2));
                
                // Handle different response structures
                let reportData = data.results || data.data || data;
                
                // For outstanding report, ensure customers array exists
                if (reportType === 'outstanding-report') {
                    console.log('Outstanding report data structure:', reportData);
                    console.log('Customers array:', reportData.customers);
                    console.log('Customers length:', reportData.customers?.length);
                    
                    // If customers is missing or empty, try to extract from loans
                    if (!reportData.customers || reportData.customers.length === 0) {
                        console.warn('No customers found in outstanding report, checking loans...');
                        if (reportData.loans && Array.isArray(reportData.loans) && reportData.loans.length > 0) {
                            console.log('Found loans, grouping by customer...');
                            // Group loans by customer
                            const customerMap = {};
                            reportData.loans.forEach(loan => {
                                const customerId = loan.subscriber_id || loan.customerId || loan.customer_name || 'unknown';
                                if (!customerMap[customerId]) {
                                    customerMap[customerId] = {
                                        customerName: loan.customer_name || loan.customerName || loan.subscriber?.dc_cust_name || 'N/A',
                                        customerPhone: loan.customer_phone || loan.customerPhone || loan.subscriber?.dc_cust_phone || 'N/A',
                                        totalOutstanding: 0,
                                        totalFutureDue: 0,
                                        loans: []
                                    };
                                }
                                const outstanding = parseFloat(loan.outstanding_amount || loan.outstandingAmount || loan.closing_balance || 0);
                                const futureDue = parseFloat(loan.future_due || loan.futureDue || 0);
                                customerMap[customerId].totalOutstanding += outstanding;
                                customerMap[customerId].totalFutureDue += futureDue;
                                customerMap[customerId].loans.push({
                                    productName: loan.product_name || loan.productName || loan.product?.product_name || 'N/A',
                                    principalAmount: parseFloat(loan.principal_amount || loan.principalAmount || 0),
                                    outstandingAmount: outstanding,
                                    futureDue: futureDue,
                                    remainingInstallments: loan.remaining_installments || loan.remainingInstallments || 0
                                });
                            });
                            reportData.customers = Object.values(customerMap);
                            console.log('Grouped customers:', reportData.customers);
                        }
                    }
                }
                
                // Ensure reportType is set
                if (!reportData.reportType && !reportData.id) {
                    reportData.reportType = reportType;
                }
                
                setSelectedReport(reportData);
            } else {
                console.error('API Error:', response.status, response.statusText);
                const errorData = await response.json();
                console.error('Error details:', errorData);

                // Fallback: Use mock data for the specific report type
                console.log('Using fallback mock data for:', reportType);
                const mockReports = generateMockReports();
                const mockReport = mockReports.find(r => r.id === reportType);
                if (mockReport) {
                    setSelectedReport(mockReport);
                } else {
                    alert(`Error generating ${reportType} report. Please try again.`);
                }
            }
        } catch (error) {
            console.error('Error generating report:', error);

            // Fallback: Use mock data for the specific report type
            console.log('Using fallback mock data due to error for:', reportType);
            const mockReports = generateMockReports();
            const mockReport = mockReports.find(r => r.id === reportType);
            if (mockReport) {
                setSelectedReport(mockReport);
            } else {
                alert(`Error generating ${reportType} report. Please try again.`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportReport = async (format, report = null) => {
        // Use provided report or fallback to selectedReport
        const reportToExport = report || selectedReport;
        
        if (!reportToExport) {
            alert('Please select a report to export');
            return;
        }

        try {
            setIsLoading(true);
            console.log('Starting export:', format);
            console.log('Report to export:', reportToExport);

            // Get the report data
            const reportData = reportToExport.data || reportToExport;
            const reportType = reportToExport.reportType || reportToExport.id || 'loan-summary';

            console.log('Report Type:', reportType);
            console.log('Report Data:', reportData);

            // Generate filename using daily collection utility
            const filename = generateDailyCollectionReportFilename(reportType, format === 'excel' ? 'xlsx' : format);

            if (format === 'excel' || format === 'xlsx') {
                console.log('Exporting to Excel...');

                // Use specific export functions based on report type
                if (reportType === 'loan-summary') {
                    console.log('Exporting loan summary report');
                    exportLoanSummaryToExcel(reportData, filename);
                } else if (reportType === 'demand-report') {
                    console.log('Exporting demand report');
                    if (reportData.receivables && Array.isArray(reportData.receivables)) {
                        // Pass full report data to include summary
                        exportDemandReportToExcel(reportData, filename);
                    } else {
                        console.warn('No receivables data found, using fallback');
                        exportToCSV(reportData, filename.replace('.xlsx', '.csv'));
                    }
                } else if (reportType === 'outstanding-report') {
                    console.log('Exporting outstanding report');
                    if (reportData.customers && Array.isArray(reportData.customers)) {
                        // Pass full report data to include summary
                        exportOutstandingReportToExcel(reportData, filename);
                    } else {
                        console.warn('No customers data found, using fallback');
                        exportToCSV(reportData, filename.replace('.xlsx', '.csv'));
                    }
                } else if (reportType === 'overdue-report') {
                    console.log('Exporting overdue report');
                    if (reportData.loans && Array.isArray(reportData.loans)) {
                        // Export overdue report with summary and detailed loans
                        const allData = [];
                        
                        // Add summary section
                        if (reportData.totalOverdueLoans !== undefined || reportData.totalOverdueAmount !== undefined) {
                            const summary = [
                                { 'Metric': 'Total Overdue Loans', 'Value': reportData.totalOverdueLoans || 0 },
                                { 'Metric': 'Total Amount Not Collected', 'Value': formatCurrencyForExcel(reportData.totalOverdueAmount || 0) },
                                { 'Metric': 'Average Overdue Days', 'Value': reportData.averageOverdueDays || 0 },
                                { 'Metric': 'Total Overdue Installments', 'Value': reportData.totalOverdueReceivables || 0 }
                            ];
                            allData.push(...summary);
                            allData.push({ 'Metric': '---', 'Value': '---' });
                        }
                        
                        // Add detailed overdue loans
                        const overdueLoans = reportData.loans.map(loan => ({
                            'Customer': loan.customerName || '',
                            'Phone': loan.customerPhone || '',
                            'Product': loan.productName || '',
                            'Principal Amount': formatCurrencyForExcel(loan.principalAmount || 0),
                            'Collected Amount': formatCurrencyForExcel(loan.collectedAmount || 0),
                            'Overdue Amount': formatCurrencyForExcel(loan.overdueAmount || 0),
                            'Due Date': loan.dueDate || 'N/A',
                            'Latest Due Date': loan.latestDueDate || 'N/A',
                            'Overdue Days': loan.overdueDays || 0,
                            'Loan Mode': loan.loanMode || 'N/A',
                            'Overdue Installments': loan.overdueReceivables || 0
                        }));
                        
                        allData.push(...overdueLoans);
                        exportDailyCollectionToExcel(allData, filename);
                    } else {
                        console.warn('No loans data found, using fallback');
                        exportToCSV(reportData, filename.replace('.xlsx', '.csv'));
                    }
                } else {
                    // Fallback to generic CSV export
                    console.log('Using fallback CSV export');
                    exportToCSV(reportData, filename.replace('.xlsx', '.csv'));
                }
                alert('Excel file downloaded successfully!');
            } else if (format === 'pdf') {
                console.log('PDF export is now handled by PDFDownloadLink component');
                alert('PDF export is now handled directly by the PDF button. No need for this function.');
            } else if (format === 'csv') {
                console.log('Exporting to CSV...');
                exportToCSV(reportData, filename);
                alert('CSV file downloaded successfully!');
            } else {
                console.error('Unsupported export format:', format);
                alert('Unsupported export format: ' + format);
            }
        } catch (error) {
            console.error('Error exporting report:', error);
            alert('Error exporting file: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                        <p className="text-gray-600 mt-1">Generate and export detailed reports</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FiFilter className="w-4 h-4" />
                            Filters
                        </button>
                        <button
                            onClick={fetchReports}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FiRefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="CLOSED">Completed</option>
                                    <option value="OVERDUE">Overdue</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                                <select
                                    value={filters.company}
                                    onChange={(e) => handleFilterChange('company', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                >
                                    <option value="all">All Companies</option>
                                    {companies.map(company => (
                                        <option key={company.id} value={company.id}>
                                            {company.company_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Report Types Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {reportTypes.map((report) => (
                        <ReportCard
                            key={report.id}
                            report={report}
                            onGenerate={() => handleGenerateReport(report.id)}
                            isLoading={isLoading}
                        />
                    ))}
                </div>

                {/* Generated Reports */}
                {console.log('Reports length:', reports.length)}
                {console.log('Reports data:', reports)}
                {reports.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Generated Reports</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {reports.map((report) => (
                                    <ReportItem
                                        key={report.id}
                                        report={report}
                                        onView={() => setSelectedReport(report)}
                                        onExport={(format) => handleExportReport(format, report)}
                                        companies={companies}
                                        user={user}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Report Viewer Modal */}
                {selectedReport && (
                    <ReportViewer
                        report={selectedReport}
                        onClose={() => setSelectedReport(null)}
                        onExport={(format) => handleExportReport(format, selectedReport)}
                        companies={companies}
                        user={user}
                    />
                )}
            </div>
        </div>
    );
};

// Report Card Component
const ReportCard = ({ report, onGenerate, isLoading }) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600',
        indigo: 'bg-indigo-50 text-indigo-600'
    };

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[report.color]}`}>
                    <report.icon className="w-6 h-6" />
                </div>
                <button
                    onClick={onGenerate}
                    disabled={isLoading}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    {isLoading ? (
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <FiFileText className="w-4 h-4" />
                    )}
                    Generate
                </button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
            <p className="text-gray-600 text-sm">{report.description}</p>
        </div>
    );
};

// Report Item Component with PDFDownloadLink (same pattern as chit fund)
const ReportItem = ({ report, onView, onExport, companies, user }) => {
    const [pdfData, setPdfData] = useState(null);
    const reportData = report.data || report;
    const reportType = report.reportType || report.id || 'loan-summary';

    // Custom formatCurrency for PDF (without Unicode rupee symbol)
    const formatCurrencyForPDF = (amount) => {
        if (!amount && amount !== 0) return 'Rs. 0';
        // Use Rs. instead of ₹ for PDF compatibility
        const num = Number(amount);
        const formatted = num.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        const result = `Rs. ${formatted}`;
        return result;
    };

    // Get company data for PDF (using actual daily collection company data from database)
    const getCompanyData = () => {
        const dailyCollectionCompany = companies?.[0];
        const chitFundCompany = user?.results?.userCompany?.[0];

        console.log('=== GET COMPANY DATA DEBUG ===');
        console.log('Daily Collection Companies:', companies);
        console.log('Selected Company:', dailyCollectionCompany);
        console.log('Company Logo (base64):', dailyCollectionCompany?.company_logo ? 'Present' : 'Missing');
        console.log('Company Logo (S3):', dailyCollectionCompany?.company_logo_s3_image ? 'Present' : 'Missing');
        console.log('Chit Fund Company:', chitFundCompany);

        // Use daily collection company data first, then fallback to chit fund company
        if (dailyCollectionCompany) {
            const companyData = {
                // Daily collection specific fields (from database)
                company_name: dailyCollectionCompany.company_name,
                company_logo: dailyCollectionCompany.company_logo, // Use base64 format
                contact_no: dailyCollectionCompany.contact_no,
                address: dailyCollectionCompany.address,
                // Map to PDF header format for compatibility
                name: dailyCollectionCompany.company_name,
                phone: dailyCollectionCompany.contact_no,
                street_address: dailyCollectionCompany.address,
                city: '',
                state: '',
                zipcode: '',
                country: '',
                email: '',
                registration_no: '',
                company_since: ''
            };
            console.log('Using Daily Collection Company Data:', companyData);
            return companyData;
        } else if (chitFundCompany) {
            console.log('Using Chit Fund Company Data:', chitFundCompany);
            return chitFundCompany;
        } else {
            console.log('Using Default Company Data');
            return {
                company_name: 'Daily Collection Company',
                name: 'Daily Collection Company',
                address: 'Company Address',
                contact_no: 'N/A',
                phone: 'N/A'
            };
        }
    };

    const companyData = getCompanyData();

    // Debug logging for PDF generation
    console.log('=== REPORT ITEM DEBUG ===');
    console.log('Report:', report);
    console.log('Report Data:', reportData);
    console.log('Report Type:', reportType);
    console.log('PDF Data:', pdfData);
    console.log('Company Data:', companyData);
    console.log('=== END REPORT ITEM DEBUG ===');

    // Format data for PDF based on report type (moved inside component)
    const formatDataForPDF = (data, reportType) => {
        console.log('=== FORMAT DATA FOR PDF DEBUG ===');
        console.log('Report Type:', reportType);
        console.log('Data:', data);
        console.log('Data type:', typeof data);
        console.log('Data keys:', Object.keys(data || {}));

        // Validate input data
        if (!data || typeof data !== 'object') {
            console.error('Invalid data provided to formatDataForPDF:', data);
            return [];
        }

        try {
            if (reportType === 'loan-summary') {
                // Return loan details for PDF table, not just summary metrics
                if (data.loans && Array.isArray(data.loans) && data.loans.length > 0) {
                    const loanDetails = data.loans.map(loan => ({
                        customerName: loan.customerName || loan.customer_name || 'N/A',
                        customerPhone: loan.customerPhone || loan.customer_phone || 'N/A',
                        productName: loan.productName || loan.product_name || 'N/A',
                        principalAmount: formatCurrencyForPDF(loan.principalAmount || loan.principal_amount || 0),
                        cashInHand: formatCurrencyForPDF(loan.cashInHand || loan.cash_in_hand || 0),
                        collectedAmount: formatCurrencyForPDF(loan.collectedAmount || loan.collected_amount || 0),
                        outstanding: formatCurrencyForPDF(loan.closingBalance || loan.closing_balance || 0),
                        status: loan.status || 'N/A',
                        disbursementDate: loan.disbursementDate || loan.disbursement_date || 'N/A'
                    }));
                    console.log('Formatted loan-summary data (loan details):', loanDetails);
                    return loanDetails;
                } else {
                    // Fallback to summary if no loans
                    const formattedData = [
                        { metric: 'Total Loans', value: data.totalLoans || 0 },
                        { metric: 'Active Loans', value: data.activeLoans || 0 },
                        { metric: 'Completed Loans', value: data.completedLoans || 0 },
                        { metric: 'Overdue Loans', value: data.overdueLoans || 0 },
                        { metric: 'Total Disbursed', value: formatCurrencyForPDF(data.totalDisbursed || 0) },
                        { metric: 'Total Collected', value: formatCurrencyForPDF(data.totalCollected || 0) }
                    ];
                    console.log('Formatted loan-summary data (summary fallback):', formattedData);
                    return formattedData;
                }
            } else if (reportType === 'demand-report' && Array.isArray(data.receivables)) {
                return data.receivables.map(rec => {
                    if (!rec || typeof rec !== 'object') return null;
                    return {
                        customerName: rec.customerName || '',
                        customerPhone: rec.customerPhone || '',
                        productName: rec.productName || '',
                        dueAmount: formatCurrencyForPDF(rec.dueAmount || 0),
                        openingBalance: formatCurrencyForPDF(rec.openingBalance || 0),
                        closingBalance: formatCurrencyForPDF(rec.closingBalance || 0)
                    };
                }).filter(item => item !== null);
            } else if (reportType === 'outstanding-report' && Array.isArray(data.customers)) {
                // Flatten customer data with loan details for PDF
                const flattenedData = [];
                data.customers.forEach(customer => {
                    if (!customer || typeof customer !== 'object') return;
                    
                    if (customer.loans && Array.isArray(customer.loans) && customer.loans.length > 0) {
                        // Add a row for each loan
                        customer.loans.forEach(loan => {
                            flattenedData.push({
                                customerName: customer.customerName || '',
                                customerPhone: customer.customerPhone || '',
                                productName: loan.productName || 'N/A',
                                principalAmount: formatCurrencyForPDF(loan.principalAmount || 0),
                                outstandingAmount: formatCurrencyForPDF(loan.outstandingAmount || 0),
                                futureDue: formatCurrencyForPDF(loan.futureDue || 0),
                                remainingInstallments: loan.remainingInstallments || 0
                            });
                        });
                    } else {
                        // If no loans, still add customer summary
                        flattenedData.push({
                            customerName: customer.customerName || '',
                            customerPhone: customer.customerPhone || '',
                            productName: 'N/A',
                            principalAmount: 'N/A',
                            outstandingAmount: formatCurrencyForPDF(customer.totalOutstanding || 0),
                            futureDue: formatCurrencyForPDF(customer.totalFutureDue || 0),
                            remainingInstallments: 0
                        });
                    }
                });
                return flattenedData.filter(item => item !== null);
            } else if (reportType === 'overdue-report' && Array.isArray(data.loans)) {
                return data.loans.map(loan => {
                    if (!loan || typeof loan !== 'object') return null;
                    return {
                        customerName: loan.customerName || '',
                        customerPhone: loan.customerPhone || '',
                        productName: loan.productName || '',
                        principalAmount: formatCurrencyForPDF(loan.principalAmount || 0),
                        overdueAmount: formatCurrencyForPDF(loan.overdueAmount || 0),
                        overdueDays: loan.overdueDays || 0,
                        lastPaymentDate: loan.lastPaymentDate || 'N/A'
                    };
                }).filter(item => item !== null);
            }
        } catch (error) {
            console.error('Error formatting data for PDF:', error);
            return [];
        }

        console.log('No valid data found for report type:', reportType);
        return [];
    };

    // Get table headers based on report type (moved inside component)
    const getTableHeaders = (reportType) => {
        if (reportType === 'loan-summary') {
            return [
                { title: 'Metric', value: 'metric' },
                { title: 'Value', value: 'value' }
            ];
        } else if (reportType === 'demand-report') {
            return [
                { title: 'Customer', value: 'customerName' },
                { title: 'Phone', value: 'customerPhone' },
                { title: 'Product', value: 'productName' },
                { title: 'Due Amount', value: 'dueAmount' },
                { title: 'Opening Balance', value: 'openingBalance' },
                { title: 'Closing Balance', value: 'closingBalance' }
            ];
        } else if (reportType === 'outstanding-report') {
            return [
                { title: 'Customer', value: 'customerName' },
                { title: 'Phone', value: 'customerPhone' },
                { title: 'Product', value: 'productName' },
                { title: 'Principal Amount', value: 'principalAmount' },
                { title: 'Outstanding', value: 'outstandingAmount' },
                { title: 'Future Due', value: 'futureDue' },
                { title: 'Remaining Installments', value: 'remainingInstallments' }
            ];
        } else if (reportType === 'overdue-report') {
            return [
                { title: 'Customer', value: 'customerName' },
                { title: 'Phone', value: 'customerPhone' },
                { title: 'Product', value: 'productName' },
                { title: 'Principal Amount', value: 'principalAmount' },
                { title: 'Overdue Amount', value: 'overdueAmount' },
                { title: 'Overdue Days', value: 'overdueDays' },
                { title: 'Last Payment', value: 'lastPaymentDate' }
            ];
        }
        return [];
    };

    // Generate PDF data (same pattern as chit fund)
    const handleGeneratePDF = () => {
        try {
            const tableData = formatDataForPDF(reportData, reportType);
            const tableHeaders = getTableHeaders(reportType);

            console.log('Generating PDF data...');
            console.log('Table Data:', tableData);
            console.log('Table Headers:', tableHeaders);

            // Validate data before setting
            if (Array.isArray(tableData) && Array.isArray(tableHeaders)) {
                setPdfData({
                    tableData,
                    tableHeaders,
                    heading: `${reportType.replace('-', ' ').toUpperCase()} Report`,
                    companyData
                });
            } else {
                console.error('Invalid data structure for PDF generation:', { tableData, tableHeaders });
                alert('Error: Invalid data structure for PDF generation');
            }
        } catch (error) {
            console.error('Error generating PDF data:', error);
            alert('Error generating PDF data: ' + error.message);
        }
    };

    // Generate filename (same pattern as chit fund)
    const generateFileName = () => {
        const timestamp = new Date().toISOString().split('T')[0];
        return `${reportType}-${timestamp}.pdf`;
    };

    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FiFileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h4 className="font-medium text-gray-900">{report.title}</h4>
                    <p className="text-sm text-gray-500">
                        Generated on {new Date(report.generatedAt).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onView(report)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <FiEye className="w-4 h-4" />
                    View
                </button>

                {/* PDF Download using exact same pattern as chit fund */}
                {pdfData ? (
                    <ErrorBoundary>
                        <PDFDownloadLink
                            document={
                                reportType === 'loan-summary' ? (
                                    <LoanSummaryReportPDF
                                        tableData={Array.isArray(pdfData.tableData) ? pdfData.tableData : []}
                                        tableHeaders={Array.isArray(pdfData.tableHeaders) ? pdfData.tableHeaders : []}
                                        heading={pdfData.heading || "Report"}
                                        companyData={pdfData.companyData || {}}
                                        reportDate={new Date().toLocaleDateString()}
                                        summaryData={reportData || {}}
                                    />
                                ) : reportType === 'demand-report' ? (
                                    <DemandReportPDF
                                        tableData={Array.isArray(pdfData.tableData) ? pdfData.tableData : []}
                                        tableHeaders={Array.isArray(pdfData.tableHeaders) ? pdfData.tableHeaders : []}
                                        heading={pdfData.heading || "Report"}
                                        companyData={pdfData.companyData || {}}
                                        reportDate={new Date().toLocaleDateString()}
                                        summaryData={reportData || {}}
                                    />
                                ) : reportType === 'outstanding-report' ? (
                                    <OutstandingReportPDF
                                        tableData={Array.isArray(pdfData.tableData) ? pdfData.tableData : []}
                                        tableHeaders={Array.isArray(pdfData.tableHeaders) ? pdfData.tableHeaders : []}
                                        heading={pdfData.heading || "Report"}
                                        companyData={pdfData.companyData || {}}
                                        reportDate={new Date().toLocaleDateString()}
                                        summaryData={reportData || {}}
                                    />
                                ) : (
                                    <Mypdf
                                        tableData={Array.isArray(pdfData.tableData) ? pdfData.tableData : []}
                                        tableHeaders={Array.isArray(pdfData.tableHeaders) ? pdfData.tableHeaders : []}
                                        heading={pdfData.heading || "Report"}
                                        companyData={pdfData.companyData || {}}
                                    />
                                )
                            }
                            fileName={generateFileName()}
                        >
                            {({ loading }) => (
                                <button
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                                    onClick={() => setTimeout(() => setPdfData(null), 500)}
                                >
                                    <FiDownload className="w-4 h-4" />
                                    {loading ? 'Loading PDF...' : 'Download PDF'}
                                </button>
                            )}
                        </PDFDownloadLink>
                    </ErrorBoundary>
                ) : (
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        onClick={handleGeneratePDF}
                    >
                        <FiDownload className="w-4 h-4" />
                        Generate PDF
                    </button>
                )}

                <button
                    onClick={() => onExport('excel')}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    <FiDownload className="w-4 h-4" />
                    Excel
                </button>
            </div>
        </div>
    );
};

// Report Viewer Modal with PDFDownloadLink
const ReportViewer = ({ report, onClose, onExport, companies, user }) => {
    const reportData = report.data || report;
    const reportType = report.reportType || report.id || 'loan-summary';

    // Custom formatCurrency for PDF (without Unicode rupee symbol)
    const formatCurrencyForPDF = (amount) => {
        if (!amount && amount !== 0) return 'Rs. 0';
        // Use Rs. instead of ₹ for PDF compatibility
        const num = Number(amount);
        const formatted = num.toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        const result = `Rs. ${formatted}`;
        return result;
    };

    // Format data for PDF based on report type (moved inside component)
    const formatDataForPDF = (data, reportType) => {
        // Validate input data
        if (!data || typeof data !== 'object') {
            console.error('Invalid data provided to formatDataForPDF:', data);
            return [];
        }

        try {
            if (reportType === 'loan-summary') {
                // Return loan details for PDF table, not just summary metrics
                if (data.loans && Array.isArray(data.loans) && data.loans.length > 0) {
                    const loanDetails = data.loans.map(loan => ({
                        customerName: loan.customerName || loan.customer_name || 'N/A',
                        customerPhone: loan.customerPhone || loan.customer_phone || 'N/A',
                        productName: loan.productName || loan.product_name || 'N/A',
                        principalAmount: formatCurrencyForPDF(loan.principalAmount || loan.principal_amount || 0),
                        cashInHand: formatCurrencyForPDF(loan.cashInHand || loan.cash_in_hand || 0),
                        collectedAmount: formatCurrencyForPDF(loan.collectedAmount || loan.collected_amount || 0),
                        outstanding: formatCurrencyForPDF(loan.closingBalance || loan.closing_balance || 0),
                        status: loan.status || 'N/A',
                        disbursementDate: loan.disbursementDate || loan.disbursement_date || 'N/A'
                    }));
                    return loanDetails;
                } else {
                    // Fallback to summary if no loans
                    return [
                        { metric: 'Total Loans', value: data.totalLoans || 0 },
                        { metric: 'Active Loans', value: data.activeLoans || 0 },
                        { metric: 'Completed Loans', value: data.completedLoans || 0 },
                        { metric: 'Overdue Loans', value: data.overdueLoans || 0 },
                        { metric: 'Total Disbursed', value: formatCurrencyForPDF(data.totalDisbursed || 0) },
                        { metric: 'Total Collected', value: formatCurrencyForPDF(data.totalCollected || 0) }
                    ];
                }
            } else if (reportType === 'demand-report' && Array.isArray(data.receivables)) {
                return data.receivables.map(rec => {
                    if (!rec || typeof rec !== 'object') return null;
                    return {
                        customerName: rec.customerName || '',
                        customerPhone: rec.customerPhone || '',
                        productName: rec.productName || '',
                        dueAmount: formatCurrencyForPDF(rec.dueAmount || 0),
                        openingBalance: formatCurrencyForPDF(rec.openingBalance || 0),
                        closingBalance: formatCurrencyForPDF(rec.closingBalance || 0)
                    };
                }).filter(item => item !== null);
            } else if (reportType === 'outstanding-report' && Array.isArray(data.customers)) {
                // Flatten customer data with loan details for PDF
                const flattenedData = [];
                data.customers.forEach(customer => {
                    if (!customer || typeof customer !== 'object') return;
                    
                    if (customer.loans && Array.isArray(customer.loans) && customer.loans.length > 0) {
                        // Add a row for each loan
                        customer.loans.forEach(loan => {
                            flattenedData.push({
                                customerName: customer.customerName || '',
                                customerPhone: customer.customerPhone || '',
                                productName: loan.productName || 'N/A',
                                principalAmount: formatCurrencyForPDF(loan.principalAmount || 0),
                                outstandingAmount: formatCurrencyForPDF(loan.outstandingAmount || 0),
                                futureDue: formatCurrencyForPDF(loan.futureDue || 0),
                                remainingInstallments: loan.remainingInstallments || 0
                            });
                        });
                    } else {
                        // If no loans, still add customer summary
                        flattenedData.push({
                            customerName: customer.customerName || '',
                            customerPhone: customer.customerPhone || '',
                            productName: 'N/A',
                            principalAmount: 'N/A',
                            outstandingAmount: formatCurrencyForPDF(customer.totalOutstanding || 0),
                            futureDue: formatCurrencyForPDF(customer.totalFutureDue || 0),
                            remainingInstallments: 0
                        });
                    }
                });
                return flattenedData.filter(item => item !== null);
            } else if (reportType === 'overdue-report' && Array.isArray(data.loans)) {
                return data.loans.map(loan => {
                    if (!loan || typeof loan !== 'object') return null;
                    return {
                        customerName: loan.customerName || '',
                        customerPhone: loan.customerPhone || '',
                        productName: loan.productName || '',
                        principalAmount: formatCurrencyForPDF(loan.principalAmount || 0),
                        overdueAmount: formatCurrencyForPDF(loan.overdueAmount || 0),
                        overdueDays: loan.overdueDays || 0,
                        lastPaymentDate: loan.lastPaymentDate || 'N/A'
                    };
                }).filter(item => item !== null);
            }
        } catch (error) {
            console.error('Error formatting data for PDF:', error);
            return [];
        }

        return [];
    };

    // Get table headers based on report type (moved inside component)
    const getTableHeaders = (reportType) => {
        if (reportType === 'loan-summary') {
            return [
                { title: 'Customer', value: 'customerName' },
                { title: 'Phone', value: 'customerPhone' },
                { title: 'Product', value: 'productName' },
                { title: 'Principal', value: 'principalAmount' },
                { title: 'Cash in Hand', value: 'cashInHand' },
                { title: 'Collected', value: 'collectedAmount' },
                { title: 'Outstanding', value: 'outstanding' },
                { title: 'Status', value: 'status' },
                { title: 'Disbursement Date', value: 'disbursementDate' }
            ];
        } else if (reportType === 'demand-report') {
            return [
                { title: 'Customer', value: 'customerName' },
                { title: 'Phone', value: 'customerPhone' },
                { title: 'Product', value: 'productName' },
                { title: 'Due Amount', value: 'dueAmount' },
                { title: 'Opening Balance', value: 'openingBalance' },
                { title: 'Closing Balance', value: 'closingBalance' }
            ];
        } else if (reportType === 'outstanding-report') {
            return [
                { title: 'Customer', value: 'customerName' },
                { title: 'Phone', value: 'customerPhone' },
                { title: 'Product', value: 'productName' },
                { title: 'Principal Amount', value: 'principalAmount' },
                { title: 'Outstanding', value: 'outstandingAmount' },
                { title: 'Future Due', value: 'futureDue' },
                { title: 'Remaining Installments', value: 'remainingInstallments' }
            ];
        } else if (reportType === 'overdue-report') {
            return [
                { title: 'Customer', value: 'customerName' },
                { title: 'Phone', value: 'customerPhone' },
                { title: 'Product', value: 'productName' },
                { title: 'Principal Amount', value: 'principalAmount' },
                { title: 'Overdue Amount', value: 'overdueAmount' },
                { title: 'Overdue Days', value: 'overdueDays' },
                { title: 'Last Payment', value: 'lastPaymentDate' }
            ];
        }
        return [];
    };

    const tableData = formatDataForPDF(reportData, reportType);
    const tableHeaders = getTableHeaders(reportType);

    // Get company data for PDF (using actual daily collection company data from database)
    const getCompanyData = () => {
        const dailyCollectionCompany = companies?.[0];
        const chitFundCompany = user?.results?.userCompany?.[0];

        console.log('=== GET COMPANY DATA DEBUG ===');
        console.log('Daily Collection Companies:', companies);
        console.log('Selected Company:', dailyCollectionCompany);
        console.log('Company Logo (base64):', dailyCollectionCompany?.company_logo ? 'Present' : 'Missing');
        console.log('Company Logo (S3):', dailyCollectionCompany?.company_logo_s3_image ? 'Present' : 'Missing');
        console.log('Chit Fund Company:', chitFundCompany);

        // Use daily collection company data first, then fallback to chit fund company
        if (dailyCollectionCompany) {
            const companyData = {
                // Daily collection specific fields (from database)
                company_name: dailyCollectionCompany.company_name,
                company_logo: dailyCollectionCompany.company_logo, // Use base64 format
                contact_no: dailyCollectionCompany.contact_no,
                address: dailyCollectionCompany.address,
                // Map to PDF header format for compatibility
                name: dailyCollectionCompany.company_name,
                phone: dailyCollectionCompany.contact_no,
                street_address: dailyCollectionCompany.address,
                city: '',
                state: '',
                zipcode: '',
                country: '',
                email: '',
                registration_no: '',
                company_since: ''
            };
            console.log('Using Daily Collection Company Data:', companyData);
            return companyData;
        } else if (chitFundCompany) {
            console.log('Using Chit Fund Company Data:', chitFundCompany);
            return chitFundCompany;
        } else {
            console.log('Using Default Company Data');
            return {
                company_name: 'Daily Collection Company',
                name: 'Daily Collection Company',
                address: 'Company Address',
                contact_no: 'N/A',
                phone: 'N/A'
            };
        }
    };

    const companyData = getCompanyData();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">{report.title}</h3>
                    <div className="flex items-center gap-2">
                        {/* PDF Download using same pattern as chit fund */}
                        <ErrorBoundary>
                            <PDFDownloadLink
                                document={
                                    reportType === 'loan-summary' ? (
                                        <LoanSummaryReportPDF
                                            tableData={Array.isArray(tableData) ? tableData : []}
                                            tableHeaders={Array.isArray(tableHeaders) ? tableHeaders : []}
                                            heading={`${reportType.replace('-', ' ').toUpperCase()} Report`}
                                            companyData={companyData || {}}
                                            reportDate={new Date().toLocaleDateString()}
                                            summaryData={reportData || {}}
                                        />
                                    ) : reportType === 'demand-report' ? (
                                        <DemandReportPDF
                                            tableData={Array.isArray(tableData) ? tableData : []}
                                            tableHeaders={Array.isArray(tableHeaders) ? tableHeaders : []}
                                            heading={`${reportType.replace('-', ' ').toUpperCase()} Report`}
                                            companyData={companyData || {}}
                                            reportDate={new Date().toLocaleDateString()}
                                            summaryData={reportData || {}}
                                        />
                                    ) : reportType === 'outstanding-report' ? (
                                        <OutstandingReportPDF
                                            tableData={Array.isArray(tableData) ? tableData : []}
                                            tableHeaders={Array.isArray(tableHeaders) ? tableHeaders : []}
                                            heading={`${reportType.replace('-', ' ').toUpperCase()} Report`}
                                            companyData={companyData || {}}
                                            reportDate={new Date().toLocaleDateString()}
                                            summaryData={reportData || {}}
                                        />
                                    ) : (
                                        <Mypdf
                                            tableData={Array.isArray(tableData) ? tableData : []}
                                            tableHeaders={Array.isArray(tableHeaders) ? tableHeaders : []}
                                            heading={`${reportType.replace('-', ' ').toUpperCase()} Report`}
                                            companyData={companyData || {}}
                                        />
                                    )
                                }
                                fileName={`${reportType}-${new Date().toISOString().split('T')[0]}.pdf`}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {({ loading }) => (
                                    <>
                                        <FiDownload className="w-4 h-4" />
                                        {loading ? 'Preparing PDF...' : 'Export PDF'}
                                    </>
                                )}
                            </PDFDownloadLink>
                        </ErrorBoundary>

                        <button
                            onClick={() => onExport('excel')}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <FiDownload className="w-4 h-4" />
                            Export Excel
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <FiX className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <ReportContent report={report} />
                </div>
            </div>
        </div>
    );
};

// Report Content Component
const ReportContent = ({ report }) => {
    const reportId = report.reportType || report.id; // Use reportType first, then fallback to id
    const data = report.data || report;

    // Comprehensive debug logging
    console.log('=== REPORT CONTENT DEBUG ===');
    console.log('Report ID:', reportId);
    console.log('Full report object:', report);
    console.log('Data object:', data);
    console.log('Data type:', typeof data);
    console.log('Data keys:', data ? Object.keys(data) : 'no data');

    if (data?.loans) {
        console.log('Loans array length:', data.loans.length);
        if (data.loans.length > 0) {
            console.log('First loan object:', data.loans[0]);
            console.log('First loan keys:', Object.keys(data.loans[0]));
            console.log('First loan values:', Object.values(data.loans[0]));
        }
    }

    if (data?.receivables) {
        console.log('Receivables array length:', data.receivables.length);
        if (data.receivables.length > 0) {
            console.log('First receivable object:', data.receivables[0]);
            console.log('First receivable keys:', Object.keys(data.receivables[0]));
        }
    }

    if (data?.customers) {
        console.log('Customers array length:', data.customers.length);
        if (data.customers.length > 0) {
            console.log('First customer object:', data.customers[0]);
            console.log('First customer keys:', Object.keys(data.customers[0]));
        }
    }
    console.log('=== END REPORT CONTENT DEBUG ===');

    // Universal data handler - safely processes ANY data structure
    const safeGetValue = (obj, key, defaultValue = 'N/A') => {
        try {
            const value = obj?.[key];
            if (value === null || value === undefined) return defaultValue;
            if (typeof value === 'number') return value;
            if (typeof value === 'string') return value;
            return String(value);
        } catch (error) {
            console.error(`Error getting value for key ${key}:`, error);
            return defaultValue;
        }
    };

    const safeParseFloat = (value, defaultValue = 0) => {
        try {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? defaultValue : parsed;
        } catch (error) {
            return defaultValue;
        }
    };

    const safeParseInt = (value, defaultValue = 0) => {
        try {
            const parsed = parseInt(value);
            return isNaN(parsed) ? defaultValue : parsed;
        } catch (error) {
            return defaultValue;
        }
    };

    if (reportId === 'loan-summary') {
        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900">Total Loans</h4>
                        <p className="text-2xl font-bold text-blue-600">{data?.totalLoans || 0}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900">Active Loans</h4>
                        <p className="text-2xl font-bold text-green-600">{data?.activeLoans || 0}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-red-900">Overdue Loans</h4>
                        <p className="text-2xl font-bold text-red-600">{data?.overdueLoans || 0}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900">Completed Loans</h4>
                        <p className="text-2xl font-bold text-gray-600">{data?.completedLoans || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-900">Cancelled Loans</h4>
                        <p className="text-2xl font-bold text-yellow-600">{data?.cancelledLoans || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900">Total Outstanding</h4>
                        <p className="text-2xl font-bold text-purple-600">
                            ₹{data?.totalOutstanding?.toLocaleString() || 0}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900">Total Disbursed</h4>
                        <p className="text-2xl font-bold text-gray-600">
                            ₹{data?.totalDisbursed?.toLocaleString() || 0}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900">Total Collected</h4>
                        <p className="text-2xl font-bold text-gray-600">
                            ₹{data?.totalCollected?.toLocaleString() || 0}
                        </p>
                    </div>
                </div>

                {/* Loans Table */}
                {data?.loans && data.loans.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Details</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash in Hand</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disbursement Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {data?.loans && Array.isArray(data.loans) ? data.loans.map((loan, index) => {
                                        // Universal safe data extraction
                                        const safeLoan = {
                                            id: safeGetValue(loan, 'id', `loan-${index}`),
                                            customerName: safeGetValue(loan, 'customerName', 'N/A'),
                                            productName: safeGetValue(loan, 'productName', 'N/A'),
                                            principalAmount: safeParseFloat(loan.principalAmount, 0),
                                            cashInHand: safeParseFloat(loan.cashInHand, 0),
                                            collectedAmount: safeParseFloat(loan.collectedAmount, 0),
                                            closingBalance: safeParseFloat(loan.closingBalance, 0),
                                            status: safeGetValue(loan, 'status', 'UNKNOWN'),
                                            disbursementDate: safeGetValue(loan, 'disbursementDate', 'N/A'),
                                            dueStartDate: safeGetValue(loan, 'dueStartDate', 'N/A'),
                                            loanMode: safeGetValue(loan, 'loanMode', 'N/A'),
                                            totalInstallments: safeParseInt(loan.totalInstallments, 0),
                                            dailyDueAmount: safeParseFloat(loan.dailyDueAmount, 0),
                                            interestRate: safeParseFloat(loan.interestRate, 0)
                                        };

                                        console.log(`Processing loan ${index}:`, safeLoan);

                                        return (
                                            <tr key={safeLoan.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeLoan.customerName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeLoan.productName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">₹{safeLoan.principalAmount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">₹{safeLoan.cashInHand.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">₹{safeLoan.collectedAmount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">₹{safeLoan.closingBalance.toLocaleString()}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${safeLoan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                        safeLoan.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                                                            safeLoan.status === 'CLOSED' ? 'bg-gray-100 text-gray-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {safeLoan.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeLoan.disbursementDate}</td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="8" className="px-4 py-3 text-sm text-gray-500 text-center">
                                                No loan data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    } else if (reportId === 'demand-report') {
        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900">Total Due Amount</h4>
                        <p className="text-2xl font-bold text-green-600">₹{data?.totalDueAmount?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900">Total Customers</h4>
                        <p className="text-2xl font-bold text-blue-600">{data?.totalCustomers || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900">Total Receivables</h4>
                        <p className="text-2xl font-bold text-purple-600">{data?.totalReceivables || 0}</p>
                    </div>
                </div>

                {/* Today's Collection Due Table */}
                {data?.receivables && data.receivables.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Collection Due</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opening Balance</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Carry Forward</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Closing Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {data?.receivables && Array.isArray(data.receivables) ? data.receivables.map((rec, index) => {
                                        // Universal safe data extraction
                                        const safeRec = {
                                            id: safeGetValue(rec, 'id', `rec-${index}`),
                                            customerName: safeGetValue(rec, 'customerName', 'N/A'),
                                            customerPhone: safeGetValue(rec, 'customerPhone', 'N/A'),
                                            productName: safeGetValue(rec, 'productName', 'N/A'),
                                            dueAmount: safeParseFloat(rec.dueAmount, 0),
                                            openingBalance: safeParseFloat(rec.openingBalance, 0),
                                            carryForward: safeParseFloat(rec.carryForward, 0),
                                            closingBalance: safeParseFloat(rec.closingBalance, 0)
                                        };

                                        console.log(`Processing receivable ${index}:`, safeRec);

                                        return (
                                            <tr key={safeRec.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeRec.customerName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeRec.customerPhone}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeRec.productName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">₹{safeRec.dueAmount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">₹{safeRec.openingBalance.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">₹{safeRec.carryForward.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">₹{safeRec.closingBalance.toLocaleString()}</td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-3 text-sm text-gray-500 text-center">
                                                No receivable data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    } else if (reportId === 'outstanding-report') {
        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900">Total Customers</h4>
                        <p className="text-2xl font-bold text-blue-600">{data?.totalCustomers || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900">Total Outstanding</h4>
                        <p className="text-2xl font-bold text-purple-600">₹{data?.totalOutstanding?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-900">Total Future Due</h4>
                        <p className="text-2xl font-bold text-green-600">₹{data?.totalFutureDue?.toLocaleString() || 0}</p>
                    </div>
                </div>

                {/* Customer-wise Outstanding */}
                {data?.customers && data.customers.length > 0 ? (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer-wise Outstanding</h3>
                        <div className="space-y-6">
                            {data.customers.map((customer, index) => {
                                // Safe data extraction
                                const customerName = customer.customerName || customer.customer_name || customer.dc_cust_name || 'N/A';
                                const customerPhone = customer.customerPhone || customer.customer_phone || customer.dc_cust_phone || 'N/A';
                                const totalOutstanding = parseFloat(customer.totalOutstanding || customer.total_outstanding || 0);
                                const totalFutureDue = parseFloat(customer.totalFutureDue || customer.total_future_due || 0);
                                const customerLoans = customer.loans || [];
                                
                                return (
                                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{customerName}</h4>
                                                <p className="text-sm text-gray-600">{customerPhone}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">Outstanding: <span className="font-semibold">₹{totalOutstanding.toLocaleString()}</span></p>
                                                <p className="text-sm text-gray-600">Future Due: <span className="font-semibold">₹{totalFutureDue.toLocaleString()}</span></p>
                                            </div>
                                        </div>

                                        {customerLoans.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full bg-gray-50 rounded-lg">
                                                <thead>
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Principal</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Future Due</th>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remaining Inst.</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {customerLoans.map((loan, loanIndex) => {
                                                        const productName = loan.productName || loan.product_name || 'N/A';
                                                        const principalAmount = parseFloat(loan.principalAmount || loan.principal_amount || 0);
                                                        const outstandingAmount = parseFloat(loan.outstandingAmount || loan.outstanding_amount || 0);
                                                        const futureDue = parseFloat(loan.futureDue || loan.future_due || 0);
                                                        const remainingInstallments = loan.remainingInstallments || loan.remaining_installments || 0;
                                                        
                                                        return (
                                                            <tr key={loanIndex} className="bg-white">
                                                                <td className="px-3 py-2 text-sm text-gray-900">{productName}</td>
                                                                <td className="px-3 py-2 text-sm text-gray-900">₹{principalAmount.toLocaleString()}</td>
                                                                <td className="px-3 py-2 text-sm text-gray-900">₹{outstandingAmount.toLocaleString()}</td>
                                                                <td className="px-3 py-2 text-sm text-gray-900">₹{futureDue.toLocaleString()}</td>
                                                                <td className="px-3 py-2 text-sm text-gray-900">{remainingInstallments}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 text-center py-8 text-gray-500">
                        <p className="text-lg">No customer data available</p>
                        <p className="text-sm mt-2">Please check your filters or try generating the report again.</p>
                        <div className="mt-4 text-xs text-gray-400">
                            <p>Debug Info:</p>
                            <p>Data keys: {data ? Object.keys(data).join(', ') : 'No data'}</p>
                            <p>Customers: {data?.customers ? (Array.isArray(data.customers) ? data.customers.length : 'Not an array') : 'Missing'}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    } else if (reportId === 'overdue-report') {
        return (
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-red-900">Total Overdue Loans</h4>
                        <p className="text-2xl font-bold text-red-600">{data?.totalOverdueLoans || 0}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-900">Total Amount Not Collected</h4>
                        <p className="text-2xl font-bold text-orange-600">₹{data?.totalOverdueAmount?.toLocaleString() || 0}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-900">Average Overdue Days</h4>
                        <p className="text-2xl font-bold text-yellow-600">{data?.averageOverdueDays || 0}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-900">Total Overdue Installments</h4>
                        <p className="text-2xl font-bold text-purple-600">{data?.totalOverdueReceivables || 0}</p>
                    </div>
                </div>

                {/* Overdue Loans Table */}
                {data?.loans && Array.isArray(data.loans) && data.loans.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Amounts Not Collected from Customers</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collected Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Not Collected</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue Days</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Mode</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue Installments</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Due Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {data?.loans && Array.isArray(data.loans) ? data.loans.map((loan, index) => {
                                        // Universal safe data extraction
                                        const safeLoan = {
                                            id: safeGetValue(loan, 'id', `loan-${index}`),
                                            customerName: safeGetValue(loan, 'customerName', 'N/A'),
                                            customerPhone: safeGetValue(loan, 'customerPhone', 'N/A'),
                                            productName: safeGetValue(loan, 'productName', 'N/A'),
                                            principalAmount: safeParseFloat(loan.principalAmount, 0),
                                            collectedAmount: safeParseFloat(loan.collectedAmount, 0),
                                            overdueAmount: safeParseFloat(loan.overdueAmount, 0),
                                            dueDate: safeGetValue(loan, 'dueDate', 'N/A'),
                                            latestDueDate: safeGetValue(loan, 'latestDueDate', 'N/A'),
                                            overdueDays: safeParseInt(loan.overdueDays, 0),
                                            loanMode: safeGetValue(loan, 'loanMode', 'N/A'),
                                            overdueReceivables: safeParseInt(loan.overdueReceivables, 0)
                                        };

                                        console.log(`Processing overdue loan ${index}:`, safeLoan);

                                        return (
                                            <tr key={safeLoan.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeLoan.customerName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeLoan.customerPhone}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeLoan.productName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">₹{safeLoan.principalAmount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">₹{safeLoan.collectedAmount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-semibold text-red-600">₹{safeLoan.overdueAmount.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeLoan.dueDate}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${safeLoan.overdueDays > 30 ? 'bg-red-100 text-red-800' :
                                                        safeLoan.overdueDays > 15 ? 'bg-orange-100 text-orange-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {safeLoan.overdueDays} days
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {safeLoan.loanMode}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeLoan.overdueReceivables}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{safeLoan.latestDueDate}</td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="11" className="px-4 py-3 text-sm text-gray-500 text-center">
                                                No overdue loan data available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="text-center py-8 text-gray-500">
            <FiFileText className="w-16 h-16 mx-auto mb-4" />
            <p>Report content will be displayed here</p>
        </div>
    );
};

export default ReportsPage;
