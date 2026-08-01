import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FaWhatsapp } from 'react-icons/fa';
import { useHostelManagement } from '../../context/hostelManagement/HostelManagementContext';
import HostelReceiptPDF from '../../components/hostelManagement/PDF/HostelReceiptPDF';
import { buildHostelBillProps } from '../../utils/hostelBillProps';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const toDate = (d) => d.toISOString().slice(0, 10);
const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toDate(d);
};
const mondayOf = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return toDate(d);
};
const rs = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const statusBadge = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'PAID') return 'bg-green-100 text-green-800';
  if (s === 'PARTIAL') return 'bg-amber-100 text-amber-800';
  if (s === 'AWAITING_CONFIRMATION') return 'bg-blue-100 text-blue-800';
  return 'bg-red-100 text-red-800';
};

const statusLabel = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'AWAITING_CONFIRMATION') return 'Submitted — awaiting confirmation';
  return status || '—';
};

const emptyMealDay = (d) => ({
  meal_date: d,
  weekday: WEEKDAYS[new Date(d).getDay()],
  breakfast: 'NOT_AVAILABLE',
  lunch: 'NOT_AVAILABLE',
  dinner: 'NOT_AVAILABLE',
  breakfast_item_id: null,
  lunch_item_id: null,
  dinner_item_id: null,
  juice_item_id: null,
});

