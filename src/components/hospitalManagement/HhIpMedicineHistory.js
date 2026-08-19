import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiSearch } from 'react-icons/fi';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';

const dateOf = (value) => {
  if (!value) return '—';
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return raw;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HhIpMedicineHistory = () => {
  const { lookupInpatient } = useHospitalManagement();
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const onSearch = async (event) => {
    event.preventDefault();
    if (!q.trim()) return toast.error('Enter inpatient number');
    setBusy(true);
    const response = await lookupInpatient(q.trim());
    setBusy(false);
    if (response.success) setResult(response.data);
    else {
      setResult(null);
      toast.error(response.error || 'Inpatient not found');
    }
  };

  const medicines = result?.medicine_history || result?.medicines || [];

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Patient medicine history</h2>
        <p className="text-xs text-gray-500">Search by inpatient number (IP) to see medicines given to the patient</p>
      </div>
      <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm"
            placeholder="IP-20260818-0001"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </div>
        <button type="submit" disabled={busy} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-cyan-800 disabled:opacity-60">
          {busy ? 'Searching…' : 'Look up'}
        </button>
      </form>

      {result && (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 text-sm">
            <p className="font-semibold text-gray-900">
              {result.ip_number || result.ipNumber || '—'}
              <span className="ml-2 text-xs font-medium text-gray-600">{result.status}</span>
            </p>
            <p className="text-xs text-gray-600">
              {result.patient_name || result.patientName || 'Patient'}
              {result.patient_phone ? ` · ${result.patient_phone}` : ''}
              {result.ward_name ? ` · ${result.ward_name}` : ''}
              {result.bed_number ? ` / Bed ${result.bed_number}` : ''}
            </p>
          </div>
          {!medicines.length ? (
            <p className="px-3 py-6 text-center text-sm text-gray-500">No medicine history for this inpatient.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Medicine</th>
                    <th className="px-3 py-2">Dosage</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {medicines.map((item, index) => (
                    <tr key={`${item.medicine_name}-${item.date}-${index}`}>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">{dateOf(item.date)}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{item.medicine_name || '—'}</td>
                      <td className="px-3 py-2 text-gray-700">{item.dosage || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                        {item.qty != null ? item.qty : '—'}
                        {item.dispensed_qty != null ? ` / given ${item.dispensed_qty}` : ''}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {String(item.source || '').replace(/_/g, ' ')}
                        {item.order_status ? ` · ${item.order_status}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default HhIpMedicineHistory;
