import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';
import { API_BASE_URL } from '../../utils/apiConfig';
import { uploadImage } from '../../utils/uploadImage';

const EMPTY_FORM = {
  hostelName: '',
  address: '',
  city: '',
  contactPhone: '',
  phonepeNumber: '',
  upiId: '',
  paymentQrUrl: '',
  amenities: '',
  houseRules: '',
};

const QrUploadField = ({ value, onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, API_BASE_URL, (msg) => toast.error(msg));
      if (url) onUploaded(url);
      else toast.error('QR upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  const preview = value;
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-600">Payment QR code (PhonePe / UPI)</label>
      <input
        type="file"
        accept="image/*"
        onChange={onFile}
        disabled={uploading}
        className="w-full text-sm border rounded-lg px-3 py-2 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-red-50 file:text-red-700"
      />
      {uploading && <p className="text-xs text-gray-500">Uploading…</p>}
      {preview && (
        <div className="flex items-start gap-3">
          <img src={preview} alt="Payment QR" className="w-24 h-24 object-contain border rounded-lg bg-white" />
          <div className="space-y-1">
            <a href={preview} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline block">
              View full size
            </a>
            <button
              type="button"
              className="text-xs text-red-600 font-semibold"
              onClick={() => onUploaded('')}
            >
              Remove QR
            </button>
          </div>
        </div>
      )}
      <p className="text-[11px] text-gray-500">Residents will see this QR on their dashboard to pay rent.</p>
    </div>
  );
};

const qrSrc = (h) => h.payment_qr_url_s3_image || h.payment_qr_url || null;

