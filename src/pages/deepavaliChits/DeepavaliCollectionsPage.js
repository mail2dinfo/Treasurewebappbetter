import React, { useEffect, useMemo, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { FiCheck, FiDownload, FiFilter, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';
import { useUserContext } from '../../context/user_context';
import Mypdf from '../../components/PDF/Mypdf';
import ReceivableReceitPdf from '../../components/PDF/ReceivableReceitPdf';
import { formatDeepavaliPeriodLabel } from '../../utils/deepavaliPeriodLabel';

const today = () => new Date().toISOString().slice(0, 10);
const dueDay = (row) => String(row.due_date || '').slice(0, 10);
const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const emptyFilters = { name: '', groupName: '', phone: '', date: '', period: '' };

const periodLabelOf = (row) => row?.period_label || formatDeepavaliPeriodLabel(row?.group, dueDay(row));

const sortPeriodLabels = (labels) => [...labels].sort((a, b) => {
    const pa = String(a).match(/^(\D+)\s+(\d+)$/);
    const pb = String(b).match(/^(\D+)\s+(\d+)$/);
    if (pa && pb) {
        const byWord = pa[1].localeCompare(pb[1]);
        if (byWord) return byWord;
        return Number(pa[2]) - Number(pb[2]);
    }
    return String(a).localeCompare(String(b));
});

const principalLeftOf = (row) => {
    const principal = Number(row.due_amount || 0) + Number(row.arrears_amount || 0);
    const paid = Number(row.paid_amount || 0);
    return Math.max(0, Number((principal - Math.min(paid, principal)).toFixed(2)));
};

const fineLeftOf = (row) => {
    const principal = Number(row.due_amount || 0) + Number(row.arrears_amount || 0);
    const paid = Number(row.paid_amount || 0);
    const paidIntoFine = Math.max(0, paid - principal);
    return Math.max(0, Number((Number(row.fine_amount || 0) - paidIntoFine).toFixed(2)));
};

const buildBillLines = (bucket) => {
    const sorted = (bucket || []).slice().sort(
        (a, b) => Number(a.slot?.slot_number || 0) - Number(b.slot?.slot_number || 0)
    );
    const lines = [];
    sorted.forEach((row, index) => {
        const principalLeft = principalLeftOf(row);
        const fineLeft = fineLeftOf(row);
        const n = row.slot?.slot_number;
        const slotName = n != null ? `Slot ${n}` : 'Slot';
        if (principalLeft > 0.001) {
            lines.push({
                key: String(row.id || `slot-${index}`),
                receivable_id: row.id || null,
                label: slotName,
                amount: principalLeft,
                isFine: false,
            });
        }
        if (fineLeft > 0.001) {
            lines.push({
                key: `fine-${row.id || index}`,
                receivable_id: row.id || null,
                label: `${slotName} fine`,
                amount: Number(fineLeft.toFixed(2)),
                isFine: true,
            });
        }
    });
    const total = Number(lines.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2));
    return { bill_lines: lines, bill_total: total };
};

const withPayBill = (row) => {
    if (Array.isArray(row?.bill_lines) && row.bill_lines.length) {
        return {
            ...row,
            receivable_ids: row.receivable_ids?.length ? row.receivable_ids : [row.id],
        };
    }
    const bill = buildBillLines([row]);
    return {
        ...row,
        receivable_ids: row.receivable_ids?.length ? row.receivable_ids : [row.id],
        bill_lines: bill.bill_lines,
        bill_total: bill.bill_total,
    };
};

const rowClosing = (row) => Number(row.closing_balance ?? (
    Number(row.due_amount || 0) + Number(row.arrears_amount || 0) + Number(row.fine_amount || 0) - Number(row.paid_amount || 0)
));

const isUnpaidDue = (row) => {
    if (row.is_paid) return false;
    if (String(row.due_status || '').toUpperCase() === 'ROLLED') return false;
    return rowClosing(row) > 0;
};

const formatSlotLabel = (slotNumbers) => {
    const nums = [...new Set((slotNumbers || []).filter((n) => n != null && n !== ''))];
    if (!nums.length) return '—';
    if (nums.length === 1) return `Slot ${nums[0]}`;
    return `Slots ${nums.join(', ')}`;
};

const combineUnpaidReceivables = (rows, asOf = today()) => {
    const unpaid = (rows || []).filter(isUnpaidDue);
    const byDue = {};
    unpaid.forEach((row) => {
        const date = dueDay(row);
        if (!date) return;
        const key = `${row.subscriber_id || row.subscriber?.id || ''}::${row.group_id || row.group?.id || ''}::${date}`;
        if (!byDue[key]) byDue[key] = [];
        byDue[key].push(row);
    });
    return Object.values(byDue).map((bucket) => {
        const sorted = bucket.slice().sort((a, b) => Number(a.slot?.slot_number || 0) - Number(b.slot?.slot_number || 0));
        const bill = buildBillLines(sorted);
        const first = sorted[0];
        const slotNumbers = sorted.map((row) => row.slot?.slot_number).filter((n) => n != null);
        const due_amount = Number(sorted.reduce((sum, row) => sum + Number(row.due_amount || 0), 0).toFixed(2));
        const arrears_amount = Number(sorted.reduce((sum, row) => sum + Number(row.arrears_amount || 0), 0).toFixed(2));
        const fine_amount = Number(sorted.reduce((sum, row) => sum + Number(row.fine_amount || 0), 0).toFixed(2));
        const paid_amount = Number(sorted.reduce((sum, row) => sum + Number(row.paid_amount || 0), 0).toFixed(2));
        const closing_balance = Number(sorted.reduce((sum, row) => sum + rowClosing(row), 0).toFixed(2));
        const date = dueDay(first);
        return {
            ...first,
            combined: sorted.length > 1,
            receivable_ids: sorted.map((row) => row.id),
            due_date: date,
            due_amount,
            arrears_amount,
            fine_amount,
            paid_amount,
            closing_balance,
            is_paid: closing_balance <= 0,
            due_status: 'OPEN',
            bill_lines: bill.bill_lines,
            bill_total: bill.bill_total,
            list_overdue: date < asOf,
            slot_numbers: slotNumbers,
            slot_label: formatSlotLabel(slotNumbers),
            period_label: formatDeepavaliPeriodLabel(first.group, date),
        };
    }).sort((a, b) => {
        const byDate = dueDay(a).localeCompare(dueDay(b));
        if (byDate) return byDate;
        return String(a.subscriber?.subscriber_name || '').localeCompare(String(b.subscriber?.subscriber_name || ''));
    });
};

const getBillLines = (row, excludeFine = false) => {
    const source = Array.isArray(row?.bill_lines) && row.bill_lines.length
        ? row.bill_lines
        : (Array.isArray(row?.slot_breakdown) && row.slot_breakdown.length
            ? row.slot_breakdown.map((line, index) => ({
                key: line.slot_id || `slot-${index}`,
                label: line.label || `Slot ${line.slot_number}`,
                amount: line.outstanding,
            }))
            : []);
    return excludeFine
        ? source.filter((line) => !line.isFine && line.key !== 'fine' && !String(line.key || '').startsWith('fine-'))
        : source;
};

const lineKeyOf = (line, index) => String(line?.key || `${line?.label || 'line'}-${index}`);

const selectedPayPlan = (row, selectedKeys, excludeFine = false) => {
    const keys = selectedKeys instanceof Set ? selectedKeys : new Set(selectedKeys || []);
    const lines = getBillLines(row, false);
    const selectedLines = lines.filter((line, index) => {
        if (excludeFine && (line.isFine || line.key === 'fine' || String(line.key || '').startsWith('fine-'))) {
            return false;
        }
        return keys.has(lineKeyOf(line, index));
    });
    const amount = Number(selectedLines.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2));
    const flags = {};
    lines.forEach((line, index) => {
        const receivableId = String(line.receivable_id || (!line.isFine ? line.key : '') || '');
        if (!receivableId) return;
        if (!flags[receivableId]) flags[receivableId] = { principal: false, fine: false, hasFine: false };
        const on = keys.has(lineKeyOf(line, index));
        if (line.isFine || String(line.key || '').startsWith('fine-')) {
            flags[receivableId].hasFine = true;
            if (on) flags[receivableId].fine = true;
        } else if (on) {
            flags[receivableId].principal = true;
        }
    });
    const receivableIds = [];
    const excludeFineIds = [];
    Object.entries(flags).forEach(([id, flag]) => {
        if (!flag.principal) return;
        receivableIds.push(id);
        if (flag.hasFine && !flag.fine) excludeFineIds.push(id);
    });
    return {
        amount,
        receivableIds,
        excludeFineIds,
        selectedLines,
        excludeFine: Boolean(excludeFine) || (excludeFineIds.length > 0 && excludeFineIds.length === receivableIds.length),
    };
};

