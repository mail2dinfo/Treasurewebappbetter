import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { useRentalManagementContext } from '../../context/rentalManagement/RentalManagementContext';
import RentalAgreementPDF from '../PDF/RentalAgreementPDF';
import { API_BASE_URL } from '../../utils/apiConfig';
import { uploadImage } from '../../utils/uploadImage';
import { downloadImage } from '../../utils/downloadImage';
import { RM_BASE_PATH } from './rentalManagementMenuItems';
import { useHistory } from 'react-router-dom';
import { DEFAULT_AGREEMENT_TERMS } from './rmAgreementFormShared';

/** S3 object keys are private — resolve a browser-viewable URL when needed. */
const resolvePreviewUrl = async (storedUrl) => {
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

const STEPS = [
  { id: 1, title: 'Property details' },
  { id: 2, title: 'Owner (Lessor)' },
  { id: 3, title: 'Lessee (Tenant)' },
  { id: 4, title: 'Rent details' },
  { id: 5, title: 'Nominee' },
  { id: 6, title: 'Details' },
  { id: 7, title: 'Create & share' },
];

const emptyState = {
  property: {
    useExistingId: '',
    title: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    photos: [],
  },
  lessor: { name: '', phone: '', address: '', aadhaarFront: '', aadhaarBack: '' },
  lessee: {
    name: '',
    phone: '',
    address: '',
    photo: '',
    aadhaarFront: '',
    aadhaarBack: '',
    panCard: '',
    salarySlip: '',
    bankStatement: '',
  },
  rent: {
    rentAmount: '',
    depositAmount: '',
    rentStartDate: '',
    rentEndDate: '',
    rentDueDay: '1',
  },
  nominee: { name: '', phone: '' },
  terms: [...DEFAULT_AGREEMENT_TERMS],
  materials: [{ itemName: '', quantity: '1' }],
  signedDocUrl: '',
};

const Field = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-xs font-medium text-gray-600">{label}</span>
    {children}
  </label>
);

const inputClass = 'w-full border rounded-lg px-3 py-2 text-sm';

const FileOrUrlField = ({ label, value, onUploaded }) => {
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
    if (!file) return;
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
    } else if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(null);
    }
  };

  return (
    <Field label={label}>
      <input className={inputClass} placeholder="Paste URL or upload below" value={value || ''} onChange={(e) => onUploaded(e.target.value)} />
      <input type="file" accept="image/*,.pdf" className="mt-1 text-xs" onChange={onFile} disabled={busy} />
      {busy && <p className="text-xs text-gray-500">Uploading…</p>}
      {previewUrl ? (
        <img src={previewUrl} alt="" className="mt-2 h-24 w-24 rounded-lg object-cover border border-gray-200" />
      ) : value ? (
        <p className="text-xs text-red-700 truncate mt-1">Saved{value.toLowerCase().includes('.pdf') ? ' (PDF)' : ''}</p>
      ) : null}
    </Field>
  );
};

