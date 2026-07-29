import React, { useEffect, useMemo, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import HostelSelector from '../../components/hostelManagement/HostelSelector';
import HostelReceiptPDF from '../../components/hostelManagement/PDF/HostelReceiptPDF';
import { buildHostelBillProps, buildOnboardBillProps } from '../../utils/hostelBillProps';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';
import { API_BASE_URL } from '../../utils/apiConfig';
import { uploadImage } from '../../utils/uploadImage';

const emptyForm = {
  name: '', phone: '', bedId: '', rentPlan: 'MONTHLY',
  monthlyRent: '', dailyRent: '', adhocAmount: '',
  securityDeposit: '',
  joinDate: '',
  expectedEndDate: '',
  adhocChargeAmount: '',
  adhocPaidAmount: '',
  paymentMethod: 'CASH',
  ledgerAccountId: '',
  paymentType: 'FULL',  // FULL | PARTIAL | NONE
  addressProofType: 'AADHAAR',
  addressProofUrl: '',
  companyIdCardUrl: '',
};

const rentLabel = (r) => {
  if (r.rent_plan === 'DAILY') return `₹${r.daily_rent}/day`;
  if (r.rent_plan === 'ADHOC') return `₹${r.adhoc_amount || 0} default`;
  return `₹${r.monthly_rent}/mo`;
};

const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const toDateOnlyString = (d) => new Date(d).toISOString().slice(0, 10);
const daysInclusive = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0;
  return Math.floor((e - s) / (24 * 60 * 60 * 1000)) + 1;
};

const ProofUploadField = ({ label, value, onUploaded, required = false }) => {
  const [uploading, setUploading] = useState(false);
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, API_BASE_URL, (msg) => toast.error(msg));
      if (url) onUploaded(url);
      else toast.error('Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600">
        {label}{required ? ' *' : ''}
      </label>
      <input
        type="file"
        accept="image/*,.pdf"
        onChange={onFile}
        disabled={uploading}
        className="w-full text-sm border rounded-lg px-3 py-2 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-red-50 file:text-red-700"
      />
      {uploading && <p className="text-xs text-gray-500">Uploading…</p>}
      {value && (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline break-all">
          View uploaded file
        </a>
      )}
    </div>
  );
};

const proofThumb = (url, signed) => signed || url || null;