const BillLinesTable = ({
    row,
    excludeFine = false,
    className = '',
    selectable = false,
    selectedKeys,
    onToggle,
}) => {
    const keys = selectedKeys instanceof Set ? selectedKeys : new Set(selectedKeys || []);
    const lines = getBillLines(row, selectable ? false : excludeFine);
    if (!lines.length) return null;
    const visible = selectable
        ? lines
        : lines.filter((line, index) => !keys.size || keys.has(lineKeyOf(line, index)));
    const total = selectable
        ? selectedPayPlan(row, keys).amount
        : Number(visible.reduce((sum, line) => sum + Number(line.amount || 0), 0).toFixed(2));
    const rowClass = selectable
        ? 'grid grid-cols-[auto_1fr_auto_7.5rem] items-center gap-x-2 px-4 py-1.5 text-sm'
        : 'grid grid-cols-[1fr_auto_7.5rem] items-baseline gap-x-2 px-4 py-1.5 text-sm';
    return (
        <div className={`rounded-lg border border-gray-200 overflow-hidden ${className}`}>
            <div className={`${rowClass} bg-red-500 text-white font-semibold uppercase tracking-wide text-[11px]`}>
                {selectable ? <span /> : null}
                <span>Slots</span>
                <span />
                <span className="text-right">Amount</span>
            </div>
            {visible.map((line, index) => {
                const key = lineKeyOf(line, index);
                const checked = !selectable || keys.has(key);
                return (
                    <div
                        key={key}
                        className={`${rowClass} text-gray-800 ${index ? 'border-t border-gray-100' : ''} ${selectable && !checked ? 'opacity-50' : ''}`}
                    >
                        {selectable ? (
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                checked={checked}
                                onChange={() => onToggle?.(key, line)}
                            />
                        ) : null}
                        <span>{line.label}</span>
                        <span className="text-gray-400">-</span>
                        <span className="text-right tabular-nums font-medium text-gray-900">{money(line.amount)}</span>
                    </div>
                );
            })}
            <div className={`${rowClass} font-semibold text-gray-900 border-t border-gray-200 bg-gray-50`}>
                {selectable ? <span /> : null}
                <span>Total</span>
                <span>:</span>
                <span className="text-right tabular-nums">{money(total)}</span>
            </div>
        </div>
    );
};

