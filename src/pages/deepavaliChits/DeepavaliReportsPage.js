import React from 'react';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

const DeepavaliReportsPage = () => {
    const { reports, loading } = useDeepavali();
    if (loading && !reports) return <p className="p-6 text-sm text-gray-500">Loading reports…</p>;

    return (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
            <h1 className="text-xl font-semibold text-gray-900">Reports & audit</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    ['Groups', reports?.groups],
                    ['Subscribers', reports?.subscribers],
                    ['Outstanding', money(reports?.outstanding)],
                    ['Settlement due', money(reports?.settlement_due ?? reports?.prize_due)],
                ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-orange-100 bg-white p-4">
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="text-xl font-semibold">{value ?? 0}</p>
                    </div>
                ))}
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white p-4">
                <h2 className="font-medium mb-2">Ledger closing</h2>
                {(reports?.accounts || []).map((acc) => (
                    <p key={acc.id} className="text-sm flex justify-between"><span>{acc.account_name}</span><span>{money(acc.current_balance)}</span></p>
                ))}
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white p-4">
                <h2 className="font-medium mb-2">Audit</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(reports?.audit || []).map((row) => (
                        <p key={row.id} className="text-xs text-gray-600">
                            {row.created_at?.slice(0, 19).replace('T', ' ')} · {row.action} · {row.entity_type}
                        </p>
                    ))}
                    {!reports?.audit?.length && <p className="text-sm text-gray-500">No audit rows yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default DeepavaliReportsPage;
