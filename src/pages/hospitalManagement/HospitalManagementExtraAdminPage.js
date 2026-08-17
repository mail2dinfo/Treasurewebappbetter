import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';

const HospitalManagementExtraAdminPage = () => {
  const {
    packages,
    templates,
    notificationSettings,
    fetchPackages,
    createPackage,
    updatePackage,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    fetchNotificationSettings,
    updateNotificationSettings,
  } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_extra_admin');

  const [tab, setTab] = useState('packages');
  const [pkgForm, setPkgForm] = useState({ name: '', description: '', price: '', items: '' });
  const [editPkgId, setEditPkgId] = useState(null);
  const [tplForm, setTplForm] = useState({ name: '', templateType: 'PRESCRIPTION', body: '' });
  const [editTplId, setEditTplId] = useState(null);
  const [notifForm, setNotifForm] = useState({ smsEnabled: false, emailEnabled: false, appointmentReminder: true, lowStockAlert: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPackages();
    fetchTemplates();
    fetchNotificationSettings();
  }, [fetchPackages, fetchTemplates, fetchNotificationSettings]);

  useEffect(() => {
    if (notificationSettings) {
      setNotifForm({
        smsEnabled: Boolean(notificationSettings.sms_enabled ?? notificationSettings.smsEnabled),
        emailEnabled: Boolean(notificationSettings.email_enabled ?? notificationSettings.emailEnabled),
        appointmentReminder: notificationSettings.appointment_reminder ?? notificationSettings.appointmentReminder ?? true,
        lowStockAlert: notificationSettings.low_stock_alert ?? notificationSettings.lowStockAlert ?? true,
      });
    }
  }, [notificationSettings]);

  const onPkgSubmit = async (e) => {
    e.preventDefault();
    if (!pkgForm.name.trim()) return toast.error('Package name required');
    setSaving(true);
    const payload = {
      name: pkgForm.name.trim(),
      description: pkgForm.description.trim() || null,
      price: Number(pkgForm.price) || 0,
      items: pkgForm.items.trim() ? pkgForm.items.split('\n').map((s) => s.trim()).filter(Boolean) : [],
    };
    const result = editPkgId ? await updatePackage(editPkgId, payload) : await createPackage(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editPkgId ? 'Package updated' : 'Package added');
      setPkgForm({ name: '', description: '', price: '', items: '' });
      setEditPkgId(null);
    } else toast.error(result.error || 'Failed');
  };

  const onTplSubmit = async (e) => {
    e.preventDefault();
    if (!tplForm.name.trim()) return toast.error('Template name required');
    setSaving(true);
    const payload = {
      name: tplForm.name.trim(),
      templateType: tplForm.templateType,
      body: tplForm.body.trim() || null,
    };
    const result = editTplId ? await updateTemplate(editTplId, payload) : await createTemplate(payload);
    setSaving(false);
    if (result.success) {
      toast.success(editTplId ? 'Template updated' : 'Template added');
      setTplForm({ name: '', templateType: 'PRESCRIPTION', body: '' });
      setEditTplId(null);
    } else toast.error(result.error || 'Failed');
  };

  const onNotifSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateNotificationSettings({
      smsEnabled: notifForm.smsEnabled,
      emailEnabled: notifForm.emailEnabled,
      appointmentReminder: notifForm.appointmentReminder,
      lowStockAlert: notifForm.lowStockAlert,
    });
    setSaving(false);
    if (result.success) toast.success('Notification settings saved');
    else toast.error(result.error || 'Failed');
  };

  const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Extra Admin</h1>
        <p className="text-sm text-gray-500">Service packages, templates & notifications</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 flex-wrap">
        {[
          { id: 'packages', label: 'Service packages' },
          { id: 'templates', label: 'Templates' },
          { id: 'notifications', label: 'Notifications' },
        ].map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.id ? 'border-cyan-700 text-cyan-800' : 'border-transparent text-gray-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'packages' && (
        <>
          {canManage && (
            <form onSubmit={onPkgSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">{editPkgId ? 'Edit package' : 'Add package'}</h2>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" value={pkgForm.name} onChange={(e) => setPkgForm((f) => ({ ...f, name: e.target.value }))} />
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Description" value={pkgForm.description} onChange={(e) => setPkgForm((f) => ({ ...f, description: e.target.value }))} />
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Price" value={pkgForm.price} onChange={(e) => setPkgForm((f) => ({ ...f, price: e.target.value }))} />
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Items (one per line)" value={pkgForm.items} onChange={(e) => setPkgForm((f) => ({ ...f, items: e.target.value }))} />
              <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium">{editPkgId ? 'Update' : 'Add package'}</button>
            </form>
          )}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Price</th><th className="px-4 py-2">Items</th>{canManage && <th className="px-4 py-2">Action</th>}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(packages || []).map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">{rs(p.price)}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">{(Array.isArray(p.items) ? p.items : []).join(', ') || '—'}</td>
                    {canManage && (
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => { setEditPkgId(p.id); setPkgForm({ name: p.name || '', description: p.description || '', price: String(p.price ?? ''), items: (Array.isArray(p.items) ? p.items : []).join('\n') }); }} className="text-cyan-700 text-xs font-medium">Edit</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'templates' && (
        <>
          {canManage && (
            <form onSubmit={onTplSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-gray-900">{editTplId ? 'Edit template' : 'Add template'}</h2>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Name *" value={tplForm.name} onChange={(e) => setTplForm((f) => ({ ...f, name: e.target.value }))} />
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={tplForm.templateType} onChange={(e) => setTplForm((f) => ({ ...f, templateType: e.target.value }))}>
                <option value="PRESCRIPTION">Prescription</option>
                <option value="DISCHARGE">Discharge summary</option>
                <option value="LAB_REPORT">Lab report</option>
                <option value="OTHER">Other</option>
              </select>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono" rows={6} placeholder="Template body" value={tplForm.body} onChange={(e) => setTplForm((f) => ({ ...f, body: e.target.value }))} />
              <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium">{editTplId ? 'Update' : 'Add template'}</button>
            </form>
          )}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Type</th>{canManage && <th className="px-4 py-2">Action</th>}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(templates || []).map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2">{t.name}</td>
                    <td className="px-4 py-2">{t.template_type || t.templateType || '—'}</td>
                    {canManage && (
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => { setEditTplId(t.id); setTplForm({ name: t.name || '', templateType: t.template_type || t.templateType || 'PRESCRIPTION', body: t.body || '' }); }} className="text-cyan-700 text-xs font-medium">Edit</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'notifications' && (
        <form onSubmit={onNotifSubmit} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4 max-w-lg">
          <h2 className="text-sm font-semibold text-gray-900">Notification settings</h2>
          {[
            { key: 'smsEnabled', label: 'SMS notifications' },
            { key: 'emailEnabled', label: 'Email notifications' },
            { key: 'appointmentReminder', label: 'Appointment reminders' },
            { key: 'lowStockAlert', label: 'Low stock alerts' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={notifForm[key]} onChange={(e) => setNotifForm((f) => ({ ...f, [key]: e.target.checked }))} disabled={!canManage} className="rounded border-gray-300 text-cyan-700" />
              {label}
            </label>
          ))}
          {canManage && (
            <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium">Save settings</button>
          )}
        </form>
      )}
    </div>
  );
};

export default HospitalManagementExtraAdminPage;
