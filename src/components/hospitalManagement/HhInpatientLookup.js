import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiSearch } from 'react-icons/fi';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhBasePath } from './hospitalManagementMenuItems';
import { Link } from 'react-router-dom';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Search inpatient by IP number / name / phone — usable from any module.
 */
const HhInpatientLookup = ({ compact = false }) => {
  const { lookupInpatient } = useHospitalManagement();
  const basePath = useHhBasePath();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const onSearch = async (e) => {
    e?.preventDefault?.();
    if (!q.trim()) return toast.error('Enter IP number, name or phone');
    setBusy(true);
    const res = await lookupInpatient(q.trim());
    setBusy(false);
    if (res.success) {
      setResult(res.data);
    } else {
      setResult(null);
      toast.error(res.error || 'Inpatient not found');
    }
  };

  const byType = result?.billing_summary?.by_type || result?.charge_summary || {};

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${compact ? 'p-3' : 'p-4'} space-y-3`}>
      <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
            placeholder="Search inpatient — IP-20260817-0001 / name / phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button type="submit" disabled={busy} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
          {busy ? 'Searching…' : 'Lookup status'}
        </button>
      </form>

      {result && (
        <div className="rounded-lg border border-cyan-100 bg-cyan-50/40 p-3 space-y-2 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">
                {result.ip_number || result.ipNumber || '—'}
                <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-gray-200">
                  {result.status}
                </span>
              </p>
              <p className="text-gray-700">{result.patient_name || result.patientName}</p>
              <p className="text-xs text-gray-500">
                {result.ward_name || result.wardName || '—'} · Bed {result.bed_number || result.bedNumber || '—'}
                {result.doctor_name || result.doctorName ? ` · Dr. ${result.doctor_name || result.doctorName}` : ''}
              </p>
              <p className="text-xs text-gray-500">
                Admit {result.admit_date || result.admitDate}
                {(result.discharge_date || result.dischargeDate) ? ` → Discharge ${result.discharge_date || result.dischargeDate}` : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">IPD {result.ipd_status || result.ipdStatus || '—'}</p>
              <p className="font-semibold text-cyan-900">Balance {rs(result.ipd_balance ?? result.billing_summary?.balance)}</p>
              <p className="text-xs text-gray-600">Charges {rs(result.ipd_total_charges ?? result.billing_summary?.total_charges)}</p>
            </div>
          </div>

          {Object.keys(byType).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {Object.entries(byType).map(([type, amt]) => (
                <div key={type} className="bg-white rounded border border-gray-100 px-2 py-1.5">
                  <p className="text-gray-500 uppercase">{type}</p>
                  <p className="font-medium text-gray-900">{rs(amt)}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-600">
            Open kitchen orders: {result.open_kitchen_orders ?? 0}
            {' · '}
            Open pharmacy orders: {result.open_pharmacy_orders ?? 0}
          </p>

          <Link to={`${basePath}/admissions`} className="inline-block text-xs font-medium text-cyan-800 hover:underline">
            Open Admissions →
          </Link>
        </div>
      )}
    </div>
  );
};

export default HhInpatientLookup;
