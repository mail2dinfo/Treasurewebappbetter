import React from "react";
import { useLedgerEntryContext } from "../context/ledgerEntry_context";

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
};

const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

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
    return <div className="ledger-empty">Loading ledger entries...</div>;
  }

  if (!entries || entries.length === 0) {
    return <div className="ledger-empty">No ledger entries match these filters.</div>;
  }

  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safePage = Math.max(1, Number(page) || 1);

  const Pagination = () => (
    <div className="ledger-pagination">
      <div className="ledger-pagination-totals">
        <span className="is-credit">Credit {formatAmount(totalCredit)}</span>
        <span className="is-debit">Debit {formatAmount(totalDebit)}</span>
        {totalCount > 0 && <span className="is-muted">{totalCount} entries</span>}
      </div>
      <div className="ledger-pagination-controls">
        <button
          type="button"
          onClick={() => setPage(Math.max(1, safePage - 1))}
          disabled={safePage <= 1}
        >
          Prev
        </button>
        <span>
          Page {safePage} of {safeTotalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage(Math.min(safeTotalPages, safePage + 1))}
          disabled={safePage >= safeTotalPages}
        >
          Next
        </button>
        <select
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
      <p className="ledger-flag-note">
        Rows in light red are flagged reversal / incorrect / correction entries.
      </p>

      <div className="lg:hidden space-y-3">
        {entries.map((entry, index) => {
          const flagged = isFlaggedLedgerEntry(entry);
          return (
            <div
              key={entry.id || index}
              className={`ledger-entry-card ${flagged ? "is-flagged" : ""}`}
            >
              <div className="ledger-entry-card-top">
                <div className="min-w-0">
                  <p className="ledger-entry-account">{entry.account?.account_name || "—"}</p>
                  <p className="ledger-entry-date">{formatDate(entry.transacted_date)}</p>
                </div>
                <span className={`ledger-type-pill ${entry.entry_type === "CREDIT" ? "is-credit" : "is-debit"}`}>
                  {entry.entry_type === "CREDIT" ? "CR" : "DB"} {formatAmount(entry.amount)}
                </span>
              </div>
              <p className="ledger-entry-meta">
                <span>Category</span> {entry.category || "—"}
              </p>
              {entry.description && (
                <p className="ledger-entry-desc">{entry.description}</p>
              )}
              {flagged && (
                <p className="ledger-entry-flag">Flagged / reversal entry</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200">
        <table className="ledger-table min-w-[720px]">
          <thead>
            <tr>
              <th>Date</th>
              <th>Account name</th>
              <th>Category</th>
              <th>CR amount</th>
              <th>DB amount</th>
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
                  <td className="ledger-account-cell">{entry.account?.account_name || "-"}</td>
                  <td>{entry.category}</td>
                  <td className="ledger-credit-cell">
                    {entry.entry_type === "CREDIT" ? formatAmount(entry.amount) : "—"}
                  </td>
                  <td className="ledger-debit-cell">
                    {entry.entry_type === "DEBIT" ? formatAmount(entry.amount) : "—"}
                  </td>
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
