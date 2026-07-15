import React from 'react';

const accentStyles = {
    red: 'from-red-500 to-rose-600 shadow-red-500/20',
    blue: 'from-blue-500 to-indigo-600 shadow-blue-500/20',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    amber: 'from-amber-500 to-orange-600 shadow-amber-500/20',
    slate: 'from-slate-600 to-slate-800 shadow-slate-500/20',
};

export const SuperAdminKpiCard = ({ icon: Icon, label, value, hint, accent = 'red', trend }) => (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${accentStyles[accent]}`}>
                <Icon className="h-5 w-5" />
            </div>
            {trend && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {trend}
                </span>
            )}
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="mt-2 text-xs leading-relaxed text-slate-400">{hint}</p>}
    </div>
);

export const SuperAdminPanel = ({ title, description, actions, children, className = '', flush = false }) => (
    <section className={`flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ${className}`}>
        {(title || actions) && (
            <div className="flex shrink-0 flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                    {title && <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{title}</h2>}
                    {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
                </div>
                {actions && <div className="shrink-0">{actions}</div>}
            </div>
        )}
        <div className={flush ? 'flex-1' : 'flex-1 p-4 sm:p-6'}>{children}</div>
    </section>
);

export default SuperAdminPanel;
