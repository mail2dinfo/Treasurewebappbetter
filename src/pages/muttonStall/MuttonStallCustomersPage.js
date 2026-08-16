import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { useMuttonStall } from '../../context/muttonStall/MuttonStallContext';
import { useMsPermission } from '../../components/muttonStall/useMsPermission';
import { stallPublicPath } from '../../utils/msStallSlug';

const CUSTOMER_APP_PATH = '/mutton-stall/customer/dashboard';

const MuttonStallCustomersPage = () => {
  const { customers, fetchCustomers, createCustomer, stall, fetchStall, isLoading } = useMuttonStall();
  const { can } = useMsPermission();
  const canManage = can('ms_customers_manage');

  const [form, setForm] = useState({ name: '', phone: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastLoginHint, setLastLoginHint] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchStall();
  }, [fetchCustomers, fetchStall]);

  const stallUrl = stall?.name
    ? `${window.location.origin}${stallPublicPath(stall.name)}`
    : `${window.location.origin}${CUSTOMER_APP_PATH}`;
  const commonAppUrl = stallUrl;

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name required');
    if (!/^\d{10}$/.test(String(form.phone || '').replace(/\D/g, '').slice(-10))) {
      return toast.error('10-digit phone required for customer login');
    }
    setSaving(true);
    const result = await createCustomer({
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (result.success) {
      toast.success('Customer created — they can log in with their phone');
      const data = result.data || {};
      if (data.default_password || data.is_new_user) {
        setLastLoginHint({
          phone: data.login_username || data.phone,
          password: data.default_password || '(existing password unchanged)',
        });
      } else {
        setLastLoginHint({
          phone: data.login_username || data.phone || form.phone.trim(),
          password: '(existing login — password unchanged)',
        });
      }
      setForm({ name: '', phone: '', address: '', notes: '' });
    } else toast.error(result.error || 'Failed');
  };

  const copyCommonUrl = async () => {
    try {
      await navigator.clipboard.writeText(commonAppUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Customer app link copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Customers</h1>
        <p className="text-sm text-gray-500">
          Add customers with phone. They log in once and open the shared Mutton Stall app.
        </p>
      </div>

      <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-800">Stall customer link</p>
          <p className="text-sm text-rose-950 font-mono break-all mt-0.5">{commonAppUrl}</p>
          <p className="text-xs text-rose-700 mt-1">
            From stall profile name · customers open this, then log in to order
          </p>
        </div>
        <button
          type="button"
          onClick={copyCommonUrl}
          className="inline-flex items-center gap-1.5 border border-rose-300 bg-white rounded-lg px-3 py-1.5 text-xs font-medium text-rose-900 hover:bg-rose-50"
        >
          {copied ? <FiCheck className="w-3.5 h-3.5 text-green-600" /> : <FiCopy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>

      {lastLoginHint && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-900">
          <p className="font-semibold">Login for this customer</p>
          <p className="mt-1">Username (phone): <span className="font-mono">{lastLoginHint.phone}</span></p>
          <p>Password: <span className="font-mono">{lastLoginHint.password}</span></p>
          <p className="text-xs text-emerald-700 mt-1">New users get first 4 digits of phone as default password.</p>
        </div>
      )}

      {canManage && (
        <form onSubmit={onCreate} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Add customer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Phone * (login id)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2"
              placeholder="Address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
            <input
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm sm:col-span-2"
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <button type="submit" disabled={saving} className="bg-rose-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-rose-900 disabled:opacity-60">
            Create customer
          </button>
        </form>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Customers {isLoading ? '…' : `(${(customers || []).length})`}
          </h2>
        </div>
        <ul className="divide-y divide-gray-100">
          {(customers || []).map((c) => (
            <li key={c.id} className="px-4 py-3">
              <p className="font-medium text-gray-900">{c.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {c.phone || 'No phone'}
                {c.address ? ` · ${c.address}` : ''}
                {c.subscriber_user_id ? ' · Login ready' : ''}
              </p>
            </li>
          ))}
          {!(customers || []).length && (
            <li className="px-4 py-8 text-center text-sm text-gray-500">No customers yet</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default MuttonStallCustomersPage;
