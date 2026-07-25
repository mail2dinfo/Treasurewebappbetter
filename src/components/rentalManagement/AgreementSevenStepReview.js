import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import RentalAgreementPDF from '../PDF/RentalAgreementPDF';
import RmPhotoGallery from './RmPhotoGallery';
import {
  AGREEMENT_REVIEW_STEPS,
  AgreementTermsList,
  Field,
  FileOrUrlField,
  formFromAgreement,
  inputClass,
  inputDisabledClass,
  tenantMissingUploads,
} from './rmAgreementFormShared';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * 7-step agreement review for tenant and owner.
 * Tenant: property/owner/rent read-only; lessee/nominee/details editable until approve.
 * Owner: can edit until tenant approves; after that view/maintain only.
 */
const AgreementSevenStepReview = ({
  role = 'tenant',
  agreement,
  company,
  onSave,
  onApprove,
  saving = false,
  approving = false,
  backLabel = '← Back',
  onBack,
}) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => formFromAgreement(agreement));
  const [agreedDigital, setAgreedDigital] = useState(false);

  const isTenant = role === 'tenant';
  const locked =
    !!agreement?.tenant_accepted_at ||
    ['PENDING_ACCEPT', 'ACTIVE', 'CLOSED', 'EXPIRED'].includes(agreement?.status);
  const canEdit = !locked && (isTenant ? agreement?.status === 'TENANT_REVIEW' : true);
  const tenantCanEditLessee = canEdit && isTenant;
  const ownerCanEditAll = canEdit && !isTenant;
  // Tenant editable sections
  const lesseeEditable = tenantCanEditLessee || ownerCanEditAll;
  const nomineeEditable = lesseeEditable;
  const termsEditable = lesseeEditable;
  // Owner-only editable (tenant always read-only)
  const ownerFieldsEditable = ownerCanEditAll;
  const rentEditable = ownerCanEditAll;

  useEffect(() => {
    setForm(formFromAgreement(agreement));
    setAgreedDigital(false);
  }, [agreement?.id, agreement?.updated_at, agreement?.status]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const steps = AGREEMENT_REVIEW_STEPS.map((s) =>
    s.id === 7
      ? { ...s, title: isTenant ? 'Review & approve' : locked ? 'Document' : 'Save & share' }
      : s
  );

  const buildTenantPayload = () => ({
    lesseeName: form.lesseeName,
    lesseePhone: form.lesseePhone,
    lesseeAddress: form.lesseeAddress,
    lesseePhoto: form.lesseePhoto,
    lesseeAadhaarFront: form.lesseeAadhaarFront,
    lesseeAadhaarBack: form.lesseeAadhaarBack,
    panCard: form.panCard,
    salarySlip: form.salarySlip,
    bankStatement: form.bankStatement,
    nomineeName: form.nomineeName,
    nomineePhone: form.nomineePhone,
    terms: (form.terms || []).map((t) => String(t || '').trim()).filter(Boolean),
    correctionNotes: form.correctionNotes,
    submitForOwnerReview: false,
  });

  const buildOwnerPayload = () => ({
    lessorName: form.lessorName,
    lessorPhone: form.lessorPhone,
    lessorAddress: form.lessorAddress,
    lessorAadhaarFront: form.lessorAadhaarFront,
    lessorAadhaarBack: form.lessorAadhaarBack,
    lesseeName: form.lesseeName,
    lesseePhone: form.lesseePhone,
    lesseeAddress: form.lesseeAddress,
    lesseePhoto: form.lesseePhoto,
    lesseeAadhaarFront: form.lesseeAadhaarFront,
    lesseeAadhaarBack: form.lesseeAadhaarBack,
    panCard: form.panCard,
    salarySlip: form.salarySlip,
    bankStatement: form.bankStatement,
    rentAmount: form.rentAmount,
    depositAmount: form.depositAmount,
    rentStartDate: form.rentStartDate,
    rentEndDate: form.rentEndDate,
    rentDueDay: form.rentDueDay,
    nomineeName: form.nomineeName,
    nomineePhone: form.nomineePhone,
    terms: (form.terms || []).map((t) => String(t || '').trim()).filter(Boolean),
    materials: (form.materials || [])
      .map((m) => ({
        itemName: String(m.itemName || '').trim(),
        quantity: Math.max(1, parseInt(m.quantity, 10) || 1),
      }))
      .filter((m) => m.itemName),
  });

  const handleSave = async () => {
    if (!canEdit || !onSave) return;
    await onSave(isTenant ? buildTenantPayload() : buildOwnerPayload());
  };

  const handleApprove = async () => {
    if (!isTenant || !onApprove || !canEdit) return;
    const missing = tenantMissingUploads(form);
    if (missing.length) {
      // Parent should toast; also return early with structured error
      await onApprove({ error: `Please complete: ${missing.join(', ')}` });
      return;
    }
    if (!agreedDigital) {
      await onApprove({ error: 'Please confirm the digital signature checkbox to approve.' });
      return;
    }
    const saved = await onSave?.(buildTenantPayload());
    if (saved === false) return;
    await onApprove({ agreed: true });
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">
              {isTenant ? 'Review rental agreement' : 'Agreement document'}
            </h2>
            <p className="text-sm text-red-100 mt-1">
              {locked
                ? 'Tenant has digitally approved — document is locked for editing.'
                : isTenant
                  ? 'Fill your details, nominee, and rules. Property, owner, and rent are set by the owner.'
                  : 'You and the tenant can edit until the tenant digitally approves.'}
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/15 border border-white/20">
            {agreement?.status}
          </span>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-wrap gap-2">
        {steps.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(s.id)}
            className={`text-xs px-2.5 py-1 rounded-full border ${
              step === s.id
                ? 'bg-red-700 text-white border-red-700'
                : 'bg-white text-gray-600 border-gray-200 hover:border-red-400'
            }`}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Property details are set by the owner and cannot be changed here.
            </p>
            <Field label="Title">
              <input className={inputDisabledClass} value={form.propertyTitle} disabled />
            </Field>
            <Field label="Property address">
              <textarea className={inputDisabledClass} rows={2} value={form.propertyAddress} disabled />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="City">
                <input className={inputDisabledClass} value={form.propertyCity} disabled />
              </Field>
              <Field label="State">
                <input className={inputDisabledClass} value={form.propertyState} disabled />
              </Field>
              <Field label="Pincode">
                <input className={inputDisabledClass} value={form.propertyPincode} disabled />
              </Field>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">Property photos</p>
              <RmPhotoGallery
                photos={agreement?.property?.photos}
                size="md"
                emptyLabel="No property photos"
              />
            </div>
            {(form.materials || []).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Materials / fittings</p>
                <ul className="text-sm text-gray-700 list-disc pl-5 space-y-0.5">
                  {form.materials.map((m, i) => (
                    <li key={i}>
                      {m.itemName} × {m.quantity}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {!ownerFieldsEditable && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Owner / lessor details are set by the owner
                {isTenant ? ' and are read-only for tenants.' : ' (locked after tenant approval).'}
              </p>
            )}
            <Field label="Owner / Lessor name">
              <input
                className={ownerFieldsEditable ? inputClass : inputDisabledClass}
                value={form.lessorName}
                disabled={!ownerFieldsEditable}
                onChange={(e) => setField('lessorName', e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <input
                className={ownerFieldsEditable ? inputClass : inputDisabledClass}
                value={form.lessorPhone}
                disabled={!ownerFieldsEditable}
                onChange={(e) => setField('lessorPhone', e.target.value)}
              />
            </Field>
            <Field label="Address">
              <textarea
                className={ownerFieldsEditable ? inputClass : inputDisabledClass}
                rows={2}
                value={form.lessorAddress}
                disabled={!ownerFieldsEditable}
                onChange={(e) => setField('lessorAddress', e.target.value)}
              />
            </Field>
            <p className="text-xs font-medium text-gray-700 pt-1">Owner Aadhaar</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FileOrUrlField
                label="Aadhaar front"
                value={form.lessorAadhaarFront}
                disabled={!ownerFieldsEditable}
                onUploaded={(v) => setField('lessorAadhaarFront', v)}
              />
              <FileOrUrlField
                label="Aadhaar back"
                value={form.lessorAadhaarBack}
                disabled={!ownerFieldsEditable}
                onUploaded={(v) => setField('lessorAadhaarBack', v)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            {isTenant && lesseeEditable && (
              <p className="text-xs text-red-900 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                Upload all your details (photo, Aadhaar, PAN, salary slip, bank statement) before approving.
              </p>
            )}
            <FileOrUrlField
              label="Tenant photo"
              value={form.lesseePhoto}
              disabled={!lesseeEditable}
              required={isTenant}
              onUploaded={(v) => setField('lesseePhoto', v)}
            />
            <Field label="Tenant / Lessee name *">
              <input
                className={lesseeEditable ? inputClass : inputDisabledClass}
                value={form.lesseeName}
                disabled={!lesseeEditable}
                onChange={(e) => setField('lesseeName', e.target.value)}
              />
            </Field>
            <Field label="Phone (10 digits) *">
              <input
                className={lesseeEditable ? inputClass : inputDisabledClass}
                value={form.lesseePhone}
                disabled={!lesseeEditable}
                onChange={(e) => setField('lesseePhone', e.target.value)}
              />
            </Field>
            <Field label="Address">
              <textarea
                className={lesseeEditable ? inputClass : inputDisabledClass}
                rows={2}
                value={form.lesseeAddress}
                disabled={!lesseeEditable}
                onChange={(e) => setField('lesseeAddress', e.target.value)}
              />
            </Field>
            <p className="text-xs font-medium text-gray-700 pt-1">Tenant Aadhaar *</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FileOrUrlField
                label="Aadhaar front"
                value={form.lesseeAadhaarFront}
                disabled={!lesseeEditable}
                required={isTenant}
                onUploaded={(v) => setField('lesseeAadhaarFront', v)}
              />
              <FileOrUrlField
                label="Aadhaar back"
                value={form.lesseeAadhaarBack}
                disabled={!lesseeEditable}
                required={isTenant}
                onUploaded={(v) => setField('lesseeAadhaarBack', v)}
              />
            </div>
            <p className="text-xs font-medium text-gray-700 pt-1">Income documents *</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FileOrUrlField
                label="PAN card"
                value={form.panCard}
                disabled={!lesseeEditable}
                required={isTenant}
                onUploaded={(v) => setField('panCard', v)}
              />
              <FileOrUrlField
                label="Salary slip"
                value={form.salarySlip}
                disabled={!lesseeEditable}
                required={isTenant}
                onUploaded={(v) => setField('salarySlip', v)}
              />
              <FileOrUrlField
                label="Bank statement"
                value={form.bankStatement}
                disabled={!lesseeEditable}
                required={isTenant}
                onUploaded={(v) => setField('bankStatement', v)}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            {!rentEditable && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Rent details are set by the owner and are read-only for tenants.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Monthly rent (₹)">
                <input
                  className={rentEditable ? inputClass : inputDisabledClass}
                  type="number"
                  value={form.rentAmount}
                  disabled={!rentEditable}
                  onChange={(e) => setField('rentAmount', e.target.value)}
                />
              </Field>
              <Field label="Security deposit / rental advance (₹)">
                <input
                  className={rentEditable ? inputClass : inputDisabledClass}
                  type="number"
                  value={form.depositAmount}
                  disabled={!rentEditable}
                  onChange={(e) => setField('depositAmount', e.target.value)}
                />
              </Field>
              <Field label="Rent start date">
                <input
                  className={rentEditable ? inputClass : inputDisabledClass}
                  type="date"
                  value={form.rentStartDate}
                  disabled={!rentEditable}
                  onChange={(e) => setField('rentStartDate', e.target.value)}
                />
              </Field>
              <Field label="Rent end date">
                <input
                  className={rentEditable ? inputClass : inputDisabledClass}
                  type="date"
                  value={form.rentEndDate}
                  disabled={!rentEditable}
                  onChange={(e) => setField('rentEndDate', e.target.value)}
                />
              </Field>
              <Field label="Monthly rent due day (1–28)">
                <input
                  className={rentEditable ? inputClass : inputDisabledClass}
                  type="number"
                  min="1"
                  max="28"
                  value={form.rentDueDay}
                  disabled={!rentEditable}
                  onChange={(e) => setField('rentDueDay', e.target.value)}
                />
              </Field>
            </div>
            <p className="text-sm text-gray-600">
              Summary: {money(form.rentAmount)}/mo · deposit {money(form.depositAmount)} ·{' '}
              {form.rentStartDate || '—'} → {form.rentEndDate || '—'}
            </p>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <Field label="Nominee name">
              <input
                className={nomineeEditable ? inputClass : inputDisabledClass}
                value={form.nomineeName}
                disabled={!nomineeEditable}
                onChange={(e) => setField('nomineeName', e.target.value)}
              />
            </Field>
            <Field label="Nominee phone">
              <input
                className={nomineeEditable ? inputClass : inputDisabledClass}
                value={form.nomineePhone}
                disabled={!nomineeEditable}
                onChange={(e) => setField('nomineePhone', e.target.value)}
              />
            </Field>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3">
            <AgreementTermsList
              terms={form.terms || []}
              disabled={!termsEditable}
              onChange={(terms) => setForm((prev) => ({ ...prev, terms }))}
            />
            {isTenant && lesseeEditable && (
              <Field label="Notes for owner (optional)">
                <textarea
                  className={inputClass}
                  rows={2}
                  value={form.correctionNotes}
                  onChange={(e) => setField('correctionNotes', e.target.value)}
                />
              </Field>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-100 bg-slate-50 p-4 text-sm space-y-1">
              <p>
                <span className="text-gray-500">Property:</span> {form.propertyAddress || '—'}
              </p>
              <p>
                <span className="text-gray-500">Owner:</span> {form.lessorName || '—'} ·{' '}
                {form.lessorPhone || '—'}
              </p>
              <p>
                <span className="text-gray-500">Tenant:</span> {form.lesseeName || '—'} ·{' '}
                {form.lesseePhone || '—'}
              </p>
              <p>
                <span className="text-gray-500">Rent:</span> {money(form.rentAmount)}/mo · deposit{' '}
                {money(form.depositAmount)}
              </p>
              <p>
                <span className="text-gray-500">Nominee:</span> {form.nomineeName || '—'} ·{' '}
                {form.nomineePhone || '—'}
              </p>
            </div>

            {locked && (
              <p className="text-sm text-red-900 bg-red-50 border border-red-100 rounded-lg p-3">
                Digitally approved
                {agreement?.tenant_accepted_at
                  ? ` on ${new Date(agreement.tenant_accepted_at).toLocaleString('en-IN')}`
                  : ''}
                . This document is maintained as a record and can no longer be edited.
              </p>
            )}

            {isTenant && canEdit && (
              <label className="flex items-start gap-2 text-sm text-gray-800 border border-red-100 rounded-lg p-3 bg-red-50/50">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={agreedDigital}
                  onChange={(e) => setAgreedDigital(e.target.checked)}
                />
                <span>
                  I digitally sign and approve this rental agreement. I confirm my uploaded details are
                  correct and I accept the terms listed in Details.
                </span>
              </label>
            )}

            <div className="flex flex-wrap gap-2">
              {canEdit && (
                <button
                  type="button"
                  disabled={saving || approving}
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg border text-sm disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              )}
              {isTenant && canEdit && (
                <button
                  type="button"
                  disabled={saving || approving}
                  onClick={handleApprove}
                  className="px-4 py-2 rounded-lg bg-red-700 text-white text-sm disabled:opacity-60"
                >
                  {approving ? 'Approving…' : 'Approve (digital sign)'}
                </button>
              )}
              {agreement && (
                <PDFDownloadLink
                  document={<RentalAgreementPDF agreement={agreement} company={company} />}
                  fileName={`Rental-Agreement-${agreement.id}.pdf`}
                  className="px-4 py-2 rounded-lg border text-sm inline-flex items-center"
                >
                  {({ loading }) => (loading ? 'Preparing PDF…' : 'Download PDF')}
                </PDFDownloadLink>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-2 border-t border-gray-100">
          <div className="flex gap-2">
            {onBack && (
              <button type="button" className="text-sm px-3 py-2 rounded-lg border" onClick={onBack}>
                {backLabel}
              </button>
            )}
            <button
              type="button"
              className="text-sm px-3 py-2 rounded-lg border disabled:opacity-40"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Back
            </button>
          </div>
          {step < 7 && (
            <button
              type="button"
              className="text-sm px-3 py-2 rounded-lg bg-red-700 text-white"
              onClick={() => setStep((s) => Math.min(7, s + 1))}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgreementSevenStepReview;
