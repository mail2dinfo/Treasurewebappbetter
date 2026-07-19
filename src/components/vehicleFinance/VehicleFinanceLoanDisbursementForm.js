import React, { useState, useEffect, useMemo } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiCheck, FiUser, FiPhone } from 'react-icons/fi';
import { useVehicleFinanceContext } from '../../context/vehicleFinance/VehicleFinanceContext';
import { useUserContext } from '../../context/user_context';
import VehicleFinanceLoanAgreementPanel from './VehicleFinanceLoanAgreementPanel';
import VehiclePreviewAnimation from './VehiclePreviewAnimation';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getInstallmentCount = (repaymentMode, totalInstallments) =>
    repaymentMode === 'ADHOC' ? 1 : parseInt(totalInstallments, 10) || 1;

/**
 * Flat interest (Scenario 1 — Per year): Interest = P × rate% × years, years = installments ÷ 12
 * Flat interest (Scenario 2 — Per month, Option A): Interest = P × rate% × installments
 */
const computeFlatInterest = ({ loanAmount, interestRate, interestPeriod, repaymentMode, totalInstallments }) => {
    const principal = parseFloat(loanAmount) || 0;
    const rate = parseFloat(interestRate) || 0;
    if (!principal || !rate) return 0;

    const installments = getInstallmentCount(repaymentMode, totalInstallments);

    if (interestPeriod === 'PER_YEAR') {
        if (repaymentMode === 'MONTHLY') {
            return principal * (rate / 100) * (installments / 12);
        }
        if (repaymentMode === 'DAILY') {
            return principal * (rate / 100) * (installments / 365);
        }
        return principal * (rate / 100);
    }

    // PER_MONTH — monthly flat on full principal each period
    if (repaymentMode === 'DAILY') {
        return principal * (rate / 100) * installments;
    }
    return principal * (rate / 100) * installments;
};

const computeEmi = ({ loanAmount, interestRate, interestPeriod, repaymentMode, totalInstallments }) => {
    const principal = parseFloat(loanAmount) || 0;
    if (!principal) return 0;

    const interest = computeFlatInterest({
        loanAmount,
        interestRate,
        interestPeriod,
        repaymentMode,
        totalInstallments,
    });
    const totalRepay = principal + interest;
    const installments = getInstallmentCount(repaymentMode, totalInstallments);
    if (!installments) return 0;

    return Math.round((totalRepay / installments) * 100) / 100;
};

const getSubscriberPhotoUrl = (subscriber) =>
    subscriber?.vf_cust_photo_s3_image ||
    subscriber?.vf_cust_photo_base64format ||
    subscriber?.vf_cust_photo ||
    null;

