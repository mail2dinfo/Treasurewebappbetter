import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Redirect, Route, Switch, useHistory, useLocation } from 'react-router-dom';
import {
  FiActivity,
  FiCalendar,
  FiCheck,
  FiClipboard,
  FiCreditCard,
  FiDroplet,
  FiFileText,
  FiHome,
  FiLogOut,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiRefreshCw,
  FiThermometer,
  FiUser,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { HospitalManagementProvider, useHospitalManagement } from '../../../context/hospitalManagement/HospitalManagementContext';
import { useHhClinicalStream } from '../../../components/hospitalManagement/useHhClinicalStream';
import {
  HH_PATIENT_LOGIN_PATH,
  HH_PATIENT_TAB_PATHS,
  getHhPatientTabFromPathname,
} from '../../../components/hospitalManagement/hospitalManagementMenuItems';
import { getPatientPortalSession, clearPatientPortalSession } from './HospitalPatientPortalLogin';

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateLabel = (value) => {
  if (!value) return '—';
  const parsed = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const statusClass = (status) => {
  const value = String(status || '').toUpperCase();
  if (['PAID', 'COMPLETED', 'CLOSED', 'DISCHARGED', 'CHECKED_IN', 'READY'].includes(value)) return 'bg-emerald-100 text-emerald-800';
  if (['DUE', 'CANCELLED', 'STOPPED'].includes(value)) return 'bg-red-100 text-red-800';
  if (['PARTIAL', 'PENDING', 'NEW', 'ORDERED', 'ADMITTED'].includes(value)) return 'bg-amber-100 text-amber-800';
  if (value === 'PICKED_UP') return 'bg-violet-100 text-violet-800';
  if (value === 'PACKING') return 'bg-sky-100 text-sky-800';
  return 'bg-cyan-100 text-cyan-800';
};
const PHARMACY_RANK = {
  PENDING: 0,
  PICKED_UP: 1,
  PACKING: 2,
  READY: 3,
  BILLED: 3,
  PAID: 4,
  CANCELLED: -1,
};
const pharmacyBillAmount = (order) => {
  const billed = Number(order?.bill?.total_amount ?? order?.total_amount ?? order?.totalAmount ?? 0);
  if (billed > 0) return billed;
  const items = Array.isArray(order?.items) ? order.items : [];
  return items.reduce((sum, item) => {
    const line = Number(item.line_amount ?? item.lineAmount ?? 0);
    if (line) return sum + line;
    return sum + (Number(item.unit_price ?? item.unitPrice ?? 0) * Number(item.dispensed_qty ?? item.dispensedQty ?? item.qty ?? 0));
  }, 0);
};
const payAndCollectMessage = (order) => `The bill amount is ${rs(pharmacyBillAmount(order))}. Pay and collect the medicines.`;
const PHARMACY_TOAST = {
  PENDING: 'Your prescription is at pharmacy. Please wait at reception.',
  PICKED_UP: 'Pharmacy picked up your order. Please wait at reception.',
  PACKING: 'Your medicines are being prepared. Please wait at reception.',
  PAID: 'Payment received. You can collect your medicines and leave.',
};
const PHARMACY_LABEL = {
  PENDING: 'Waiting',
  PICKED_UP: 'Picked up',
  PACKING: 'Preparing',
  READY: 'Come to counter',
  BILLED: 'Come to counter',
  PAID: 'Paid',
};
const Status = ({ value }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusClass(value)}`}>
    {PHARMACY_LABEL[String(value || '').toUpperCase()] || String(value || '—').replace(/_/g, ' ')}
  </span>
);
const initialOf = (value) => String(value || 'P').trim().slice(0, 1).toUpperCase() || 'P';

const PortalHome = () => {
  const { patientPortalSummary, fetchPatientPortalSummary, createPatientPortalKitchenOrder } = useHospitalManagement();
  const history = useHistory();
  const location = useLocation();
  const [session] = useState(() => getPatientPortalSession());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [foodQty, setFoodQty] = useState({});
  const [ordering, setOrdering] = useState(false);
  const [live, setLive] = useState(false);
  const [medicineView, setMedicineView] = useState('queue');
  const tab = getHhPatientTabFromPathname(location.pathname);
  const lastPharmacyStatusRef = useRef({});
  const pharmacyReadyRef = useRef(false);
  const prevActiveCountRef = useRef(0);

  const load = useCallback(async (silent = false) => {
    if (!session?.patientId || !session?.token) return;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    const result = await fetchPatientPortalSummary(session.patientId, session.parentMembershipId, session.token);
    if (!result.success && !silent) setError(result.error || 'Could not load your patient portal');
    if (!silent) setLoading(false);
  }, [session, fetchPatientPortalSummary]);

  useEffect(() => {
    if (!session?.patientId || !session?.token) {
      history.replace(HH_PATIENT_LOGIN_PATH);
      return;
    }
    load();
  }, [session, history, load]);

  useEffect(() => {
    const hash = String(location.hash || '').replace('#', '').trim();
    if (hash && HH_PATIENT_TAB_PATHS[hash] && location.pathname === HH_PATIENT_TAB_PATHS.home) {
      history.replace(HH_PATIENT_TAB_PATHS[hash]);
    }
  }, [location.hash, location.pathname, history]);

  const goTab = useCallback((id) => {
    const path = HH_PATIENT_TAB_PATHS[id] || HH_PATIENT_TAB_PATHS.home;
    if (location.pathname !== path) history.push(path);
  }, [history, location.pathname]);

  const onPharmacyEvent = useCallback((evt) => {
    if (evt?.action === 'connected') {
      setLive(true);
      load(true);
      return;
    }
    const eventPatientId = String(evt?.patient_id || evt?.patientId || '');
    if (eventPatientId && eventPatientId !== String(session?.patientId || '')) return;
    load(true);
  }, [session, load]);

  useHhClinicalStream({
    enabled: Boolean(session?.token && session?.parentMembershipId),
    streamPath: '/hh/patient-portal/stream',
    token: session?.token || '',
    parentMembershipId: session?.parentMembershipId,
    patientId: session?.patientId,
    onEvent: onPharmacyEvent,
  });

  useEffect(() => {
    if (!session?.patientId || !session?.token) return undefined;
    const timer = setInterval(() => load(true), live ? 8000 : 3000);
    return () => clearInterval(timer);
  }, [session, load, live]);

  const onLogout = () => {
    clearPatientPortalSession();
    history.push(HH_PATIENT_LOGIN_PATH);
  };

  const summary = patientPortalSummary || {};
  const patient = summary.patient || {};
  const hospital = summary.hospital || {};
  const patientName = patient.name || session.patientName || 'Patient';
  const appointments = summary.appointments || summary.upcoming_appointments || summary.upcomingAppointments || [];
  const allBills = (summary.bills || summary.pending_bills || summary.pendingBills || []).map((bill) => {
    const due = Number(bill.amount_due ?? bill.amountDue ?? 0);
    const paid = Number(bill.amount_paid ?? bill.amountPaid ?? 0);
    return {
      ...bill,
      amount_due_value: due,
      amount_paid_value: paid,
      balance_value: Number(bill.balance_amount ?? bill.balanceAmount ?? Math.max(0, due - paid)),
    };
  });
  const prescriptions = summary.prescriptions || summary.recent_prescriptions || summary.recentPrescriptions || [];
  const pharmacyOrders = summary.pharmacyOrders || summary.pharmacy_orders || [];
  const sortedPharmacyOrders = [...pharmacyOrders].sort((a, b) => {
    const rankA = PHARMACY_RANK[String(a.status || '').toUpperCase()] ?? 99;
    const rankB = PHARMACY_RANK[String(b.status || '').toUpperCase()] ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0);
  });
  const activePharmacyOrders = sortedPharmacyOrders.filter((order) => (
    ['PENDING', 'PICKED_UP', 'PACKING', 'READY'].includes(String(order.status || '').toUpperCase())
    && String(order.source || order.order_type || 'OPD').toUpperCase() !== 'IPD_WARD'
  ));
  const donePharmacyOrders = sortedPharmacyOrders.filter((order) => (
    String(order.status || '').toUpperCase() === 'PAID'
    && String(order.source || order.order_type || 'OPD').toUpperCase() !== 'IPD_WARD'
  ));
  const labOrders = summary.labOrders || summary.lab_orders || [];
  const consultations = summary.consultations || [];
  const admissions = summary.admissions || [];
  const activeAdmission = admissions.find((admission) => String(admission.status).toUpperCase() === 'ADMITTED');
  const stay = summary.stay || null;
  const isInpatient = Boolean(summary.isInpatient || activeAdmission);
  const kitchenProducts = summary.kitchenProducts || summary.kitchen_products || [];
  const kitchenOrders = summary.kitchenOrders || summary.kitchen_orders || [];
  const bloodRequests = summary.bloodRequests || summary.blood_requests || [];

  const billing = useMemo(() => ({
    billed: allBills.reduce((sum, bill) => sum + bill.amount_due_value, 0),
    paid: allBills.reduce((sum, bill) => sum + bill.amount_paid_value, 0),
    pending: allBills.reduce((sum, bill) => sum + bill.balance_value, 0),
  }), [allBills]);

  const menuItems = useMemo(() => {
    const items = [
      { id: 'home', label: 'Home', icon: FiHome, path: HH_PATIENT_TAB_PATHS.home },
      { id: 'medicines', label: 'Medicines', icon: FiClipboard, path: HH_PATIENT_TAB_PATHS.medicines },
      { id: 'bills', label: 'Bills', icon: FiCreditCard, path: HH_PATIENT_TAB_PATHS.bills },
      { id: 'appointments', label: 'Appointments', icon: FiCalendar, path: HH_PATIENT_TAB_PATHS.appointments },
      { id: 'records', label: 'Records', icon: FiFileText, path: HH_PATIENT_TAB_PATHS.records },
      { id: 'labs', label: 'Lab', icon: FiThermometer, path: HH_PATIENT_TAB_PATHS.labs },
      { id: 'blood', label: 'Blood bank', icon: FiDroplet, path: HH_PATIENT_TAB_PATHS.blood },
    ];
    if (isInpatient) {
      items.push({ id: 'stay', label: 'Ward & bed', icon: FiActivity, path: HH_PATIENT_TAB_PATHS.stay });
      items.push({ id: 'food', label: 'Order food', icon: FiPackage, path: HH_PATIENT_TAB_PATHS.food });
    }
    items.push({ id: 'profile', label: 'Profile', icon: FiUser, path: HH_PATIENT_TAB_PATHS.profile });
    return items;
  }, [isInpatient]);

  useEffect(() => {
    if (activePharmacyOrders.length > prevActiveCountRef.current) setMedicineView('queue');
    prevActiveCountRef.current = activePharmacyOrders.length;
  }, [activePharmacyOrders.length]);

  useEffect(() => {
    if (!isInpatient && (tab === 'stay' || tab === 'food')) goTab('home');
  }, [isInpatient, tab, goTab]);

  useEffect(() => {
    if (loading) return;
    const primed = pharmacyReadyRef.current;
    pharmacyOrders.forEach((order) => {
      const status = String(order.status || '').toUpperCase();
      const prev = lastPharmacyStatusRef.current[order.id];
      lastPharmacyStatusRef.current[order.id] = status;
      if (!primed) return;
      if (prev === status) return;
      if (status === 'READY' || status === 'BILLED') {
        toast.success(payAndCollectMessage(order));
        setMedicineView('queue');
        goTab('medicines');
        return;
      }
      if (PHARMACY_TOAST[status]) toast.info(PHARMACY_TOAST[status]);
    });
    pharmacyReadyRef.current = true;
  }, [loading, pharmacyOrders, goTab]);

  const onOrderFood = async () => {
    const items = kitchenProducts
      .map((product) => ({
        productId: product.id,
        qty: Number(foodQty[product.id] || 0),
      }))
      .filter((item) => item.qty > 0);
    if (!items.length) return toast.error('Select at least one food item');
    setOrdering(true);
    const result = await createPatientPortalKitchenOrder({
      token: session.token,
      parentMembershipId: session.parentMembershipId,
      patientId: session.patientId,
      items,
    });
    setOrdering(false);
    if (!result.success) return toast.error(result.error || 'Could not place food order');
    toast.success('Food order sent to kitchen');
    setFoodQty({});
    load();
  };

  const hero = {
    home: {
      kicker: 'Patient portal',
      title: `Hello, ${patientName}`,
      subtitle: isInpatient
        ? `Admitted · IP ${stay?.ip_number || activeAdmission?.ip_number || '—'} · Wait at reception for medicines`
        : 'Bills, appointments, and live pharmacy status while you wait at reception',
      stats: [
        ['Pending', rs(billing.pending), 'text-red-700'],
        ['Appointments', appointments.length, 'text-cyan-700'],
        ['Prescriptions', prescriptions.length, 'text-indigo-700'],
        ['Lab orders', labOrders.length, 'text-amber-700'],
      ],
    },
    medicines: {
      kicker: 'Pharmacy',
      title: 'Medicines',
      subtitle: 'Doctor sent it to pharmacy. Watch this order: waiting, picked up, preparing, then ready to collect.',
      stats: [
        ['Waiting', pharmacyOrders.filter((o) => String(o.status).toUpperCase() === 'PENDING').length, 'text-amber-700'],
        ['Picked up', pharmacyOrders.filter((o) => String(o.status).toUpperCase() === 'PICKED_UP').length, 'text-violet-700'],
        ['Preparing', pharmacyOrders.filter((o) => String(o.status).toUpperCase() === 'PACKING').length, 'text-sky-700'],
        ['Ready', pharmacyOrders.filter((o) => ['READY', 'BILLED'].includes(String(o.status).toUpperCase())).length, 'text-teal-700'],
      ],
    },
    bills: {
      kicker: 'Accounts',
      title: 'Bills and payments',
      subtitle: 'Paid and pending hospital bills. Pay at reception.',
      stats: [
        ['Billed', rs(billing.billed), 'text-gray-900'],
        ['Paid', rs(billing.paid), 'text-emerald-700'],
        ['Pending', rs(billing.pending), 'text-red-700'],
        ['Bills', allBills.length, 'text-indigo-700'],
      ],
    },
    appointments: {
      kicker: 'OPD',
      title: 'Appointments',
      subtitle: 'Upcoming and previous doctor visits',
      stats: [
        ['Total', appointments.length, 'text-cyan-700'],
        ['Upcoming', appointments.filter((a) => ['NEW', 'CONFIRMED', 'SCHEDULED', 'CHECKED_IN'].includes(String(a.status || '').toUpperCase())).length, 'text-indigo-700'],
        ['Completed', appointments.filter((a) => ['COMPLETED', 'CLOSED', 'CHECKED_IN'].includes(String(a.status || '').toUpperCase())).length, 'text-emerald-700'],
        ['Cancelled', appointments.filter((a) => String(a.status || '').toUpperCase() === 'CANCELLED').length, 'text-red-700'],
      ],
    },
    records: {
      kicker: 'EMR',
      title: 'Medical records',
      subtitle: 'Consultations and diagnoses from your doctors',
      stats: [
        ['Consultations', consultations.length, 'text-indigo-700'],
        ['Prescriptions', prescriptions.length, 'text-cyan-700'],
        ['Lab', labOrders.length, 'text-amber-700'],
        ['Admissions', admissions.length, 'text-gray-900'],
      ],
    },
    labs: {
      kicker: 'Diagnostics',
      title: 'Lab orders',
      subtitle: 'Tests ordered during your treatment',
      stats: [
        ['Orders', labOrders.length, 'text-amber-700'],
        ['Pending', labOrders.filter((o) => ['ORDERED', 'PENDING', 'NEW'].includes(String(o.status || '').toUpperCase())).length, 'text-amber-700'],
        ['Completed', labOrders.filter((o) => ['COMPLETED', 'REPORTED', 'CLOSED'].includes(String(o.status || '').toUpperCase())).length, 'text-emerald-700'],
        ['Blood reports', bloodRequests.length, 'text-red-700'],
      ],
    },
    blood: {
      kicker: 'Blood bank',
      title: 'Blood bank reports',
      subtitle: 'Requests and units issued for you',
      stats: [
        ['Requests', bloodRequests.length, 'text-red-700'],
        ['Issued', bloodRequests.reduce((sum, r) => sum + Number(r.units_issued ?? r.unitsIssued ?? 0), 0), 'text-emerald-700'],
        ['Needed', bloodRequests.reduce((sum, r) => sum + Number(r.units_needed ?? r.unitsNeeded ?? 0), 0), 'text-amber-700'],
        ['Group', patient.blood_group || patient.bloodGroup || '—', 'text-indigo-700'],
      ],
    },
    stay: {
      kicker: 'Inpatient',
      title: 'Ward and bed',
      subtitle: 'Visible only while you are admitted',
      stats: [
        ['IP', stay?.ip_number || activeAdmission?.ip_number || '—', 'text-amber-700'],
        ['Ward', stay?.ward_name || '—', 'text-indigo-700'],
        ['Bed', stay?.bed_number || '—', 'text-cyan-700'],
        ['Admissions', admissions.length, 'text-gray-900'],
      ],
    },
    food: {
      kicker: 'Kitchen',
      title: 'Order food',
      subtitle: 'Kitchen will charge this to your inpatient bill',
      stats: [
        ['Menu items', kitchenProducts.length, 'text-indigo-700'],
        ['Your orders', kitchenOrders.length, 'text-cyan-700'],
        ['Ward', stay?.ward_name || '—', 'text-amber-700'],
        ['Bed', stay?.bed_number || '—', 'text-gray-900'],
      ],
    },
    profile: {
      kicker: 'Your details',
      title: patientName,
      subtitle: hospital.name || 'Hospital patient profile',
      stats: [
        ['Age', patient.age != null ? `${patient.age} yrs` : '—', 'text-gray-900'],
        ['Gender', patient.gender || '—', 'text-indigo-700'],
        ['Blood', patient.blood_group || patient.bloodGroup || '—', 'text-red-700'],
        ['Phone', patient.phone || session.phone || '—', 'text-cyan-700'],
      ],
    },
  }[tab] || {
    kicker: 'Patient portal',
    title: patientName,
    subtitle: '',
    stats: [],
  };

  if (!session?.patientId || !session?.token) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <header className="sticky top-0 z-50 bg-gradient-to-r from-cyan-700 via-cyan-800 to-teal-900 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <button type="button" onClick={() => goTab('home')} className="flex min-w-0 items-center gap-2 text-left">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/95 shadow-sm">
                {hospital.logo_url || hospital.logoUrl ? (
                  <img src={hospital.logo_url || hospital.logoUrl} alt={hospital.name || 'Hospital logo'} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-lg font-bold text-cyan-800">{initialOf(hospital.name)}</span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-white sm:text-base">{hospital.name || 'Hospital Management'}</span>
                <span className="block truncate text-[11px] text-cyan-100">Patient portal</span>
              </span>
              </button>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden border-l border-white/30 px-2 text-right sm:block">
                <p className="max-w-[10rem] truncate text-sm font-semibold text-white">Hi {patientName}</p>
                <p className="text-xs text-cyan-100">Logged in as Patient</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 hover:text-cyan-100"
              >
                <FiLogOut className="mr-1.5 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-14 z-40 border-b border-gray-200 bg-white shadow-sm" aria-label="Patient portal modules">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-1 py-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    tab === item.id
                      ? 'border border-cyan-100 bg-cyan-50 text-cyan-900'
                      : 'border border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="hh-page-stack mx-auto flex max-w-5xl flex-col space-y-4 px-4 py-5">
        <PortalHero hero={hero} live={live} onRefresh={() => load()} />

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Loading your records…</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
            <p className="font-semibold text-red-800">{error}</p>
            <button type="button" onClick={load} className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Try again</button>
          </div>
        ) : (
          <>
            {tab === 'home' && (
              <div className="space-y-3">
                {activePharmacyOrders.map((order) => (
                  <PharmacyPrepTracker key={order.id} order={order} live={live} />
                ))}
                {appointments.slice(0, 3).map((appointment, index) => (
                  <DeskCard
                    key={appointment.id || index}
                    initial={initialOf(appointment.doctor_name || appointment.doctorName)}
                    title={appointment.doctor_name || appointment.doctorName || 'Doctor'}
                    badge={<Status value={appointment.status || 'NEW'} />}
                    meta={`${appointment.doctor_specialization || 'Consultation'} · ${dateLabel(appointment.appointment_date || appointment.appointmentDate)}${appointment.appointment_time || appointment.appointmentTime ? ` · ${appointment.appointment_time || appointment.appointmentTime}` : ''}`}
                    chips={appointment.chief_complaint || appointment.chiefComplaint ? [appointment.chief_complaint || appointment.chiefComplaint] : []}
                  />
                ))}
                {allBills.slice(0, 3).map((bill, index) => (
                  <DeskCard
                    key={bill.id || index}
                    initial="₹"
                    title={bill.description || bill.bill_type || bill.billType || 'Hospital bill'}
                    badge={<Status value={bill.status} />}
                    meta={dateLabel(bill.bill_date || bill.billDate)}
                    right={<p className="text-right text-xl font-bold text-gray-900">{rs(bill.balance_value)}</p>}
                  />
                ))}
                {!activePharmacyOrders.length && !appointments.length && !allBills.length && (
                  <EmptyState title="Nothing waiting right now" text="New prescriptions and appointments will appear here." />
                )}
              </div>
            )}

            {tab === 'medicines' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMedicineView('queue')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${medicineView === 'queue' ? 'bg-indigo-700 text-white' : 'border border-gray-200 bg-white text-gray-600'}`}
                  >
                    Active queue ({activePharmacyOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedicineView('done')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${medicineView === 'done' ? 'bg-indigo-700 text-white' : 'border border-gray-200 bg-white text-gray-600'}`}
                  >
                    Collected ({donePharmacyOrders.length || prescriptions.length})
                  </button>
                </div>
                {medicineView === 'queue' ? (
                  <div className="space-y-3">
                    {activePharmacyOrders.map((order) => (
                      <PharmacyPrepTracker key={order.id} order={order} live={live} />
                    ))}
                    {!activePharmacyOrders.length && (
                      <EmptyState
                        title="No doctor prescriptions waiting"
                        text="When the doctor sends your prescription to pharmacy, it will appear here."
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {donePharmacyOrders.map((order) => (
                      <PharmacyPrepTracker key={order.id} order={order} live={live} />
                    ))}
                    {prescriptions.map((prescription, index) => (
                      <DeskCard
                        key={prescription.id || index}
                        initial={initialOf(prescription.medicine_name || prescription.medicineName)}
                        title={prescription.medicine_name || prescription.medicineName || 'Medicine'}
                        badge={<Status value={prescription.status} />}
                        meta={prescription.doctor_name || 'Doctor not recorded'}
                        chips={[prescription.dosage, prescription.frequency, prescription.duration_days ? `${prescription.duration_days} days` : null].filter(Boolean)}
                      />
                    ))}
                    {!donePharmacyOrders.length && !prescriptions.length && (
                      <EmptyState title="No collected medicines yet" text="Paid and collected prescriptions will move here." />
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === 'bills' && (
              <div className="space-y-3">
                {allBills.map((bill, index) => (
                  <DeskCard
                    key={bill.id || index}
                    initial="₹"
                    title={bill.description || bill.bill_type || bill.billType || 'Hospital bill'}
                    badge={<Status value={bill.status} />}
                    meta={dateLabel(bill.bill_date || bill.billDate)}
                    chips={[`Billed ${rs(bill.amount_due_value)}`, `Paid ${rs(bill.amount_paid_value)}`]}
                    right={<p className="text-right text-xl font-bold text-gray-900">{rs(bill.balance_value)}</p>}
                  />
                ))}
                {!allBills.length && <EmptyState title="No hospital bills yet" text="Paid and pending bills will show here." />}
                {billing.pending > 0 && (
                  <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Please contact reception for payment options and receipts.
                  </p>
                )}
              </div>
            )}

            {tab === 'appointments' && (
              <div className="space-y-3">
                {appointments.map((appointment, index) => (
                  <DeskCard
                    key={appointment.id || index}
                    initial={initialOf(appointment.doctor_name || appointment.doctorName)}
                    title={appointment.doctor_name || appointment.doctorName || 'Doctor'}
                    badge={<Status value={appointment.status || 'NEW'} />}
                    meta={`${appointment.doctor_specialization || 'Consultation'} · ${dateLabel(appointment.appointment_date || appointment.appointmentDate)}${appointment.appointment_time || appointment.appointmentTime ? ` · ${appointment.appointment_time || appointment.appointmentTime}` : ''}`}
                    chips={appointment.chief_complaint || appointment.chiefComplaint ? [appointment.chief_complaint || appointment.chiefComplaint] : []}
                  />
                ))}
                {!appointments.length && <EmptyState title="No appointments found" text="Booked doctor visits will appear here." />}
              </div>
            )}

            {tab === 'records' && (
              <div className="space-y-3">
                {consultations.map((consultation, index) => (
                  <DeskCard
                    key={consultation.id || index}
                    initial={initialOf(consultation.doctor_name)}
                    title={consultation.doctor_name || 'Doctor'}
                    badge={<Status value={consultation.status} />}
                    meta={dateLabel(consultation.visit_date || consultation.visitDate)}
                    chips={[consultation.chief_complaint || consultation.chiefComplaint, consultation.diagnosis].filter(Boolean)}
                  >
                    {consultation.clinical_notes ? (
                      <p className="border-t border-gray-100 bg-slate-50 px-4 py-3 text-sm text-gray-600">{consultation.clinical_notes}</p>
                    ) : null}
                  </DeskCard>
                ))}
                {!consultations.length && <EmptyState title="No consultations recorded" text="Visit notes from your doctor will appear here." />}
              </div>
            )}

            {tab === 'labs' && (
              <div className="space-y-3">
                {labOrders.map((order, index) => (
                  <DeskCard
                    key={order.id || index}
                    initial="L"
                    title={dateLabel(order.order_date || order.orderDate)}
                    badge={<Status value={order.status || 'ORDERED'} />}
                    meta={`Order #${String(order.id || '').slice(0, 8)}`}
                    chips={(order.items || []).map((item) => item.test_name || item.testName || 'Test')}
                  >
                    {(order.items || []).length ? (
                      <div className="space-y-2 border-t border-gray-100 bg-slate-50 px-4 py-3">
                        {(order.items || []).map((item, itemIndex) => (
                          <div key={item.id || itemIndex} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
                            <p className="font-medium">{item.test_name || item.testName || 'Test'}</p>
                            <p className="text-xs text-gray-500">{item.result_value || item.resultValue || item.result || 'Result pending'}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </DeskCard>
                ))}
                {!labOrders.length && <EmptyState title="No lab orders found" text="Tests ordered during treatment will appear here." />}
              </div>
            )}

            {tab === 'blood' && (
              <div className="space-y-3">
                {bloodRequests.map((request, index) => (
                  <DeskCard
                    key={request.id || index}
                    initial={String(request.blood_group || request.bloodGroup || 'B').slice(0, 1)}
                    title={`${request.blood_group || request.bloodGroup} · ${request.component || 'WHOLE'}`}
                    badge={<Status value={request.status} />}
                    meta={dateLabel(request.request_date || request.requestDate)}
                    chips={[`Needed ${request.units_needed ?? request.unitsNeeded ?? '—'}`, `Issued ${request.units_issued ?? request.unitsIssued ?? '—'}`]}
                  />
                ))}
                {!bloodRequests.length && <EmptyState title="No blood bank reports yet" text="Requests and issued units will appear here." />}
              </div>
            )}

            {tab === 'stay' && isInpatient && (
              <div className="space-y-3">
                <DeskCard
                  initial="IP"
                  title={`IP ${stay?.ip_number || activeAdmission?.ip_number || '—'}`}
                  badge={<Status value="ADMITTED" />}
                  meta={`${stay?.ward_name || 'Ward'} · Bed ${stay?.bed_number || '—'}`}
                  chips={[`Admitted ${dateLabel(stay?.admit_date || activeAdmission?.admit_date)}`]}
                />
                {admissions.map((admission, index) => (
                  <DeskCard
                    key={admission.id || index}
                    initial="A"
                    title={`IP ${admission.ip_number || '—'}`}
                    badge={<Status value={admission.status} />}
                    meta={admission.doctor_name || 'Doctor not assigned'}
                    chips={[`Admitted ${dateLabel(admission.admit_date)}`, admission.discharge_date ? `Discharged ${dateLabel(admission.discharge_date)}` : 'In hospital']}
                  />
                ))}
              </div>
            )}

            {tab === 'food' && isInpatient && (
              <div className="space-y-3">
                {kitchenProducts.map((product) => (
                  <article key={product.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-4 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-800">
                          {initialOf(product.name)}
                        </span>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
                          <p className="text-sm text-gray-500">{rs(product.unit_price || product.unitPrice)} · {product.category || 'REGULAR'}</p>
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        className="w-16 rounded-lg border border-gray-300 px-2 py-2 text-center text-sm"
                        value={foodQty[product.id] || ''}
                        onChange={(event) => setFoodQty((current) => ({ ...current, [product.id]: event.target.value }))}
                      />
                    </div>
                  </article>
                ))}
                {!kitchenProducts.length && <EmptyState title="Kitchen menu is not published yet" text="Food items will appear here when the kitchen publishes them." />}
                {!!kitchenProducts.length && (
                  <button
                    type="button"
                    disabled={ordering}
                    onClick={onOrderFood}
                    className="rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60"
                  >
                    {ordering ? 'Sending…' : 'Place food order'}
                  </button>
                )}
                {kitchenOrders.map((order) => (
                  <DeskCard
                    key={order.id}
                    initial="F"
                    title={rs(order.total_amount || order.totalAmount)}
                    badge={<Status value={order.status} />}
                    meta={dateLabel(order.created_at || order.createdAt)}
                  />
                ))}
              </div>
            )}

            {tab === 'profile' && (
              <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-800">
                    {initialOf(patientName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">{patientName}</h2>
                      {isInpatient && <Status value="ADMITTED" />}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Patient ID · {patient.id || session.patientId}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {[patient.phone || session.phone, patient.gender, patient.blood_group || patient.bloodGroup].filter(Boolean).map((chip) => (
                        <span key={chip} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{chip}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 border-t border-gray-100 sm:grid-cols-3 sm:divide-y-0">
                  {[
                    ['Phone', patient.phone || session.phone || '—'],
                    ['Age', patient.age != null ? `${patient.age} years` : '—'],
                    ['Address', patient.address || '—'],
                  ].map(([label, value]) => (
                    <div key={label} className="px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                      <p className="mt-1 break-words text-sm font-semibold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
                {(hospital.phone || hospital.address) && (
                  <div className="border-t border-gray-100 bg-slate-50 px-4 py-3 text-sm text-gray-600">
                    {hospital.phone && <p className="flex items-center gap-1"><FiPhone /> {hospital.phone}</p>}
                    {hospital.address && <p className="mt-1 flex items-start gap-1"><FiMapPin className="mt-0.5 shrink-0" /> <span>{hospital.address}</span></p>}
                  </div>
                )}
              </article>
            )}
          </>
        )}
      </main>
    </div>
  );
};

const PortalHero = ({ hero, live, onRefresh, compact = false }) => (
  <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
    <div className="bg-gradient-to-r from-indigo-700 to-cyan-700 px-5 py-5 text-white">
      <div className={`flex gap-4 ${compact ? 'flex-col' : 'flex-col sm:flex-row sm:items-center sm:justify-between'}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">{hero.kicker}</p>
          <h1 className="mt-1 text-2xl font-bold">{hero.title}</h1>
          <p className="mt-1 text-sm text-indigo-100">{hero.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {live && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Live
            </span>
          )}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>
    </div>
    {!!hero.stats.length && (
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 divide-x divide-gray-100 sm:grid-cols-4'}`}>
        {hero.stats.map(([label, value, color], index) => (
          <div
            key={label}
            className={`px-4 py-3 ${
              compact
                ? `${index % 2 === 0 ? 'border-r border-gray-100' : ''} ${index < 2 ? 'border-b border-gray-100' : ''}`
                : ''
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className={`mt-1 truncate text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const DeskCard = ({ initial, title, badge, meta, chips = [], right, children }) => (
  <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-1 gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-lg font-bold text-indigo-800">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-bold text-gray-900">{title}</h2>
            {badge}
          </div>
          {meta ? <p className="mt-1 text-sm text-gray-500">{meta}</p> : null}
          {chips.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.slice(0, 6).map((chip) => (
                <span key={chip} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{chip}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {right ? <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">{right}</div> : null}
    </div>
    {children}
  </article>
);

const EmptyState = ({ title, text }) => (
  <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
    <p className="text-base font-semibold text-gray-900">{title}</p>
    <p className="mt-1 text-sm text-gray-500">{text}</p>
  </div>
);

const PharmacyPrepTracker = ({ order, live }) => {
  const [showSummary, setShowSummary] = useState(false);
  const status = String(order.status || 'PENDING').toUpperCase();
  const rank = PHARMACY_RANK[status] ?? 0;
  const items = Array.isArray(order.items) ? order.items : [];
  const billAmount = pharmacyBillAmount(order);
  const steps = [
    { id: 'wait', label: 'Waiting', at: 0 },
    { id: 'picked', label: 'Picked up', at: 1 },
    { id: 'prep', label: 'Preparing', at: 2 },
    { id: 'ready', label: 'Come to counter', at: 3 },
  ];
  const isCounter = status === 'READY' || status === 'BILLED';
  const headline = status === 'PAID'
    ? 'Collected and paid'
    : isCounter
      ? 'Medicines are ready at the pharmacy counter.'
      : status === 'PACKING'
        ? 'Pharmacy is preparing your medicines. Please wait at reception.'
        : status === 'PICKED_UP'
          ? 'Pharmacy picked up your order. Please wait at reception.'
          : 'Doctor sent your prescription to pharmacy. Please wait at reception.';

  return (
    <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${isCounter ? 'border-teal-400 ring-2 ring-teal-200' : 'border-indigo-200 ring-1 ring-indigo-100'}`}>
      {isCounter && (
        <div className="bg-teal-700 px-4 py-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-100">Final status</p>
          <h2 className="mt-1 text-2xl font-bold text-white">Your bill is {rs(billAmount)}</h2>
          <p className="mt-1 text-sm font-medium text-white">Pay and collect the medicines.</p>
        </div>
      )}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-1 gap-3">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${isCounter ? 'bg-teal-100 text-teal-800' : 'bg-indigo-100 text-indigo-800'}`}>Rx</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Doctor prescription</h2>
              <Status value={status} />
            </div>
            <p className={`mt-1 text-sm ${isCounter ? 'font-semibold text-teal-800' : 'text-gray-500'}`}>{headline}</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${live ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {live ? 'Live' : 'Connecting'}
        </span>
      </div>

      <div className="border-t border-gray-100 bg-slate-50 px-4 py-4">
        <div className="flex w-full items-start">
          {steps.map((step, index) => {
            const reachedCounter = isCounter || status === 'PAID';
            const done = rank > step.at || status === 'PAID' || (reachedCounter && step.id === 'ready');
            const current = status !== 'PAID' && rank === step.at && !done;
            const activeGreen = done || (isCounter && step.id === 'ready');
            return (
              <React.Fragment key={step.id}>
                <div className="flex w-16 shrink-0 flex-col items-center text-center sm:w-20">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                    activeGreen ? 'bg-emerald-600 text-white' : current ? 'bg-indigo-700 text-white' : 'bg-white text-gray-400 ring-1 ring-gray-200'
                  }`}>
                    {activeGreen ? <FiCheck /> : index + 1}
                  </span>
                  <p className={`mt-2 text-[11px] font-semibold leading-tight sm:text-xs ${
                    activeGreen ? 'text-emerald-800' : current ? 'text-indigo-800' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div aria-hidden="true" className={`mt-4 h-0.5 min-w-[8px] flex-1 ${
                    done || (reachedCounter && step.at < 3) ? 'bg-emerald-400' : current ? 'bg-indigo-300' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <button
          type="button"
          onClick={() => setShowSummary((open) => !open)}
          className="text-sm font-semibold text-indigo-700 underline-offset-2 hover:underline"
        >
          {showSummary ? 'Hide medicine summary' : 'View medicine summary'}
        </button>
      </div>

      {showSummary && (
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">#</th>
                <th className="px-4 py-2.5 font-semibold">Medicine</th>
                <th className="px-4 py-2.5 font-semibold">Dosage</th>
                <th className="px-4 py-2.5 font-semibold">Frequency</th>
                <th className="px-4 py-2.5 text-right font-semibold">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length ? items.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="px-4 py-2.5 text-gray-500">{index + 1}</td>
                  <td className="px-4 py-2.5 font-semibold text-gray-900">{item.medicine_name || item.medicineName || item.name || 'Medicine'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{item.dosage || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{item.frequency || '—'}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{item.prescribed_qty ?? item.prescribedQty ?? item.qty ?? '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={5}>Medicines will show here when pharmacy opens this order.</td>
                </tr>
              )}
            </tbody>
            {isCounter && (
              <tfoot>
                <tr className="bg-teal-50">
                  <td className="px-4 py-3 text-sm font-semibold text-teal-900" colSpan={4}>Bill amount — pay and collect the medicines</td>
                  <td className="px-4 py-3 text-right text-base font-bold text-teal-900">{rs(billAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </article>
  );
};

const HospitalPatientPortalHome = () => (
  <HospitalManagementProvider>
    <Switch>
      <Route exact path={Object.values(HH_PATIENT_TAB_PATHS)} component={PortalHome} />
      <Redirect to={HH_PATIENT_TAB_PATHS.home} />
    </Switch>
  </HospitalManagementProvider>
);

export default HospitalPatientPortalHome;
