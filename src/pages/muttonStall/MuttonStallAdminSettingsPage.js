import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiSettings, FiUsers, FiUser, FiPackage, FiShoppingBag, FiBookOpen, FiPlus, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import PersonalSettings from '../../components/PersonalSettings';
import PlatformEmployeesPage from '../PlatformEmployeesPage';
import { useMsPermission } from '../../components/muttonStall/useMsPermission';
import { MS_NAV_ANY } from '../../utils/msPermissionCatalog';
import { useMsBasePath } from '../../components/muttonStall/muttonStallMenuItems';
import { useMuttonStall } from '../../context/muttonStall/MuttonStallContext';
import { stallPublicPath } from '../../utils/msStallSlug';

const ALL_MENU_ITEMS = [
  {
    id: 'stall',
    label: 'Stall profile',
    description: 'Name, phone, address, GSTIN',
    icon: FiShoppingBag,
    featureKeys: MS_NAV_ANY.adminSettings,
  },
  {
    id: 'stock-link',
    label: 'Stock',
    description: 'Categories, products & stock movements',
    icon: FiPackage,
    featureKeys: MS_NAV_ANY.stock,
  },
  {
    id: 'ledger-categories',
    label: 'Ledger categories',
    description: 'Categories for credit / debit entries',
    icon: FiBookOpen,
    featureKeys: MS_NAV_ANY.ledger,
  },
  {
    id: 'employees',
    label: 'Employees',
    description: 'Managers, salesmen and access',
    icon: FiUsers,
    featureKeys: null,
  },
  {
    id: 'personalsettings',
    label: 'Personal Settings',
    description: 'Update your profile',
    icon: FiUser,
    featureKeys: null,
  },
];

const StallProfilePanel = () => {
  const { stall, fetchStall, saveStall } = useMuttonStall();
  const [form, setForm] = useState({ name: '', phone: '', address: '', gstin: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStall();
  }, [fetchStall]);

  useEffect(() => {
    if (!stall) return;
    setForm({
      name: stall.name || '',
      phone: stall.phone || '',
      address: stall.address || '',
      gstin: stall.gstin || '',
    });
  }, [stall]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Stall name required');
    setSaving(true);
    const result = await saveStall({
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      gstin: form.gstin.trim() || null,
    });
    setSaving(false);
    if (result.success) toast.success('Stall profile saved');
    else toast.error(result.error || 'Failed');
  };

  return (
    <form onSubmit={onSave} className="space-y-3 max-w-lg">
      <h2 className="text-sm font-semibold text-gray-900">Stall profile</h2>
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="Stall name *"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      {form.name.trim() && (
        <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-900">
          <p className="font-semibold uppercase tracking-wide text-[10px] text-rose-700">Customer link</p>
          <p className="font-mono break-all mt-0.5">
            {`${window.location.origin}${stallPublicPath(form.name)}`}
          </p>
        </div>
      )}
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
      />
      <textarea
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        rows={3}
        placeholder="Address"
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
      />
      <input
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="GSTIN"
        value={form.gstin}
        onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))}
      />
      <button type="submit" disabled={saving} className="bg-rose-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-rose-900 disabled:opacity-60">
        Save stall
      </button>
    </form>
  );
};

