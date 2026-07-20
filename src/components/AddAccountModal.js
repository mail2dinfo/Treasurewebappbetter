import React, { useState } from "react";
import { useUserContext } from "../context/user_context";
import { useLedgerAccountContext } from "../context/ledgerAccount_context"; // Import your ledger context hook
import Alert from './Alert';
import "../style/AddAccountModal.css";

const AddAccountModal = ({ onClose, onSuccess }) => {
  const { user } = useUserContext();
  const { addLedgerAccount } = useLedgerAccountContext();  // Get addLedgerAccount from context

  const [accountName, setAccountName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const showAlert = (show = false, type = '', msg = '') => {
    setAlert({ show, type, msg });
  };

  const handleSubmit = async () => {
    if (!accountName || !openingBalance) {
      showAlert(true, "danger", "Please fill in all fields.");
      return;
    }
  
    const accountData = {
      accountName: accountName.trim(),
      openingBalance: parseFloat(openingBalance),
      membershipId: user?.results?.userAccounts[0]?.parent_membership_id,
      created_at: new Date().toISOString(),
    };
  
    setIsLoading(true);
    const { success, message } = await addLedgerAccount(accountData);
    
    if (success) {
      showAlert(true, "success", message);
      onSuccess?.();
      onClose();
    } else {
      showAlert(true, "danger", message);
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
          <h3>Add New Account</h3>
          <input
            type="text"
            placeholder="Account Name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            disabled={isLoading}
          />
          <input
            type="number"
            placeholder="Opening Balance"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            disabled={isLoading}
          />
          <div className="modal-actions">
            <button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Submit"}
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






// import React, { useState } from "react";
// import { API_BASE_URL } from "../utils/apiConfig";
// import { useUserContext } from "../context/user_context";
// import "../style/AddAccountModal.css"; // Import your CSS here
// import Alert from './Alert';

// const AddAccountModal = ({ onClose, onSuccess }) => {
//   const { user, userRole } = useUserContext();
//   const [accountName, setAccountName] = useState("");
//   const [openingBalance, setOpeningBalance] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   const [list, setList] = useState([]);
//   const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

//   const showAlert = (show = false, type = '', msg = '') => {
//     console.log('hi');
//     setAlert({ show, type, msg });
//   };
//   const handleSubmit = async () => {
//     if (!accountName || !openingBalance) {
//       showAlert(true, "danger", "Please fill in all fields.");
//       return;
//     }

//     const accountData = {
//       accountName: accountName,
//       openingBalance: parseFloat(openingBalance),
//       membershipId: user?.results?.userAccounts[0]?.parent_membership_id,
//       created_at: new Date().toISOString(),
//     };

//     try {
//       setIsLoading(true);

//       const response = await fetch(`${API_BASE_URL}/accounts`, {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${user?.results?.token}`,
//           "Content-Type": "application/json",
//           "X-User-Role": userRole,
//         },
//         body: JSON.stringify(accountData),
//       });

//       const result = await response.json();

//       if (response.ok) {
//         showAlert(true, "success", result.message || "Account added successfully.");
//         onSuccess?.(result.results);
//         onClose();
//       } else {
//         showAlert(true, "danger", result.message || "Failed to create account.");
//       }
//     } catch (error) {
//       showAlert(true, "danger", "An error occurred while creating the account.");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <>


//       {isLoading && (
//         <div className="page-overlay">
//           <div className="loader-container">
//             <div className="loader"></div>
//             <p>Submitting...</p>
//           </div>
//         </div>
//       )}

//       <div className="modal-overlay">
//         <div className="modal">
//           {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}
//           <h3>Add New Account</h3>
//           <input
//             type="text"
//             placeholder="Account Name"
//             value={accountName}
//             onChange={(e) => setAccountName(e.target.value)}
//             disabled={isLoading}
//           />
//           <input
//             type="number"
//             placeholder="Opening Balance"
//             value={openingBalance}
//             onChange={(e) => setOpeningBalance(e.target.value)}
//             disabled={isLoading}
//           />
//           <div className="modal-actions">
//             <button onClick={handleSubmit} disabled={isLoading}>
//               {isLoading ? "Saving..." : "Submit"}
//             </button>
//             <button className="cancel" onClick={onClose} disabled={isLoading}>
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default AddAccountModal;
