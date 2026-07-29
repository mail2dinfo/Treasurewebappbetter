import React, { useMemo, useState } from 'react';
import { FiSettings, FiUsers, FiUser, FiMapPin, FiGrid } from 'react-icons/fi';
import PersonalSettings from '../../components/PersonalSettings';
import PlatformEmployeesPage from '../PlatformEmployeesPage';
import HostelManagementHostelsPage from './HostelManagementHostelsPage';
import HostelManagementFloorsRoomsPage from './HostelManagementFloorsRoomsPage';
import { useHmPermission } from '../../components/hostelManagement/useHmPermission';
import { HM_NAV_ANY } from '../../utils/hmPermissionCatalog';

const ALL_MENU_ITEMS = [
  {
    id: 'hostels',
    label: 'Hostels',
    description: 'Hostel details, QR & house rules',
    icon: FiMapPin,
    featureKeys: HM_NAV_ANY.hostels,
  },
  {
    id: 'floors-rooms',
    label: 'Floors & Rooms',
    description: 'Floors, rooms and beds setup',
    icon: FiGrid,
    featureKeys: HM_NAV_ANY.floorsRooms,
  },
  {
    id: 'employees',
    label: 'Employees',
    description: 'Staff and access permissions',
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

const HostelManagementAdminSettingsPage = () => {
  const { enforceAccess, roleCode, canAny } = useHmPermission();
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

  const isWide = activeMenu === 'employees' || activeMenu === 'hostels' || activeMenu === 'floors-rooms';

  return (
    <div className="min-h-[calc(100vh-7rem)] bg-[#f8f9fa] antialiased">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-7">
        <header className="mb-5 sm:mb-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[#d62828] text-white shadow-sm">
              <FiSettings className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-[#333] tracking-tight">
                Admin Settings
              </h1>
              <p className="mt-1 text-sm text-[#888]">
                Setup hostels, floors &amp; rooms, employees, and your profile
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
                              ? 'bg-[#d62828] text-white shadow-sm'
                              : 'text-[#333] hover:bg-red-50 hover:text-[#d62828]'
                          }`}
                        >
                          <span
                            className={`mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                              isActive ? 'bg-white/15 text-white' : 'bg-red-50 text-[#d62828]'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-sm font-semibold ${isActive ? 'text-white' : 'text-[#333]'}`}>
                              {item.label}
                            </span>
                            <span className={`block text-xs mt-0.5 ${isActive ? 'text-red-100' : 'text-[#888]'}`}>
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
              {activeMenu === 'hostels' && <HostelManagementHostelsPage />}
              {activeMenu === 'floors-rooms' && <HostelManagementFloorsRoomsPage />}
              {activeMenu === 'personalsettings' && <PersonalSettings />}
              {activeMenu === 'employees' && (
                <PlatformEmployeesPage
                  appScope="HOSTEL_MANAGEMENT"
                  managerMode={managerMode}
                  embedded
                  backPath="/hostel-management/user/adminsettings"
                  pageTitle={managerMode ? 'Hostel Employees' : 'Hostel Employees & Access'}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HostelManagementAdminSettingsPage;
