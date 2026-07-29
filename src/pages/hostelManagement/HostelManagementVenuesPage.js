import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import HostelSelector from '../../components/hostelManagement/HostelSelector';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';
import { API_BASE_URL } from '../../utils/apiConfig';
import { uploadImage } from '../../utils/uploadImage';

const EMPTY = {
  name: '',
  description: '',
  priceLabel: '',
  priceAmount: '',
  contactPhone: '',
  address: '',
  mapsUrl: '',
  imageUrl: '',
  available: true,
};

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Shared admin page for Turfs / Shuttle courts listings (selling display).
 * @param {{ venueType: 'TURF' | 'SHUTTLE_COURT', title: string, subtitle: string }} props
 */
const HostelManagementVenuesPage = ({ venueType, title, subtitle }) => {
  const {
    selectedHostelId, hostels,
    fetchHostels, fetchVenues, createVenue, updateVenue, deleteVenue,
  } = useHostelManagement();
  const { can } = useHmPermission();
  const canManage = can('hm_venue_create') || can('hm_venue_manage') || can('hm_hostel_create') || can('hm_hostel_manage');
  const canView = can('hm_venue_view') || canManage || can('hm_hostel_view');

  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const result = await fetchVenues({ venueType, hostelId: selectedHostelId || undefined });
    setRows(Array.isArray(result?.data) ? result.data : []);
  };

  useEffect(() => {
    fetchHostels();
  }, []);

  useEffect(() => {
    load();
  }, [selectedHostelId, venueType]);

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const startEdit = (v) => {
    setEditingId(v.id);
    setForm({
      name: v.name || '',
      description: v.description || '',
      priceLabel: v.price_label || '',
      priceAmount: v.price_amount != null ? String(v.price_amount) : '',
      contactPhone: v.contact_phone || '',
      address: v.address || '',
      mapsUrl: v.maps_url || '',
      imageUrl: v.image_url || '',
      available: Number(v.available) !== 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, API_BASE_URL, (msg) => toast.error(msg));
      if (url) setForm((prev) => ({ ...prev, imageUrl: url }));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      const payload = {
        venueType,
        hostelId: selectedHostelId || null,
        name: form.name,
        description: form.description,
        priceLabel: form.priceLabel,
        priceAmount: Number(form.priceAmount) || 0,
        contactPhone: form.contactPhone,
        address: form.address,
        mapsUrl: form.mapsUrl,
        imageUrl: form.imageUrl,
        available: form.available,
      };
      const result = editingId
        ? await updateVenue(editingId, payload)
        : await createVenue(payload);
      if (result.success) {
        toast.success(editingId ? 'Updated' : 'Added for selling');
        reset();
        load();
      } else toast.error(result.error);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Remove this listing?')) return;
    const result = await deleteVenue(id);
    if (result.success) {
      toast.success('Removed');
      load();
    } else toast.error(result.error);
  };

  const hostelName = (hostels || []).find((h) => h.id === selectedHostelId)?.hostel_name;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
          {hostelName && <p className="text-xs text-gray-400 mt-1">Linked hostel filter: {hostelName}</p>}
        </div>
        <HostelSelector />
      </div>

      {canManage && (
        <form onSubmit={onSubmit} className="bg-white border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-sm">
          {editingId && (
            <div className="md:col-span-2 flex justify-between bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <p className="text-sm font-medium text-amber-900">Editing listing</p>
              <button type="button" className="text-xs font-semibold underline" onClick={reset}>Cancel</button>
            </div>
          )}
          <input className="border rounded-lg px-3 py-2" placeholder="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Price label (e.g. Per hour)" value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" type="number" min="0" step="0.01" placeholder="Price amount" value={form.priceAmount} onChange={(e) => setForm({ ...form, priceAmount: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Contact phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Maps / booking URL" value={form.mapsUrl} onChange={(e) => setForm({ ...form, mapsUrl: e.target.value })} />
          <textarea className="border rounded-lg px-3 py-2 md:col-span-2" rows={2} placeholder="Description for selling" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold text-gray-600">Photo</label>
            <input type="file" accept="image/*" onChange={onUpload} disabled={uploading} className="w-full text-sm border rounded-lg px-3 py-2" />
            {form.imageUrl && <img src={form.imageUrl} alt="" className="w-28 h-28 object-cover rounded-lg border" />}
          </div>
          <label className="inline-flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
            Available for booking / selling
          </label>
          <button type="submit" disabled={saving} className="md:col-span-2 bg-red-600 text-white rounded-lg py-2.5 font-semibold disabled:opacity-50">
            {saving ? 'Saving…' : editingId ? 'Save changes' : `+ Add ${venueType === 'TURF' ? 'turf' : 'shuttle court'}`}
          </button>
        </form>
      )}
      {!canView && <p className="text-sm text-amber-700">No permission to view listings.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((v) => (
          <div key={v.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
            {(v.image_url_s3_image || v.image_url) && (
              <img src={v.image_url_s3_image || v.image_url} alt={v.name} className="w-full h-40 object-cover" />
            )}
            <div className="p-4 space-y-1">
              <div className="flex justify-between gap-2">
                <p className="font-semibold text-gray-900">{v.name}</p>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${Number(v.available) !== 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {Number(v.available) !== 0 ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <p className="text-sm text-red-700 font-semibold">
                {v.price_label ? `${v.price_label}: ` : ''}{rs(v.price_amount)}
              </p>
              {v.description && <p className="text-xs text-gray-600">{v.description}</p>}
              {v.address && <p className="text-xs text-gray-500">{v.address}</p>}
              {v.contact_phone && <p className="text-xs text-gray-500">Phone: {v.contact_phone}</p>}
              {canManage && (
                <div className="pt-2 flex gap-3">
                  <button type="button" className="text-xs font-semibold text-red-700" onClick={() => startEdit(v)}>Edit</button>
                  <button type="button" className="text-xs font-semibold text-gray-500" onClick={() => onDelete(v.id)}>Remove</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {rows.length === 0 && <p className="text-gray-500 text-sm">No listings yet. Add one above to show for selling.</p>}
    </div>
  );
};

export const HostelManagementTurfsPage = () => (
  <HostelManagementVenuesPage
    venueType="TURF"
    title="Turfs"
    subtitle="List turfs for selling / booking. Residents can see these on their portal."
  />
);

export const HostelManagementShuttleCourtsPage = () => (
  <HostelManagementVenuesPage
    venueType="SHUTTLE_COURT"
    title="Shuttle courts"
    subtitle="List shuttle courts for selling / booking. Residents can see these on their portal."
  />
);

export default HostelManagementVenuesPage;