const LedgerCategoriesPanel = () => {
  const {
    ledgerCategories,
    fetchLedgerCategories,
    createLedgerCategory,
    deleteLedgerCategory,
  } = useMuttonStall();
  const [categoryName, setCategoryName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchLedgerCategories();
  }, [fetchLedgerCategories]);

  const onAdd = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return toast.error('Category name required');
    setSaving(true);
    const result = await createLedgerCategory({ categoryName: categoryName.trim() });
    setSaving(false);
    if (result.success) {
      toast.success('Category added');
      setCategoryName('');
    } else toast.error(result.error || 'Failed');
  };

  const onDelete = async (item) => {
    if (!window.confirm(`Delete category "${item.category_name}"?`)) return;
    setDeletingId(item.id);
    const result = await deleteLedgerCategory(item.id);
    setDeletingId(null);
    if (result.success) toast.success('Category deleted');
    else toast.error(result.error || 'Failed');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Ledger categories</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            These appear in Create Ledger Entry for Credit and Debit
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchLedgerCategories()}
          className="inline-flex items-center gap-2 self-start px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <form onSubmit={onAdd} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <label htmlFor="ms-new-category" className="block text-sm font-semibold text-gray-800 mb-2">
          + Add new category
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="ms-new-category"
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="e.g. Purchase, Transport, Salary"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 bg-rose-800 hover:bg-rose-900 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold text-sm"
          >
            <FiPlus className="w-4 h-4" />
            {saving ? 'Adding…' : 'Add Category'}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {!(ledgerCategories || []).length ? (
          <p className="text-center text-gray-500 py-10 text-sm">No categories yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 list-none p-0 m-0">
            {(ledgerCategories || []).map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.category_name}</p>
                  {item.is_system && (
                    <p className="text-xs text-gray-500 mt-0.5">Default category</p>
                  )}
                </div>
                {!item.is_system && (
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    disabled={deletingId === item.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg disabled:opacity-50"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    {deletingId === item.id ? 'Deleting…' : 'Delete'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const MuttonStallAdminSettingsPage = () => {
  const { enforceAccess, roleCode, canAny } = useMsPermission();
  const basePath = useMsBasePath();
  const managerMode = Boolean(enforceAccess && roleCode === 'MANAGER');

  const menuItems = useMemo(
    () => ALL_MENU_ITEMS.filter((item) => {
      if (!item.featureKeys) return true;
      return canAny(item.featureKeys);
    }),
    [canAny]
  );

  const [selectedMenu, setSelectedMenu] = useState(() => menuItems[0]?.id || 'employees');

  const activeMenu = menuItems.some((m) => m.id === selectedMenu)
    ? selectedMenu
    : (menuItems[0]?.id || 'employees');

  const isWide = activeMenu === 'employees';

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-[#f8f9fa] antialiased">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-7">
        <header className="mb-5 sm:mb-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-800 text-white shadow-sm">
              <FiSettings className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-[#333] tracking-tight">
                Admin Settings
              </h1>
              <p className="mt-1 text-sm text-[#888]">
                Stall profile, stock, ledger categories, employees, and your profile
              </p>
            </div>
          </div>
        </header>

        <div
          className={`grid grid-cols-1 gap-4 lg:gap-5 ${
            isWide
              ? 'lg:grid-cols-[16rem_minmax(0,1fr)]'
              : 'lg:grid-cols-[16rem_minmax(0,48rem)]'
          }`}
        >
          <aside className="lg:sticky lg:top-28 self-start">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
              <nav aria-label="Admin settings">
                <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-[#888]">
                  Settings
                </p>
                <ul className="space-y-1.5 list-none p-0 m-0">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeMenu === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedMenu(item.id)}
                          className={`w-full text-left flex items-start gap-3 rounded-xl px-3 py-3 transition-colors ${
                            isActive
                              ? 'bg-rose-800 text-white shadow-sm'
                              : 'text-[#333] hover:bg-rose-50 hover:text-rose-900'
                          }`}
                        >
                          <span
                            className={`mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                              isActive ? 'bg-white/15 text-white' : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-sm font-semibold ${isActive ? 'text-white' : 'text-[#333]'}`}>
                              {item.label}
                            </span>
                            <span className={`block text-xs mt-0.5 ${isActive ? 'text-rose-100' : 'text-[#888]'}`}>
                              {item.description}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </aside>

          <section className="min-w-0">
            <div
              className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${
                isWide ? 'p-2 sm:p-3 overflow-visible' : 'p-4 sm:p-6'
              }`}
            >
              {activeMenu === 'stall' && <StallProfilePanel />}
              {activeMenu === 'ledger-categories' && <LedgerCategoriesPanel />}
              {activeMenu === 'stock-link' && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-gray-900">Stock management</h2>
                  <p className="text-sm text-gray-600">
                    Manage categories, products and stock IN/OUT on the Stock page.
                  </p>
                  <Link
                    to={`${basePath}/stock`}
                    className="inline-flex items-center gap-2 bg-rose-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-rose-900"
                  >
                    <FiPackage className="w-4 h-4" />
                    Open Stock
                  </Link>
                </div>
              )}
              {activeMenu === 'personalsettings' && <PersonalSettings />}
              {activeMenu === 'employees' && (
                <PlatformEmployeesPage
                  appScope="MUTTON_STALL"
                  managerMode={managerMode}
                  embedded
                  backPath={`${basePath}/adminsettings`}
                  pageTitle={managerMode ? 'Mutton Stall Employees' : 'Mutton Stall Employees & Access'}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MuttonStallAdminSettingsPage;
