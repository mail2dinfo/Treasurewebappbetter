import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { FiArrowLeft, FiCalendar, FiDownload, FiEye, FiPhone, FiUserPlus, FiUsers, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';
import { useUserContext } from '../../context/user_context';
import { DP_BASE_PATH, DP_COLLECTOR_PATH } from '../../components/deepavaliChits/deepavaliMenuItems';
import DeepavaliSubscriberDuesPDF from '../../components/deepavaliChits/DeepavaliSubscriberDuesPDF';
import ReceivableReceitPdf from '../../components/PDF/ReceivableReceitPdf';

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const dueDay = (row) => String(row.due_date || '').slice(0, 10);
const tenureUnit = (mode) => {
    const kind = String(mode || 'MONTHLY').toUpperCase();
    if (kind === 'DAILY') return 'days';
    if (kind === 'WEEKLY') return 'weeks';
    return 'months';
};
const periodWord = (mode) => {
    const kind = String(mode || 'MONTHLY').toUpperCase();
    if (kind === 'DAILY') return 'Day';
    if (kind === 'WEEKLY') return 'Week';
    return 'Month';
};

const paymentStatusMeta = ({ paid, outstanding, date }) => {
    if (Number(outstanding) <= 0) return { label: 'Paid', className: 'bg-emerald-50 text-emerald-700' };
    if (Number(paid) > 0) return { label: 'Partial', className: 'bg-amber-50 text-amber-700' };
    if (date && date < today()) return { label: 'Overdue', className: 'bg-red-50 text-red-700' };
    return { label: 'Unpaid', className: 'bg-gray-100 text-gray-600' };
};

const paymentDay = (row) => String(row.payment_date || row.created_at || '').slice(0, 10);

const latestPaymentDate = (receiptList) => {
    const dates = (receiptList || []).map(paymentDay).filter(Boolean).sort();
    return dates.length ? dates[dates.length - 1] : '';
};

const formatBillLabel = (rec) => {
    if (!rec) return '';
    if (rec.bill_label) return rec.bill_label;
    if (rec.bill_number == null || rec.bill_number === '') return '';
    return `DP-${String(rec.bill_number).padStart(4, '0')}`;
};

const pickLatestReceipt = (list) => {
    if (!list?.length) return null;
    return list.slice().sort((a, b) => {
        const byBill = Number(b.bill_number || 0) - Number(a.bill_number || 0);
        if (byBill) return byBill;
        return String(b.payment_date || b.created_at || '').localeCompare(String(a.payment_date || a.created_at || ''));
    })[0];
};

const buildMemberSchedule = (group, receivables, subscriberId, slotList, receipts = []) => {
    const slotIds = new Set((slotList || []).map((slot) => String(slot.id)));
    const memberReceivables = (receivables || []).filter((row) => {
        if (String(row.due_status || '').toUpperCase() === 'ROLLED') return false;
        const rowGroup = String(row.group_id || row.group?.id || '');
        if (rowGroup && group?.id && rowGroup !== String(group.id)) return false;
        const rowSub = String(row.subscriber_id || row.subscriber?.id || '');
        if (rowSub !== String(subscriberId)) return false;
        const rowSlot = String(row.slot_id || row.slot?.id || '');
        if (rowSlot && slotIds.size && !slotIds.has(rowSlot)) return false;
        return true;
    });
    const recvById = {};
    memberReceivables.forEach((row) => {
        recvById[String(row.id)] = row;
    });
    const byDate = {};
    memberReceivables.forEach((row) => {
        const date = dueDay(row);
        if (!date) return;
        if (!byDate[date]) {
            byDate[date] = {
                date, total: 0, paid: 0, outstanding: 0, fine: 0, paidDue: 0, paidFine: 0, slots: 0, itemIds: [],
            };
        }
        const principal = Number(row.due_amount || 0) + Number(row.arrears_amount || 0);
        const fineAmt = Number(row.fine_amount || 0);
        const paidAmt = Number(row.paid_amount || 0);
        const paidDue = Math.min(paidAmt, principal);
        const paidFine = Math.max(0, paidAmt - principal);
        byDate[date].total += principal + fineAmt;
        byDate[date].paid += paidAmt;
        byDate[date].paidDue += paidDue;
        byDate[date].paidFine += paidFine;
        byDate[date].fine += fineAmt;
        byDate[date].outstanding += row.is_paid
            ? 0
            : Number(row.closing_balance ?? (principal + fineAmt - paidAmt));
        byDate[date].slots += 1;
        byDate[date].itemIds.push(String(row.id));
    });
    return Object.values(byDate)
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))
        .map((row, index) => {
            const unit = periodWord(group?.mode);
            const period = `${unit} ${index + 1}`;
            const dueLabel = `Due ${index + 1}`;
            let fineNote = '—';
            if (Number(row.paidFine || 0) > 0) {
                fineNote = `Fine ${money(row.paidFine)} paid for ${dueLabel}`;
            } else if (Number(row.fine || 0) > 0) {
                fineNote = `Fine ${money(row.fine)} pending on ${dueLabel}`;
            }
            const idSet = new Set(row.itemIds || []);
            const slotSet = new Set((row.itemIds || []).map((id) => String(recvById[id]?.slot_id || recvById[id]?.slot?.id || '')));
            const paidOnThis = Number(row.paidDue || 0) > 0 || Number(row.paidFine || 0) > 0;
            let paymentDate = '';
            let receipt = null;
            if (paidOnThis) {
                const direct = (receipts || []).filter((rec) => idSet.has(String(rec.receivable_id)));
                paymentDate = latestPaymentDate(direct);
                receipt = pickLatestReceipt(direct);
                if (!paymentDate || !receipt) {
                    const inherited = (receipts || []).filter((rec) => {
                        const linked = recvById[String(rec.receivable_id)];
                        if (!linked) return false;
                        const slotKey = String(linked.slot_id || linked.slot?.id || '');
                        if (slotKey && slotSet.size && !slotSet.has(slotKey)) return false;
                        return dueDay(linked) >= row.date;
                    });
                    if (!paymentDate) paymentDate = latestPaymentDate(inherited);
                    if (!receipt) receipt = pickLatestReceipt(inherited);
                }
            }
            return {
                ...row,
                period,
                dueLabel,
                fineNote,
                paymentDate: paymentDate || '',
                receipt,
                billLabel: formatBillLabel(receipt),
                status: paymentStatusMeta(row),
            };
        });
};
const fieldClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

