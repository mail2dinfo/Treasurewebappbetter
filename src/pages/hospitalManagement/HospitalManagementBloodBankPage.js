import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const toDate = (d) => d.toISOString().slice(0, 10);
const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDate(d);
};

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+'];
const COMPONENTS = ['WHOLE', 'PRBC', 'FFP', 'PLATELETS', 'CRYO'];
const PRIORITIES = ['ROUTINE', 'URGENT', 'EMERGENCY'];
const TABS = [
  { id: 'stock', label: 'Stock' },
  { id: 'collect', label: 'Collect' },
  { id: 'donors', label: 'Donors' },
  { id: 'requests', label: 'Requests' },
  { id: 'issue', label: 'Issue' },
  { id: 'alerts', label: 'Alerts' },
];

const emptyDonor = {
  name: '',
  phone: '',
  bloodGroup: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  lastDonationDate: '',
};

const emptyUnit = {
  donorId: '',
  bloodGroup: '',
  component: 'WHOLE',
  collectedDate: toDate(new Date()),
  expiryDate: addDays(42),
  volumeMl: '350',
  bagNumber: '',
};

const emptyRequest = {
  patientId: '',
  bloodGroup: '',
  component: 'WHOLE',
  unitsRequired: '1',
  priority: 'ROUTINE',
  notes: '',
};

const emptyIssue = {
  requestId: '',
  patientId: '',
  unitId: '',
  crossMatchResult: 'COMPATIBLE',
  notes: '',
};

const field = (row, ...keys) => {
  for (let i = 0; i < keys.length; i += 1) {
    const v = row[keys[i]];
    if (v != null && v !== '') return v;
  }
  return '';
};

