import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useVehicleFinanceContext } from '../../context/vehicleFinance/VehicleFinanceContext';
import VehicleFinanceUserDetails from '../../components/vehicleFinance/VehicleFinanceUserDetails';
import { getVehicleFinanceBasePath } from '../../components/vehicleFinance/vehicleFinanceMenuItems';
import loadingImage from '../../images/preloader.gif';
import '../../style/home.css';
import { useVfPermission } from '../../components/vehicleFinance/useVfPermission';

const VehicleFinanceDashboard = () => {
    const location = useLocation();
    const basePath = getVehicleFinanceBasePath(location.pathname);
    const { canAccess, canAccessAny } = useVfPermission();

    const {
        companies,
        subscribers,
        loans,
        receipts,
        ledgerAccounts,
        fetchCompanies,
        fetchSubscribers,
        fetchLoans,
        fetchReceipts,
        fetchLedgerAccounts,
    } = useVehicleFinanceContext();

    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const loadDashboardData = async () => {
            setPageLoading(true);
            try {
                const requests = [];
                if (canAccessAny(['vf_company_view', 'vf_company'])) requests.push(fetchCompanies());
                if (canAccess('vf_subscriber_view') || canAccess('vf_dashboard_subscribers')) {
                    requests.push(fetchSubscribers());
                }
                if (canAccessAny(['vf_loan_view', 'vf_loan_disburse']) || canAccess('vf_dashboard_active_loans')) {
                    requests.push(fetchLoans());
                }
                if (canAccessAny(['vf_collections_view', 'vf_collections']) || canAccess('vf_dashboard_collected')) {
                    requests.push(fetchReceipts());
                }
                if (canAccessAny(['vf_ledger_view_account', 'vf_ledger'])) {
                    requests.push(fetchLedgerAccounts());
                }
                await Promise.all(requests);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                if (!cancelled) setPageLoading(false);
            }
        };
        loadDashboardData();
        return () => {
            cancelled = true;
        };
    }, [fetchCompanies, fetchSubscribers, fetchLoans, fetchReceipts, fetchLedgerAccounts, canAccess, canAccessAny]);

    const stats = useMemo(() => {
        const loanList = loans || [];
        const activeLoans = loanList.filter((loan) => loan.status === 'ACTIVE');
        const closedLoans = loanList.filter((loan) => loan.status === 'CLOSED');

        const totalDisbursed = loanList.reduce(
            (sum, loan) => sum + (parseFloat(loan.loan_amount || loan.principal_amount) || 0),
            0
        );

        const totalCollected = (receipts || []).reduce(
            (sum, receipt) => sum + (parseFloat(receipt.paid_amount || receipt.received_amount) || 0),
            0
        );

        const totalOutstanding = activeLoans.reduce(
            (sum, loan) => sum + (parseFloat(loan.closing_balance) || 0),
            0
        );

        return {
            totalCompanies: companies?.length || 0,
            totalSubscribers: subscribers?.length || 0,
            totalLoans: loanList.length,
            activeLoans: activeLoans.length,
            closedLoans: closedLoans.length,
            totalDisbursed,
            totalCollected,
            totalOutstanding,
            totalReceipts: receipts?.length || 0,
            totalLedgerAccounts: ledgerAccounts?.length || 0,
        };
    }, [companies, subscribers, loans, receipts, ledgerAccounts]);

    const primaryCompany = companies?.[0] || null;

    if (pageLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <img src={loadingImage} className="loading-img" alt="" style={{ marginTop: 0 }} />
            </div>
        );
    }

    return (
        <div className="home-page">
            <div className="list-container">
                <VehicleFinanceUserDetails
                    company={primaryCompany}
                    stats={stats}
                    basePath={basePath}
                    showCompany={canAccessAny(['vf_company_view', 'vf_company'])}
                />
            </div>
        </div>
    );
};

export default VehicleFinanceDashboard;
