const TICKET_TYPES = new Set(['ADAPTIVE']);

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const usesTicketCapacity = (groupType) =>
  TICKET_TYPES.has(String(groupType || '').toUpperCase());

export const filledTicketUnits = (subscribers = [], groupAmount) => {
  const amountSum = subscribers.reduce(
    (sum, row) => sum + toNumber(row.accountshare_amount),
    0
  );
  if (toNumber(groupAmount) > 0 && amountSum > 0) {
    return amountSum / toNumber(groupAmount);
  }
  const pctSum = subscribers.reduce(
    (sum, row) => sum + toNumber(row.accountshare_percentage),
    0
  );
  if (pctSum > 0) return pctSum / 100;
  return subscribers.length;
};

export const getRosterFill = ({
  groupType,
  subscribers = [],
  groupAmount,
  capacity,
}) => {
  const peopleCount = subscribers.length;
  const type = String(groupType || '').toUpperCase();
  const unlimited = type === 'FLEXIBLE';
  const cap = toNumber(capacity);
  const ticketMode = usesTicketCapacity(type);
  const filled = ticketMode
    ? filledTicketUnits(subscribers, groupAmount)
    : peopleCount;
  const remaining = unlimited ? null : Math.max(0, cap - filled);
  const complete = !unlimited && cap > 0 && remaining < 0.01;
  return {
    ticketMode,
    unlimited,
    peopleCount,
    filledTickets: filled,
    remainingTickets: remaining,
    capacity: cap,
    complete,
    displayFilled: Math.round(filled * 100) / 100,
    displayRemaining: remaining == null ? null : Math.round(remaining * 100) / 100,
  };
};
