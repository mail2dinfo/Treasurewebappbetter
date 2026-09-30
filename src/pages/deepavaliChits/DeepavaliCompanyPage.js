import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiPhone, FiMapPin, FiMail, FiBriefcase } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';

const emptyForm = {
    company_name: '',
    phone: '',
    email: '',
    address: '',
    gst_details: '',
};

const DeepavaliCompanyPage = ({ embedded = false }) => {
    const { companies, saveCompany, deleteCompany, loading } = useDeepavali();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const openAdd = () => {
        setEditing(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setForm({
            id: row.id,
            company_name: row.company_name || '',
            phone: row.phone || '',
            email: row.email || '',
            address: row.address || '',
            gst_details: row.gst_details || '',
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

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.company_name.trim()) {
            toast.error('Company name is required');
            return;
        }
        setSaving(true);
        try {
            await saveCompany({
                ...form,
                id: editing?.id,
                company_name: form.company_name.trim(),
            });
            toast.success(editing ? 'Company updated' : 'Company added');
            setShowForm(false);
            setEditing(null);
            setForm(emptyForm);
        } catch (err) {
            toast.error(err.message || 'Could not save company');
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        setSaving(true);
        try {
            await deleteCompany(deleteConfirm);
            toast.success('Company deleted');
            setDeleteConfirm(null);
        } catch (err) {
            toast.error(err.message || 'Could not delete company');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={embedded ? '' : 'p-4 sm:p-6 lg:p-8'}>
            <div className={embedded ? '' : 'max-w-7xl mx-auto'}>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {!embedded && (
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Company Management</h1>
                        <p className="text-sm text-gray-600 mt-1">Manage companies for Deepavali Chits</p>
                    </div>
                )}
                <button
                    type="button"
                    onClick={openAdd}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-md hover:shadow-lg justify-center sm:ml-auto"
                >
                    <FiPlus className="w-5 h-5" />
                    Add Company
                </button>
            </div>

            {!companies.length && !loading && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiBriefcase className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Companies Yet</h3>
                    <p className="text-gray-600 mb-6">Get started by creating your first company</p>
                    <button
                        type="button"
                        onClick={openAdd}
                        className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                    >
                        <FiPlus className="w-5 h-5" />
                        Add Your First Company
                    </button>
                </div>
            )}

            {companies.length > 0 && (
                <>
                    <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company Name</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {companies.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <FiBriefcase className="w-5 h-5 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{row.company_name}</p>
                                                    {row.gst_details && <p className="text-xs text-gray-500 mt-0.5">GST: {row.gst_details}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 space-y-1">
                                                {row.phone && (
                                                    <p className="flex items-center gap-2"><FiPhone className="w-4 h-4" />{row.phone}</p>
                                                )}
                                                {row.email && (
                                                    <p className="flex items-center gap-2"><FiMail className="w-4 h-4" />{row.email}</p>
                                                )}
                                                {!row.phone && !row.email && 'N/A'}
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
                        {companies.map((row) => (
                            <div key={row.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <FiBriefcase className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate">{row.company_name}</h3>
                                            {row.gst_details && <p className="text-xs text-gray-500">GST: {row.gst_details}</p>}
                                        </div>
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
                                    {row.email && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <FiMail className="w-4 h-4 flex-shrink-0" />
                                            <span>{row.email}</span>
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
                </>
            )}

            {showForm && (
                <div className="fixed inset-0 z-[80] bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={closeForm}>
                    <form
                        onSubmit={onSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Company' : 'Add Company'}</h2>
                            <button type="button" className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1" onClick={closeForm} aria-label="Close">
                                ×
                            </button>
                        </div>
                        {[
                            ['company_name', 'Company name', 'text'],
                            ['phone', 'Phone', 'tel'],
                            ['email', 'Email', 'email'],
                            ['gst_details', 'GST', 'text'],
                        ].map(([name, label, type]) => (
                            <label key={name} className="block text-sm font-medium text-gray-700">
                                {label}
                                <input
                                    name={name}
                                    type={type}
                                    value={form[name] || ''}
                                    onChange={onChange}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    autoFocus={name === 'company_name'}
                                    required={name === 'company_name'}
                                />
                            </label>
                        ))}
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
                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={closeForm} disabled={saving} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving || loading} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
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
                        <h3 className="text-lg font-bold text-gray-900 text-center">Delete Company</h3>
                        <p className="text-sm text-gray-600 text-center mt-2">
                            Are you sure you want to delete <strong>{deleteConfirm.company_name}</strong>? This action cannot be undone.
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

export default DeepavaliCompanyPage;
