import React, { useEffect, useState } from 'react';
import {
    FiSettings,
    FiDollarSign,
    FiTrash2,
    FiAlertTriangle,
    FiX,
    FiRefreshCw,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import { getPlLoanModeLabel } from '../../utils/personalLoanModes';

const MENU_ITEMS = [
    {
        id: 'manage-loans',
        label: 'Manage Loans',
        description: 'View loans and permanently delete',
        icon: FiDollarSign,
    },
];

const formatCurrency = (amount) => {
    const num = Number(amount || 0);
    return `₹${num.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })}`;
};

const formatDate = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return String(value);
    }
};

const PersonalLoanAdminSettingsPage = () => {
    const { loans, fetchLoans, getLoanById, deleteLoan, isLoading } = usePersonalLoanContext();
    const [selectedMenu, setSelectedMenu] = useState('manage-loans');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteCounts, setDeleteCounts] = useState({ receivables: 0, payments: 0 });
    const [isPreparingDelete, setIsPreparingDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    const handleOpenDelete = async (loan) => {
        setIsPreparingDelete(true);
        setDeleteTarget(loan);
        setDeleteCounts({ receivables: 0, payments: 0 });
        try {
            const result = await getLoanById(loan.id);
            if (!result.success || !result.data) {
                toast.error(result.error || 'Failed to load loan details');
                setDeleteTarget(null);
                return;
            }
            const details = result.data;
            const receivables = details.receivables || [];
            const payments = details.receipts || [];
            setDeleteTarget({ ...loan, ...details });
            setDeleteCounts({
                receivables: receivables.length,
                payments: payments.length,
            });
        } catch (err) {
            toast.error(err.message || 'Failed to prepare delete');
            setDeleteTarget(null);
        } finally {
            setIsPreparingDelete(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget?.id) return;
        setIsDeleting(true);
        try {
            const result = await deleteLoan(deleteTarget.id);
            if (!result.success) {
                toast.error(result.error || 'Failed to delete loan');
                return;
            }
            const data = result.data || {};
            toast.success(
                `Loan deleted. Removed ${data.deletedReceivables ?? deleteCounts.receivables} receivables and ${data.deletedPayments ?? deleteCounts.payments} payments.`
            );
            setDeleteTarget(null);
            setDeleteCounts({ receivables: 0, payments: 0 });
        } catch (err) {
            toast.error(err.message || 'Failed to delete loan');
        } finally {
            setIsDeleting(false);
        }
    };

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
                                Manage loans and permanently remove records when needed
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-4 lg:gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
                    <aside className="lg:sticky lg:top-28 self-start">
                        <div className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                            <nav aria-label="Admin settings">
                                <p className="px-3 mb-3 text-[11px] font-bold uppercase tracking-wider text-[#888]">
                                    Manage Menu
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
                        {selectedMenu === 'manage-loans' && (
                            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-200">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">Manage Loans</h2>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            Review loan details and delete loans with related receivables and payments
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fetchLoans()}
                                        className="inline-flex items-center gap-2 self-start px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium"
                                    >
                                        <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </button>
                                </div>

                                <div className="p-4 sm:p-6">
                                    {isLoading && loans.length === 0 ? (
                                        <p className="text-sm text-gray-500">Loading loans…</p>
                                    ) : loans.length === 0 ? (
                                        <p className="text-sm text-gray-500">No loans found.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {loans.map((loan) => (
                                                <div
                                                    key={loan.id}
                                                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50"
                                                >
                                                    <div className="min-w-0 space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-semibold text-gray-900 truncate">
                                                                {loan.subscriber?.pl_cust_name || 'Subscriber'}
                                                            </h3>
                                                            <span
                                                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                    loan.status === 'ACTIVE'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : loan.status === 'FORECLOSED'
                                                                            ? 'bg-orange-100 text-orange-800'
                                                                            : 'bg-gray-200 text-gray-700'
                                                                }`}
                                                            >
                                                                {loan.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600">
                                                            {loan.subscriber?.pl_cust_phone || '—'} ·{' '}
                                                            {getPlLoanModeLabel(loan.loan_mode) || loan.loan_mode || '—'}
                                                        </p>
                                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
                                                            <span>
                                                                <strong>Principal:</strong>{' '}
                                                                {formatCurrency(loan.principal_amount)}
                                                            </span>
                                                            <span>
                                                                <strong>Outstanding:</strong>{' '}
                                                                {formatCurrency(loan.total_outstanding)}
                                                            </span>
                                                            <span>
                                                                <strong>Disbursed:</strong>{' '}
                                                                {formatDate(loan.disbursed_date || loan.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenDelete(loan)}
                                                        disabled={isPreparingDelete}
                                                        className="inline-flex items-center justify-center gap-2 self-start lg:self-center px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-medium whitespace-nowrap"
                                                    >
                                                        <FiTrash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {(deleteTarget || isPreparingDelete) && (
                <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/50 border-0"
                        aria-label="Close"
                        onClick={() => {
                            if (isDeleting || isPreparingDelete) return;
                            setDeleteTarget(null);
                        }}
                    />
                    <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-start gap-3">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-700">
                                    <FiAlertTriangle className="w-5 h-5" />
                                </span>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Delete loan?</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        This permanently removes the loan and related records.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                disabled={isDeleting || isPreparingDelete}
                                onClick={() => setDeleteTarget(null)}
                                aria-label="Close"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {isPreparingDelete ? (
                            <p className="text-sm text-gray-500 py-6 text-center">Loading delete impact…</p>
                        ) : (
                            <>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                    <h4 className="font-semibold text-red-800 mb-2">
                                        This will permanently delete:
                                    </h4>
                                    <ul className="text-sm text-red-700 space-y-1">
                                        <li>• The loan record</li>
                                        <li>
                                            • <strong>{deleteCounts.receivables}</strong> receivable
                                            {deleteCounts.receivables === 1 ? '' : 's'}
                                        </li>
                                        <li>
                                            • <strong>{deleteCounts.payments}</strong> payment
                                            {deleteCounts.payments === 1 ? '' : 's'} (receipts)
                                        </li>
                                        <li>• Related ledger entries and account balance adjustments</li>
                                    </ul>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4 mb-5 text-sm text-gray-700 space-y-1">
                                    <p>
                                        <strong>Subscriber:</strong>{' '}
                                        {deleteTarget?.subscriber?.pl_cust_name || 'N/A'}
                                    </p>
                                    <p>
                                        <strong>Principal:</strong>{' '}
                                        {formatCurrency(deleteTarget?.principal_amount)}
                                    </p>
                                    <p>
                                        <strong>Status:</strong> {deleteTarget?.status || '—'}
                                    </p>
                                    <p>
                                        <strong>Mode:</strong>{' '}
                                        {getPlLoanModeLabel(deleteTarget?.loan_mode) ||
                                            deleteTarget?.loan_mode ||
                                            '—'}
                                    </p>
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                                    <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => setDeleteTarget(null)}
                                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={handleConfirmDelete}
                                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium inline-flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                                                Deleting…
                                            </>
                                        ) : (
                                            <>
                                                <FiTrash2 className="w-4 h-4" />
                                                Yes, Delete
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalLoanAdminSettingsPage;
