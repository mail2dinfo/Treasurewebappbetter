import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';
import HhSearchableSelect from '../../components/hospitalManagement/HhSearchableSelect';
import HhDoctorSlotBoard from '../../components/hospitalManagement/HhDoctorSlotBoard';

const toDate = (d) => d.toISOString().slice(0, 10);
const STATUSES = ['SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
const valueOf = (...values) => {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
};
const patientLabel = (patient) => {
  const parts = [patient.name || 'Patient'];
  if (patient.phone) parts.push(patient.phone);
  if (patient.ip_number || patient.ipNumber) parts.push(`IP ${patient.ip_number || patient.ipNumber}`);
  return parts.join(' · ');
};
const patientSearchText = (patient) => [
  patient.name,
  patient.phone,
  patient.ip_number,
  patient.ipNumber,
  patient.address,
].filter(Boolean).join(' ');
const doctorLabel = (doctor) => {
  const spec = doctor.specialization || doctor.specialty;
  return spec ? `Dr. ${doctor.name} · ${spec}` : `Dr. ${doctor.name}`;
};
const statusClass = (status) => {
  const value = String(status || '').toUpperCase();
  if (['COMPLETED', 'CHECKED_IN'].includes(value)) return 'bg-green-100 text-green-800';
  if (['CANCELLED', 'NO_SHOW'].includes(value)) return 'bg-red-100 text-red-800';
  return 'bg-cyan-50 text-cyan-800';
};

const HospitalManagementAppointmentsPage = () => {
  const {
    appointments,
    patients,
    doctors,
    fetchAppointments,
    fetchPatients,
    fetchDoctors,
    fetchDoctorSlots,
    fetchCurrentDoctor,
    createAppointment,
    updateAppointmentStatus,
  } = useHospitalManagement();
  const { can, roleCode } = useHhPermission();
  const canManage = can('hh_appointment_manage');
  const isDoctorLogin = String(roleCode || '').toUpperCase() === 'DOCTOR';
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: toDate(new Date()),
    appointmentTime: '',
    notes: '',
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [slotBoard, setSlotBoard] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, [fetchPatients, fetchDoctors]);

  useEffect(() => {
    if (!isDoctorLogin) return;
    let active = true;
    fetchCurrentDoctor().then((result) => {
      if (!active || !result.success || !result.data?.id) return;
      setForm((current) => current.doctorId ? current : { ...current, doctorId: result.data.id });
    });
    return () => { active = false; };
  }, [isDoctorLogin, fetchCurrentDoctor]);

  useEffect(() => {
    fetchAppointments(statusFilter ? { status: statusFilter } : {});
  }, [fetchAppointments, statusFilter]);

  useEffect(() => {
    let active = true;
    const loadSlots = async () => {
      if (!form.doctorId || !form.appointmentDate) {
        setSlotBoard(null);
        return;
      }
      setLoadingSlots(true);
      const result = await fetchDoctorSlots(form.doctorId, form.appointmentDate);
      if (!active) return;
      setLoadingSlots(false);
      if (result.success) setSlotBoard(result.data || null);
      else {
        setSlotBoard(null);
        toast.error(result.error || 'Could not load doctor schedule');
      }
    };
    loadSlots();
    return () => { active = false; };
  }, [form.doctorId, form.appointmentDate, fetchDoctorSlots, appointments]);

  const selectedPatient = useMemo(
    () => (patients || []).find((patient) => String(patient.id) === String(form.patientId)),
    [patients, form.patientId]
  );
  const selectedDoctor = useMemo(
    () => (doctors || []).find((doctor) => String(doctor.id) === String(form.doctorId)),
    [doctors, form.doctorId]
  );

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.patientId) return toast.error('Search and select a patient');
    if (!form.doctorId) return toast.error('Select a doctor');
    if (!form.appointmentTime) return toast.error('Choose a free slot from the doctor schedule');
    setSaving(true);
    const result = await createAppointment({
      patientId: form.patientId,
      doctorId: form.doctorId,
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      notes: form.notes.trim() || null,
      status: 'NEW',
    });
    setSaving(false);
    if (result.success) {
      toast.success('Appointment booked');
      setForm({
        patientId: '',
        doctorId: form.doctorId,
        appointmentDate: form.appointmentDate,
        appointmentTime: '',
        notes: '',
      });
      fetchAppointments(statusFilter ? { status: statusFilter } : {});
    } else toast.error(result.error || 'Failed');
  };

  const onStatusChange = async (appointment, status) => {
    const result = await updateAppointmentStatus(appointment.id, status);
    if (result.success) {
      toast.success('Status updated');
      fetchAppointments(statusFilter ? { status: statusFilter } : {});
    } else toast.error(result.error || 'Failed');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500">Search a registered patient and book a free doctor slot</p>
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white w-full sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {canManage && (
        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">New OPD appointment</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <HhSearchableSelect
              label="Patient *"
              placeholder="Search by name, phone or IP number"
              value={form.patientId}
              options={patients || []}
              getOptionLabel={patientLabel}
              getOptionSearch={patientSearchText}
              onChange={(value) => setForm((current) => ({ ...current, patientId: value }))}
              emptyText="No matching patient. Register the patient first."
            />
            {!isDoctorLogin && (
            <HhSearchableSelect
              label="Doctor *"
              placeholder="Search doctor"
              value={form.doctorId}
              options={doctors || []}
              getOptionLabel={doctorLabel}
              getOptionSearch={(doctor) => `${doctor.name || ''} ${doctor.specialization || doctor.specialty || ''}`}
              onChange={(value) => setForm((current) => ({ ...current, doctorId: value, appointmentTime: '' }))}
              emptyText="No matching doctor"
            />
            )}
          </div>
          {selectedPatient && (
            <p className="text-xs text-gray-600">
              Selected: <strong>{selectedPatient.name}</strong>
              {selectedPatient.phone ? ` · ${selectedPatient.phone}` : ''}
              {valueOf(selectedPatient.ip_number, selectedPatient.ipNumber) ? ` · IP ${valueOf(selectedPatient.ip_number, selectedPatient.ipNumber)}` : ' · OPD / no IP number'}
            </p>
          )}
          <label className="block text-sm max-w-xs">
            <span className="text-gray-600">Appointment date *</span>
            <input
              type="date"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.appointmentDate}
              onChange={(event) => setForm((current) => ({ ...current, appointmentDate: event.target.value, appointmentTime: '' }))}
            />
          </label>

          <HhDoctorSlotBoard
            doctorName={selectedDoctor?.name}
            slotBoard={slotBoard}
            loading={loadingSlots}
            selectedTime={form.appointmentTime}
            selectable
            onSelect={(slot) => {
              if (String(slot.status).toUpperCase() === 'BOOKED') return;
              setForm((current) => ({ ...current, appointmentTime: slot.time }));
            }}
            emptyPrompt={form.doctorId ? 'Choose a day to see appointment slots.' : 'Choose a doctor to see free and booked slots.'}
          />

          <label className="block text-sm">
            <span className="text-gray-600">Notes / chief complaint</span>
            <input
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Optional"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
          <button
            type="submit"
            disabled={saving || !form.appointmentTime}
            className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60"
          >
            {saving ? 'Booking…' : form.appointmentTime ? `Book ${form.appointmentTime} slot` : 'Select a free slot to book'}
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Date / slot</th>
              <th className="px-4 py-2">Patient</th>
              <th className="px-4 py-2">Doctor</th>
              <th className="px-4 py-2">Status</th>
              {canManage && <th className="px-4 py-2">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(appointments || []).map((appointment) => (
              <tr key={appointment.id}>
                <td className="px-4 py-2 whitespace-nowrap">
                  {String(appointment.appointment_date || appointment.appointmentDate || '').slice(0, 10)} {appointment.appointment_time || appointment.appointmentTime || ''}
                </td>
                <td className="px-4 py-2">
                  <p className="font-medium">{appointment.patient_name || appointment.patientName || '—'}</p>
                  <p className="text-xs text-gray-500">
                    {appointment.patient_phone || '—'}
                    {appointment.ip_number ? ` · IP ${appointment.ip_number}` : ''}
                  </p>
                </td>
                <td className="px-4 py-2">
                  {appointment.doctor_name || appointment.doctorName || '—'}
                  {appointment.doctor_specialization ? ` · ${appointment.doctor_specialization}` : ''}
                </td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass(appointment.status)}`}>
                    {String(appointment.status || '').replace(/_/g, ' ')}
                  </span>
                </td>
                {canManage && (
                  <td className="px-4 py-2">
                    <select
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white"
                      value={String(appointment.status || '').toUpperCase() === 'NEW' ? 'SCHEDULED' : appointment.status}
                      onChange={(event) => onStatusChange(appointment, event.target.value)}
                    >
                      {STATUSES.map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!(appointments || []).length && <p className="text-center text-gray-500 py-8 text-sm">No appointments.</p>}
      </div>
    </div>
  );
};

export default HospitalManagementAppointmentsPage;
