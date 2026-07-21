import React, { useEffect, useState } from 'react';
import { FiX, FiTrash2 } from 'react-icons/fi';
import { useVehicleFinanceContext } from '../../context/vehicleFinance/VehicleFinanceContext';
import VehicleFinanceLoanAgreementPanel from './VehicleFinanceLoanAgreementPanel';

const VehicleFinanceLoanDetails = ({ loanId, initialLoan = null, onClose }) => {
    const { getLoanById, fetchCompanies, companies, deleteLoan } = useVehicleFinanceContext();
    const [loan, setLoan] = useState(initialLoan || null);
    const [receivables, setReceivables] = useState([]);
    const [isLoading, setIsLoading] = useState(!initialLoan);
    const [error, setError] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadDetails = async () => {
            if (!loanId) {
                setLoan(null);
                setIsLoading(false);
                return;
            }

            // Show list-row data immediately while the detail API loads.
            if (initialLoan) {
                setLoan(initialLoan);
                setIsLoading(false);
            } else {
                setIsLoading(true);
            }
            setError('');

            const result = await getLoanById(loanId);
            if (cancelled) return;

            if (result?.success && result.data?.loan) {
                setLoan(result.data.loan);
                setReceivables(Array.isArray(result.data.receivables) ? result.data.receivables : []);
                setError('');
            } else if (!initialLoan) {
                setLoan(null);
                setError(result?.error || 'Could not load loan details.');
            } else {
                // Keep initial loan visible; detail enrich failed.
                setError(result?.error || '');
            }
            setIsLoading(false);
        };

        loadDetails();
        // Companies are only needed for agreement PDF branding — never block details.
        if (!companies?.length && typeof fetchCompanies === 'function') {
            fetchCompanies();
        }

        return () => {
            cancelled = true;
        };
        // Intentionally only re-fetch when loan identity changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loanId]);

    const subscriber = loan?.subscriber;

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);

    const reloadDetails = async () => {
        if (!loanId) return;
        const result = await getLoanById(loanId);
        if (result?.success && result.data?.loan) {
            setLoan(result.data.loan);
            setReceivables(Array.isArray(result.data.receivables) ? result.data.receivables : []);
        }
    };

    const handleDeleteLoan = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteLoan(loan.id);
            if (result.success) {
                alert('Loan and all related receivables deleted successfully.');
                onClose();
            } else {
                alert(`Failed to delete loan: ${result.message || result.error || 'Unknown error'}`);
            }
        } catch (err) {
            alert(`Failed to delete loan: ${err.message}`);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (isLoading && !loan) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4">
                <div className="bg-white rounded-xl p-8">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-gray-600 mt-4 text-center">Loading loan details...</p>
                </div>
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-4">
                <div className="bg-white rounded-xl p-6 max-w-md w-full">
                    <p className="text-gray-700">{error || 'Could not load loan details.'}</p>
                    <button type="button" onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[120] p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
                <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-start gap-4 rounded-t-xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Loan Details</h2>
                        <p className="text-sm text-gray-500">{loan.id}</p>
                        {error ? (
                            <p className="text-xs text-amber-600 mt-1">
                                Showing list data. Full schedule may be incomplete.
                            </p>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-1"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            Delete
                        </button>
                        <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                        <h3 className="font-semibold text-red-800 mb-3">Loan Agreement</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Download the agreement, share via WhatsApp or email, then upload the signed copy.
                        </p>
                        <VehicleFinanceLoanAgreementPanel
                            loan={loan}
                            subscriber={subscriber}
                            receivables={receivables}
                            company={companies?.[0]}
                            onAgreementUploaded={reloadDetails}
                        />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Subscriber</p>
                            <p className="font-semibold">{subscriber?.vf_cust_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Loan Amount</p>
                            <p className="font-semibold">{formatCurrency(loan.loan_amount ?? loan.principal_amount)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Outstanding</p>
                            <p className="font-semibold">{formatCurrency(loan.closing_balance ?? loan.total_outstanding)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Total Repay</p>
                            <p className="font-semibold">{formatCurrency(loan.total_repay_amount)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">EMI</p>
                            <p className="font-semibold">{formatCurrency(loan.installment_amount)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Vehicle</p>
                            <p className="font-semibold">
                                {[loan.vehicle_make, loan.vehicle_model, loan.vehicle_number]
                                    .filter(Boolean)
                                    .join(' ') || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500">Engine No</p>
                            <p className="font-semibold">{loan.engine_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Chassis No</p>
                            <p className="font-semibold">{loan.chassis_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Status</p>
                            <p className="font-semibold">{loan.status}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Disbursed</p>
                            <p className="font-semibold">{loan.loan_disbursement_date || loan.disbursed_date || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Mode</p>
                            <p className="font-semibold">{loan.repayment_mode || loan.tenure_mode || '—'}</p>
                        </div>
                    </div>

                    {receivables.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3">Repayment Schedule</h3>
                            <div className="overflow-x-auto border rounded-lg">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-2 text-left">#</th>
                                            <th className="p-2 text-left">Due Date</th>
                                            <th className="p-2 text-right">Due</th>
                                            <th className="p-2 text-right">Balance</th>
                                            <th className="p-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {receivables.map((r, i) => (
                                            <tr key={r.id || i} className="border-t">
                                                <td className="p-2">{i + 1}</td>
                                                <td className="p-2">{r.due_date}</td>
                                                <td className="p-2 text-right">₹{parseFloat(r.due_amount || 0).toLocaleString('en-IN')}</td>
                                                <td className="p-2 text-right">₹{parseFloat(r.closing_balance || 0).toLocaleString('en-IN')}</td>
                                                <td className="p-2 text-center">{r.is_paid ? 'Paid' : 'Pending'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 rounded-xl">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Loan?</h3>
                            <p className="text-sm text-gray-600 mb-4">This cannot be undone.</p>
                            <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-4">
                                <p className="text-sm font-bold text-red-800 mb-2">
                                    ⚠ Alarm: Both Loan and Receivables will be removed
                                </p>
                                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                                    <li>The loan record will be deleted permanently</li>
                                    <li>All receivables for this loan will be deleted</li>
                                    <li>Related receipts and ledger entries will also be removed</li>
                                </ul>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteLoan}
                                    disabled={isDeleting}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleFinanceLoanDetails;
