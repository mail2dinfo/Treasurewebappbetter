import React, { useState } from 'react';
import {
    FiBarChart2,
    FiGrid,
    FiLogOut,
    FiMenu,
    FiTrendingUp,
    FiUsers,
    FiX,
} from 'react-icons/fi';
import { useHistory, useLocation } from 'react-router-dom';
import { useUserContext } from '../../context/user_context';
import { SUPER_ADMIN_NAV } from '../../utils/superAdminAnalytics';
import MyTreasureBrand from '../MyTreasureBrand';

const navIcons = {
    home: FiGrid,
    users: FiUsers,
    chart: FiBarChart2,
    trending: FiTrendingUp,
};

const SuperAdminShell = ({
    activeId,
    title,
    subtitle,
    actions,
    children,
}) => {
    const history = useHistory();
    const location = useLocation();
    const { logout } = useUserContext();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    const resolvedActiveId = activeId || SUPER_ADMIN_NAV.find((item) => item.path === location.pathname)?.id;

    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    const handleNavigate = (path) => {
        history.push(path);
        setMobileNavOpen(false);
    };

    const NavContent = ({ onNavigate }) => (
        <>
            <div className="border-b border-white/10 px-5 py-6">
                <MyTreasureBrand subtitle="Super Admin" inverse />
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {SUPER_ADMIN_NAV.map((item) => {
                    const Icon = navIcons[item.icon] || FiGrid;
                    const isActive = resolvedActiveId === item.id;

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onNavigate(item.path)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                                isActive
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            {item.name}
                        </button>
                    );
                })}
            </nav>

            <div className="border-t border-white/10 p-3">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
                >
                    <FiLogOut className="h-5 w-5" />
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="lg:flex">
                <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 lg:fixed lg:inset-y-0 lg:flex">
                    <NavContent onNavigate={handleNavigate} />
                </aside>

                {mobileNavOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <button
                            type="button"
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            onClick={() => setMobileNavOpen(false)}
                            aria-label="Close menu"
                        />
                        <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-slate-900 shadow-2xl">
                            <button
                                type="button"
                                onClick={() => setMobileNavOpen(false)}
                                className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                            <NavContent onNavigate={handleNavigate} />
                        </aside>
                    </div>
                )}

                <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-64">
                    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
                        <div className="flex items-start justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
                            <div className="flex min-w-0 items-start gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMobileNavOpen(true)}
                                    className="mt-0.5 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
                                >
                                    <FiMenu className="h-5 w-5" />
                                </button>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                                        Dashboard
                                    </p>
                                    <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
                                        {title}
                                    </h1>
                                    {subtitle && (
                                        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                                    )}
                                </div>
                            </div>
                            {actions && <div className="shrink-0">{actions}</div>}
                        </div>
                    </header>

                    <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminShell;
