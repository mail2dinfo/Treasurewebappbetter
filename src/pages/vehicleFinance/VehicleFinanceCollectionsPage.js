import React, { useState, useEffect, useCallback } from 'react';
import { useUserContext } from '../../context/user_context';
import { useOptionalVehicleFinanceCollector } from '../../context/vehicleFinance/VehicleFinanceCollectorProvider';
import { API_BASE_URL } from '../../utils/apiConfig';
import { FiMapPin, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import { useVfPermission } from '../../components/vehicleFinance/useVfPermission';

const VehicleFinanceCollectionsPage = () => {
    const vfCollector = useOptionalVehicleFinanceCollector();
    const { user: mainUser } = useUserContext();
    const { canAccess } = useVfPermission();
    const canCollect = canAccess('vf_collections_collect')
        || canAccess('vf_collections')
        || Boolean(vfCollector?.isAuthenticated);
    const user = vfCollector?.isAuthenticated ? vfCollector.user : mainUser;
    const token = vfCollector?.token || mainUser?.results?.token;
    const collectorUserId = vfCollector?.isAuthenticated ? vfCollector.user?.userId : null;
    const [receivables, setReceivables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ status: 'all', subscriberName: '' });
    const [selected, setSelected] = useState(null);
    const [payment, setPayment] = useState({ amount: '', paymentMethod: 'Cash', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
    const [accounts, setAccounts] = useState([]);

    const membershipId =
        vfCollector?.parentMembershipId ||
        user?.userAccounts?.[0]?.parent_membership_id ||
        user?.results?.userAccounts?.[0]?.parent_membership_id;

    const fetchReceivables = useCallback(async () => {
        if (!token || !membershipId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ parent_membership_id: membershipId, status: filters.status });
            if (filters.subscriberName) params.set('subscriber_name', filters.subscriberName);
            if (collectorUserId != null) params.set('collector_user_id', collectorUserId);
            const res = await fetch(`${API_BASE_URL}/vf/receivables?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setReceivables(data.results || []);
        } finally {
            setLoading(false);
        }
    }, [token, membershipId, collectorUserId, filters]);

    useEffect(() => { fetchReceivables(); }, [fetchReceivables]);

    useEffect(() => {
        if (!membershipId || !token) return;
        fetch(`${API_BASE_URL}/vf/ledger/accounts?parent_membership_id=${membershipId}`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(r => r.json()).then(d => setAccounts(d.results || []));
    }, [membershipId, token]);

    const openMap = (sub) => {
        if (sub?.latitude && sub?.longitude) {
            window.open(`https://www.google.com/maps?q=${sub.latitude},${sub.longitude}`, '_blank');
        }
    };

    const submitPayment = async () => {
        if (!selected) return;
        const res = await fetch(`${API_BASE_URL}/vf/collections/pay`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                receivableId: selected.id,
                amount: parseFloat(payment.amount),
                paymentMethod: payment.paymentMethod,
                paymentDate: payment.paymentDate,
                notes: payment.notes,
                membershipId,
            }),
        });
        const data = await res.json();
        if (res.ok) {
            setSelected(null);
            setPayment({ amount: '', paymentMethod: 'Cash', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
            fetchReceivables();
        } else {
            alert(data.message || 'Payment failed');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
                <button onClick={fetchReceivables} className="flex items-center gap-2 px-4 py-2 border rounded-lg"><FiRefreshCw /> Refresh</button>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
                <select className="border rounded-lg px-3 py-2" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
                    <option value="all">Today + Overdue</option>
                    <option value="today">Today</option>
                    <option value="overdue">Overdue</option>
                    <option value="future">Future</option>
                </select>
                <input className="border rounded-lg px-3 py-2 flex-1 min-w-[200px]" placeholder="Subscriber name" value={filters.subscriberName} onChange={e => setFilters(f => ({ ...f, subscriberName: e.target.value }))} />
            </div>

            {loading ? <p className="text-gray-500">Loading...</p> : (
                <div className="grid gap-3">
                    {receivables.map(r => {
                        const sub = r.subscriber || r.loan?.subscriber;
                        return (
                            <div key={r.id} className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <p className="font-semibold">{sub?.vf_cust_name || sub?.name || 'Subscriber'}</p>
                                    <p className="text-sm text-gray-500">{sub?.vf_cust_phone} · Due {r.due_date}</p>
                                    <p className="text-lg font-bold text-red-600">₹{parseFloat(r.due_amount).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="flex gap-2">
                                    {sub?.latitude && (
                                        <button onClick={() => openMap(sub)} className="p-2 border rounded-lg" title="Map"><FiMapPin /></button>
                                    )}
                                    {canCollect && (
                                        <button onClick={() => { setSelected(r); setPayment(p => ({ ...p, amount: r.due_amount })); }} className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-1"><FiDollarSign /> Collect</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {!receivables.length && <p className="text-center text-gray-500 py-12">No receivables found</p>}
                </div>
            )}

            {selected && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
                        <h3 className="text-lg font-bold">Collect Payment</h3>
                        <input type="number" className="w-full border rounded-lg px-3 py-2" value={payment.amount} onChange={e => setPayment(p => ({ ...p, amount: e.target.value }))} />
                        <select className="w-full border rounded-lg px-3 py-2" value={payment.paymentMethod} onChange={e => setPayment(p => ({ ...p, paymentMethod: e.target.value }))}>
                            {accounts.map(a => <option key={a.id} value={a.account_name}>{a.account_name}</option>)}
                            {!accounts.length && <option value="Cash">Cash</option>}
                        </select>
                        <input type="date" className="w-full border rounded-lg px-3 py-2" value={payment.paymentDate} onChange={e => setPayment(p => ({ ...p, paymentDate: e.target.value }))} />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setSelected(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
                            <button onClick={submitPayment} className="px-4 py-2 bg-green-600 text-white rounded-lg">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleFinanceCollectionsPage;
