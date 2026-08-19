import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMail, FiPhone, FiSearch } from 'react-icons/fi';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';
import { useHhBasePath } from '../../components/hospitalManagement/hospitalManagementMenuItems';

const PAGE_SIZE = 10;
const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const valueOf = (...values) => {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
};
const doctorSpecialization = (doc) => valueOf(doc.specialization, doc.specialty) || '—';
const doctorList = (doctors) => {
  if (Array.isArray(doctors)) return doctors;
  if (Array.isArray(doctors?.results)) return doctors.results;
  if (Array.isArray(doctors?.rows)) return doctors.rows;
  return [];
};

const HospitalManagementDoctorsPage = () => {
  const { doctors, fetchDoctors } = useHospitalManagement();
  const { can } = useHhPermission();
  const basePath = useHhBasePath();
  const canHire = can('hh_doctor_staff_add') || can('hh_employee_manage') || can('hh_doctor_manage');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await fetchDoctors();
      if (!cancelled) {
        setLoading(false);
        setLoadError(result?.success ? '' : (result?.error || 'Could not load doctors'));
      }
    })();
    return () => { cancelled = true; };
  }, [fetchDoctors]);

  const filteredDoctors = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = doctorList(doctors);
    if (!term) return rows;
    return rows.filter((doc) => {
      const haystack = [
        doc.name,
        doctorSpecialization(doc),
        doc.phone,
        doc.email,
        doc.consultation_fee,
        doc.consultationFee,
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [doctors, search]);

  const pageCount = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const pagedDoctors = useMemo(
    () => filteredDoctors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredDoctors, page]
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Doctors</h1>
          <p className="text-sm text-gray-500">Directory of doctors hired for this hospital</p>
        </div>
        {canHire && (
          <Link
            to={`${basePath}/adminsettings`}
            className="inline-flex items-center gap-2 bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-cyan-800"
          >
            Add doctor in Admin settings
          </Link>
        )}
      </div>

      <div className="bg-cyan-50 border border-cyan-100 rounded-xl px-4 py-3 text-sm text-cyan-950 space-y-2">
        <p className="font-semibold">Doctor login link (share with doctors)</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <p className="break-all font-mono text-xs sm:text-sm flex-1">
            {typeof window !== 'undefined' ? `${window.location.origin}/hospital-management/doctor/login` : '/hospital-management/doctor/login'}
          </p>
          <button
            type="button"
            className="self-start rounded-lg bg-cyan-700 text-white px-3 py-1.5 text-xs font-semibold hover:bg-cyan-800"
            onClick={() => {
              const url = `${window.location.origin}/hospital-management/doctor/login`;
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(url).then(() => toast.success('Doctor login link copied'));
              } else toast.info(url);
            }}
          >
            Copy link
          </button>
        </div>
        <p className="text-xs text-cyan-800">
          Hire doctors in Admin settings → Employees as role Doctor (include specialization).
          They sign in here with mobile number and password. Default password is the first 4 digits of the phone.
        </p>
      </div>

      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm bg-white"
          placeholder="Search doctors by name, specialization, phone or email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">Loading doctors…</div>
        ) : loadError ? (
          <div className="py-10 px-4 text-center text-sm text-red-700">
            Could not load doctors. {loadError}
          </div>
        ) : !filteredDoctors.length ? (
          <div className="py-10 text-center text-sm text-gray-500">
            No doctors found.{canHire ? ' Add them from Admin settings → Employees.' : ''}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Doctor name</th>
                  <th className="px-4 py-3">Specialization</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Consultation fee</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedDoctors.map((doc) => (
                  <tr key={doc.id} className="align-top hover:bg-cyan-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-sm font-bold text-cyan-800">
                          {String(doc.name || 'D').slice(0, 1).toUpperCase()}
                        </span>
                        <span className="font-semibold text-gray-900 whitespace-nowrap">Dr. {doc.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-cyan-800 font-medium whitespace-nowrap">{doctorSpecialization(doc)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {valueOf(doc.phone) ? (
                        <span className="inline-flex items-center gap-1.5 text-gray-800"><FiPhone className="text-gray-400" /> {valueOf(doc.phone)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {valueOf(doc.email) ? (
                        <span className="inline-flex items-center gap-1.5 text-gray-800"><FiMail className="text-gray-400 shrink-0" /> {valueOf(doc.email)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">{rs(doc.consultation_fee ?? doc.consultationFee)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${Number(doc.status) === 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {Number(doc.status) === 0 ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
              <span className="text-gray-600">
                Showing <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–
                <strong>{Math.min(page * PAGE_SIZE, filteredDoctors.length)}</strong> of <strong>{filteredDoctors.length}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-gray-600">Page {page} of {pageCount}</span>
                <button
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HospitalManagementDoctorsPage;
