import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiEdit2, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';
import { useHhBasePath } from '../../components/hospitalManagement/hospitalManagementMenuItems';
import LogoUploader from '../../components/dailyCollection/LogoUploader';
import { uploadImage } from '../../utils/uploadImage';
import { API_BASE_URL } from '../../utils/apiConfig';

export const HospitalProfileForm = () => {
  const { hospital, fetchHospital, saveHospital } = useHospitalManagement();
  const { can } = useHhPermission();
  const canManage = can('hh_hospital_manage');
  const [form, setForm] = useState({
    name: '',
    logoName: '',
    logoUrl: '',
    phone: '',
    address: '',
    email: '',
    registrationNo: '',
  });
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    fetchHospital();
  }, [fetchHospital]);

  useEffect(() => {
    if (!hospital) return;
    setForm({
      name: hospital.name || '',
      logoName: hospital.logo_name || hospital.logoName || '',
      logoUrl: hospital.logo_url || hospital.logoUrl || '',
      phone: hospital.phone || '',
      address: hospital.address || '',
      email: hospital.email || '',
      registrationNo: hospital.registration_no || hospital.registrationNo || '',
    });
    setLogoPreview(hospital.logo_url || hospital.logoUrl || null);
    setLogoFile(null);
  }, [hospital]);

  const onSave = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error('Hospital name required');
    setSaving(true);
    let logoUrl = form.logoUrl.trim() || null;
    if (logoFile) {
      logoUrl = await uploadImage(logoFile, API_BASE_URL);
      if (!logoUrl) {
        setSaving(false);
        return toast.error('Logo upload failed. Please try again.');
      }
    }
    const result = await saveHospital({
      name: form.name.trim(),
      logoName: form.logoName.trim() || logoFile?.name || null,
      logoUrl,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      email: form.email.trim() || null,
      registrationNo: form.registrationNo.trim() || null,
    });
    setSaving(false);
    if (result.success) toast.success('Hospital profile saved');
    else toast.error(result.error || 'Failed');
  };

  return (
    <form onSubmit={onSave} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Hospital profile and branding</h2>
        <p className="text-sm text-gray-500">These details appear in the patient portal and printed documents.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <LogoUploader
          label="Hospital Logo"
          imageFit="contain"
          disabled={!canManage}
          currentImage={logoPreview}
          handleSetImage={(file) => {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
            setForm((current) => ({
              ...current,
              logoName: current.logoName || file.name,
            }));
          }}
          onRemove={() => {
            setLogoFile(null);
            setLogoPreview(null);
            setForm((current) => ({ ...current, logoUrl: '', logoName: '' }));
          }}
        />
        <div className="w-full grid grid-cols-1 gap-3">
          <label className="text-sm">
            <span className="text-gray-600">Logo name</span>
            <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100" placeholder="Hospital logo" value={form.logoName} onChange={(e) => setForm((current) => ({ ...current, logoName: e.target.value }))} disabled={!canManage} />
          </label>
          <p className="text-xs text-gray-500">
            Upload PNG or JPG. The saved logo will be reused in the hospital profile, patient portal, and generated bills.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="text-gray-600">Hospital name *</span>
          <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} disabled={!canManage} required />
        </label>
        <label className="text-sm">
          <span className="text-gray-600">Registration number</span>
          <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100" value={form.registrationNo} onChange={(e) => setForm((current) => ({ ...current, registrationNo: e.target.value }))} disabled={!canManage} />
        </label>
        <label className="text-sm">
          <span className="text-gray-600">Phone</span>
          <input className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100" value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} disabled={!canManage} />
        </label>
        <label className="text-sm">
          <span className="text-gray-600">Email</span>
          <input type="email" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} disabled={!canManage} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-gray-600">Address</span>
        <textarea className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100" rows={3} value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} disabled={!canManage} />
      </label>
      {canManage && (
        <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-cyan-800 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save hospital profile'}
        </button>
      )}
    </form>
  );
};

const HospitalManagementHospitalPage = () => {
  const { hospital, fetchHospital } = useHospitalManagement();
  const { can } = useHhPermission();
  const basePath = useHhBasePath();

  useEffect(() => {
    fetchHospital();
  }, [fetchHospital]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hospital</h1>
          <p className="text-sm text-gray-500">Hospital identity and contact summary</p>
        </div>
        {can('hh_hospital_manage') && (
          <Link to={`${basePath}/adminsettings`} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800">
            <FiEdit2 /> Edit in Admin settings
          </Link>
        )}
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-cyan-50 to-teal-50 p-6 flex flex-col sm:flex-row items-start gap-5">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
            {hospital?.logo_url || hospital?.logoUrl ? (
              <img src={hospital.logo_url || hospital.logoUrl} alt={hospital.logo_name || hospital.logoName || hospital.name} className="h-full w-full object-contain" />
            ) : (
              <span className="text-4xl font-bold text-cyan-700">{String(hospital?.name || 'H').slice(0, 1)}</span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">{hospital?.logo_name || hospital?.logoName || 'Hospital profile'}</p>
            <h2 className="mt-1 text-3xl font-bold text-gray-900">{hospital?.name || 'My Hospital'}</h2>
            <p className="mt-1 text-sm text-gray-600">Registration: {hospital?.registration_no || hospital?.registrationNo || '—'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200">
          <Info icon={FiPhone} label="Phone" value={hospital?.phone} />
          <Info icon={FiMail} label="Email" value={hospital?.email} />
          <Info icon={FiMapPin} label="Address" value={hospital?.address} />
        </div>
      </section>
    </div>
  );
};

const Info = ({ icon: Icon, label, value }) => (
  <div className="bg-white p-4">
    <p className="flex items-center gap-1 text-xs font-semibold uppercase text-gray-500"><Icon /> {label}</p>
    <p className="mt-1 text-sm font-medium text-gray-900">{value || '—'}</p>
  </div>
);

export default HospitalManagementHospitalPage;
