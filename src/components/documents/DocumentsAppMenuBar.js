import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiFolder } from 'react-icons/fi';

const DOCS_BASE_PATH = '/documents-box/user';

const ITEMS = [
    { id: 'box', label: 'Documents Box', path: `${DOCS_BASE_PATH}/box` },
];

const DocumentsAppMenuBar = () => {
    const location = useLocation();
    const current = location.pathname || '';

    return (
        <nav
            className="hidden lg:block bg-white border-b border-gray-200 sticky top-14 z-40 shadow-sm"
            aria-label="Documents modules"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-1 overflow-x-auto py-2">
                    {ITEMS.map((item) => {
                        const active = current === item.path
                            || current === DOCS_BASE_PATH
                            || current === `${DOCS_BASE_PATH}/`;
                        return (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
                                    active
                                        ? 'bg-red-50 text-custom-red border border-red-100'
                                        : 'text-gray-600 border border-transparent hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <FiFolder className="w-4 h-4" />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </nav>
    );
};

export default DocumentsAppMenuBar;