const HostelManagementHostelsPage = () => {
  const {
    hostels, fetchHostels, createHostel, updateHostel, isLoading,
    fetchNearbyShops, createNearbyShop, deleteNearbyShop,
  } = useHostelManagement();
  const { can } = useHmPermission();
  const canCreate = can('hm_hostel_create') || can('hm_hostel_manage');
  const canEdit = can('hm_hostel_create') || can('hm_hostel_manage');
  const canView = can('hm_hostel_view') || canCreate || can('hm_hostel_manage');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [shops, setShops] = useState([]);
  const [shopForm, setShopForm] = useState({ shopName: '', category: 'Food', phone: '', address: '', mapsUrl: '' });
  const [shopsHostelId, setShopsHostelId] = useState(null);

  useEffect(() => { fetchHostels(); }, []);

  const loadShops = async (hostelId) => {
    if (!hostelId) {
      setShops([]);
      return;
    }
    const result = await fetchNearbyShops(hostelId);
    setShops(Array.isArray(result?.data) ? result.data : []);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShops([]);
    setShopsHostelId(null);
  };

  const startEdit = async (h) => {
    setEditingId(h.id);
    setShopsHostelId(h.id);
    setForm({
      hostelName: h.hostel_name || '',
      address: h.address || '',
      city: h.city || '',
      contactPhone: h.contact_phone || '',
      phonepeNumber: h.phonepe_number || '',
      upiId: h.upi_id || '',
      paymentQrUrl: h.payment_qr_url || '',
      amenities: (h.amenities || []).map((a) => a.amenity_name).join(', '),
      houseRules: h.house_rules || '',
    });
    await loadShops(h.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addShop = async () => {
    const hostelId = shopsHostelId || editingId;
    if (!hostelId) return toast.error('Save hostel first, then add shops');
    if (!shopForm.shopName.trim()) return toast.error('Shop name required');
    const result = await createNearbyShop({
      hostelId,
      shopName: shopForm.shopName,
      category: shopForm.category,
      phone: shopForm.phone,
      address: shopForm.address,
      mapsUrl: shopForm.mapsUrl,
    });
    if (result.success) {
      toast.success('Shop added');
      setShopForm({ shopName: '', category: 'Food', phone: '', address: '', mapsUrl: '' });
      loadShops(hostelId);
    } else toast.error(result.error);
  };

  const removeShop = async (id) => {
    const result = await deleteNearbyShop(id);
    if (result.success) {
      toast.success('Shop removed');
      loadShops(shopsHostelId || editingId);
    } else toast.error(result.error);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const amenities = form.amenities.split(',').map((s) => s.trim()).filter(Boolean);
    setSaving(true);
    try {
      const payload = { ...form, amenities };
      if (editingId) {
        const result = await updateHostel(editingId, payload);
        if (result.success) {
          toast.success('Hostel updated');
          resetForm();
        } else toast.error(result.error || 'Update failed');
      } else {
        const result = await createHostel(payload);
        if (result.success) {
          toast.success('Hostel created');
          resetForm();
        } else toast.error(result.error || 'Failed');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hostels & Amenities</h1>
        <p className="text-sm text-gray-500">
          Add hostel details, PhonePe/UPI and payment QR for resident payments.
        </p>
      </div>

      {(canCreate || (canEdit && editingId)) && (
        <form onSubmit={onSubmit} className="bg-white border rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-sm">
          {editingId && (
            <div className="md:col-span-2 flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <p className="text-sm font-medium text-amber-900">Editing hostel</p>
              <button type="button" onClick={resetForm} className="text-xs font-semibold text-amber-800 underline">
                Cancel edit
              </button>
            </div>
          )}
          <input className="border rounded-lg px-3 py-2" placeholder="Hostel name *" required value={form.hostelName} onChange={(e) => setForm({ ...form, hostelName: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Contact phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="PhonePe number" value={form.phonepeNumber} onChange={(e) => setForm({ ...form, phonepeNumber: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="UPI ID" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Amenities (comma separated)" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-gray-600">Do&apos;s and Don&apos;ts (printed on resident bills)</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 min-h-[100px] text-sm"
              placeholder={"Do's:\n- Pay rent on time\n- Keep room clean\n\nDon'ts:\n- No smoking\n- No loud music after 10 PM"}
              value={form.houseRules}
              onChange={(e) => setForm({ ...form, houseRules: e.target.value })}
            />
          </div>
          <div className="md:col-span-2 border rounded-lg p-3 bg-gray-50">
            <QrUploadField
              value={form.paymentQrUrl}
              onUploaded={(url) => setForm((prev) => ({ ...prev, paymentQrUrl: url }))}
            />
          </div>
          {editingId && (
            <div className="md:col-span-2 border rounded-lg p-3 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Nearby food shops</p>
                <p className="text-xs text-gray-500">Shown to residents under Order food.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input className="border rounded-lg px-3 py-2" placeholder="Shop name *" value={shopForm.shopName} onChange={(e) => setShopForm({ ...shopForm, shopName: e.target.value })} />
                <input className="border rounded-lg px-3 py-2" placeholder="Category (Food / Cafe…)" value={shopForm.category} onChange={(e) => setShopForm({ ...shopForm, category: e.target.value })} />
                <input className="border rounded-lg px-3 py-2" placeholder="Phone" value={shopForm.phone} onChange={(e) => setShopForm({ ...shopForm, phone: e.target.value })} />
                <input className="border rounded-lg px-3 py-2" placeholder="Maps URL" value={shopForm.mapsUrl} onChange={(e) => setShopForm({ ...shopForm, mapsUrl: e.target.value })} />
                <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Address" value={shopForm.address} onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })} />
              </div>
              <button
                type="button"
                onClick={addShop}
                className="text-sm bg-gray-900 text-white px-3 py-2 rounded-lg font-semibold"
              >
                + Add shop
              </button>
              <ul className="divide-y border rounded-lg bg-white">
                {shops.map((s) => (
                  <li key={s.id} className="px-3 py-2 flex justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium">{s.shop_name}</p>
                      <p className="text-xs text-gray-500">{s.category}{s.phone ? ` · ${s.phone}` : ''}</p>
                    </div>
                    <button type="button" className="text-xs text-red-600 font-semibold" onClick={() => removeShop(s.id)}>Remove</button>
                  </li>
                ))}
                {shops.length === 0 && <li className="px-3 py-3 text-xs text-gray-500">No shops yet.</li>}
              </ul>
            </div>
          )}
          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 min-w-[140px] bg-red-600 text-white font-semibold rounded-lg py-2.5 hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : '+ Add Hostel'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 border rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      {!canView && <p className="text-sm text-amber-700">You do not have permission to view hostels.</p>}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <p className="p-6 text-gray-500">Loading…</p> : hostels.length === 0 ? (
          <p className="p-6 text-gray-500">No hostels yet.</p>
        ) : (
          <ul className="divide-y">
            {hostels.map((h) => {
              const qr = qrSrc(h);
              return (
                <li key={h.id} className={`p-4 flex flex-wrap justify-between gap-3 ${editingId === h.id ? 'bg-red-50/40' : ''}`}>
                  <div className="flex gap-4 min-w-0">
                    {qr && (
                      <img src={qr} alt="QR" className="w-16 h-16 object-contain border rounded-lg bg-white shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{h.hostel_name}</p>
                      <p className="text-sm text-gray-500">{h.address} {h.city}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Contact: {h.contact_phone || '—'} · PhonePe: {h.phonepe_number || '—'} · UPI: {h.upi_id || '—'}
                      </p>
                      {h.amenities?.length > 0 && (
                        <p className="text-xs text-red-700 mt-1">{h.amenities.map((a) => a.amenity_name).join(' · ')}</p>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => startEdit(h)}
                      className="self-start text-sm font-semibold text-red-700 border border-red-200 bg-white px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      Edit
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HostelManagementHostelsPage;
