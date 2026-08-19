import React, { useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLock, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useUserContext } from '../../context/user_context';
import { usePlatformAccess } from '../../context/platformAccess_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import { clearAllAuthStorage } from '../../utils/clearAuthStorage';
import { formatRoleLabel } from '../../utils/roleLabels';
import {
  HH_ROLE_HOME_SUFFIX,
  HH_STAFF_LOGIN_PATHS,
  getHhBasePathForRole,
} from '../../components/hospitalManagement/hospitalManagementMenuItems';

const ROLE_COPY = {
  MANAGER: {
    title: 'Manager login',
    subtitle: 'Phone and password to open the hospital manager desk',
    badge: 'Mgr',
    homeLabel: 'Open manager desk',
  },
  RECEPTIONIST: {
    title: 'Reception login',
    subtitle: 'Phone and password to register OPD visits and appointments',
    badge: 'Rc',
    homeLabel: 'Open reception',
  },
  PHARMACIST: {
    title: 'Pharmacist login',
    subtitle: 'Phone and password to bill prescriptions and pharmacy stock',
    badge: 'Rx',
    homeLabel: 'Open pharmacy desk',
  },
  COMPOUNDER: {
    title: 'Compounder login',
    subtitle: 'Phone and password to prepare and bill pharmacy orders',
    badge: 'Co',
    homeLabel: 'Open pharmacy desk',
  },
  NURSE: {
    title: 'Nurse login',
    subtitle: 'Phone and password to see admissions, wards and inpatient care',
    badge: 'Ns',
    homeLabel: 'Open admissions',
  },
  KITCHEN_STAFF: {
    title: 'Kitchen login',
    subtitle: 'Phone and password to see ward food orders',
    badge: 'Kt',
    homeLabel: 'Open kitchen desk',
  },
  DOCTOR: {
    title: 'Doctor login',
    subtitle: 'Phone number and password to see today’s slots and patient medicine history',
    badge: 'Dr',
    homeLabel: 'See my daily slots',
  },
};

const PATH_ROLE = {
  manager: 'MANAGER',
  receptionist: 'RECEPTIONIST',
  pharmacist: 'PHARMACIST',
  compounder: 'COMPOUNDER',
  nurse: 'NURSE',
  kitchen: 'KITCHEN_STAFF',
  doctor: 'DOCTOR',
};

const normalizeRole = (value) => String(value || '').toUpperCase().replace(/\s+/g, '_');

const roleMatches = (value, expected) => {
  const raw = normalizeRole(value);
  const want = normalizeRole(expected);
  if (!raw || !want) return false;
  return raw === want || raw.endsWith(`_${want}`) || raw.includes(want);
};

export const findHospitalRoleAccess = (session, signinAccounts = [], roleCode) => {
  const want = normalizeRole(roleCode);
  for (const organization of session?.organizations || []) {
    for (const app of organization.apps || []) {
      if (String(app.appCode || '').toUpperCase() !== 'HOSPITAL_MANAGEMENT') continue;
      const role = (app.roles || []).find((item) =>
        roleMatches(item.roleCode, want) || roleMatches(item.accountName, want)
      );
      if (role) {
        return {
          parentMembershipId: organization.parentMembershipId || organization.parent_membership_id,
          app,
          role: { ...role, roleCode: want },
        };
      }
    }
  }
  const account = (signinAccounts || []).find((item) =>
    roleMatches(item.accountName || item.account_name, want)
  );
  if (account) {
    return {
      parentMembershipId: account.parent_membership_id || account.parentMembershipId,
      app: { appCode: 'HOSPITAL_MANAGEMENT', displayName: 'Hospital Management' },
      role: { roleCode: want, accountName: account.accountName || formatRoleLabel(want) },
    };
  }
  return null;
};

const HospitalManagementStaffLogin = ({ roleCode: roleCodeProp } = {}) => {
  const history = useHistory();
  const location = useLocation();
  const { login, updateUserRole } = useUserContext();
  const platform = usePlatformAccess();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const roleCode = useMemo(() => {
    if (roleCodeProp) return normalizeRole(roleCodeProp);
    const segment = String(location.pathname || '').split('/')[2] || '';
    return PATH_ROLE[segment] || 'MANAGER';
  }, [location.pathname, roleCodeProp]);

  const copy = ROLE_COPY[roleCode] || {
    title: `${formatRoleLabel(roleCode)} login`,
    subtitle: 'Phone number and password',
    badge: formatRoleLabel(roleCode).slice(0, 2),
    homeLabel: 'Continue',
  };
  const loginPath = HH_STAFF_LOGIN_PATHS[roleCode] || location.pathname;

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
      const access = findHospitalRoleAccess(session, data?.results?.userAccounts || [], roleCode);
      if (!access) {
        const owner = Boolean(session?.isOwner);
        toast.error(
          owner
            ? `Owner/admin cannot use this ${formatRoleLabel(roleCode)} URL. Hire this person in Admin settings → Employees as role ${formatRoleLabel(roleCode)}, then login with that phone. Default password is the first 4 digits of the phone.`
            : `This phone is not a hospital ${formatRoleLabel(roleCode)} login. In Admin settings → Employees, add this person as ${formatRoleLabel(roleCode)}.`
        );
        return;
      }
      platform.selectAppRole(access.parentMembershipId, access.app, access.role);
      try {
        localStorage.setItem('hh_parent_membership_id', String(access.parentMembershipId));
      } catch {
        // ignore
      }
      updateUserRole(formatRoleLabel(roleCode));
      const basePath = getHhBasePathForRole(roleCode);
      const suffix = HH_ROLE_HOME_SUFFIX[roleCode] || '/dashboard';
      toast.success(`Welcome ${formatRoleLabel(roleCode).toLowerCase()}`);
      history.replace(`${basePath}${suffix}`);
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
          <div className="mx-auto h-12 w-12 rounded-full bg-cyan-700 text-white flex items-center justify-center text-lg font-bold">
            {copy.badge}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{copy.title}</h1>
          <p className="text-sm text-gray-500">{copy.subtitle}</p>
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
            {loading ? 'Signing in…' : copy.homeLabel}
          </button>
        </form>
        <p className="text-xs text-gray-500 text-center">
          Default password is the first 4 digits of the phone, unless admin set another password.
          {' '}URL: <span className="font-medium text-gray-700">{loginPath}</span>
        </p>
      </div>
    </div>
  );
};

export default HospitalManagementStaffLogin;