/** Multiple property photos — upload several files or paste URLs */
const MultiPropertyPhotos = ({ photos = [], onChange }) => {
  const [busy, setBusy] = useState(false);
  const [urlDraft, setUrlDraft] = useState('');

  // Resolve S3 URLs to viewable previews (e.g. existing property photos)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const needsResolve = photos.some(
        (p) =>
          p?.photoUrl &&
          !String(p.photoUrl).startsWith('pending:') &&
          (!p.previewUrl || p.previewUrl === p.photoUrl) &&
          (p.photoUrl.includes('amazonaws.com') || !String(p.photoUrl).startsWith('http'))
      );
      if (!needsResolve) return;

      const next = await Promise.all(
        photos.map(async (p) => {
          if (
            !p?.photoUrl ||
            String(p.photoUrl).startsWith('pending:') ||
            (p.previewUrl && p.previewUrl !== p.photoUrl && !p.previewUrl.includes('amazonaws.com'))
          ) {
            return p;
          }
          const previewUrl = await resolvePreviewUrl(p.photoUrl);
          return previewUrl && previewUrl !== p.previewUrl ? { ...p, previewUrl } : p;
        })
      );
      if (!cancelled) {
        const changed = next.some((p, i) => p.previewUrl !== photos[i]?.previewUrl);
        if (changed) onChange(next);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-resolve when photo URLs change
  }, [photos.map((p) => p.photoUrl).join('|')]);

  const addPhotos = (entries) => {
    const next = [...photos];
    entries.forEach((entry) => {
      if (!entry?.photoUrl) return;
      if (next.some((p) => p.photoUrl === entry.photoUrl)) return;
      next.push({
        photoUrl: entry.photoUrl,
        previewUrl: entry.previewUrl || entry.photoUrl,
        caption: entry.caption || `Photo ${next.length + 1}`,
      });
    });
    onChange(next);
  };

  const removeAt = (index) => {
    const target = photos[index];
    if (target?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(target.previewUrl);
    }
    onChange(photos.filter((_, i) => i !== index));
  };

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const basePhotos = photos.filter(
      (p) => p?.photoUrl && !String(p.photoUrl).startsWith('pending:')
    );

    const locals = files.map((file, idx) => ({
      photoUrl: `pending:${Date.now()}-${idx}-${file.name}`,
      previewUrl: URL.createObjectURL(file),
      caption: file.name || `Photo ${basePhotos.length + idx + 1}`,
      pending: true,
      _file: file,
    }));

    // Show local previews immediately
    onChange([...basePhotos, ...locals]);
    setBusy(true);

    const uploaded = [];
    for (const item of locals) {
      const url = await uploadImage(item._file, API_BASE_URL, (msg) => toast.error(msg));
      if (url) {
        const remotePreview = await resolvePreviewUrl(url);
        if (remotePreview && remotePreview !== item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
        uploaded.push({
          photoUrl: url,
          previewUrl: remotePreview || item.previewUrl,
          caption: item.caption,
        });
      } else {
        URL.revokeObjectURL(item.previewUrl);
      }
    }

    onChange([...basePhotos, ...uploaded]);
    setBusy(false);
    if (uploaded.length) {
      toast.success(`${uploaded.length} photo(s) added`);
    }
  };

  const addUrl = async () => {
    const url = urlDraft.trim();
    if (!url) return;
    setBusy(true);
    const previewUrl = await resolvePreviewUrl(url);
    addPhotos([{ photoUrl: url, previewUrl: previewUrl || url, caption: `Photo ${photos.length + 1}` }]);
    setUrlDraft('');
    setBusy(false);
  };

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-gray-600">Property photos (multiple)</span>
      <input
        type="file"
        accept="image/*"
        multiple
        className="block w-full text-xs"
        onChange={onFiles}
        disabled={busy}
      />
      {busy && <p className="text-xs text-gray-500">Uploading photos…</p>}
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="Or paste image URL and add"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={busy}
          className="shrink-0 px-3 py-2 rounded-lg border text-sm disabled:opacity-50"
        >
          Add URL
        </button>
      </div>
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          {photos.map((p, index) => (
            <div key={`${p.photoUrl}-${index}`} className="relative border rounded-lg overflow-hidden bg-gray-50">
              {(p.previewUrl || p.photoUrl) ? (
                <img
                  src={p.previewUrl || p.photoUrl}
                  alt={p.caption || `Property ${index + 1}`}
                  className="h-28 w-full object-cover bg-gray-100"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      'data:image/svg+xml,' +
                      encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect fill="#f3f4f6" width="100%" height="100%"/><text x="50%" y="50%" text-anchor="middle" fill="#9ca3af" font-size="12">Preview unavailable</text></svg>'
                      );
                  }}
                />
              ) : (
                <div className="h-28 w-full flex items-center justify-center text-xs text-gray-400">
                  No preview
                </div>
              )}
              <div className="p-2 flex items-center justify-between gap-1">
                <p className="text-xs text-gray-600 truncate">{p.caption || `Photo ${index + 1}`}</p>
                <button
                  type="button"
                  className="text-xs text-red-600 shrink-0"
                  onClick={() => removeAt(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">No photos yet — upload several at once or add URLs.</p>
      )}
      <p className="text-xs text-gray-500">{photos.length} photo(s) selected</p>
    </div>
  );
};

