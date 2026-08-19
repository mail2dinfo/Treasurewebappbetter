import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FiEye, FiEyeOff, FiHeart, FiLock, FiPhone } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { HospitalManagementProvider, useHospitalManagement } from '../../../context/hospitalManagement/HospitalManagementContext';
import { HH_PATIENT_TAB_PATHS } from '../../../components/hospitalManagement/hospitalManagementMenuItems';

const PORTAL_STORAGE_KEY = 'hh_patient_portal';

export const getPatientPortalSession = () => {
  try {
    const raw = localStorage.getItem(PORTAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setPatientPortalSession = (session) => {
  try {
    localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
};

export const clearPatientPortalSession = () => {
  try {
    localStorage.removeItem(PORTAL_STORAGE_KEY);
  } catch {
    // ignore
  }
};

const inputCls = 'w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-3 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

const LoginForm = () => {
  const { patientPortalLogin } = useHospitalManagement();
  const history = useHistory();
  const existing = getPatientPortalSession();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [parentMembershipId, setParentMembershipId] = useState(() => {
    try {
      return localStorage.getItem('hh_parent_membership_id') || '';
    } catch {
      return '';
    }
  });
  const [needHospitalId, setNeedHospitalId] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const digits = String(phone || '').replace(/\D/g, '').slice(0, 10);
    if (digits !== phone) setPhone(digits);
  }, [phone]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const mobile = String(phone || '').replace(/\D/g, '');
    if (mobile.length !== 10) return toast.error('Enter a valid 10-digit phone number');
    if (!password.trim()) return toast.error('Enter password');
    setLoading(true);
    const result = await patientPortalLogin(mobile, password.trim(), parentMembershipId.trim() || null);
    setLoading(false);
    if (result.needsHospitalId) {
      setNeedHospitalId(true);
      setHospitals(result.hospitals || result.data?.hospitals || []);
      toast.error(result.error || 'Select your hospital');
      return;
    }
    if (result.success) {
      const data = result.data || {};
      const patient = data.patient || data;
      const session = {
        token: data.token,
        patientId: patient.id ?? data.patient_id ?? data.patientId,
        parentMembershipId: String(data.parentMembershipId || parentMembershipId.trim() || ''),
        patientName: patient.name ?? data.patient_name ?? data.patientName ?? 'Patient',
        phone: mobile,
        isInpatient: Boolean(data.isInpatient),
      };
      if (!session.patientId || !session.token) {
        toast.error('Invalid patient response');
        return;
      }
      setPatientPortalSession(session);
      try {
        if (session.parentMembershipId) {
          localStorage.setItem('hh_parent_membership_id', session.parentMembershipId);
        }
      } catch {
        // ignore
      }
      toast.success(`Welcome, ${session.patientName}`);
      history.push(HH_PATIENT_TAB_PATHS.home);
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-cyan-800 via-teal-700 to-emerald-700 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-cyan-950/20" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <FiHeart /> Patient portal
            </span>
            <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight">Wait at reception and watch your medicines live</h1>
            <p className="mt-4 max-w-md text-base text-cyan-50">
              After the doctor sends your prescription, this login shows picked up, preparing, and ready to collect — no refresh needed.
            </p>
          </div>
          <ul className="relative space-y-3 text-sm text-cyan-50">
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-white" /> Bills, appointments and lab reports</li>
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-white" /> Live pharmacy status while you wait</li>
            <li className="flex gap-3"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-white" /> Ward and food order if you are admitted</li>
          </ul>
        </aside>

        <main className="flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="mb-6 text-center lg:hidden">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-teal-800">
                <FiHeart /> Patient portal
              </span>
              <h1 className="mt-3 text-2xl font-bold text-gray-900">Sign in to your care</h1>
            </div>

            {existing?.token && existing?.patientId && (
              <button
                type="button"
                onClick={() => history.push(HH_PATIENT_TAB_PATHS.home)}
                className="mb-4 flex w-full items-center justify-between rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-sm font-bold text-teal-950">Continue as {existing.patientName || 'patient'}</span>
                  <span className="text-xs text-teal-800">You are already signed in</span>
                </span>
                <span className="text-sm font-semibold text-teal-800">Open →</span>
              </button>
            )}

            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-5">
                <p className="hidden text-xs font-semibold uppercase tracking-wide text-teal-700 lg:block">Welcome back</p>
                <h2 className="text-xl font-bold text-gray-900">Patient sign in</h2>
                <p className="mt-1 text-sm text-gray-500">Use the phone number registered at the hospital</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4 px-6 py-6">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Phone number</span>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      autoComplete="tel"
                      className={inputCls}
                      placeholder="10-digit mobile"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">Password</span>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={`${inputCls} pr-11`}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </label>

                {(needHospitalId || parentMembershipId) && (
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      Hospital {needHospitalId ? '*' : '(only if registered in more than one hospital)'}
                    </span>
                    {hospitals.length > 1 ? (
                      <select
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        value={parentMembershipId}
                        onChange={(e) => setParentMembershipId(e.target.value)}
                        required={needHospitalId}
                      >
                        <option value="">Select hospital</option>
                        {hospitals.map((item) => (
                          <option key={`${item.parentMembershipId}-${item.patientId}`} value={item.parentMembershipId}>
                            {item.hospitalName} (ID {item.parentMembershipId})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="w-full rounded-xl border border-gray-300 px-3 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                        placeholder="Hospital ID from reception"
                        value={parentMembershipId}
                        onChange={(e) => setParentMembershipId(e.target.value)}
                        required={needHospitalId}
                      />
                    )}
                  </label>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {loading ? 'Signing in…' : 'View my records'}
                </button>
              </form>

              <div className="border-t border-gray-100 bg-slate-50 px-6 py-4">
                <p className="text-xs leading-5 text-gray-600">
                  If the hospital did not set a password, use the <span className="font-semibold text-gray-900">first 4 digits of your phone number</span>.
                  Reception can reset it for you.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const HospitalPatientPortalLogin = () => (
  <HospitalManagementProvider>
    <LoginForm />
  </HospitalManagementProvider>
);

export default HospitalPatientPortalLogin;
