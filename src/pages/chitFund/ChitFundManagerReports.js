import React, { useEffect, useMemo, useState } from 'react';
import { FiDownload, FiFileText, FiSearch } from 'react-icons/fi';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { API_BASE_URL, readApiResponse } from '../../utils/apiConfig';
import { useUserContext } from '../../context/user_context';
import Mypdf from '../../components/PDF/Mypdf';

const money = (value) => Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const ChitFundManagerReports = ({ reportType = 'area' }) => {
    const { user } = useUserContext();
    const token = user?.results?.token;
    const [dashboard, setDashboard] = useState({});
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadReport = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await fetch(`${API_BASE_URL}/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await readApiResponse(response);
                setDashboard(data?.results || data || {});
            } catch (loadError) {
                setError('Unable to load the report right now.');
            } finally {
                setIsLoading(false);
            }
        };
        if (token) loadReport();
    }, [token]);

    const isAreaReport = reportType === 'area';
    const rows = useMemo(() => {
        const areaRows = dashboard.userMembershipAreaWiseSubcriberDue || [];
        const source = isAreaReport
            ? areaRows
            : (dashboard.userMembershipBySubscriberwise || []).map((subscriber) => {
                const areaMatch = areaRows.find((area) =>
                    (subscriber.subscriber_id && area.subscriber_id === subscriber.subscriber_id)
                    || String(area.name || '').toLowerCase() === String(subscriber.name || '').toLowerCase()
                );
                return {
                    ...subscriber,
                    phone: subscriber.phone || areaMatch?.phone,
                };
            });
        const query = search.trim().toLowerCase();
        return (source || []).filter((item) => !query || [
            item.aob,
            item.name,
            item.phone,
        ].some((value) => String(value || '').toLowerCase().includes(query)));
    }, [dashboard, isAreaReport, search]);

    const pdfRows = rows.map((item) => ({
        aob: item.aob || 'Unassigned',
        name: item.name || 'Unknown',
        phone: item.phone || '—',
        total: isAreaReport ? item.rbtotal : item.total,
        paid: isAreaReport ? item.rctotal : item.paid,
        due: isAreaReport ? item.rbdue : item.due,
    }));
    const pdfHeaders = [
        ...(isAreaReport ? [{ title: 'Area', value: 'aob' }] : []),
        { title: 'Subscriber Name', value: 'name' },
        { title: 'Phone', value: 'phone' },
        { title: 'Total', value: 'total' },
        { title: 'Paid', value: 'paid' },
        { title: 'Outstanding', value: 'due' },
    ];
    const reportFileName = `${isAreaReport ? 'AreaWiseReport' : 'SubscriberOutstandingReport'}_${new Date().toISOString().slice(0, 10)}.pdf`;

    return (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                    <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
                        <FiFileText /> Chit Fund Reports
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mt-1">
                        {isAreaReport ? 'Area-wise Report' : 'Subscriber-wise Outstanding Report'}
                    </h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <label className="relative w-full sm:w-80">
                        <FiSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search area, subscriber or phone"
                            className="w-full border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                        />
                    </label>
                    {!isLoading && !error && rows.length > 0 && (
                        <PDFDownloadLink
                            document={
                                <Mypdf
                                    tableData={pdfRows}
                                    tableHeaders={pdfHeaders}
                                    heading={isAreaReport ? 'Area-wise Outstanding Report' : 'Subscriber-wise Outstanding Report'}
                                    companyData={user?.results?.userCompany || []}
                                />
                            }
                            fileName={reportFileName}
                        >
                            {({ loading }) => (
                                <button
                                    type="button"
                                    className="w-full sm:w-auto h-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 font-semibold"
                                >
                                    <FiDownload />
                                    {loading ? 'Preparing…' : 'Download PDF'}
                                </button>
                            )}
                        </PDFDownloadLink>
                    )}
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl p-4">{error}</div>}
            {isLoading ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-500">Loading report…</div>
            ) : !error && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px] text-sm">
                            <thead className="bg-red-600 text-white">
                                <tr>
                                    {isAreaReport && <th className="text-left px-4 py-3">Area</th>}
                                    <th className="text-left px-4 py-3">Subscriber</th>
                                    <th className="text-left px-4 py-3">Phone</th>
                                    <th className="text-right px-4 py-3">Total</th>
                                    <th className="text-right px-4 py-3">Paid</th>
                                    <th className="text-right px-4 py-3">Outstanding</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((item, index) => (
                                    <tr key={`${item.subscriber_id || item.name}-${index}`} className="hover:bg-red-50/40">
                                        {isAreaReport && <td className="px-4 py-3 font-medium text-gray-800">{item.aob || 'Unassigned'}</td>}
                                        <td className="px-4 py-3 text-gray-800">{item.name || 'Unknown'}</td>
                                        <td className="px-4 py-3 text-gray-500">{item.phone || '—'}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">{money(isAreaReport ? item.rbtotal : item.total)}</td>
                                        <td className="px-4 py-3 text-right text-green-700">{money(isAreaReport ? item.rctotal : item.paid)}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-red-700">{money(isAreaReport ? item.rbdue : item.due)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!rows.length && <div className="p-10 text-center text-gray-500">No report records found.</div>}
                </div>
            )}
        </div>
    );
};

export default ChitFundManagerReports;
