export const formatReceivableDueNo = (item) => {
  const n = Number(item?.due_number);
  const total = Number(item?.due_total);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (Number.isFinite(total) && total > 0) return `${n} / ${total}`;
  return String(n);
};