const Field = ({ label, required, error, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
);

const VehicleSummaryPanel = ({ form, subscribers, onEdit }) => {
    const [photoError, setPhotoError] = useState(false);
    const subscriber = subscribers.find((s) => s.vf_cust_id === form.subscriberId);
    const vehicleTypeLabel =
        form.vehicleType === 'TWO_WHEELER' ? 'Two Wheeler' : 'Four Wheeler';

    const photoUrl = getSubscriberPhotoUrl(subscriber);

    useEffect(() => {
        setPhotoError(false);
    }, [form.subscriberId, photoUrl]);

    const rows = [
        { label: 'Vehicle type', value: vehicleTypeLabel },
        { label: 'Make / Model', value: [form.vehicleMake, form.vehicleModel].filter(Boolean).join(' ') || '—' },
        { label: 'Vehicle number', value: form.vehicleNumber || '—' },
        { label: 'Chassis', value: form.chassisNumber || '—' },
    ];

    return (
        <aside className="bg-gray-50 border border-gray-200 rounded-xl p-4 h-fit lg:sticky lg:top-0">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Step 1</p>
                    <h3 className="text-sm font-bold text-gray-900">Vehicle details checkpoint</h3>
                </div>
                {onEdit && (
                    <button
                        type="button"
                        onClick={onEdit}
                        className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
                    >
                        Edit
                    </button>
                )}
            </div>

            {/* Subscriber photo, name & mobile */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <div className="w-16 h-16 rounded-full border-2 border-red-200 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                    {photoUrl && !photoError ? (
                        <img
                            src={photoUrl}
                            alt={subscriber?.vf_cust_name || 'Subscriber'}
                            className="w-full h-full object-cover"
                            onError={() => setPhotoError(true)}
                        />
                    ) : (
                        <FiUser className="w-8 h-8 text-gray-400" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">
                        {subscriber?.vf_cust_name || '—'}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                        <FiPhone className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{subscriber?.vf_cust_phone || 'No mobile'}</span>
                    </p>
                </div>
            </div>

            <dl className="space-y-2.5">
                {rows.map(({ label, value, highlight }) => (
                    <div key={label} className="flex flex-col sm:flex-row sm:justify-between sm:gap-3 text-sm">
                        <dt className="text-gray-500 shrink-0">{label}</dt>
                        <dd className={`font-medium text-gray-900 text-right break-words ${highlight ? 'text-green-700' : ''}`}>
                            {value}
                        </dd>
                    </div>
                ))}
            </dl>
        </aside>
    );
};

const VehicleFinanceLoanDisbursementForm = ({ onClose, onSuccess }) => {
    const {
        subscribers,
        disburseLoan,
        fetchSubscribers,
        fetchLedgerAccounts,
        fetchCompanies,
        ledgerAccounts,
        companies,
    } = useVehicleFinanceContext();
    const { user } = useUserContext();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [search, setSearch] = useState('');
    const [generatedReceivables, setGeneratedReceivables] = useState([]);
    const [disbursedResult, setDisbursedResult] = useState(null);

    const [form, setForm] = useState({
        subscriberId: '',
        vehicleType: 'TWO_WHEELER',
        chassisNumber: '',
        vehicleMake: '',
        vehicleModel: '',
        vehicleNumber: '',
        loanAmount: '',
        interestRate: '',
        interestPeriod: 'PER_MONTH',
        loanDisbursementDate: new Date().toISOString().split('T')[0],
        loanFirstDueDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        tenureMode: 'MONTHLY',
        repaymentMode: 'MONTHLY',
        paymentType: 'EMI',
        paymentMethod: '',
        totalInstallments: '12',
        excludeDays: [],
    });

    useEffect(() => {
        fetchSubscribers();
        fetchLedgerAccounts();
        fetchCompanies();
    }, [fetchSubscribers, fetchLedgerAccounts, fetchCompanies]);

    const selectedSubscriber = useMemo(
        () => subscribers.find((s) => s.vf_cust_id === form.subscriberId),
        [subscribers, form.subscriberId]
    );

    const interestAmount = useMemo(
        () =>
            Math.round(
                computeFlatInterest({
                    loanAmount: form.loanAmount,
                    interestRate: form.interestRate,
                    interestPeriod: form.interestPeriod,
                    repaymentMode: form.repaymentMode,
                    totalInstallments: form.totalInstallments,
                }) * 100
            ) / 100,
        [
            form.loanAmount,
            form.interestRate,
            form.interestPeriod,
            form.repaymentMode,
            form.totalInstallments,
        ]
    );

    const totalRepay = useMemo(() => {
        const loan = parseFloat(form.loanAmount) || 0;
        return loan + interestAmount;
    }, [form.loanAmount, interestAmount]);

    const emiAmount = useMemo(
        () =>
            computeEmi({
                loanAmount: form.loanAmount,
                interestRate: form.interestRate,
                interestPeriod: form.interestPeriod,
                repaymentMode: form.repaymentMode,
                totalInstallments: form.totalInstallments,
            }),
        [
            form.loanAmount,
            form.interestRate,
            form.interestPeriod,
            form.repaymentMode,
            form.totalInstallments,
        ]
    );

    const filteredSubscribers = subscribers.filter((s) => {
        const q = search.toLowerCase();
        return (
            (s.vf_cust_name || '').toLowerCase().includes(q) ||
            (s.vf_cust_phone || '').includes(q)
        );
    });

    const setField = (name, value) => {
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const toggleExcludeDay = (day) => {
        setForm((prev) => ({
            ...prev,
            excludeDays: prev.excludeDays.includes(day)
                ? prev.excludeDays.filter((d) => d !== day)
                : [...prev.excludeDays, day],
        }));
    };

    const generateSchedule = () => {
        const total = totalRepay;
        const installments = getInstallmentCount(form.repaymentMode, form.totalInstallments);
        const schedule = [];
        let balance = total;
        const date = new Date(form.loanFirstDueDate);

        for (let i = 0; i < installments; i++) {
            const dueDate = new Date(date);
            if (form.repaymentMode === 'DAILY') {
                if (i > 0) dueDate.setDate(dueDate.getDate() + i);
                while (form.excludeDays.includes(dueDate.getDay())) {
                    dueDate.setDate(dueDate.getDate() + 1);
                }
            } else if (form.repaymentMode === 'MONTHLY') {
                if (i > 0) dueDate.setMonth(dueDate.getMonth() + i);
            }

            const isLast = i === installments - 1;
            const due = form.repaymentMode === 'ADHOC'
                ? total
                : isLast
                    ? Math.round(balance * 100) / 100
                    : emiAmount;
            const closing = Math.max(0, balance - due);
            schedule.push({
                due_date: dueDate.toISOString().split('T')[0],
                opening_balance: balance.toFixed(2),
                due_amount: due.toFixed(2),
                carry_forward: 0,
                closing_balance: closing.toFixed(2),
            });
            balance = closing;
        }
        setGeneratedReceivables(schedule);
        setStep(3);
    };

    const validateStep1 = () => {
        const e = {};
        if (!form.subscriberId) e.subscriberId = 'Please select a subscriber';
        if (form.chassisNumber?.trim()) {
            const chassis = form.chassisNumber.trim();
            if (chassis.length < 5 || chassis.length > 25) {
                e.chassisNumber = 'Chassis number should be 5–25 characters';
            }
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const validateStep2 = () => {
        const e = {};
        if (!form.loanAmount || parseFloat(form.loanAmount) <= 0) {
            e.loanAmount = 'Please enter a valid loan amount';
        }
        if (!form.loanDisbursementDate) {
            e.loanDisbursementDate = 'Please select loan disbursement date';
        }
        if (!form.loanFirstDueDate) {
            e.loanFirstDueDate = 'Please select first due date';
        }
        if (form.loanDisbursementDate && form.loanFirstDueDate) {
            if (new Date(form.loanFirstDueDate) < new Date(form.loanDisbursementDate)) {
                e.loanFirstDueDate = 'First due date must be on or after disbursement date';
            }
        }
        if (!form.paymentMethod) {
            e.paymentMethod = ledgerAccounts.length === 0
                ? 'No ledger accounts found — add accounts in Ledger first'
                : 'Please select disbursement account';
        }
        if (form.repaymentMode !== 'ADHOC' && (!form.totalInstallments || parseInt(form.totalInstallments, 10) < 1)) {
            e.totalInstallments = 'Enter valid number of installments';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (step === 1) {
            if (validateStep1()) setStep(2);
            return;
        }
        if (step === 2 && validateStep2()) {
            generateSchedule();
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const membershipId =
                user?.results?.userAccounts?.[0]?.parent_membership_id ??
                user?.results?.membershipId;

            const payload = {
                membershipId,
                subscriberId: form.subscriberId,
                vehicleType: form.vehicleType,
                chassisNumber: form.chassisNumber?.trim() || '',
                vehicleMake: form.vehicleMake,
                vehicleModel: form.vehicleModel,
                vehicleNumber: form.vehicleNumber?.trim().toUpperCase() || '',
                loanAmount: parseFloat(form.loanAmount),
                interestAmount,
                totalRepayAmount: totalRepay,
                interestRate: parseFloat(form.interestRate || 0),
                tenureMode: form.tenureMode,
                repaymentMode: form.repaymentMode,
                paymentType: form.paymentType,
                paymentMethod: form.paymentMethod,
                excludeDays: form.excludeDays,
                totalInstallments: getInstallmentCount(form.repaymentMode, form.totalInstallments),
                installmentAmount: emiAmount || totalRepay,
                cashInHand: parseFloat(form.loanAmount),
                loanDisbursementDate: form.loanDisbursementDate,
                loanFirstDueDate: form.loanFirstDueDate,
                receivables: generatedReceivables,
            };

            const result = await disburseLoan(payload);
            if (result.success) {
                setDisbursedResult(result.data);
                setStep(4);
            } else {
                setErrors({ submit: result.error || 'Failed to disburse loan' });
            }
        } catch (err) {
            setErrors({ submit: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        onSuccess?.(disbursedResult);
        onClose?.();
    };

    const inputClass = (field) =>
        `w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent ${
            errors[field] ? 'border-red-500' : 'border-gray-300'
        }`;

    const disbursedLoan = disbursedResult?.loan;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className={`bg-white rounded-xl shadow-2xl w-full max-h-[95vh] overflow-y-auto ${step === 2 || step === 3 || step === 4 ? 'max-w-5xl' : 'max-w-3xl'}`}>
                <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Disburse Vehicle Loan</h2>
                        <p className="text-sm text-gray-500">Step {step} of 4</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-4 sm:px-6 py-4">
                    {errors.submit && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">{errors.submit}</div>
                    )}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Step 1</p>
                                <h3 className="text-base font-bold text-gray-900">Vehicle details</h3>
                            </div>

                            <Field label="Search subscriber">
                                <input
                                    className={inputClass()}
                                    placeholder="Search by name or phone"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </Field>

                            <Field label="Subscriber" required error={errors.subscriberId}>
                                <select
                                    className={inputClass('subscriberId')}
                                    value={form.subscriberId}
                                    onChange={(e) => setField('subscriberId', e.target.value)}
                                >
                                    <option value="">Select subscriber</option>
                                    {filteredSubscribers.map((s) => (
                                        <option key={s.vf_cust_id} value={s.vf_cust_id}>
                                            {s.vf_cust_name} — {s.vf_cust_phone || 'No phone'}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Vehicle type">
                                <div className="flex flex-wrap gap-4 mt-1">
                                    {['TWO_WHEELER', 'FOUR_WHEELER'].map((t) => (
                                        <label key={t} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                checked={form.vehicleType === t}
                                                onChange={() => setField('vehicleType', t)}
                                            />
                                            {t === 'TWO_WHEELER' ? 'Two Wheeler' : 'Four Wheeler'}
                                        </label>
                                    ))}
                                </div>
                            </Field>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Chassis number" error={errors.chassisNumber}>
                                    <input
                                        className={inputClass('chassisNumber')}
                                        placeholder="Optional"
                                        value={form.chassisNumber}
                                        onChange={(e) => setField('chassisNumber', e.target.value.toUpperCase())}
                                    />
                                </Field>
                                <Field label="Vehicle make">
                                    <input
                                        className={inputClass()}
                                        placeholder="e.g. Honda"
                                        value={form.vehicleMake}
                                        onChange={(e) => setField('vehicleMake', e.target.value)}
                                    />
                                </Field>
                                <Field label="Vehicle model">
                                    <input
                                        className={inputClass()}
                                        placeholder="e.g. Activa"
                                        value={form.vehicleModel}
                                        onChange={(e) => setField('vehicleModel', e.target.value)}
                                    />
                                </Field>
                                <Field label="Vehicle number">
                                    <input
                                        className={inputClass()}
                                        placeholder="e.g. TN01AB1234"
                                        value={form.vehicleNumber}
                                        onChange={(e) => setField('vehicleNumber', e.target.value.toUpperCase())}
                                    />
                                </Field>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
                            {/* Step 2 form — loan details (~60% on desktop) */}
                            <div className="w-full lg:w-[60%] space-y-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Step 2</p>
                                    <h3 className="text-base font-bold text-gray-900">Loan details</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Field label="Loan amount" required error={errors.loanAmount}>
                                        <input
                                            type="number"
                                            min="1"
                                            className={inputClass('loanAmount')}
                                            placeholder="Enter loan amount"
                                            value={form.loanAmount}
                                            onChange={(e) => setField('loanAmount', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Int %" error={errors.interestRate}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className={inputClass('interestRate')}
                                            placeholder="0"
                                            value={form.interestRate}
                                            onChange={(e) => setField('interestRate', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Interest basis">
                                        <select
                                            className={inputClass()}
                                            value={form.interestPeriod}
                                            onChange={(e) => setField('interestPeriod', e.target.value)}
                                        >
                                            <option value="PER_YEAR">Per year</option>
                                            <option value="PER_MONTH">Per month</option>
                                        </select>
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Field label="Repayment mode">
                                        <select
                                            className={inputClass()}
                                            value={form.repaymentMode}
                                            onChange={(e) => {
                                                setField('repaymentMode', e.target.value);
                                                setField('tenureMode', e.target.value);
                                            }}
                                        >
                                            <option value="ADHOC">Adhoc</option>
                                            <option value="MONTHLY">Monthly</option>
                                            <option value="DAILY">Daily</option>
                                        </select>
                                    </Field>
                                    <Field
                                        label="Total installments"
                                        required={form.repaymentMode !== 'ADHOC'}
                                        error={errors.totalInstallments}
                                    >
                                        <input
                                            type="number"
                                            min="1"
                                            className={inputClass('totalInstallments')}
                                            value={form.repaymentMode === 'ADHOC' ? '1' : form.totalInstallments}
                                            readOnly={form.repaymentMode === 'ADHOC'}
                                            onChange={(e) => setField('totalInstallments', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="EMI">
                                        <input
                                            readOnly
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 font-semibold text-blue-700"
                                            value={emiAmount ? `₹${emiAmount.toLocaleString('en-IN')}` : '—'}
                                        />
                                    </Field>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Field label="Interest amount">
                                        <input
                                            readOnly
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-800"
                                            value={`₹${interestAmount.toLocaleString('en-IN')}`}
                                        />
                                    </Field>
                                    <Field label="Total repay amount">
                                        <input
                                            readOnly
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 font-semibold text-green-700"
                                            value={`₹${totalRepay.toLocaleString('en-IN')}`}
                                        />
                                    </Field>
                                    <Field label="Loan disbursement date" required error={errors.loanDisbursementDate}>
                                        <input
                                            type="date"
                                            className={inputClass('loanDisbursementDate')}
                                            value={form.loanDisbursementDate}
                                            onChange={(e) => setField('loanDisbursementDate', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="First due date" required error={errors.loanFirstDueDate}>
                                        <input
                                            type="date"
                                            className={inputClass('loanFirstDueDate')}
                                            value={form.loanFirstDueDate}
                                            onChange={(e) => setField('loanFirstDueDate', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Payment type">
                                        <select
                                            className={inputClass()}
                                            value={form.paymentType}
                                            onChange={(e) => setField('paymentType', e.target.value)}
                                        >
                                            <option value="EMI">EMI</option>
                                            <option value="CASH">Cash</option>
                                            <option value="UPI">UPI</option>
                                        </select>
                                    </Field>
                                    <Field label="Disbursement account" required error={errors.paymentMethod}>
                                        <select
                                            className={inputClass('paymentMethod')}
                                            value={form.paymentMethod}
                                            onChange={(e) => setField('paymentMethod', e.target.value)}
                                        >
                                            <option value="">Select ledger account</option>
                                            {ledgerAccounts.map((a) => (
                                                <option key={a.id} value={a.account_name}>
                                                    {a.account_name}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                                {form.repaymentMode === 'DAILY' && (
                                    <div>
                                        <p className="text-sm font-medium mb-2">Exclude days</p>
                                        <div className="flex flex-wrap gap-2">
                                            {WEEKDAYS.map((d, i) => (
                                                <button
                                                    type="button"
                                                    key={d}
                                                    onClick={() => toggleExcludeDay(i)}
                                                    className={`px-3 py-1 rounded-full text-sm ${
                                                        form.excludeDays.includes(i)
                                                            ? 'bg-red-600 text-white'
                                                            : 'bg-gray-100'
                                                    }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Step 1 vehicle summary — ~40% on desktop (checkpoint) */}
                            <div className="w-full lg:w-[40%]">
                                <VehicleSummaryPanel
                                    form={form}
                                    subscribers={subscribers}
                                    onEdit={() => setStep(1)}
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">Step 3</p>
                                <h3 className="text-base font-bold text-gray-900">Preview &amp; submit</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Review the loan summary and repayment schedule before disbursement.
                                </p>
                            </div>

                            <VehiclePreviewAnimation vehicleType={form.vehicleType} />

                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <div className="h-1 w-16 bg-red-600 rounded-full mb-4" />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
                                    <div>
                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Vehicle</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            {[form.vehicleMake, form.vehicleModel].filter(Boolean).join(' ') || '—'}
                                        </p>
                                        <p className="text-sm font-medium text-gray-600">
                                            {form.vehicleNumber || 'No reg. number'} ·{' '}
                                            {form.vehicleType === 'TWO_WHEELER' ? 'Two Wheeler' : 'Four Wheeler'}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-gray-500 text-xs uppercase tracking-wide">Loan amount</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            ₹{parseFloat(form.loanAmount || 0).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                                        <p className="text-gray-500 text-xs">Interest</p>
                                        <p className="font-bold text-gray-900">
                                            {form.interestRate || '0'}% · ₹{interestAmount.toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                                        <p className="text-gray-500 text-xs">Total repay</p>
                                        <p className="font-bold text-gray-900">₹{totalRepay.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                                        <p className="text-gray-500 text-xs">EMI</p>
                                        <p className="font-bold text-gray-900">₹{emiAmount.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                                        <p className="text-gray-500 text-xs">Installments</p>
                                        <p className="font-bold text-gray-900">{generatedReceivables.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-gray-500 text-xs font-semibold uppercase">Disbursement date</p>
                                    <p className="font-bold text-gray-900">{form.loanDisbursementDate}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-gray-500 text-xs font-semibold uppercase">First due date</p>
                                    <p className="font-bold text-gray-900">{form.loanFirstDueDate}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-gray-500 text-xs font-semibold uppercase">Repayment mode</p>
                                    <p className="font-bold text-gray-900">{form.repaymentMode}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    <p className="text-gray-500 text-xs font-semibold uppercase">Interest basis</p>
                                    <p className="font-bold text-gray-900">
                                        {form.interestPeriod === 'PER_YEAR' ? 'Per year' : 'Per month'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Repayment schedule</h4>
                                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-700">
                                            <tr>
                                                <th className="p-2.5 text-left font-medium">#</th>
                                                <th className="p-2.5 text-left font-medium">Due date</th>
                                                <th className="p-2.5 text-right font-medium">Due</th>
                                                <th className="p-2.5 text-right font-medium">Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white">
                                            {generatedReceivables.map((r, i) => (
                                                <tr
                                                    key={i}
                                                    className={`border-t border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/60' : ''}`}
                                                >
                                                    <td className="p-2.5 text-gray-600">{i + 1}</td>
                                                    <td className="p-2.5 text-gray-900">{r.due_date}</td>
                                                    <td className="p-2.5 text-right font-semibold text-gray-900">
                                                        ₹{r.due_amount}
                                                    </td>
                                                    <td className="p-2.5 text-right text-gray-600">₹{r.closing_balance}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <p className="text-xs text-center text-gray-500">
                                Click <span className="font-semibold text-red-600">Approve &amp; Disburse</span> below to confirm.
                            </p>
                        </div>
                    )}

                    {step === 4 && disbursedLoan && (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-green-800 font-semibold flex items-center gap-2">
                                    <FiCheck className="w-5 h-5" />
                                    Loan disbursed successfully
                                </p>
                                <p className="text-sm text-green-700 mt-1">
                                    Loan ID: {disbursedLoan.id} · {generatedReceivables.length} installments created
                                </p>
                            </div>

                            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                                <h3 className="font-semibold text-red-800 mb-2">Loan Agreement</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Download the agreement, share via WhatsApp or email, then upload the signed copy.
                                </p>
                                <VehicleFinanceLoanAgreementPanel
                                    loan={disbursedLoan}
                                    subscriber={selectedSubscriber}
                                    receivables={generatedReceivables}
                                    company={companies?.[0]}
                                    onAgreementUploaded={(updated) => {
                                        if (updated?.loan) {
                                            setDisbursedResult((prev) => ({
                                                ...prev,
                                                loan: { ...prev.loan, ...updated.loan },
                                            }));
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white border-t px-4 sm:px-6 py-4 flex justify-between">
                    {step > 1 && step < 4 ? (
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            className="flex items-center gap-1 px-4 py-2 border rounded-lg"
                        >
                            <FiChevronLeft /> Back
                        </button>
                    ) : (
                        <span />
                    )}
                    {step < 3 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Next <FiChevronRight />
                        </button>
                    ) : step === 3 ? (
                        <button
                            type="button"
                            disabled={loading}
                            onClick={handleSubmit}
                            className="flex items-center gap-1 px-5 py-2.5 bg-red-600 text-white rounded-lg disabled:opacity-50 hover:bg-red-700 shadow-md font-medium"
                        >
                            <FiCheck /> {loading ? 'Disbursing...' : 'Approve & Disburse'}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleFinish}
                            className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            <FiCheck /> Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VehicleFinanceLoanDisbursementForm;
