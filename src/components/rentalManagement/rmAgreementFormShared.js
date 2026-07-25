import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../utils/apiConfig';
import { uploadImage } from '../../utils/uploadImage';
import { downloadImage } from '../../utils/downloadImage';

/** Default Details points — used as agreement template. */
export const DEFAULT_AGREEMENT_TERMS = [
  'Security deposit / advance should be given back on the end of tenancy',
  'Property should be given back at the same condition back to house owner without any damage',
];

export const AGREEMENT_REVIEW_STEPS = [
  { id: 1, title: 'Property details' },
  { id: 2, title: 'Owner (Lessor)' },
  { id: 3, title: 'Lessee (Tenant)' },
  { id: 4, title: 'Rent details' },
  { id: 5, title: 'Nominee' },
  { id: 6, title: 'Details' },
  { id: 7, title: 'Review & approve' },
];

export const resolvePreviewUrl = async (storedUrl) => {
  if (!storedUrl) return null;
  if (
    storedUrl.startsWith('blob:') ||
    storedUrl.startsWith('data:') ||
    storedUrl.startsWith('http://localhost') ||
    storedUrl.startsWith('https://i.')
  ) {
    return storedUrl;
  }
  if (storedUrl.includes('amazonaws.com') || !storedUrl.startsWith('http')) {
    const key = storedUrl.split('/').pop()?.split('?')[0];
    if (!key) return storedUrl;
    const signed = await downloadImage(key, API_BASE_URL);
    return signed || storedUrl;
  }
  return storedUrl;
};

export const Field = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-xs font-medium text-gray-600">{label}</span>
    {children}
  </label>
);

export const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm';
export const inputDisabledClass = `${inputClass} bg-gray-50 text-gray-600 cursor-not-allowed`;

export const FileOrUrlField = ({ label, value, onUploaded, disabled = false, required = false }) => {
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!value) {
        setPreviewUrl(null);
        return;
      }
      if (value.toLowerCase().includes('.pdf')) {
        setPreviewUrl(null);
        return;
      }
      const next = await resolvePreviewUrl(value);
      if (!cancelled) setPreviewUrl(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || disabled) return;
    const localPreview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    if (localPreview) setPreviewUrl(localPreview);
    setBusy(true);
    const url = await uploadImage(file, API_BASE_URL, (msg) => toast.error(msg));
    setBusy(false);
    if (url) {
      onUploaded(url);
      const remotePreview = await resolvePreviewUrl(url);
      if (remotePreview && remotePreview !== localPreview) {
        if (localPreview) URL.revokeObjectURL(localPreview);
        setPreviewUrl(remotePreview);
      }
    }
  };

  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-gray-600">
        {label}
        {required ? ' *' : ''}
      </span>
      {!disabled && (
        <input
          type="file"
          accept="image/*,.pdf"
          className="mt-1 text-xs block w-full"
          onChange={onFile}
          disabled={busy || disabled}
        />
      )}
      {busy && <p className="text-xs text-gray-500">Uploading…</p>}
      {previewUrl && (
        <img src={previewUrl} alt={label} className="mt-1 h-24 w-auto rounded border object-cover" />
      )}
      {value && !previewUrl && (
        <p className="text-xs text-red-700 truncate mt-1">
          Saved{value.toLowerCase().includes('.pdf') ? ' (PDF)' : ''}
        </p>
      )}
      {!value && disabled && <p className="text-xs text-gray-400">Not uploaded</p>}
    </div>
  );
};