/** Materials with name + quantity (Fan × 2, Tube light × 2, …) */
const MaterialsList = ({ materials = [], onChange }) => {
  const updateRow = (index, key, value) => {
    const next = materials.map((row, i) => (i === index ? { ...row, [key]: value } : row));
    onChange(next);
  };

  const addRow = () => {
    onChange([...materials, { itemName: '', quantity: '1' }]);
  };

  const removeRow = (index) => {
    if (materials.length <= 1) {
      onChange([{ itemName: '', quantity: '1' }]);
      return;
    }
    onChange(materials.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-600">Materials in property</span>
        <button
          type="button"
          onClick={addRow}
          className="text-xs px-2.5 py-1 rounded-lg border border-red-700 text-red-800 hover:bg-red-50"
        >
          + Add item
        </button>
      </div>
      <div className="space-y-2">
        {materials.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_5.5rem_auto] gap-2 items-end">
            <Field label={index === 0 ? 'Item name' : ''}>
              <input
                className={inputClass}
                placeholder="e.g. Fan, Tube light"
                value={row.itemName}
                onChange={(e) => updateRow(index, 'itemName', e.target.value)}
              />
            </Field>
            <Field label={index === 0 ? 'No. of items' : ''}>
              <input
                className={inputClass}
                type="number"
                min="1"
                step="1"
                placeholder="Qty"
                value={row.quantity}
                onChange={(e) => updateRow(index, 'quantity', e.target.value)}
              />
            </Field>
            <button
              type="button"
              className="mb-0.5 text-xs text-red-600 px-2 py-2"
              onClick={() => removeRow(index)}
              title="Remove"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        Example: Fan — 2, Tube light — 2, Wardrobe — 1
      </p>
    </div>
  );
};

const AgreementTermsList = ({ terms = [], onChange }) => {
  const updatePoint = (index, value) => {
    onChange(terms.map((t, i) => (i === index ? value : t)));
  };

  const addPoint = () => {
    onChange([...terms, '']);
  };

  const removePoint = (index) => {
    onChange(terms.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-gray-800">Agreement details / rules</p>
          <p className="text-xs text-gray-500 mt-0.5">
            These points are included in the agreement PDF. Add or remove as needed.
          </p>
        </div>
        <button
          type="button"
          onClick={addPoint}
          className="text-xs px-2.5 py-1 rounded-lg border border-red-700 text-red-800 hover:bg-red-50 whitespace-nowrap"
        >
          + Add
        </button>
      </div>
      {terms.length === 0 ? (
        <p className="text-sm text-gray-500 border border-dashed rounded-lg px-3 py-4">
          No points yet. Click + Add to create a rule for the document.
        </p>
      ) : (
        <div className="space-y-2">
          {terms.map((point, index) => (
            <div key={index} className="flex gap-2 items-start">
              <span className="text-xs font-medium text-gray-500 pt-2.5 w-6 shrink-0">
                {index + 1}.
              </span>
              <textarea
                className={`${inputClass} flex-1`}
                rows={2}
                placeholder="Enter rule / point"
                value={point}
                onChange={(e) => updatePoint(index, e.target.value)}
              />
              <button
                type="button"
                className="text-xs text-red-600 px-2 py-2 shrink-0"
                onClick={() => removePoint(index)}
                title="Remove"
              >
                − Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PrepareRentalAgreementWizard = () => {
  const history = useHistory();
  const {
    companies,
    properties,
    prepareCompleteAgreement,
    fetchProperties,
  } = useRentalManagementContext();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyState);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(null);

  const company = companies?.[0];

  const agreementForPdf = useMemo(() => {
    if (!completed?.agreement) return null;
    return completed.agreement;
  }, [completed]);

  const setNested = (section, key, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (form.property.useExistingId) return true;
      if (!form.property.address.trim()) {
        toast.error('Property address is required');
        return false;
      }
    }
    if (step === 2) {
      if (!form.lessor.name.trim()) {
        toast.error('Owner / lessor name is required');
        return false;
      }
    }
    if (step === 3) {
      if (!form.lessee.name.trim() || !/^[0-9]{10}$/.test(String(form.lessee.phone).trim())) {
        toast.error('Lessee name and 10-digit phone are required');
        return false;
      }
    }
    if (step === 4) {
      if (!form.rent.rentAmount || !form.rent.rentStartDate || !form.rent.rentEndDate) {
        toast.error('Rent amount and rental period are required');
        return false;
      }
      if (form.rent.rentEndDate < form.rent.rentStartDate) {
        toast.error('End date must be after start date');
        return false;
      }
    }
    if (step === 6) {
      const filled = (form.terms || []).map((t) => String(t || '').trim()).filter(Boolean);
      if (filled.length === 0) {
        toast.error('Add at least one detail / rule point, or keep the defaults');
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(7, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const onSelectExistingProperty = (id) => {
    const p = (properties || []).find((x) => x.id === id);
    setForm((prev) => ({
      ...prev,
      property: {
        ...prev.property,
        useExistingId: id,
        title: p?.title || '',
        address: p?.address || '',
        city: p?.city || '',
        state: p?.state || '',
        pincode: p?.pincode || '',
        photos: (p?.photos || [])
          .map((ph) => ({
            photoUrl: ph.photo_url || ph.photoUrl,
            previewUrl:
              ph.photo_url_s3_image || ph.photo_url || ph.photoUrl || null,
            caption: ph.caption || 'Property photo',
          }))
          .filter((ph) => ph.photoUrl),
      },
      rent: {
        ...prev.rent,
        depositAmount:
          p?.security_deposit != null ? String(p.security_deposit) : prev.rent.depositAmount,
      },
    }));
  };

  const buildShareText = (agreement, extras = {}) => {
    const a = agreement || {};
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const loginUrl = `${origin}/login`;
    const appUrl = `${origin}${extras.agreementPath || extras.portalPath || '/rental-management/customer/dashboard'}`;
    const phone = extras.username || a.lessee_phone_snapshot || '';
    const password = extras.password || String(phone).replace(/\D/g, '').substring(0, 4);
    return [
      'Rental Agreement — please review',
      `Property: ${a.property_address_snapshot || ''}`,
      `Rent: ₹${a.rent_amount}/month · Deposit: ₹${a.deposit_amount}`,
      `Period: ${a.rent_start_date} to ${a.rent_end_date}`,
      '',
      'Login to review & approve:',
      `Link: ${loginUrl}`,
      `Then open: ${appUrl}`,
      `Username (phone): ${phone}`,
      `Password: first 4 digits of phone (${password})`,
      '',
      'After you approve, the owner will create the agreement.',
    ].join('\n');
  };

  const shareWhatsApp = () => {
    if (!agreementForPdf) return;
    const hint = completed?.loginHint || {};
    const text = encodeURIComponent(buildShareText(agreementForPdf, hint));
    const phone = String(hint.username || agreementForPdf.lessee_phone_snapshot || '').replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/91${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const shareGmail = () => {
    if (!agreementForPdf) return;
    const hint = completed?.loginHint || {};
    const subject = encodeURIComponent('Rental Agreement — please review');
    const body = encodeURIComponent(buildShareText(agreementForPdf, hint));
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank', 'noopener,noreferrer');
  };

  const printPdf = async () => {
    if (!agreementForPdf) return;
    const blob = await pdf(
      <RentalAgreementPDF agreement={agreementForPdf} company={company} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) {
      w.addEventListener('load', () => {
        w.focus();
        w.print();
      });
    }
  };

  const createAgreement = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const materials = (form.materials || [])
        .map((m) => ({
          itemName: String(m.itemName || '').trim(),
          quantity: Math.max(1, parseInt(m.quantity, 10) || 1),
        }))
        .filter((m) => m.itemName);

      const photos = (form.property.photos || [])
        .filter((p) => p?.photoUrl && !String(p.photoUrl).startsWith('pending:'))
        .map((p, idx) => ({
          photoUrl: p.photoUrl,
          caption: p.caption || `Property photo ${idx + 1}`,
        }));

      const result = await prepareCompleteAgreement({
        companyId: company?.id || null,
        property: {
          propertyId: form.property.useExistingId || undefined,
          title: form.property.title,
          address: form.property.address,
          city: form.property.city,
          state: form.property.state,
          pincode: form.property.pincode,
          securityDeposit: form.rent.depositAmount,
          photos,
        },
        lessor: form.lessor,
        lessee: form.lessee,
        rent: form.rent,
        nominee: form.nominee,
        terms: (form.terms || []).map((t) => String(t || '').trim()).filter(Boolean),
        materials,
        signedDocUrl: form.signedDocUrl || null,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed');
        return;
      }
      toast.success(result.message || 'Agreement created');
      setCompleted(result.data);
      setStep(7);
      fetchProperties();
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setForm({
      ...emptyState,
      property: { ...emptyState.property, photos: [] },
      lessor: { ...emptyState.lessor },
      lessee: { ...emptyState.lessee },
      rent: { ...emptyState.rent },
      nominee: { ...emptyState.nominee },
      terms: [...DEFAULT_AGREEMENT_TERMS],
      materials: [{ itemName: '', quantity: '1' }],
    });
    setCompleted(null);
    setStep(1);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white">
        <h2 className="text-lg font-semibold">Prepare rental agreement</h2>
        <p className="text-sm text-red-100 mt-1">
          Step-by-step document for each property. Rent installments are created when you finish.
        </p>
      </div>

      <div className="px-5 pt-4 flex flex-wrap gap-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              if (completed) return;
              setStep(s.id);
            }}
            className={`text-xs px-2.5 py-1 rounded-full border ${
              step === s.id
                ? 'bg-red-700 text-white border-red-700'
                : 'bg-white text-gray-600 border-gray-200 hover:border-red-400 hover:text-red-800'
            } ${completed ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
          >
            {s.id}. {s.title}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {step === 1 && (
          <div className="space-y-3">
            <Field label="Use existing property (optional)">
              <select
                className={inputClass}
                value={form.property.useExistingId}
                onChange={(e) => {
                  if (!e.target.value) {
                    setNested('property', 'useExistingId', '');
                    return;
                  }
                  onSelectExistingProperty(e.target.value);
                }}
              >
                <option value="">Create new property</option>
                {(properties || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title || p.address}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Title">
              <input className={inputClass} value={form.property.title} onChange={(e) => setNested('property', 'title', e.target.value)} />
            </Field>
            <Field label="Property address *">
              <textarea className={inputClass} rows={2} value={form.property.address} onChange={(e) => setNested('property', 'address', e.target.value)} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="City"><input className={inputClass} value={form.property.city} onChange={(e) => setNested('property', 'city', e.target.value)} /></Field>
              <Field label="State"><input className={inputClass} value={form.property.state} onChange={(e) => setNested('property', 'state', e.target.value)} /></Field>
              <Field label="Pincode"><input className={inputClass} value={form.property.pincode} onChange={(e) => setNested('property', 'pincode', e.target.value)} /></Field>
            </div>
            <MultiPropertyPhotos
              photos={form.property.photos || []}
              onChange={(photos) => setNested('property', 'photos', photos)}
            />
            <MaterialsList
              materials={form.materials || []}
              onChange={(materials) => setForm((prev) => ({ ...prev, materials }))}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <Field label="Owner / Lessor name *">
              <input className={inputClass} value={form.lessor.name} onChange={(e) => setNested('lessor', 'name', e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={form.lessor.phone} onChange={(e) => setNested('lessor', 'phone', e.target.value)} />
            </Field>
            <Field label="Address">
              <textarea className={inputClass} rows={2} value={form.lessor.address} onChange={(e) => setNested('lessor', 'address', e.target.value)} />
            </Field>
            <p className="text-xs font-medium text-gray-700 pt-1">Owner Aadhaar card</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FileOrUrlField
                label="Aadhaar front side"
                value={form.lessor.aadhaarFront}
                onUploaded={(v) => setNested('lessor', 'aadhaarFront', v)}
              />
              <FileOrUrlField
                label="Aadhaar back side"
                value={form.lessor.aadhaarBack}
                onUploaded={(v) => setNested('lessor', 'aadhaarBack', v)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <FileOrUrlField label="Tenant photo" value={form.lessee.photo} onUploaded={(v) => setNested('lessee', 'photo', v)} />
            <Field label="Tenant / Lessee name *">
              <input className={inputClass} value={form.lessee.name} onChange={(e) => setNested('lessee', 'name', e.target.value)} />
            </Field>
            <Field label="Phone (10 digits) *">
              <input className={inputClass} value={form.lessee.phone} onChange={(e) => setNested('lessee', 'phone', e.target.value)} />
            </Field>
            <Field label="Address">
              <textarea className={inputClass} rows={2} value={form.lessee.address} onChange={(e) => setNested('lessee', 'address', e.target.value)} />
            </Field>
            <p className="text-xs font-medium text-gray-700 pt-1">Tenant Aadhaar card</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FileOrUrlField
                label="Aadhaar front side"
                value={form.lessee.aadhaarFront}
                onUploaded={(v) => setNested('lessee', 'aadhaarFront', v)}
              />
              <FileOrUrlField
                label="Aadhaar back side"
                value={form.lessee.aadhaarBack}
                onUploaded={(v) => setNested('lessee', 'aadhaarBack', v)}
              />
            </div>
            <p className="text-xs font-medium text-gray-700 pt-1">Income documents</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FileOrUrlField
                label="Salary slip"
                value={form.lessee.salarySlip}
                onUploaded={(v) => setNested('lessee', 'salarySlip', v)}
              />
              <FileOrUrlField
                label="PAN card"
                value={form.lessee.panCard}
                onUploaded={(v) => setNested('lessee', 'panCard', v)}
              />
              <FileOrUrlField
                label="Bank statement"
                value={form.lessee.bankStatement}
                onUploaded={(v) => setNested('lessee', 'bankStatement', v)}
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Monthly rent (₹) *">
              <input className={inputClass} type="number" min="0" value={form.rent.rentAmount} onChange={(e) => setNested('rent', 'rentAmount', e.target.value)} />
            </Field>
            <Field label="Security deposit / rental advance (₹)">
              <input className={inputClass} type="number" min="0" value={form.rent.depositAmount} onChange={(e) => setNested('rent', 'depositAmount', e.target.value)} />
            </Field>
            <Field label="Rent start date *">
              <input className={inputClass} type="date" value={form.rent.rentStartDate} onChange={(e) => setNested('rent', 'rentStartDate', e.target.value)} />
            </Field>
            <Field label="Rent end date *">
              <input className={inputClass} type="date" value={form.rent.rentEndDate} onChange={(e) => setNested('rent', 'rentEndDate', e.target.value)} />
            </Field>
            <Field label="Monthly rent due day (1–28)">
              <input className={inputClass} type="number" min="1" max="28" value={form.rent.rentDueDay} onChange={(e) => setNested('rent', 'rentDueDay', e.target.value)} />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <Field label="Nominee name">
              <input className={inputClass} value={form.nominee.name} onChange={(e) => setNested('nominee', 'name', e.target.value)} />
            </Field>
            <Field label="Nominee phone">
              <input className={inputClass} value={form.nominee.phone} onChange={(e) => setNested('nominee', 'phone', e.target.value)} />
            </Field>
            <p className="text-xs text-gray-500">
              Next, add general points / rules that will appear in the agreement document.
            </p>
          </div>
        )}

        {step === 6 && (
          <AgreementTermsList
            terms={form.terms || []}
            onChange={(terms) => setForm((prev) => ({ ...prev, terms }))}
          />
        )}

        {step === 7 && (
          <div className="space-y-4">
            {!completed ? (
              <div className="space-y-3">
                <FileOrUrlField
                  label="Upload signed rental agreement (PDF/image)"
                  value={form.signedDocUrl}
                  onUploaded={(v) => setForm((prev) => ({ ...prev, signedDocUrl: v }))}
                />
                <div className="rounded-lg border border-dashed border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-900 font-medium">Ready to share for tenant review</p>
                  <p className="text-sm text-red-800 mt-1">
                    This saves the draft agreement and opens it for the tenant to review and approve. Rent schedule is created after you activate it.
                  </p>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={createAgreement}
                    className="mt-3 px-4 py-2 rounded-lg bg-red-700 text-white text-sm disabled:opacity-60"
                  >
                    {submitting ? 'Preparing…' : 'Prepare & share with tenant'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="font-medium text-red-900">Shared for tenant review</p>
                  <p className="text-sm text-red-800 mt-1">
                    Status: {completed.agreement?.status || 'TENANT_REVIEW'}. Share the login link below. After the tenant approves, activate the agreement from Home.
                  </p>
                  {(completed.loginHint || completed.defaultPassword) && (
                    <div className="text-xs text-red-900 mt-2 space-y-1">
                      <p>
                        Login: <strong>{completed.loginHint?.username || completed.agreement?.lessee_phone_snapshot}</strong>
                      </p>
                      <p>
                        Password (first 4 of phone):{' '}
                        <strong>{completed.loginHint?.password || completed.defaultPassword}</strong>
                      </p>
                      <p className="break-all">
                        Portal:{' '}
                        <strong>
                          {typeof window !== 'undefined' ? window.location.origin : ''}
                          /login
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {agreementForPdf && (
                    <PDFDownloadLink
                      document={<RentalAgreementPDF agreement={agreementForPdf} company={company} />}
                      fileName={`Rental-Agreement-${agreementForPdf.id}.pdf`}
                      className="text-sm px-3 py-2 rounded-lg bg-red-700 text-white"
                    >
                      {({ loading }) => (loading ? 'Preparing…' : 'Download PDF')}
                    </PDFDownloadLink>
                  )}
                  <button type="button" className="text-sm px-3 py-2 rounded-lg border" onClick={printPdf}>
                    Print
                  </button>
                  <button type="button" className="text-sm px-3 py-2 rounded-lg border bg-white" onClick={shareWhatsApp}>
                    Share WhatsApp
                  </button>
                  <button type="button" className="text-sm px-3 py-2 rounded-lg border" onClick={shareGmail}>
                    Share Gmail
                  </button>
                  <button
                    type="button"
                    className="text-sm px-3 py-2 rounded-lg border"
                    onClick={() => history.push(`${RM_BASE_PATH}/dashboard`)}
                  >
                    Back to home
                  </button>
                  <button type="button" className="text-sm px-3 py-2 rounded-lg border" onClick={resetWizard}>
                    Prepare another
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between pt-2 border-t border-gray-100">
          <button
            type="button"
            className="text-sm px-3 py-2 rounded-lg border disabled:opacity-40"
            onClick={back}
            disabled={step === 1 || Boolean(completed)}
          >
            Back
          </button>
          {step < 7 && (
            <button type="button" className="text-sm px-3 py-2 rounded-lg bg-red-700 text-white" onClick={next}>
              Next
            </button>
          )}
          {step === 7 && !completed && (
            <button
              type="button"
              className="text-sm px-3 py-2 rounded-lg bg-red-700 text-white disabled:opacity-60"
              disabled={submitting}
              onClick={createAgreement}
            >
              {submitting ? 'Preparing…' : 'Prepare & share'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrepareRentalAgreementWizard;
