import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useRentalManagementContext } from '../../context/rentalManagement/RentalManagementContext';

const RentalManagementCompanyPage = () => {
  const { companies, fetchCompanies, createCompany, isLoading } = useRentalManagementContext();
  const [form, setForm] = useState({ companyName: '', contactNo: '', address: '' });

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const result = await createCompany(form);
    if (result.success) {
      toast.success('Company saved');
      setForm({ companyName: '', contactNo: '', address: '' });
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Company</h1>
      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3 shadow-sm">
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Company name"
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          required
        />
        <input
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Contact number"
          value={form.contactNo}
          onChange={(e) => setForm({ ...form, contactNo: e.target.value })}
        />
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm"
          placeholder="Address"
          rows={3}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm">
          {companies?.length ? 'Add another company' : 'Save company'}
        </button>
      </form>

      <div className="space-y-3">
        {(companies || []).map((c) => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-medium text-gray-900">{c.company_name}</p>
            <p className="text-sm text-gray-500">{c.contact_no}</p>
            <p className="text-sm text-gray-500">{c.address}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RentalManagementCompanyPage;
