import React, { useEffect, useState } from "react";
import LedgerTable from "../components/LedgerTable";
import AddEntryModal from "../components/AddEntryModal";
import FilterBar from "../components/FilterBar";
import LedgerHeader from "../components/LedgerHeader";
import AddAccountModal from "../components/AddAccountModal";
import "../style/ledger.css";
import { useLedgerAccountContext } from "../context/ledgerAccount_context"; // 👈 context import
import { useLedgerEntryContext } from "../context/ledgerEntry_context";



const LedgerPage = () => {
  const { ledgerAccounts } = useLedgerAccountContext();
  const { ledgerEntries, fetchLedgerEntries } = useLedgerEntryContext();
  console.log("mani in ledgerAccounts");
  console.log(ledgerAccounts);
  console.log("mani in ledgerEntries");
  console.log(ledgerEntries);

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null); // default to first account
  const [entries, setEntries] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    category: "",
    entryType: "",
  });

  useEffect(() => {
    if (Array.isArray(ledgerAccounts)) {
      setAccounts(ledgerAccounts);
    }
  }, [ledgerAccounts]);

  // On mount, inject mock entries
  useEffect(() => {

    // Ensure we always set an array
    const safeEntries = Array.isArray(ledgerEntries) ? ledgerEntries :
      (ledgerEntries?.results && Array.isArray(ledgerEntries.results)) ? ledgerEntries.results : [];
    setEntries(safeEntries);
  }, [ledgerEntries]);

  useEffect(() => {
    fetchLedgerEntries(filters);
  }, [filters]);

  const handleAddAccount = (newAccount) => {
    setAccounts(prev => [...prev, newAccount]);
    setShowAccountModal(false);
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
        onAddClick={() => setShowAccountModal(true)}
      />

      <h2>Filter </h2>

      <div className="button-group">
        <FilterBar filters={filters} setFilters={setFilters} />
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
          onClose={() => setShowAccountModal(false)}
          onSubmit={handleAddAccount}
        />
      )}
    </div>
  );
};

export default LedgerPage;