export const AgreementTermsList = ({ terms = [], onChange, disabled = false }) => {
  const updatePoint = (index, value) => {
    if (disabled) return;
    onChange(terms.map((t, i) => (i === index ? value : t)));
  };

  const addPoint = () => {
    if (disabled) return;
    onChange([...terms, '']);
  };

  const removePoint = (index) => {
    if (disabled) return;
    onChange(terms.filter((_, i) => i !== index));
  };

  const resetTemplate = () => {
    if (disabled) return;
    onChange([...DEFAULT_AGREEMENT_TERMS]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-800">Agreement details / rules</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Default template points can be edited. These appear in the agreement PDF.
          </p>
        </div>
        {!disabled && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetTemplate}
              className="text-xs px-2.5 py-1 rounded-lg border text-gray-700 hover:bg-gray-50 whitespace-nowrap"
            >
              Reset template
            </button>
            <button
              type="button"
              onClick={addPoint}
              className="text-xs px-2.5 py-1 rounded-lg border border-red-700 text-red-800 hover:bg-red-50 whitespace-nowrap"
            >
              + Add
            </button>
          </div>
        )}
      </div>
      {terms.length === 0 ? (
        <p className="text-sm text-gray-500 border border-dashed rounded-lg px-3 py-4">
          No points yet.{!disabled ? ' Click + Add or Reset template.' : ''}
        </p>
      ) : (
        <div className="space-y-2">
          {terms.map((point, index) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="text-xs font-medium text-gray-500 pt-2.5 w-6 shrink-0">{index + 1}.</span>
              <textarea
                className={`${disabled ? inputDisabledClass : inputClass} flex-1`}
                rows={2}
                placeholder="Enter rule / point"
                value={point}
                disabled={disabled}
                onChange={(e) => updatePoint(index, e.target.value)}
              />
              {!disabled && (
                <button
                  type="button"
                  className="text-xs text-red-600 px-2 py-2 shrink-0"
                  onClick={() => removePoint(index)}
                  title="Remove"
                >
                  − Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Build editable form state from an agreement API row. */
export const formFromAgreement = (found) => {
  const tenant = found?.tenant || {};
  const terms =
    Array.isArray(found?.terms) && found.terms.length
      ? found.terms.map((t) => String(t || ''))
      : [...DEFAULT_AGREEMENT_TERMS];
  return {
    lesseeName: found?.lessee_name_snapshot || tenant.rm_cust_name || '',
    lesseePhone: found?.lessee_phone_snapshot || tenant.rm_cust_phone || '',
    lesseeAddress: tenant.rm_cust_address || '',
    lesseePhoto: tenant.rm_cust_photo || '',
    lesseeAadhaarFront: tenant.rm_cust_aadhaar_frontside || '',
    lesseeAadhaarBack: tenant.rm_cust_aadhaar_backside || '',
    panCard: tenant.rm_cust_pan || '',
    salarySlip: tenant.rm_cust_salary_slip || '',
    bankStatement: tenant.rm_cust_bank_statement || '',
    lessorName: found?.lessor_name || '',
    lessorPhone: found?.lessor_phone || '',
    lessorAddress: found?.lessor_address || '',
    lessorAadhaarFront: found?.lessor_aadhaar_frontside || '',
    lessorAadhaarBack: found?.lessor_aadhaar_backside || '',
    rentAmount: found?.rent_amount != null ? String(found.rent_amount) : '',
    depositAmount: found?.deposit_amount != null ? String(found.deposit_amount) : '',
    rentStartDate: found?.rent_start_date || '',
    rentEndDate: found?.rent_end_date || '',
    rentDueDay: found?.rent_due_day != null ? String(found.rent_due_day) : '1',
    nomineeName: tenant.rm_nominee_name || '',
    nomineePhone: tenant.rm_nominee_phone || '',
    terms,
    correctionNotes: found?.tenant_correction_notes || '',
    materials: (found?.materials || []).length
      ? found.materials.map((m) => ({
          itemName: m.item_name || m.itemName || '',
          quantity: String(m.quantity != null ? m.quantity : 1),
        }))
      : [],
    propertyTitle: found?.property?.title || '',
    propertyAddress: found?.property_address_snapshot || found?.property?.address || '',
    propertyCity: found?.property?.city || '',
    propertyState: found?.property?.state || '',
    propertyPincode: found?.property?.pincode || '',
  };
};

export const tenantMissingUploads = (form) => {
  const missing = [];
  if (!form.lesseePhoto) missing.push('Tenant photo');
  if (!form.lesseeAadhaarFront) missing.push('Aadhaar front');
  if (!form.lesseeAadhaarBack) missing.push('Aadhaar back');
  if (!form.panCard) missing.push('PAN card');
  if (!form.salarySlip) missing.push('Salary slip');
  if (!form.bankStatement) missing.push('Bank statement');
  if (!String(form.lesseeName || '').trim()) missing.push('Name');
  if (!/^[0-9]{10}$/.test(String(form.lesseePhone || '').trim())) missing.push('10-digit phone');
  return missing;
};
