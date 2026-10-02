import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, useLocation } from 'react-router-dom';
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiUsers,
    FiCalendar,
    FiX,
    FiFolder,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';
import { DP_BASE_PATH, DP_COLLECTOR_PATH } from '../../components/deepavaliChits/deepavaliMenuItems';

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const STATUS_FILTERS = [
    { value: '', label: 'All' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'CLOSED', label: 'Closed' },
];

const emptyForm = {
    group_name: '',
    amount: '',
    mode: 'MONTHLY',
    tenure: '10',
    interest_rate: '3',
    fine_enabled: false,
    fine_value: '',
    start_date: today(),
};

const dueOf = (amount, tenure) => {
    const n = Number(tenure);
    const a = Number(amount);
    if (!n || !a) return 0;
    return Number((a / n).toFixed(2));
};

const payableOf = (amount, rate) => {
    const a = Number(amount || 0);
    const r = Number(rate || 0);
    return Number((a + a * (r / 100)).toFixed(2));
};

const tenureUnit = (mode) => {
    const kind = String(mode || 'MONTHLY').toUpperCase();
    if (kind === 'DAILY') return 'days';
    if (kind === 'WEEKLY') return 'weeks';
    return 'months';
};

const fieldClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

const statusBadge = (status) => {
    const value = String(status || 'DRAFT').toUpperCase();
    if (value === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (value === 'CLOSED') return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-amber-50 text-amber-700 border-amber-100';
};

const DeepavaliGroupsPage = ({ embedded = false }) => {
    const { groups, saveGroup, deleteGroup, loading } = useDeepavali();
    const history = useHistory();
    const location = useLocation();
    const collector = (location.pathname || '').includes('/collector');
    const groupsPath = collector ? `${DP_COLLECTOR_PATH}/groups` : `${DP_BASE_PATH}/groups`;
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [statusFilter, setStatusFilter] = useState('');

    const statusCounts = useMemo(() => {
        const counts = { ALL: 0, ACTIVE: 0, DRAFT: 0, CLOSED: 0 };
        (groups || []).forEach((row) => {
            const status = String(row.status || 'DRAFT').toUpperCase();
            counts.ALL += 1;
            if (counts[status] != null) counts[status] += 1;
        });
        return counts;
    }, [groups]);

    const filteredGroups = useMemo(() => {
        const status = String(statusFilter || '').toUpperCase();
        if (!status) return groups || [];
        return (groups || []).filter((row) => String(row.status || 'DRAFT').toUpperCase() === status);
    }, [groups, statusFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [pageSize, statusFilter]);

    const pagination = useMemo(() => {
        const list = filteredGroups;
        const totalItems = list.length;
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
            pageItems: list.slice(startIndex, endIndex),
        };
    }, [filteredGroups, currentPage, pageSize]);

    const openGroup = (group) => {
        history.push(`${groupsPath}/${group.id}`);
    };

    const openAdd = () => {
        setEditing(null);
        setForm({ ...emptyForm, start_date: today() });
        setShowForm(true);
    };

    const hasSubscribers = (group) => (group.slots || []).some((slot) => slot.subscriber_id);

    const openEdit = (row) => {
        setEditing(row);
        setForm({
            id: row.id,
            group_name: row.group_name || '',
            amount: String(row.amount ?? ''),
            mode: row.mode || 'MONTHLY',
            tenure: String(row.tenure || row.frequency || ''),
            interest_rate: String(row.interest_rate ?? '0'),
            fine_enabled: Boolean(row.fine_enabled),
            fine_value: row.fine_enabled ? String(row.fine_value ?? '') : '',
            start_date: String(row.start_date || '').slice(0, 10) || today(),
        });
        setShowForm(true);
    };

    const closeForm = () => {
        if (saving) return;
        setShowForm(false);
        setEditing(null);
        setForm({ ...emptyForm, start_date: today() });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.group_name.trim()) {
            toast.error('Group name is required');
            return;
        }
        if (form.fine_enabled && !form.fine_value) {
            toast.error('Enter fine value');
            return;
        }
        setSaving(true);
        try {
            await saveGroup({
                id: editing?.id,
                group_name: form.group_name.trim(),
                amount: Number(form.amount),
                mode: form.mode,
                tenure: Number(form.tenure),
                interest_rate: Number(form.interest_rate || 0),
                fine_enabled: form.fine_enabled,
                fine_value: form.fine_enabled ? Number(form.fine_value) : 0,
                start_date: form.start_date,
            });
            toast.success(editing ? 'Group updated' : 'Group added');
            setShowForm(false);
            setEditing(null);
            setForm({ ...emptyForm, start_date: today() });
        } catch (err) {
            toast.error(err.message || 'Could not save group');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        setSaving(true);
        try {
            await deleteGroup(deleteConfirm);
            toast.success('Group deleted');
            setDeleteConfirm(null);
        } catch (err) {
            toast.error(err.message || 'Could not delete group');
        } finally {
            setSaving(false);
        }
    };

    const statusChips = groups.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((option) => {
                const active = statusFilter === option.value;
                const count = option.value ? (statusCounts[option.value] || 0) : statusCounts.ALL;
                return (
                    <button
                        key={option.value || 'all'}
                        type="button"
                        onClick={() => setStatusFilter(active && option.value ? '' : option.value)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors ${
                            active
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-red-200 hover:text-red-700'
                        }`}
                    >
                        {option.label} ({count})
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className={embedded ? '' : 'p-4 sm:p-6 lg:p-8'}>
            <div className={embedded ? '' : 'max-w-6xl mx-auto'}>
                {!embedded && (
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0 space-y-3">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Groups ({statusCounts.ALL})</h1>
                        {statusChips}
                    </div>
                    <button
                        type="button"
                        onClick={openAdd}
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2 shadow-sm sm:ml-auto"
                    >
                        <FiPlus className="w-5 h-5" />
                        Add Group
                    </button>
                </div>
                )}

                {embedded && statusChips && (
                    <div className="mb-4">{statusChips}</div>
                )}

                {loading && !groups.length && (
                    <p className="text-sm text-gray-500 py-10 text-center">Loading groups…</p>
                )}

                {!groups.length && !loading && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 sm:p-12 text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <FiUsers className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No groups yet</h3>
                        <p className={`text-gray-600 max-w-md mx-auto ${embedded ? '' : 'mb-6'}`}>
                            Create a monthly group. Each due is group amount divided by tenure. Payable amount is group amount plus interest.
                        </p>
                        {!embedded && (
                        <button
                            type="button"
                            onClick={openAdd}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold inline-flex items-center gap-2"
                        >
                            <FiPlus className="w-5 h-5" />
                            Add your first group
                        </button>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    {pagination.pageItems.map((group) => {
                        const slots = group.slots || [];
                        const activeSlots = slots.filter((slot) => slot.status !== 'WITHDRAWN');
                        const tenure = group.tenure || group.frequency;
                        return (
                            <article key={group.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 sm:p-5">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                        {(() => {
                                            const groupInfo = (
                                                <>
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <h2 className="text-lg font-bold text-gray-900 truncate">{group.group_name}</h2>
                                                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge(group.status)}`}>
                                                            {group.status || 'DRAFT'}
                                                        </span>
                                                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-[11px] font-semibold">
                                                            {group.mode}
                                                        </span>
                                                        {group.fine_enabled && (
                                                            <span className="inline-flex items-center rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 text-[11px] font-semibold">
                                                                Fine {money(group.fine_value)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Amount</p>
                                                            <p className="font-semibold text-gray-900">{money(group.amount)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Due / month</p>
                                                            <p className="font-semibold text-gray-900">{money(group.emi || dueOf(group.amount, tenure))}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Payable amount</p>
                                                            <p className="font-semibold text-gray-900">{money(group.payable_amount || payableOf(group.amount, group.interest_rate))}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Tenure</p>
                                                            <p className="font-semibold text-gray-900">{tenure} {tenureUnit(group.mode)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Slots</p>
                                                            <p className="font-semibold text-gray-900">{activeSlots.length} active</p>
                                                        </div>
                                                    </div>
                                                    {group.start_date && (
                                                        <p className="mt-2 text-xs text-gray-500 inline-flex items-center gap-1">
                                                            <FiCalendar className="w-3.5 h-3.5" />
                                                            Starts {String(group.start_date).slice(0, 10)}
                                                            {group.end_date ? ` · Ends ${String(group.end_date).slice(0, 10)}` : ''}
                                                        </p>
                                                    )}
                                                </>
                                            );
                                            return embedded ? (
                                                <div className="flex-1 min-w-0">{groupInfo}</div>
                                            ) : (
                                                <button type="button" className="flex-1 min-w-0 text-left" onClick={() => openGroup(group)}>
                                                    {groupInfo}
                                                </button>
                                            );
                                        })()}
                                        <div className="flex flex-wrap items-center gap-2 lg:justify-end shrink-0">
                                            {!embedded && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => openGroup(group)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                                    >
                                                        <FiFolder className="w-4 h-4" />
                                                        Open group
                                                    </button>
                                                    {!hasSubscribers(group) && (
                                                    <button type="button" onClick={() => openEdit(group)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                                        <FiEdit2 className="w-4 h-4" />
                                                    </button>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setDeleteConfirm(group);
                                                }}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Delete"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                    {groups.length > 0 && !loading && !pagination.totalItems && (
                        <p className="bg-white rounded-xl shadow-sm px-4 py-8 text-sm text-gray-500 text-center">
                            No groups match this status.
                        </p>
                    )}
                </div>

                {pagination.totalItems > 0 && (
                    <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
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

                {showForm && (
                    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={closeForm}>
                        <form
                            onSubmit={onSubmit}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit group' : 'Add group'}</h2>
                                <button type="button" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg" onClick={closeForm} aria-label="Close">
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                            <label className="block text-sm font-medium text-gray-700">
                                Group name
                                <input value={form.group_name} onChange={(e) => setForm((p) => ({ ...p, group_name: e.target.value }))} className={fieldClass} autoFocus required />
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Group amount
                                    <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className={fieldClass} required />
                                </label>
                                <label className="block text-sm font-medium text-gray-700">
                                    Mode
                                    <select value={form.mode} onChange={(e) => setForm((p) => ({ ...p, mode: e.target.value }))} className={fieldClass}>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="DAILY">Daily</option>
                                    </select>
                                </label>
                                <label className="block text-sm font-medium text-gray-700">
                                    Tenure ({tenureUnit(form.mode)})
                                    <input type="number" min="1" value={form.tenure} onChange={(e) => setForm((p) => ({ ...p, tenure: e.target.value }))} className={fieldClass} required />
                                </label>
                                <label className="block text-sm font-medium text-gray-700">
                                    Interest rate %
                                    <input type="number" step="0.01" value={form.interest_rate} onChange={(e) => setForm((p) => ({ ...p, interest_rate: e.target.value }))} className={fieldClass} />
                                </label>
                                <label className="block text-sm font-medium text-gray-700">
                                    Due amount
                                    <input type="text" value={money(dueOf(form.amount, form.tenure))} readOnly className={`${fieldClass} bg-gray-50`} />
                                </label>
                                <label className="block text-sm font-medium text-gray-700">
                                    Payable amount
                                    <input type="text" value={money(payableOf(form.amount, form.interest_rate))} readOnly className={`${fieldClass} bg-gray-50`} />
                                </label>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={form.fine_enabled}
                                    onChange={(e) => setForm((p) => ({ ...p, fine_enabled: e.target.checked, fine_value: e.target.checked ? p.fine_value : '' }))}
                                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                Fine enabled
                            </label>
                            {form.fine_enabled && (
                                <label className="block text-sm font-medium text-gray-700">
                                    Fine value
                                    <input type="number" step="0.01" value={form.fine_value} onChange={(e) => setForm((p) => ({ ...p, fine_value: e.target.value }))} className={fieldClass} required />
                                </label>
                            )}
                            <label className="block text-sm font-medium text-gray-700">
                                Group start date
                                <input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} className={fieldClass} required />
                            </label>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={closeForm} disabled={saving} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving || loading} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50">
                                    {saving ? 'Saving…' : editing ? 'Update' : 'Create group'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {deleteConfirm && createPortal(
                    <div
                        className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
                        onClick={() => {
                            if (!saving) setDeleteConfirm(null);
                        }}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiTrash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 text-center">Confirm delete</h3>
                            <p className="text-sm text-gray-600 text-center mt-2">
                                Delete <strong>{deleteConfirm.group_name}</strong>? This removes the group, its dues, receipts, payables and ledger entries, and rolls ledger account balances back.
                            </p>
                            <div className="flex gap-3 mt-5">
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirm(null)}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    disabled={saving}
                                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold disabled:opacity-50"
                                >
                                    {saving ? 'Deleting…' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

export default DeepavaliGroupsPage;
