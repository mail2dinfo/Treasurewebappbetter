import React, { useState } from "react";
import { useLedgerAccountContext } from "../context/ledgerAccount_context";
import { useLedgerEntryContext } from "../context/ledgerEntry_context";
import { useUserContext } from "../context/user_context";
import { toast, ToastContainer } from "react-toastify";
import { API_BASE_URL } from '../utils/apiConfig';
import ReceivableReceitPdf from "./PDF/ReceivableReceitPdf";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { FiDownload, FiUser, FiPhone, FiCalendar, FiDollarSign, FiCreditCard, FiX, FiCheck, FiAlertCircle, FiPrinter } from 'react-icons/fi';
import 'react-toastify/dist/ReactToastify.css';

const PayablePaymentModal = ({ isOpen, onClose, payable, fetchPayables }) => {
    const { user } = useUserContext();
    const { ledgerAccounts, fetchLedgerAccounts } = useLedgerAccountContext();
    const { fetchLedgerEntries } = useLedgerEntryContext();
    const [isConfirming, setIsConfirming] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [paymentType, setPaymentType] = useState("full");
    const [partialAmount, setPartialAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [payableDate, setPayableDate] = useState(() => {
        const today = new Date().toISOString().split("T")[0];
        return today;
    });

    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id;

    if (!isOpen || !payable) return null;

    const {
        name,
        phone,
        group_name,
        auct_date,
        user_image_from_s3,
        pytotal,
        pbpaid,
        pbdue
    } = payable;

    const formatCurrency = (amt) => `₹${Number(amt).toLocaleString("en-IN")}`;
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const handlePartialAmountChange = (e) => {
        const value = e.target.value;
        if (!isNaN(value) && Number(value) >= 0) {
            setPartialAmount(value);
        }
    };

    const handleConfirmPayment = async () => {
        setLoading(true);

        const selectedAccount = ledgerAccounts.find(acc => acc.account_name === paymentMethod);
        const paymentMethodId = selectedAccount?.id || null;

        const paymentAmount = paymentType === 'full'
            ? pbdue > 0 ? pbdue : pytotal
            : parseFloat(partialAmount || 0);

        const payload = {
            payableReceivalbeId: payable.id,
            paymentMethod,
            paymentMethodId,
            paymentStatus: "SUCCESS",
            paymentType,
            paymentTransactionRef: "FUTURE",
            payableCode: "002",
            paymentAmount: parseFloat(paymentAmount),
            subscriberId: payable.subscriber_id,
            grpSubscriberId: payable.group_subscriber_id,
            sourceSystem: "WEB",
            type: 1, // Indicates Payable (vs Receivable)
            groupId: payable.group_id,
            grpAccountId: payable.group_account_id,
            transactedDate: payableDate,
            groupName: group_name,
            subscriberName: name,
            auctionDate: auct_date,
            membershipId
        };

        try {
            const response = await fetch(`${API_BASE_URL}/payments-receipts`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${user?.results?.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                setReceiptData({ ...payload, subscriberName: name });
                setTimeout(() => fetchPayables(), 2000);
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

    const handleSubmit = () => {
        if (!paymentMethod) {
            toast.error("❌ Please select a payment method.");
            return;
        }
        if (paymentType === "partial" && !partialAmount) {
            toast.error("❌ Please enter the partial amount.");
            return;
        }
        setIsConfirming(true);
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
            <ToastContainer position="top-center" />
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-custom-red to-red-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {user_image_from_s3 ? (
                                    <img
                                        src={user_image_from_s3}
                                        alt={name}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-white/30"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className={`w-12 h-12 rounded-full border-2 border-white/30 bg-white/20 flex items-center justify-center ${user_image_from_s3 ? 'hidden' : 'flex'}`}
                                >
                                    <FiUser className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{name}</h2>
                                <p className="text-red-100 text-sm flex items-center gap-1">
                                    <FiPhone className="w-3 h-3" />
                                    {phone}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors duration-200"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
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

                            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subscriber:</span>
                                    <span className="font-semibold">{name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Group:</span>
                                    <span className="font-semibold">{group_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Auction Date:</span>
                                    <span className="font-semibold">{formatDate(auct_date)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payable Date:</span>
                                    <span className="font-semibold">{formatDate(payableDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Method:</span>
                                    <span className="font-semibold">{paymentMethod}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payment Type:</span>
                                    <span className="font-semibold">{paymentType === "full" ? "Full Payment" : "Partial Payment"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Payable:</span>
                                    <span className="font-semibold text-red-600">{formatCurrency(pytotal || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Already Paid:</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(pbpaid || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount Due:</span>
                                    <span className="font-semibold text-orange-600">{formatCurrency(pbdue || 0)}</span>
                                </div>
                                {paymentType === "partial" && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Partial Amount:</span>
                                        <span className="font-semibold text-blue-600">{formatCurrency(partialAmount)}</span>
                                    </div>
                                )}
                                {paymentType === "full" && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Paying Amount:</span>
                                        <span className="font-semibold text-red-600">{formatCurrency(pbdue > 0 ? pbdue : pytotal)}</span>
                                    </div>
                                )}
                            </div>

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

                            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subscriber Name:</span>
                                    <span className="font-semibold">{receiptData.subscriberName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Payable Date:</span>
                                    <span className="font-semibold">{formatDate(payableDate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Group Name:</span>
                                    <span className="font-semibold">{group_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Auction Date:</span>
                                    <span className="font-semibold">{formatDate(auct_date)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Amount Paid:</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(receiptData.paymentAmount)}</span>
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

                            <div className="flex gap-3">
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <FiPrinter className="w-5 h-5" />
                                    Print
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 bg-custom-red text-white font-semibold rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2"
                                >
                                    <FiCheck className="w-5 h-5" />
                                    Close
                                </button>
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

                            {/* Financial Summary */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <div className="text-xs text-blue-600 font-medium mb-1">Total</div>
                                    <div className="text-lg font-bold text-blue-700">{formatCurrency(pytotal || 0)}</div>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <div className="text-xs text-green-600 font-medium mb-1">Paid</div>
                                    <div className="text-lg font-bold text-green-700">{formatCurrency(pbpaid || 0)}</div>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                    <div className="text-xs text-red-600 font-medium mb-1">Due</div>
                                    <div className="text-lg font-bold text-red-700">{formatCurrency(pbdue || 0)}</div>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payable Date</label>
                                    <input
                                        type="date"
                                        value={payableDate}
                                        onChange={(e) => setPayableDate(e.target.value)}
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
                                                    setPartialAmount("");
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
                                                onChange={() => setPaymentType("partial")}
                                                className="w-4 h-4 text-custom-red border-gray-300 focus:ring-custom-red"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">Partial Payment</span>
                                        </label>
                                    </div>
                                </div>

                                {paymentType === "partial" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Partial Amount</label>
                                        <input
                                            type="number"
                                            value={partialAmount}
                                            onChange={handlePartialAmountChange}
                                            min="0"
                                            max={pbdue || pytotal}
                                            placeholder="₹0.00"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-custom-red focus:border-transparent"
                                        />
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
                                    disabled={!paymentMethod || (paymentType === "partial" && !partialAmount)}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-custom-red to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiDollarSign className="w-5 h-5" />
                                    Process Payment
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PayablePaymentModal;