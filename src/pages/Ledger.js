import React, { useEffect, useState } from "react";
import LedgerTable from "../components/LedgerTable";
import AddEntryModal from "../components/AddEntryModal";
import FilterBar from "../components/FilterBar";
import LedgerHeader from "../components/LedgerHeader";
import AddAccountModal from "../components/AddAccountModal";
import "../style/ledger.css";
import { useLedgerAccountContext } from "../context/ledgerAccount_context"; // 👈 context import
import { useLedgerEntryContext } from "../context/ledgerEntry_context";
import { useLedgerCategoryContext } from "../context/ledgerCategory_context";



const LedgerPage = () => {
  const { ledgerAccounts, fetchLedgerAccounts, deleteLedgerAccount } = useLedgerAccountContext();
  const { ledgerEntries, fetchLedgerEntries } = useLedgerEntryContext();
  const { categories } = useLedgerCategoryContext();

  const accounts = Array.isArray(ledgerAccounts) ? ledgerAccounts : [];
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [entries, setEntries] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    entryType: "",
  });

  useEffect(() => {
    if (Array.isArray(ledgerEntries)) {
      setEntries(ledgerEntries);
      return;
    }
    if (ledgerEntries?.results && Array.isArray(ledgerEntries.results)) {
      setEntries(ledgerEntries.results);
    }
  }, [ledgerEntries]);

  useEffect(() => {
    fetchLedgerEntries(filters);
  }, [filters]);

  const handleAccountModalSuccess = async () => {
    await fetchLedgerAccounts();
    setShowAccountModal(false);
    setEditingAccount(null);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setShowAccountModal(true);
  };

  const handleDeleteAccount = async (account) => {
    return deleteLedgerAccount(account.id);
  };

  const handleCloseAccountModal = () => {
    setShowAccountModal(false);
    setEditingAccount(null);
  };

  const handleDownloadCSV = () => {
    console.log(entries);
    const entriesArray = entries?.results ?? entries; // fallback if it's already an array

    if (!Array.isArray(entriesArray)) {
      console.error("entries is not an array:", entriesArray);
      return;
    }

    const headers = ["Date", "Account", "Discription", "Amount", "Type", "Category"];

    const rows = entriesArray.map(entry => [
      entry.transacted_date ?? '', // fallback to empty if missing
      entry.account?.account_name ?? '',
      entry.description ?? '',
      entry.amount ?? '',
      entry.entry_type ?? '',
      entry.category ?? ''
    ]);

    const csvContent =
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ledger.csv";
    a.click();
  };

  return (
    <div className={`ledger-page ${showModal || showAccountModal ? "blurred" : ""}`}>
      {/* Header with account dropdown */}
      <LedgerHeader
        accounts={accounts}
        selectedAccount={selectedAccount}
        onAccountChange={setSelectedAccount}
        onAddClick={() => {
          setEditingAccount(null);
          setShowAccountModal(true);
        }}
        onEditAccount={handleEditAccount}
        onDeleteAccount={handleDeleteAccount}
      />

      <h2>Filter </h2>

      <div className="button-group">
        <FilterBar filters={filters} setFilters={setFilters} categories={categories} />
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => setShowModal(true)} className="add-entry-btn">
            + Add Entry
          </button>
          <button onClick={handleDownloadCSV} className="add-entry-btn">
            ⬇️ Download CSV
          </button>
        </div>
      </div>

      <LedgerTable entries={entries} />

      {showModal && (
        <AddEntryModal
          onClose={() => setShowModal(false)}

          accounts={accounts} // ✅ Pass accounts here
        />
      )}

      {showAccountModal && (
        <AddAccountModal
          onClose={handleCloseAccountModal}
          onSuccess={handleAccountModalSuccess}
          account={editingAccount}
        />
      )}
    </div>
  );
};

export default LedgerPage;
