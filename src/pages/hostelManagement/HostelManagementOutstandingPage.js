import React, { useEffect, useMemo, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import HostelSelector from '../../components/hostelManagement/HostelSelector';
import HostelOutstandingReportPDF from '../../components/hostelManagement/PDF/HostelOutstandingReportPDF';
import HostelReceiptPDF from '../../components/hostelManagement/PDF/HostelReceiptPDF';
import { buildHostelBillProps } from '../../utils/hostelBillProps';

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthInputToLabel = (ym) => {
  if (!ym) return 'All months';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
};

const HostelManagementOutstandingPage = () => {
  const {
    selectedHostelId,
    hostels,
    fetchReceivables,
  } = useHostelManagement();

  const [month, setMonth] = useState(currentMonth());
  const [outstandingOnly, setOutstandingOnly] = useState(true);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  const hostelName = useMemo(() => {
    const h = (hostels || []).find((x) => x.id === selectedHostelId);
    return h?.hostel_name || h?.name || 'Hostel';
  }, [hostels, selectedHostelId]);

  const monthLabel = monthInputToLabel(month);

  const load = async () => {
    if (!selectedHostelId) {
      setRows([]);
      setSummary(null);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchReceivables(selectedHostelId, {
        month: month || undefined,
        outstandingOnly,
      });
      if (result?.success) {
        setRows(result.data || []);
        setSummary(result.summary || {
          count: (result.data || []).length,
          total_due: (result.data || []).reduce((s, r) => s + Number(r.amount_due || 0), 0),
          total_paid: (result.data || []).reduce((s, r) => s + Number(r.amount_paid || 0), 0),
          total_balance: (result.data || []).reduce((s, r) => s + Number(r.balance || 0), 0),
        });
      } else {
        setRows([]);
        setSummary(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHostelId, month, outstandingOnly]);

  const pdfFileName = `hostel-outstanding-${month || 'all'}.pdf`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div>
          <h1 className="text-2xl font-bold">Outstanding Report</h1>
          <p className="text-sm text-gray-500">
            Month, tenant, phone, total, paid and due — download report or receipt PDF.
          </p>
        </div>
        <HostelSelector />
      </div>

      <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 items-end justify-between">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-sm">
            <span className="block text-xs text-gray-500 mb-1">Month</span>
            <input
              type="month"
              className="border rounded-lg px-3 py-2"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="text-xs text-gray-600 underline py-2"
            onClick={() => setMonth('')}
          >
            All months
          </button>
          <label className="inline-flex items-center gap-2 text-sm py-2">
            <input
              type="checkbox"
              checked={outstandingOnly}
              onChange={(e) => setOutstandingOnly(e.target.checked)}
            />
            Outstanding only (due &gt; 0)
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading || !selectedHostelId}
            className="border rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Refresh'}
          </button>
          <PDFDownloadLink
            document={(
              <HostelOutstandingReportPDF
                hostelName={hostelName}
                monthLabel={monthLabel}
                rows={rows}
                summary={summary || {}}
              />
            )}
            fileName={pdfFileName}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              rows.length ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 pointer-events-none'
            }`}
          >
            {({ loading: pdfLoading }) => (
              <>
                <FiDownload className="w-4 h-4" />
                {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
              </>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Rows', value: summary.count },
            { label: 'Total', value: `₹${Number(summary.total_due || 0).toLocaleString('en-IN')}` },
            { label: 'Paid', value: `₹${Number(summary.total_paid || 0).toLocaleString('en-IN')}` },
            { label: 'Due', value: `₹${Number(summary.total_balance || 0).toLocaleString('en-IN')}` },
          ].map((c) => (
            <div key={c.label} className="bg-white border rounded-xl p-4">
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className="text-lg font-bold text-gray-900">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-3">Month</th>
              <th className="px-3 py-3">St. Dt</th>
              <th className="px-3 py-3">Ed. Dt</th>
              <th className="px-3 py-3">Tenant name</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-right">Paid</th>
              <th className="px-3 py-3 text-right">Due</th>
              <th className="px-3 py-3">Receipt PDF</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const roomLabel = [r.floor_name, r.room_number, r.bed_label].filter(Boolean).join(' / ');
              const receiptDoc = (
                <HostelReceiptPDF
                  {...buildHostelBillProps({
                    hostel: {
                      hostel_name: r.hostel_name || hostelName,
                      address: r.hostel_address,
                      city: r.hostel_city,
                      contact_phone: r.hostel_phone,
                      house_rules: r.house_rules,
                    },
                    resident: {
                      name: r.resident_name,
                      phone: r.resident_phone,
                      join_date: r.join_date,
                      expected_end_date: r.expected_end_date,
                      security_deposit: r.security_deposit,
                      security_deposit_balance: r.security_deposit_balance,
                      pending_balance: r.balance,
                      rent_plan: r.rent_plan,
                    },
                    receivable: r,
                    receipt: {
                      bill_number: r.latest_bill_number,
                      payment_method: r.latest_payment_method,
                      payment_type: r.latest_payment_type,
                      paid_at: r.latest_paid_at,
                    },
                  })}
                />
              );
              const receiptName = r.latest_bill_number
                ? `receipt-${r.latest_bill_number}.pdf`
                : `due-${r.resident_name || r.id}-${r.month_key || 'bill'}.pdf`;
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-3 whitespace-nowrap">{r.month_label || '—'}</td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">
                    {r.billing_period_start
                      ? new Date(r.billing_period_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">
                    {r.billing_period_end
                      ? new Date(r.billing_period_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-3 py-3 font-medium">{r.resident_name || '—'}</td>
                  <td className="px-3 py-3">{r.resident_phone || '—'}</td>
                  <td className="px-3 py-3 text-right">₹{Number(r.amount_due || 0).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-right text-green-700">₹{Number(r.amount_paid || 0).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-right font-semibold text-red-700">₹{Number(r.balance || 0).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3">
                    <PDFDownloadLink
                      document={receiptDoc}
                      fileName={receiptName}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
                    >
                      {({ loading: rl }) => (
                        <>
                          <FiFileText className="w-3.5 h-3.5" />
                          {rl ? '…' : Number(r.balance) > 0 && !r.latest_receipt_id ? 'Due PDF' : 'Receipt PDF'}
                        </>
                      )}
                    </PDFDownloadLink>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && rows.length === 0 && (
          <p className="p-6 text-gray-500">
            {selectedHostelId ? 'No dues for this filter.' : 'Select a hostel to view outstanding report.'}
          </p>
        )}
        {loading && <p className="p-6 text-gray-500">Loading…</p>}
      </div>
    </div>
  );
};

export default HostelManagementOutstandingPage;
