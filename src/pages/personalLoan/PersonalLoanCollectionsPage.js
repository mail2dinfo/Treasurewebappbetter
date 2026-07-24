import React, { useEffect, useState } from 'react';
import { FiRefreshCw, FiDollarSign } from 'react-icons/fi';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import PersonalLoanLoanCollectionForm from '../../components/personalLoan/PersonalLoanLoanCollectionForm';
import { getPlLoanModeLabel } from '../../utils/personalLoanModes';

const formatCurrency = (value) =>
    `₹${parseFloat(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const PersonalLoanCollectionsPage = () => {
    const { loans, fetchLoans, isLoading } = usePersonalLoanContext();
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [showCollectionForm, setShowCollectionForm] = useState(false);

    useEffect(() => {
        fetchLoans();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const collectibleLoans = (loans || []).filter((loan) => {
        const totalOut =
            loan.total_outstanding != null
                ? parseFloat(loan.total_outstanding || 0)
                : parseFloat(loan.outstanding_principal || 0)
                    + parseFloat(loan.outstanding_interest || 0);
        return loan.status === 'ACTIVE' && totalOut > 0;
    });

    const totalOutstanding = collectibleLoans.reduce((sum, loan) => {
        const out =
            loan.total_outstanding != null
                ? parseFloat(loan.total_outstanding || 0)
                : parseFloat(loan.outstanding_principal || 0)
                    + parseFloat(loan.outstanding_interest || 0);
        return sum + out;
    }, 0);

    const getSubscriberName = (loan) =>
        loan.subscriber?.pl_cust_name
        || loan.subscriber_name
        || loan.pl_cust_name
        || '—';

    const getSubscriberPhone = (loan) =>
        loan.subscriber?.pl_cust_phone
        || loan.subscriber_phone
        || loan.pl_cust_phone
        || '';

    const getLoanAmount = (loan) =>
        parseFloat(loan.principal_amount || loan.loan_amount || 0);

    const getOutstanding = (loan) =>
        loan.total_outstanding != null
            ? parseFloat(loan.total_outstanding || 0)
            : parseFloat(loan.outstanding_principal || 0)
                + parseFloat(loan.outstanding_interest || 0);

    const handleCollect = (loan) => {
        setSelectedLoan(loan);
        setShowCollectionForm(true);
    };

    const handleSuccess = () => {
        setShowCollectionForm(false);
        setSelectedLoan(null);
        fetchLoans();
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Collect dues from active personal loans
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => fetchLoans()}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Loans due</p>
                    <p className="text-2xl font-bold text-gray-900">{collectibleLoans.length}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm text-gray-600">Total outstanding</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {isLoading && collectibleLoans.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">Loading collections…</div>
                ) : collectibleLoans.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                        No active loans with outstanding dues.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subscriber</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Loan amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mode</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Outstanding</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {collectibleLoans.map((loan) => {
                                    const name = getSubscriberName(loan);
                                    const phone = getSubscriberPhone(loan);
                                    const loanAmount = getLoanAmount(loan);
                                    const outstanding = getOutstanding(loan);
                                    return (
                                        <tr key={loan.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900">{name}</div>
                                                {phone ? (
                                                    <div className="text-xs text-gray-500">{phone}</div>
                                                ) : null}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                {formatCurrency(loanAmount)}
                                                <div className="text-xs font-normal text-gray-500 mt-0.5">
                                                    ID: {loan.loan_number || loan.id}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                    {getPlLoanModeLabel(loan.loan_mode)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                                                {formatCurrency(outstanding)}
                                                {(parseFloat(loan.outstanding_interest || 0) > 0) && (
                                                    <div className="text-xs font-normal text-orange-600 mt-0.5">
                                                        Incl. interest {formatCurrency(loan.outstanding_interest)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleCollect(loan)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                                                >
                                                    <FiDollarSign className="w-4 h-4" />
                                                    Collect
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showCollectionForm && selectedLoan && (
                <PersonalLoanLoanCollectionForm
                    loan={selectedLoan}
                    onClose={() => {
                        setShowCollectionForm(false);
                        setSelectedLoan(null);
                    }}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};

export default PersonalLoanCollectionsPage;
