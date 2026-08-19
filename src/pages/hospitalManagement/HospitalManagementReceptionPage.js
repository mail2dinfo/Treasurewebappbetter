import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useUserContext } from '../../context/user_context';
import { useHhClinicalStream } from '../../components/hospitalManagement/useHhClinicalStream';
import HhAdmitRoomPicker from '../../components/hospitalManagement/HhAdmitRoomPicker';

const QUEUE_STATUSES = ['WAITING', 'WITH_DOCTOR', 'CHECKED', 'PRESCRIBED', 'ADMITTED'];
const STATUS_STYLE = {
  WAITING: 'bg-amber-100 text-amber-800',
  WITH_DOCTOR: 'bg-cyan-100 text-cyan-800',
  CHECKED: 'bg-teal-100 text-teal-800',
  PRESCRIBED: 'bg-indigo-100 text-indigo-800',
  ADMITTED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
  COMPLETED: 'bg-green-100 text-green-800',
};

const emptyNewPatient = { name: '', phone: '', gender: '', age: '' };
const valueOf = (...values) => {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
};
const genderLabel = (value) => {
  const raw = String(value || '').toUpperCase();
  if (raw === 'M' || raw === 'MALE') return 'Male';
  if (raw === 'F' || raw === 'FEMALE') return 'Female';
  if (raw === 'O' || raw === 'OTHER') return 'Other';
  return valueOf(value);
};

