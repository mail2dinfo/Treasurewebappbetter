import React, { useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import Menu from '../components/Menu';
import AddAob from '../components/AddAob';
import Subscribers from '../components/Subscribers';
import Company from '../components/Company';
import UsersPage from './UsersPage';
import ManageGroups from '../components/ManageGroups';
import PersonalSettings from '../components/PersonalSettings';
import PlatformEmployeesPage from '../pages/PlatformEmployeesPage';

const SECTION_META = {
    personalsettings: {
        title: 'Personal Settings',
        subtitle: 'Update your profile and preferences',
    },
    users: {
        title: 'Users',
        subtitle: 'Manage user accounts',
    },
    areaofbusiness: {
        title: 'Area of Business',
        subtitle: 'Create and manage collection areas for your chit fund',
    },
    // legacy key from older Menu click mapping
    'areaof business': {
        title: 'Area of Business',
        subtitle: 'Create and manage collection areas for your chit fund',
    },
    employees: {
        title: 'Employees',
        subtitle: 'Add managers, collectors and accountants for Chit Fund',
    },
    subscribers: {
        title: 'Subscribers',
        subtitle: 'Manage chit fund subscribers',
    },
    company: {
        title: 'Company',
        subtitle: 'Company details',
    },
    managegroups: {
        title: 'Manage Groups',
        subtitle: 'Administer chit groups',
    },
};

function AdminSettings() {
    const [selectedMenu, setSelectedMenu] = useState('areaofbusiness');
    const isEmployeesMenu = selectedMenu === 'employees';
    const meta = SECTION_META[selectedMenu] || {
        title: 'Admin Settings',
        subtitle: 'Manage your Chit Fund administration',
    };

    const renderComponent = () => {
        switch (selectedMenu) {
            case 'personalsettings':
                return <PersonalSettings />;
            case 'users':
                return <UsersPage />;
            case 'employees':
                return (
                    <PlatformEmployeesPage
                        appScope="CHIT_FUND"
                        embedded
                        pageTitle="Chit Fund Employees"
                        backPath="/chit-fund/user/adminsettings"
                    />
                );
            case 'areaofbusiness':
            case 'areaof business':
                return <AddAob />;
            case 'subscribers':
                return <Subscribers />;
            case 'company':
                return <Company />;
            case 'managegroups':
                return <ManageGroups />;
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
                                Chit Fund administration — areas, employees and groups
                            </p>
                        </div>
                    </div>
                </header>

                <div className={`grid grid-cols-1 gap-4 lg:gap-5 ${isEmployeesMenu ? 'lg:grid-cols-[16rem_minmax(0,1fr)]' : 'lg:grid-cols-[16rem_minmax(0,48rem)]'}`}>
                    <aside className="lg:sticky lg:top-20 self-start">
                        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                            <Menu onSelect={setSelectedMenu} selectedMenu={selectedMenu} />
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
}

export default AdminSettings;