const statusBadge = (status) => {
    const value = String(status || 'DRAFT').toUpperCase();
    if (value === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (value === 'CLOSED') return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-amber-50 text-amber-700 border-amber-100';
};

const DeepavaliGroupDetailPage = () => {
    const { groupId, subscriberId } = useParams();
    const history = useHistory();
    const location = useLocation();
    const { user } = useUserContext();
    const { groups, subscribers, receivables, receipts, payables, paymentMethods, company, enrolSlot, loading } = useDeepavali();
    const collector = (location.pathname || '').includes('/collector');
    const groupsPath = collector ? `${DP_COLLECTOR_PATH}/groups` : `${DP_BASE_PATH}/groups`;
    const subscribersPath = collector ? `${DP_COLLECTOR_PATH}/subscribers` : `${DP_BASE_PATH}/subscribers`;

    const group = useMemo(
        () => (groups || []).find((row) => String(row.id) === String(groupId)),
        [groups, groupId]
    );

    const [saving, setSaving] = useState(false);
    const [downloadingBill, setDownloadingBill] = useState('');
    const [showEnrol, setShowEnrol] = useState(false);
    const [addMemberId, setAddMemberId] = useState('');
    const [joinDate, setJoinDate] = useState(today());
    const [addSlotCount, setAddSlotCount] = useState('1');
    const [unsubSlot, setUnsubSlot] = useState(null);

    const pdfCompany = useMemo(() => {
        if (company?.company_name) {
            return [{
                name: company.company_name,
                street_address: company.address || '',
                phone: company.phone || '',
                email: company.email || '',
                registration_no: company.gst_details || '',
                logo_base64format: company.company_logo || '',
            }];
        }
        const fromUser = user?.results?.userCompany;
        if (Array.isArray(fromUser) && fromUser[0]) return fromUser;
        return [{ name: 'Deepavali Chits' }];
    }, [company, user]);

    const duesPdfHeaders = useMemo(() => ([
        { title: 'Date', value: 'date' },
        { title: 'Period', value: 'period' },
        { title: 'Paid on', value: 'paymentDate' },
        { title: 'Total', value: 'total', align: 'right' },
        { title: 'Due paid', value: 'paidDue', align: 'right' },
        { title: 'Fine paid', value: 'paidFine', align: 'right' },
        { title: 'Outstanding', value: 'outstanding', align: 'right' },
        { title: 'Fine note', value: 'fineNote' },
        { title: 'Payment status', value: 'status' },
        { title: 'Bill', value: 'bill' },
    ]), []);

    useEffect(() => {
        const params = new URLSearchParams(location.search || '');
        if (params.get('add') === '1' && group) {
            setShowEnrol(true);
        }
    }, [location.search, group]);

    const openEnrol = () => {
        if (!subscribers.length) {
            toast.info('Add a subscriber first');
            history.push(subscribersPath);
            return;
        }
        setAddMemberId('');
        setJoinDate(today());
        setAddSlotCount('1');
        setShowEnrol(true);
    };

    const submitEnrol = async (e) => {
        e.preventDefault();
        if (!addMemberId) {
            toast.error('Select a subscriber');
            return;
        }
        const slotCount = Math.floor(Number(addSlotCount));
        if (!Number.isFinite(slotCount) || slotCount < 1) {
            toast.error('Enter how many slots this subscriber wants');
            return;
        }
        if (slotCount > 50) {
            toast.error('You can add at most 50 slots at once');
            return;
        }
        setSaving(true);
        try {
            await enrolSlot({
                group_id: group.id,
                subscriber_id: addMemberId,
                join_date: joinDate,
                slot_count: slotCount,
            });
            toast.success(
                slotCount === 1
                    ? 'Subscriber added with 1 slot. Current due includes missed weeks.'
                    : `Subscriber added with ${slotCount} slots. Current due includes all slots and any missed weeks.`
            );
            setShowEnrol(false);
        } catch (err) {
            toast.error(err.message || 'Could not add subscriber');
        } finally {
            setSaving(false);
        }
    };

    const confirmUnsubscribe = async () => {
        if (!unsubSlot) return;
        setSaving(true);
        try {
            await enrolSlot({ slot_id: unsubSlot.id, unsubscribe: true });
            toast.success(`Slot ${unsubSlot.slot_number} stopped. Paid dues were kept; pending and future dues were removed.`);
            setUnsubSlot(null);
        } catch (err) {
            toast.error(err.message || 'Could not unsubscribe this slot');
        } finally {
            setSaving(false);
        }
    };

    const goBack = () => {
        if (subscriberId) history.push(`${groupsPath}/${groupId}`);
        else history.push(groupsPath);
    };

    const BackButton = () => (
        <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 shadow-sm"
        >
            <FiArrowLeft className="w-4 h-4" />
            Back
        </button>
    );

    if (!loading && !group) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <BackButton />
                    <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                        <p className="text-gray-800 font-semibold">Group not found</p>
                        <p className="text-sm text-gray-500 mt-1">It may have been deleted.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <BackButton />
                    <p className="mt-6 text-sm text-gray-500">Loading group…</p>
                </div>
            </div>
        );
    }

    const slots = group.slots || [];
    const tenure = group.tenure || group.frequency;
    const tenureLabel = tenureUnit(group.mode);

    const slotTotals = (slot) => {
        const rows = (receivables || []).filter((row) => {
            if (String(row.due_status || '').toUpperCase() === 'ROLLED') return false;
            const rowGroup = String(row.group_id || row.group?.id || '');
            if (rowGroup && rowGroup !== String(group.id)) return false;
            const rowSlot = String(row.slot_id || row.slot?.id || '');
            if (rowSlot) return rowSlot === String(slot.id);
            return String(row.subscriber_id || row.subscriber?.id || '') === String(slot.subscriber_id || slot.subscriber?.id || '');
        });
        const total = rows.reduce((sum, row) => sum + Number(row.due_amount || 0) + Number(row.arrears_amount || 0) + Number(row.fine_amount || 0), 0);
        const paid = rows.reduce((sum, row) => sum + Number(row.paid_amount || 0), 0);
        const due = rows.reduce((sum, row) => {
            if (row.is_paid) return sum;
            return sum + Number(row.closing_balance ?? (Number(row.due_amount || 0) + Number(row.fine_amount || 0) - Number(row.paid_amount || 0)));
        }, 0);
        return { total, paid, due };
    };

    const subscriberIdOf = (slot) => String(slot.subscriber_id || slot.subscriber?.id || '');

    const memberSlots = (subscriberId) => slots.filter((slot) => subscriberIdOf(slot) === String(subscriberId));

    const memberTotals = (subscriberId) => {
        const related = memberSlots(subscriberId);
        return related.reduce((acc, slot) => {
            const amounts = slotTotals(slot);
            return {
                total: acc.total + amounts.total,
                paid: acc.paid + amounts.paid,
                due: acc.due + amounts.due,
            };
        }, { total: 0, paid: 0, due: 0 });
    };

    const members = (() => {
        const seen = new Map();
        (slots || []).forEach((slot) => {
            const id = String(slot.subscriber_id || slot.subscriber?.id || slot.id);
            if (!seen.has(id)) {
                seen.set(id, {
                    subscriberId: id,
                    subscriber: slot.subscriber,
                    slots: [],
                });
            }
            seen.get(id).slots.push(slot);
        });
        return Array.from(seen.values());
    })();

    const memberSchedule = (id) => {
        const related = memberSlots(id);
        return buildMemberSchedule(group, receivables, id, related, receipts);
    };

    const viewMember = subscriberId ? (() => {
        const related = memberSlots(subscriberId)
            .slice()
            .sort((a, b) => Number(a.slot_number || 0) - Number(b.slot_number || 0));
        const first = related[0];
        if (!first) return null;
        return {
            subscriberId,
            name: first.subscriber?.subscriber_name || 'Member',
            phone: first.subscriber?.phone || '',
            slots: related,
            schedule: memberSchedule(subscriberId),
        };
    })() : null;

    const duesPdfRows = (() => {
        const schedule = viewMember?.schedule || [];
        if (!schedule.length) return [];
        const rows = schedule.map((row) => ({
            date: row.date,
            period: row.slots > 1 ? `${row.period} (${row.slots} slots)` : row.period,
            paymentDate: row.paymentDate || '—',
            total: money(row.total),
            paidDue: money(row.paidDue),
            paidFine: money(row.paidFine),
            outstanding: money(row.outstanding),
            fineNote: row.fineNote || '—',
            status: row.status?.label || '',
            bill: row.billLabel || '—',
        }));
        rows.push({
            date: 'TOTAL',
            period: '',
            paymentDate: '',
            total: money(schedule.reduce((sum, row) => sum + Number(row.total || 0), 0)),
            paidDue: money(schedule.reduce((sum, row) => sum + Number(row.paidDue || 0), 0)),
            paidFine: money(schedule.reduce((sum, row) => sum + Number(row.paidFine || 0), 0)),
            outstanding: money(schedule.reduce((sum, row) => sum + Number(row.outstanding || 0), 0)),
            fineNote: '',
            status: '',
            bill: '',
        });
        return rows;
    })();

    const openView = (memberOrSlot) => {
        const id = memberOrSlot.subscriberId || subscriberIdOf(memberOrSlot);
        history.push(`${groupsPath}/${groupId}/subscribers/${id}`);
    };

    const downloadScheduleBill = async (memberInfo, row) => {
        const receipt = row?.receipt;
        const billLabel = row?.billLabel || formatBillLabel(receipt);
        const schedule = memberInfo?.schedule || [];
        const name = memberInfo?.name || '—';
        if (!receipt || !billLabel) return;
        if (downloadingBill) return;
        setDownloadingBill(billLabel);
        try {
            const covered = schedule.filter((item) => String(item.receipt?.id || '') === String(receipt.id));
            const source = covered.length ? covered : [row];
            const lineItems = source.flatMap((item) => {
                const lines = [];
                if (Number(item.paidDue || 0) > 0) {
                    lines.push({ label: item.period, amount: item.paidDue });
                }
                if (Number(item.paidFine || 0) > 0) {
                    lines.push({ label: `${item.period} fine`, amount: item.paidFine, isFine: true });
                }
                return lines;
            });
            const paidAmount = Number(receipt.paid_amount || source.reduce((sum, item) => sum + Number(item.paidDue || 0) + Number(item.paidFine || 0), 0));
            const blob = await pdf(
                <ReceivableReceitPdf
                    companyData={pdfCompany}
                    receivableData={{
                        subscriberName: name,
                        paymentType: Number(row.outstanding) > 0 ? 'Partial' : 'Full',
                        paymentMethod: receipt.payment_method_name || receipt.payment_method || '—',
                        groupName: group.group_name || '—',
                        auctionDate: row.date,
                        transactedDate: receipt.payment_date || row.paymentDate,
                        createdAt: receipt.payment_date || row.paymentDate,
                        paymentAmount: paidAmount,
                        billNumber: billLabel,
                        lineItems,
                        lineTotal: paidAmount,
                    }}
                />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${billLabel}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            toast.error(err.message || 'Could not download bill');
        } finally {
            setDownloadingBill('');
        }
    };

    const downloadDueBill = (row) => downloadScheduleBill(viewMember, row);

    const memberPayables = (id) => (payables || []).filter((row) => (
        String(row.subscriber_id || row.subscriber?.id || '') === String(id)
        && String(row.group_id || row.group?.id || '') === String(group.id)
    ));

    const memberPaymentBills = (id) => {
        const seen = new Map();
        memberPayables(id).forEach((row) => {
            if (!row.is_paid || !row.bill_label) return;
            if (!seen.has(row.bill_label)) seen.set(row.bill_label, row);
        });
        return Array.from(seen.values());
    };

    const downloadPaymentBill = async (billRow, subscriberName) => {
        const billLabel = billRow?.bill_label;
        if (!billLabel) return;
        if (downloadingBill) return;
        setDownloadingBill(billLabel);
        try {
            const covered = memberPayables(billRow.subscriber_id || billRow.subscriber?.id)
                .filter((row) => row.is_paid && row.bill_label === billLabel);
            const source = covered.length ? covered : [billRow];
            const lineItems = source.map((slot) => ({
                key: slot.id,
                label: `Slot ${slot.slot?.slot_number || '—'} settlement`,
                amount: Number(slot.net_amount ?? slot.paid_amount ?? slot.amount ?? 0),
            }));
            const paidAmount = Number(lineItems.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2));
            const payDate = String(billRow.payment_date || today()).slice(0, 10);
            const methodName = paymentMethods.find((acc) => String(acc.id) === String(billRow.payment_method_id))?.account_name || '—';
            const blob = await pdf(
                <ReceivableReceitPdf
                    companyData={pdfCompany}
                    receivableData={{
                        subscriberName: subscriberName || billRow.subscriber?.subscriber_name || '—',
                        paymentType: 'Settlement',
                        paymentMethod: methodName,
                        groupName: group.group_name || '—',
                        auctionDate: payDate,
                        transactedDate: payDate,
                        createdAt: payDate,
                        paymentAmount: paidAmount,
                        billNumber: billLabel,
                        lineItems,
                        lineTotal: paidAmount,
                    }}
                />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${billLabel}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            toast.error(err.message || 'Could not download bill');
        } finally {
            setDownloadingBill('');
        }
    };

    const PaymentBillLinks = ({ subscriberId, subscriberName }) => {
        const bills = memberPaymentBills(subscriberId);
        if (!bills.length) return <span className="text-sm text-gray-400">—</span>;
        return (
            <div className="flex flex-col items-start gap-1">
                {bills.map((row) => (
                    <button
                        key={row.bill_label}
                        type="button"
                        onClick={() => downloadPaymentBill(row, subscriberName)}
                        disabled={Boolean(downloadingBill)}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                        {row.bill_label}
                        <FiDownload className="w-3.5 h-3.5" />
                    </button>
                ))}
            </div>
        );
    };

    if (subscriberId && !viewMember) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto">
                    <BackButton />
                    <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center mt-6">
                        <p className="text-gray-800 font-semibold">Subscriber not found in this group</p>
                    </div>
                </div>
            </div>
        );
    }

    if (viewMember) {
        const schedule = viewMember.schedule || [];
        const dueTotal = schedule.reduce((sum, row) => sum + Number(row.total || 0), 0);
        const duePaid = schedule.reduce((sum, row) => sum + Number(row.paidDue || 0), 0);
        const finePaid = schedule.reduce((sum, row) => sum + Number(row.paidFine || 0), 0);
        const dueOutstanding = schedule.reduce((sum, row) => sum + Number(row.outstanding || 0), 0);
        const firstSub = viewMember.slots[0]?.subscriber;
        const photo = firstSub?.photo;
        const initial = String(viewMember.name || 'M').charAt(0).toUpperCase();
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto space-y-5">
                    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 sm:px-6 pt-5 pb-4">
                            <div className="flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={goBack}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold"
                                >
                                    <FiArrowLeft className="w-4 h-4" />
                                    Back
                                </button>
                                <PDFDownloadLink
                                    document={(
                                        <DeepavaliSubscriberDuesPDF
                                            companyData={pdfCompany}
                                            subscriberName={viewMember.name}
                                            subscriberPhone={viewMember.phone}
                                            groupName={group.group_name}
                                            slotCount={viewMember.slots.length}
                                            tableHeaders={duesPdfHeaders}
                                            tableData={duesPdfRows}
                                        />
                                    )}
                                    fileName={`Deepavali_${String(viewMember.name || 'subscriber').replace(/[^\w.-]+/g, '_')}_dues.pdf`}
                                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-semibold border border-gray-200 bg-white text-gray-800 rounded-xl hover:bg-gray-50 shrink-0 self-start"
                                >
                                    {({ loading: pdfLoading }) => (
                                        <>
                                            <FiDownload className="w-4 h-4" />
                                            {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
                                        </>
                                    )}
                                </PDFDownloadLink>
                            </div>
                            <div className="mt-4 flex items-center gap-3 sm:gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 ring-1 ring-red-100">
                                    {photo
                                        ? <img src={photo} alt="" className="w-full h-full object-cover" />
                                        : initial}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                        {group.group_name}
                                    </p>
                                    <h1 className="text-2xl font-bold text-gray-900 leading-tight truncate">{viewMember.name}</h1>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                                        {viewMember.phone ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                <FiPhone className="w-3.5 h-3.5" />
                                                {viewMember.phone}
                                            </span>
                                        ) : null}
                                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-[11px] font-semibold">
                                            {viewMember.slots.length} slot{viewMember.slots.length === 1 ? '' : 's'}
                                            {viewMember.slots.length > 1 ? ' combined' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {(viewMember.slots || []).map((slot) => {
                                    const stopped = slot.status === 'WITHDRAWN';
                                    return (
                                        <div
                                            key={slot.id}
                                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5"
                                        >
                                            <span className="text-sm font-semibold text-gray-900">Slot {slot.slot_number}</span>
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${stopped ? 'bg-white text-gray-500' : 'bg-emerald-50 text-emerald-700'}`}>
                                                {stopped ? 'Stopped' : 'Active'}
                                            </span>
                                            {!stopped && group.status !== 'CLOSED' && (
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold"
                                                    onClick={() => setUnsubSlot(slot)}
                                                >
                                                    Unsubscribe
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 border-t border-gray-100">
                            <div className="bg-white px-5 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
                                <p className="mt-1 text-xl font-bold text-gray-900">{money(dueTotal)}</p>
                            </div>
                            <div className="bg-white px-5 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Due paid</p>
                                <p className="mt-1 text-xl font-bold text-emerald-800">{money(duePaid)}</p>
                            </div>
                            <div className="bg-white px-5 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">Fine paid</p>
                                <p className="mt-1 text-xl font-bold text-orange-800">{money(finePaid)}</p>
                            </div>
                            <div className="bg-white px-5 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Outstanding</p>
                                <p className="mt-1 text-xl font-bold text-red-700">{money(dueOutstanding)}</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto border-t border-gray-100">
                            {!viewMember.schedule.length ? (
                                <p className="px-6 py-10 text-sm text-gray-500 text-center">No receivables for this subscriber yet.</p>
                            ) : (
                                <table className="w-full min-w-[640px]">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paid on</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Due paid</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Fine paid</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Outstanding</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fine details</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment status</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bill</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {viewMember.schedule.map((row) => (
                                            <tr key={row.date} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{row.date}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                    {row.period}
                                                    {row.slots > 1 ? <span className="ml-1 text-xs font-normal text-gray-500">({row.slots} slots)</span> : null}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{row.paymentDate || '—'}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900 whitespace-nowrap">{money(row.total)}</td>
                                                <td className="px-4 py-3 text-sm text-right text-emerald-700 whitespace-nowrap">{money(row.paidDue)}</td>
                                                <td className="px-4 py-3 text-sm text-right text-teal-700 whitespace-nowrap">{money(row.paidFine)}</td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold text-red-600 whitespace-nowrap">{money(row.outstanding)}</td>
                                                <td className="px-4 py-3 text-xs text-gray-700">{row.fineNote || '—'}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.status.className}`}>
                                                        {row.status.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                    {row.billLabel ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => downloadDueBill(row)}
                                                            disabled={Boolean(downloadingBill)}
                                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                                                        >
                                                            {row.billLabel}
                                                            <FiDownload className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t border-gray-200">
                                        <tr>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-800" colSpan={3}>Total</td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{money(viewMember.schedule.reduce((sum, row) => sum + row.total, 0))}</td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-700">{money(viewMember.schedule.reduce((sum, row) => sum + Number(row.paidDue || 0), 0))}</td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-teal-700">{money(viewMember.schedule.reduce((sum, row) => sum + Number(row.paidFine || 0), 0))}</td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">{money(viewMember.schedule.reduce((sum, row) => sum + row.outstanding, 0))}</td>
                                            <td />
                                            <td />
                                            <td />
                                        </tr>
                                    </tfoot>
                                </table>
                            )}
                        </div>
                    </section>
                </div>
                {unsubSlot && createPortal(
                    <div
                        className="fixed inset-0 z-[210] bg-black/50 flex items-center justify-center p-4"
                        onClick={() => {
                            if (!saving) setUnsubSlot(null);
                        }}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-gray-900 text-center">Confirm unsubscribe</h3>
                            <p className="text-sm text-gray-600 text-center mt-2">
                                Stop <strong>Slot {unsubSlot.slot_number}</strong> for this subscriber? Paid dues stay as they are. Pending and future unpaid dues for this slot will be removed.
                            </p>
                            <div className="flex gap-3 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setUnsubSlot(null)}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmUnsubscribe}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50"
                                >
                                    {saving ? 'Updating…' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <BackButton />
                </div>

                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 sm:px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{group.group_name}</h1>
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge(group.status)}`}>
                                    {group.status || 'DRAFT'}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2.5 py-0.5 text-[11px] font-semibold">
                                    {group.mode}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 inline-flex items-center gap-1">
                                <FiCalendar className="w-3.5 h-3.5" />
                                Starts {String(group.start_date || '—').slice(0, 10)}
                                {group.end_date ? ` · Ends ${String(group.end_date).slice(0, 10)}` : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={openEnrol} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg">
                                <FiUserPlus className="w-4 h-4" /> Add Subscriber
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 px-5 sm:px-6 py-5">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{money(group.amount)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Due amount</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{money(group.emi || (Number(group.amount) / Number(tenure || 1)))}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Payable amount</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{money(group.payable_amount || (Number(group.amount) + Number(group.amount) * Number(group.interest_rate || 0) / 100))}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tenure</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{tenure} {tenureLabel}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Fine</p>
                            <p className="mt-1 text-xl font-bold text-gray-900">{group.fine_enabled ? money(group.fine_value) : 'Off'}</p>
                        </div>
                    </div>
                </section>

                <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Subscribers ({members.length})</h2>
                    </div>

                    {!slots.length && (
                        <div className="px-5 sm:px-6 py-12 text-center">
                            <FiUsers className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium text-gray-800">No subscribers in this group</p>
                            <p className="text-sm text-gray-500 mt-1">Add a subscriber from the button above. Dues follow the group start date.</p>
                        </div>
                    )}

                    {slots.length > 0 && (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subscriber</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Slots</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Join date</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Paid</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Outstanding</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bill</th>
                                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {members.map((member) => {
                                            const related = member.slots;
                                            const first = related[0];
                                            const name = first?.subscriber?.subscriber_name || 'Member';
                                            const amounts = memberTotals(member.subscriberId);
                                            const activeSlots = related.filter((slot) => slot.status !== 'WITHDRAWN');
                                            const stopped = activeSlots.length === 0;
                                            const joinDate = related
                                                .map((slot) => String(slot.join_date || ''))
                                                .filter(Boolean)
                                                .sort()[0] || '—';
                                            return (
                                                <tr key={member.subscriberId} className="hover:bg-gray-50">
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                                                                {first?.subscriber?.photo
                                                                    ? <img src={first.subscriber.photo} alt="" className="w-full h-full object-cover" />
                                                                    : name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{name}</p>
                                                                <p className="text-xs text-gray-500">{first?.subscriber?.phone || '—'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-gray-700">{related.length}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-700">{joinDate}</td>
                                                    <td className="px-6 py-3 text-sm text-right font-medium text-gray-900 whitespace-nowrap">{money(amounts.total)}</td>
                                                    <td className="px-6 py-3 text-sm text-right font-medium text-emerald-700 whitespace-nowrap">{money(amounts.paid)}</td>
                                                    <td className="px-6 py-3 text-sm text-right font-semibold text-red-600 whitespace-nowrap">{money(amounts.due)}</td>
                                                    <td className="px-6 py-3">
                                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${stopped ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                                            {stopped ? 'Stopped' : 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <PaymentBillLinks subscriberId={member.subscriberId} subscriberName={name} />
                                                    </td>
                                                    <td className="px-6 py-3 text-right whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold"
                                                            onClick={() => openView(member)}
                                                        >
                                                            <FiEye className="w-4 h-4" />
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="md:hidden divide-y divide-gray-100">
                                {members.map((member) => {
                                    const related = member.slots;
                                    const first = related[0];
                                    const name = first?.subscriber?.subscriber_name || 'Member';
                                    const amounts = memberTotals(member.subscriberId);
                                    const activeSlots = related.filter((slot) => slot.status !== 'WITHDRAWN');
                                    const stopped = activeSlots.length === 0;
                                    return (
                                        <div key={member.subscriberId} className="px-5 py-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                                                        {first?.subscriber?.photo
                                                            ? <img src={first.subscriber.photo} alt="" className="w-full h-full object-cover" />
                                                            : name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 truncate">{name}</p>
                                                        <p className="text-xs text-gray-500">{related.length} slot{related.length === 1 ? '' : 's'} · {first?.subscriber?.phone || '—'}</p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${stopped ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-700'}`}>
                                                    {stopped ? 'Stopped' : 'Active'}
                                                </span>
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                                <div className="rounded-lg bg-gray-50 px-2 py-2">
                                                    <p className="text-[10px] uppercase font-semibold text-gray-500">Total</p>
                                                    <p className="text-sm font-semibold text-gray-900">{money(amounts.total)}</p>
                                                </div>
                                                <div className="rounded-lg bg-emerald-50 px-2 py-2">
                                                    <p className="text-[10px] uppercase font-semibold text-emerald-700">Paid</p>
                                                    <p className="text-sm font-semibold text-emerald-800">{money(amounts.paid)}</p>
                                                </div>
                                                <div className="rounded-lg bg-red-50 px-2 py-2">
                                                    <p className="text-[10px] uppercase font-semibold text-red-600">Outstanding</p>
                                                    <p className="text-sm font-semibold text-red-700">{money(amounts.due)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between gap-2">
                                                <PaymentBillLinks subscriberId={member.subscriberId} subscriberName={name} />
                                            </div>
                                            <div className="mt-3">
                                                <button
                                                    type="button"
                                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2"
                                                    onClick={() => openView(member)}
                                                >
                                                    <FiEye className="w-4 h-4" />
                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>
            </div>

            {showEnrol && (
                <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={() => !saving && setShowEnrol(false)}>
                    <form onSubmit={submitEnrol} onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-gray-900">Add subscriber</h2>
                            <button type="button" className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" onClick={() => setShowEnrol(false)} aria-label="Close">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <label className="block text-sm font-medium text-gray-700">
                            Subscriber
                            <select value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)} className={fieldClass} required>
                                <option value="">Select subscriber</option>
                                {subscribers.map((sub) => (
                                    <option key={sub.id} value={sub.id}>{sub.subscriber_name}</option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Slots
                            <input
                                type="number"
                                min="1"
                                max="50"
                                step="1"
                                value={addSlotCount}
                                onChange={(e) => setAddSlotCount(e.target.value)}
                                className={fieldClass}
                                required
                            />
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Join date
                            <input type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} className={fieldClass} required />
                        </label>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setShowEnrol(false)} disabled={saving} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium">Cancel</button>
                            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50">
                                {saving ? 'Adding…' : 'Add subscriber'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {unsubSlot && createPortal(
                <div
                    className="fixed inset-0 z-[210] bg-black/50 flex items-center justify-center p-4"
                    onClick={() => {
                        if (!saving) setUnsubSlot(null);
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 text-center">Confirm unsubscribe</h3>
                        <p className="text-sm text-gray-600 text-center mt-2">
                            Stop <strong>Slot {unsubSlot.slot_number}</strong> for this subscriber? Paid dues stay as they are. Pending and future unpaid dues for this slot will be removed.
                        </p>
                        <div className="flex gap-3 mt-5">
                            <button
                                type="button"
                                onClick={() => setUnsubSlot(null)}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmUnsubscribe}
                                disabled={saving}
                                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50"
                            >
                                {saving ? 'Updating…' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DeepavaliGroupDetailPage;
