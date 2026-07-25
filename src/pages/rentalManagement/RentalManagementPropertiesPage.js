import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRentalManagementContext } from '../../context/rentalManagement/RentalManagementContext';
import RmPhotoGallery from '../../components/rentalManagement/RmPhotoGallery';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const emptyForm = {
  title: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  companyId: '',
  securityDeposit: '',
  photoUrl: '',
};

const RentalManagementPropertiesPage = () => {
  const {
    properties,
    fetchProperties,
    createProperty,
    companies,
    fetchCompanies,
  } = useRentalManagementContext();
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProperties();
    fetchCompanies();
  }, [fetchProperties, fetchCompanies]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.address.trim()) {
      toast.error('Property address is required');
      return;
    }

    setSubmitting(true);
    try {
      const photos = form.photoUrl
        ? [{ photoUrl: form.photoUrl, caption: 'Property photo' }]
        : [];
      const result = await createProperty({
        title: form.title,
        address: form.address.trim(),
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        companyId: form.companyId || companies?.[0]?.id || null,
        securityDeposit: form.securityDeposit === '' ? 0 : form.securityDeposit,
        photos,
      });
      if (result.success) {
        toast.success(`Property added. Total: ${(properties?.length || 0) + 1}`);
        setForm(emptyForm);
      } else {
        toast.error(result.error || 'Failed to add property');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const count = properties?.length || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Properties</h1>
          <p className="text-sm text-gray-500 mt-1">
            Add as many properties as you need. Each can have its own agreement and security deposit.
          </p>
        </div>
        <p className="text-sm font-medium text-red-800">{count} propert{count === 1 ? 'y' : 'ies'}</p>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3 shadow-sm">
        <p className="text-sm font-medium text-gray-800">
          {count > 0 ? 'Add another property' : 'Add your first property'}
        </p>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Title (optional) e.g. Flat 2B, Anna Nagar"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Full property address"
          rows={2}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Rental advance / Security deposit (₹)
          </label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            type="number"
            min="0"
            step="1"
            placeholder="Amount held and refundable on vacant handover"
            value={form.securityDeposit}
            onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
          />
          <p className="text-xs text-gray-500 mt-1">
            Returned to tenant when they hand over without damage. Damage costs can be deducted from this amount.
          </p>
        </div>
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Property photo URL (optional)"
          value={form.photoUrl}
          onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm disabled:opacity-60"
        >
          {submitting ? 'Saving…' : count > 0 ? 'Add another property' : 'Add property'}
        </button>
      </form>

      <div className="space-y-3">
        {(properties || []).map((p, index) => (
          <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 mb-1">#{count - index}</p>
                <p className="font-medium text-gray-900">{p.title || 'Property'}</p>
                <p className="text-sm text-gray-600">{p.address}</p>
                <p className="text-xs text-gray-500 mt-1">{[p.city, p.state, p.pincode].filter(Boolean).join(', ')}</p>
                <p className="text-sm text-red-800 mt-2 font-medium">
                  Security deposit: {money(p.security_deposit)}
                </p>
                <div className="mt-3">
                  <RmPhotoGallery photos={p.photos} size="md" emptyLabel="No photos" />
                </div>
              </div>
              <span className="text-xs h-fit px-2 py-1 rounded-full bg-gray-100 text-gray-700">{p.status}</span>
            </div>
            {p.agreements?.length > 0 && (
              <p className="text-xs text-red-700 mt-2">Has active agreement</p>
            )}
          </div>
        ))}
        {!count && (
          <p className="text-sm text-gray-500 text-center py-6">No properties yet — add your first above.</p>
        )}
      </div>
    </div>
  );
};

export default RentalManagementPropertiesPage;
