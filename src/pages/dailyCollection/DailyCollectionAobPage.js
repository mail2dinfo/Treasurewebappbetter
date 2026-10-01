import { useState, useEffect, useCallback } from 'react';
import { FaTrash } from 'react-icons/fa';
import { FiMapPin, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import Loading from '../../components/Loading';

const DailyCollectionAobPage = ({ embedded = false }) => {
    const { user } = useUserContext();
    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id
        || user?.results?.userAccounts?.[0]?.membershipId;
    const token = user?.results?.token;

    const [areas, setAreas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [area, setArea] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchAreas = useCallback(async () => {
        if (!token || !membershipId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/dc/aob?parent_membership_id=${membershipId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to fetch areas');
            setAreas(data.results || []);
        } catch (err) {
            toast.error(err.message || 'Failed to fetch areas');
        } finally {
            setIsLoading(false);
        }
    }, [token, membershipId]);

    useEffect(() => {
        fetchAreas();
    }, [fetchAreas]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!area.trim()) {
            toast.error('Please enter an area name');
            return;
        }
        if (!membershipId) {
            toast.error('Membership context is missing');
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/dc/aob`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ area: area.trim(), membershipId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Unable to add area');
            toast.success(data.message || 'Area added successfully');
            setArea('');
            fetchAreas();
        } catch (err) {
            toast.error(err.message || 'Unable to add area');
        } finally {
            setIsSaving(false);
        }
    };

    const removeItem = async (id) => {
        try {
            const res = await fetch(`${API_BASE_URL}/dc/aob/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to delete area');
            toast.success(data.message || 'Area deleted');
            setAreas((current) => current.filter((item) => item.id !== id));
        } catch (err) {
            toast.error(err.message || 'Failed to delete area');
        }
    };

    return (
        <div className={embedded ? '' : 'max-w-3xl mx-auto px-4 py-5'}>
            {!embedded && (
                <div className="mb-5">
                    <div className="flex items-center gap-2 text-red-600 text-sm font-semibold">
                        <FiMapPin /> Area Management
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mt-1">Areas</h1>
                    <p className="text-sm text-gray-500 mt-1">Add and manage collection areas for Daily Collection.</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 sm:p-5 mb-5">
                <label className="block text-sm font-semibold text-gray-800 mb-2" htmlFor="dc-new-area-input">
                    Add New Area
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        id="dc-new-area-input"
                        type="text"
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                        placeholder="e.g. Coimbatore"
                        value={area}
                        onChange={(event) => setArea(event.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm"
                    >
                        <FiPlus className="w-5 h-5" />
                        {isSaving ? 'Adding…' : 'Add New Area'}
                    </button>
                </div>
            </form>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Existing Areas ({areas.length})</h2>
                </div>
                {isLoading ? (
                    <div className="py-10 flex justify-start px-4">
                        <Loading />
                    </div>
                ) : areas.length ? (
                    <div className="divide-y divide-gray-100">
                        {areas.map((item) => (
                            <article key={item.id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-red-50/40">
                                <p className="font-medium text-gray-800 capitalize">{item.aob}</p>
                                <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                                    aria-label={`Delete ${item.aob}`}
                                    title="Delete area"
                                >
                                    <FaTrash />
                                </button>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="px-4 py-10 text-center text-sm text-gray-500">
                        No areas yet. Use Add New Area above to create one.
                    </div>
                )}
            </div>
        </div>
    );
};

export default DailyCollectionAobPage;