const HostelManagementResidentPortal = () => {
  const {
    myResidentProfile, myReceivables, submitPayment,
    getWeekMeals, upsertWeekMeals, fetchMealMenu,
  } = useHostelManagement();

  const [resident, setResident] = useState(null);
  const [dues, setDues] = useState([]);
  const [weekStart, setWeekStart] = useState(mondayOf());
  const [weekMeals, setWeekMeals] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [payForm, setPayForm] = useState({
    receivableId: '', amount: '', transactionRef: '', paymentDate: toDate(new Date()),
  });
  const [hostelPayInfo, setHostelPayInfo] = useState(null);

  const load = async () => {
    const profile = await myResidentProfile();
    if (!profile.success) {
      toast.error(profile.error || 'Resident profile not found');
      return;
    }
    setResident(profile.data);
    setHostelPayInfo(profile.data?.hostel || null);
    const recv = await myReceivables(profile.data.id);
    if (recv.success) setDues(recv.data || []);

    const menu = await fetchMealMenu(profile.data?.parent_membership_id);
    if (menu.success) setMenuCategories(menu.data?.categories || []);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const hash = (window.location.hash || '').replace('#', '');
    if (hash) {
      setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
  }, [resident]);

  useEffect(() => {
    const loadWeek = async () => {
      if (!resident?.id) return;
      const result = await getWeekMeals(resident.id, weekStart);
      if (result.success) {
        const rows = result.data || [];
        const filled = [];
        for (let i = 0; i < 7; i++) {
          const d = addDays(weekStart, i);
          const existing = rows.find((r) => r.meal_date === d);
          filled.push(existing
            ? {
              ...emptyMealDay(d),
              ...existing,
              meal_date: d,
              weekday: existing.weekday || WEEKDAYS[new Date(d).getDay()],
            }
            : emptyMealDay(d));
        }
        setWeekMeals(filled);
      }
    };
    loadWeek();
  }, [resident, weekStart]);

  const stay = resident?.stay || {};
  const joinDate = resident?.join_date ? String(resident.join_date).slice(0, 10) : null;
  const checkoutDate = resident?.checkout_date ? String(resident.checkout_date).slice(0, 10) : null;

  const itemsBySlot = useMemo(() => {
    const map = { breakfast: [], lunch: [], dinner: [] };
    (menuCategories || []).forEach((cat) => {
      const key = String(cat.slot_key || '').toLowerCase();
      if (!map[key]) return;
      const items = (cat.items || []).filter((it) => it.status !== 0);
      map[key] = [...map[key], ...items];
    });
    return map;
  }, [menuCategories]);

  const isMealDateEditable = (mealDate) => {
    const d = String(mealDate || '').slice(0, 10);
    if (!d) return false;
    if (joinDate && d < joinDate) return false;
    if (checkoutDate && d > checkoutDate) return false;
    return true;
  };

  const sortedDues = useMemo(
    () => [...(dues || [])].sort((a, b) => String(b.billing_period_start || '').localeCompare(String(a.billing_period_start || ''))),
    [dues]
  );

  const paymentSummary = useMemo(() => {
    const rows = dues || [];
    const totalDue = rows.reduce((s, r) => s + Number(r.amount_due || 0), 0);
    const totalPaid = rows.reduce((s, r) => s + Number(r.amount_paid || 0), 0);
    const totalPending = rows.reduce((s, r) => s + Number(r.balance || 0), 0);
    return { totalDue, totalPaid, totalPending };
  }, [dues]);

  const setMeal = (idx, meal, value) => {
    setWeekMeals((prev) => prev.map((row, i) => {
      if (i !== idx) return row;
      if (!isMealDateEditable(row.meal_date)) return row;
      const next = { ...row, [meal]: value };
      if (value !== 'AVAILABLE') {
        next[`${meal}_item_id`] = null;
      }
      return next;
    }));
  };

  const setMealItem = (idx, field, value) => {
    setWeekMeals((prev) => prev.map((row, i) => {
      if (i !== idx) return row;
      if (!isMealDateEditable(row.meal_date)) return row;
      return { ...row, [field]: value || null };
    }));
  };

  const saveMeals = async () => {
    if (!resident) return;
    const editableDays = weekMeals.filter((d) => isMealDateEditable(d.meal_date));
    if (editableDays.length === 0) {
      toast.error(joinDate
        ? `Meal availability starts from your join date (${joinDate})`
        : 'No editable meal days in this week');
      return;
    }
    const result = await upsertWeekMeals({
      hostelId: resident.hostel_id,
      residentId: resident.id,
      days: editableDays.map((d) => ({
        mealDate: d.meal_date,
        breakfast: d.breakfast,
        lunch: d.lunch,
        dinner: d.dinner,
        breakfastItemId: d.breakfast === 'AVAILABLE' ? d.breakfast_item_id : null,
        lunchItemId: d.lunch === 'AVAILABLE' ? d.lunch_item_id : null,
        dinnerItemId: d.dinner === 'AVAILABLE' ? d.dinner_item_id : null,
        juiceItemId: null,
      })),
    });
    if (result.success) toast.success('Meal week saved');
    else toast.error(result.error);
  };

  const submitTxn = async (e) => {
    e.preventDefault();
    const result = await submitPayment({
      receivableId: payForm.receivableId,
      residentId: resident.id,
      amountClaimed: Number(payForm.amount),
      transactionRef: payForm.transactionRef,
      paymentDate: payForm.paymentDate,
    });
    if (result.success) {
      toast.success('Submitted — waiting for manager confirmation');
      setPayForm({ receivableId: '', amount: '', transactionRef: '', paymentDate: toDate(new Date()) });
      load();
    } else toast.error(result.error);
  };

  if (!resident) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-gray-600">Loading resident portal…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Profile + stay */}
      <section className="bg-white border rounded-xl p-5 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hi, {resident.name}</h1>
          <p className="text-sm text-gray-500">
            {hostelPayInfo?.hostel_name || 'Hostel'}
            {hostelPayInfo?.city ? ` · ${hostelPayInfo.city}` : ''}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Floor</p>
            <p className="font-semibold text-gray-900">{stay.floor_name || resident.floor_name || 'Not assigned'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Room</p>
            <p className="font-semibold text-gray-900">{stay.room_number || resident.room_number || 'Not assigned'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Bed</p>
            <p className="font-semibold text-gray-900">{stay.bed_label || resident.bed_label || 'Not assigned'}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">Security deposit</p>
            <p className="font-bold text-red-800">{rs(resident.security_deposit_balance ?? resident.security_deposit)}</p>
            <p className="text-[11px] text-gray-500">held of {rs(resident.security_deposit)}</p>
          </div>
        </div>
        {!(stay.floor_name || stay.room_number || stay.bed_label || resident.floor_name || resident.room_number || resident.bed_label) && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            No bed assigned yet. Ask hostel staff to assign Floor / Room / Bed on the Residents page.
          </p>
        )}

        <p className="text-sm text-gray-600">
          Plan: <strong>{resident.rent_plan}</strong>
          {resident.rent_plan === 'DAILY' && ` · ${rs(resident.daily_rent)}/day`}
          {resident.rent_plan === 'MONTHLY' && ` · ${rs(resident.monthly_rent)}/month`}
          {resident.rent_plan === 'ADHOC' && (Number(resident.adhoc_amount) > 0
            ? ` · default ${rs(resident.adhoc_amount)}`
            : ' · charged as needed')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <p className="text-xs text-green-700">Total paid</p>
            <p className="text-xl font-bold text-green-800">{rs(paymentSummary.totalPaid)}</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3">
            <p className="text-xs text-red-700">Total pending</p>
            <p className="text-xl font-bold text-red-800">{rs(paymentSummary.totalPending)}</p>
          </div>
        </div>
      </section>

      {/* Rent months */}
      <section id="dues" className="bg-white border rounded-xl p-4 space-y-3 scroll-mt-20">
        <h2 className="font-bold text-lg">Rent — paid & unpaid</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Month</th>
                <th className="px-3 py-2">St. Dt</th>
                <th className="px-3 py-2">Ed. Dt</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2">Payment status</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedDues.map((d) => {
                const unpaid = Number(d.balance) > 0;
                const receiptDoc = (
                  <HostelReceiptPDF
                    {...buildHostelBillProps({
                      hostel: hostelPayInfo,
                      resident: { ...resident, pending_balance: d.balance },
                      receivable: d,
                      receipt: {
                        bill_number: d.latest_bill_number,
                        payment_method: d.latest_payment_method,
                        payment_type: d.latest_payment_type,
                        paid_at: d.latest_paid_at,
                      },
                      stay,
                    })}
                  />
                );
                return (
                  <tr key={d.id} className="border-t align-middle">
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{d.month_label || d.billing_period_start || '—'}</td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                      {d.billing_period_start
                        ? new Date(d.billing_period_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                      {d.billing_period_end
                        ? new Date(d.billing_period_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {unpaid ? (
                        <span className="font-semibold text-red-700">{rs(d.balance)}</span>
                      ) : (
                        <span className="font-semibold text-green-700">{rs(d.amount_paid || d.amount_due)}</span>
                      )}
                      {unpaid && Number(d.amount_paid) > 0 && (
                        <p className="text-[11px] text-gray-500">of {rs(d.amount_due)}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge(d.payment_status)}`}>
                        {statusLabel(d.payment_status)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {d.pending_submission ? (
                        <span className="text-xs text-blue-700 font-medium">Waiting for manager</span>
                      ) : unpaid ? (
                        <button
                          type="button"
                          className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold"
                          onClick={() => {
                            setPayForm({
                              receivableId: d.id,
                              amount: String(d.balance),
                              transactionRef: '',
                              paymentDate: toDate(new Date()),
                            });
                            document.getElementById('pay-box')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          Pay
                        </button>
                      ) : d.latest_receipt_id || d.latest_bill_number ? (
                        <div className="space-y-0.5">
                          <p className="text-xs text-gray-600">Paid {rs(d.amount_paid)}</p>
                          <PDFDownloadLink
                            document={receiptDoc}
                            fileName={`receipt-${d.latest_bill_number || d.id}.pdf`}
                            className="text-xs font-semibold text-red-700 underline"
                          >
                            {({ loading }) => (loading ? '…' : `Receipt ${d.latest_bill_number || ''}`)}
                          </PDFDownloadLink>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Paid {rs(d.amount_paid)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sortedDues.length === 0 && <p className="p-4 text-gray-500 text-sm">No rent months yet.</p>}
        </div>

        <div id="pay-box" className="space-y-3 scroll-mt-20">
          {hostelPayInfo && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm space-y-3">
              <div>
                <p className="font-semibold text-gray-900">Pay via PhonePe / GPay</p>
                <p className="mt-1">PhonePe: <strong>{hostelPayInfo.phonepe_number || '—'}</strong></p>
                <p>UPI: <strong>{hostelPayInfo.upi_id || '—'}</strong></p>
              </div>
              {(hostelPayInfo.payment_qr_url_s3_image || hostelPayInfo.payment_qr_url) && (
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-white border border-amber-100 rounded-lg p-3">
                  <img
                    src={hostelPayInfo.payment_qr_url_s3_image || hostelPayInfo.payment_qr_url}
                    alt="Hostel payment QR"
                    className="w-40 h-40 object-contain"
                  />
                  <p className="text-xs text-gray-500">Scan, pay the due, then submit UTR below.</p>
                </div>
              )}
            </div>
          )}

          {payForm.receivableId && (
            <form onSubmit={submitTxn} className="border rounded-lg p-3 space-y-2 bg-gray-50">
              <p className="text-sm font-semibold">Submit payment for verification</p>
              <label className="block text-xs text-gray-600">
                Payment date *
                <input
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  type="date"
                  required
                  value={payForm.paymentDate}
                  onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                />
              </label>
              <input className="w-full border rounded-lg px-3 py-2" type="number" required value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
              <input className="w-full border rounded-lg px-3 py-2" placeholder="PhonePe / UTR number *" required value={payForm.transactionRef} onChange={(e) => setPayForm({ ...payForm, transactionRef: e.target.value })} />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 font-semibold">Submit</button>
                <button type="button" className="px-4 border rounded-lg" onClick={() => setPayForm({ receivableId: '', amount: '', transactionRef: '', paymentDate: toDate(new Date()) })}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Week meals */}
      <section id="meals" className="bg-white border rounded-xl p-4 space-y-3 scroll-mt-20">
        <div className="flex flex-wrap justify-between gap-2">
          <div>
            <h2 className="font-bold text-lg">Week meal availability</h2>
            <p className="text-xs text-gray-500">
              Breakfast, Lunch, Dinner only. Mark Available and pick the dish. Juices and extras go under Special orders.
            </p>
            {joinDate && (
              <p className="text-xs text-blue-700 mt-1">
                Meals can be marked from your join date ({joinDate}) onward
                {checkoutDate ? ` until ${checkoutDate}` : ''}.
              </p>
            )}
          </div>
          <input type="date" className="border rounded-lg px-2 py-1 text-sm" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-2 py-2">Day</th>
                <th className="px-2 py-2">Breakfast</th>
                <th className="px-2 py-2">Lunch</th>
                <th className="px-2 py-2">Dinner</th>
              </tr>
            </thead>
            <tbody>
              {weekMeals.map((day, idx) => {
                const editable = isMealDateEditable(day.meal_date);
                return (
                  <tr key={day.meal_date} className={`border-t ${editable ? '' : 'bg-gray-50 text-gray-400'}`}>
                    <td className="px-2 py-2 font-medium whitespace-nowrap align-top">
                      {day.weekday}<br />
                      <span className={editable ? 'text-gray-400' : 'text-gray-300'}>{day.meal_date}</span>
                      {!editable && (
                        <p className="text-[10px] font-normal text-gray-400 mt-0.5">
                          {joinDate && String(day.meal_date) < joinDate ? 'Before join date' : 'Not in stay'}
                        </p>
                      )}
                    </td>
                    {['breakfast', 'lunch', 'dinner'].map((meal) => {
                      const itemField = `${meal}_item_id`;
                      const options = itemsBySlot[meal] || [];
                      return (
                        <td key={meal} className="px-2 py-2 align-top space-y-1 min-w-[8.5rem]">
                          <select
                            className={`border rounded px-1 py-1 w-full ${editable ? '' : 'bg-gray-100 cursor-not-allowed'}`}
                            value={editable ? day[meal] : 'NOT_AVAILABLE'}
                            disabled={!editable}
                            onChange={(e) => setMeal(idx, meal, e.target.value)}
                          >
                            <option value="NOT_AVAILABLE">Not available</option>
                            <option value="AVAILABLE">Available</option>
                          </select>
                          {editable && day[meal] === 'AVAILABLE' && options.length > 0 && (
                            <select
                              className="border rounded px-1 py-1 w-full"
                              value={day[itemField] || ''}
                              onChange={(e) => setMealItem(idx, itemField, e.target.value)}
                            >
                              <option value="">Select item…</option>
                              {options.map((it) => (
                                <option key={it.id} value={it.id}>{it.name}</option>
                              ))}
                            </select>
                          )}
                          {editable && day[meal] === 'AVAILABLE' && options.length === 0 && (
                            <p className="text-[10px] text-amber-700">No menu items yet</p>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={saveMeals} className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">
          Save week meals
        </button>
      </section>

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <FaWhatsapp /> After manager confirms payment, they can share the bill on WhatsApp.
      </p>
    </div>
  );
};

export default HostelManagementResidentPortal;
