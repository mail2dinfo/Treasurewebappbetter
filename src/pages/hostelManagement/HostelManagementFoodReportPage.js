import React, { useEffect, useMemo, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FiDownload } from 'react-icons/fi';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import HostelFoodReportPDF from '../../components/hostelManagement/PDF/HostelFoodReportPDF';

const ALL_HOSTELS = 'ALL';
const toDate = (d) => d.toISOString().slice(0, 10);

const formatShort = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const HostelManagementFoodReportPage = () => {
  const {
    hostels,
    foodReport,
    orgFoodReport,
    membershipId,
    fetchHostels,
    fetchFoodReport,
    fetchOrgFoodReport,
  } = useHostelManagement();

  const [filterHostelId, setFilterHostelId] = useState(ALL_HOSTELS);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return toDate(d);
  });

  useEffect(() => {
    fetchHostels();
  }, []);

  const endDate = useMemo(() => {
    if (!startDate) return '';
    const end = new Date(startDate);
    end.setDate(end.getDate() + 6);
    return toDate(end);
  }, [startDate]);

  const isAll = filterHostelId === ALL_HOSTELS;

  const reportDays = useMemo(() => {
    if (isAll) return orgFoodReport?.totals_by_date || [];
    return foodReport || [];
  }, [isAll, orgFoodReport, foodReport]);

  const hostelName = useMemo(() => {
    if (isAll) return 'All hostels (centralized kitchen)';
    const h = (hostels || []).find((x) => x.id === filterHostelId);
    return h?.hostel_name || h?.name || 'Hostel';
  }, [isAll, hostels, filterHostelId]);

  const weekLabel = useMemo(() => {
    if (!startDate || !endDate) return '';
    return `${formatShort(startDate)} – ${formatShort(endDate)}`;
  }, [startDate, endDate]);

  useEffect(() => {
    if (!startDate || !endDate) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (isAll) {
          if (!membershipId) return;
          await fetchOrgFoodReport(membershipId, startDate, endDate);
        } else if (filterHostelId) {
          await fetchFoodReport(filterHostelId, startDate, endDate);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filterHostelId, isAll, membershipId, startDate, endDate, fetchFoodReport, fetchOrgFoodReport]);

  const hasData = reportDays.length > 0;
  const pdfFileName = `food-report-${isAll ? 'all' : 'hostel'}-${startDate || 'week'}.pdf`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Food Estimation Report</h1>
          <p className="text-sm text-gray-500">
            How many available for breakfast / lunch / dinner and who they are.
            {isAll ? ' Combined across all hostels for centralized kitchen.' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <PDFDownloadLink
            document={(
              <HostelFoodReportPDF
                hostelName={hostelName}
                weekLabel={weekLabel}
                days={reportDays}
                showHostelOnNames={isAll}
              />
            )}
            fileName={pdfFileName}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              hasData ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 pointer-events-none'
            }`}
          >
            {({ loading: pdfLoading }) => (
              <>
                <FiDownload className="w-4 h-4" />
                {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
              </>
            )}
          </PDFDownloadLink>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[180px]"
            value={filterHostelId}
            onChange={(e) => setFilterHostelId(e.target.value)}
          >
            <option value={ALL_HOSTELS}>All (centralized kitchen)</option>
            {(hostels || []).map((h) => (
              <option key={h.id} value={h.id}>{h.hostel_name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading report…</p>}

      <div className="space-y-4">
        {reportDays.map((day) => (
          <div key={day.meal_date} className="bg-white border rounded-xl p-4">
            <h2 className="font-bold mb-3">
              {day.weekday} · {day.meal_date}
              {isAll && <span className="ml-2 text-xs font-medium text-gray-500">All hostels</span>}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {['breakfast', 'lunch', 'dinner'].map((meal) => (
                <div key={meal} className="border rounded-lg p-3 bg-gray-50">
                  <p className="text-xs font-semibold uppercase text-gray-500">{meal}</p>
                  <p className="text-2xl font-bold text-red-700">{day[meal]?.count || 0}</p>
                  <ul className="mt-2 text-xs text-gray-700 space-y-0.5 max-h-28 overflow-y-auto">
                    {(day[meal]?.residents || []).map((r) => (
                      <li key={`${r.id}-${r.hostel_name || ''}`}>
                        {r.name}
                        {isAll && r.hostel_name ? (
                          <span className="text-gray-400"> · {r.hostel_name}</span>
                        ) : null}
                      </li>
                    ))}
                    {(day[meal]?.count || 0) === 0 && <li className="text-gray-400">None available</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!loading && reportDays.length === 0 && (
          <p className="text-gray-500">No meal updates for this week yet (default = Not available).</p>
        )}
      </div>
    </div>
  );
};

export default HostelManagementFoodReportPage;
