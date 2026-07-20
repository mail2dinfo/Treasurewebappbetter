import React, { useState, useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { usePersonalLoanContext } from '../../context/personalLoan/PersonalLoanContext';
import PersonalLoanHighlights from '../../components/personalLoan/PersonalLoanHighlights';
import { PL_BASE_PATH } from '../../components/personalLoan/personalLoanMenuItems';
import loadingImage from '../../images/preloader.gif';
import '../../style/home.css';

const PersonalLoanDashboard = () => {
    const history = useHistory();
    const {
        companies,
        subscribers,
        loans,
        receipts,
        fetchCompanies,
        fetchSubscribers,
        fetchLoans,
        fetchReceipts,
    } = usePersonalLoanContext();
    const [imageError, setImageError] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const loadDashboardData = async () => {
            setPageLoading(true);
            try {
                await Promise.all([
                    fetchCompanies(),
                    fetchSubscribers(),
                    fetchLoans(),
                    fetchReceipts(),
                ]);
            } catch (error) {
                console.error('Error loading personal loan dashboard:', error);
            } finally {
                if (!cancelled) setPageLoading(false);
            }
        };
        loadDashboardData();
        return () => {
            cancelled = true;
        };
    }, [fetchCompanies, fetchSubscribers, fetchLoans, fetchReceipts]);

    const stats = useMemo(() => {
        const loanList = loans || [];
        const activeLoans = loanList.filter((loan) => loan.status === 'ACTIVE');
        const totalDisbursed = loanList.reduce(
            (sum, loan) => sum + (parseFloat(loan.principal_amount) || 0),
            0
        );
        const totalCollected = (receipts || []).reduce(
            (sum, receipt) => sum + (parseFloat(receipt.received_amount) || 0),
            0
        );
        const totalOutstandingPrincipal = loanList.reduce(
            (sum, loan) => sum + (parseFloat(loan.outstanding_principal) || 0),
            0
        );
        const totalOutstandingInterest = loanList.reduce(
            (sum, loan) => sum + (parseFloat(loan.outstanding_interest) || 0),
            0
        );

        return {
            totalCompanies: companies?.length || 0,
            totalSubscribers: subscribers?.length || 0,
            totalLoans: loanList.length,
            activeLoans: activeLoans.length,
            totalDisbursed,
            totalCollected,
            totalOutstanding: totalOutstandingPrincipal + totalOutstandingInterest,
        };
    }, [companies, subscribers, loans, receipts]);

    const primaryCompany = companies?.[0] || null;

    useEffect(() => {
        setImageError(false);
    }, [primaryCompany?.id, primaryCompany?.company_logo]);

    if (pageLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <img src={loadingImage} className="loading-img" alt="" style={{ marginTop: 0 }} />
            </div>
        );
    }

    return (
        <div className="home-page">
            <div className="list-container max-w-6xl mx-auto px-4 py-6">
                <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="lg:w-72 shrink-0">
                            {!primaryCompany ? (
                                <div className="border border-gray-200 rounded-xl p-5 text-center">
                                    <p className="text-lg font-semibold text-gray-900">Hello, Welcome</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Set up your personal loan company to get started
                                    </p>
                                    <button
                                        type="button"
                                        className="mt-4 bg-custom-red text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
                                        onClick={() => history.push(`${PL_BASE_PATH}/company`)}
                                    >
                                        Setup Company
                                    </button>
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-xl p-5">
                                    <div className="flex items-start gap-3">
                                        <img
                                            src={
                                                imageError
                                                    ? '/logo192.png'
                                                    : primaryCompany.company_logo_s3_image
                                                        || primaryCompany.company_logo
                                                        || '/logo192.png'
                                            }
                                            alt={primaryCompany.company_name || 'Company'}
                                            className="w-14 h-14 rounded-full object-cover border border-gray-200"
                                            onError={() => setImageError(true)}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-semibold text-gray-900 truncate">
                                                {primaryCompany.company_name}
                                            </h4>
                                            <p className="text-xs text-gray-500">Personal Loan</p>
                                            <button
                                                type="button"
                                                className="mt-2 text-sm text-custom-red font-medium hover:underline"
                                                onClick={() => history.push(`${PL_BASE_PATH}/company`)}
                                            >
                                                Edit Company
                                            </button>
                                        </div>
                                    </div>
                                    {(primaryCompany.address || primaryCompany.contact_no || primaryCompany.email) && (
                                        <div className="mt-4 space-y-1 text-sm text-gray-600">
                                            {primaryCompany.address && <p>{primaryCompany.address}</p>}
                                            {primaryCompany.contact_no && <p>{primaryCompany.contact_no}</p>}
                                            {primaryCompany.email && <p>{primaryCompany.email}</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <PersonalLoanHighlights stats={stats} basePath={PL_BASE_PATH} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalLoanDashboard;
