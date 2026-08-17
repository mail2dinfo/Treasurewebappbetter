import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const HospitalManagementWardsBedsPage = () => {
  const {
    wards,
    beds,
    fetchWards,
    fetchBeds,
    createWard,
    createBed,
    updateBed,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManageWard = can('hh_ward_manage');
  const canManageBed = can('hh_bed_manage');
  const [wardForm, setWardForm] = useState({ name: '', floor: '', wardType: 'GENERAL' });
  const [bedForm, setBedForm] = useState({ wardId: '', bedNumber: '', bedType: 'STANDARD' });
  const [wardFilter, setWardFilter] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWards();
  }, [fetchWards]);

  useEffect(() => {
    fetchBeds(wardFilter ? { wardId: wardFilter } : {});
  }, [fetchBeds, wardFilter]);

  const onWardSubmit = async (e) => {
    e.preventDefault();
    if (!wardForm.name.trim()) return toast.error('Ward name required');
    setSaving(true);
    const result = await createWard({
      name: wardForm.name.trim(),
      floor: wardForm.floor.trim() || null,
      wardType: wardForm.wardType,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Ward added');
      setWardForm({ name: '', floor: '', wardType: 'GENERAL' });
    } else toast.error(result.error || 'Failed');
  };

  const onBedSubmit = async (e) => {
    e.preventDefault();
    if (!bedForm.wardId) return toast.error('Select ward');
    if (!bedForm.bedNumber.trim()) return toast.error('Bed number required');
    setSaving(true);
    const result = await createBed({
      wardId: bedForm.wardId,
      bedNumber: bedForm.bedNumber.trim(),
      bedType: bedForm.bedType,
      status: 'AVAILABLE',
    });
    setSaving(false);
    if (result.success) {
      toast.success('Bed added');
      setBedForm((f) => ({ ...f, bedNumber: '' }));
    } else toast.error(result.error || 'Failed');
  };

  const toggleBedStatus = async (bed) => {
    const next = bed.status === 'AVAILABLE' ? 'MAINTENANCE' : 'AVAILABLE';
    const result = await updateBed(bed.id, { status: next });
    if (result.success) toast.success('Bed updated');
    else toast.error(result.error || 'Failed');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Wards & Beds</h1>
        <p className="text-sm text-gray-500">Manage wards and bed inventory</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {canManageWard && (
          <form onSubmit={onWardSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Add ward</h2>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Ward name *" value={wardForm.name} onChange={(e) => setWardForm((f) => ({ ...f, name: e.target.value }))} />
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Floor" value={wardForm.floor} onChange={(e) => setWardForm((f) => ({ ...f, floor: e.target.value }))} />
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={wardForm.wardType} onChange={(e) => setWardForm((f) => ({ ...f, wardType: e.target.value }))}>
              <option value="GENERAL">General</option>
              <option value="ICU">ICU</option>
              <option value="PEDIATRIC">Pediatric</option>
              <option value="MATERNITY">Maternity</option>
            </select>
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">Add ward</button>
          </form>
        )}

        {canManageBed && (
          <form onSubmit={onBedSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Add bed</h2>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={bedForm.wardId} onChange={(e) => setBedForm((f) => ({ ...f, wardId: e.target.value }))}>
              <option value="">Ward *</option>
              {(wards || []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Bed number *" value={bedForm.bedNumber} onChange={(e) => setBedForm((f) => ({ ...f, bedNumber: e.target.value }))} />
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">Add bed</button>
          </form>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-sm font-semibold text-gray-900">Beds</h2>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white w-full sm:w-48" value={wardFilter} onChange={(e) => setWardFilter(e.target.value)}>
            <option value="">All wards</option>
            {(wards || []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {(beds || []).map((bed) => {
            const occupied = bed.status === 'OCCUPIED';
            const maintenance = bed.status === 'MAINTENANCE';
            return (
              <div
                key={bed.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  occupied ? 'border-red-200 bg-red-50' : maintenance ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
                }`}
              >
                <p className="font-semibold text-gray-900">{bed.bed_number || bed.bedNumber}</p>
                <p className="text-xs text-gray-600">{bed.ward_name || bed.wardName || '—'}</p>
                <p className="text-xs mt-1 font-medium">{bed.status}</p>
                {canManageBed && bed.status !== 'OCCUPIED' && (
                  <button type="button" onClick={() => toggleBedStatus(bed)} className="text-[10px] mt-1 text-cyan-700 underline">
                    Toggle status
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {!(beds || []).length && <p className="text-center text-gray-500 py-4 text-sm">No beds yet.</p>}
      </div>
    </div>
  );
};

export default HospitalManagementWardsBedsPage;