const HospitalManagementReceptionPage = () => {
  const {
    opdVisits,
    patients,
    doctors,
    beds,
    membershipId,
    fetchOpdVisits,
    fetchPatients,
    fetchDoctors,
    fetchBeds,
    createOpdVisit,
    updateOpdVisitStatus,
    admitFromOpdVisit,
  } = useHospitalManagement();
  const { user } = useUserContext();
  const authToken = user?.results?.token || localStorage.getItem('token') || '';

  const [mode, setMode] = useState('existing');
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    chiefComplaint: '',
    ...emptyNewPatient,
  });
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [admitVisit, setAdmitVisit] = useState(null);
  const [admitBedId, setAdmitBedId] = useState('');
  const [patientWish, setPatientWish] = useState('');

  const reload = useCallback(() => {
    if (!membershipId) return;
    fetchOpdVisits();
  }, [membershipId, fetchOpdVisits]);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
    fetchBeds({ status: 'VACANT' });
    reload();
  }, [fetchPatients, fetchDoctors, fetchBeds, reload]);

  useHhClinicalStream({
    enabled: Boolean(authToken && membershipId),
    streamPath: '/hh/opd/visits/stream',
    parentMembershipId: membershipId,
    token: authToken,
    onEvent: reload,
  });

  const patientById = useMemo(() => {
    const map = {};
    (patients || []).forEach((patient) => {
      if (patient?.id) map[patient.id] = patient;
    });
    return map;
  }, [patients]);

  const queue = useMemo(() => (
    (opdVisits || [])
      .filter((visit) => {
        const status = String(visit.status || '').toUpperCase();
        return QUEUE_STATUSES.includes(status) || status === 'COMPLETED';
      })
      .map((visit) => {
        const patient = patientById[visit.patient_id || visit.patientId] || {};
        return {
          ...visit,
          patient_name: valueOf(visit.patient_name, visit.patientName, patient.name) || 'Patient',
          patient_phone: valueOf(visit.patient_phone, visit.patientPhone, patient.phone),
          patient_age: visit.patient_age ?? visit.patientAge ?? patient.age ?? '',
          patient_gender: valueOf(visit.patient_gender, visit.patientGender, patient.gender),
          doctor_name: valueOf(visit.doctor_name, visit.doctorName),
        };
      })
      .sort((a, b) => new Date(a.created_at || a.createdAt || 0) - new Date(b.created_at || b.createdAt || 0))
  ), [opdVisits, patientById]);

  const onRegister = async (e) => {
    e.preventDefault();
    if (mode === 'existing' && !form.patientId) return toast.error('Select a patient');
    if (mode === 'new' && !form.name.trim()) return toast.error('Patient name required');
    if (mode === 'new' && String(form.phone || '').replace(/\D/g, '').length !== 10) {
      return toast.error('10-digit phone is required so the patient can log in to the portal');
    }

    setSaving(true);
    const payload = {
      doctorId: form.doctorId || null,
      chiefComplaint: form.chiefComplaint.trim() || null,
    };
    if (mode === 'existing') {
      payload.patientId = form.patientId;
    } else {
      payload.name = form.name.trim();
      payload.phone = form.phone.trim() || null;
      payload.gender = form.gender || null;
      payload.age = form.age ? Number(form.age) : null;
    }

    const result = await createOpdVisit(payload);
    setSaving(false);
    if (result.success) {
      toast.success('OPD visit registered');
      setForm({ patientId: '', doctorId: '', chiefComplaint: '', ...emptyNewPatient });
      reload();
      fetchPatients();
    } else toast.error(result.error || 'Registration failed');
  };

  const onStatus = async (visit, status) => {
    setBusyId(visit.id);
    const result = await updateOpdVisitStatus(visit.id, status);
    setBusyId(null);
    if (result.success) {
      toast.success('Status updated');
      reload();
    } else toast.error(result.error || 'Failed');
  };

  const onAdmit = async () => {
    if (!admitVisit || !admitBedId) return toast.error('Select a room');
    setBusyId(admitVisit.id);
    const result = await admitFromOpdVisit(admitVisit.id, {
      bedId: admitBedId,
      patientWish: patientWish.trim() || null,
    });
    setBusyId(null);
    if (result.success) {
      const ip =
        result.data?.admission?.ip_number ||
        result.data?.admission?.ipNumber ||
        result.data?.ip_number;
      toast.success(ip ? `Admitted — IP ${ip}` : 'Patient admitted — IPD account opened');
      setAdmitVisit(null);
      setAdmitBedId('');
      setPatientWish('');
      reload();
      fetchBeds({ status: 'VACANT' });
    } else toast.error(result.error || 'Admission failed');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Reception desk</h1>
        <p className="text-sm text-gray-500">Register OPD visits, manage the live queue, and admit patients</p>
      </div>

      <form onSubmit={onRegister} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex gap-2">
          <button type="button" onClick={() => setMode('existing')} className={`text-xs px-3 py-1.5 rounded-lg ${mode === 'existing' ? 'bg-cyan-700 text-white' : 'bg-gray-100 text-gray-700'}`}>Existing patient</button>
          <button type="button" onClick={() => setMode('new')} className={`text-xs px-3 py-1.5 rounded-lg ${mode === 'new' ? 'bg-cyan-700 text-white' : 'bg-gray-100 text-gray-700'}`}>New patient</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mode === 'existing' ? (
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}>
              <option value="">Patient *</option>
              {(patients || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.phone ? ` · ${p.phone}` : ''}{p.age != null && p.age !== '' ? ` · ${p.age} yrs` : ''}
                </option>
              ))}
            </select>
          ) : (
            <>
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Phone *" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                <option value="">Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
              <input type="number" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Age" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
            </>
          )}
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={form.doctorId} onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}>
            <option value="">Preferred doctor</option>
            {(doctors || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Chief complaint" value={form.chiefComplaint} onChange={(e) => setForm((f) => ({ ...f, chiefComplaint: e.target.value }))} />
        </div>
        <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
          {saving ? 'Registering…' : 'Create OPD visit'}
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Live queue</h2>
        </div>
        {!queue.length ? (
          <p className="text-center text-gray-500 py-8 text-sm">No visits yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Token</th>
                  <th className="px-4 py-3 whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Phone</th>
                  <th className="px-4 py-3 whitespace-nowrap">Age</th>
                  <th className="px-4 py-3 whitespace-nowrap">Gender</th>
                  <th className="px-4 py-3 whitespace-nowrap">Doctor</th>
                  <th className="px-4 py-3">Complaint</th>
                  <th className="px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {queue.map((visit) => {
                  const status = String(visit.status || 'WAITING').toUpperCase();
                  return (
                    <tr key={visit.id} className="hover:bg-cyan-50/40">
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">{visit.token_no || visit.tokenNo || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">{visit.patient_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{visit.patient_phone || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{visit.patient_age !== '' && visit.patient_age != null ? visit.patient_age : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{genderLabel(visit.patient_gender) || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{visit.doctor_name ? `Dr. ${visit.doctor_name}` : '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{visit.chief_complaint || visit.chiefComplaint || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {status === 'WAITING' && (
                            <button type="button" disabled={busyId === visit.id} onClick={() => onStatus(visit, 'CHECKED')} className="text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 disabled:opacity-60">
                              Mark checked
                            </button>
                          )}
                          {!['CANCELLED', 'ADMITTED', 'COMPLETED'].includes(status) && (
                            <button type="button" disabled={busyId === visit.id} onClick={() => onStatus(visit, 'CANCELLED')} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60">
                              Cancel
                            </button>
                          )}
                          {!['CANCELLED', 'ADMITTED'].includes(status) && (
                            <button type="button" disabled={busyId === visit.id} onClick={() => { setAdmitVisit(visit); setAdmitBedId(''); setPatientWish(''); fetchBeds({ status: 'VACANT' }); }} className="text-xs px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-800 hover:bg-cyan-100 disabled:opacity-60">
                              Admit to IPD
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {admitVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Admit to IPD</h3>
            <p className="text-xs text-gray-500">{admitVisit.patient_name || admitVisit.patientName || admitVisit.name}</p>
            <HhAdmitRoomPicker
              beds={beds}
              bedId={admitBedId}
              onBedChange={setAdmitBedId}
              patientWish={patientWish}
              onPatientWishChange={setPatientWish}
            />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setAdmitVisit(null)} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300">Cancel</button>
              <button type="button" onClick={onAdmit} disabled={busyId === admitVisit.id} className="px-3 py-1.5 text-sm rounded-lg bg-cyan-700 text-white hover:bg-cyan-800 disabled:opacity-60">
                Confirm admission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagementReceptionPage;
