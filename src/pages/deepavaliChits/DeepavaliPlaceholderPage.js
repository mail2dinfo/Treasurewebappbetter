import React from 'react';
import { useLocation } from 'react-router-dom';

const TITLES = {
    groups: 'Chit groups',
    subscribers: 'Subscribers',
    collections: 'Collections',
    reports: 'Reports',
};

const DeepavaliPlaceholderPage = () => {
    const location = useLocation();
    const key = String(location.pathname || '').split('/').pop();
    const title = TITLES[key] || 'This module';

    return (
        <div className="max-w-3xl mx-auto px-4 py-10">
            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Coming next. Set up company, employees, and ledger categories first so collections can post to accounts.
                </p>
            </div>
        </div>
    );
};

export default DeepavaliPlaceholderPage;
