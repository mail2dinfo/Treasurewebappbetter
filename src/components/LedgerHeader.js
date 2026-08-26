import React, { useState } from "react";
import { FiArrowUp, FiArrowDown, FiEdit2, FiTrash2 } from "react-icons/fi";
import { GoArrowBoth } from "react-icons/go";
import "../style/LedgerHeader.css";

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const LedgerHeader = ({ accounts, onAddClick, onEditAccount, onDeleteAccount }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });

  const getStatusIcon = (opening, current) => {
    const open = Number(opening) || 0;
    const curr = Number(current) || 0;

    if (curr > open) {
      return (
        <span className="ledger-status is-profit">
          Profit <FiArrowUp />
        </span>
      );
    }
    if (curr < open) {
      return (
        <span className="ledger-status is-loss">
          Loss <FiArrowDown />
        </span>
      );
    }
    return (
      <span className="ledger-status is-even">
        Break-even <GoArrowBoth />
      </span>
    );
  };

  const calculateBalance = (opening, current) =>
    Math.abs((Number(opening) || 0) - (Number(current) || 0));

  const totalOpening = accounts?.reduce?.((sum, acc) => sum + Number(acc.opening_balance || 0), 0) || 0;
  const totalCurrent = accounts?.reduce?.((sum, acc) => sum + Number(acc.current_balance || 0), 0) || 0;
  const totalBalance = totalOpening - totalCurrent;

  const handleDelete = async (account) => {
    const confirmed = window.confirm(`Delete account "${account.account_name}"?`);
    if (!confirmed) return;

    setActionMessage({ type: "", text: "" });
    setDeletingId(account.id);

    try {
      const result = await onDeleteAccount?.(account);
      if (result?.success) {
        setActionMessage({ type: "success", text: result.message || "Account deleted successfully." });
      } else {
        setActionMessage({
          type: "error",
          text: result?.message || "Unable to delete account.",
        });
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="account-header-section">
      <div className="account-header-top">
        <div>
          <h2>Account summary</h2>
          <p>Opening vs current balance for each cash or bank account.</p>
        </div>
        <button type="button" className="add-entry-btn" onClick={onAddClick}>
          + Add account
        </button>
      </div>

      {actionMessage.text && (
        <div className={`account-action-message account-action-message--${actionMessage.type}`}>
          {actionMessage.text}
        </div>
      )}

      {!accounts?.length ? (
        <div className="account-empty">
          No accounts yet. Add Cash, UPI, or Bank with an opening balance.
        </div>
      ) : (
        <>
          <div className="account-grid-header">
            <span>Account name</span>
            <span>Opening</span>
            <span>Current</span>
            <span>Diff</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {accounts.map((acc) => (
            <div className="account-grid-row" key={acc.id}>
              <span data-label="Account name" className="account-name-cell">{acc.account_name}</span>
              <span data-label="Opening">{formatCurrency(acc.opening_balance)}</span>
              <span data-label="Current">{formatCurrency(acc.current_balance)}</span>
              <span data-label="Diff">{formatCurrency(calculateBalance(acc.opening_balance, acc.current_balance))}</span>
              <span data-label="Status">{getStatusIcon(acc.opening_balance, acc.current_balance)}</span>
              <span data-label="Actions" className="account-actions-cell">
                <button
                  type="button"
                  className="account-action-btn account-action-btn--edit"
                  onClick={() => onEditAccount?.(acc)}
                  title="Update account"
                >
                  <FiEdit2 />
                </button>
                <button
                  type="button"
                  className="account-action-btn account-action-btn--delete"
                  onClick={() => handleDelete(acc)}
                  disabled={deletingId === acc.id}
                  title="Delete account"
                >
                  <FiTrash2 />
                </button>
              </span>
            </div>
          ))}

          <div className="account-grid-row total-row">
            <span data-label="Account name">Total</span>
            <span data-label="Opening">{formatCurrency(totalOpening)}</span>
            <span data-label="Current">{formatCurrency(totalCurrent)}</span>
            <span data-label="Diff">{formatCurrency(Math.abs(totalBalance))}</span>
            <span data-label="Status">—</span>
            <span data-label="Actions">—</span>
          </div>
        </>
      )}
    </section>
  );
};

export default LedgerHeader;
