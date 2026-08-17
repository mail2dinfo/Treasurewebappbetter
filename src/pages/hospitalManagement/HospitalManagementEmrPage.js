import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const toDate = (d) => d.toISOString().slice(0, 10);

const HospitalManagementEmrPage = () => {
  const {
    consultations,
    selectedConsultation,
    consultationVitals,
    consultationPrescriptions,
    patients,
    doctors,
    fetchConsultations,
    createConsultation,
    fetchConsultation,
    updateConsultation,
    fetchConsultationVitals,
    createConsultationVital,
    fetchConsultationPrescriptions,
    createConsultationPrescription,
    fetchPatients,
    fetchDoctors,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_emr_manage');

  const [newForm, setNewForm] = useState({ patientId: '', doctorId: '', consultationDate: toDate(new Date()), chiefComplaint: '' });
  const [selectedId, setSelectedId] = useState('');
  const [vitalForm, setVitalForm] = useState({ bp: '', pulse: '', temperature: '', weight: '', spo2: '' });
  const [rxForm, setRxForm] = useState({ medicineName: '', dosage: '', frequency: '', duration: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchConsultations();
  }, [fetchPatients, fetchDoctors, fetchConsultations]);

  useEffect(() => {
    if (!selectedId) return;
    fetchConsultation(selectedId);
    fetchConsultationVitals(selectedId);
    fetchConsultationPrescriptions(selectedId);
  }, [selectedId, fetchConsultation, fetchConsultationVitals, fetchConsultationPrescriptions]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!newForm.patientId || !newForm.doctorId) return toast.error('Select patient and doctor');
    setSaving(true);
    const result = await createConsultation({
      patientId: newForm.patientId,
      doctorId: newForm.doctorId,
      consultationDate: newForm.consultationDate,
      chiefComplaint: newForm.chiefComplaint.trim() || null,
      status: 'OPEN',
    });
    setSaving(false);
    if (result.success) {
      toast.success('Consultation created');
      setNewForm({ patientId: '', doctorId: '', consultationDate: toDate(new Date()), chiefComplaint: '' });
      if (result.data?.id) setSelectedId(String(result.data.id));
    } else toast.error(result.error || 'Failed');
  };

  const onAddVital = async (e) => {
    e.preventDefault();
    if (!selectedId) return toast.error('Select a consultation');
    setSaving(true);
    const result = await createConsultationVital(selectedId, {
      bp: vitalForm.bp.trim() || null,
      pulse: vitalForm.pulse ? Number(vitalForm.pulse) : null,
      temperature: vitalForm.temperature ? Number(vitalForm.temperature) : null,
      weight: vitalForm.weight ? Number(vitalForm.weight) : null,
      spo2: vitalForm.spo2 ? Number(vitalForm.spo2) : null,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Vitals recorded');
      setVitalForm({ bp: '', pulse: '', temperature: '', weight: '', spo2: '' });
    } else toast.error(result.error || 'Failed');
  };

  const onAddRx = async (e) => {
    e.preventDefault();
    if (!selectedId) return toast.error('Select a consultation');
    if (!rxForm.medicineName.trim()) return toast.error('Medicine name required');
    setSaving(true);
    const result = await createConsultationPrescription(selectedId, {
      medicineName: rxForm.medicineName.trim(),
      dosage: rxForm.dosage.trim() || null,
      frequency: rxForm.frequency.trim() || null,
      duration: rxForm.duration.trim() || null,
      notes: rxForm.notes.trim() || null,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Prescription added');
      setRxForm({ medicineName: '', dosage: '', frequency: '', duration: '', notes: '' });
    } else toast.error(result.error || 'Failed');
  };

  const onCloseConsultation = async () => {
    if (!selectedId) return;
    setSaving(true);
    const result = await updateConsultation(selectedId, { status: 'CLOSED' });
    setSaving(false);
    if (result.success) toast.success('Consultation closed');
    else toast.error(result.error || 'Failed');
  };

  const patientName = (id) => {
    const p = (patients || []).find((x) => String(x.id) === String(id));
    return p?.name || p?.full_name || `#${id}`;
  };
  const doctorName = (id) => {
    const d = (doctors || []).find((x) => String(x.id) === String(id));
    return d?.name || d?.full_name || `#${id}`;
  };

  const status = selectedConsultation?.status || 'OPEN';
  const isClosed = status === 'CLOSED';

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">EMR — Consultations</h1>
        <p className="text-sm text-gray-500">Electronic medical records, vitals & prescriptions</p>
      </div>

      {canManage && (
        <form onSubmit={onCreate} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">New consultation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={newForm.patientId} onChange={(e) => setNewForm((f) => ({ ...f, patientId: e.target.value }))} required>
              <option value="">Select patient *</option>
              {(patients || []).map((p) => <option key={p.id} value={p.id}>{p.name || p.full_name}</option>)}
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={newForm.doctorId} onChange={(e) => setNewForm((f) => ({ ...f, doctorId: e.target.value }))} required>
              <option value="">Select doctor *</option>
              {(doctors || []).map((d) => <option key={d.id} value={d.id}>{d.name || d.full_name}</option>)}
            </select>
            <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={newForm.consultationDate} onChange={(e) => setNewForm((f) => ({ ...f, consultationDate: e.target.value }))} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Chief complaint" value={newForm.chiefComplaint} onChange={(e) => setNewForm((f) => ({ ...f, chiefComplaint: e.target.value }))} />
          </div>
          <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-50">Create consultation</button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Consultations</h2>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-64" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            <option value="">Select to view details</option>
            {(consultations || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.consultation_date || c.consultationDate || '—'} — {patientName(c.patient_id ?? c.patientId)} ({c.status || 'OPEN'})
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Patient</th>
                <th className="px-4 py-2">Doctor</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(consultations || []).length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No consultations yet</td></tr>
              ) : (consultations || []).map((c) => (
                <tr key={c.id} className={String(selectedId) === String(c.id) ? 'bg-cyan-50' : ''}>
                  <td className="px-4 py-2">{c.consultation_date || c.consultationDate || '—'}</td>
                  <td className="px-4 py-2">{patientName(c.patient_id ?? c.patientId)}</td>
                  <td className="px-4 py-2">{doctorName(c.doctor_id ?? c.doctorId)}</td>
                  <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100">{c.status || 'OPEN'}</span></td>
                  <td className="px-4 py-2">
                    <button type="button" onClick={() => setSelectedId(String(c.id))} className="text-cyan-700 hover:underline text-xs font-medium">Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && selectedConsultation && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Consultation #{selectedId}</p>
              <p className="text-xs text-gray-500">{selectedConsultation.chief_complaint || selectedConsultation.chiefComplaint || 'No chief complaint'}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isClosed ? 'bg-gray-200 text-gray-700' : 'bg-cyan-100 text-cyan-800'}`}>{status}</span>
              {canManage && !isClosed && (
                <button type="button" onClick={onCloseConsultation} disabled={saving} className="bg-cyan-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-cyan-800">Close consultation</button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Vitals history</h3>
              {(consultationVitals || []).length === 0 ? (
                <p className="text-sm text-gray-500">No vitals recorded</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(consultationVitals || []).map((v, i) => (
                    <li key={v.id || i} className="border border-gray-100 rounded-lg px-3 py-2">
                      BP: {v.bp || '—'} | Pulse: {v.pulse ?? '—'} | Temp: {v.temperature ?? '—'}° | Wt: {v.weight ?? '—'} | SpO2: {v.spo2 ?? '—'}
                    </li>
                  ))}
                </ul>
              )}
              {canManage && !isClosed && (
                <form onSubmit={onAddVital} className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-600">Add vitals</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="BP" value={vitalForm.bp} onChange={(e) => setVitalForm((f) => ({ ...f, bp: e.target.value }))} />
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Pulse" value={vitalForm.pulse} onChange={(e) => setVitalForm((f) => ({ ...f, pulse: e.target.value }))} />
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Temp °C" value={vitalForm.temperature} onChange={(e) => setVitalForm((f) => ({ ...f, temperature: e.target.value }))} />
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Weight kg" value={vitalForm.weight} onChange={(e) => setVitalForm((f) => ({ ...f, weight: e.target.value }))} />
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="SpO2 %" value={vitalForm.spo2} onChange={(e) => setVitalForm((f) => ({ ...f, spo2: e.target.value }))} />
                  </div>
                  <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium">Save vitals</button>
                </form>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Prescriptions</h3>
              {(consultationPrescriptions || []).length === 0 ? (
                <p className="text-sm text-gray-500">No prescriptions</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(consultationPrescriptions || []).map((rx) => (
                    <li key={rx.id} className="border border-gray-100 rounded-lg px-3 py-2">
                      <p className="font-medium">{rx.medicine_name || rx.medicineName}</p>
                      <p className="text-xs text-gray-500">{[rx.dosage, rx.frequency, rx.duration].filter(Boolean).join(' · ')}</p>
                    </li>
                  ))}
                </ul>
              )}
              {canManage && !isClosed && (
                <form onSubmit={onAddRx} className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-600">Add prescription</p>
                  <input className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Medicine *" value={rxForm.medicineName} onChange={(e) => setRxForm((f) => ({ ...f, medicineName: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-2">
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Dosage" value={rxForm.dosage} onChange={(e) => setRxForm((f) => ({ ...f, dosage: e.target.value }))} />
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Frequency" value={rxForm.frequency} onChange={(e) => setRxForm((f) => ({ ...f, frequency: e.target.value }))} />
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Duration" value={rxForm.duration} onChange={(e) => setRxForm((f) => ({ ...f, duration: e.target.value }))} />
                    <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Notes" value={rxForm.notes} onChange={(e) => setRxForm((f) => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium">Add prescription</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagementEmrPage;
