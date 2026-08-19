import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import { clearAllAuthStorage } from '../../utils/clearAuthStorage';
import { HH_DOCTOR_BASE_PATH, HH_DOCTOR_LOGIN_PATH } from '../../components/hospitalManagement/hospitalManagementMenuItems';

export const DOCTOR_DESK_PATH = `${HH_DOCTOR_BASE_PATH}/doctor-desk`;

const isDoctorRole = (value) => {
  const raw = String(value || '').toUpperCase().replace(/\s+/g, '_');
  return raw === 'DOCTOR' || raw.endsWith('_DOCTOR') || raw.includes('DOCTOR');
};

const findHospitalDoctorAccess = (session, signinAccounts = []) => {
  for (const organization of session?.organizations || []) {
    for (const app of organization.apps || []) {
      if (String(app.appCode || '').toUpperCase() !== 'HOSPITAL_MANAGEMENT') continue;
      const role = (app.roles || []).find((item) => isDoctorRole(item.roleCode) || isDoctorRole(item.accountName));
      if (role) {
        return {
          parentMembershipId: organization.parentMembershipId || organization.parent_membership_id,
          app,
          role: { ...role, roleCode: 'DOCTOR' },
        };
      }
    }
  }
  const doctorAccount = (signinAccounts || []).find((account) => isDoctorRole(account.accountName || account.account_name));
  if (doctorAccount) {
    return {
      parentMembershipId: doctorAccount.parent_membership_id || doctorAccount.parentMembershipId,
      app: { appCode: 'HOSPITAL_MANAGEMENT', displayName: 'Hospital Management' },
      role: { roleCode: 'DOCTOR', accountName: doctorAccount.accountName || 'Doctor' },
    };
  }
  return null;
};

const HospitalManagementDoctorLogin = () => {
  const history = useHistory();
  const { login, updateUserRole } = useUserContext();
  const platform = usePlatformAccess();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    const mobile = String(phone || '').replace(/\D/g, '');
    if (mobile.length < 10) return toast.error('Enter a valid phone number');
    if (!password.trim()) return toast.error('Enter password');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobile, password: password.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.error) {
        toast.error(data.message || data.errors || 'Login failed');
        return;
      }
      clearAllAuthStorage();
      platform?.clearActiveContext?.();
      login(data);
      const token = data?.results?.token;
      const session = await platform?.loadSession?.(token);
      const access = findHospitalDoctorAccess(session, data?.results?.userAccounts || []);
      if (!access) {
        const owner = Boolean(session?.isOwner);
        toast.error(
          owner
            ? 'Owner/admin cannot use this doctor URL. Hire the doctor in Admin settings → Employees as role Doctor (with specialization), then login with that phone. Default password is the first 4 digits of the phone.'
            : 'This phone is not a hospital Doctor login. In Admin settings → Employees, add this person as Doctor with a specialization.'
        );
        return;
      }
      platform.selectAppRole(access.parentMembershipId, access.app, access.role);
      try {
        localStorage.setItem('hh_parent_membership_id', String(access.parentMembershipId));
      } catch {
        // ignore
      }
      updateUserRole('Doctor');
      toast.success('Welcome doctor');
      history.replace(DOCTOR_DESK_PATH);
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
        <div className="text-center space-y-1">
          <div className="mx-auto h-12 w-12 rounded-full bg-cyan-700 text-white flex items-center justify-center text-lg font-bold">Dr</div>
          <h1 className="text-xl font-bold text-gray-900">Doctor login</h1>
          <p className="text-sm text-gray-500">Phone number and password to see today’s slots and patient medicine history</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm">
            <span className="text-gray-600">Phone number</span>
            <div className="relative mt-1">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                inputMode="numeric"
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm"
                placeholder="10-digit mobile"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">Password</span>
            <div className="relative mt-1">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full border border-gray-300 rounded-lg pl-9 pr-10 py-2.5 text-sm"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-700 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-cyan-800 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'See my daily slots'}
          </button>
        </form>
        <p className="text-xs text-gray-500 text-center">
          Default password is the first 4 digits of the phone, unless admin set another password.
          {' '}URL: <span className="font-medium text-gray-700">{HH_DOCTOR_LOGIN_PATH}</span>
        </p>
      </div>
    </div>
  );
};

export default HospitalManagementDoctorLogin;
