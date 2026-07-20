import React from 'react';
import { useHistory } from 'react-router-dom';
import { useBilling } from '../context/billing_context';
import BillingOverdueOverlay from './BillingOverdueOverlay';
import BillingTrialWelcomeModal from './BillingTrialWelcomeModal';
import BillingAccessGate from './BillingAccessGate';

/**
 * Shared billing UX for app shells: trial welcome, access gate, overdue overlay.
 */
const BillingAppGuards = ({ children }) => {
    const history = useHistory();
    const {
        appCode,
        billingPath,
        showTrialWelcome,
        trialInfo,
        dismissTrialWelcome,
        access,
    } = useBilling();

    const showOverdueOverlay = Boolean(
        access?.can_access
        && !access?.needs_paywall
        && !access?.can_auto_resume
    );

    return (
        <>
            <BillingTrialWelcomeModal
                open={showTrialWelcome}
                appCode={appCode}
                trial={trialInfo}
                onContinue={dismissTrialWelcome}
                onViewPlans={() => {
                    dismissTrialWelcome();
                    history.push(billingPath);
                }}
            />
            <BillingAccessGate>
                {showOverdueOverlay && <BillingOverdueOverlay />}
                {children}
            </BillingAccessGate>
        </>
    );
};

export default BillingAppGuards;
