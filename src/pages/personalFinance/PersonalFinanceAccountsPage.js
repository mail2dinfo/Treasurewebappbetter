import React, { useCallback, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FaPlus,
    FaTrash,
    FaTimes,
    FaSync,
} from 'react-icons/fa';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';

const ACCOUNT_TYPES = [
    { value: 'CASH', label: 'Cash' },
    { value: 'WALLET', label: 'Wallet' },
    { value: 'BANK', label: 'Bank' },
    { value: 'OTHER', label: 'Other' },
];

const formatMoney = (value) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return '₹0.00';
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const typeBadgeClass = (type) => {
    switch (String(type || '').toUpperCase()) {
        case 'CASH':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'WALLET':
            return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'BANK':
            return 'bg-green-100 text-green-800 border-green-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const PersonalFinanceAccountsPage = () => {
    const { user } = useUserContext();
    const token = user?.results?.token;
    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id
        || user?.results?.userAccounts?.[0]?.membershipId;

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [name, setName] = useState('');
    const [accountType, setAccountType] = useState('CASH');
    const [openingBalance, setOpeningBalance] = useState('0');

    const fetchAccounts = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const qs = membershipId ? `?parent_membership_id=${membershipId}` : '';
            const res = await fetch(`${API_BASE_URL}/pf/accounts${qs}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to load accounts');
            }
            setAccounts(data.results?.accounts || []);
        } catch (error) {
            toast.error(error.message || 'Failed to load accounts');
        } finally {
            setLoading(false);
        }
    }, [token, membershipId]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const openAddModal = () => {
        setName('');
        setAccountType('CASH');
        setOpeningBalance('0');
        setShowAddModal(true);
    };

    const addAccount = async (e) => {
        if (e) e.preventDefault();
        const trimmed = String(name || '').trim();
        if (!trimmed) {
            toast.error('Enter an account name');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/pf/accounts`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: trimmed,
                    account_type: accountType,
                    opening_balance: Number(openingBalance) || 0,
                    membershipId,
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to add account');
            }
            toast.success(data.message || 'Account added');
            setShowAddModal(false);
            setName('');
            setAccountType('CASH');
            setOpeningBalance('0');
            await fetchAccounts();
        } catch (error) {
            toast.error(error.message || 'Failed to add account');
        } finally {
            setSaving(false);
        }
    };

    const removeAccount = async (account) => {
        if (!window.confirm(`Remove "${account.name}" from your list?`)) return;
        setSaving(true);
        try {
            const qs = membershipId ? `?parent_membership_id=${membershipId}` : '';
            const res = await fetch(`${API_BASE_URL}/pf/accounts/${account.id}${qs}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to remove account');
            }
            toast.success(data.message || 'Account removed');
            await fetchAccounts();
        } catch (error) {
            toast.error(error.message || 'Failed to remove account');
        } finally {
            setSaving(false);
        }
    };

    const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.current_balance) || 0), 0);
    const bankCount = accounts.filter((a) => a.account_type === 'BANK').length;
    const cashCount = accounts.filter((a) => a.account_type === 'CASH').length;

    return (
        <div>
            <div className="p-2 md:p-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header card — Products pattern */}
                    <div className="mb-4">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                        Accounts
                                    </h1>
                                    <p className="text-sm text-gray-600">
                                        {accounts.length > 0
                                            ? `${accounts.length} accounts · balance = opening + income − expense`
                                            : 'No accounts yet'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                                        <span className="text-sm font-medium text-red-800">
                                            Total {formatMoney(totalBalance)}
                                        </span>
                                    </div>
                                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                                        <span className="text-sm font-medium text-green-800">
                                            {bankCount} Bank
                                        </span>
                                    </div>
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                                        <span className="text-sm font-medium text-yellow-800">
                                            {cashCount} Cash
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={openAddModal}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                                >
                                    <FaPlus className="w-4 h-4" />
                                    + Add Account
                                </button>
                                <button
                                    type="button"
                                    onClick={fetchAccounts}
                                    disabled={loading || saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                                >
                                    <FaSync className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Accounts table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Account list
                                <span className="ml-2 text-xs font-normal text-gray-500">
                                    ({accounts.length})
                                </span>
                            </h3>
                        </div>

                        {loading ? (
                            <div className="text-center py-10 text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2" />
                                <p className="text-sm font-medium">Loading accounts...</p>
                            </div>
                        ) : accounts.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <p className="text-sm font-medium text-gray-700 mb-3">No accounts yet</p>
                                <button
                                    type="button"
                                    onClick={openAddModal}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-bold rounded-lg hover:from-red-700 hover:to-red-800 shadow-md"
                                >
                                    <FaPlus className="w-4 h-4" />
                                    + Add Account
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-red-600 text-white text-left">
                                            <th className="px-3 py-2 font-medium w-10">#</th>
                                            <th className="px-3 py-2 font-medium">Name</th>
                                            <th className="px-3 py-2 font-medium">Type</th>
                                            <th className="px-3 py-2 font-medium text-right">Opening</th>
                                            <th className="px-3 py-2 font-medium text-right">Balance</th>
                                            <th className="px-3 py-2 font-medium">Source</th>
                                            <th className="px-3 py-2 font-medium text-center w-14">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map((account, index) => (
                                            <tr
                                                key={account.id}
                                                className="border-t border-gray-100 hover:bg-red-50 transition-colors"
                                            >
                                                <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                                                <td className="px-3 py-2 font-semibold text-gray-900">
                                                    {account.name}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${typeBadgeClass(account.account_type)}`}>
                                                        {account.account_type || 'OTHER'}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right text-gray-700 whitespace-nowrap tabular-nums">
                                                    {formatMoney(account.opening_balance)}
                                                </td>
                                                <td className={`px-3 py-2 text-right font-bold whitespace-nowrap tabular-nums ${
                                                    Number(account.current_balance) >= 0 ? 'text-green-700' : 'text-red-700'
                                                }`}>
                                                    {formatMoney(account.current_balance)}
                                                </td>
                                                <td className="px-3 py-2 text-xs text-gray-500">
                                                    {account.is_system ? 'Default' : 'Custom'}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAccount(account)}
                                                        disabled={saving}
                                                        className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                                        title="Remove"
                                                    >
                                                        <FaTrash className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-gray-200 bg-gray-50">
                                            <td colSpan={4} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">
                                                Total balance
                                            </td>
                                            <td className="px-3 py-2 text-right text-sm font-bold text-gray-900 tabular-nums whitespace-nowrap">
                                                {formatMoney(totalBalance)}
                                            </td>
                                            <td colSpan={2} />
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Account modal — Products pattern */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Add Account</h2>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2"
                                >
                                    <FaTimes className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <form onSubmit={addAccount} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Account name *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Indian Bank, Paytm"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    autoFocus
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Type
                                </label>
                                <select
                                    value={accountType}
                                    onChange={(e) => setAccountType(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                    {ACCOUNT_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Opening balance
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={openingBalance}
                                    onChange={(e) => setOpeningBalance(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 font-medium shadow-md disabled:opacity-50"
                                >
                                    {saving ? 'Saving…' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default PersonalFinanceAccountsPage;
