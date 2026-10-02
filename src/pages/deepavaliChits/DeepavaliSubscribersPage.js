import React, { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiPhone, FiMapPin, FiUser, FiFilter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const emptyForm = {
    subscriber_name: '',
    phone: '',
    address: '',
    photo: '',
};

const DeepavaliSubscribersPage = () => {
    const { subscribers, saveSubscriber, deleteSubscriber, loading } = useDeepavali();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [nameFilter, setNameFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    const filteredSubscribers = useMemo(() => {
        const name = String(nameFilter || '').trim().toLowerCase();
        if (!name) return subscribers || [];
        return (subscribers || []).filter((row) => String(row.subscriber_name || '').toLowerCase().includes(name));
    }, [subscribers, nameFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [nameFilter, pageSize]);

    const pagination = useMemo(() => {
        const totalItems = filteredSubscribers.length;
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
            pageItems: filteredSubscribers.slice(startIndex, endIndex),
        };
    }, [filteredSubscribers, currentPage, pageSize]);

    const fieldClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';

    const openAdd = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setForm({
            id: row.id,
            subscriber_name: row.subscriber_name || '',
            phone: row.phone || '',
            address: row.address || '',
            photo: row.photo || '',
        });
        setShowForm(true);
    };

    const closeForm = () => {
        if (saving) return;
        setShowForm(false);
        setEditing(null);
        setForm(emptyForm);
    };

    const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const onPhoto = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setForm((prev) => ({ ...prev, photo: reader.result }));
        reader.readAsDataURL(file);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.subscriber_name.trim()) {
            toast.error('Subscriber name is required');
            return;
        }
        setSaving(true);
        try {
            await saveSubscriber({
                ...form,
                id: editing?.id,
                subscriber_name: form.subscriber_name.trim(),
            });
            toast.success(editing ? 'Subscriber updated' : 'Subscriber added');
            setShowForm(false);
            setEditing(null);
            setForm(emptyForm);
        } catch (err) {
            toast.error(err.message || 'Could not save subscriber');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        setSaving(true);
        try {
            await deleteSubscriber(deleteConfirm);
            toast.success('Subscriber deleted');
            setDeleteConfirm(null);
        } catch (err) {
            toast.error(err.message || 'Could not delete subscriber');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Subscribers ({pagination.totalItems})</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage subscribers for Deepavali Chits</p>
                    </div>
                    <button
                        type="button"
                        onClick={openAdd}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg justify-center"
                    >
                        <FiPlus className="w-5 h-5" />
                        Add Subscriber
                    </button>
                </div>

                {subscribers.length > 0 && (
                    <div className="mb-5 bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <FiFilter className="w-5 h-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Name
                                <input
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                    placeholder="Subscriber name"
                                    className={`mt-1 ${fieldClass}`}
                                />
                            </label>
                        </div>
                    </div>
                )}

                {!subscribers.length && !loading && (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FiUser className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Subscribers Yet</h3>
                        <p className="text-gray-600 mb-6">Get started by adding your first subscriber</p>
                        <button
                            type="button"
                            onClick={openAdd}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                        >
                            <FiPlus className="w-5 h-5" />
                            Add Your First Subscriber
                        </button>
                    </div>
                )}

                {subscribers.length > 0 && (
                    <>
                        <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subscriber</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {pagination.pageItems.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                        {row.photo ? (
                                                            <img src={row.photo} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <FiUser className="w-5 h-5 text-red-600" />
                                                        )}
                                                    </div>
                                                    <p className="font-medium text-gray-900">{row.subscriber_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <FiPhone className="w-4 h-4" />
                                                    {row.phone || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                                    <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2">{row.address || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button type="button" onClick={() => openEdit(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                        <FiEdit2 className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" onClick={() => setDeleteConfirm(row)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden space-y-4">
                            {pagination.pageItems.map((row) => (
                                <div key={row.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {row.photo ? (
                                                    <img src={row.photo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FiUser className="w-6 h-6 text-red-600" />
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-gray-900 truncate">{row.subscriber_name}</h3>
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                            <button type="button" onClick={() => openEdit(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <FiEdit2 className="w-4 h-4" />
                                            </button>
                                            <button type="button" onClick={() => setDeleteConfirm(row)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {row.phone && (
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FiPhone className="w-4 h-4 flex-shrink-0" />
                                                <span>{row.phone}</span>
                                            </div>
                                        )}
                                        {row.address && (
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <FiMapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{row.address}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {!loading && !pagination.totalItems && (
                            <p className="bg-white rounded-xl shadow-sm px-4 py-8 text-sm text-gray-500 text-center">
                                No subscribers match this name.
                            </p>
                        )}

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
                    </>
                )}

                {showForm && (
                    <div className="fixed inset-0 z-[80] bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={closeForm}>
                        <form
                            onSubmit={onSubmit}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Subscriber' : 'Add Subscriber'}</h2>
                                <button type="button" className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1" onClick={closeForm} aria-label="Close">
                                    ×
                                </button>
                            </div>
                            <label className="block text-sm font-medium text-gray-700">
                                Name
                                <input
                                    name="subscriber_name"
                                    value={form.subscriber_name}
                                    onChange={onChange}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    autoFocus
                                    required
                                />
                            </label>
                            <label className="block text-sm font-medium text-gray-700">
                                Phone
                                <input
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={onChange}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </label>
                            <label className="block text-sm font-medium text-gray-700">
                                Address
                                <textarea
                                    name="address"
                                    value={form.address}
                                    onChange={onChange}
                                    rows={3}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </label>
                            <label className="block text-sm font-medium text-gray-700">
                                Photo
                                <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="mt-1 block w-full text-sm" />
                            </label>
                            {form.photo && (
                                <img src={form.photo} alt="preview" className="h-20 w-20 object-cover rounded-lg" />
                            )}
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={closeForm} disabled={saving} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving || loading} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50">
                                    {saving ? 'Saving…' : editing ? 'Update' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {deleteConfirm && (
                    <div className="fixed inset-0 z-[80] bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={() => !saving && setDeleteConfirm(null)}>
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiTrash2 className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 text-center">Delete Subscriber</h3>
                            <p className="text-sm text-gray-600 text-center mt-2">
                                Are you sure you want to delete <strong>{deleteConfirm.subscriber_name}</strong>?
                                If they have dues or receipts, history is kept and they are only deactivated.
                            </p>
                            <div className="flex gap-3 mt-5">
                                <button type="button" onClick={() => setDeleteConfirm(null)} disabled={saving} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="button" onClick={confirmDelete} disabled={saving} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50">
                                    {saving ? 'Deleting…' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeepavaliSubscribersPage;
