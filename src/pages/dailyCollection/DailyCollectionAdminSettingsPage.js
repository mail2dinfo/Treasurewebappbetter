import React, { useState } from 'react';
import { FiSettings, FiMapPin, FiUsers, FiTag } from 'react-icons/fi';
import PlatformEmployeesPage from '../PlatformEmployeesPage';
import DailyCollectionAobPage from './DailyCollectionAobPage';
import DailyCollectionLedgerCategoriesPage from './DailyCollectionLedgerCategoriesPage';
import { DC_BASE_PATH } from '../../components/dailyCollection/dailyCollectionMenuItems';

const MENU_ITEMS = [
    {
        id: 'areaofbusiness',
        label: 'Area of Business',
        description: 'Manage collection areas',
        icon: FiMapPin,
    },
    {
        id: 'employees',
        label: 'Employees',
        description: 'Add staff and permissions',
        icon: FiUsers,
    },
    {
        id: 'ledgercategories',
        label: 'Categories',
        description: 'Ledger entry categories',
        icon: FiTag,
    },
];

const SECTION_META = {
    areaofbusiness: {
        title: 'Area of Business',
        subtitle: 'Create and manage collection areas for Daily Collection',
    },
    employees: {
        title: 'Employees',
        subtitle: 'Add managers, collectors and accountants for Daily Collection',
    },
    ledgercategories: {
        title: 'Ledger Categories',
        subtitle: 'Manage categories used in ledger Add Entry',
    },
};

const DailyCollectionAdminSettingsPage = () => {
    const [selectedMenu, setSelectedMenu] = useState('areaofbusiness');
    const isEmployeesMenu = selectedMenu === 'employees';
    const meta = SECTION_META[selectedMenu] || {
        title: 'Admin Settings',
        subtitle: 'Manage your Daily Collection administration',
    };

    const renderComponent = () => {
        switch (selectedMenu) {
            case 'employees':
                return (
                    <PlatformEmployeesPage
                        appScope="DAILY_COLLECTION"
                        embedded
                        pageTitle="Daily Collection Employees"
                        backPath={`${DC_BASE_PATH}/adminsettings`}
                    />
                );
            case 'areaofbusiness':
                return <DailyCollectionAobPage embedded />;
            case 'ledgercategories':
                return <DailyCollectionLedgerCategoriesPage embedded />;
            default:
                return (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
                        <p className="text-sm font-medium text-[#444]">Select a section from the menu</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#f8f9fa] antialiased">
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
                                Daily Collection administration — areas, employees and categories
                            </p>
                        </div>
                    </div>
                </header>

                <div
                    className={`grid grid-cols-1 gap-4 lg:gap-5 ${
                        isEmployeesMenu ? 'lg:grid-cols-[16rem_minmax(0,1fr)]' : 'lg:grid-cols-[16rem_minmax(0,48rem)]'
                    }`}
                >
                    <aside className="lg:sticky lg:top-20 self-start">
                        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                            <nav aria-label="Admin settings">
                                <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-[#888]">
                                    Settings
                                </p>
                                <ul className="space-y-1.5 list-none p-0 m-0">
                                    {MENU_ITEMS.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = selectedMenu === item.id;
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
                                                            isActive
                                                                ? 'bg-white/15 text-white'
                                                                : 'bg-red-50 text-[#d62828]'
                                                        }`}
                                                    >
                                                        <Icon className="h-4 w-4" />
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span
                                                            className={`block text-sm font-semibold ${
                                                                isActive ? 'text-white' : 'text-[#333]'
                                                            }`}
                                                        >
                                                            {item.label}
                                                        </span>
                                                        <span
                                                            className={`block text-xs mt-0.5 ${
                                                                isActive ? 'text-red-100' : 'text-[#888]'
                                                            }`}
                                                        >
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
                        {!isEmployeesMenu && (
                            <div className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 sm:px-5 py-4 shadow-sm">
                                <h2 className="text-lg font-semibold text-[#333]">{meta.title}</h2>
                                <p className="mt-1 text-sm text-[#888]">{meta.subtitle}</p>
                            </div>
                        )}

                        <div
                            className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${
                                isEmployeesMenu ? 'p-2 sm:p-3 overflow-visible' : 'p-4 sm:p-6'
                            }`}
                        >
                            {renderComponent()}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DailyCollectionAdminSettingsPage;
