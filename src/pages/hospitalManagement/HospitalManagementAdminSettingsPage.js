import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiSettings, FiUsers, FiUser, FiActivity, FiBookOpen, FiClipboard, FiExternalLink } from 'react-icons/fi';
import PersonalSettings from '../../components/PersonalSettings';
import PlatformEmployeesPage from '../PlatformEmployeesPage';
import { useHhPermission } from '../../components/hospitalManagement/useHhPermission';
import { HH_NAV_ANY } from '../../utils/hhPermissionCatalog';
import { useHhBasePath } from '../../components/hospitalManagement/hospitalManagementMenuItems';
import { useHospitalManagement } from '../../context/hospitalManagement/HospitalManagementContext';
import { HospitalProfileForm } from './HospitalManagementHospitalPage';
import HhSpecializationMaster from '../../components/hospitalManagement/HhSpecializationMaster';

const ALL_MENU_ITEMS = [
  {
    id: 'hospital',
    label: 'Hospital setup',
    description: 'Profile, contact & registration',
    icon: FiActivity,
    featureKeys: HH_NAV_ANY.hospital,
  },
  {
    id: 'specializations',
    label: 'Specialization master',
    description: 'Doctor specialties for dropdowns',
    icon: FiClipboard,
    featureKeys: HH_NAV_ANY.doctors,
  },
  {
    id: 'ledger-categories',
    label: 'Ledger categories',
    description: 'Categories for credit / debit entries',
    icon: FiBookOpen,
    featureKeys: HH_NAV_ANY.ledger,
  },
  {
    id: 'employees',
    label: 'Employees',
    description: 'Add Manager / clinical staff / Kitchen Staff + responsibilities',
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

const LedgerCategoriesPanel = () => {
  const { ledgerCategories, fetchLedgerCategories, createLedgerCategory, deleteLedgerCategory } = useHospitalManagement();
  const [categoryName, setCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLedgerCategories();
  }, [fetchLedgerCategories]);

  const onAdd = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return toast.error('Category name required');
    setSaving(true);
    const result = await createLedgerCategory({ name: categoryName.trim() });
    setSaving(false);
    if (result.success) {
      toast.success('Category added');
      setCategoryName('');
    } else toast.error(result.error || 'Failed');
  };

  const onDelete = async (item) => {
    if (!window.confirm(`Delete category "${item.name || item.category_name || item.categoryName}"?`)) return;
    const result = await deleteLedgerCategory(item.id);
    if (result.success) toast.success('Category deleted');
    else toast.error(result.error || 'Failed');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Ledger categories</h2>
      <form onSubmit={onAdd} className="flex flex-col sm:flex-row gap-2">
        <input className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Category name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
        <button type="submit" disabled={saving} className="bg-cyan-700 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-cyan-800 disabled:opacity-60">Add</button>
      </form>
      <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
        {(ledgerCategories || []).map((item) => (
          <li key={item.id} className="px-4 py-3 flex justify-between items-center text-sm">
            <span>{item.name || item.category_name || item.categoryName}</span>
            {!item.is_system && (
              <button type="button" onClick={() => onDelete(item)} className="text-xs text-red-700">Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

const HospitalManagementAdminSettingsPage = () => {
  const { enforceAccess, roleCode, can, canAny } = useHhPermission();
  const basePath = useHhBasePath();
  const managerMode = Boolean(enforceAccess && roleCode === 'MANAGER');

  const menuItems = useMemo(
    () => ALL_MENU_ITEMS.filter((item) => {
      if (!item.featureKeys) return true;
      return canAny(item.featureKeys);
    }),
    [canAny]
  );

  const [selectedMenu, setSelectedMenu] = useState(() => menuItems[0]?.id || 'employees');
  const activeMenu = menuItems.some((m) => m.id === selectedMenu) ? selectedMenu : (menuItems[0]?.id || 'employees');
  const isWide = activeMenu === 'employees';

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-[#f8f9fa] antialiased">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-7">
        <header className="mb-5 sm:mb-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-sm">
              <FiSettings className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-[#333] tracking-tight">Admin Settings</h1>
              <p className="mt-1 text-sm text-[#888]">Hospital setup, specialization master, ledger categories, employees, and your profile</p>
            </div>
          </div>
        </header>

        <div className={`grid grid-cols-1 gap-4 lg:gap-5 ${isWide ? 'lg:grid-cols-[16rem_minmax(0,1fr)]' : 'lg:grid-cols-[16rem_minmax(0,48rem)]'}`}>
          <aside className="lg:sticky lg:top-28 self-start">
            <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
              <nav aria-label="Admin settings">
                <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-[#888]">Settings</p>
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
                            isActive ? 'bg-cyan-700 text-white shadow-sm' : 'text-[#333] hover:bg-cyan-50 hover:text-cyan-900'
                          }`}
                        >
                          <span className={`mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${isActive ? 'bg-white/15 text-white' : 'bg-cyan-50 text-cyan-800'}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-sm font-semibold ${isActive ? 'text-white' : 'text-[#333]'}`}>{item.label}</span>
                            <span className={`block text-xs mt-0.5 ${isActive ? 'text-cyan-100' : 'text-[#888]'}`}>{item.description}</span>
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
            <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${isWide ? 'p-2 sm:p-3 overflow-visible' : 'p-4 sm:p-6'}`}>
              {activeMenu === 'hospital' && <HospitalProfileForm />}
              {activeMenu === 'specializations' && <HhSpecializationMaster canManage={can('hh_doctor_manage')} embedded />}
              {activeMenu === 'ledger-categories' && <LedgerCategoriesPanel />}
              {activeMenu === 'personalsettings' && <PersonalSettings />}
              {activeMenu === 'employees' && (
                <PlatformEmployeesPage
                  appScope="HOSPITAL_MANAGEMENT"
                  managerMode={managerMode}
                  embedded
                  backPath={`${basePath}/adminsettings`}
                  pageTitle={managerMode ? 'Hospital Employees' : 'Hospital Employees & Access'}
                />
              )}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold uppercase text-gray-500 mb-2">Patient portal</p>
                <p className="text-sm text-gray-600 mb-2">Share this link with patients. They sign in with phone + password (default: first 4 digits of the phone). Inpatients can also see ward/bed and order food.</p>
                <a href="/hospital-management/patient" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-900 font-medium">
                  /hospital-management/patient
                  <FiExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HospitalManagementAdminSettingsPage;
