import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-toastify';
import {
    FiDownload,
    FiEdit2,
    FiEye,
    FiPlus,
    FiSearch,
    FiTrash2,
    FiX,
} from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import Loading from '../../components/Loading';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

const formatSize = (bytes) => {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

const isImageType = (doc) => {
    const mime = String(doc?.mime_type || '').toLowerCase();
    const kind = String(doc?.file_type || '').toUpperCase();
    return mime.startsWith('image/') || ['JPG', 'JPEG', 'PNG'].includes(kind);
};

const DocumentsBoxPage = () => {
    const { user } = useUserContext();
    const token = user?.results?.token;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const authHeaders = useMemo(() => ({
        Authorization: `Bearer ${token}`,
    }), [token]);

    const loadDocs = useCallback(async (search) => {
        if (!token) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('q', search);
            const res = await fetch(`${API_BASE_URL}/dbx/documents${params.toString() ? `?${params}` : ''}`, {
                headers: authHeaders,
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to load documents');
            }
            setItems(Array.isArray(data.results) ? data.results : []);
        } catch (error) {
            toast.error(error.message || 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    }, [token, authHeaders]);

    useEffect(() => {
        loadDocs('');
    }, [loadDocs]);

    const openAdd = () => {
        setEditing(null);
        setTitle('');
        setFile(null);
        setShowForm(true);
    };

    const openEdit = (doc) => {
        setEditing(doc);
        setTitle(doc.title || '');
        setFile(null);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditing(null);
        setTitle('');
        setFile(null);
    };

    const submitForm = async (e) => {
        e.preventDefault();
        const nextTitle = title.trim();
        if (!nextTitle) {
            toast.error('Enter a title');
            return;
        }
        if (!editing && !file) {
            toast.error('Choose a PDF, JPG, JPEG or PNG file');
            return;
        }
        setSaving(true);
        try {
            const body = new FormData();
            body.append('title', nextTitle);
            if (file) body.append('document', file);
            const url = editing
                ? `${API_BASE_URL}/dbx/documents/${editing.id}`
                : `${API_BASE_URL}/dbx/documents`;
            const res = await fetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body,
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to save document');
            }
            toast.success(editing ? 'Document updated' : 'Document saved');
            closeForm();
            await loadDocs();
        } catch (error) {
            toast.error(error.message || 'Failed to save document');
        } finally {
            setSaving(false);
        }
    };

    const removeDoc = async (doc) => {
        if (!doc?.id) return;
        if (!window.confirm(`Delete "${doc.title}"?`)) return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/dbx/documents/${doc.id}`, {
                method: 'DELETE',
                headers: authHeaders,
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to delete');
            }
            toast.success('Document deleted');
            if (preview?.id === doc.id) setPreview(null);
            await loadDocs();
        } catch (error) {
            toast.error(error.message || 'Failed to delete');
        } finally {
            setSaving(false);
        }
    };

    const downloadDoc = async (doc) => {
        try {
            const res = await fetch(`${API_BASE_URL}/dbx/documents/${doc.id}/download`, {
                headers: authHeaders,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to download');
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.file_name || `${doc.title}.file`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            toast.error(error.message || 'Failed to download');
        }
    };

    const visibleItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((doc) => String(doc.title || '').toLowerCase().includes(q));
    }, [items, query]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Documents Box</h1>
                        <p className="text-xs text-gray-500">One title, one file. PDF and images only.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <form onSubmit={(e) => e.preventDefault()} className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by title"
                                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg w-56 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </form>
                        <button
                            type="button"
                            onClick={openAdd}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                        >
                            <FiPlus className="w-4 h-4" />
                            Add Document
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 flex justify-center">
                        <Loading />
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-500">
                        No documents yet. Click Add Document to store a PDF or image.
                    </div>
                ) : visibleItems.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-500">
                        No titles match “{query.trim()}”.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-red-600 text-white text-left">
                                    <th className="px-3 py-2.5 font-medium w-12">No</th>
                                    <th className="px-3 py-2.5 font-medium">Title</th>
                                    <th className="px-3 py-2.5 font-medium">Document</th>
                                    <th className="px-3 py-2.5 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleItems.map((doc, index) => (
                                    <tr key={doc.id} className="border-t border-gray-100 hover:bg-red-50/40">
                                        <td className="px-3 py-3 text-gray-500">{index + 1}</td>
                                        <td className="px-3 py-3 font-medium text-gray-900">{doc.title}</td>
                                        <td className="px-3 py-3 text-gray-700">
                                            {doc.file_type}
                                            <span className="ml-2 text-xs text-gray-400">{formatSize(doc.file_size)}</span>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setPreview(doc)}
                                                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 rounded-md"
                                                >
                                                    <FiEye className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEdit(doc)}
                                                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 rounded-md"
                                                >
                                                    <FiEdit2 className="w-3.5 h-3.5" />
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => downloadDoc(doc)}
                                                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                                                >
                                                    <FiDownload className="w-3.5 h-3.5" />
                                                    Download
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeDoc(doc)}
                                                    disabled={saving}
                                                    className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-md disabled:opacity-50"
                                                >
                                                    <FiTrash2 className="w-3.5 h-3.5" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showForm && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black/60 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editing ? 'Edit Document' : 'Add Document'}
                            </h2>
                            <button type="button" onClick={closeForm} className="p-2 text-gray-400 hover:text-gray-700">
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={submitForm} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={200}
                                    placeholder="House Sale Deed"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Document {editing ? '(optional replace)' : ''}
                                </label>
                                <input
                                    type="file"
                                    accept={ACCEPT}
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-red-50 file:text-red-700 file:font-medium"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Choose PDF / JPG / JPEG / PNG. Max 15 MB.
                                    {editing ? ` Current file: ${editing.file_name}` : ''}
                                </p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {preview && ReactDOM.createPortal(
                <div className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center p-3 sm:p-6">
                    <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                            <div>
                                <h2 className="text-base font-bold text-gray-900">{preview.title}</h2>
                                <p className="text-xs text-gray-500">{preview.file_name} · {preview.file_type}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => downloadDoc(preview)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    <FiDownload className="w-4 h-4" />
                                    Download
                                </button>
                                <button type="button" onClick={() => setPreview(null)} className="p-2 text-gray-400 hover:text-gray-700">
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[60vh] bg-gray-100">
                            {isImageType(preview) ? (
                                <img
                                    src={preview.file_url}
                                    alt={preview.title}
                                    className="w-full h-full object-contain p-4"
                                />
                            ) : (
                                <iframe
                                    title={preview.title}
                                    src={preview.file_url}
                                    className="w-full h-full min-h-[60vh] border-0 bg-white"
                                />
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DocumentsBoxPage;
