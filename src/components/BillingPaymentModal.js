import React, { useEffect, useState } from 'react';
import Loading from './Loading';
import {
    BILLING_PAYMENT_METHODS,
    BILLING_UPI_PHONE,
    BILLING_UPI_PAYEE_NAME,
    buildUpiQrCodeUrl,
} from '../utils/billingPaymentConfig';

const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

const BillingPaymentModal = ({
    isOpen,
    onClose,
    amount,
    title = 'Complete Payment',
    description,
    onConfirm,
    isSubmitting = false,
}) => {
    const [step, setStep] = useState('method');
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [transactionReference, setTransactionReference] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep('method');
            setSelectedMethod(null);
            setTransactionReference('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleMethodSelect = (methodId) => {
        setSelectedMethod(methodId);
        setStep('pay');
        setError('');
    };

    const handleConfirm = async () => {
        const trimmedReference = transactionReference.trim();
        if (!trimmedReference) {
            setError('Please enter the transaction reference number from your payment app.');
            return;
        }

        await onConfirm({
            payment_method: selectedMethod,
            payment_reference: trimmedReference,
            transaction_id: trimmedReference,
            gateway_response: {
                method: selectedMethod,
                status: 'success',
                reference: trimmedReference,
                timestamp: new Date().toISOString(),
            },
            invoice_number: `INV_${Date.now()}`,
        });
    };

    const renderMethodInstructions = () => {
        switch (selectedMethod) {
            case 'UPI':
                return (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                            <p className="text-sm text-gray-600">Pay via UPI to</p>
                            <p className="text-2xl font-bold tracking-wide text-gray-900">{BILLING_UPI_PHONE}</p>
                            <p className="text-sm text-gray-600">{BILLING_UPI_PAYEE_NAME}</p>
                            <p className="mt-2 text-lg font-semibold text-red-600">{formatAmount(amount)}</p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <img
                                src={buildUpiQrCodeUrl(amount)}
                                alt="UPI QR Code"
                                className="h-52 w-52 rounded-lg border border-gray-200 bg-white p-2"
                            />
                            <p className="text-xs text-gray-500">Scan this QR code with any UPI app</p>
                        </div>
                    </div>
                );
            case 'NetBanking':
                return (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        Complete the net banking transfer for <strong>{formatAmount(amount)}</strong>, then enter the transaction reference number below.
                    </div>
                );
            case 'Wallet':
                return (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        Pay <strong>{formatAmount(amount)}</strong> using your wallet, then enter the wallet transaction reference below.
                    </div>
                );
            case 'Cash':
                return (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        After cash payment of <strong>{formatAmount(amount)}</strong>, enter the receipt or reference number below.
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-xl">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                    aria-label="Close"
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-6 pt-8">
                    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                    {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}

                    {step === 'method' && (
                        <div className="mt-6">
                            <h3 className="mb-3 text-sm font-medium text-gray-700">Choose Payment Method</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {BILLING_PAYMENT_METHODS.map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => handleMethodSelect(method.id)}
                                        className="rounded-lg border-2 border-gray-200 p-4 text-center transition hover:border-red-300 hover:bg-red-50"
                                    >
                                        <div className="mb-2 text-2xl">{method.icon}</div>
                                        <p className="font-medium text-gray-900">{method.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'pay' && selectedMethod && (
                        <div className="mt-6 space-y-4">
                            <button
                                type="button"
                                onClick={() => setStep('method')}
                                disabled={isSubmitting}
                                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                                ← Change payment method ({selectedMethod})
                            </button>

                            {renderMethodInstructions()}

                            <div>
                                <label htmlFor="transactionReference" className="mb-1 block text-sm font-medium text-gray-700">
                                    Transaction Reference Number *
                                </label>
                                <input
                                    id="transactionReference"
                                    type="text"
                                    value={transactionReference}
                                    onChange={(e) => {
                                        setTransactionReference(e.target.value);
                                        setError('');
                                    }}
                                    placeholder="Enter UPI / bank / wallet reference number"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                    disabled={isSubmitting}
                                />
                                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                                <p className="mt-1 text-xs text-gray-500">
                                    Enter the reference from your payment app after completing the payment.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    disabled={isSubmitting}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loading size="sm" />
                                            Processing...
                                        </>
                                    ) : (
                                        `Confirm Payment ${formatAmount(amount)}`
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BillingPaymentModal;
