import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiMapPin, FiPhone, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const PAGE_SIZE = 10;
const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const emptyForm = { name: '', phone: '', gender: '', age: '', bloodGroup: '', address: '' };

const valueOf = (...values) => {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
};
const patientList = (patients) => {
  if (Array.isArray(patients)) return patients;
  if (Array.isArray(patients?.results)) return patients.results;
  if (Array.isArray(patients?.rows)) return patients.rows;
  return [];
};
const genderLabel = (value) => {
  const found = GENDERS.find((item) => item.value === String(value || '').toUpperCase());
  return found?.label || valueOf(value) || '—';
};

const HospitalManagementPatientsPage = () => {
  const { patients, fetchPatients, createPatient, updatePatient, deletePatient } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_patient_manage');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error('Patient name required');
    const phoneDigits = String(form.phone || '').replace(/\D/g, '');
    if (phoneDigits.length !== 10) return toast.error('10-digit phone is required for patient portal login');
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      phone: phoneDigits,
      gender: form.gender || null,
      age: form.age ? Number(form.age) : null,
      bloodGroup: form.bloodGroup || null,
      address: form.address.trim() || null,
    };
    const result = editId ? await updatePatient(editId, payload) : await createPatient(payload);
    setSaving(false);
    if (result.success) {
      const hint = result.data?.loginHint?.defaultPassword;
      toast.success(
        editId
          ? 'Patient updated'
          : hint
            ? `Patient registered. Portal password is ${hint} (first 4 digits of the phone) unless you change it.`
            : 'Patient registered. Portal password is the first 4 digits of the phone unless another password was set.'
      );
      resetForm();
    } else toast.error(result.error || 'Failed');
  };

  const onEdit = (patient) => {
    setEditId(patient.id);
    setForm({
      name: patient.name || '',
      phone: patient.phone || '',
      gender: String(patient.gender || '').toUpperCase(),
      age: patient.age != null ? String(patient.age) : '',
      bloodGroup: patient.blood_group || patient.bloodGroup || '',
      address: patient.address || '',
    });
    setShowForm(true);
  };

  const onDelete = async (patient) => {
    if (!window.confirm(`Remove ${patient.name}?`)) return;
    const result = await deletePatient(patient.id);
    if (result.success) toast.success('Patient removed');
    else toast.error(result.error || 'Failed');
  };

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = patientList(patients);
    if (!term) return rows;
    return rows.filter((patient) => {
      const haystack = [
        patient.name,
        patient.phone,
        patient.gender,
        patient.age,
        patient.blood_group,
        patient.bloodGroup,
        patient.address,
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [patients, search]);

  const pageCount = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE));
  const pagedPatients = useMemo(
    () => filteredPatients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredPatients, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Patients</h1>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-cyan-800"
          >
            <FiPlus /> Add new patient
          </button>
        )}
      </div>

      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm bg-white"
          placeholder="Search patients by name, phone, gender, blood group or address"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {!filteredPatients.length ? (
          <div className="py-10 text-center text-sm text-gray-500">No patients found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Patient name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Blood group</th>
                    <th className="px-4 py-3">Address</th>
                    <th className="px-4 py-3">Status</th>
                    {canManage && <th className="px-4 py-3 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedPatients.map((patient) => (
                    <tr key={patient.id} className="align-top hover:bg-cyan-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-sm font-bold text-cyan-800">
                            {String(patient.name || 'P').slice(0, 1).toUpperCase()}
                          </span>
                          <span className="font-semibold text-gray-900 whitespace-nowrap">{patient.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {valueOf(patient.phone) ? (
                          <span className="inline-flex items-center gap-1.5 text-gray-800"><FiPhone className="text-gray-400" /> {valueOf(patient.phone)}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{genderLabel(patient.gender)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{patient.age != null && patient.age !== '' ? `${patient.age} yrs` : '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-cyan-800">{valueOf(patient.blood_group, patient.bloodGroup) || '—'}</td>
                      <td className="px-4 py-3">
                        {valueOf(patient.address) ? (
                          <span className="inline-flex items-start gap-1.5 text-gray-800"><FiMapPin className="mt-0.5 shrink-0 text-gray-400" /> {valueOf(patient.address)}</span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${Number(patient.status) === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {Number(patient.status) === 0 ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => onEdit(patient)} className="text-xs px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-800">Edit</button>
                            <button type="button" onClick={() => onDelete(patient)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700">Delete</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
              <span className="text-gray-600">
                Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
                <strong>{Math.min(page * PAGE_SIZE, filteredPatients.length)}</strong> of <strong>{filteredPatients.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-gray-600">Page {page} of {pageCount}</span>
                <button
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
              <h2 className="text-base font-semibold text-gray-900">{editId ? 'Edit patient' : 'Add new patient'}</h2>
              <button type="button" onClick={resetForm} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                <FiX />
              </button>
            </div>
            <form onSubmit={onSubmit} className="p-5 space-y-3">
              <label className="block text-sm">
                <span className="text-gray-600">Patient name *</span>
                <input
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="text-gray-600">Phone *</span>
                  <input
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    required
                    placeholder="10-digit mobile"
                  />
                  {!editId && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      Portal login uses this phone. Default password is the first 4 digits.
                    </p>
                  )}
                </label>
                <label className="text-sm">
                  <span className="text-gray-600">Gender</span>
                  <select
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    value={form.gender}
                    onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="text-gray-600">Age</span>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    value={form.age}
                    onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="text-gray-600">Blood group</span>
                  <select
                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                    value={form.bloodGroup}
                    onChange={(event) => setForm((current) => ({ ...current, bloodGroup: event.target.value }))}
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                <span className="text-gray-600">Address</span>
                <textarea
                  rows={3}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                />
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={resetForm} className="border border-gray-300 rounded-lg px-4 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-cyan-800 disabled:opacity-60">
                  {saving ? 'Saving…' : editId ? 'Update patient' : 'Save patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagementPatientsPage;
