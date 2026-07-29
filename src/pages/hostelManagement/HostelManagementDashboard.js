import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import { HM_BASE_PATH } from '../../components/hostelManagement/hostelManagementMenuItems';
import HostelSelector from '../../components/hostelManagement/HostelSelector';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const HostelManagementDashboard = () => {
  const {
    dashboard, fetchDashboard, hostels, fetchHostels,
    selectedHostelId, generateReceivables,
  } = useHostelManagement();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchHostels();
  }, []);

  const createMonthly = async () => {
    if (!selectedHostelId) return toast.error('Select a hostel first');
    setCreating(true);
    try {
      const result = await generateReceivables({
        hostelId: selectedHostelId,
        rentPlan: 'MONTHLY',
      });
      if (result.success) {
        toast.success(result.message || 'Monthly receivables created');
        fetchDashboard();
      } else toast.error(result.error);
    } finally {
      setCreating(false);
    }
  };

  const byHostel = dashboard?.byHostel || [];
  const totals = dashboard?.totals || {
    residents: dashboard?.residents || 0,
    pendingCount: dashboard?.pendingCount || 0,
    pendingTotal: dashboard?.pendingTotal || 0,
    amountDue: dashboard?.amountDue || 0,
    amountPaid: dashboard?.amountPaid || 0,
  };

  const cards = [
    { label: 'Hostels', value: dashboard?.hostels ?? hostels.length, to: `${HM_BASE_PATH}/hostels` },
    { label: 'Active Residents', value: totals.residents ?? 0, to: `${HM_BASE_PATH}/residents` },
    { label: 'Pending Dues', value: totals.pendingCount ?? 0, to: `${HM_BASE_PATH}/dues-deck` },
    {
      label: 'Pending Amount',
      value: rs(totals.pendingTotal),
      to: `${HM_BASE_PATH}/outstanding`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hostel Dashboard</h1>
          <p className="text-sm text-gray-500">Hostel-wise residents and dues overview.</p>
        </div>
        <HostelSelector />
      </div>

      <div className="bg-white border border-red-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div>
          <p className="font-semibold text-gray-900">Monthly receivables</p>
          <p className="text-xs text-gray-500">One click creates this month’s rent dues for all monthly-plan residents.</p>
        </div>
        <button
          type="button"
          onClick={createMonthly}
          disabled={creating || !selectedHostelId}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg"
        >
          {creating ? 'Creating…' : 'Create Monthly Receivables'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-red-300">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{c.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Hostel-wise summary</h2>
          <p className="text-xs text-gray-500">Per hostel residents, billed, paid and outstanding.</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">Hostel</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-right">Residents</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-right">Total billed</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-right">Paid</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-right">Pending dues</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-right">Due amount</th>
            </tr>
          </thead>
          <tbody>
            {byHostel.map((row) => (
              <tr key={row.hostel_id} className="border-t border-gray-100 hover:bg-gray-50/80">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{row.hostel_name}</p>
                  {row.city && <p className="text-xs text-gray-500">{row.city}</p>}
                </td>
                <td className="px-4 py-3 text-right">{row.residents}</td>
                <td className="px-4 py-3 text-right">{rs(row.amountDue)}</td>
                <td className="px-4 py-3 text-right text-green-700">{rs(row.amountPaid)}</td>
                <td className="px-4 py-3 text-right">{row.pendingCount}</td>
                <td className="px-4 py-3 text-right font-semibold text-red-700">{rs(row.pendingTotal)}</td>
              </tr>
            ))}
            {byHostel.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No hostels yet. <Link to={`${HM_BASE_PATH}/hostels`} className="text-red-700 font-semibold underline">Add a hostel</Link>
                </td>
              </tr>
            )}
          </tbody>
          {byHostel.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50">
                <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{totals.residents}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{rs(totals.amountDue)}</td>
                <td className="px-4 py-3 text-right font-bold text-green-800">{rs(totals.amountPaid)}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{totals.pendingCount}</td>
                <td className="px-4 py-3 text-right font-bold text-red-800">{rs(totals.pendingTotal)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default HostelManagementDashboard;
