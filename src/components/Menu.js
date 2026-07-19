import React from 'react';
import { FiMapPin, FiUsers, FiLayers } from 'react-icons/fi';

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
        id: 'managegroups',
        label: 'Manage Groups',
        description: 'Group administration',
        icon: FiLayers,
    },
];

function Menu({ onSelect, selectedMenu }) {
    return (
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
                                onClick={() => onSelect(item.id)}
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
    );
}

export default Menu;
