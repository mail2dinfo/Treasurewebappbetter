import React from "react";
import { useLedgerEntryContext } from "../context/ledgerEntry_context";

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
};

const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

/** Highlight reversal / incorrect / correction entries in light red */
export const isFlaggedLedgerEntry = (entry) => {
  const text = `${entry?.description || ""} ${entry?.category || ""} ${entry?.sub_category || ""}`;
  return /reversal|incorrect|correction|wrong entry|reverse:/i.test(text);
};

const LedgerTable = ({ entries: propEntries }) => {
  const {
    ledgerEntries,
    isLoading,
    page,
    totalPages,
    totalCount,
    setPage,
    limit,
    setLimit,
  } = useLedgerEntryContext();

  const contextEntries = Array.isArray(ledgerEntries)
    ? ledgerEntries
    : (ledgerEntries?.results || []);
  const rawEntries = propEntries || contextEntries;
  const entries = Array.isArray(rawEntries) ? rawEntries : [];

  const totalCredit = entries
    .filter((entry) => entry.entry_type === "CREDIT")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const totalDebit = entries
    .filter((entry) => entry.entry_type === "DEBIT")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  if (isLoading) {
    return <div className="text-sm text-gray-500 py-4">Loading ledger entries...</div>;
  }

  if (!entries || entries.length === 0) {
    return <div className="text-sm text-gray-500 py-4">No ledger entries found.</div>;
  }

  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safePage = Math.max(1, Number(page) || 1);

  const Pagination = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
      <div className="text-sm font-semibold text-gray-800">
        Total Credit: {formatAmount(totalCredit)}
        <span className="mx-2 text-gray-300">|</span>
        Total Debit: {formatAmount(totalDebit)}
        {totalCount > 0 && (
          <span className="ml-2 text-xs font-normal text-gray-500">
            ({totalCount} entries)
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
          onClick={() => setPage(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {safePage} of {safeTotalPages}
        </span>
        <button
          type="button"
          className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
          onClick={() => setPage(Math.min(safeTotalPages, safePage + 1))}
          disabled={safePage >= safeTotalPages}
        >
          Next
        </button>
        <select
          className="border rounded-lg px-2 py-1.5 text-sm"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <p className="text-xs text-gray-500 mb-2">
        Rows in light red are flagged reversal / incorrect / correction entries.
      </p>

      {/* Mobile / tablet cards */}
      <div className="lg:hidden space-y-3">
        {entries.map((entry, index) => {
          const flagged = isFlaggedLedgerEntry(entry);
          return (
            <div
              key={entry.id || index}
              className={`rounded-xl border p-3 shadow-sm ${
                flagged
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {entry.account?.account_name || "—"}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(entry.transacted_date)}</p>
                </div>
                <span
                  className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full ${
                    entry.entry_type === "CREDIT"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {entry.entry_type === "CREDIT" ? "CR" : "DB"} {formatAmount(entry.amount)}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-medium text-gray-500">Category:</span> {entry.category || "—"}
              </p>
              {entry.description && (
                <p className="text-sm text-gray-600 mt-1 break-words">{entry.description}</p>
              )}
              {flagged && (
                <p className="text-xs font-semibold text-red-700 mt-2">Flagged / reversal entry</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200">
        <table className="ledger-table min-w-[720px]">
          <thead>
            <tr>
              <th>Date</th>
              <th>Account Name</th>
              <th>Category</th>
              <th>CR Amount</th>
              <th>DB Amount</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const flagged = isFlaggedLedgerEntry(entry);
              return (
                <tr
                  key={entry.id || index}
                  className={flagged ? "ledger-row-flagged" : undefined}
                  title={flagged ? "Flagged reversal / incorrect / correction entry" : undefined}
                >
                  <td>{formatDate(entry.transacted_date)}</td>
                  <td>{entry.account?.account_name || "-"}</td>
                  <td>{entry.category}</td>
                  <td>{entry.entry_type === "CREDIT" ? formatAmount(entry.amount) : "-"}</td>
                  <td>{entry.entry_type === "DEBIT" ? formatAmount(entry.amount) : "-"}</td>
                  <td>{entry.description}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination />
    </div>
  );
};

export default LedgerTable;
