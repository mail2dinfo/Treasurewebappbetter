/** Product sell / stock units for Mutton Stall */
export const MS_PRODUCT_UNITS = [
  { value: 'kg', label: 'kg (weight)', step: '0.001', qtyStep: 0.5 },
  { value: 'g', label: 'g (grams)', step: '1', qtyStep: 50 },
  { value: 'nos', label: 'nos (number / pieces)', step: '1', qtyStep: 1 },
  { value: 'pcs', label: 'pcs (pieces)', step: '1', qtyStep: 1 },
];

export const isCountUnit = (unit) => {
  const u = String(unit || '').toLowerCase();
  return u === 'nos' || u === 'pcs' || u === 'no' || u === 'number' || u === 'piece' || u === 'pieces';
};

export const unitMeta = (unit) => (
  MS_PRODUCT_UNITS.find((u) => u.value === String(unit || '').toLowerCase())
  || (isCountUnit(unit) ? MS_PRODUCT_UNITS.find((u) => u.value === 'nos') : MS_PRODUCT_UNITS[0])
);

export const formatUnitLabel = (unit) => {
  const u = String(unit || 'kg').toLowerCase();
  if (u === 'nos' || u === 'no' || u === 'number') return 'nos';
  if (u === 'pcs' || u === 'piece' || u === 'pieces') return 'pcs';
  return u || 'kg';
};
