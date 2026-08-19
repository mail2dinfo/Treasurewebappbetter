import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useUserContext } from '../../context/user_context';
import { useHhClinicalStream } from '../../components/hospitalManagement/useHhClinicalStream';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';
import HhAdmitRoomPicker from '../../components/hospitalManagement/HhAdmitRoomPicker';
import HhDoctorSlotBoard from '../../components/hospitalManagement/HhDoctorSlotBoard';
import HhIpMedicineHistory from '../../components/hospitalManagement/HhIpMedicineHistory';

const STATUS_STYLE = {
  WAITING: 'bg-amber-100 text-amber-800',
  WITH_DOCTOR: 'bg-cyan-100 text-cyan-800',
  CHECKED: 'bg-teal-100 text-teal-800',
};

const emptyLine = () => ({ itemType: 'MEDICINE', medicineId: '', name: '', dosage: '', qty: 1 });
const toDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const HospitalManagementDoctorDeskPage = () => {
  const {
    opdVisits,
    medicines,
    beds,
    doctors,
    appointments,
    membershipId,
    fetchOpdVisits,
    fetchMedicines,
    fetchBeds,
    fetchDoctors,
    fetchDoctorSlots,
    fetchCurrentDoctor,
    fetchAppointments,
    startOpdVisit,
    prescribeOpdVisit,
    admitFromOpdVisit,
  } = useHospitalManagement();
  const { user } = useUserContext();
  const { roleCode } = useHhPermission();
  const authToken = user?.results?.token || localStorage.getItem('token') || '';
  const isDoctorLogin = String(roleCode || '').toUpperCase() === 'DOCTOR';

  const [selectedId, setSelectedId] = useState(null);
  const [lines, setLines] = useState([emptyLine()]);
  const [busyId, setBusyId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [admitBedId, setAdmitBedId] = useState('');
  const [patientWish, setPatientWish] = useState('');
  const [doctorAdvice, setDoctorAdvice] = useState('');
  const [scheduleDate, setScheduleDate] = useState(() => toDate(new Date()));
  const [doctorId, setDoctorId] = useState('');
  const [slotBoard, setSlotBoard] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const reload = useCallback(() => {
    if (!membershipId) return;
    fetchOpdVisits();
  }, [membershipId, fetchOpdVisits]);

  useEffect(() => {
    fetchMedicines();
    fetchBeds({ status: 'VACANT' });
    fetchDoctors();
    reload();
  }, [fetchMedicines, fetchBeds, fetchDoctors, reload]);

  useEffect(() => {
    let active = true;
    fetchCurrentDoctor().then((result) => {
      if (!active || !result.success || !result.data?.id) return;
      setDoctorId((current) => current || result.data.id);
    });
    return () => { active = false; };
  }, [fetchCurrentDoctor]);

  useEffect(() => {
    let active = true;
    const loadSlots = async () => {
      if (!doctorId || !scheduleDate) {
        setSlotBoard(null);
        return;
      }
      setLoadingSlots(true);
      const [slotsResult] = await Promise.all([
        fetchDoctorSlots(doctorId, scheduleDate),
        fetchAppointments({ doctorId, date: scheduleDate }),
      ]);
      if (!active) return;
      setLoadingSlots(false);
      if (slotsResult.success) setSlotBoard(slotsResult.data || null);
    };
    loadSlots();
    return () => { active = false; };
  }, [doctorId, scheduleDate, fetchDoctorSlots, fetchAppointments]);

  useHhClinicalStream({
    enabled: Boolean(authToken && membershipId),
    streamPath: '/hh/opd/visits/stream',
    parentMembershipId: membershipId,
    token: authToken,
    onEvent: reload,
  });

  const queue = useMemo(() => (
    (opdVisits || []).filter((v) => {
      if (!['WAITING', 'WITH_DOCTOR', 'CHECKED'].includes(String(v.status || '').toUpperCase())) return false;
      if (isDoctorLogin && doctorId) {
        const visitDoctor = String(v.doctor_id || v.doctorId || '');
        if (visitDoctor && visitDoctor !== String(doctorId)) return false;
      }
      return true;
    })
  ), [opdVisits, isDoctorLogin, doctorId]);

  const selected = useMemo(() => queue.find((v) => v.id === selectedId) || null, [queue, selectedId]);

  const onStart = async (visit) => {
    setBusyId(visit.id);
    const result = await startOpdVisit(visit.id);
    setBusyId(null);
    if (result.success) {
      toast.success('Visit started');
      setSelectedId(visit.id);
      reload();
    } else toast.error(result.error || 'Failed to start visit');
  };

  const onPrescribe = async (e) => {
    e.preventDefault();
    if (!selected) return;
    const items = lines
      .filter((l) => l.name.trim() || l.medicineId)
      .map((l) => ({
        itemType: l.itemType,
        medicineId: l.medicineId || null,
        medicineName: l.name.trim() || null,
        name: l.name.trim() || null,
        dosage: l.dosage.trim() || null,
        qty: Number(l.qty) || 1,
      }));
    if (!items.length) return toast.error('Add at least one medicine or injection');

    setSaving(true);
    const result = await prescribeOpdVisit(selected.id, { items });
    setSaving(false);
    if (result.success) {
      toast.success('Prescription sent to pharmacy');
      setLines([emptyLine()]);
      setSelectedId(null);
      reload();
    } else {
      const detail = result.data?.errors || result.error;
      toast.error(typeof detail === 'string' ? detail : (result.error || 'Prescription failed'));
    }
  };

  const onAdmit = async () => {
    if (!selected || !admitBedId) return toast.error('Select a room');
    setBusyId(selected.id);
    const result = await admitFromOpdVisit(selected.id, {
      bedId: admitBedId,
      patientWish: patientWish.trim() || null,
      doctorAdvice: doctorAdvice.trim() || 'Critical / surgery / observation',
    });
    setBusyId(null);
    if (result.success) {
      const ip =
        result.data?.admission?.ip_number ||
        result.data?.admission?.ipNumber ||
        result.data?.ip_number;
      toast.success(ip ? `Admitted — IP ${ip}` : 'Patient admitted — room charge added to IPD account');
      setSelectedId(null);
      setAdmitBedId('');
      setPatientWish('');
      setDoctorAdvice('');
      reload();
      fetchBeds({ status: 'VACANT' });
    } else toast.error(result.error || 'Admission failed');
  };

  const updateLine = (idx, patch) => {
    setLines((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const onMedicinePick = (idx, medicineId) => {
    const med = (medicines || []).find((m) => String(m.id) === String(medicineId));
    updateLine(idx, { medicineId, name: med?.name || '' });
  };

  const selectedDoctor = useMemo(
    () => (doctors || []).find((doctor) => String(doctor.id) === String(doctorId)),
    [doctors, doctorId]
  );
  const dayAppointments = useMemo(
    () => (appointments || []).filter((appointment) => {
      const date = String(appointment.appointment_date || appointment.appointmentDate || '').slice(0, 10);
      if (date && date !== scheduleDate) return false;
      if (doctorId && String(appointment.doctor_id || appointment.doctorId) !== String(doctorId)) return false;
      return true;
    }),
    [appointments, scheduleDate, doctorId]
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Doctor desk</h1>
        <p className="text-sm text-gray-500">Choose a day to see your appointment slots, then consult patients from the queue</p>
      </div>

      <HhIpMedicineHistory />

      <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          {(!isDoctorLogin || !doctorId) && (
            <label className="text-sm w-full sm:w-64">
              <span className="text-gray-600">Doctor</span>
              <select
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                value={doctorId}
                onChange={(event) => setDoctorId(event.target.value)}
              >
                <option value="">Select doctor</option>
                {(doctors || []).map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                ))}
              </select>
            </label>
          )}
          <label className="text-sm w-full sm:w-52">
            <span className="text-gray-600">Choose day</span>
            <input
              type="date"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={scheduleDate}
              onChange={(event) => setScheduleDate(event.target.value)}
            />
          </label>
        </div>
        <HhDoctorSlotBoard
          doctorName={selectedDoctor?.name || slotBoard?.doctor_name}
          slotBoard={slotBoard}
          loading={loadingSlots}
          selectable={false}
          emptyPrompt={doctorId ? 'Choose a day to see appointment slots.' : 'Your doctor profile was not found. Ask admin to add you in Doctors with the same name, phone or email.'}
        />
        {!!dayAppointments.length && (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Slot</th>
                  <th className="px-3 py-2">Patient</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dayAppointments.map((appointment) => (
                  <tr key={appointment.id}>
                    <td className="px-3 py-2 whitespace-nowrap">{appointment.appointment_time || appointment.appointmentTime || '—'}</td>
                    <td className="px-3 py-2">
                      {appointment.patient_name || appointment.patientName || '—'}
                      {appointment.patient_phone ? ` · ${appointment.patient_phone}` : ''}
                    </td>
                    <td className="px-3 py-2 text-xs">{String(appointment.status || '').replace(/_/g, ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Patient queue</h2>
          </div>
          {!queue.length ? (
            <p className="text-center text-gray-500 py-8 text-sm">No patients waiting</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
              {queue.map((v) => {
                const status = String(v.status || 'WAITING').toUpperCase();
                const active = selectedId === v.id;
                return (
                  <li key={v.id} className={`px-4 py-3 ${active ? 'bg-cyan-50' : ''}`}>
                    <button type="button" className="w-full text-left" onClick={() => setSelectedId(v.id)}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{v.patient_name || v.patientName || 'Patient'}</p>
                          <p className="text-xs text-gray-500">{v.chief_complaint || v.chiefComplaint || '—'}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
                      </div>
                    </button>
                    {status === 'WAITING' && (
                      <button type="button" disabled={busyId === v.id} onClick={() => onStart(v)} className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-cyan-700 text-white hover:bg-cyan-800 disabled:opacity-60">
                        Start consultation
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
          {!selected ? (
            <p className="text-sm text-gray-500 text-center py-10">Select a patient from the queue</p>
          ) : (
            <>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{selected.patient_name || selected.patientName}</h2>
                <p className="text-xs text-gray-500">{selected.chief_complaint || selected.chiefComplaint || '—'}</p>
              </div>

              <form onSubmit={onPrescribe} className="space-y-3">
                <p className="text-xs font-semibold text-gray-700">Medicines / injections → pharmacy</p>
                {lines.map((line, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2">
                      <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs bg-white" value={line.itemType} onChange={(e) => updateLine(idx, { itemType: e.target.value })}>
                        <option value="MEDICINE">Medicine</option>
                        <option value="INJECTION">Injection</option>
                      </select>
                      <button type="button" onClick={() => setLines((rows) => rows.filter((_, i) => i !== idx))} className="text-xs text-red-600 ml-auto">Remove</button>
                    </div>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={line.medicineId} onChange={(e) => onMedicinePick(idx, e.target.value)}>
                      <option value="">Pick from stock (optional)</option>
                      {(medicines || []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Medicine name" value={line.name} onChange={(e) => updateLine(idx, { name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Dosage" value={line.dosage} onChange={(e) => updateLine(idx, { dosage: e.target.value })} />
                      <input type="number" min="1" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Qty" value={line.qty} onChange={(e) => updateLine(idx, { qty: e.target.value })} />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setLines((rows) => [...rows, emptyLine()])} className="text-xs text-cyan-700 font-medium">+ Add line</button>
                <button type="submit" disabled={saving || String(selected.status || '').toUpperCase() !== 'WITH_DOCTOR'} className="w-full bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
                  {saving ? 'Submitting…' : 'Submit prescription → pharmacy'}
                </button>
              </form>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Critical / admit to ward</p>
                <HhAdmitRoomPicker
                  beds={beds}
                  bedId={admitBedId}
                  onBedChange={setAdmitBedId}
                  patientWish={patientWish}
                  onPatientWishChange={setPatientWish}
                  doctorAdvice={doctorAdvice}
                  onDoctorAdviceChange={setDoctorAdvice}
                  showDoctorAdvice
                />
                <button type="button" onClick={onAdmit} disabled={busyId === selected.id} className="w-full border border-cyan-700 text-cyan-800 rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-50 disabled:opacity-60">
                  Admit — open IPD account
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalManagementDoctorDeskPage;
