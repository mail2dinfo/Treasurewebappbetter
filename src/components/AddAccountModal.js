import React, { useEffect, useState } from "react";
import { useUserContext } from "../context/user_context";
import { getChitCompanyMembershipId } from "../utils/chitMembership";
import { useLedgerAccountContext } from "../context/ledgerAccount_context";
import Alert from './Alert';
import "../style/AddAccountModal.css";

const AddAccountModal = ({ onClose, onSuccess, account = null }) => {
  const { user } = useUserContext();
  const { addLedgerAccount, updateLedgerAccount } = useLedgerAccountContext();
  const isEditMode = Boolean(account?.id);

  const [accountName, setAccountName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  useEffect(() => {
    if (account) {
      setAccountName(account.account_name || "");
      setOpeningBalance(
        account.opening_balance !== undefined && account.opening_balance !== null
          ? String(account.opening_balance)
          : ""
      );
    }
  }, [account]);

  const showAlert = (show = false, type = '', msg = '') => {
    setAlert({ show, type, msg });
  };

  const handleSubmit = async () => {
    if (!accountName?.trim()) {
      showAlert(true, "danger", "Please enter account name.");
      return;
    }
    if (!isEditMode && openingBalance === "") {
      showAlert(true, "danger", "Please enter opening balance.");
      return;
    }

    setIsLoading(true);

    if (isEditMode) {
      const { success, message } = await updateLedgerAccount(account.id, {
        accountName: accountName.trim(),
      });

      if (success) {
        await onSuccess?.();
        onClose();
      } else {
        showAlert(true, "danger", message);
      }
    } else {
      const accountData = {
        accountName: accountName.trim(),
        openingBalance: parseFloat(openingBalance),
        membershipId: getChitCompanyMembershipId(user),
        created_at: new Date().toISOString(),
      };

      const { success, message } = await addLedgerAccount(accountData);

      if (success) {
        await onSuccess?.();
        onClose();
      } else {
        showAlert(true, "danger", message);
      }
    }

    setIsLoading(false);
  };

  return (
    <>
      {isLoading && (
        <div className="page-overlay">
          <div className="loader-container">
            <div className="loader"></div>
            <p>Submitting...</p>
          </div>
        </div>
      )}

      <div className="modal-overlay">
        <div className="modal">
          {alert.show && <Alert {...alert} removeAlert={showAlert} />}
          <h3>{isEditMode ? "Update Account" : "Add New Account"}</h3>
          <input
            type="text"
            placeholder="Account Name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            disabled={isLoading}
          />
          {!isEditMode && (
            <input
              type="number"
              placeholder="Opening Balance"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              disabled={isLoading}
            />
          )}
          <div className="modal-actions">
            <button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Saving..." : isEditMode ? "Update" : "Submit"}
            </button>
            <button className="cancel" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddAccountModal;
