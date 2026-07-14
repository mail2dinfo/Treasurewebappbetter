import { API_BASE_URL } from './apiConfig';

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const fetchReceiptsByReceivableId = async (receivableId, token) => {
  if (!receivableId || !token) {
    return { receipts: [], totalPaid: 0, pendingAmount: 0, receivableAmount: 0, fromApi: false };
  }

  const response = await fetch(
    `${API_BASE_URL}/receipts/receivable/${encodeURIComponent(receivableId)}`,
    { headers: authHeaders(token) }
  );

  if (response.status === 404) {
    return { receipts: null, fromApi: false, apiUnavailable: true };
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Failed to fetch payment history (${response.status})`);
  }

  const data = await response.json();
  const results = data.results || {};

  return {
    receipts: results.receipts || [],
    totalPaid: parseFloat(results.totalPaid || 0),
    pendingAmount: parseFloat(results.pendingAmount || 0),
    receivableAmount: parseFloat(results.receivableAmount || 0),
    receiptCount: results.receiptCount || 0,
    fromApi: true,
  };
};

export const fetchUserReceivableById = async (receivableId, token) => {
  if (!receivableId || !token) return null;

  const response = await fetch(`${API_BASE_URL}/receivables`, {
    headers: authHeaders(token),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return (data.results?.receivablesResult || []).find(
    (item) => String(item.id) === String(receivableId)
  ) || null;
};

export const fetchCollectorReceivableById = async (receivableId, token, collectorId) => {
  if (!receivableId || !token || !collectorId) return null;

  const response = await fetch(`${API_BASE_URL}/collector-area/${collectorId}/receivables`, {
    headers: authHeaders(token),
  });

  if (!response.ok) return null;

  const data = await response.json();
  return (data.results?.receivables || []).find(
    (item) => String(item.id) === String(receivableId)
  ) || null;
};

export const mergeReceivableWithReceiptHistory = (receivable, receiptHistory) => {
  if (!receivable) return receivable;

  const merged = {
    ...receivable,
    payments: receiptHistory.receipts || [],
    rbpaid: receiptHistory.totalPaid ?? receivable.rbpaid,
    rbdue: receiptHistory.pendingAmount ?? receivable.rbdue,
  };

  if (receiptHistory.receivableAmount > 0) {
    merged.rbtotal = receiptHistory.receivableAmount;
  }

  return merged;
};

export const refreshReceivableForConfirm = async ({
  receivable,
  token,
  mode = 'user',
  collectorId,
}) => {
  if (!token || !receivable?.id) {
    return { receivable, usedFallback: true };
  }

  let receiptHistory = null;
  try {
    receiptHistory = await fetchReceiptsByReceivableId(receivable.id, token);
  } catch (error) {
    console.warn('Receipt history API unavailable, using list data:', error);
  }

  const listReceivable = mode === 'collector'
    ? await fetchCollectorReceivableById(receivable.id, token, collectorId)
    : await fetchUserReceivableById(receivable.id, token);

  const baseReceivable = listReceivable || receivable;

  if (receiptHistory?.fromApi) {
    return {
      receivable: mergeReceivableWithReceiptHistory(baseReceivable, receiptHistory),
      usedFallback: false,
    };
  }

  return { receivable: baseReceivable, usedFallback: true };
};
