import React from 'react';
import { useHistory } from 'react-router-dom';
import { Users, UserPlus, ArrowRight, Plus, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const Tile = ({ children, label, onClick }) => (
    <div className="text-center">
        <div
            className="relative w-32 h-32 mx-auto bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl flex flex-col items-center justify-center mb-3 hover:from-red-50 hover:to-red-100 transition-all duration-200 shadow-sm cursor-pointer"
            onClick={onClick}
            onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
            role="button"
            tabIndex={0}
        >
            {children}
        </div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
    </div>
);

const DeepavaliHighlights = ({ dashboard, basePath, collector }) => {
    const history = useHistory();
    const go = (path) => history.push(`${basePath}${path}`);

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg relative">
            <div className="absolute -top-4 left-6 bg-custom-red text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
                Dashboard Highlights
            </div>
            <div className="p-6 pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
                    {!collector && (
                        <Tile label="Groups" onClick={() => go('/groups')}>
                            <div className="flex items-center gap-2 mb-1">
                                <Users size={20} className="text-blue-600" />
                                <span className="text-2xl font-bold text-gray-800">{dashboard?.groups ?? 0}</span>
                            </div>
                            <button
                                type="button"
                                className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    go('/groups');
                                }}
                            >
                                <Plus size={16} />
                            </button>
                        </Tile>
                    )}
                    <Tile label="Subscribers" onClick={() => go('/subscribers')}>
                        <div className="flex items-center gap-2 mb-1">
                            <UserPlus size={20} className="text-purple-600" />
                            <span className="text-2xl font-bold text-gray-800">{dashboard?.subscribers ?? 0}</span>
                        </div>
                        <button
                            type="button"
                            className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg"
                            onClick={(e) => {
                                e.stopPropagation();
                                go('/subscribers');
                            }}
                        >
                            <Plus size={16} />
                        </button>
                    </Tile>
                    {!collector && (
                        <Tile label="Ledger balance" onClick={() => go('/ledger')}>
                            <div className="flex items-center gap-1 mb-1 px-2">
                                <Wallet size={18} className="text-indigo-600 shrink-0" />
                                <span className="text-sm font-bold text-gray-800 leading-tight">{money(dashboard?.total_balance)}</span>
                            </div>
                            <button type="button" className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg">
                                <ArrowRight size={16} />
                            </button>
                        </Tile>
                    )}
                    <Tile label="Outstanding" onClick={() => go('/receivables')}>
                        <div className="flex items-center gap-1 mb-1 px-2">
                            <TrendingDown size={18} className="text-red-600 shrink-0" />
                            <span className="text-sm font-bold text-gray-800 leading-tight">{money(dashboard?.outstanding)}</span>
                        </div>
                        <button type="button" className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg">
                            <ArrowRight size={16} />
                        </button>
                    </Tile>
                    <Tile label="Today collected" onClick={() => go('/receivables')}>
                        <div className="flex items-center gap-1 mb-1 px-2">
                            <TrendingUp size={18} className="text-green-600 shrink-0" />
                            <span className="text-sm font-bold text-gray-800 leading-tight">{money(dashboard?.todays_collection)}</span>
                        </div>
                        <button type="button" className="absolute -bottom-2 -right-2 w-8 h-8 bg-custom-red text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-lg">
                            <ArrowRight size={16} />
                        </button>
                    </Tile>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Financial Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{money(dashboard?.todays_collection)}</div>
                            <div className="text-sm text-gray-600">Today collected</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{money(dashboard?.outstanding)}</div>
                            <div className="text-sm text-gray-600">Outstanding</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">{money(dashboard?.settlement_due ?? dashboard?.prize_due)}</div>
                            <div className="text-sm text-gray-600">Payables due</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {!collector && (
                        <button
                            type="button"
                            className="bg-custom-red text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors shadow-md flex items-center justify-center gap-2"
                            onClick={() => go('/groups')}
                        >
                            <Plus size={16} />
                            Start a Group
                        </button>
                    )}
                    {!collector && (
                        <button
                            type="button"
                            className="bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors shadow-md flex items-center justify-center gap-2"
                            onClick={() => go('/ledger')}
                        >
                            <Wallet size={16} />
                            View Ledger
                        </button>
                    )}
                    <button
                        type="button"
                        className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2"
                        onClick={() => go('/receivables')}
                    >
                        <Users size={16} />
                        Collections
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeepavaliHighlights;
