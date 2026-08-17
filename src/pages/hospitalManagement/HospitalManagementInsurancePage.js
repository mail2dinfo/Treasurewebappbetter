import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const toDate = (d) => d.toISOString().slice(0, 10);
const CLAIM_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID'];

const HospitalManagementInsurancePage = () => {
  const {
    insurers,
    insuranceClaims,
    patients,
    fetchInsurers,
    createInsurer,
    updateInsurer,
    fetchInsuranceClaims,
    createInsuranceClaim,
    updateInsuranceClaimStatus,
    fetchPatients,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_insurance_manage');

  const [tab, setTab] = useState('claims');
  const [insurerForm, setInsurerForm] = useState({ name: '', contactPhone: '', contactEmail: '' });
  const [editInsurerId, setEditInsurerId] = useState(null);
  const [claimForm, setClaimForm] = useState({ patientId: '', insurerId: '', claimDate: toDate(new Date()), claimAmount: '', policyNo: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInsurers();
    fetchInsuranceClaims();
    fetchPatients();
  }, [fetchInsurers, fetchInsuranceClaims, fetchPatients]);

  const onInsurerSubmit = async (e) => {
    e.preventDefault();
    if (!insurerForm.name.trim()) return toast.error('Insurer name required');
    setSaving(true);
    const payload = {
      name: insurerForm.name.trim(),
      contactPhone: insurerForm.contactPhone.trim() || null,
      contactEmail: insurerForm.contactEmail.trim() || null,
    };
    const result = editInsurerId ? await updateInsurer(editInsurerId, payload) : await createInsurer(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editInsurerId ? 'Insurer updated' : 'Insurer added');
      setInsurerForm({ name: '', contactPhone: '', contactEmail: '' });
      setEditInsurerId(null);
    } else toast.error(result.error || 'Failed');
  };

  const onClaimSubmit = async (e) => {
    e.preventDefault();
    if (!claimForm.patientId || !claimForm.insurerId) return toast.error('Select patient and insurer');
    setSaving(true);
    const result = await createInsuranceClaim({
      patientId: claimForm.patientId,
      insurerId: claimForm.insurerId,
      claimDate: claimForm.claimDate,
      claimAmount: Number(claimForm.claimAmount) || 0,
      policyNo: claimForm.policyNo.trim() || null,
      notes: claimForm.notes.trim() || null,
      status: 'DRAFT',
    });
    setSaving(false);
    if (result.success) {
      toast.success('Claim created');
      setClaimForm({ patientId: '', insurerId: '', claimDate: toDate(new Date()), claimAmount: '', policyNo: '', notes: '' });
    } else toast.error(result.error || 'Failed');
  };

  const onStatusChange = async (id, status) => {
    const result = await updateInsuranceClaimStatus(id, status);
    if (result.success) toast.success('Status updated');
    else toast.error(result.error || 'Failed');
  };

  const patientName = (id) => (patients || []).find((p) => String(p.id) === String(id))?.name || `#${id}`;
  const insurerName = (id) => (insurers || []).find((i) => String(i.id) === String(id))?.name || `#${id}`;
  const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Insurance</h1>
        <p className="text-sm text-gray-500">Insurers & claims management</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {['claims', 'insurers'].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-cyan-700 text-cyan-800' : 'border-transparent text-gray-500'}`}>
            {t === 'claims' ? 'Claims' : 'Insurers'}
          </button>
        ))}
      </div>

      {tab === 'insurers' && (
        <>
          {canManage && (
            <form onSubmit={onInsurerSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">{editInsurerId ? 'Edit insurer' : 'Add insurer'}</h2>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" value={insurerForm.name} onChange={(e) => setInsurerForm((f) => ({ ...f, name: e.target.value }))} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Phone" value={insurerForm.contactPhone} onChange={(e) => setInsurerForm((f) => ({ ...f, contactPhone: e.target.value }))} />
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Email" value={insurerForm.contactEmail} onChange={(e) => setInsurerForm((f) => ({ ...f, contactEmail: e.target.value }))} />
              </div>
              <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium">{editInsurerId ? 'Update' : 'Add insurer'}</button>
            </form>
          )}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Phone</th><th className="px-4 py-2">Email</th>{canManage && <th className="px-4 py-2">Action</th>}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(insurers || []).map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2">{i.name}</td>
                    <td className="px-4 py-2">{i.contact_phone || i.contactPhone || '—'}</td>
                    <td className="px-4 py-2">{i.contact_email || i.contactEmail || '—'}</td>
                    {canManage && (
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => { setEditInsurerId(i.id); setInsurerForm({ name: i.name || '', contactPhone: i.contact_phone || i.contactPhone || '', contactEmail: i.contact_email || i.contactEmail || '' }); }} className="text-cyan-700 text-xs font-medium">Edit</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'claims' && (
        <>
          {canManage && (
            <form onSubmit={onClaimSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">New claim</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={claimForm.patientId} onChange={(e) => setClaimForm((f) => ({ ...f, patientId: e.target.value }))} required>
                  <option value="">Patient *</option>
                  {(patients || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={claimForm.insurerId} onChange={(e) => setClaimForm((f) => ({ ...f, insurerId: e.target.value }))} required>
                  <option value="">Insurer *</option>
                  {(insurers || []).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={claimForm.claimDate} onChange={(e) => setClaimForm((f) => ({ ...f, claimDate: e.target.value }))} />
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Claim amount" value={claimForm.claimAmount} onChange={(e) => setClaimForm((f) => ({ ...f, claimAmount: e.target.value }))} />
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Policy no." value={claimForm.policyNo} onChange={(e) => setClaimForm((f) => ({ ...f, policyNo: e.target.value }))} />
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Notes" value={claimForm.notes} onChange={(e) => setClaimForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium">Create claim</button>
            </form>
          )}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Patient</th><th className="px-4 py-2">Insurer</th><th className="px-4 py-2">Amount</th><th className="px-4 py-2">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(insuranceClaims || []).map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">{c.claim_date || c.claimDate || '—'}</td>
                    <td className="px-4 py-2">{patientName(c.patient_id ?? c.patientId)}</td>
                    <td className="px-4 py-2">{insurerName(c.insurer_id ?? c.insurerId)}</td>
                    <td className="px-4 py-2">{rs(c.claim_amount ?? c.claimAmount)}</td>
                    <td className="px-4 py-2">
                      {canManage ? (
                        <select className="border border-gray-300 rounded px-2 py-1 text-xs" value={c.status || 'DRAFT'} onChange={(e) => onStatusChange(c.id, e.target.value)}>
                          {CLAIM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (c.status || 'DRAFT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default HospitalManagementInsurancePage;
