import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const emptyForm = { name: '', specialization: '', phone: '', email: '' };

const HospitalManagementDoctorsPage = () => {
  const { doctors, fetchDoctors, createDoctor, updateDoctor, deleteDoctor } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_doctor_manage');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Doctor name required');
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      specialization: form.specialization.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    };
    const result = editId
      ? await updateDoctor(editId, payload)
      : await createDoctor(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editId ? 'Doctor updated' : 'Doctor added');
      resetForm();
    } else toast.error(result.error || 'Failed');
  };

  const onEdit = (doc) => {
    setEditId(doc.id);
    setForm({
      name: doc.name || '',
      specialization: doc.specialization || '',
      phone: doc.phone || '',
      email: doc.email || '',
    });
  };

  const onDelete = async (doc) => {
    if (!window.confirm(`Remove Dr. ${doc.name}?`)) return;
    const result = await deleteDoctor(doc.id);
    if (result.success) toast.success('Doctor removed');
    else toast.error(result.error || 'Failed');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Doctors</h1>
        <p className="text-sm text-gray-500">Manage consulting doctors and specialists</p>
      </div>

      {canManage && (
        <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">{editId ? 'Edit doctor' : 'Add doctor'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Specialization" value={form.specialization} onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
              {saving ? 'Saving…' : editId ? 'Update' : 'Add doctor'}
            </button>
            {editId && (
              <button type="button" onClick={resetForm} className="border border-gray-300 rounded-lg px-4 py-2 text-sm">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {!(doctors || []).length ? (
          <p className="text-center text-gray-500 py-8 text-sm">No doctors yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {(doctors || []).map((doc) => (
              <li key={doc.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{doc.name}</p>
                  <p className="text-xs text-gray-500">{doc.specialization || 'General'} · {doc.phone || '—'}</p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => onEdit(doc)} className="text-xs px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-800">Edit</button>
                    <button type="button" onClick={() => onDelete(doc)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700">Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HospitalManagementDoctorsPage;
