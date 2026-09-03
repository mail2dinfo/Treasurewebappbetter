import React, { useState, useEffect } from "react";
import { useLedgerAccountContext } from "../context/ledgerAccount_context";
import { useLedgerEntryContext } from "../context/ledgerEntry_context";
import { useUserContext } from "../context/user_context";
import { toast, ToastContainer } from "react-toastify";
import { API_BASE_URL } from "../utils/apiConfig";
import { getChitCompanyMembershipId } from "../utils/chitMembership";
import {
    refreshReceivableForConfirm,
} from "../utils/receivablePaymentApi";
import ReceivableReceitPdf from "./PDF/ReceivableReceitPdf";
import ReceivableConfirmPanel, { ReceivableLiveBalancePanel } from "./ReceivableConfirmPanel";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { FiDownload, FiUser, FiPhone, FiCalendar, FiDollarSign, FiX, FiCheck, FiAlertCircle, FiPrinter } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { formatReceivableDueNo } from '../utils/formatReceivableDueNo';
import 'react-toastify/dist/ReactToastify.css';

const ReceivablePayementModal = ({ isOpen, onClose, receivable, fetchReceivables }) => {
    const [groupAdvanceInput, setGroupAdvanceInput] = useState("");
    const [paymentType, setPaymentType] = useState("full");
    const [useGroupAdvance, setUseGroupAdvance] = useState(false);
    const [partialAmount, setPartialAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [isConfirming, setIsConfirming] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [activeReceivable, setActiveReceivable] = useState(receivable);
    const [isRefreshingConfirm, setIsRefreshingConfirm] = useState(false);
    const [isRefreshingOnOpen, setIsRefreshingOnOpen] = useState(false);
    const { ledgerAccounts, fetchLedgerAccounts } = useLedgerAccountContext();
    const { fetchLedgerEntries } = useLedgerEntryContext();
    const { user } = useUserContext();
    const userCompany = user?.results?.userCompany;
    const membershipId = getChitCompanyMembershipId(user);
    const [receivableDate, setReceivableDate] = useState(
        new Date().toISOString().split("T")[0]);

    useEffect(() => {
        if (!isOpen) return;

        setGroupAdvanceInput("");
        setPaymentType("full");
        setUseGroupAdvance(false);
        setPartialAmount("");
        setPaymentMethod("");
        setIsConfirming(false);
        setReceiptData(null);
        setLoading(false);
        setIsDownloading(false);
        setIsRefreshingConfirm(false);
        setIsRefreshingOnOpen(false);
        setReceivableDate(new Date().toISOString().split("T")[0]);

        if (receivable) {
            setActiveReceivable(receivable);
        }
    }, [isOpen, receivable?.id, receivable]);

    useEffect(() => {
        if (!isOpen || !receivable?.id) return undefined;

        const token = user?.results?.token;
        if (!token) return undefined;

        let cancelled = false;

        const loadLatestReceivable = async () => {
            setIsRefreshingOnOpen(true);
            try {
                const { receivable: freshReceivable } = await refreshReceivableForConfirm({
                    receivable,
                    token,
                    mode: 'user',
                });
                if (!cancelled) {
                    setActiveReceivable(freshReceivable);
                }
            } catch (error) {
                console.warn('Could not load latest receivable on open:', error);
            } finally {
                if (!cancelled) {
                    setIsRefreshingOnOpen(false);
                }
            }
        };

        loadLatestReceivable();

        return () => {
            cancelled = true;
        };
    }, [isOpen, receivable?.id, receivable, user?.results?.token]);

    const currentReceivable = activeReceivable ?? receivable;
    const totalDue = currentReceivable?.rbdue ?? 0;
    const advanceBalance = currentReceivable?.total_advance_balance ?? 0;

    const [advanceApplied, setAdvanceApplied] = useState(0);
    const [balanceAdvance, setBalanceAdvance] = useState(0);
    const [remainingDue, setRemainingDue] = useState(totalDue);
    const [parsedPartialAmount, setParsedPartialAmount] = useState(totalDue);

    useEffect(() => {
        const advanceInput = useGroupAdvance ? parseFloat(groupAdvanceInput || "0") : 0;
        const applicableAdvance = Math.min(
            Math.max(advanceInput, 0),
            Math.max(advanceBalance, 0),
            Math.max(totalDue, 0)
        );

        // Partial Amount = total toward due this payment (not cash-only).
        // Full = always settle entire due.
        const towardDueInput = paymentType === "partial"
            ? Math.min(Math.max(parseFloat(partialAmount || "0"), 0), Math.max(totalDue, 0))
            : Math.max(totalDue, 0);

        const advanceTowardDue = Math.min(applicableAdvance, towardDueInput);
        const cashInput = Math.max(towardDueInput - advanceTowardDue, 0);
        const nextRemainingDue = Math.max(totalDue - towardDueInput, 0);
        const remainingAdvance = Math.max(advanceBalance - advanceTowardDue, 0);

        setAdvanceApplied(advanceTowardDue);
        setParsedPartialAmount(cashInput);
        setRemainingDue(nextRemainingDue);
        setBalanceAdvance(remainingAdvance);
    }, [
        partialAmount,
        groupAdvanceInput,
        useGroupAdvance,
        paymentType,
        totalDue,
        advanceBalance
    ]);

    if (!isOpen || !currentReceivable) return null;

    const {
        name,
        phone,
        group_name,
        auct_date,
        user_image_from_s3,
    } = currentReceivable;

    const formatCurrency = (amt) => `₹${Number(amt).toLocaleString("en-IN")}`;
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const handleConfirmPayment = async () => {
        setLoading(true);
        const selectedAccount = ledgerAccounts.find(acc => acc.account_name === paymentMethod);
        const paymentMethodId = selectedAccount?.id || null;
        const dueAmount = currentReceivable.rbdue > 0
            ? parseFloat(currentReceivable.rbdue)
            : parseFloat(currentReceivable.rbtotal || 0);

        const towardDue = paymentType === 'full'
            ? dueAmount
            : Math.min(Math.max(parseFloat(partialAmount || 0), 0), dueAmount);

        const advanceUsed = useGroupAdvance
            ? Math.min(parseFloat(advanceApplied || 0), towardDue, dueAmount)
            : 0;
        // Cash is only leftover after advance — never send full due again with advance
        const cashAmount = Math.max(towardDue - advanceUsed, 0);

        if (!paymentMethodId) {
            toast.error("Please select a valid payment method.");
            setLoading(false);
            return;
        }
        if (cashAmount <= 0 && advanceUsed <= 0) {
            toast.error("Please enter a valid payment amount or use advance.");
            setLoading(false);
            return;
        }

        const totalTowardDue = advanceUsed + cashAmount;

        const payload = {
            payableReceivalbeId: currentReceivable.id,
            paymentMethod: cashAmount <= 0 && advanceUsed > 0 ? "Advance" : paymentMethod,
            paymentMethodId,
            paymentStatus: "SUCCESS",
            paymentType,
            paymentTransactionRef: "FUTURE",
            payableCode: "001",
            paymentAmount: parseFloat(cashAmount),
            subscriberId: currentReceivable.subscriber_id,
            grpSubscriberId: currentReceivable.group_subscriber_id,
            sourceSystem: "WEB",
            type: 2,
            groupId: currentReceivable.group_id,
            grpAccountId: currentReceivable.group_account_id,
            transactedDate: receivableDate,
            groupName: group_name,
            subscriberName: name,
            auctionDate: auct_date,
            membershipId,
            useGroupAdvanceflag: useGroupAdvance,
            groupAdvanceUsed: advanceUsed,
            deductionPaymentMethodId: selectedAccount?.id || null
        };

        try {
            const response = await fetch(`${API_BASE_URL}/receipts`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${user?.results?.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                const billNumber = data.results?.receiptId;
                setReceiptData({
                    ...payload,
                    subscriberName: name,
                    billNumber,
                    receiptId: billNumber,
                    transactedDate: receivableDate,
                    cashAmount,
                    advanceAmount: advanceUsed,
                    totalTowardDue,
                    dueNo: formatReceivableDueNo(currentReceivable),
                    dueNumber: currentReceivable.due_number,
                    dueTotal: currentReceivable.due_total,
                });
                setTimeout(() => fetchReceivables(), 2000);
                fetchLedgerAccounts();
                fetchLedgerEntries();
                toast.success("Payment processed successfully!");
            } else {
                const err = await response.json();
                toast.error(err.message || "Payment failed.");
            }
        } catch (error) {
            toast.error("❌ Network error. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchFreshReceivable = async () => {
        const token = user?.results?.token;
        const { receivable: freshReceivable } = await refreshReceivableForConfirm({
            receivable: currentReceivable,
            token,
            mode: 'user',
        });
        return freshReceivable;
    };

    const handleSubmit = async () => {
        if (!paymentMethod) {
            toast.error("❌ Please select a payment method.");
            return;
        }
        // Full + Advance only when advance covers the full due
        if (paymentType === "full" && useGroupAdvance && advanceBalance < totalDue) {
            const adv = Math.min(advanceBalance, totalDue);
            setPaymentType("partial");
            setGroupAdvanceInput(adv.toString());
            setPartialAmount(adv.toString());
            toast.info(
                `Advance (₹${adv.toLocaleString("en-IN")}) is less than due. Switched to Partial + Use Advance — only advance will be applied.`
            );
            return;
        }

        setIsRefreshingConfirm(true);
        try {
            const freshReceivable = await fetchFreshReceivable();
            setActiveReceivable(freshReceivable);
            if (parseFloat(freshReceivable.rbdue || 0) <= 0) {
                toast.error("This receivable is already fully paid. Please refresh the list.");
                return;
            }
            setIsConfirming(true);
        } catch {
            toast.error("Could not refresh payment history. Please try again.");
        } finally {
            setIsRefreshingConfirm(false);
        }
    };

    const handlePrint = () => {
        const printContents = document.querySelector('.receipt-container')?.innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Receipt</title>');
        printWindow.document.write('<style>body { font-family: Arial; padding: 20px; } .receipt-row { display: flex; justify-content: space-between; padding: 4px 0; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(printContents);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    const buildWhatsAppBillUrl = () => {
        if (!receiptData) return null;

        const digits = String(phone || '').replace(/\D/g, '');
        const subscriberPhone = digits.length >= 10
            ? (digits.length === 10 ? `91${digits}` : digits)
            : '';

        const companyLabel = userCompany?.name ? ` from ${userCompany.name}` : '';
        const message = [
            `Payment Receipt${companyLabel}`,
            '',
            `Bill No: ${receiptData.billNumber ?? '-'}`,
            `Subscriber Name: ${receiptData.subscriberName || name || '-'}`,
            `Receivable Date: ${formatDate(receivableDate)}`,
            `Group Name: ${group_name || '-'}`,
            `Due no.: ${receiptData.dueNo || formatReceivableDueNo(currentReceivable)}`,
            `Auction Date: ${formatDate(auct_date)}`,
            `Amount Paid (toward due): ${formatCurrency(receiptData.totalTowardDue ?? receiptData.paymentAmount)}`,
            receiptData.advanceAmount > 0
                ? `Advance Applied: ${formatCurrency(receiptData.advanceAmount)}`
                : null,
            `Cash Collected: ${formatCurrency(receiptData.cashAmount ?? receiptData.paymentAmount)}`,
            `Payment Method: ${receiptData.paymentMethod || '-'}`,
            `Payment Type: ${receiptData.paymentType || '-'}`,
            '',
            'Thank you for your payment.',
        ].filter(Boolean).join('\n');

        const encoded = encodeURIComponent(message);
        return subscriberPhone
            ? `https://api.whatsapp.com/send?phone=${subscriberPhone}&text=${encoded}`
            : `https://api.whatsapp.com/send?text=${encoded}`;
    };

    const handleSendBillOnWhatsApp = () => {
        const url = buildWhatsAppBillUrl();
        if (!url) {
            toast.error('Unable to open WhatsApp. Please try again.');
            return;
        }
        if (!String(phone || '').replace(/\D/g, '')) {
            toast.error('Subscriber phone number is missing.');
            return;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4">
            <ToastContainer position="top-center" />
            <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-custom-red to-red-600 px-4 py-3 sm:px-6 sm:py-4 text-white">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="relative flex-shrink-0">
                                {user_image_from_s3 ? (
                                    <img
                                        src={user_image_from_s3}
                                        alt={name}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/30"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center ${user_image_from_s3 ? 'hidden' : 'flex'}`}
                                >
                                    <FiUser className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base sm:text-xl font-bold truncate">{name}</h2>
                                <p className="text-red-100 text-xs sm:text-sm flex items-center gap-1 truncate">
                                    <FiPhone className="w-3 h-3 flex-shrink-0" />
                                    {phone}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors duration-200 flex-shrink-0"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-4 sm:p-6 max-h-[calc(92vh-100px)] overflow-y-auto">
                    {isConfirming && !receiptData ? (
                        /* Confirmation Screen */
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <FiAlertCircle className="w-8 h-8 text-yellow-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Confirm Payment</h3>
                                <p className="text-gray-600">Please review the payment details before proceeding</p>
                            </div>

                            <ReceivableConfirmPanel
                                receivable={currentReceivable}
                                name={name}
                                group_name={group_name}
                                auct_date={auct_date}
                                receivableDate={receivableDate}
                                paymentMethod={paymentMethod}
                                paymentType={paymentType}
                                formatDate={formatDate}
                                formatCurrency={formatCurrency}
                                parsedPartialAmount={parsedPartialAmount}
                                advanceApplied={advanceApplied}
                                useGroupAdvance={useGroupAdvance}
                                balanceAdvance={balanceAdvance}
                                pendingNow={totalDue}
                                remainingDue={remainingDue}
                                isRefreshing={isRefreshingConfirm}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsConfirming(false)}
                                    className="flex-1 py-3 px-4 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={loading}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-custom-red to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck className="w-5 h-5" />
                                            Confirm Payment
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : receiptData ? (
                        /* Receipt Screen */
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                                    <FiCheck className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
                                <p className="text-gray-600">Your payment has been processed successfully</p>
                            </div>

                            <div className="receipt-container space-y-4">
                                <div className="flex items-center justify-between bg-[#003366] text-white rounded-lg px-4 py-3">
                                    <span className="text-sm font-semibold">Receivable Details</span>
                                    <div className="text-right text-xs font-semibold">
                                        <p>Billno: {receiptData.billNumber ?? '-'}</p>
                                        <p>Bill Date: {formatDate(new Date().toISOString())}</p>
                                    </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subscriber Name:</span>
                                    <span className="font-semibold">{receiptData.subscriberName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Receivable Date:</span>
                                    <span className="font-semibold">{formatDate(receivableDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Group Name:</span>
                                    <span className="font-semibold">{group_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Due no.:</span>
                                    <span className="font-semibold">{receiptData.dueNo || formatReceivableDueNo(currentReceivable)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Auction Date:</span>
                                    <span className="font-semibold">{formatDate(auct_date)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount Paid (toward due):</span>
                                    <span className="font-semibold text-green-600">
                                        {formatCurrency(receiptData.totalTowardDue ?? receiptData.paymentAmount)}
                                    </span>
                                </div>
                                {(receiptData.advanceAmount > 0) && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Advance Applied:</span>
                                        <span className="font-semibold text-green-700">
                                            {formatCurrency(receiptData.advanceAmount)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Cash Collected:</span>
                                    <span className="font-semibold text-orange-700">
                                        {formatCurrency(receiptData.cashAmount ?? receiptData.paymentAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Method:</span>
                                    <span className="font-semibold">{receiptData.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Type:</span>
                                    <span className="font-semibold">{receiptData.paymentType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Transaction Ref:</span>
                                    <span className="font-semibold">{receiptData.paymentTransactionRef}</span>
                                </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={handleSendBillOnWhatsApp}
                                    className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <FaWhatsapp className="w-5 h-5" />
                                    Send Bill to Subscriber
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handlePrint}
                                        className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                                    >
                                        <FiPrinter className="w-5 h-5" />
                                        Print
                                    </button>
                                    <PDFDownloadLink
                                        key={`receipt-pdf-${receiptData.billNumber ?? receiptData.receiptId ?? 'new'}`}
                                        document={
                                            <ReceivableReceitPdf
                                                receivableData={{
                                                    ...receiptData,
                                                    billNumber: receiptData.billNumber ?? receiptData.receiptId,
                                                }}
                                                companyData={userCompany}
                                            />
                                        }
                                        fileName={`Receipt-${receiptData.billNumber || receiptData.subscriberName}-${Date.now()}.pdf`}
                                        className="flex-1"
                                        onClick={() => {
                                            setIsDownloading(true);
                                            setTimeout(() => setIsDownloading(false), 3000);
                                        }}
                                    >
                                        {({ loading: pdfLoading }) => (
                                            <button className="w-full py-3 px-4 bg-custom-red text-white font-semibold rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2">
                                                <FiDownload className="w-5 h-5" />
                                                {pdfLoading || isDownloading ? "Downloading..." : "Download PDF"}
                                            </button>
                                        )}
                                    </PDFDownloadLink>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Payment Form */
                        <div className="space-y-6">
                            {/* Subscriber Info */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="relative">
                                    {user_image_from_s3 ? (
                                        <img
                                            src={user_image_from_s3}
                                            alt={name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className={`w-16 h-16 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center ${user_image_from_s3 ? 'hidden' : 'flex'}`}
                                    >
                                        <FiUser className="w-8 h-8 text-gray-500" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
                                    <p className="text-gray-600 flex items-center gap-1">
                                        <FiPhone className="w-4 h-4" />
                                        {phone}
                                    </p>
                                    <p className="text-gray-600 flex items-center gap-1">
                                        <FiCalendar className="w-4 h-4" />
                                        {formatDate(auct_date)}
                                    </p>
                                </div>
                            </div>

                            {/* Live balance from database (refreshed on Pay click) */}
                            <ReceivableLiveBalancePanel
                                receivable={currentReceivable}
                                formatCurrency={formatCurrency}
                                isRefreshing={isRefreshingOnOpen}
                            />

                            {/* Advance Balance */}
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">💰</span>
                                        <span className="text-yellow-800 font-semibold">Advance Balance</span>
                                    </div>
                                    <span className="text-2xl font-bold text-yellow-900">
                                        {formatCurrency(currentReceivable?.total_advance_balance ?? 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Receivable Date</label>
                                    <input
                                        type="date"
                                        value={receivableDate}
                                        onChange={(e) => setReceivableDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent"
                                    >
                                        <option value="">-- Select Payment Method --</option>
                                        {ledgerAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.account_name}>{acc.account_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Payment Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-custom-red cursor-pointer transition-all duration-200">
                                            <input
                                                type="radio"
                                                value="full"
                                                checked={paymentType === "full"}
                                                onChange={() => {
                                                    setPaymentType("full");
                                                    setUseGroupAdvance(false);
                                                    setGroupAdvanceInput("0");
                                                    setPartialAmount("0");
                                                }}
                                                className="w-4 h-4 text-custom-red border-gray-300 focus:ring-custom-red"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">Full Payment</span>
                                        </label>
                                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-custom-red cursor-pointer transition-all duration-200">
                                            <input
                                                type="radio"
                                                value="partial"
                                                checked={paymentType === "partial"}
                                                onChange={() => {
                                                    setPaymentType("partial");
                                                    setUseGroupAdvance(false);
                                                    setGroupAdvanceInput("0");
                                                    setPartialAmount(totalDue.toString());
                                                }}
                                                className="w-4 h-4 text-custom-red border-gray-300 focus:ring-custom-red"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">Partial Payment</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                                    <input
                                        type="checkbox"
                                        checked={useGroupAdvance}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setUseGroupAdvance(checked);
                                            if (!checked) {
                                                setGroupAdvanceInput("0");
                                                if (paymentType === "partial") {
                                                    setPartialAmount(totalDue.toString());
                                                }
                                            } else if (paymentType === "partial") {
                                                // Partial + Advance: default advance-only (1 receipt)
                                                const adv = Math.min(advanceBalance, totalDue);
                                                setGroupAdvanceInput(adv.toString());
                                                setPartialAmount(adv.toString());
                                            } else if (advanceBalance < totalDue) {
                                                // Full + Advance but advance < due → force Partial + advance-only
                                                const adv = Math.min(advanceBalance, totalDue);
                                                setPaymentType("partial");
                                                setGroupAdvanceInput(adv.toString());
                                                setPartialAmount(adv.toString());
                                                toast.info(
                                                    `Advance is less than due. Using Partial + Advance for ₹${adv.toLocaleString("en-IN")}.`
                                                );
                                            } else {
                                                // Full + Advance and advance covers due → apply only the due from advance
                                                setGroupAdvanceInput(totalDue.toString());
                                            }
                                        }}
                                        className="w-4 h-4 text-custom-red border-gray-300 rounded focus:ring-custom-red"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700">Use Advance</span>
                                </div>
                                {useGroupAdvance && paymentType === "full" && (
                                    <p className="text-xs text-gray-500 -mt-1">
                                        Full due ₹{Number(totalDue).toLocaleString("en-IN")} will be paid from advance.
                                        Remaining advance stays for future dues.
                                    </p>
                                )}
                                {useGroupAdvance && paymentType === "partial" && (
                                    <p className="text-xs text-gray-500 -mt-1">
                                        Only the advance amount (or Amount Toward Due) is posted to receipts — no extra cash unless you raise Amount Toward Due.
                                    </p>
                                )}

                                {paymentType === "partial" && (
                                    <>
                                        {useGroupAdvance && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Advance Used</label>
                                                <input
                                                    type="number"
                                                    value={groupAdvanceInput}
                                                    onChange={(e) => {
                                                        const val = Math.min(
                                                            Math.max(Number(e.target.value) || 0, 0),
                                                            advanceBalance,
                                                            totalDue
                                                        );
                                                        setGroupAdvanceInput(String(val));
                                                        // Sync toward-due with advance so Partial+Advance
                                                        // does not keep full due and create a large cash receipt
                                                        setPartialAmount(String(val));
                                                    }}
                                                    min="0"
                                                    max={advanceBalance}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Amount Toward Due
                                            </label>
                                            <input
                                                type="number"
                                                value={partialAmount}
                                                onChange={(e) => {
                                                    const val = Math.min(
                                                        Math.max(Number(e.target.value) || 0, 0),
                                                        totalDue
                                                    );
                                                    setPartialAmount(val.toString());
                                                    if (useGroupAdvance) {
                                                        const adv = Math.min(
                                                            parseFloat(groupAdvanceInput || 0),
                                                            advanceBalance,
                                                            val
                                                        );
                                                        setGroupAdvanceInput(String(adv));
                                                    }
                                                }}
                                                min="0"
                                                max={totalDue}
                                                placeholder="₹0.00"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent"
                                            />
                                            {useGroupAdvance && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Cash to collect: {formatCurrency(parsedPartialAmount)} (after advance).
                                                    Raise Amount Toward Due above Advance Used if you also want cash.
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {useGroupAdvance && (
                                    <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <FiDollarSign className="w-5 h-5 text-custom-red" />
                                            Payment Summary
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Total Due:</span>
                                                <span className="font-semibold text-red-600">{formatCurrency(totalDue)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Advance Applied:</span>
                                                <span className="font-semibold text-green-600">{formatCurrency(advanceApplied)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Cash to Collect:</span>
                                                <span className="font-semibold text-orange-600">{formatCurrency(parsedPartialAmount)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Remaining Due:</span>
                                                <span className="font-semibold text-red-600">{formatCurrency(remainingDue)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Balance Advance:</span>
                                                <span className="font-semibold text-blue-600">{formatCurrency(balanceAdvance)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={
                                        !paymentMethod
                                        || (paymentType === "partial" && !partialAmount)
                                        || isRefreshingConfirm
                                        || isRefreshingOnOpen
                                        || parseFloat(currentReceivable?.rbdue || 0) <= 0
                                    }
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-custom-red to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiDollarSign className="w-5 h-5" />
                                    {isRefreshingOnOpen || isRefreshingConfirm ? 'Refreshing…' : 'Process Payment'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReceivablePayementModal;