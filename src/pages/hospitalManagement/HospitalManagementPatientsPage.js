import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const emptyForm = { name: '', phone: '', gender: '', age: '', address: '' };

const HospitalManagementPatientsPage = () => {
  const { patients, fetchPatients, createPatient, updatePatient } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_patient_manage');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatients(search ? { search } : {});
  }, [fetchPatients, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Patient name required');
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      gender: form.gender || null,
      age: form.age ? Number(form.age) : null,
      address: form.address.trim() || null,
    };
    const result = editId
      ? await updatePatient(editId, payload)
      : await createPatient(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editId ? 'Patient updated' : 'Patient registered');
      resetForm();
    } else toast.error(result.error || 'Failed');
  };

  const onEdit = (p) => {
    setEditId(p.id);
    setForm({
      name: p.name || '',
      phone: p.phone || '',
      gender: p.gender || '',
      age: p.age != null ? String(p.age) : '',
      address: p.address || '',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-500">Register and manage patient records</p>
        </div>
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-56"
          placeholder="Search name / phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {canManage && (
        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">{editId ? 'Edit patient' : 'Register patient'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
              <option value="">Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Age" type="number" value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
              {saving ? 'Saving…' : editId ? 'Update' : 'Register'}
            </button>
            {editId && <button type="button" onClick={resetForm} className="border border-gray-300 rounded-lg px-4 py-2 text-sm">Cancel</button>}
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {!(patients || []).length ? (
          <p className="text-center text-gray-500 py-8 text-sm">No patients found.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {(patients || []).map((p) => (
              <li key={p.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.phone || '—'} · {p.gender || '—'} · {p.age ?? '—'} yrs</p>
                </div>
                {canManage && (
                  <button type="button" onClick={() => onEdit(p)} className="text-xs px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-800 self-start">Edit</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HospitalManagementPatientsPage;
