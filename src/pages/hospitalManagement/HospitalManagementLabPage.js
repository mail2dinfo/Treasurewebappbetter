import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const toDate = (d) => d.toISOString().slice(0, 10);
const ORDER_STATUSES = ['PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const HospitalManagementLabPage = () => {
  const {
    labTests,
    labOrders,
    selectedLabOrder,
    patients,
    doctors,
    fetchLabTests,
    createLabTest,
    updateLabTest,
    fetchLabOrders,
    createLabOrder,
    fetchLabOrder,
    updateLabOrderStatus,
    updateLabOrderResults,
    fetchPatients,
    fetchDoctors,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_lab_manage');

  const [tab, setTab] = useState('orders');
  const [testForm, setTestForm] = useState({ name: '', category: '', price: '', unit: '' });
  const [editTestId, setEditTestId] = useState(null);
  const [orderForm, setOrderForm] = useState({ patientId: '', doctorId: '', orderDate: toDate(new Date()), testIds: [] });
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [resultItems, setResultItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLabTests();
    fetchLabOrders();
    fetchPatients();
    fetchDoctors();
  }, [fetchLabTests, fetchLabOrders, fetchPatients, fetchDoctors]);

  useEffect(() => {
    if (!selectedOrderId) return;
    fetchLabOrder(selectedOrderId).then((res) => {
      if (res.success && res.data) {
        const items = res.data.items || res.data.orderItems || [];
        setResultItems(items.map((item) => ({
          id: item.id,
          resultValue: item.result_value ?? item.resultValue ?? '',
          resultUnit: item.result_unit ?? item.resultUnit ?? '',
          resultNotes: item.result_notes ?? item.resultNotes ?? '',
          testName: item.test_name ?? item.testName ?? item.name,
        })));
      }
    });
  }, [selectedOrderId, fetchLabOrder]);

  const onTestSubmit = async (e) => {
    e.preventDefault();
    if (!testForm.name.trim()) return toast.error('Test name required');
    setSaving(true);
    const payload = {
      name: testForm.name.trim(),
      category: testForm.category.trim() || null,
      price: Number(testForm.price) || 0,
      unit: testForm.unit.trim() || null,
    };
    const result = editTestId ? await updateLabTest(editTestId, payload) : await createLabTest(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editTestId ? 'Test updated' : 'Test added');
      setTestForm({ name: '', category: '', price: '', unit: '' });
      setEditTestId(null);
    } else toast.error(result.error || 'Failed');
  };

  const toggleTest = (id) => {
    setOrderForm((f) => {
      const ids = f.testIds.includes(String(id)) ? f.testIds.filter((x) => x !== String(id)) : [...f.testIds, String(id)];
      return { ...f, testIds: ids };
    });
  };

  const onOrderSubmit = async (e) => {
    e.preventDefault();
    if (!orderForm.patientId) return toast.error('Select patient');
    if (!orderForm.testIds.length) return toast.error('Select at least one test');
    setSaving(true);
    const result = await createLabOrder({
      patientId: orderForm.patientId,
      doctorId: orderForm.doctorId || null,
      orderDate: orderForm.orderDate,
      testIds: orderForm.testIds.map(Number),
    });
    setSaving(false);
    if (result.success) {
      toast.success('Lab order created');
      setOrderForm({ patientId: '', doctorId: '', orderDate: toDate(new Date()), testIds: [] });
    } else toast.error(result.error || 'Failed');
  };

  const onStatusChange = async (orderId, status) => {
    const result = await updateLabOrderStatus(orderId, status);
    if (result.success) toast.success('Status updated');
    else toast.error(result.error || 'Failed');
  };

  const onSaveResults = async () => {
    if (!selectedOrderId) return;
    setSaving(true);
    const items = resultItems.map((item) => ({
      id: item.id,
      resultValue: item.resultValue,
      resultUnit: item.resultUnit,
      resultNotes: item.resultNotes,
    }));
    const result = await updateLabOrderResults(selectedOrderId, items);
    setSaving(false);
    if (result.success) toast.success('Results saved');
    else toast.error(result.error || 'Failed');
  };

  const patientName = (id) => (patients || []).find((p) => String(p.id) === String(id))?.name || `#${id}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Laboratory</h1>
        <p className="text-sm text-gray-500">Test master, orders & results</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {['orders', 'tests'].map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? 'border-cyan-700 text-cyan-800' : 'border-transparent text-gray-500'}`}>
            {t === 'orders' ? 'Orders' : 'Tests master'}
          </button>
        ))}
      </div>

      {tab === 'tests' && (
        <>
          {canManage && (
            <form onSubmit={onTestSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">{editTestId ? 'Edit test' : 'Add test'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" value={testForm.name} onChange={(e) => setTestForm((f) => ({ ...f, name: e.target.value }))} />
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Category" value={testForm.category} onChange={(e) => setTestForm((f) => ({ ...f, category: e.target.value }))} />
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Price" value={testForm.price} onChange={(e) => setTestForm((f) => ({ ...f, price: e.target.value }))} />
                <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Unit" value={testForm.unit} onChange={(e) => setTestForm((f) => ({ ...f, unit: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium">{editTestId ? 'Update' : 'Add test'}</button>
                {editTestId && <button type="button" onClick={() => { setEditTestId(null); setTestForm({ name: '', category: '', price: '', unit: '' }); }} className="text-sm text-gray-600">Cancel</button>}
              </div>
            </form>
          )}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Category</th><th className="px-4 py-2">Price</th><th className="px-4 py-2">Unit</th>{canManage && <th className="px-4 py-2">Action</th>}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(labTests || []).map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2">{t.name}</td>
                    <td className="px-4 py-2">{t.category || '—'}</td>
                    <td className="px-4 py-2">₹{Number(t.price || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2">{t.unit || '—'}</td>
                    {canManage && (
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => { setEditTestId(t.id); setTestForm({ name: t.name || '', category: t.category || '', price: String(t.price ?? ''), unit: t.unit || '' }); }} className="text-cyan-700 text-xs font-medium">Edit</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'orders' && (
        <>
          {canManage && (
            <form onSubmit={onOrderSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">New lab order</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={orderForm.patientId} onChange={(e) => setOrderForm((f) => ({ ...f, patientId: e.target.value }))} required>
                  <option value="">Patient *</option>
                  {(patients || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={orderForm.doctorId} onChange={(e) => setOrderForm((f) => ({ ...f, doctorId: e.target.value }))}>
                  <option value="">Doctor (optional)</option>
                  {(doctors || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={orderForm.orderDate} onChange={(e) => setOrderForm((f) => ({ ...f, orderDate: e.target.value }))} />
              </div>
              <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-xs font-medium text-gray-600 mb-2">Select tests *</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {(labTests || []).map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={orderForm.testIds.includes(String(t.id))} onChange={() => toggleTest(t.id)} />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium">Create order</button>
            </form>
          )}

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Patient</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(labOrders || []).map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-2">{o.order_date || o.orderDate || '—'}</td>
                    <td className="px-4 py-2">{patientName(o.patient_id ?? o.patientId)}</td>
                    <td className="px-4 py-2">
                      {canManage ? (
                        <select className="border border-gray-300 rounded px-2 py-1 text-xs" value={o.status || 'PENDING'} onChange={(e) => onStatusChange(o.id, e.target.value)}>
                          {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                        </select>
                      ) : (o.status || 'PENDING')}
                    </td>
                    <td className="px-4 py-2">
                      <button type="button" onClick={() => setSelectedOrderId(String(o.id))} className="text-cyan-700 text-xs font-medium">Results</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedOrderId && selectedLabOrder && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Enter results — Order #{selectedOrderId}</h3>
              {resultItems.map((item, idx) => (
                <div key={item.id || idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end border-b border-gray-100 pb-2">
                  <p className="text-sm font-medium sm:col-span-4">{item.testName || `Item ${idx + 1}`}</p>
                  <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Result value" value={item.resultValue} onChange={(e) => setResultItems((items) => items.map((x, i) => (i === idx ? { ...x, resultValue: e.target.value } : x)))} disabled={!canManage} />
                  <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Unit" value={item.resultUnit} onChange={(e) => setResultItems((items) => items.map((x, i) => (i === idx ? { ...x, resultUnit: e.target.value } : x)))} disabled={!canManage} />
                  <input className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm sm:col-span-2" placeholder="Notes" value={item.resultNotes} onChange={(e) => setResultItems((items) => items.map((x, i) => (i === idx ? { ...x, resultNotes: e.target.value } : x)))} disabled={!canManage} />
                </div>
              ))}
              {canManage && (
                <button type="button" onClick={onSaveResults} disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium">Save results</button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HospitalManagementLabPage;