const rowStatus = (row) => {
    if (String(row.due_status || '').toUpperCase() === 'ROLLED') {
        return { label: 'Rolled', className: 'bg-gray-100 text-gray-600' };
    }
    if (row.is_paid) return { label: 'Paid', className: 'bg-emerald-50 text-emerald-700' };
    const outstanding = Number(row.closing_balance || 0);
    const paid = Number(row.paid_amount || 0);
    if (paid > 0 && outstanding > 0) return { label: 'Partial', className: 'bg-amber-50 text-amber-700' };
    if (row.list_overdue || (dueDay(row) && dueDay(row) < today())) return { label: 'Overdue', className: 'bg-red-50 text-red-700' };
    return { label: 'Unpaid', className: 'bg-gray-100 text-gray-600' };
};

const DeepavaliCollectionsPage = () => {
    const { user } = useUserContext();
    const {
        groups,
        receivables,
        paymentMethods,
        company,
        payReceivable,
        loading,
    } = useDeepavali();

    const allRows = useMemo(() => {
        const combined = combineUnpaidReceivables(receivables || []);
        const byId = {};
        (groups || []).forEach((group) => {
            if (group?.id) byId[String(group.id)] = group;
        });
        return combined.map((row) => {
            const group = byId[String(row.group_id || row.group?.id || '')] || row.group;
            return {
                ...row,
                period_label: formatDeepavaliPeriodLabel(group, dueDay(row)),
            };
        });
    }, [receivables, groups]);

    const [filters, setFilters] = useState(emptyFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [downloading, setDownloading] = useState(false);
    const [payTarget, setPayTarget] = useState(null);
    const [payStep, setPayStep] = useState('form');
    const [rowPay, setRowPay] = useState({
        payment_method_id: '',
        amount: '',
        payment_date: today(),
        exclude_fine: false,
    });
    const [billResult, setBillResult] = useState(null);
    const [savingPay, setSavingPay] = useState(false);
    const [selectedLineKeys, setSelectedLineKeys] = useState([]);

    const payAmountOf = (row, skipFine) => {
        const full = Number(row.closing_balance || 0);
        const fine = Number(row.fine_amount || 0);
        return skipFine ? Math.max(0, full - fine) : full;
    };

    const selectedAccount = paymentMethods.find((acc) => acc.id === rowPay.payment_method_id);
    const payPlan = useMemo(
        () => (payTarget ? selectedPayPlan(payTarget, selectedLineKeys) : { amount: 0, receivableIds: [], excludeFineIds: [], selectedLines: [], excludeFine: false }),
        [payTarget, selectedLineKeys]
    );

    const applyLineSelection = (nextKeys, target = payTarget) => {
        const unique = [...new Set(nextKeys.filter(Boolean))];
        setSelectedLineKeys(unique);
        if (!target) return;
        const plan = selectedPayPlan(target, unique);
        setRowPay((p) => ({
            ...p,
            exclude_fine: plan.excludeFine,
            amount: String(plan.amount),
        }));
    };

    const togglePayLine = (key, line) => {
        if (!payTarget) return;
        const lines = getBillLines(payTarget, false);
        const selected = new Set(selectedLineKeys);
        const isOn = selected.has(key);
        if (isOn) selected.delete(key);
        else selected.add(key);
        const receivableId = String(line?.receivable_id || (!line?.isFine ? line?.key : '') || '');
        if (receivableId) {
            const principal = lines.find((item) => !item.isFine && String(item.receivable_id || item.key) === receivableId);
            const fine = lines.find((item) => item.isFine && String(item.receivable_id) === receivableId);
            if (line?.isFine && !isOn && principal) selected.add(lineKeyOf(principal, lines.indexOf(principal)));
            if (!line?.isFine && isOn && fine) selected.delete(lineKeyOf(fine, lines.indexOf(fine)));
        }
        applyLineSelection([...selected], payTarget);
    };

    const openPay = (row) => {
        if (!paymentMethods.length) {
            toast.error('Add a ledger account first, then pay from here.');
            return;
        }
        const billed = withPayBill(row);
        const lines = getBillLines(billed, false);
        const keys = lines.map((line, index) => lineKeyOf(line, index));
        setPayTarget(billed);
        setPayStep('form');
        setBillResult(null);
        setSelectedLineKeys(keys);
        setRowPay({
            payment_method_id: paymentMethods[0]?.id || '',
            amount: String(selectedPayPlan(billed, keys).amount || payAmountOf(billed, false)),
            payment_date: today(),
            exclude_fine: false,
        });
    };

    const closePay = () => {
        if (savingPay) return;
        setPayTarget(null);
        setPayStep('form');
        setBillResult(null);
        setSelectedLineKeys([]);
    };

    const goReview = () => {
        if (!rowPay.payment_method_id) {
            toast.error('Select a ledger account');
            return;
        }
        if (!rowPay.amount || Number(rowPay.amount) <= 0) {
            toast.error('Select at least one slot to pay');
            return;
        }
        if (!payPlan.receivableIds.length) {
            toast.error('Select at least one slot to pay');
            return;
        }
        if (Number(rowPay.amount) > Number(payPlan.amount) + 0.001) {
            toast.error('Amount cannot be more than the selected slots');
            return;
        }
        setPayStep('review');
    };

    const confirmPay = async () => {
        if (!payTarget) return;
        setSavingPay(true);
        try {
            const result = await payReceivable({
                receivable_id: payPlan.receivableIds[0] || payTarget.id,
                receivable_ids: payPlan.receivableIds.length ? payPlan.receivableIds : [payTarget.id],
                payment_method_id: rowPay.payment_method_id,
                amount: Number(rowPay.amount),
                payment_date: rowPay.payment_date,
                exclude_fine: payPlan.excludeFine,
                exclude_fine_ids: payPlan.excludeFineIds,
            });
            setBillResult(result);
            setPayStep('bill');
            toast.success(`${result?.receipt?.bill_label || result?.bill_labels?.[0] || 'Bill'} recorded`);
        } catch (err) {
            toast.error(err.message || 'Payment failed');
        } finally {
            setSavingPay(false);
        }
    };

    const downloadBill = async () => {
        if (!billResult?.receipt || !payTarget) return;
        const receipt = billResult.receipt;
        const blob = await pdf(
            <ReceivableReceitPdf
                companyData={pdfCompany}
                billNumber={receipt.bill_label || receipt.bill_number}
                today={receipt.payment_date || today()}
                receivableData={{
                    subscriberName: payTarget.subscriber?.subscriber_name || '—',
                    paymentType: Number(receipt.paid_amount) < Number(payTarget.closing_balance) ? 'Partial' : 'Full',
                    paymentMethod: selectedAccount?.account_name || receipt.payment_method_name || receipt.payment_method,
                    groupName: payTarget.group?.group_name || '—',
                    auctionDate: dueDay(payTarget),
                    transactedDate: receipt.payment_date,
                    createdAt: receipt.payment_date,
                    paymentAmount: receipt.paid_amount,
                    lineItems: payPlan.selectedLines.length
                        ? payPlan.selectedLines
                        : getBillLines(payTarget, rowPay.exclude_fine),
                    lineTotal: receipt.paid_amount,
                }}
            />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${receipt.bill_label || 'DP-Bill'}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const filteredRows = useMemo(() => {
        const name = String(filters.name || '').trim().toLowerCase();
        const groupName = String(filters.groupName || '').trim().toLowerCase();
        const phone = String(filters.phone || '').trim().toLowerCase();
        const date = String(filters.date || '').trim();
        const period = String(filters.period || '').trim();
        return allRows.filter((row) => {
            if (name && !String(row.subscriber?.subscriber_name || '').toLowerCase().includes(name)) return false;
            if (groupName && !String(row.group?.group_name || '').toLowerCase().includes(groupName)) return false;
            if (phone && !String(row.subscriber?.phone || '').toLowerCase().includes(phone)) return false;
            if (date && dueDay(row) !== date) return false;
            if (period && periodLabelOf(row) !== period) return false;
            return true;
        });
    }, [allRows, filters]);

    const periodOptions = useMemo(
        () => sortPeriodLabels([...new Set(allRows.map((row) => periodLabelOf(row)).filter(Boolean))]),
        [allRows]
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, pageSize]);

    const pagination = useMemo(() => {
        const totalItems = filteredRows.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
        const safePage = Math.min(currentPage, totalPages);
        const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);
        return {
            totalItems,
            totalPages,
            safePage,
            startIndex,
            endIndex,
            pageItems: filteredRows.slice(startIndex, endIndex),
        };
    }, [filteredRows, currentPage, pageSize]);

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

    const pdfHeaders = [
        { title: 'Date', value: 'date' },
        { title: 'Name', value: 'name' },
        { title: 'Phone', value: 'phone' },
        { title: 'Group', value: 'group' },
        { title: 'Period', value: 'period' },
        { title: 'Slot', value: 'slot' },
        { title: 'Total', value: 'total', align: 'right' },
        { title: 'Paid', value: 'paid', align: 'right' },
        { title: 'Outstanding', value: 'outstanding', align: 'right' },
        { title: 'Status', value: 'status' },
    ];

    const downloadPdf = async () => {
        if (!filteredRows.length || downloading) return;
        setDownloading(true);
        try {
            const tableData = filteredRows.map((row) => ({
                date: dueDay(row) || '—',
                name: row.subscriber?.subscriber_name || '—',
                phone: row.subscriber?.phone || '—',
                group: row.group?.group_name || '—',
                period: row.period_label || formatDeepavaliPeriodLabel(row.group, dueDay(row)),
                slot: row.slot_label || formatSlotLabel([row.slot?.slot_number]),
                total: money(Number(row.due_amount || 0) + Number(row.fine_amount || 0) + Number(row.arrears_amount || 0)),
                paid: money(row.paid_amount),
                outstanding: money(row.is_paid ? 0 : row.closing_balance),
                status: rowStatus(row).label,
            }));
            const blob = await pdf(
                <Mypdf
                    tableData={tableData}
                    tableHeaders={pdfHeaders}
                    heading="Receivables"
                    companyData={pdfCompany}
                />
            ).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Deepavali_Receivables_${today()}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            toast.error(err.message || 'Could not download PDF');
        } finally {
            setDownloading(false);
        }
    };

    const fieldClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Receivables</h1>
                        <p className="text-sm text-gray-600 mt-1">All dues for this company. Filter, page, and download.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={downloadPdf}
                            disabled={!filteredRows.length || downloading}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2 disabled:opacity-50"
                        >
                            <FiDownload className="w-4 h-4" />
                            {downloading ? 'Preparing PDF…' : 'Download'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilters(emptyFilters)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
                        >
                            <FiFilter className="w-4 h-4" />
                            Clear filter
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <FiFilter className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Name
                            <input
                                value={filters.name}
                                onChange={(e) => setFilters((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Subscriber name"
                                className={`mt-1 ${fieldClass}`}
                            />
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Group name
                            <input
                                value={filters.groupName}
                                onChange={(e) => setFilters((p) => ({ ...p, groupName: e.target.value }))}
                                placeholder="Group name"
                                className={`mt-1 ${fieldClass}`}
                            />
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Phone
                            <input
                                value={filters.phone}
                                onChange={(e) => setFilters((p) => ({ ...p, phone: e.target.value }))}
                                placeholder="Phone"
                                className={`mt-1 ${fieldClass}`}
                            />
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Date
                            <input
                                type="date"
                                value={filters.date}
                                onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value }))}
                                className={`mt-1 ${fieldClass}`}
                            />
                        </label>
                        <label className="block text-sm font-medium text-gray-700">
                            Period
                            <select
                                value={filters.period}
                                onChange={(e) => setFilters((p) => ({ ...p, period: e.target.value }))}
                                className={`mt-1 ${fieldClass}`}
                            >
                                <option value="">All periods</option>
                                {periodOptions.map((label) => (
                                    <option key={label} value={label}>{label}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Group</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Slot</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Paid</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Outstanding</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {pagination.pageItems.map((row) => {
                                    const status = rowStatus(row);
                                    const total = Number(row.due_amount || 0) + Number(row.fine_amount || 0) + Number(row.arrears_amount || 0);
                                    return (
                                        <tr key={(row.receivable_ids || [row.id]).join('-')} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">{dueDay(row) || '—'}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {row.subscriber?.subscriber_name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{row.subscriber?.phone || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{row.group?.group_name || '—'}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                                                {row.period_label || formatDeepavaliPeriodLabel(row.group, dueDay(row))}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{row.slot_label || formatSlotLabel([row.slot?.slot_number])}</td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-900 whitespace-nowrap">{money(total)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-emerald-700 whitespace-nowrap">{money(row.paid_amount)}</td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-red-600 whitespace-nowrap">{money(row.is_paid ? 0 : row.closing_balance)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>{status.label}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                {!row.is_paid && String(row.due_status || '').toUpperCase() !== 'ROLLED' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openPay(row)}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold"
                                                    >
                                                        Pay
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="md:hidden divide-y divide-gray-100">
                        {pagination.pageItems.map((row) => {
                            const status = rowStatus(row);
                            const total = Number(row.due_amount || 0) + Number(row.fine_amount || 0) + Number(row.arrears_amount || 0);
                            return (
                                <div key={(row.receivable_ids || [row.id]).join('-')} className="px-4 py-4 space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-gray-900">{row.subscriber?.subscriber_name || '—'}</p>
                                            <p className="text-xs text-gray-500">
                                                {row.group?.group_name || '—'}
                                                {' · '}
                                                {row.period_label || formatDeepavaliPeriodLabel(row.group, dueDay(row))}
                                                {(row.slot_label || formatSlotLabel([row.slot?.slot_number])) !== '—' ? ` · ${row.slot_label || formatSlotLabel([row.slot?.slot_number])}` : ''}
                                                {' · '}
                                                {dueDay(row)}
                                            </p>
                                            <p className="text-xs text-gray-500">{row.subscriber?.phone || '—'}</p>
                                        </div>
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>{status.label}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="rounded-lg bg-gray-50 py-2"><p className="text-gray-500">Total</p><p className="font-semibold">{money(total)}</p></div>
                                        <div className="rounded-lg bg-emerald-50 py-2"><p className="text-emerald-700">Paid</p><p className="font-semibold">{money(row.paid_amount)}</p></div>
                                        <div className="rounded-lg bg-red-50 py-2"><p className="text-red-600">Due</p><p className="font-semibold">{money(row.is_paid ? 0 : row.closing_balance)}</p></div>
                                    </div>
                                    {!row.is_paid && String(row.due_status || '').toUpperCase() !== 'ROLLED' && (
                                        <button
                                            type="button"
                                            onClick={() => openPay(row)}
                                            className="w-full mt-1 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2"
                                        >
                                            Pay
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {loading && !allRows.length && (
                        <p className="px-4 py-8 text-sm text-gray-500 text-center">Loading receivables…</p>
                    )}
                    {!loading && !pagination.totalItems && (
                        <p className="px-4 py-8 text-sm text-gray-500 text-center">No receivables match these filters.</p>
                    )}
                </div>

                {pagination.totalItems > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600">
                                <span>
                                    Showing <span className="font-semibold text-gray-900">{pagination.startIndex + 1}</span>
                                    {' '}to <span className="font-semibold text-gray-900">{pagination.endIndex}</span>
                                    {' '}of <span className="font-semibold text-gray-900">{pagination.totalItems}</span>
                                </span>
                                <label className="flex items-center gap-2">
                                    Per page
                                    <select
                                        value={pageSize}
                                        onChange={(e) => setPageSize(Number(e.target.value))}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                    >
                                        {PAGE_SIZE_OPTIONS.map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={pagination.safePage <= 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page <span className="font-semibold text-gray-900">{pagination.safePage}</span> of <span className="font-semibold text-gray-900">{pagination.totalPages}</span>
                                </span>
                                <button
                                    type="button"
                                    disabled={pagination.safePage >= pagination.totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {payTarget && (
                <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={closePay}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6" onClick={(e) => e.stopPropagation()}>
                        {payStep === 'bill' && billResult ? (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <div className="w-14 h-14 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <FiCheck className="w-7 h-7 text-emerald-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Payment successful</h3>
                                    <p className="text-sm text-gray-500 mt-1">Bill generated for this collection</p>
                                </div>
                                <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Bill no</span>
                                        <span className="font-semibold text-gray-900">{billResult.receipt?.bill_label || billResult.bill_labels?.[0] || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Subscriber</span>
                                        <span className="font-semibold text-gray-900 text-right">{payTarget.subscriber?.subscriber_name || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Phone</span>
                                        <span className="font-semibold text-gray-900">{payTarget.subscriber?.phone || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Group</span>
                                        <span className="font-semibold text-gray-900 text-right">{payTarget.group?.group_name || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Period</span>
                                        <span className="font-semibold text-gray-900 text-right">
                                            {payTarget.period_label || formatDeepavaliPeriodLabel(payTarget.group, dueDay(payTarget))}
                                        </span>
                                    </div>
                                    <BillLinesTable
                                        row={payTarget}
                                        className="my-1"
                                        selectedKeys={selectedLineKeys}
                                    />
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Amount paid</span>
                                        <span className="font-semibold text-emerald-700">{money(billResult.receipt?.paid_amount || billResult.total)}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Payment account</span>
                                        <span className="font-semibold text-gray-900 text-right">{billResult.ledger_account?.account_name || selectedAccount?.account_name || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Payment date</span>
                                        <span className="font-semibold text-gray-900">{billResult.receipt?.payment_date || rowPay.payment_date}</span>
                                    </div>
                                </div>
                                <button type="button" onClick={downloadBill} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold">
                                    <FiDownload /> Download bill
                                </button>
                                <button type="button" onClick={closePay} className="w-full py-2.5 rounded-lg border border-gray-300 font-medium text-gray-800">
                                    Close
                                </button>
                            </div>
                        ) : payStep === 'review' ? (
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <h3 className="text-lg font-bold text-gray-900">Review payment</h3>
                                    <button type="button" onClick={closePay} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" aria-label="Close"><FiX /></button>
                                </div>
                                <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
                                    <div className="flex justify-between gap-3"><span className="text-gray-500">Subscriber</span><span className="font-semibold text-right">{payTarget.subscriber?.subscriber_name}</span></div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Group</span>
                                        <span className="font-semibold text-right">{payTarget.group?.group_name || '—'}</span>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                        <span className="text-gray-500">Period</span>
                                        <span className="font-semibold text-right">
                                            {payTarget.period_label || formatDeepavaliPeriodLabel(payTarget.group, dueDay(payTarget))}
                                        </span>
                                    </div>
                                    <BillLinesTable
                                        row={payTarget}
                                        className="my-1"
                                        selectedKeys={selectedLineKeys}
                                    />
                                    <div className="flex justify-between gap-3"><span className="text-gray-500">Pay from</span><span className="font-semibold text-right">{selectedAccount?.account_name || '—'}</span></div>
                                    <div className="flex justify-between gap-3"><span className="text-gray-500">Amount</span><span className="font-semibold text-emerald-700">{money(rowPay.amount)}</span></div>
                                    <div className="flex justify-between gap-3"><span className="text-gray-500">Date</span><span className="font-semibold">{rowPay.payment_date}</span></div>
                                </div>
                                <p className="text-xs text-gray-500">Confirm to post this collection to the ledger and generate a bill (DP-0001).</p>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setPayStep('form')} disabled={savingPay} className="flex-1 py-2.5 rounded-lg border border-gray-300 font-medium">Back</button>
                                    <button type="button" onClick={confirmPay} disabled={savingPay} className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold disabled:opacity-50">
                                        {savingPay ? 'Paying…' : 'Confirm payment'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Pay receivable</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {payTarget.subscriber?.subscriber_name}
                                            {' · '}
                                            {payTarget.period_label || formatDeepavaliPeriodLabel(payTarget.group, dueDay(payTarget))}
                                            {' · '}
                                            {payTarget.group?.group_name || 'No group'}
                                        </p>
                                    </div>
                                    <button type="button" onClick={closePay} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" aria-label="Close"><FiX /></button>
                                </div>
                                <BillLinesTable
                                    row={payTarget}
                                    selectable
                                    selectedKeys={selectedLineKeys}
                                    onToggle={togglePayLine}
                                />
                                <p className="text-xs text-gray-500">Tick the slots and fines you can pay now. Unchecked slots stay due.</p>
                                {!paymentMethods.length && (
                                    <p className="text-sm text-amber-700">Add a ledger account on Ledger, then pay from here.</p>
                                )}
                                <label className="block text-sm font-medium text-gray-700">
                                    Ledger account
                                    <select
                                        value={rowPay.payment_method_id}
                                        onChange={(e) => setRowPay((p) => ({ ...p, payment_method_id: e.target.value }))}
                                        className={`mt-1 ${fieldClass}`}
                                    >
                                        <option value="">Select ledger account</option>
                                        {paymentMethods.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.account_name}{acc.current_balance != null ? ` · ${money(acc.current_balance)}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="block text-sm font-medium text-gray-700">
                                    Amount
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={rowPay.amount}
                                        onChange={(e) => setRowPay((p) => ({ ...p, amount: e.target.value }))}
                                        className={`mt-1 ${fieldClass}`}
                                    />
                                </label>
                                <label className="block text-sm font-medium text-gray-700">
                                    Payment date
                                    <input
                                        type="date"
                                        value={rowPay.payment_date}
                                        onChange={(e) => setRowPay((p) => ({ ...p, payment_date: e.target.value }))}
                                        className={`mt-1 ${fieldClass}`}
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={goReview}
                                    disabled={!paymentMethods.length || !payPlan.receivableIds.length}
                                    className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold disabled:opacity-50"
                                >
                                    Review payment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeepavaliCollectionsPage;
