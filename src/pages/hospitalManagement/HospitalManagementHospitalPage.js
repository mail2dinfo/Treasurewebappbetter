import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const HospitalManagementHospitalPage = () => {
  const { hospital, fetchHospital, saveHospital } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_hospital_manage');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    registrationNo: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHospital();
  }, [fetchHospital]);

  useEffect(() => {
    if (!hospital) return;
    setForm({
      name: hospital.name || '',
      phone: hospital.phone || '',
      address: hospital.address || '',
      email: hospital.email || '',
      registrationNo: hospital.registration_no || hospital.registrationNo || '',
    });
  }, [hospital]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Hospital name required');
    setSaving(true);
    const result = await saveHospital({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      email: form.email.trim() || null,
      registrationNo: form.registrationNo.trim() || null,
    });
    setSaving(false);
    if (result.success) toast.success('Hospital profile saved');
    else toast.error(result.error || 'Failed');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Hospital Profile</h1>
        <p className="text-sm text-gray-500">Name, contact and registration details</p>
      </div>

      <form onSubmit={onSave} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
          placeholder="Hospital name *"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          disabled={!canManage}
        />
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          disabled={!canManage}
        />
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          disabled={!canManage}
        />
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
          placeholder="Registration number"
          value={form.registrationNo}
          onChange={(e) => setForm((f) => ({ ...f, registrationNo: e.target.value }))}
          disabled={!canManage}
        />
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-50"
          rows={3}
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          disabled={!canManage}
        />
        {canManage && (
          <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        )}
      </form>
    </div>
  );
};

export default HospitalManagementHospitalPage;
