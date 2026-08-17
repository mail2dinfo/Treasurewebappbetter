import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { HospitalManagementProvider, useHospitalManagement } from '../../../context/hospitalManagement/HospitalManagementContext';

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

const LoginForm = () => {
  const { patientPortalLogin } = useHospitalManagement();
  const history = useHistory();
  const [phone, setPhone] = useState('');
  const [parentMembershipId, setParentMembershipId] = useState(() => {
    try {
      return localStorage.getItem('hh_parent_membership_id') || '';
    } catch {
      return '';
    }
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return toast.error('Enter phone number');
    if (!parentMembershipId.trim()) return toast.error('Hospital ID required');
    setLoading(true);
    const result = await patientPortalLogin(phone.trim(), parentMembershipId.trim());
    setLoading(false);
    if (result.success) {
      const data = result.data || {};
      const patient = data.patient || data;
      const session = {
        patientId: patient.id ?? data.patient_id ?? data.patientId,
        parentMembershipId: parentMembershipId.trim(),
        patientName: patient.name ?? data.patient_name ?? data.patientName ?? 'Patient',
        phone: phone.trim(),
      };
      if (!session.patientId) {
        toast.error('Invalid patient response');
        return;
      }
      setPatientPortalSession(session);
      try {
        localStorage.setItem('hh_parent_membership_id', parentMembershipId.trim());
      } catch {
        // ignore
      }
      toast.success('Welcome!');
      history.push('/hospital-management/patient/home');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Patient Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in with your registered phone number</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone number</label>
            <input type="tel" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Hospital ID</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Provided by hospital" value={parentMembershipId} onChange={(e) => setParentMembershipId(e.target.value)} required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-cyan-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-cyan-800 disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
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
