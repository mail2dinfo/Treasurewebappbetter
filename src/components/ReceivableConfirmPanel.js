import React from 'react';

export const getPaymentsList = (receivable) => {
  if (!receivable?.payments) return [];
  if (Array.isArray(receivable.payments)) return receivable.payments;
  if (typeof receivable.payments === 'string') {
    try {
      return JSON.parse(receivable.payments);
    } catch {
      return [];
    }
  }
  return [];
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getPaymentCollectorName = (payment) => {
  if (!payment) return 'Unknown';

  const directName = (payment.user_name || payment.name || '').trim();
  if (directName) return directName;

  const fromParts = [payment.firstname, payment.lastname]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fromParts) return fromParts;

  return 'Unknown';
};

export const ReceivablePaymentHistoryTable = ({
  receivable,
  payments = null,
  formatCurrency,
  compact = false,
}) => {
  const paymentsList = [...(payments || getPaymentsList(receivable))].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime();
    const dateB = new Date(b.created_at || 0).getTime();
    return dateA - dateB;
  });
  const alreadyPaid = parseFloat(receivable?.rbpaid || 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} bg-gray-100 border-b border-gray-200`}>
        <h4 className="text-sm font-semibold text-gray-900">
          Payment History — {paymentsList.length} {paymentsList.length === 1 ? 'entry' : 'entries'}
        </h4>
        {!compact && (
          <p className="text-xs text-gray-500 mt-1">
            Each row is a separate receipt. Multiple rows are normal for partial payments.
          </p>
        )}
      </div>
      {paymentsList.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 font-semibold text-gray-600">#</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Billno</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Date & Time</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Collected By</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Method</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Type</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {paymentsList.map((payment, index) => (
                <tr key={payment.id || index} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-600">{index + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">{payment.id ?? '-'}</td>
                  <td className="px-3 py-2 text-gray-700">{formatDateTime(payment.created_at)}</td>
                  <td className="px-3 py-2 text-gray-800">{getPaymentCollectorName(payment)}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {[payment.payment_method, payment.payable_code].filter(Boolean).join(' / ') || '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{payment.payment_type || '-'}</td>
                  <td className="px-3 py-2 font-semibold text-green-700">
                    {formatCurrency(payment.payment_amount || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td colSpan={6} className="px-3 py-2 font-semibold text-gray-800 text-right">
                  Total paid so far ({paymentsList.length} {paymentsList.length === 1 ? 'receipt' : 'receipts'})
                </td>
                <td className="px-3 py-2 font-bold text-green-800">
                  {formatCurrency(alreadyPaid)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <p className="px-4 py-6 text-sm text-gray-500 text-center">No payments recorded yet for this receivable.</p>
      )}
    </div>
  );
};

export const ReceivableLiveBalancePanel = ({
  receivable,
  formatCurrency,
  isRefreshing = false,
}) => {
  const receivableTotal = parseFloat(receivable?.rbtotal || 0);
  const alreadyPaid = parseFloat(receivable?.rbpaid || 0);
  const pendingBalance = parseFloat(receivable?.rbdue || 0);

  return (
    <div className="space-y-4">
      {isRefreshing && (
        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          Loading latest paid and due amounts from database…
        </div>
      )}

      <div className={`grid grid-cols-3 gap-4 ${isRefreshing ? 'opacity-60' : ''}`}>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-600 font-medium mb-1">Total</div>
          <div className="text-lg font-bold text-blue-700">{formatCurrency(receivableTotal)}</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-xs text-green-600 font-medium mb-1">Paid</div>
          <div className="text-lg font-bold text-green-700">{formatCurrency(alreadyPaid)}</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-xs text-red-600 font-medium mb-1">Due</div>
          <div className="text-lg font-bold text-red-700">{formatCurrency(pendingBalance)}</div>
        </div>
      </div>

      <ReceivablePaymentHistoryTable
        receivable={receivable}
        formatCurrency={formatCurrency}
        compact
      />

      {!isRefreshing && pendingBalance <= 0 && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          This receivable appears fully paid. Refresh the list or choose another record.
        </div>
      )}
    </div>
  );
};

const ReceivableConfirmPanel = ({
  receivable,
  payments = null,
  name,
  group_name,
  auct_date,
  receivableDate,
  paymentMethod,
  paymentType,
  formatDate,
  formatCurrency,
  parsedPartialAmount,
  advanceApplied,
  useGroupAdvance,
  balanceAdvance,
  pendingNow,
  remainingDue,
  isRefreshing = false,
}) => {
  const receivableTotal = parseFloat(receivable?.rbtotal || 0);
  const alreadyPaid = parseFloat(receivable?.rbpaid || 0);
  const pendingBalance = parseFloat(receivable?.rbdue ?? pendingNow ?? 0);

  const cashAmount = paymentType === 'full'
    ? pendingBalance
    : parseFloat(parsedPartialAmount || 0);
  const advanceAmount = useGroupAdvance ? parseFloat(advanceApplied || 0) : 0;
  const totalThisPayment = cashAmount + advanceAmount;
  const towardDue = Math.min(totalThisPayment, pendingBalance);
  const excessToAdvance = Math.max(0, totalThisPayment - pendingBalance);

  return (
    <div className="space-y-4">
      {isRefreshing && (
        <div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          Refreshing payment history from database…
        </div>
      )}

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
          <span className="text-gray-600">Receivable Date:</span>
          <span className="font-semibold">{formatDate(receivableDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Payment Method:</span>
          <span className="font-semibold">{paymentMethod}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Payment Type:</span>
          <span className="font-semibold">{paymentType === 'full' ? 'Full Payment' : 'Partial Payment'}</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Balance Summary (from database)</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Receivable Total</span>
            <span className="font-semibold text-blue-700">{formatCurrency(receivableTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Already Paid</span>
            <span className="font-semibold text-green-700">{formatCurrency(alreadyPaid)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className="text-gray-800 font-medium">Pending Balance (now)</span>
            <span className="font-bold text-red-700">{formatCurrency(pendingBalance)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">This payment (toward due)</span>
            <span className="font-semibold text-orange-700">{formatCurrency(towardDue)}</span>
          </div>
          {excessToAdvance > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Excess → Advance</span>
              <span className="font-semibold text-yellow-700">{formatCurrency(excessToAdvance)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-100 pt-2">
            <span className="text-gray-800 font-medium">Pending After Payment</span>
            <span className="font-bold text-red-700">{formatCurrency(remainingDue)}</span>
          </div>
          {useGroupAdvance && (
            <div className="flex justify-between">
              <span className="text-gray-600">Advance Balance After</span>
              <span className="font-semibold text-blue-700">{formatCurrency(balanceAdvance)}</span>
            </div>
          )}
        </div>
      </div>

      <ReceivablePaymentHistoryTable
        receivable={receivable}
        payments={payments}
        formatCurrency={formatCurrency}
      />

      {pendingBalance <= 0 && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          This receivable appears fully paid. A new payment would be treated as duplicate unless backend allows excess to advance.
        </div>
      )}

      {totalThisPayment > pendingBalance && pendingBalance > 0 && (
        <div className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          Payment exceeds pending balance. {formatCurrency(towardDue)} will apply to this receivable
          {excessToAdvance > 0 ? ` and ${formatCurrency(excessToAdvance)} will go to advance.` : '.'}
        </div>
      )}
    </div>
  );
};

export default ReceivableConfirmPanel;
