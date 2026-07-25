import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useRentalManagementContext } from '../../context/rentalManagement/RentalManagementContext';
import RentalAgreementPDF from '../../components/PDF/RentalAgreementPDF';
import RmPhotoGallery from '../../components/rentalManagement/RmPhotoGallery';

const emptyForm = {
  propertyId: '',
  tenantId: '',
  lessorName: '',
  lessorPhone: '',
  lessorAddress: '',
  rentAmount: '',
  depositAmount: '',
  rentStartDate: '',
  rentEndDate: '',
  rentDueDay: '1',
  materialName: '',
};

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const RentalManagementAgreementsPage = () => {
  const {
    agreements,
    fetchAgreements,
    createAgreement,
    agreementAction,
    properties,
    fetchProperties,
    tenants,
    fetchTenants,
    companies,
    fetchCompanies,
  } = useRentalManagementContext();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchAgreements();
    fetchProperties();
    fetchTenants();
    fetchCompanies();
  }, [fetchAgreements, fetchProperties, fetchTenants, fetchCompanies]);

  const onPropertyChange = (propertyId) => {
    const property = (properties || []).find((p) => p.id === propertyId);
    setForm((prev) => ({
      ...prev,
      propertyId,
      depositAmount:
        property?.security_deposit != null && property?.security_deposit !== ''
          ? String(property.security_deposit)
          : prev.depositAmount,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const materials = form.materialName
      ? [{ itemName: form.materialName, quantity: 1, conditionNote: 'As is' }]
      : [];
    const result = await createAgreement({
      propertyId: form.propertyId,
      tenantId: form.tenantId,
      companyId: companies?.[0]?.id,
      lessorName: form.lessorName,
      lessorPhone: form.lessorPhone,
      lessorAddress: form.lessorAddress,
      rentAmount: form.rentAmount,
      depositAmount: form.depositAmount || 0,
      rentStartDate: form.rentStartDate,
      rentEndDate: form.rentEndDate,
      rentDueDay: form.rentDueDay,
      materials,
    });
    if (result.success) {
      toast.success('Agreement draft created');
      setForm(emptyForm);
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  const run = async (id, path, body) => {
    const result = await agreementAction(id, path, 'POST', body);
    if (result.success) toast.success(result.message || 'Updated');
    else toast.error(result.error || 'Failed');
  };

  const settleDeposit = async (agreement) => {
    const held = Number(agreement.deposit_amount) || 0;
    const raw = window.prompt(
      `Security deposit held: ${money(held)}\nEnter damage deduction amount (0 = full refund):`,
      '0'
    );
    if (raw == null) return;
    const damageDeduction = Number(raw);
    if (Number.isNaN(damageDeduction) || damageDeduction < 0) {
      toast.error('Invalid deduction amount');
      return;
    }
    if (damageDeduction > held) {
      toast.error('Deduction cannot exceed deposit');
      return;
    }
    let damageNotes = '';
    if (damageDeduction > 0) {
      damageNotes = window.prompt('Describe damage / repair estimate (required for deduction):', '') || '';
      if (!damageNotes.trim()) {
        toast.error('Damage notes are required when deducting');
        return;
      }
    }
    const closeAgreement = window.confirm(
      `Refund to tenant will be ${money(held - damageDeduction)}.\nAlso close agreement and free the property?`
    );
    await run(agreement.id, '/settle-deposit', {
      damageDeduction,
      damageNotes,
      closeAgreement,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Agreements</h1>
      <p className="text-sm text-gray-500">
        Security deposit comes from the property (editable here) and is settled on handover with optional damage deduction.
      </p>

      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={form.propertyId}
            onChange={(e) => onPropertyChange(e.target.value)}
            required
          >
            <option value="">Select property</option>
            {(properties || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || p.address} (deposit {money(p.security_deposit)})
              </option>
            ))}
          </select>
          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={form.tenantId}
            onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
            required
          >
            <option value="">Select tenant</option>
            {(tenants || []).map((t) => (
              <option key={t.rm_cust_id} value={t.rm_cust_id}>
                {t.rm_cust_name} ({t.rm_cust_phone})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Lessor name" value={form.lessorName} onChange={(e) => setForm({ ...form, lessorName: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Lessor phone" value={form.lessorPhone} onChange={(e) => setForm({ ...form, lessorPhone: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Material in property" value={form.materialName} onChange={(e) => setForm({ ...form, materialName: e.target.value })} />
        </div>
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Lessor address" rows={2} value={form.lessorAddress} onChange={(e) => setForm({ ...form, lessorAddress: e.target.value })} />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <input className="border rounded-lg px-3 py-2 text-sm" type="number" placeholder="Rent ₹" value={form.rentAmount} onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} required />
          <input className="border rounded-lg px-3 py-2 text-sm" type="number" min="0" placeholder="Security deposit ₹" value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" type="date" value={form.rentStartDate} onChange={(e) => setForm({ ...form, rentStartDate: e.target.value })} required />
          <input className="border rounded-lg px-3 py-2 text-sm" type="date" value={form.rentEndDate} onChange={(e) => setForm({ ...form, rentEndDate: e.target.value })} required />
          <input className="border rounded-lg px-3 py-2 text-sm" type="number" min="1" max="28" placeholder="Due day" value={form.rentDueDay} onChange={(e) => setForm({ ...form, rentDueDay: e.target.value })} />
        </div>
        <button type="submit" className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm">Create draft agreement</button>
      </form>

      <div className="space-y-4">
        {(agreements || []).map((a) => (
          <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex gap-3 items-start">
                  <RmPhotoGallery
                    photos={a.tenant?.rm_cust_photo_s3_image || a.tenant?.rm_cust_photo}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{a.property_address_snapshot || a.property?.address}</p>
                    <p className="text-sm text-gray-600">
                      Tenant: {a.lessee_name_snapshot || a.tenant?.rm_cust_name} · ₹{a.rent_amount}/mo · due day {a.rent_due_day}
                    </p>
                    <p className="text-sm text-red-800 mt-1">
                      Security deposit: {money(a.deposit_amount)}
                      {a.deposit_status === 'SETTLED'
                        ? ` · Settled (deducted ${money(a.deposit_damage_deduction)}, refunded ${money(a.deposit_refund_amount)})`
                        : ' · Held'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{a.rent_start_date} → {a.rent_end_date}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Property photos</p>
                  <RmPhotoGallery photos={a.property?.photos} size="md" emptyLabel="No property photos" />
                </div>
              </div>
              <span className="text-xs h-fit px-2 py-1 rounded-full bg-red-50 text-red-800">{a.status}</span>
            </div>

            {a.tenant_correction_notes && (
              <p className="text-sm bg-amber-50 border border-amber-100 rounded-lg p-2 text-amber-900">
                Tenant notes: {a.tenant_correction_notes}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {['DRAFT', 'OWNER_REVIEW'].includes(a.status) && (
                <button type="button" className="text-xs px-3 py-1.5 rounded-lg border" onClick={() => run(a.id, '/share')}>
                  Share with tenant
                </button>
              )}
              {['DRAFT', 'OWNER_REVIEW', 'TENANT_REVIEW'].includes(a.status) && (
                <button type="button" className="text-xs px-3 py-1.5 rounded-lg border" onClick={() => run(a.id, '/pending-accept')}>
                  Ready for accept
                </button>
              )}
              {a.status === 'PENDING_ACCEPT' && (
                <button
                  type="button"
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-700 text-white"
                  onClick={() => run(a.id, '/accept', { party: 'OWNER', agreed: true })}
                >
                  Owner checkbox accept
                </button>
              )}
              {['ACTIVE', 'EXPIRED'].includes(a.status) && a.deposit_status !== 'SETTLED' && (
                <button
                  type="button"
                  className="text-xs px-3 py-1.5 rounded-lg border border-red-700 text-red-800"
                  onClick={() => settleDeposit(a)}
                >
                  Settle / refund deposit
                </button>
              )}
              <PDFDownloadLink
                document={<RentalAgreementPDF agreement={a} company={companies?.[0]} />}
                fileName={`Rental-Agreement-${a.id}.pdf`}
                className="text-xs px-3 py-1.5 rounded-lg border inline-flex items-center"
              >
                {({ loading }) => (loading ? 'Preparing PDF…' : 'Download India rent PDF')}
              </PDFDownloadLink>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RentalManagementAgreementsPage;
