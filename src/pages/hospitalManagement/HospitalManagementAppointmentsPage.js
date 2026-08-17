import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const toDate = (d) => d.toISOString().slice(0, 10);
const STATUSES = ['SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

const HospitalManagementAppointmentsPage = () => {
  const {
    appointments,
    patients,
    doctors,
    fetchAppointments,
    fetchPatients,
    fetchDoctors,
    createAppointment,
    updateAppointmentStatus,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_appointment_manage');
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: toDate(new Date()),
    appointmentTime: '10:00',
    notes: '',
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, [fetchPatients, fetchDoctors]);

  useEffect(() => {
    fetchAppointments(statusFilter ? { status: statusFilter } : {});
  }, [fetchAppointments, statusFilter]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Select patient');
    if (!form.doctorId) return toast.error('Select doctor');
    setSaving(true);
    const result = await createAppointment({
      patientId: form.patientId,
      doctorId: form.doctorId,
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      notes: form.notes.trim() || null,
      status: 'SCHEDULED',
    });
    setSaving(false);
    if (result.success) {
      toast.success('Appointment created');
      setForm({ patientId: '', doctorId: '', appointmentDate: toDate(new Date()), appointmentTime: '10:00', notes: '' });
      fetchAppointments(statusFilter ? { status: statusFilter } : {});
    } else toast.error(result.error || 'Failed');
  };

  const onStatusChange = async (appt, status) => {
    const result = await updateAppointmentStatus(appt.id, status);
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
          <p className="text-sm text-gray-500">OPD scheduling and status updates</p>
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white w-full sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {canManage && (
        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">New OPD appointment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}>
              <option value="">Patient *</option>
              {(patients || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={form.doctorId} onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}>
              <option value="">Doctor *</option>
              {(doctors || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.appointmentDate} onChange={(e) => setForm((f) => ({ ...f, appointmentDate: e.target.value }))} />
            <input type="time" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.appointmentTime} onChange={(e) => setForm((f) => ({ ...f, appointmentTime: e.target.value }))} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
            {saving ? 'Booking…' : 'Book appointment'}
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Patient</th>
              <th className="px-4 py-2">Doctor</th>
              <th className="px-4 py-2">Status</th>
              {canManage && <th className="px-4 py-2">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(appointments || []).map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2 whitespace-nowrap">{String(a.appointment_date || a.appointmentDate || '').slice(0, 10)} {a.appointment_time || a.appointmentTime || ''}</td>
                <td className="px-4 py-2">{a.patient_name || a.patientName || '—'}</td>
                <td className="px-4 py-2">{a.doctor_name || a.doctorName || '—'}</td>
                <td className="px-4 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800">{a.status}</span></td>
                {canManage && (
                  <td className="px-4 py-2">
                    <select
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white"
                      value={a.status}
                      onChange={(e) => onStatusChange(a, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
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