const CheckoutModal = ({
  preview,
  loading,
  ledgerAccounts,
  onClose,
  onConfirm,
}) => {
  const [additionalPayment, setAdditionalPayment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [ledgerAccountId, setLedgerAccountId] = useState(ledgerAccounts[0]?.id || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preview) {
      setAdditionalPayment(
        preview.still_payable > 0 ? String(preview.still_payable) : '0'
      );
    }
  }, [preview]);

  if (!preview && !loading) return null;

  const submit = async () => {
    setSaving(true);
    try {
      await onConfirm({
        additionalPayment: Number(additionalPayment) || 0,
        paymentMethod,
        ledgerAccountId: ledgerAccountId || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-900">Checkout settlement</h3>
            <p className="text-xs text-gray-500">
              {preview?.resident?.name || 'Resident'} · use security deposit to close dues
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 text-sm font-semibold">Close</button>
        </div>

        {loading || !preview ? (
          <p className="p-6 text-gray-500">Loading settlement…</p>
        ) : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Deposit held</p>
                <p className="font-bold text-gray-900">{rs(preview.deposit_held)}</p>
                <p className="text-[11px] text-gray-400">Collected {rs(preview.deposit_collected)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Outstanding dues</p>
                <p className="font-bold text-red-700">{rs(preview.outstanding)}</p>
                <p className="text-[11px] text-gray-400">{preview.dues?.length || 0} open bill(s)</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Utilize from deposit</p>
                <p className="font-bold text-amber-800">{rs(preview.utilize_from_deposit)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Refund to resident</p>
                <p className="font-bold text-green-700">{rs(preview.refundable)}</p>
              </div>
            </div>

            {preview.dues?.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <p className="px-3 py-2 text-xs font-semibold bg-gray-50 border-b">Open dues</p>
                <ul className="divide-y text-sm">
                  {preview.dues.map((d) => (
                    <li key={d.id} className="px-3 py-2 flex justify-between gap-2">
                      <span>{d.month_label || d.due_date || 'Due'}</span>
                      <span className="font-semibold text-red-700">{rs(d.balance)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={`rounded-lg p-3 text-sm ${preview.still_payable > 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
              {preview.still_payable > 0 ? (
                <p>
                  After deposit, resident still needs to pay{' '}
                  <span className="font-bold">{rs(preview.still_payable)}</span> to close the contract.
                </p>
              ) : (
                <p className="font-medium text-green-800">
                  Deposit covers all dues
                  {preview.refundable > 0 ? ` · refund ${rs(preview.refundable)}` : ''}.
                </p>
              )}
            </div>

            {preview.still_payable > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600">Collect remaining *</label>
                <input
                  type="number"
                  min={preview.still_payable}
                  step="0.01"
                  className="w-full border rounded-lg px-3 py-2"
                  value={additionalPayment}
                  onChange={(e) => setAdditionalPayment(e.target.value)}
                />
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">CASH</option>
                  <option value="PHONEPE">PHONEPE</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK">BANK</option>
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600">Ledger account (optional)</label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={ledgerAccountId}
                onChange={(e) => setLedgerAccountId(e.target.value)}
              >
                <option value="">No ledger post</option>
                {ledgerAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.account_name}</option>
                ))}
              </select>
              <p className="text-[11px] text-gray-500">
                Extra collection credits the account; deposit refund debits it.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={submit}
                className="flex-1 bg-red-600 text-white rounded-lg py-2.5 font-semibold disabled:opacity-50"
              >
                {saving ? 'Closing…' : 'Confirm checkout'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2.5 font-semibold">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HostelManagementResidentsPage = () => {
  const {
    selectedHostelId, residents, rooms, ledgerAccounts, hostels,
    fetchResidents, fetchRooms, fetchLedgerAccounts, fetchHostels,
    createResident, checkoutResident, checkoutPreview, assignResidentBed,
  } = useHostelManagement();
  const { can } = useHmPermission();
  const canCreate = can('hm_resident_create') || can('hm_resident_manage');
  const canDelete = can('hm_resident_delete') || can('hm_resident_manage');

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutResidentRow, setCheckoutResidentRow] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [assignBedId, setAssignBedId] = useState('');
  const [onboardBillProps, setOnboardBillProps] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const selectedHostel = useMemo(
    () => (hostels || []).find((h) => h.id === selectedHostelId),
    [hostels, selectedHostelId]
  );

  const openAddModal = () => {
    setForm({
      ...emptyForm,
      ledgerAccountId: ledgerAccounts[0]?.id || '',
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (submitting) return;
    setShowAddModal(false);
  };

  useEffect(() => {
    fetchLedgerAccounts();
    fetchHostels();
  }, []);

  useEffect(() => {
    if (ledgerAccounts?.length && !form.ledgerAccountId) {
      setForm((prev) => ({ ...prev, ledgerAccountId: ledgerAccounts[0].id }));
    }
  }, [ledgerAccounts]);

  useEffect(() => {
    if (selectedHostelId) {
      fetchResidents(selectedHostelId);
      fetchRooms(selectedHostelId);
    }
  }, [selectedHostelId]);

  const vacantBeds = useMemo(() => {
    const list = [];
    rooms.forEach((room) => {
      (room.beds || []).forEach((bed) => {
        if (bed.status === 'VACANT') {
          list.push({
            id: bed.id,
            label: `${room.floor_name || 'Floor'} · Room ${room.room_number} · Bed ${bed.bed_label}`,
          });
        }
      });
    });
    return list;
  }, [rooms]);

  const effectiveJoinDate = form.joinDate || toDateOnlyString(new Date());
  const effectiveEndDate = form.expectedEndDate || effectiveJoinDate;
  const dailyDays = daysInclusive(effectiveJoinDate, effectiveEndDate);
  const dailyTotalCharge = dailyDays > 0 ? (dailyDays * (Number(form.dailyRent) || 0)) : 0;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHostelId) return toast.error('Select hostel');
    const phone = String(form.phone || '').replace(/\D/g, '');
    if (phone.length !== 10) return toast.error('Enter a valid 10-digit phone for resident login');
    if (!form.bedId) return toast.error('Select Floor / Room / Bed — required');
    if (!(Number(form.securityDeposit) > 0)) {
      return toast.error('Security deposit amount is required');
    }
    if (!form.addressProofType || !form.addressProofUrl) {
      return toast.error('Address proof document is required');
    }
    if (!form.companyIdCardUrl) {
      return toast.error('Company ID card is required');
    }

    const isDaily = form.rentPlan === 'DAILY';
    const isAdhoc = form.rentPlan === 'ADHOC';
    const chargeAmt = isDaily
      ? dailyTotalCharge
      : (Number(form.adhocChargeAmount) > 0 ? Number(form.adhocChargeAmount) : Number(form.adhocAmount) || 0);
    const collectPayment = (isDaily || isAdhoc) && form.paymentType !== 'NONE';
    const paidAmt = collectPayment
      ? (form.paymentType === 'FULL'
          ? chargeAmt
          : Math.max(0, Number(form.adhocPaidAmount) || 0))
      : 0;

    if (isDaily && !form.expectedEndDate) {
      return toast.error('Expected end date is required for Daily plan');
    }
    if ((isDaily || isAdhoc) && collectPayment) {
      if (!(chargeAmt > 0)) return toast.error('Total charge must be greater than zero');
      if (form.paymentType === 'PARTIAL' && paidAmt <= 0) {
        return toast.error('Enter the partial amount being paid');
      }
      if (paidAmt > chargeAmt + 0.001) {
        return toast.error('Paid amount cannot exceed charge amount');
      }
      if (!form.ledgerAccountId) return toast.error('Select payment mode (ledger account)');
    }

    setSubmitting(true);
    try {
      const result = await createResident({
        hostelId: selectedHostelId,
        name: form.name,
        phone,
        bedId: form.bedId || null,
        rentPlan: form.rentPlan,
        monthlyRent: Number(form.monthlyRent) || 0,
        dailyRent: Number(form.dailyRent) || 0,
        adhocAmount: Number(form.adhocAmount) || chargeAmt || 0,
        securityDeposit: Number(form.securityDeposit),
        joinDate: form.joinDate || null,
        expectedEndDate: form.expectedEndDate || null,
        addressProofType: form.addressProofType,
        addressProofUrl: form.addressProofUrl,
        companyIdCardUrl: form.companyIdCardUrl,
        ...(isDaily || isAdhoc ? {
          adhocChargeAmount: chargeAmt,
          adhocPaidAmount: paidAmt,
          ledgerAccountId: form.ledgerAccountId || null,
        } : {}),
      });
      if (result.success) {
        const pwd = result.data?.defaultPassword;
        const base = pwd
          ? `Resident added. Login: phone + password ${pwd}`
          : (result.message || 'Resident added (existing login linked)');
        toast.success(base);
        setOnboardBillProps(buildOnboardBillProps(result.data, selectedHostel));
        setForm({
          ...emptyForm,
          ledgerAccountId: ledgerAccounts[0]?.id || '',
        });
        setShowAddModal(false);
        fetchRooms(selectedHostelId);
      } else toast.error(result.error);
    } finally {
      setSubmitting(false);
    }
  };

  const openCheckout = async (row) => {
    setCheckoutResidentRow(row);
    setCheckoutData(null);
    setCheckoutLoading(true);
    try {
      const result = await checkoutPreview(row.id);
      if (result.success) setCheckoutData(result.data);
      else {
        toast.error(result.error || 'Could not load checkout');
        setCheckoutResidentRow(null);
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const confirmCheckout = async (payload) => {
    if (!checkoutResidentRow) return;
    const result = await checkoutResident(checkoutResidentRow.id, selectedHostelId, payload);
    if (result.success) {
      const s = result.data?.settlement;
      toast.success(
        s
          ? `Checked out. Deposit used ${rs(s.utilized_from_deposit)}, collected ${rs(s.additional_collected)}, refund ${rs(s.refunded)}`
          : 'Checked out'
      );
      setCheckoutResidentRow(null);
      setCheckoutData(null);
      fetchRooms(selectedHostelId);
    } else toast.error(result.error);
  };

  const saveAssignBed = async (residentId) => {
    if (!assignBedId) return toast.error('Select a vacant bed');
    const result = await assignResidentBed(residentId, assignBedId, selectedHostelId);
    if (result.success) {
      toast.success('Bed assigned');
      setAssigningId(null);
      setAssignBedId('');
    } else toast.error(result.error);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap justify-between gap-3 items-start">
        <div>
          <h1 className="text-2xl font-bold">Residents</h1>
          <p className="text-sm text-gray-500">
            All active residents for the selected hostel.
            {selectedHostel?.hostel_name ? ` · ${selectedHostel.hostel_name}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HostelSelector />
          {canCreate && (
            <button
              type="button"
              onClick={openAddModal}
              disabled={!selectedHostelId}
              className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              + Add New Resident
            </button>
          )}
        </div>
      </div>

      {onboardBillProps && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-green-900">Resident onboarded — download detailed bill</p>
            <p className="text-xs text-green-800">Includes hostel, room, payment receipt, pending balance, deposit &amp; do&apos;s/don&apos;ts.</p>
          </div>
          <PDFDownloadLink
            document={<HostelReceiptPDF {...onboardBillProps} documentTitle="Hostel Onboarding Bill" />}
            fileName={`onboard-bill-${onboardBillProps.residentName || 'resident'}.pdf`}
            className="inline-flex items-center gap-2 bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-red-700"
          >
            {({ loading }) => (
              <>
                <FiDownload className="w-4 h-4" />
                {loading ? 'Preparing…' : 'Download detailed bill'}
              </>
            )}
          </PDFDownloadLink>
        </div>
      )}

      {!selectedHostelId && (
        <p className="text-gray-500 text-sm">Select a hostel to view residents.</p>
      )}

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex flex-wrap justify-between gap-2 items-center">
          <p className="text-sm font-semibold text-gray-800">
            {selectedHostelId
              ? `${residents.length} resident${residents.length === 1 ? '' : 's'}`
              : 'Residents'}
          </p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Floor / Room / Bed</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Onboarded</th>
              <th className="px-4 py-3">End Date</th>
              <th className="px-4 py-3">Deposit</th>
              <th className="px-4 py-3">Proofs</th>
              <th className="px-4 py-3">Rent</th>
              <th className="px-4 py-3 text-red-700">Pending</th>
              <th className="px-4 py-3">Bill</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {residents.map((r) => {
              const addressProof = proofThumb(r.address_proof_url, r.address_proof_url_s3_image);
              const companyId = proofThumb(r.company_id_card_url, r.company_id_card_url_s3_image);
              const stayLabel = [r.stay?.floor_name || r.floor_name, r.stay?.room_number || r.room_number, r.stay?.bed_label || r.bed_label]
                .filter(Boolean)
                .join(' / ');
              const needsBed = !r.bed_id && !(r.stay?.bed_id);
              const billProps = buildHostelBillProps({
                hostel: selectedHostel,
                resident: { ...r, pending_balance: r.pending_balance },
                stay: r.stay,
              });
              return (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3">{r.phone || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {stayLabel ? (
                      <span className="font-medium text-gray-800">{stayLabel}</span>
                    ) : (
                      <span className="text-amber-700">Not assigned</span>
                    )}
                    {(canCreate || canDelete) && (needsBed || assigningId === r.id) && (
                      <div className="mt-1 flex flex-wrap gap-1 items-center">
                        {assigningId === r.id ? (
                          <>
                            <select
                              className="border rounded px-1 py-1 text-xs"
                              value={assignBedId}
                              onChange={(e) => setAssignBedId(e.target.value)}
                            >
                              <option value="">Vacant bed…</option>
                              {vacantBeds.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
                            </select>
                            <button type="button" className="text-xs font-semibold text-green-700" onClick={() => saveAssignBed(r.id)}>Save</button>
                            <button type="button" className="text-xs text-gray-500" onClick={() => { setAssigningId(null); setAssignBedId(''); }}>Cancel</button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="text-xs font-semibold text-blue-700 underline"
                            onClick={() => { setAssigningId(r.id); setAssignBedId(''); }}
                          >
                            Assign bed
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">{r.rent_plan}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {r.join_date
                      ? new Date(r.join_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {r.expected_end_date
                      ? <span className="text-amber-700 font-semibold">{new Date(r.expected_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{rs(r.security_deposit_balance ?? r.security_deposit)}</p>
                    <p className="text-[11px] text-gray-500">held of {rs(r.security_deposit)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 text-xs">
                      {addressProof ? (
                        <a href={addressProof} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          Address ({r.address_proof_type || 'proof'})
                        </a>
                      ) : <span className="text-amber-700">No address proof</span>}
                      {companyId ? (
                        <a href={companyId} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          Company ID
                        </a>
                      ) : <span className="text-amber-700">No company ID</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{rentLabel(r)}</td>
                  <td className="px-4 py-3">
                    {Number(r.pending_balance) > 0 ? (
                      <span className="font-semibold text-red-700">{rs(r.pending_balance)}</span>
                    ) : (
                      <span className="text-green-700 font-semibold text-xs">Nil</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PDFDownloadLink
                      document={<HostelReceiptPDF {...billProps} documentTitle="Hostel Resident Bill" />}
                      fileName={`bill-${r.name || r.id}.pdf`}
                      className="text-xs font-semibold text-red-700 underline inline-flex items-center gap-1"
                    >
                      {({ loading }) => (loading ? '…' : 'PDF')}
                    </PDFDownloadLink>
                  </td>
                  <td className="px-4 py-3">
                    {canDelete && (
                      <button
                        type="button"
                        className="text-red-600 text-xs font-semibold"
                        onClick={() => openCheckout(r)}
                      >
                        Checkout
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {residents.length === 0 && selectedHostelId && (
          <p className="p-6 text-gray-500">No residents yet for this hostel.</p>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-lg text-gray-900">Add New Resident</h3>
                <p className="text-xs text-gray-500">
                  {selectedHostel?.hostel_name || 'Hostel'} · collect deposit and plan details
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                disabled={submitting}
                className="text-sm font-semibold text-gray-500 hover:text-red-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-5 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="border rounded-lg px-3 py-2" placeholder="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="border rounded-lg px-3 py-2" placeholder="Phone (10 digits) * required for login" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <select className="border rounded-lg px-3 py-2" required value={form.bedId} onChange={(e) => setForm({ ...form, bedId: e.target.value })}>
                <option value="">Select floor / room / bed *</option>
                {vacantBeds.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
              {vacantBeds.length === 0 && (
                <p className="text-xs text-amber-700 md:col-span-2">No vacant beds — add floors/rooms first, then onboard.</p>
              )}
              <select className="border rounded-lg px-3 py-2" value={form.rentPlan} onChange={(e) => setForm({ ...form, rentPlan: e.target.value, paymentType: 'FULL', adhocPaidAmount: '' })}>
                <option value="MONTHLY">Monthly plan</option>
                <option value="DAILY">Daily plan</option>
                <option value="ADHOC">Adhoc plan</option>
              </select>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Onboarded Date</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.joinDate}
                  onChange={(e) => setForm({ ...form, joinDate: e.target.value })}
                />
                <p className="text-xs text-gray-400">Defaults to today if left blank</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Expected End Date <span className="text-gray-400">(optional)</span></label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.expectedEndDate}
                  min={form.joinDate || undefined}
                  onChange={(e) => setForm({ ...form, expectedEndDate: e.target.value })}
                />
                <p className="text-xs text-gray-400">Agreed stay end — pending dues must be cleared at checkout</p>
              </div>
              <div className="space-y-1">
                <input
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Security deposit *"
                  required
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.securityDeposit}
                  onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
                />
                <p className="text-xs text-gray-500">Held and adjusted against dues at checkout.</p>
              </div>
              {form.rentPlan === 'MONTHLY' && (
                <input className="border rounded-lg px-3 py-2" placeholder="Monthly rent *" required type="number" min="0" value={form.monthlyRent} onChange={(e) => setForm({ ...form, monthlyRent: e.target.value })} />
              )}
              {form.rentPlan === 'DAILY' && (
                <div className="md:col-span-2 border rounded-xl p-4 space-y-4 bg-gray-50">
                  <p className="text-sm font-bold text-gray-800">Daily billing &amp; payment at onboarding</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Daily Rent *</label>
                      <input className="w-full border rounded-lg px-3 py-2 bg-white" placeholder="Daily rent *" required type="number" min="0" value={form.dailyRent} onChange={(e) => setForm({ ...form, dailyRent: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Total Charge</label>
                      <div className="w-full border rounded-lg px-3 py-2 bg-gray-100 text-sm font-semibold text-gray-800">
                        {dailyDays > 0
                          ? `${dailyDays} day${dailyDays > 1 ? 's' : ''} × ${rs(form.dailyRent || 0)} = ${rs(dailyTotalCharge)}`
                          : 'Select valid onboarded + end dates'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Payment Type</label>
                    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden w-full md:w-[420px]">
                      {['FULL', 'PARTIAL', 'NONE'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm({ ...form, paymentType: type, adhocPaidAmount: type === 'FULL' ? String(dailyTotalCharge) : '' })}
                          className={`flex-1 py-2 text-sm font-semibold ${form.paymentType === type
                            ? type === 'NONE' ? 'bg-gray-500 text-white' : type === 'FULL' ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                        >
                          {type === 'NONE' ? 'Skip' : type.charAt(0) + type.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.paymentType === 'PARTIAL' && (
                    <div className="space-y-1 max-w-sm">
                      <label className="text-xs font-semibold text-gray-600">Amount Paying Now *</label>
                      <input className="w-full border rounded-lg px-3 py-2 bg-white" type="number" min="0" step="0.01" value={form.adhocPaidAmount} onChange={(e) => setForm({ ...form, adhocPaidAmount: e.target.value })} />
                    </div>
                  )}
                  {form.paymentType !== 'NONE' && (
                    <div className="space-y-1 max-w-sm">
                      <label className="text-xs font-semibold text-gray-600">Payment Mode (Ledger Account)</label>
                      <select className="w-full border rounded-lg px-3 py-2 bg-white" value={form.ledgerAccountId} onChange={(e) => setForm({ ...form, ledgerAccountId: e.target.value })}>
                        <option value="">Select account *</option>
                        {(ledgerAccounts || []).map((a) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {form.rentPlan === 'ADHOC' && (
                <div className="md:col-span-2 border rounded-xl p-4 space-y-4 bg-gray-50">
                  <p className="text-sm font-bold text-gray-800">Adhoc billing &amp; payment at onboarding</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Charge Amount *</label>
                      <input
                        className="w-full border rounded-lg px-3 py-2 bg-white"
                        placeholder="e.g. 5000"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.adhocChargeAmount}
                        onChange={(e) => {
                          const charge = e.target.value;
                          setForm({ ...form, adhocChargeAmount: charge, adhocAmount: charge });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Payment Type</label>
                      <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden w-full">
                        {['FULL', 'PARTIAL', 'NONE'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setForm({ ...form, paymentType: type, adhocPaidAmount: type === 'FULL' ? form.adhocChargeAmount : '' })}
                            className={`flex-1 py-2 text-sm font-semibold ${form.paymentType === type
                              ? type === 'NONE' ? 'bg-gray-500 text-white' : type === 'FULL' ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                          >
                            {type === 'NONE' ? 'Skip' : type.charAt(0) + type.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {form.paymentType === 'PARTIAL' && (
                    <div className="space-y-1 max-w-sm">
                      <label className="text-xs font-semibold text-gray-600">Amount Paying Now *</label>
                      <input
                        className="w-full border rounded-lg px-3 py-2 bg-white"
                        placeholder="Partial amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.adhocPaidAmount}
                        onChange={(e) => setForm({ ...form, adhocPaidAmount: e.target.value })}
                      />
                    </div>
                  )}
                  {form.paymentType !== 'NONE' && (
                    <div className="space-y-1 max-w-sm">
                      <label className="text-xs font-semibold text-gray-600">Payment Mode (Ledger Account)</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 bg-white"
                        value={form.ledgerAccountId}
                        onChange={(e) => setForm({ ...form, ledgerAccountId: e.target.value })}
                      >
                        <option value="">Select account *</option>
                        {(ledgerAccounts || []).map((a) => (
                          <option key={a.id} value={a.id}>{a.account_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="md:col-span-2 border-t pt-3 mt-1">
                <p className="text-sm font-semibold text-gray-800 mb-2">Proof documents *</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    className="border rounded-lg px-3 py-2"
                    required
                    value={form.addressProofType}
                    onChange={(e) => setForm({ ...form, addressProofType: e.target.value })}
                  >
                    <option value="AADHAAR">Address proof — Aadhaar</option>
                    <option value="VOTER_ID">Address proof — Voter ID</option>
                    <option value="DRIVING_LICENSE">Address proof — Driving License</option>
                    <option value="PASSPORT">Address proof — Passport</option>
                    <option value="OTHER">Address proof — Other</option>
                  </select>
                  <ProofUploadField
                    label="Address proof document"
                    required
                    value={form.addressProofUrl}
                    onUploaded={(url) => setForm((prev) => ({ ...prev, addressProofUrl: url }))}
                  />
                  <div className="md:col-span-2">
                    <ProofUploadField
                      label="Company ID card"
                      required
                      value={form.companyIdCardUrl}
                      onUploaded={(url) => setForm((prev) => ({ ...prev, companyIdCardUrl: url }))}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 flex gap-2 pt-2 sticky bottom-0 bg-white">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2.5 font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : 'Save Resident'}
                </button>
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={submitting}
                  className="flex-1 border rounded-lg py-2.5 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {checkoutResidentRow && (
        <CheckoutModal
          preview={checkoutData}
          loading={checkoutLoading}
          ledgerAccounts={ledgerAccounts || []}
          onClose={() => {
            setCheckoutResidentRow(null);
            setCheckoutData(null);
          }}
          onConfirm={confirmCheckout}
        />
      )}
    </div>
  );
};

export default HostelManagementResidentsPage;
