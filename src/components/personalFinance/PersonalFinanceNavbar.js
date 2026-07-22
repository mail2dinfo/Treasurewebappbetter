import React from 'react';
import { useHistory } from 'react-router-dom';
import { FiLogOut, FiCreditCard } from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { useBilling } from '../../context/billing_context';
import { getNavBillingBadge } from '../../utils/billingPaymentUtils';
import { BILLING_PATHS } from '../../utils/billingAppCodes';
import MyTreasureBrand from '../MyTreasureBrand';
import FinanceHubNavButton from '../FinanceHubNavButton';

const navButtonClass =
    'flex items-center px-3 py-1.5 text-sm font-medium text-white hover:text-red-100 hover:bg-white/10 rounded-lg transition-colors';

const capitalizeName = (value) => {
    const name = String(value || '').trim();
    if (!name) return 'User';
    return name.charAt(0).toUpperCase() + name.slice(1);
};

const BillingNavButton = ({ billingPath }) => {
    const history = useHistory();
    const { subscription, payments } = useBilling();
    const badge = getNavBillingBadge(subscription, payments);

    if (!billingPath) return null;

    return (
        <button
            type="button"
            onClick={() => history.push(billingPath)}
            className={`${navButtonClass} relative`}
        >
            <FiCreditCard className="w-4 h-4 mr-1.5" />
            <span>Billing</span>
            {badge.status !== 'unknown' && (
                <span
                    className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                        badge.color === 'red'
                            ? 'bg-red-100 text-red-800'
                            : badge.color === 'blue'
                                ? 'bg-blue-100 text-blue-800'
                                : badge.color === 'green'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {badge.message}
                </span>
            )}
        </button>
    );
};

const PersonalFinanceNavbar = () => {
    const history = useHistory();
    const { user, logout } = useUserContext();
    const billingPath = BILLING_PATHS.PERSONAL_FINANCE;

    const displayName = capitalizeName(
        user?.results?.firstname
        || user?.results?.userDetail?.userName
        || user?.results?.userDetail?.firstname
        || user?.results?.name
        || 'User'
    );

    const handleLogout = () => {
        logout();
        history.push('/login');
    };

    return (
        <header className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 sticky top-0 z-50 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-14">
                    <MyTreasureBrand
                        to="/personal-finance/user/dashboard"
                        subtitle="Personal Finance"
                        inverse
                    />

                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <FinanceHubNavButton className={navButtonClass} />

                        <BillingNavButton billingPath={billingPath} />

                        <div className="hidden sm:block text-right px-2 border-l border-white/30">
                            <p className="text-sm font-semibold text-white truncate max-w-[10rem]">
                                Hi {displayName}
                            </p>
                            <p className="text-xs text-red-100">Personal Finance</p>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="p-2 text-white hover:bg-white/10 rounded-lg"
                            aria-label="Logout"
                            title="Logout"
                        >
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default PersonalFinanceNavbar;
