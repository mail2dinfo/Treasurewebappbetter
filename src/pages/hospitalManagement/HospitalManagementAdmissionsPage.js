import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const toDate = (d) => d.toISOString().slice(0, 10);

const HospitalManagementAdmissionsPage = () => {
  const {
    admissions,
    patients,
    beds,
    doctors,
    fetchAdmissions,
    fetchPatients,
    fetchBeds,
    fetchDoctors,
    createAdmission,
    dischargeAdmission,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_admission_manage');
  const [form, setForm] = useState({ patientId: '', bedId: '', doctorId: '', admissionDate: toDate(new Date()), diagnosis: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdmissions();
    fetchPatients();
    fetchBeds({ status: 'AVAILABLE' });
    fetchDoctors();
  }, [fetchAdmissions, fetchPatients, fetchBeds, fetchDoctors]);

  const onAdmit = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.bedId) return toast.error('Patient and bed required');
    setSaving(true);
    const result = await createAdmission({
      patientId: form.patientId,
      bedId: form.bedId,
      doctorId: form.doctorId || null,
      admissionDate: form.admissionDate,
      diagnosis: form.diagnosis.trim() || null,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Patient admitted');
      setForm({ patientId: '', bedId: '', doctorId: '', admissionDate: toDate(new Date()), diagnosis: '' });
      fetchAdmissions();
      fetchBeds({ status: 'AVAILABLE' });
    } else toast.error(result.error || 'Failed');
  };

  const onDischarge = async (adm) => {
    if (!window.confirm(`Discharge ${adm.patient_name || adm.patientName}?`)) return;
    const result = await dischargeAdmission(adm.id, { dischargeDate: toDate(new Date()) });
    if (result.success) {
      toast.success('Patient discharged');
      fetchAdmissions();
      fetchBeds({ status: 'AVAILABLE' });
    } else toast.error(result.error || 'Failed');
  };

  const active = (admissions || []).filter((a) => (a.status || 'ACTIVE') === 'ACTIVE');
  const history = (admissions || []).filter((a) => a.status === 'DISCHARGED');

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Admissions</h1>
        <p className="text-sm text-gray-500">Admit patients to beds and discharge when ready</p>
      </div>

      {canManage && (
        <form onSubmit={onAdmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">New admission</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}>
              <option value="">Patient *</option>
              {(patients || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={form.bedId} onChange={(e) => setForm((f) => ({ ...f, bedId: e.target.value }))}>
              <option value="">Available bed *</option>
              {(beds || []).map((b) => (
                <option key={b.id} value={b.id}>
                  {(b.ward_name || b.wardName || 'Ward')} · {b.bed_number || b.bedNumber}
                </option>
              ))}
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={form.doctorId} onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}>
              <option value="">Attending doctor</option>
              {(doctors || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.admissionDate} onChange={(e) => setForm((f) => ({ ...f, admissionDate: e.target.value }))} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Diagnosis / notes" value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} />
          </div>
          <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
            {saving ? 'Admitting…' : 'Admit patient'}
          </button>
        </form>
      )}

      <Section title={`Active (${active.length})`} items={active} canManage={canManage} onDischarge={onDischarge} />
      <Section title={`Discharged (${history.length})`} items={history} canManage={false} />
    </div>
  );
};

const Section = ({ title, items, canManage, onDischarge }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
    </div>
    {!(items || []).length ? (
      <p className="text-center text-gray-500 py-6 text-sm">None</p>
    ) : (
      <ul className="divide-y divide-gray-100">
        {(items || []).map((a) => (
          <li key={a.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{a.patient_name || a.patientName}</p>
              <p className="text-xs text-gray-500">
                Bed: {a.bed_number || a.bedNumber || '—'} · Admitted: {String(a.admission_date || a.admissionDate || '').slice(0, 10)}
              </p>
            </div>
            {canManage && onDischarge && (
              <button type="button" onClick={() => onDischarge(a)} className="text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 self-start">
                Discharge
              </button>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default HospitalManagementAdmissionsPage;
