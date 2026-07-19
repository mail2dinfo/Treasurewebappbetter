import React, { useMemo, useState } from 'react';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import { useVfPermission } from '../../components/vehicleFinance/useVfPermission';
import { FiBarChart2, FiFileText } from 'react-icons/fi';

const REPORT_TYPES = [
    {
        id: 'loan-summary',
        label: 'Subscriber / Loan Summary',
        description: 'Overview of subscribers and their loan status',
        featureKey: 'vf_report_loan_summary',
        rowKeys: ['loans', 'customers', 'subscribers'],
    },
    {
        id: 'outstanding-report',
        label: 'Outstanding (Due for Payment)',
        description: 'Amounts currently due for payment',
        featureKey: 'vf_report_outstanding_due',
        rowKeys: ['receivables', 'dues', 'outstanding', 'loans'],
    },
    {
        id: 'overdue-report',
        label: 'Outstanding Loan-wise',
        description: 'Outstanding balance grouped by loan',
        featureKey: 'vf_report_outstanding_loan_wise',
        rowKeys: ['overdueLoans', 'loans', 'outstanding'],
    },
    {
        id: 'demand-report',
        label: "Today's Collection On Demand",
        description: 'Collection demand due today',
        featureKey: 'vf_report_todays_demand',
        rowKeys: ['receivables', 'demand', 'dues'],
    },
    {
        id: 'collection-report',
        label: 'Collection Report',
        description: 'Collections received with payment breakdown',
        featureKey: 'vf_report_collection',
        rowKeys: ['collections', 'receipts'],
    },
    {
        id: 'financial-summary',
        label: 'Financial Summary',
        description: 'Disbursed, collected, outstanding and collection rate',
        featureKey: 'vf_report_financial_summary',
        rowKeys: ['monthlyTrends', 'trends'],
        isSummary: true,
    },
];

const formatCell = (value) => {
    if (value == null) return '';
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value.toLocaleString('en-IN') : String(value);
    }
    return String(value);
};

const formatMoney = (value) =>
    `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const pickRows = (data, rowKeys = []) => {
    if (!data || typeof data !== 'object') return [];
    for (const key of rowKeys) {
        if (Array.isArray(data[key]) && data[key].length) return data[key];
    }
    for (const value of Object.values(data)) {
        if (Array.isArray(value) && value.length && typeof value[0] === 'object') {
            return value;
        }
    }
    return [];
};

const VehicleFinanceReportsPage = () => {
    const { user } = useUserContext();
    const { canAccess } = useVfPermission();
    const allowedReports = useMemo(
        () => REPORT_TYPES.filter((report) => (
            canAccess(report.featureKey) || canAccess('vf_reports')
        )),
        [canAccess]
    );
    const [reportType, setReportType] = useState(allowedReports[0]?.id || 'outstanding-report');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const userAccounts = user?.results?.userAccounts || [];
    const account =
        userAccounts.find((item) => item?.parent_membership_id != null)
        || userAccounts[0];
    const membershipId = account?.parent_membership_id ?? account?.membershipId ?? account?.membership_id;

    const selectedMeta = REPORT_TYPES.find((item) => item.id === reportType) || REPORT_TYPES[0];
    const rows = pickRows(report?.data, selectedMeta?.rowKeys);
    const summary = report?.data && !Array.isArray(report.data) ? report.data : report?.summary;

    const generate = async (type = reportType) => {
        if (!user?.results?.token) return;
        if (!membershipId) {
            setError('Membership not found for this login.');
            return;
        }
        if (!allowedReports.some((item) => item.id === type)) {
            setError('You do not have permission for this report.');
            return;
        }
        setLoading(true);
        setError('');
        setReportType(type);
        try {
            const res = await fetch(`${API_BASE_URL}/vf/reports/generate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.results.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reportType: type, membershipId, filters: {} }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.message || 'Failed to generate report');
            }
            setReport(data.results || data);
        } catch (generateError) {
            setError(generateError.message || 'Failed to generate report');
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    if (!allowedReports.length) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-6">
                <h1 className="text-2xl font-bold mb-2">Reports</h1>
                <p className="text-gray-500">No report permissions are assigned to this login.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Generate subscriber, outstanding, demand, collection, and financial reports.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {allowedReports.map((item) => {
                    const selected = reportType === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                setReportType(item.id);
                                setReport(null);
                                setError('');
                            }}
                            className={`text-left rounded-xl border p-4 transition-all ${
                                selected
                                    ? 'border-red-500 bg-red-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-red-200 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`mt-0.5 rounded-lg p-2 ${selected ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {item.isSummary ? <FiBarChart2 /> : <FiFileText />}
                                </span>
                                <span>
                                    <span className="block font-semibold text-gray-900">{item.label}</span>
                                    <span className="block text-xs text-gray-500 mt-1">{item.description}</span>
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white border rounded-xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div>
                    <p className="font-semibold text-gray-900">{selectedMeta?.label}</p>
                    <p className="text-sm text-gray-500">{selectedMeta?.description}</p>
                </div>
                <button
                    type="button"
                    onClick={() => generate(reportType)}
                    disabled={loading}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 w-full sm:w-auto"
                >
                    {loading ? 'Generating…' : 'Generate Report'}
                </button>
            </div>

            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {report && (
                <div className="bg-white border rounded-xl overflow-hidden">
                    <div className="p-4 border-b">
                        <h2 className="font-semibold text-gray-900">
                            {report.title || selectedMeta?.label || reportType}
                        </h2>
                        {report.generatedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                                Generated {new Date(report.generatedAt).toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>

                    {selectedMeta?.isSummary && summary && typeof summary === 'object' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 border-b bg-gray-50">
                            {[
                                ['Total Disbursed', summary.totalDisbursed ?? summary.total_disbursed],
                                ['Total Collected', summary.totalCollected ?? summary.total_collected ?? summary.totalReceipts],
                                ['Outstanding', summary.outstandingAmount ?? summary.total_outstanding ?? summary.outstanding],
                                ['Collection Rate', summary.collectionRate != null
                                    ? `${Number(summary.collectionRate).toFixed(1)}%`
                                    : summary.collection_rate],
                            ].map(([label, value]) => (
                                <div key={label} className="rounded-lg border bg-white p-3">
                                    <p className="text-xs text-gray-500">{label}</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">
                                        {label === 'Collection Rate'
                                            ? (value ?? '—')
                                            : formatMoney(value)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {summary && typeof summary === 'object' && !selectedMeta?.isSummary && (
                        <div className="px-4 py-3 border-b text-sm text-gray-600 bg-gray-50">
                            {Object.entries(summary)
                                .filter(([, value]) => value == null || typeof value !== 'object')
                                .slice(0, 6)
                                .map(([key, value]) => (
                                    <span key={key} className="inline-block mr-4 mb-1">
                                        <span className="font-medium text-gray-800">{key}</span>: {formatCell(value)}
                                    </span>
                                ))}
                        </div>
                    )}

                    {Array.isArray(rows) && rows.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {Object.keys(rows[0]).slice(0, 10).map((key) => (
                                            <th key={key} className="p-3 text-left font-medium text-gray-700 whitespace-nowrap">
                                                {key}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr key={index} className="border-t">
                                            {Object.keys(rows[0]).slice(0, 10).map((key) => (
                                                <td key={key} className="p-3 whitespace-nowrap text-gray-700">
                                                    {formatCell(row[key])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="p-6 text-gray-500 text-center">
                            {selectedMeta?.isSummary
                                ? 'Summary generated. No detail rows for this report.'
                                : 'No data for this report'}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default VehicleFinanceReportsPage;
