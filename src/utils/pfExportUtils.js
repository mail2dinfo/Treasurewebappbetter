import { jsPDF } from 'jspdf';

const formatMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const periodFileSlug = (period, label) => {
  const base = label || period || 'report';
  return String(base).replace(/[^\w.-]+/g, '_');
};

const buildEntryRows = (entries = []) =>
  entries.map((txn, index) => ({
    '#': index + 1,
    Date: txn.txn_date || '',
    Type: txn.txn_type || '',
    Category: txn.category?.name || '',
    Account: txn.account?.name || '',
    Amount: formatMoney(txn.amount),
    Note: txn.note || '',
  }));

/**
 * Download Personal Finance entries as Excel-friendly CSV.
 */
export const downloadPfExcel = ({
  entries = [],
  totals = {},
  periodLabel = '',
  from = '',
  to = '',
}) => {
  if (!entries.length) {
    throw new Error('No entries to export for this period');
  }

  const rows = buildEntryRows(entries);
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const summaryLines = [
    ['Personal Finance Report'],
    ['Period', periodLabel],
    ['From', from],
    ['To', to],
    ...(Number(totals.opening) ? [['Opening balance', formatMoney(totals.opening)]] : []),
    ['Income', formatMoney(totals.income)],
    ['Spent', formatMoney(totals.expense)],
    ['Balance', formatMoney(totals.net)],
    [],
  ].map((line) => line.map(escapeCell).join(','));

  const tableLines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(',')),
  ];

  const csvContent = `\uFEFF${[...summaryLines, ...tableLines].join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `personal-finance-${periodFileSlug(periodLabel)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Download Personal Finance report as PDF.
 */
export const downloadPfPdf = ({
  entries = [],
  totals = {},
  periodLabel = '',
  from = '',
  to = '',
  expenseByCategory = [],
  byAccount = [],
}) => {
  if (!entries.length && !expenseByCategory.length && !byAccount.length) {
    throw new Error('No data to export for this period');
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  const ensureSpace = (needed = 10) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 16;
    }
  };

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Personal Finance Report', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Period: ${periodLabel || '-'}`, margin, y);
  y += 5;
  if (from || to) {
    doc.text(`Range: ${from || '-'} to ${to || '-'}`, margin, y);
    y += 5;
  }

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  if (Number(totals.opening)) {
    doc.text(`Opening: Rs ${formatMoney(totals.opening)}`, margin, y);
    y += 5;
  }
  doc.text(`Income:  Rs ${formatMoney(totals.income)}`, margin, y);
  y += 5;
  doc.text(`Spent:   Rs ${formatMoney(totals.expense)}`, margin, y);
  y += 5;
  doc.text(`Balance: Rs ${formatMoney(totals.net)}`, margin, y);
  y += 8;

  const drawSimpleTable = (title, headers, rows, colWidths) => {
    ensureSpace(16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, margin, y);
    y += 6;

    doc.setFontSize(8);
    let x = margin;
    doc.setFont('helvetica', 'bold');
    headers.forEach((h, i) => {
      doc.text(String(h), x, y);
      x += colWidths[i];
    });
    y += 2;
    doc.setDrawColor(180);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');

    if (!rows.length) {
      doc.text('No data', margin, y);
      y += 8;
      return;
    }

    rows.forEach((row) => {
      ensureSpace(7);
      let cx = margin;
      row.forEach((cell, i) => {
        const text = String(cell ?? '');
        doc.text(text.length > 28 ? `${text.slice(0, 26)}...` : text, cx, y);
        cx += colWidths[i];
      });
      y += 5;
    });
    y += 4;
  };

  drawSimpleTable(
    'Expense by Category',
    ['Category', 'Amount', '%'],
    expenseByCategory.map((c) => {
      const amt = Number(c.expense) || 0;
      const total = Number(totals.expense) || 0;
      const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
      return [c.name, formatMoney(amt), `${pct}%`];
    }),
    [70, 40, 20]
  );

  drawSimpleTable(
    'Expense by Account',
    ['Account', 'Amount', '%'],
    byAccount.map((a) => {
      const amt = Number(a.expense) || 0;
      const total = byAccount.reduce((s, x) => s + (Number(x.expense) || 0), 0);
      const pct = total > 0 ? Math.round((amt / total) * 100) : 0;
      return [a.name, formatMoney(amt), `${pct}%`];
    }),
    [70, 40, 20]
  );

  drawSimpleTable(
    'All Entries',
    ['#', 'Date', 'Type', 'Category', 'Account', 'Amount'],
    entries.map((txn, i) => [
      String(i + 1),
      txn.txn_date || '',
      txn.txn_type || '',
      txn.category?.name || '',
      txn.account?.name || '',
      formatMoney(txn.amount),
    ]),
    [10, 24, 20, 40, 40, 30]
  );

  doc.save(`personal-finance-${periodFileSlug(periodLabel)}.pdf`);
};
