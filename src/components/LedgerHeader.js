import React, { useState } from "react";
import { FiArrowUp, FiArrowDown, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { GoArrowBoth } from 'react-icons/go';
import "../style/LedgerHeader.css";

const LedgerHeader = ({ accounts, onAddClick, onEditAccount, onDeleteAccount }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  const calculatePercentage = (opening, current) => {
    if (opening === 0) return "—";
    const diff = current - opening;
    const percent = ((diff / opening) * 100).toFixed(2);
    return `${percent}%`;
  };

  const getStatusIcon = (opening, current) => {
    const style = { display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' };

    if (current > opening) {
      return (
        <span style={{ ...style, color: 'green' }}>
          Profit <FiArrowUp />
        </span>
      );
    } else if (current < opening) {
      return (
        <span style={{ ...style, color: 'red' }}>
          Loss <FiArrowDown />
        </span>
      );
    } else {
      return (
        <span style={{ ...style, color: 'gray' }}>
          Break-even <GoArrowBoth />
        </span>
      );
    }
  };

  const calculateBalance = (opening, current) => {
    return Math.abs(opening - current);
  };

  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

  const totalOpening = accounts?.reduce?.((sum, acc) => sum + Number(acc.opening_balance || 0), 0) || 0;
  const totalCurrent = accounts?.reduce?.((sum, acc) => sum + Number(acc.current_balance || 0), 0) || 0;
  const totalBalance = totalOpening - totalCurrent;

  const handleDelete = async (account) => {
    const confirmed = window.confirm(`Delete account "${account.account_name}"?`);
    if (!confirmed) return;

    setActionMessage({ type: '', text: '' });
    setDeletingId(account.id);

    try {
      const result = await onDeleteAccount?.(account);
      if (result?.success) {
        setActionMessage({ type: 'success', text: result.message || 'Account deleted successfully.' });
      } else {
        setActionMessage({
          type: 'error',
          text: result?.message || 'Unable to delete account.',
        });
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="account-header-section">
      <div className="account-header-top">
        <h2>Account Summary</h2>
        <button type="button" className="add-entry-btn" onClick={onAddClick}>+ Add Account</button>
      </div>

      {actionMessage.text && (
        <div className={`account-action-message account-action-message--${actionMessage.type}`}>
          {actionMessage.text}
        </div>
      )}

      <div className="account-grid-header">
        <span>Account Name</span>
        <span>Opening Balance</span>
        <span>Current Balance</span>
        <span>Diff</span>
        <span>% Change</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      {accounts.map((acc) => (
        <div className="account-grid-row" key={acc.id}>
          <span data-label="Account Name">{acc.account_name}</span>
          <span data-label="Opening Balance">{formatCurrency(acc.opening_balance)}</span>
          <span data-label="Current Balance">{formatCurrency(acc.current_balance)}</span>
          <span data-label="Balance">{formatCurrency(calculateBalance(acc.opening_balance, acc.current_balance))}</span>
          <span data-label="% Change">{calculatePercentage(acc.opening_balance, acc.current_balance)}</span>
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
        <span data-label="Account Name">Total</span>
        <span data-label="Opening Balance">{formatCurrency(totalOpening)}</span>
        <span data-label="Current Balance">{formatCurrency(totalCurrent)}</span>
        <span data-label="Balance">{formatCurrency(totalBalance)}</span>
        <span data-label="% Change">—</span>
        <span data-label="Status">—</span>
        <span data-label="Actions">—</span>
      </div>
    </div>
  );
};

export default LedgerHeader;
