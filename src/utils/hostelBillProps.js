export const DEFAULT_DOS = [
  'Pay rent on time as per your plan.',
  'Keep your room and common areas clean.',
  'Follow hostel timings and visitor policy.',
  'Report maintenance or safety issues to reception.',
];

export const DEFAULT_DONTS = [
  'No smoking, alcohol or drugs on premises.',
  'No loud music after 10:00 PM.',
  'Do not sublet your bed or allow unauthorized guests.',
  'Do not damage hostel property.',
];

export const parseHouseRules = (text) => {
  if (!text || !String(text).trim()) {
    return { dos: DEFAULT_DOS, donts: DEFAULT_DONTS };
  }
  const raw = String(text).trim();
  const dontIdx = raw.search(/\bdon'?ts?\b\s*:?/i);
  if (dontIdx === -1) {
    const lines = raw.split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
    return { dos: lines.length ? lines : DEFAULT_DOS, donts: DEFAULT_DONTS };
  }
  const dosPart = raw.slice(0, dontIdx).replace(/\bdo'?s?\b\s*:?/i, '').trim();
  const dontsPart = raw.slice(dontIdx).replace(/\bdon'?ts?\b\s*:?/i, '').trim();
  const toLines = (part) => part.split('\n').map((l) => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
  const dos = toLines(dosPart);
  const donts = toLines(dontsPart);
  return {
    dos: dos.length ? dos : DEFAULT_DOS,
    donts: donts.length ? donts : DEFAULT_DONTS,
  };
};

const fmtDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const periodLabel = (start, end) => {
  if (!start && !end) return null;
  if (start && end && start !== end) return `${fmtDate(start)} → ${fmtDate(end)}`;
  return fmtDate(start || end);
};

/** Build props for HostelReceiptPDF from API/onboard payload */
export const buildHostelBillProps = ({
  hostel,
  resident,
  receivable,
  receipt,
  stay,
} = {}) => {
  const h = hostel || {};
  const r = resident || {};
  const rec = receivable || {};
  const rcpt = receipt || {};
  const s = stay || r.stay || {};

  const roomLabel = [
    s.floor_name || r.floor_name,
    s.room_number || r.room_number ? `Room ${s.room_number || r.room_number}` : null,
    s.bed_label || r.bed_label ? `Bed ${s.bed_label || r.bed_label}` : null,
  ].filter(Boolean).join(' / ');

  const amountDue = Number(rec.amount_due ?? r.onboard_charge ?? 0);
  const amountPaid = Number(rec.amount_paid ?? rcpt.payment_amount ?? 0);
  const balance = Number(rec.balance ?? Math.max(0, amountDue - amountPaid));
  const pendingBalance = Number(
    r.pending_balance ?? r.onboard_bill?.pending_balance ?? balance
  );

  return {
    hostelName: h.hostel_name || r.hostel_name || 'Hostel',
    hostelAddress: [h.address, h.city].filter(Boolean).join(', ') || null,
    hostelPhone: h.contact_phone || h.phone || null,
    residentName: r.name,
    residentPhone: r.phone,
    rentPlan: rec.rent_plan || r.rent_plan,
    roomLabel: roomLabel || null,
    joinDate: fmtDate(r.join_date),
    expectedEndDate: fmtDate(r.expected_end_date),
    periodLabel: periodLabel(rec.billing_period_start, rec.billing_period_end)
      || periodLabel(r.join_date, r.expected_end_date),
    monthLabel: rec.month_label || periodLabel(rec.billing_period_start, rec.billing_period_end),
    amountDue,
    amountPaid,
    balance,
    pendingBalance,
    securityDeposit: Number(r.security_deposit ?? r.security_deposit_balance ?? 0),
    securityDepositHeld: Number(r.security_deposit_balance ?? r.security_deposit ?? 0),
    billNumber: rcpt.bill_number || rec.latest_bill_number || null,
    paymentMethod: rcpt.payment_method || rec.latest_payment_method || null,
    paidAt: rcpt.paid_at || rec.latest_paid_at || null,
    paymentType: rcpt.payment_type || null,
    status: rec.status || (balance > 0 ? 'PENDING' : 'PAID'),
    houseRulesText: h.house_rules || null,
    documentTitle: balance > 0 && amountPaid <= 0 ? 'Hostel Onboarding Bill' : 'Hostel Rent Receipt',
  };
};

export const buildOnboardBillProps = (apiData, hostelRow) => ({
  ...buildHostelBillProps({
    hostel: hostelRow || apiData?.onboard_bill?.hostel || apiData?.hostel,
    resident: {
      ...apiData,
      pending_balance: apiData?.onboard_bill?.pending_balance ?? apiData?.pending_balance,
    },
    receivable: apiData?.onboard_receivable,
    receipt: apiData?.onboard_receipt,
    stay: apiData?.onboard_bill?.stay || apiData?.stay,
  }),
  documentTitle: 'Hostel Onboarding Bill',
});
