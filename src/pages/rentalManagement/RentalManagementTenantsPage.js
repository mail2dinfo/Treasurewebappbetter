import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRentalManagementContext } from '../../context/rentalManagement/RentalManagementContext';
import RmPhotoGallery from '../../components/rentalManagement/RmPhotoGallery';

const RentalManagementTenantsPage = () => {
  const { tenants, fetchTenants, createTenant } = useRentalManagementContext();
  const [form, setForm] = useState({
    rm_cust_name: '',
    rm_cust_phone: '',
    rm_cust_address: '',
  });

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await createTenant(form);
    if (result.success) {
      toast.success(result.message || 'Tenant added');
      if (result.data?.defaultPassword) {
        toast.info(`Default password (first 4 of phone): ${result.data.defaultPassword}`);
      }
      setForm({ rm_cust_name: '', rm_cust_phone: '', rm_cust_address: '' });
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Tenants (RM Subscriber)</h1>
      <p className="text-sm text-gray-500">
        Tenant login uses mobile number + first 4 digits of phone as default password (same as other apps).
      </p>
      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3 shadow-sm">
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Tenant name"
          value={form.rm_cust_name}
          onChange={(e) => setForm({ ...form, rm_cust_name: e.target.value })}
          required
        />
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="10-digit phone"
          value={form.rm_cust_phone}
          onChange={(e) => setForm({ ...form, rm_cust_phone: e.target.value })}
          required
        />
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Address"
          rows={2}
          value={form.rm_cust_address}
          onChange={(e) => setForm({ ...form, rm_cust_address: e.target.value })}
        />
        <button type="submit" className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm">
          Add tenant
        </button>
      </form>

      <div className="space-y-3">
        {(tenants || []).map((t) => (
          <div key={t.rm_cust_id} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-4">
            <RmPhotoGallery
              photos={t.rm_cust_photo_s3_image || t.rm_cust_photo}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">{t.rm_cust_name}</p>
              <p className="text-sm text-gray-600">{t.rm_cust_phone}</p>
              <p className="text-sm text-gray-500 mt-1">{t.rm_cust_address}</p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Aadhaar front</p>
                  <RmPhotoGallery photos={t.rm_cust_aadhaar_frontside_s3_image || t.rm_cust_aadhaar_frontside} size="sm" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Aadhaar back</p>
                  <RmPhotoGallery photos={t.rm_cust_aadhaar_backside_s3_image || t.rm_cust_aadhaar_backside} size="sm" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Salary slip</p>
                  <RmPhotoGallery photos={t.rm_cust_salary_slip_s3_image || t.rm_cust_salary_slip} size="sm" />
                </div>
              </div>
            </div>
          </div>
        ))}
        {!tenants?.length && (
          <p className="text-sm text-gray-500 text-center py-6">No tenants yet</p>
        )}
      </div>
    </div>
  );
};

export default RentalManagementTenantsPage;
