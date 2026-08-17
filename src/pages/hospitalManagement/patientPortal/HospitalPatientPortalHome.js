import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { HospitalManagementProvider, useHospitalManagement } from '../../../context/hospitalManagement/HospitalManagementContext';
import { getPatientPortalSession, clearPatientPortalSession } from './HospitalPatientPortalLogin';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const PortalHome = () => {
  const { patientPortalSummary, fetchPatientPortalSummary } = useHospitalManagement();
  const history = useHistory();
  const [session] = useState(() => getPatientPortalSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.patientId) {
      history.replace('/hospital-management/patient');
      return;
    }
    (async () => {
      setLoading(true);
      await fetchPatientPortalSummary(session.patientId, session.parentMembershipId);
      setLoading(false);
    })();
  }, [session, fetchPatientPortalSummary, history]);

  const onLogout = () => {
    clearPatientPortalSession();
    history.push('/hospital-management/patient');
  };

  if (!session?.patientId) return null;

  const summary = patientPortalSummary || {};
  const appointments = summary.appointments || summary.upcoming_appointments || summary.upcomingAppointments || [];
  const allBills = summary.bills || summary.pending_bills || summary.pendingBills || [];
  const bills = allBills.filter((b) => {
    const status = String(b.status || '').toUpperCase();
    const due = Number(b.amount_due ?? b.amountDue ?? 0);
    const paid = Number(b.amount_paid ?? b.amountPaid ?? 0);
    const balance = Number(b.balance_amount ?? Math.max(0, due - paid));
    return balance > 0 || status === 'DUE' || status === 'PARTIAL';
  }).map((b) => {
    const due = Number(b.amount_due ?? b.amountDue ?? 0);
    const paid = Number(b.amount_paid ?? b.amountPaid ?? 0);
    return { ...b, balance_amount: Number(b.balance_amount ?? Math.max(0, due - paid)) };
  });
  const prescriptions = summary.prescriptions || summary.recent_prescriptions || summary.recentPrescriptions || [];
  const labOrders = summary.labOrders || summary.lab_orders || [];
  const consultations = summary.consultations || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-cyan-700 text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-cyan-100">Patient portal</p>
            <h1 className="text-lg font-bold">{session.patientName || 'Patient'}</h1>
          </div>
          <button type="button" onClick={onLogout} className="text-xs bg-white/15 hover:bg-white/25 rounded-lg px-3 py-1.5">Logout</button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <p className="text-center text-gray-500 text-sm py-8">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <p className="text-[11px] uppercase text-gray-500 font-semibold">Appointments</p>
                <p className="text-xl font-bold text-cyan-800">{appointments.length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                <p className="text-[11px] uppercase text-gray-500 font-semibold">Pending bills</p>
                <p className="text-xl font-bold text-cyan-800">{bills.length}</p>
              </div>
            </div>

            <Section title="Upcoming appointments" empty="No upcoming appointments">
              {appointments.map((a, i) => (
                <li key={a.id || i} className="text-sm border-b border-gray-100 py-2 last:border-0">
                  <p className="font-medium">{a.appointment_date || a.appointmentDate} {a.appointment_time || a.appointmentTime || ''}</p>
                  <p className="text-xs text-gray-500">{a.doctor_name || a.doctorName || 'Doctor'} — {a.status || 'SCHEDULED'}</p>
                </li>
              ))}
            </Section>

            <Section title="Pending bills" empty="No pending bills">
              {bills.map((b, i) => (
                <li key={b.id || i} className="text-sm border-b border-gray-100 py-2 last:border-0 flex justify-between">
                  <span>{b.description || b.reference_type || 'Bill'}</span>
                  <span className="font-medium tabular-nums">{rs(b.balance_amount ?? b.balanceAmount ?? b.amount)}</span>
                </li>
              ))}
            </Section>

            <Section title="Lab results" empty="No lab orders">
              {labOrders.map((o, i) => (
                <li key={o.id || i} className="text-sm border-b border-gray-100 py-2 last:border-0">
                  <p className="font-medium">{String(o.order_date || o.orderDate || '').slice(0, 10)} — {o.status || 'ORDERED'}</p>
                  <p className="text-xs text-gray-500">
                    {(o.items || []).map((it) => it.test_name || it.testName || 'Test').join(', ') || 'No tests'}
                  </p>
                </li>
              ))}
            </Section>

            <Section title="Recent consultations" empty="No consultations">
              {consultations.map((c, i) => (
                <li key={c.id || i} className="text-sm border-b border-gray-100 py-2 last:border-0">
                  <p className="font-medium">{String(c.visit_date || c.visitDate || '').slice(0, 10)}</p>
                  <p className="text-xs text-gray-500">{c.diagnosis || c.chief_complaint || c.chiefComplaint || '—'}</p>
                </li>
              ))}
            </Section>

            <Section title="Recent prescriptions" empty="No recent prescriptions">
              {prescriptions.map((rx, i) => (
                <li key={rx.id || i} className="text-sm border-b border-gray-100 py-2 last:border-0">
                  <p className="font-medium">{rx.medicine_name || rx.medicineName}</p>
                  <p className="text-xs text-gray-500">{[rx.dosage, rx.frequency].filter(Boolean).join(' · ')}</p>
                </li>
              ))}
            </Section>
          </>
        )}
      </main>
    </div>
  );
};

const Section = ({ title, empty, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
    </div>
    <ul className="px-4 py-2 list-none m-0">
      {React.Children.count(children) === 0 ? (
        <li className="text-sm text-gray-500 py-4 text-center">{empty}</li>
      ) : children}
    </ul>
  </div>
);

const HospitalPatientPortalHome = () => (
  <HospitalManagementProvider>
    <PortalHome />
  </HospitalManagementProvider>
);

export default HospitalPatientPortalHome;
