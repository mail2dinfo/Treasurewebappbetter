import React, { useEffect, useMemo, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import LedgerTable from "../components/LedgerTable";
import AddEntryModal from "../components/AddEntryModal";
import FilterBar from "../components/FilterBar";
import LedgerHeader from "../components/LedgerHeader";
import AddAccountModal from "../components/AddAccountModal";
import Mypdf from "../components/PDF/Mypdf";
import "../style/ledger.css";
import { useLedgerAccountContext } from "../context/ledgerAccount_context";
import { useLedgerEntryContext } from "../context/ledgerEntry_context";
import { useLedgerCategoryContext } from "../context/ledgerCategory_context";
import { useUserContext } from "../context/user_context";



const LedgerPage = () => {
  const { ledgerAccounts, fetchLedgerAccounts, deleteLedgerAccount } = useLedgerAccountContext();
  const { ledgerEntries, fetchLedgerEntries, setPage } = useLedgerEntryContext();
  const { categories } = useLedgerCategoryContext();
  const { user } = useUserContext();

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
    setPage(1);
    fetchLedgerEntries(filters, { page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const formatPdfDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const entriesArray = Array.isArray(entries?.results) ? entries.results : (Array.isArray(entries) ? entries : []);
  const pdfHeaders = [
    { title: "Date", value: "date" },
    { title: "Account", value: "account" },
    { title: "Category", value: "category" },
    { title: "CR Amount", value: "credit" },
    { title: "DB Amount", value: "debit" },
    { title: "Description", value: "description" },
  ];
  const pdfRows = useMemo(() => {
    const rows = entriesArray.map((entry) => ({
      date: formatPdfDate(entry.transacted_date),
      account: entry.account?.account_name || "",
      category: entry.category || "",
      credit: entry.entry_type === "CREDIT"
        ? Number(entry.amount || 0).toLocaleString("en-IN")
        : "",
      debit: entry.entry_type === "DEBIT"
        ? Number(entry.amount || 0).toLocaleString("en-IN")
        : "",
      description: entry.description || "",
    }));
    if (rows.length) {
      const totalCredit = entriesArray
        .filter((entry) => entry.entry_type === "CREDIT")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const totalDebit = entriesArray
        .filter((entry) => entry.entry_type === "DEBIT")
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      rows.push({
        date: "TOTAL",
        account: "",
        category: `${entriesArray.length} entries`,
        credit: totalCredit.toLocaleString("en-IN"),
        debit: totalDebit.toLocaleString("en-IN"),
        description: "",
      });
    }
    return rows;
  }, [entriesArray]);

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
          {pdfRows.length > 0 && (
            <PDFDownloadLink
              document={
                <Mypdf
                  tableData={pdfRows}
                  tableHeaders={pdfHeaders}
                  heading="Ledger Entries"
                  companyData={user?.results?.userCompany || []}
                />
              }
              fileName={`Ledger_${new Date().toISOString().slice(0, 10)}.pdf`}
            >
              {({ loading }) => (
                <button type="button" className="add-entry-btn">
                  {loading ? "Preparing PDF…" : "⬇️ Download PDF"}
                </button>
              )}
            </PDFDownloadLink>
          )}
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
