import React, { useEffect, useMemo } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FiDownload } from 'react-icons/fi';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import { useUserContext } from '../../context/user_context';
import PersonalLoanListPDF from '../../components/personalLoan/PDF/PersonalLoanListPDF';

const formatCurrency = (value) =>
    `₹${parseFloat(value || 0).toLocaleString('en-IN')}`;

const PersonalLoanReportsPage = () => {
    const {
        loans,
        fetchLoans,
        subscribers,
        fetchSubscribers,
        isLoading,
        companies,
        fetchCompanies,
    } = usePersonalLoanContext();
    const { user } = useUserContext();

    useEffect(() => {
        fetchLoans();
        if (fetchSubscribers) fetchSubscribers();
        if (fetchCompanies) fetchCompanies();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const stats = useMemo(() => {
        const list = loans || [];
        const active = list.filter((l) => l.status === 'ACTIVE');
        const closed = list.filter((l) => l.status === 'CLOSED' || l.status === 'FORECLOSED');
        const totalDisbursed = list.reduce(
            (sum, l) => sum + parseFloat(l.principal_amount || l.loan_amount || 0),
            0
        );
        const totalOutstanding = active.reduce(
            (sum, l) =>
                sum
                + parseFloat(l.outstanding_principal || 0)
                + parseFloat(l.outstanding_interest || 0),
            0
        );
        const totalCollected = Math.max(0, totalDisbursed - totalOutstanding);
        return {
            totalLoans: list.length,
            activeLoans: active.length,
            closedLoans: closed.length,
            totalSubscribers: (subscribers || []).length,
            totalDisbursed,
            totalOutstanding,
            totalCollected,
        };
    }, [loans, subscribers]);

    const getCompanyDataForPDF = () => {
        const plCompany = companies?.[0];
        const chitFundCompany = user?.results?.userCompany?.[0];

        if (plCompany) {
            return {
                name: plCompany.company_name || 'Personal Loan Company',
                logo_base64format: plCompany.company_logo || null,
                phone: plCompany.contact_no || 'N/A',
                street_address: plCompany.address || '',
                city: '',
                state: '',
                zipcode: '',
                country: '',
                email: '',
                registration_no: plCompany.registration_no || '',
                company_since: plCompany.company_since || '',
            };
        }
        if (chitFundCompany) {
            return {
                name: chitFundCompany.name || 'Company',
                logo_base64format: chitFundCompany.logo_base64format || null,
                phone: chitFundCompany.phone || 'N/A',
                street_address: chitFundCompany.street_address || '',
                city: chitFundCompany.city || '',
                state: chitFundCompany.state || '',
                zipcode: chitFundCompany.zipcode || '',
                country: chitFundCompany.country || '',
                email: chitFundCompany.email || '',
                registration_no: chitFundCompany.registration_no || '',
                company_since: chitFundCompany.company_since || '',
            };
        }
        return { name: 'Personal Loan' };
    };

    const activeLoans = (loans || []).filter((l) => l.status === 'ACTIVE');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Portfolio summary and loan list export
                    </p>
                </div>
                <PDFDownloadLink
                    document={
                        <PersonalLoanListPDF
                            loans={activeLoans}
                            companyData={getCompanyDataForPDF()}
                        />
                    }
                    fileName={`personal-loan-report-${new Date().toISOString().slice(0, 10)}.pdf`}
                    className="inline-flex items-center gap-2 rounded-lg bg-custom-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                    {({ loading }) => (
                        <>
                            <FiDownload className="w-4 h-4" />
                            {loading ? 'Preparing PDF…' : 'Download loan list PDF'}
                        </>
                    )}
                </PDFDownloadLink>
            </div>

            {isLoading && !(loans || []).length ? (
                <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500">
                    Loading report data…
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-600">Total loans</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalLoans}</p>
                        <p className="mt-1 text-xs text-gray-500">
                            {stats.activeLoans} active · {stats.closedLoans} closed
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-600">Subscribers</p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">{stats.totalSubscribers}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-600">Total disbursed</p>
                        <p className="mt-1 text-2xl font-bold text-indigo-600">
                            {formatCurrency(stats.totalDisbursed)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-600">Outstanding</p>
                        <p className="mt-1 text-2xl font-bold text-red-600">
                            {formatCurrency(stats.totalOutstanding)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                            Collected {formatCurrency(stats.totalCollected)}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalLoanReportsPage;