const HospitalManagementBloodBankPage = () => {
  const {
    bloodDonors,
    bloodUnits,
    bloodRequests,
    bloodIssues,
    bloodStock,
    bloodAlerts,
    patients,
    fetchBloodDonors,
    createBloodDonor,
    updateBloodDonor,
    fetchBloodUnits,
    createBloodUnit,
    updateBloodUnitStatus,
    fetchBloodStock,
    fetchBloodRequests,
    createBloodRequest,
    updateBloodRequestStatus,
    fetchBloodIssues,
    createBloodIssue,
    returnBloodIssue,
    fetchBloodAlerts,
    fetchPatients,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_blood_bank_manage');

  const [tab, setTab] = useState('stock');
  const [saving, setSaving] = useState(false);
  const [donorForm, setDonorForm] = useState(emptyDonor);
  const [editDonorId, setEditDonorId] = useState(null);
  const [unitForm, setUnitForm] = useState(emptyUnit);
  const [newDonorInline, setNewDonorInline] = useState(false);
  const [requestForm, setRequestForm] = useState(emptyRequest);
  const [issueForm, setIssueForm] = useState(emptyIssue);
  const [returnIssueId, setReturnIssueId] = useState('');

  useEffect(() => {
    fetchBloodDonors();
    fetchBloodUnits();
    fetchBloodStock();
    fetchBloodRequests();
    fetchBloodIssues();
    fetchBloodAlerts();
    fetchPatients();
  }, [
    fetchBloodDonors,
    fetchBloodUnits,
    fetchBloodStock,
    fetchBloodRequests,
    fetchBloodIssues,
    fetchBloodAlerts,
    fetchPatients,
  ]);

  const patientName = (id) => (patients || []).find((p) => String(p.id) === String(id))?.name || `#${id}`;

  const availableUnits = useMemo(
    () => (bloodUnits || []).filter((u) => String(field(u, 'status')).toUpperCase() === 'AVAILABLE'),
    [bloodUnits],
  );

  const stockSummary = useMemo(() => {
    if (bloodStock && typeof bloodStock === 'object' && !Array.isArray(bloodStock)) {
      if (Array.isArray(bloodStock.summary)) return bloodStock.summary;
      if (Array.isArray(bloodStock.byGroup)) return bloodStock.byGroup;
    }
    if (Array.isArray(bloodStock)) return bloodStock;
    const map = {};
    availableUnits.forEach((u) => {
      const group = field(u, 'blood_group', 'bloodGroup') || 'Unknown';
      const component = field(u, 'component') || 'WHOLE';
      const key = `${group}|${component}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([key, count]) => {
      const [bloodGroup, component] = key.split('|');
      return { bloodGroup, component, count, available: count };
    });
  }, [bloodStock, availableUnits]);

  const refreshAll = async () => {
    await Promise.all([
      fetchBloodUnits(),
      fetchBloodStock(),
      fetchBloodAlerts(),
      fetchBloodRequests(),
      fetchBloodIssues(),
    ]);
  };

  const onDonorSubmit = async (e) => {
    e.preventDefault();
    if (!donorForm.name.trim()) return toast.error('Donor name required');
    if (!donorForm.bloodGroup) return toast.error('Blood group required');
    setSaving(true);
    const payload = {
      name: donorForm.name.trim(),
      phone: donorForm.phone.trim() || null,
      bloodGroup: donorForm.bloodGroup,
      gender: donorForm.gender || null,
      dateOfBirth: donorForm.dateOfBirth || null,
      address: donorForm.address.trim() || null,
      lastDonationDate: donorForm.lastDonationDate || null,
    };
    const result = editDonorId
      ? await updateBloodDonor(editDonorId, payload)
      : await createBloodDonor(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editDonorId ? 'Donor updated' : 'Donor added');
      setDonorForm(emptyDonor);
      setEditDonorId(null);
      setNewDonorInline(false);
    } else toast.error(result.error || 'Failed');
  };

  const onCollectSubmit = async (e) => {
    e.preventDefault();
    if (!unitForm.bloodGroup) return toast.error('Blood group required');
    if (!unitForm.collectedDate) return toast.error('Collection date required');
    setSaving(true);
    let donorId = unitForm.donorId;
    if (newDonorInline) {
      if (!donorForm.name.trim() || !donorForm.bloodGroup) {
        setSaving(false);
        return toast.error('Enter new donor name and blood group');
      }
      const donorResult = await createBloodDonor({
        name: donorForm.name.trim(),
        phone: donorForm.phone.trim() || null,
        bloodGroup: donorForm.bloodGroup,
        gender: donorForm.gender || null,
        dateOfBirth: donorForm.dateOfBirth || null,
        address: donorForm.address.trim() || null,
      });
      if (!donorResult.success) {
        setSaving(false);
        return toast.error(donorResult.error || 'Failed to create donor');
      }
      const created = Array.isArray(donorResult.data) ? donorResult.data[0] : donorResult.data;
      donorId = created?.id || '';
    }
    const result = await createBloodUnit({
      donorId: donorId || null,
      bloodGroup: unitForm.bloodGroup,
      component: unitForm.component,
      collectedDate: unitForm.collectedDate,
      expiryDate: unitForm.expiryDate || null,
      volumeMl: Number(unitForm.volumeMl) || null,
      bagNumber: unitForm.bagNumber.trim() || null,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Blood unit collected');
      setUnitForm(emptyUnit);
      setDonorForm(emptyDonor);
      setNewDonorInline(false);
      await refreshAll();
    } else toast.error(result.error || 'Failed');
  };

  const onDiscardUnit = async (id) => {
    if (!window.confirm('Discard this blood unit?')) return;
    const result = await updateBloodUnitStatus(id, 'DISCARDED');
    if (result.success) {
      toast.success('Unit discarded');
      await refreshAll();
    } else toast.error(result.error || 'Failed');
  };

  const onRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestForm.patientId) return toast.error('Select patient');
    if (!requestForm.bloodGroup) return toast.error('Blood group required');
    setSaving(true);
    const result = await createBloodRequest({
      patientId: requestForm.patientId,
      bloodGroup: requestForm.bloodGroup,
      component: requestForm.component,
      unitsRequired: Number(requestForm.unitsRequired) || 1,
      priority: requestForm.priority,
      notes: requestForm.notes.trim() || null,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Request created');
      setRequestForm(emptyRequest);
      await fetchBloodRequests();
    } else toast.error(result.error || 'Failed');
  };

  const onCancelRequest = async (id) => {
    const result = await updateBloodRequestStatus(id, 'CANCELLED');
    if (result.success) {
      toast.success('Request cancelled');
      await fetchBloodRequests();
    } else toast.error(result.error || 'Failed');
  };

  const pendingRequests = useMemo(
    () => (bloodRequests || []).filter((r) => {
      const status = String(field(r, 'status')).toUpperCase();
      return status === 'PENDING' || status === 'APPROVED';
    }),
    [bloodRequests],
  );

  const filteredUnitsForIssue = useMemo(() => {
    const req = pendingRequests.find((r) => String(r.id) === String(issueForm.requestId));
    const group = req
      ? field(req, 'blood_group', 'bloodGroup')
      : (patients || []).find((p) => String(p.id) === String(issueForm.patientId))?.blood_group
        || (patients || []).find((p) => String(p.id) === String(issueForm.patientId))?.bloodGroup;
    const component = req ? field(req, 'component') : null;
    return availableUnits.filter((u) => {
      const matchGroup = !group || field(u, 'blood_group', 'bloodGroup') === group;
      const matchComponent = !component || field(u, 'component') === component;
      return matchGroup && matchComponent;
    });
  }, [availableUnits, pendingRequests, issueForm.requestId, issueForm.patientId, patients]);

  const onIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueForm.unitId) return toast.error('Select blood unit');
    if (!issueForm.requestId && !issueForm.patientId) return toast.error('Select request or patient');
    if (issueForm.crossMatchResult !== 'COMPATIBLE') return toast.error('Cross-match must be COMPATIBLE');
    setSaving(true);
    const result = await createBloodIssue({
      requestId: issueForm.requestId || null,
      patientId: issueForm.patientId || null,
      unitId: issueForm.unitId,
      crossMatchResult: issueForm.crossMatchResult,
      notes: issueForm.notes.trim() || null,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Blood issued');
      setIssueForm(emptyIssue);
      await refreshAll();
    } else toast.error(result.error || 'Failed');
  };

  const onReturnIssue = async (e) => {
    e.preventDefault();
    if (!returnIssueId) return toast.error('Select issue to return');
    setSaving(true);
    const result = await returnBloodIssue({ issueId: returnIssueId });
    setSaving(false);
    if (result.success) {
      toast.success('Unit returned');
      setReturnIssueId('');
      await refreshAll();
    } else toast.error(result.error || 'Failed');
  };

  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm w-full';
  const btnCls = 'bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50';

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Blood Bank</h1>
        <p className="text-sm text-gray-500">Donors, stock, requests & issues</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              tab === t.id ? 'border-cyan-700 text-cyan-800' : 'border-transparent text-gray-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stock' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {BLOOD_GROUPS.map((group) => {
              const count = stockSummary
                .filter((s) => (s.bloodGroup || s.blood_group) === group)
                .reduce((sum, s) => sum + Number(s.count ?? s.available ?? 0), 0);
              return (
                <div key={group} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
                  <p className="text-2xl font-bold text-cyan-800">{count}</p>
                  <p className="text-xs font-medium text-gray-600 mt-1">{group}</p>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <div className="px-4 py-2 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Available units</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Bag #</th>
                  <th className="px-4 py-2">Group</th>
                  <th className="px-4 py-2">Component</th>
                  <th className="px-4 py-2">Collected</th>
                  <th className="px-4 py-2">Expiry</th>
                  <th className="px-4 py-2">Vol (ml)</th>
                  {canManage && <th className="px-4 py-2">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {availableUnits.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2">{field(u, 'bag_number', 'bagNumber') || `#${u.id}`}</td>
                    <td className="px-4 py-2">{field(u, 'blood_group', 'bloodGroup')}</td>
                    <td className="px-4 py-2">{field(u, 'component')}</td>
                    <td className="px-4 py-2">{field(u, 'collected_date', 'collectedDate') || '—'}</td>
                    <td className="px-4 py-2">{field(u, 'expiry_date', 'expiryDate') || '—'}</td>
                    <td className="px-4 py-2">{field(u, 'volume_ml', 'volumeMl') || '—'}</td>
                    {canManage && (
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => onDiscardUnit(u.id)} className="text-red-600 text-xs font-medium">
                          Discard
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {!availableUnits.length && (
                  <tr><td colSpan={canManage ? 7 : 6} className="px-4 py-4 text-center text-gray-500">No available units</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'collect' && canManage && (
        <form onSubmit={onCollectSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Collect blood unit</h2>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={!newDonorInline} onChange={() => setNewDonorInline(false)} />
              Existing donor
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={newDonorInline} onChange={() => setNewDonorInline(true)} />
              New donor
            </label>
          </div>
          {!newDonorInline ? (
            <select className={inputCls} value={unitForm.donorId} onChange={(e) => setUnitForm((f) => ({ ...f, donorId: e.target.value }))}>
              <option value="">Donor (optional)</option>
              {(bloodDonors || []).map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({field(d, 'blood_group', 'bloodGroup')})</option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-gray-100 rounded-lg p-3">
              <input className={inputCls} placeholder="Donor name *" value={donorForm.name} onChange={(e) => setDonorForm((f) => ({ ...f, name: e.target.value }))} />
              <input className={inputCls} placeholder="Phone" value={donorForm.phone} onChange={(e) => setDonorForm((f) => ({ ...f, phone: e.target.value }))} />
              <select className={inputCls} value={donorForm.bloodGroup} onChange={(e) => setDonorForm((f) => ({ ...f, bloodGroup: e.target.value }))} required>
                <option value="">Blood group *</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <select className={inputCls} value={donorForm.gender} onChange={(e) => setDonorForm((f) => ({ ...f, gender: e.target.value }))}>
                <option value="">Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select className={inputCls} value={unitForm.bloodGroup} onChange={(e) => setUnitForm((f) => ({ ...f, bloodGroup: e.target.value }))} required>
              <option value="">Blood group *</option>
              {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select className={inputCls} value={unitForm.component} onChange={(e) => setUnitForm((f) => ({ ...f, component: e.target.value }))}>
              {COMPONENTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className={inputCls} placeholder="Bag number" value={unitForm.bagNumber} onChange={(e) => setUnitForm((f) => ({ ...f, bagNumber: e.target.value }))} />
            <input type="date" className={inputCls} value={unitForm.collectedDate} onChange={(e) => setUnitForm((f) => ({ ...f, collectedDate: e.target.value }))} required />
            <input type="date" className={inputCls} value={unitForm.expiryDate} onChange={(e) => setUnitForm((f) => ({ ...f, expiryDate: e.target.value }))} />
            <input className={inputCls} placeholder="Volume (ml)" value={unitForm.volumeMl} onChange={(e) => setUnitForm((f) => ({ ...f, volumeMl: e.target.value }))} />
          </div>
          <button type="submit" disabled={saving} className={btnCls}>Collect unit</button>
        </form>
      )}

      {tab === 'collect' && !canManage && (
        <p className="text-sm text-gray-500">You have view-only access to blood bank.</p>
      )}

      {tab === 'donors' && (
        <>
          {canManage && (
            <form onSubmit={onDonorSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">{editDonorId ? 'Edit donor' : 'Add donor'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Name *" value={donorForm.name} onChange={(e) => setDonorForm((f) => ({ ...f, name: e.target.value }))} />
                <input className={inputCls} placeholder="Phone" value={donorForm.phone} onChange={(e) => setDonorForm((f) => ({ ...f, phone: e.target.value }))} />
                <select className={inputCls} value={donorForm.bloodGroup} onChange={(e) => setDonorForm((f) => ({ ...f, bloodGroup: e.target.value }))} required>
                  <option value="">Blood group *</option>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <select className={inputCls} value={donorForm.gender} onChange={(e) => setDonorForm((f) => ({ ...f, gender: e.target.value }))}>
                  <option value="">Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
                <input type="date" className={inputCls} value={donorForm.dateOfBirth} onChange={(e) => setDonorForm((f) => ({ ...f, dateOfBirth: e.target.value }))} />
                <input type="date" className={inputCls} value={donorForm.lastDonationDate} onChange={(e) => setDonorForm((f) => ({ ...f, lastDonationDate: e.target.value }))} />
                <input className={`${inputCls} sm:col-span-2`} placeholder="Address" value={donorForm.address} onChange={(e) => setDonorForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className={btnCls}>{editDonorId ? 'Update' : 'Add donor'}</button>
                {editDonorId && (
                  <button type="button" onClick={() => { setEditDonorId(null); setDonorForm(emptyDonor); }} className="text-sm text-gray-600">Cancel</button>
                )}
              </div>
            </form>
          )}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Phone</th>
                  <th className="px-4 py-2">Group</th>
                  <th className="px-4 py-2">Last donation</th>
                  {canManage && <th className="px-4 py-2">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(bloodDonors || []).map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-2">{d.name}</td>
                    <td className="px-4 py-2">{d.phone || '—'}</td>
                    <td className="px-4 py-2">{field(d, 'blood_group', 'bloodGroup')}</td>
                    <td className="px-4 py-2">{field(d, 'last_donation_date', 'lastDonationDate') || '—'}</td>
                    {canManage && (
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditDonorId(d.id);
                            setDonorForm({
                              name: d.name || '',
                              phone: d.phone || '',
                              bloodGroup: field(d, 'blood_group', 'bloodGroup'),
                              gender: d.gender || '',
                              dateOfBirth: field(d, 'date_of_birth', 'dateOfBirth') || '',
                              address: d.address || '',
                              lastDonationDate: field(d, 'last_donation_date', 'lastDonationDate') || '',
                            });
                          }}
                          className="text-cyan-700 text-xs font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'requests' && (
        <>
          {canManage && (
            <form onSubmit={onRequestSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">New blood request</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select className={inputCls} value={requestForm.patientId} onChange={(e) => setRequestForm((f) => ({ ...f, patientId: e.target.value }))} required>
                  <option value="">Patient *</option>
                  {(patients || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className={inputCls} value={requestForm.bloodGroup} onChange={(e) => setRequestForm((f) => ({ ...f, bloodGroup: e.target.value }))} required>
                  <option value="">Blood group *</option>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <select className={inputCls} value={requestForm.component} onChange={(e) => setRequestForm((f) => ({ ...f, component: e.target.value }))}>
                  {COMPONENTS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input className={inputCls} type="number" min="1" placeholder="Units required" value={requestForm.unitsRequired} onChange={(e) => setRequestForm((f) => ({ ...f, unitsRequired: e.target.value }))} />
                <select className={inputCls} value={requestForm.priority} onChange={(e) => setRequestForm((f) => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <input className={inputCls} placeholder="Notes" value={requestForm.notes} onChange={(e) => setRequestForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <button type="submit" disabled={saving} className={btnCls}>Create request</button>
            </form>
          )}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Patient</th>
                  <th className="px-4 py-2">Group</th>
                  <th className="px-4 py-2">Component</th>
                  <th className="px-4 py-2">Units</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Status</th>
                  {canManage && <th className="px-4 py-2">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(bloodRequests || []).map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2">{patientName(field(r, 'patient_id', 'patientId'))}</td>
                    <td className="px-4 py-2">{field(r, 'blood_group', 'bloodGroup')}</td>
                    <td className="px-4 py-2">{field(r, 'component')}</td>
                    <td className="px-4 py-2">{field(r, 'units_required', 'unitsRequired')}</td>
                    <td className="px-4 py-2">{field(r, 'priority')}</td>
                    <td className="px-4 py-2">{field(r, 'status') || 'PENDING'}</td>
                    {canManage && (
                      <td className="px-4 py-2">
                        {['PENDING', 'APPROVED'].includes(String(field(r, 'status')).toUpperCase()) && (
                          <button type="button" onClick={() => onCancelRequest(r.id)} className="text-red-600 text-xs font-medium">Cancel</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'issue' && (
        <>
          {canManage && (
            <form onSubmit={onIssueSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Issue blood unit</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select className={inputCls} value={issueForm.requestId} onChange={(e) => setIssueForm((f) => ({ ...f, requestId: e.target.value, unitId: '' }))}>
                  <option value="">Request (optional)</option>
                  {pendingRequests.map((r) => (
                    <option key={r.id} value={r.id}>
                      #{r.id} — {patientName(field(r, 'patient_id', 'patientId'))} ({field(r, 'blood_group', 'bloodGroup')} {field(r, 'component')})
                    </option>
                  ))}
                </select>
                <select className={inputCls} value={issueForm.patientId} onChange={(e) => setIssueForm((f) => ({ ...f, patientId: e.target.value, unitId: '' }))} disabled={Boolean(issueForm.requestId)}>
                  <option value="">Patient (if no request)</option>
                  {(patients || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className={inputCls} value={issueForm.unitId} onChange={(e) => setIssueForm((f) => ({ ...f, unitId: e.target.value }))} required>
                  <option value="">Available unit *</option>
                  {filteredUnitsForIssue.map((u) => (
                    <option key={u.id} value={u.id}>
                      {field(u, 'bag_number', 'bagNumber') || `#${u.id}`} — {field(u, 'blood_group', 'bloodGroup')} {field(u, 'component')} (exp {field(u, 'expiry_date', 'expiryDate')})
                    </option>
                  ))}
                </select>
                <select className={inputCls} value={issueForm.crossMatchResult} onChange={(e) => setIssueForm((f) => ({ ...f, crossMatchResult: e.target.value }))}>
                  <option value="COMPATIBLE">COMPATIBLE</option>
                  <option value="INCOMPATIBLE">INCOMPATIBLE</option>
                </select>
                <input className={`${inputCls} sm:col-span-2`} placeholder="Notes" value={issueForm.notes} onChange={(e) => setIssueForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <button type="submit" disabled={saving || issueForm.crossMatchResult !== 'COMPATIBLE'} className={btnCls}>Issue unit</button>
            </form>
          )}

          {canManage && (
            <form onSubmit={onReturnIssue} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">Return issued unit</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <select className={inputCls} value={returnIssueId} onChange={(e) => setReturnIssueId(e.target.value)}>
                  <option value="">Select issue *</option>
                  {(bloodIssues || []).filter((i) => String(field(i, 'status')).toUpperCase() !== 'RETURNED').map((i) => (
                    <option key={i.id} value={i.id}>
                      #{i.id} — {patientName(field(i, 'patient_id', 'patientId'))} / unit #{field(i, 'unit_id', 'unitId')}
                    </option>
                  ))}
                </select>
                <button type="submit" disabled={saving} className={`${btnCls} shrink-0`}>Return</button>
              </div>
            </form>
          )}

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <div className="px-4 py-2 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Issue history</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Patient</th>
                  <th className="px-4 py-2">Unit</th>
                  <th className="px-4 py-2">Cross-match</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(bloodIssues || []).map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2">{field(i, 'issued_at', 'issuedAt', 'created_at', 'createdAt') || '—'}</td>
                    <td className="px-4 py-2">{patientName(field(i, 'patient_id', 'patientId'))}</td>
                    <td className="px-4 py-2">{field(i, 'bag_number', 'bagNumber') || `#${field(i, 'unit_id', 'unitId')}`}</td>
                    <td className="px-4 py-2">{field(i, 'cross_match_result', 'crossMatchResult')}</td>
                    <td className="px-4 py-2">{field(i, 'status') || 'ISSUED'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'alerts' && (
        <div className="space-y-3">
          {(bloodAlerts || []).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-sm text-gray-500">No alerts</div>
          ) : (
            (bloodAlerts || []).map((alert, idx) => {
              const type = field(alert, 'type', 'alertType') || 'ALERT';
              const isExpiring = String(type).toUpperCase().includes('EXPIR');
              return (
                <div
                  key={alert.id || idx}
                  className={`rounded-xl border px-4 py-3 shadow-sm ${
                    isExpiring ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <p className={`text-sm font-semibold ${isExpiring ? 'text-amber-900' : 'text-red-900'}`}>
                    {type.replace(/_/g, ' ')}
                  </p>
                  <p className={`text-xs mt-1 ${isExpiring ? 'text-amber-800' : 'text-red-800'}`}>
                    {field(alert, 'message')
                      || `${field(alert, 'blood_group', 'bloodGroup') || '—'} ${field(alert, 'component') || ''} — ${field(alert, 'count') || field(alert, 'units') || ''} unit(s)`}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default HospitalManagementBloodBankPage;
