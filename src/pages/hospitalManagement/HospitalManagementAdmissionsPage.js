import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';
import HhAdmitRoomPicker, { sortBedsByPrice } from '../../components/hospitalManagement/HhAdmitRoomPicker';

const toDate = (d) => d.toISOString().slice(0, 10);
const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const emptyMedLine = () => ({ medicineId: '', name: '', qty: 1, dosage: '' });
const emptyFoodLine = () => ({ productId: '', name: '', qty: 1, unitPrice: '' });

const HospitalManagementAdmissionsPage = () => {
  const {
    admissions,
    patients,
    beds,
    doctors,
    medicines,
    ipdAccount,
    ipdCharges,
    fetchAdmissions,
    fetchPatients,
    fetchBeds,
    fetchDoctors,
    fetchMedicines,
    createAdmission,
    dischargeAdmission,
    fetchIpdAccounts,
    fetchIpdAccount,
    fetchIpdCharges,
    addIpdCharge,
    addIpdWardMedicines,
    updateDischargeSummary,
    settleIpdAccount,
    kitchenProducts,
    fetchKitchenProducts,
    createKitchenOrder,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_admission_manage');
  const canOrderFood = can('hh_kitchen_order');
  const [form, setForm] = useState({
    patientId: '',
    bedId: '',
    doctorId: '',
    admissionDate: toDate(new Date()),
    diagnosis: '',
    patientWish: '',
  });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [chargeForm, setChargeForm] = useState({ description: '', amount: '', chargeType: 'OTHER' });
  const [medLines, setMedLines] = useState([emptyMedLine()]);
  const [foodLines, setFoodLines] = useState([emptyFoodLine()]);
  const [foodOrderType, setFoodOrderType] = useState('WARD');
  const [foodSpecial, setFoodSpecial] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchAdmissions();
    fetchPatients();
    fetchBeds({ status: 'VACANT' });
    fetchDoctors();
    fetchMedicines();
    fetchKitchenProducts({ activeOnly: true });
  }, [fetchAdmissions, fetchPatients, fetchBeds, fetchDoctors, fetchMedicines, fetchKitchenProducts]);

  const loadIpdAccount = async (admission) => {
    if (expandedId === admission.id) {
      setExpandedId(null);
      setAccountId(null);
      return;
    }
    setExpandedId(admission.id);
    setBusy(true);
    const list = await fetchIpdAccounts({ admissionId: admission.id });
    const acct = list.success && Array.isArray(list.data) ? list.data[0] : list.data;
    if (acct?.id) {
      setAccountId(acct.id);
      await fetchIpdAccount(acct.id);
      await fetchIpdCharges(acct.id);
      setDischargeSummary(acct.discharge_summary || acct.dischargeSummary || '');
    } else {
      setAccountId(null);
      toast.info('No IPD account found for this admission yet');
    }
    setBusy(false);
  };

  const onAdmit = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.bedId) return toast.error('Patient and room required');
    setSaving(true);
    const result = await createAdmission({
      patientId: form.patientId,
      bedId: form.bedId,
      doctorId: form.doctorId || null,
      admissionDate: form.admissionDate,
      notes: form.diagnosis.trim() || null,
      patientWish: form.patientWish.trim() || null,
      doctorAdvice: form.diagnosis.trim() || null,
    });
    setSaving(false);
    if (result.success) {
      const ip =
        result.data?.ip_number ||
        result.data?.ipNumber ||
        result.data?.admission?.ip_number ||
        result.data?.admission?.ipNumber;
      toast.success(ip ? `Admitted — IP ${ip}` : 'Patient admitted — room charge on IPD account');
      setForm({
        patientId: '',
        bedId: '',
        doctorId: '',
        admissionDate: toDate(new Date()),
        diagnosis: '',
        patientWish: '',
      });
      fetchAdmissions();
      fetchBeds({ status: 'VACANT' });
    } else toast.error(result.error || 'Failed');
  };

  const onDischarge = async (adm) => {
    if (!window.confirm(`Discharge ${adm.patient_name || adm.patientName}?`)) return;
    const result = await dischargeAdmission(adm.id, { dischargeDate: toDate(new Date()) });
    if (result.success) {
      toast.success('Patient discharged');
      fetchAdmissions();
      fetchBeds({ status: 'AVAILABLE' });
    } else toast.error(result.error || 'Failed');
  };

  const onAddCharge = async (e) => {
    e.preventDefault();
    if (!accountId) return;
    if (!chargeForm.description.trim() || !chargeForm.amount) return toast.error('Description and amount required');
    setBusy(true);
    const result = await addIpdCharge(accountId, {
      description: chargeForm.description.trim(),
      amount: Number(chargeForm.amount),
      chargeType: chargeForm.chargeType,
    });
    setBusy(false);
    if (result.success) {
      toast.success('Charge added');
      setChargeForm({ description: '', amount: '', chargeType: 'OTHER' });
    } else toast.error(result.error || 'Failed');
  };

  const onAddWardMeds = async (e) => {
    e.preventDefault();
    if (!accountId) return;
    const items = medLines
      .filter((l) => l.name.trim() || l.medicineId)
      .map((l) => ({
        medicineId: l.medicineId || null,
        name: l.name.trim() || null,
        qty: Number(l.qty) || 1,
        dosage: l.dosage.trim() || null,
      }));
    if (!items.length) return toast.error('Add at least one medicine');
    setBusy(true);
    const result = await addIpdWardMedicines(accountId, { items });
    setBusy(false);
    if (result.success) {
      toast.success('Ward medicines added');
      setMedLines([emptyMedLine()]);
    } else toast.error(result.error || 'Failed');
  };

  const onAddFood = async (e) => {
    e.preventDefault();
    if (!accountId) return;
    const items = foodLines
      .filter((l) => l.productId || l.name.trim())
      .map((l) => ({
        productId: l.productId || null,
        productName: l.name.trim() || null,
        qty: Number(l.qty) || 1,
        unitPrice: l.unitPrice !== '' ? Number(l.unitPrice) : undefined,
      }));
    if (!items.length) return toast.error('Add at least one food item');
    setBusy(true);
    const result = await createKitchenOrder({
      ipdAccountId: accountId,
      orderType: foodOrderType,
      specialRequest: foodSpecial.trim() || null,
      items,
    });
    setBusy(false);
    if (result.success) {
      toast.success('Kitchen order placed — charges apply when served');
      setFoodLines([emptyFoodLine()]);
      setFoodSpecial('');
    } else toast.error(result.error || 'Failed');
  };

  const onSaveSummary = async () => {
    if (!accountId) return;
    setBusy(true);
    const result = await updateDischargeSummary(accountId, dischargeSummary);
    setBusy(false);
    if (result.success) toast.success('Discharge summary saved');
    else toast.error(result.error || 'Failed');
  };

  const onSettle = async () => {
    if (!accountId) return;
    if (!window.confirm('Settle IPD account and discharge patient?')) return;
    setBusy(true);
    const result = await settleIpdAccount(accountId, { dischargeSummary });
    setBusy(false);
    if (result.success) {
      toast.success('Account settled & patient discharged');
      setExpandedId(null);
      setAccountId(null);
      fetchAdmissions();
      fetchBeds({ status: 'AVAILABLE' });
    } else toast.error(result.error || 'Failed');
  };

  const isActive = (a) => {
    const s = String(a.status || 'ADMITTED').toUpperCase();
    return s === 'ADMITTED' || s === 'ACTIVE';
  };
  const active = (admissions || []).filter(isActive);
  const history = (admissions || []).filter((a) => String(a.status || '').toUpperCase() === 'DISCHARGED');

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Admissions</h1>
        <p className="text-sm text-gray-500">Admit patients, manage IPD accounts, and discharge when ready.</p>
      </div>

      {canManage && (
        <form onSubmit={onAdmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">New admission (rooms by price)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={form.patientId} onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}>
              <option value="">Patient *</option>
              {(patients || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={form.doctorId} onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}>
              <option value="">Attending doctor</option>
              {(doctors || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.admissionDate} onChange={(e) => setForm((f) => ({ ...f, admissionDate: e.target.value }))} />
            <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2 lg:col-span-3" placeholder="Doctor advice / diagnosis" value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} />
          </div>
          <HhAdmitRoomPicker
            beds={sortBedsByPrice(beds || [])}
            bedId={form.bedId}
            onBedChange={(bedId) => setForm((f) => ({ ...f, bedId }))}
            patientWish={form.patientWish || ''}
            onPatientWishChange={(patientWish) => setForm((f) => ({ ...f, patientWish }))}
          />
          <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">
            {saving ? 'Admitting…' : 'Admit patient'}
          </button>
        </form>
      )}

      <Section
        title={`Active (${active.length})`}
        items={active}
        canManage={canManage}
        onDischarge={onDischarge}
        expandedId={expandedId}
        onToggleIpd={loadIpdAccount}
        busy={busy}
        accountId={accountId}
        ipdAccount={ipdAccount}
        ipdCharges={ipdCharges}
        chargeForm={chargeForm}
        setChargeForm={setChargeForm}
        onAddCharge={onAddCharge}
        onAddWardMeds={onAddWardMeds}
        medLines={medLines}
        setMedLines={setMedLines}
        medicines={medicines}
        canOrderFood={canOrderFood}
        onAddFood={onAddFood}
        foodLines={foodLines}
        setFoodLines={setFoodLines}
        foodOrderType={foodOrderType}
        setFoodOrderType={setFoodOrderType}
        foodSpecial={foodSpecial}
        setFoodSpecial={setFoodSpecial}
        kitchenProducts={kitchenProducts}
        dischargeSummary={dischargeSummary}
        setDischargeSummary={setDischargeSummary}
        onSaveSummary={onSaveSummary}
        onSettle={onSettle}
      />
      <Section title={`Discharged (${history.length})`} items={history} canManage={false} />
    </div>
  );
};

const Section = ({
  title,
  items,
  canManage,
  onDischarge,
  expandedId,
  onToggleIpd,
  busy,
  accountId,
  ipdAccount,
  ipdCharges,
  chargeForm,
  setChargeForm,
  onAddCharge,
  onAddWardMeds,
  medLines,
  setMedLines,
  medicines,
  canOrderFood,
  onAddFood,
  foodLines,
  setFoodLines,
  foodOrderType,
  setFoodOrderType,
  foodSpecial,
  setFoodSpecial,
  kitchenProducts,
  dischargeSummary,
  setDischargeSummary,
  onSaveSummary,
  onSettle,
}) => (
  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <div className="px-4 py-3 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
    </div>
    {!(items || []).length ? (
      <p className="text-center text-gray-500 py-6 text-sm">None</p>
    ) : (
      <ul className="divide-y divide-gray-100">
        {(items || []).map((a) => {
          const expanded = expandedId === a.id;
          const balance = ipdAccount?.balance_amount ?? ipdAccount?.balanceAmount;
          return (
            <li key={a.id} className="px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {a.ip_number || a.ipNumber ? (
                      <span className="mr-2 font-mono text-cyan-800">{a.ip_number || a.ipNumber}</span>
                    ) : null}
                    {a.patient_name || a.patientName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Bed: {a.bed_number || a.bedNumber || '—'} · Admitted: {String(a.admit_date || a.admission_date || a.admissionDate || '').slice(0, 10)}
                    {a.status ? ` · ${a.status}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canManage && onToggleIpd && ['ADMITTED', 'ACTIVE'].includes(String(a.status || 'ADMITTED').toUpperCase()) && (
                    <button type="button" onClick={() => onToggleIpd(a)} className="text-xs px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-800">
                      {expanded ? 'Hide IPD account' : 'IPD account'}
                    </button>
                  )}
                  {canManage && onDischarge && (
                    <button type="button" onClick={() => onDischarge(a)} className="text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-800">
                      Discharge
                    </button>
                  )}
                </div>
              </div>

              {expanded && accountId && (
                <div className="mt-4 border border-cyan-100 rounded-xl p-4 bg-cyan-50/30 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">IPD Account #{accountId}</h3>
                    {balance != null && (
                      <span className="text-sm font-medium text-cyan-800">Balance: {rs(balance)}</span>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Charges</p>
                    {!(ipdCharges || []).length ? (
                      <p className="text-xs text-gray-500">No charges yet</p>
                    ) : (
                      <ul className="space-y-1 mb-3">
                        {(ipdCharges || []).map((c) => (
                          <li key={c.id} className="text-xs text-gray-700 flex justify-between">
                            <span>{c.description || c.charge_type || c.chargeType}</span>
                            <span>{rs(c.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {canManage && (
                      <form onSubmit={onAddCharge} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Description" value={chargeForm.description} onChange={(e) => setChargeForm((f) => ({ ...f, description: e.target.value }))} />
                        <input type="number" min="0" step="0.01" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Amount" value={chargeForm.amount} onChange={(e) => setChargeForm((f) => ({ ...f, amount: e.target.value }))} />
                        <button type="submit" disabled={busy} className="bg-white border border-cyan-700 text-cyan-800 rounded-lg px-3 py-2 text-sm font-medium hover:bg-cyan-50 disabled:opacity-60">
                          Add charge
                        </button>
                      </form>
                    )}
                  </div>


                  {canOrderFood && (
                    <form onSubmit={onAddFood} className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700">Kitchen / food order (charges IPD when served)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={foodOrderType} onChange={(e) => setFoodOrderType(e.target.value)}>
                          <option value="WARD">Ward order</option>
                          <option value="SPECIAL">Special / patient wish</option>
                        </select>
                        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Special request notes" value={foodSpecial} onChange={(e) => setFoodSpecial(e.target.value)} />
                      </div>
                      {(foodLines || []).map((line, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={line.productId} onChange={(e) => {
                            const prod = (kitchenProducts || []).find((p) => String(p.id) === e.target.value);
                            setFoodLines((rows) => rows.map((r, i) => (i === idx ? {
                              ...r,
                              productId: e.target.value,
                              name: prod?.name || r.name,
                              unitPrice: prod ? String(prod.unit_price ?? prod.unitPrice ?? '') : r.unitPrice,
                            } : r)));
                          }}>
                            <option value="">From menu</option>
                            {(kitchenProducts || []).filter((p) => Number(p.status) !== 0).map((p) => (
                              <option key={p.id} value={p.id}>{p.name} · ₹{Number(p.unit_price ?? p.unitPrice ?? 0)}</option>
                            ))}
                          </select>
                          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Item name" value={line.name} onChange={(e) => setFoodLines((rows) => rows.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))} />
                          <input type="number" min="1" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Qty" value={line.qty} onChange={(e) => setFoodLines((rows) => rows.map((r, i) => (i === idx ? { ...r, qty: e.target.value } : r)))} />
                          <input type="number" min="0" step="0.01" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Price" value={line.unitPrice} onChange={(e) => setFoodLines((rows) => rows.map((r, i) => (i === idx ? { ...r, unitPrice: e.target.value } : r)))} />
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setFoodLines((rows) => [...rows, emptyFoodLine()])} className="text-xs text-cyan-700">+ Add item</button>
                        <button type="submit" disabled={busy} className="text-xs px-3 py-1.5 rounded-lg bg-amber-700 text-white disabled:opacity-60">Send to kitchen</button>
                      </div>
                    </form>
                  )}

                  {canManage && (
                    <form onSubmit={onAddWardMeds} className="space-y-2">
                      <p className="text-xs font-semibold text-gray-700">Ward medicines</p>
                      {medLines.map((line, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" value={line.medicineId} onChange={(e) => {
                            const med = (medicines || []).find((m) => String(m.id) === e.target.value);
                            setMedLines((rows) => rows.map((r, i) => (i === idx ? { ...r, medicineId: e.target.value, name: med?.name || r.name } : r)));
                          }}>
                            <option value="">From stock</option>
                            {(medicines || []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name" value={line.name} onChange={(e) => setMedLines((rows) => rows.map((r, i) => (i === idx ? { ...r, name: e.target.value } : r)))} />
                          <input type="number" min="1" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Qty" value={line.qty} onChange={(e) => setMedLines((rows) => rows.map((r, i) => (i === idx ? { ...r, qty: e.target.value } : r)))} />
                          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Dosage" value={line.dosage} onChange={(e) => setMedLines((rows) => rows.map((r, i) => (i === idx ? { ...r, dosage: e.target.value } : r)))} />
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setMedLines((rows) => [...rows, emptyMedLine()])} className="text-xs text-cyan-700">+ Add line</button>
                        <button type="submit" disabled={busy} className="text-xs px-3 py-1.5 rounded-lg bg-cyan-700 text-white disabled:opacity-60">Add ward medicines</button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Discharge summary</p>
                    <textarea rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={dischargeSummary} onChange={(e) => setDischargeSummary(e.target.value)} placeholder="Clinical notes for discharge…" />
                    {canManage && (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={onSaveSummary} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 bg-white disabled:opacity-60">
                          Save summary
                        </button>
                        <button type="button" onClick={onSettle} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg bg-cyan-700 text-white hover:bg-cyan-800 disabled:opacity-60">
                          Settle & discharge
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

export default HospitalManagementAdmissionsPage;
