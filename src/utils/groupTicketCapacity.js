const TICKET_TYPES = new Set(['ADAPTIVE']);

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const usesTicketCapacity = (groupType) =>
  TICKET_TYPES.has(String(groupType || '').toUpperCase());

/** Parse "1", "2A", "3B", "4C" into { n, suffix } for 1, 2, 3A, 3B, 4A… order. */
export const parseTicketId = (raw) => {
  const id = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/^TICKET\s+/, '');
  const match = id.match(/^(\d+)\s*([A-Z]*)$/);
  if (!match) {
    return { n: Number.MAX_SAFE_INTEGER, suffix: id, raw: id };
  }
  return { n: Number(match[1]), suffix: match[2] || '', raw: id };
};

export const compareTicketIds = (a, b) => {
  const left = parseTicketId(a);
  const right = parseTicketId(b);
  if (left.n !== right.n) return left.n - right.n;
  if (left.suffix !== right.suffix) {
    if (!left.suffix) return -1;
    if (!right.suffix) return 1;
    return left.suffix.localeCompare(right.suffix);
  }
  return String(left.raw).localeCompare(String(right.raw));
};

export const sortByTicketId = (items = []) =>
  [...items].sort((a, b) =>
    compareTicketIds(a?.accountshare_id, b?.accountshare_id)
  );

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
