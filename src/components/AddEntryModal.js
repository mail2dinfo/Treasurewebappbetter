import React, { useState } from "react";
import { useLedgerEntryContext } from "../context/ledgerEntry_context";
import { useLedgerAccountContext } from "../context/ledgerAccount_context";
import { useUserContext } from "../context/user_context";
import Alert from '../components/Alert';
import { useGroupsDetailsContext } from "../context/groups_context";

const categoryOptions = [
  "Food",
  "Current Bill",
  "Water Bill",
  "Vegetable Expense",
  "Loan",
  "Donation",
  "Groups",
];

const AddEntryModal = ({ onClose, customersByGroup = {}, accounts = [] }) => {
  const { user } = useUserContext();
  const { addLedgerEntry, fetchLedgerEntries } = useLedgerEntryContext();
  const { fetchLedgerAccounts } = useLedgerAccountContext();
  const { state, fetchGroupById } = useGroupsDetailsContext();
  const { groups, selectedGroupDetails } = state;
  const groupSubscribers = selectedGroupDetails?.groupSubcriberResult || [];

  // Reset state when modal opens
  React.useEffect(() => {
    setFormData(defaultFormData);
    setSelectedGroupId("");
    setSelectedSubscriberIds([]);
    setSubscriberAmounts({});
    setIsConfirming(false);
    setTempData(null);
    setAlert({ show: false, type: "", message: "" });
    setIsLoadingSubscribers(false);

    // Clear the group context when modal opens
    fetchGroupById(""); // This clears any previous group details
  }, []); // Empty dependency array means this runs only when component mounts

  // Debug logging to see subscriber data structure
  // console.log("Group Subscribers:", groupSubscribers);
  // console.log("Selected Group Details:", selectedGroupDetails);



  const today = new Date().toISOString().split("T")[0];

  const defaultFormData = {
    ledgerAccountId: "",
    transactedDate: today,
    entryType: "CREDIT",
    category: "",
    subCategory: "",
    amount: "",
    description: "",
    subscriberId: "",
    subscriberName: "",
    membershipId: "",
  };
  const groupSubcategories = [
    "DAILY-COLLECTION",
    "WEEKLY-COLLECTION",
    "MONTHLY-COLLECTION"
  ];

  const [formData, setFormData] = useState(defaultFormData);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedSubscriberIds, setSelectedSubscriberIds] = useState([]);
  const [subscriberAmounts, setSubscriberAmounts] = useState({});
  const [isConfirming, setIsConfirming] = useState(false);
  const [tempData, setTempData] = useState(null);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);

  const [list] = useState([]);
  const [alert, setAlert] = useState({ show: false, type: "", message: "" });

  const [isLoading, setIsLoading] = useState(false);




  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    setFormData((prev) => ({ ...prev, category }));

    // Always clear group and subscriber selections when category changes
    setSelectedGroupId("");
    setSelectedSubscriberIds([]);
    setSubscriberAmounts({});
    setIsLoadingSubscribers(false);

    // Clear the group context to reset subscribers list
    if (category === "Groups") {
      // Reset the group context to clear previous subscribers
      fetchGroupById(""); // This should clear the selected group details
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.category === "Groups") {
      // For Groups, we'll create multiple entries - only for subscribers with amounts
      const entries = selectedSubscriberIds
        .filter(groupSubscriberId => {
          const amount = subscriberAmounts[groupSubscriberId] || 0;
          return parseFloat(amount) > 0; // Only include entries with amount > 0
        })
        .map(groupSubscriberId => {
          const subscriber = groupSubscribers.find(sub => String(sub.group_subscriber_id) === String(groupSubscriberId));  // ✅ Use group_subscriber_id
          const amount = subscriberAmounts[groupSubscriberId] || 0;

          return {
            ...formData,
            membershipId: user?.results?.userAccounts?.[0]?.parent_membership_id || "",
            groupId: selectedGroupId,
            subscriberId: subscriber?.subscriber_id || null,  // ✅ Keep subscriber_id for person identification
            groupSubscriberId: groupSubscriberId,  // ✅ Added: unique group subscriber ID for chit identification
            subscriberName: subscriber?.name || "",
            subCategory: formData.subCategory,
            amount: parseFloat(amount),
            description: formData.description,
          };
        });

      console.log("Multiple entries being created:", entries);
      setTempData(entries);
    } else {
      // For non-Groups, single entry
      const payload = {
        ...formData,
        membershipId: user?.results?.userAccounts?.[0]?.parent_membership_id || "",
        groupId: null,
        subscriberId: null,
        subscriberName: "",
        subCategory: formData.subCategory,
        amount: parseFloat(formData.amount),
      };

      console.log("Single entry being created:", payload);
      setTempData([payload]);
    }

    setIsConfirming(true);
  };

  const showAlert = (show = false, type = '', msg = '') => {
    console.log('hi');
    setAlert({ show, type, msg });
  };
  const handleConfirm = async () => {
    console.log("=== CONFIRMATION STEP ===");
    console.log("Data being sent to backend:", tempData);

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    try {
      // Process multiple entries
      for (let i = 0; i < tempData.length; i++) {
        const entry = tempData[i];

        try {
          const response = await addLedgerEntry(entry);
          const responseData = await response.json();

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Entry ${i + 1}: ${responseData.message || 'Failed to add entry'}`);
          }
        } catch (error) {
          errorCount++;
          errors.push(`Entry ${i + 1}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        fetchLedgerEntries();
        fetchLedgerAccounts();

        if (errorCount > 0) {
          showAlert(true, 'warning', `Successfully added ${successCount} entries. ${errorCount} failed.`);
          console.log('Failed entries:', errors);
        } else {
          showAlert(true, 'success', `Successfully added ${successCount} ledger entries!`);
        }

        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        showAlert(true, 'danger', 'No entries were added successfully');
      }
    } catch (error) {
      console.error("Error during confirmation:", error);
      showAlert(true, 'danger', 'An unexpected error occurred');
    }
    setIsLoading(false);
  };




  const handleClose = () => {
    setFormData(defaultFormData);
    setSelectedGroupId("");
    setSelectedSubscriberIds([]);
    setSubscriberAmounts({});
    setIsConfirming(false);
    setTempData(null);
    setAlert({ show: false, type: "", message: "" });
    setIsLoadingSubscribers(false);

    // Clear the group context when modal closes
    fetchGroupById(""); // This clears any group details
    onClose?.();
  };

  const isConfirmDisabled = () => {
    if (!tempData || tempData.length === 0) return true;

    // Check if all entries have required fields
    return tempData.some(entry => {
      if (!entry.amount || entry.amount <= 0 || !entry.description) return true;
      if (entry.category === "Groups" && (!entry.groupId || !entry.groupSubscriberId)) return true;  // ✅ Changed to groupSubscriberId
      return false;
    });
  };

  // Helper functions for multi-select
  const handleSubscriberSelect = (subscriberId) => {
    setSelectedSubscriberIds(prev => {
      if (prev.includes(subscriberId)) {
        // Remove subscriber
        const newAmounts = { ...subscriberAmounts };
        delete newAmounts[subscriberId];
        setSubscriberAmounts(newAmounts);
        return prev.filter(id => id !== subscriberId);
      } else {
        // Add subscriber
        return [...prev, subscriberId];
      }
    });
  };

  const handleAmountChange = (subscriberId, amount) => {
    setSubscriberAmounts(prev => ({
      ...prev,
      [subscriberId]: amount
    }));
  };

  const getTotalAmount = () => {
    return Object.values(subscriberAmounts).reduce((sum, amount) => sum + (parseFloat(amount) || 0), 0);
  };

  // Select All functionality
  const handleSelectAll = () => {
    const filteredSubscribers = groupSubscribers.filter((cust) =>
      cust.name.toLowerCase().includes((formData.subscriberSearch || "").toLowerCase())
    );

    if (selectedSubscriberIds.length === filteredSubscribers.length) {
      // If all are selected, unselect all
      setSelectedSubscriberIds([]);
      setSubscriberAmounts({});
    } else {
      // Select all filtered subscribers
      const allIds = filteredSubscribers.map(cust => cust.group_subscriber_id);  // ✅ Use group_subscriber_id
      setSelectedSubscriberIds(allIds);
    }
  };

  const isAllSelected = () => {
    const filteredSubscribers = groupSubscribers.filter((cust) =>
      cust.name.toLowerCase().includes((formData.subscriberSearch || "").toLowerCase())
    );
    return filteredSubscribers.length > 0 && selectedSubscriberIds.length === filteredSubscribers.length;
  };


  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Submitting...</p>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden relative">
          {/* Sticky Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-600 hover:text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
            <h2 className="text-2xl font-bold">New Ledger Entry</h2>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
            {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}

            {isConfirming ? (
              /* Confirmation Screen */
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Ledger Entry</h3>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Date:</span>
                      <p className="text-gray-800">{tempData[0]?.transactedDate}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Account:</span>
                      <p className="text-gray-800">
                        {tempData[0]?.ledgerAccountId
                          ? accounts.find((acc) => String(acc.id) === String(tempData[0]?.ledgerAccountId))?.account_name || "N/A"
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Type:</span>
                      <p className="text-gray-800">{tempData[0]?.entryType}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Category:</span>
                      <p className="text-gray-800">{tempData[0]?.category}</p>
                    </div>
                  </div>

                  {tempData[0]?.category === "Groups" && (
                    <div className="pt-3 border-t">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium text-gray-600">Group:</span>
                          <p className="text-gray-800">{selectedGroupDetails?.groupName || "N/A"}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Subcategory:</span>
                          <p className="text-gray-800">{tempData[0]?.subCategory}</p>
                        </div>
                      </div>

                      {/* Subscriber Details */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-800 mb-3">Subscriber Entries ({tempData.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {tempData.map((entry, index) => {
                            const subscriber = groupSubscribers.find(sub => String(sub.group_subscriber_id) === String(entry.groupSubscriberId));  // ✅ Use group_subscriber_id
                            return (
                              <div key={index} className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-700 truncate">{entry.subscriberName}</div>
                                  <div className="text-sm text-gray-500 truncate">{subscriber?.phone || 'N/A'}</div>
                                  {subscriber?.accountshare_amount && (
                                    <div className="text-xs text-blue-600 font-semibold mt-1">
                                      Chit: ₹{parseFloat(subscriber.accountshare_amount).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right ml-3">
                                  <span className="font-bold text-green-600 text-lg">₹ {parseFloat(entry.amount).toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <span className="font-medium text-gray-600">Description:</span>
                    <p className="text-gray-800">{tempData[0]?.description}</p>
                  </div>

                  <div className="text-center pt-4">
                    <div className="text-3xl font-bold text-green-600">
                      ₹ {tempData.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Total for {tempData.length} entries</p>
                  </div>
                </div>

                {/* Action Buttons - Sticky at bottom */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 mt-6">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsConfirming(false)}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={isConfirmDisabled()}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date and Account Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="transactedDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Transaction Date *
                    </label>
                    <input
                      id="transactedDate"
                      type="date"
                      name="transactedDate"
                      value={formData.transactedDate}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="ledgerAccountId" className="block text-sm font-medium text-gray-700 mb-2">
                      Select Account *
                    </label>
                    <select
                      id="ledgerAccountId"
                      name="ledgerAccountId"
                      value={formData.ledgerAccountId}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Account</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.account_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Entry Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Entry Type *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="entryType"
                        value="CREDIT"
                        checked={formData.entryType === "CREDIT"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">💰 Credit</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="entryType"
                        value="DEBIT"
                        checked={formData.entryType === "DEBIT"}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">💸 Debit</span>
                    </label>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Groups Section */}
                {formData.category === "Groups" && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-blue-800">Group Details</h4>

                    <div>
                      <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-2">
                        Group Subcategory *
                      </label>
                      <select
                        id="subCategory"
                        name="subCategory"
                        value={formData.subCategory}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Subcategory</option>
                        {groupSubcategories.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="groupSearch" className="block text-sm font-medium text-gray-700 mb-2">
                        Search Group
                      </label>
                      <input
                        id="groupSearch"
                        type="text"
                        placeholder="Search group by name"
                        value={formData.groupSearch || ""}
                        onChange={(e) => {
                          const input = e.target.value;
                          setFormData((prev) => ({ ...prev, groupSearch: input }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label htmlFor="groupId" className="block text-sm font-medium text-gray-700 mb-2">
                        Select Group *
                      </label>
                      <select
                        id="groupId"
                        value={selectedGroupId}
                        onChange={async (e) => {
                          const groupId = e.target.value;
                          setSelectedGroupId(groupId);
                          setSelectedSubscriberIds([]);
                          setSubscriberAmounts({});

                          if (groupId) {
                            setIsLoadingSubscribers(true);
                            try {
                              await fetchGroupById(groupId);
                            } catch (error) {
                              console.error('Error loading subscribers:', error);
                            } finally {
                              setIsLoadingSubscribers(false);
                            }
                          } else {
                            setIsLoadingSubscribers(false);
                          }
                        }}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Group</option>
                        {groups
                          .filter((group) =>
                            group.group_name
                              .toLowerCase()
                              .includes((formData.groupSearch || "").toLowerCase())
                          )
                          .map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.group_name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="subscriberSearch" className="block text-sm font-medium text-gray-700 mb-2">
                        Search Subscribers
                      </label>
                      <input
                        id="subscriberSearch"
                        type="text"
                        placeholder="Search subscribers"
                        value={formData.subscriberSearch || ""}
                        onChange={(e) => {
                          const input = e.target.value;
                          setFormData((prev) => ({ ...prev, subscriberSearch: input }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Multi-Select Subscribers */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Select Subscribers * ({selectedSubscriberIds.length} selected)
                        </label>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          disabled={isLoadingSubscribers}
                        >
                          {isAllSelected() ? 'Unselect All' : 'Select All'}
                        </button>
                      </div>

                      {isLoadingSubscribers ? (
                        <div className="border border-gray-300 rounded-lg p-8 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-600 text-sm">Loading subscribers...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-gray-300 rounded-lg p-2 space-y-2 max-h-96 overflow-y-auto">
                          {groupSubscribers
                            .filter((cust) =>
                              cust.name.toLowerCase().includes((formData.subscriberSearch || "").toLowerCase())
                            )
                            .map((cust) => {
                              const isSelected = selectedSubscriberIds.includes(cust.group_subscriber_id);  // ✅ Use group_subscriber_id
                              return (
                                <div key={cust.group_subscriber_id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                  <input
                                    type="checkbox"
                                    id={`subscriber-${cust.group_subscriber_id}`}  // ✅ Use group_subscriber_id
                                    checked={isSelected}
                                    onChange={() => handleSubscriberSelect(cust.group_subscriber_id)}  // ✅ Use group_subscriber_id
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`subscriber-${cust.group_subscriber_id}`}  // ✅ Use group_subscriber_id
                                    className="flex-1 text-sm font-medium text-gray-700 cursor-pointer"
                                  >
                                    <div className="flex flex-col">
                                      <span>{cust.name} - {cust.phone}</span>
                                      {cust.accountshare_amount && (
                                        <span className="text-xs text-blue-600 font-semibold">
                                          Chit: ₹{parseFloat(cust.accountshare_amount).toLocaleString()} ({cust.accountshare_percentage}%)
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                  {isSelected && (
                                    <input
                                      type="number"
                                      placeholder="Amount"
                                      value={subscriberAmounts[cust.group_subscriber_id] || ""}  // ✅ Use group_subscriber_id
                                      onChange={(e) => handleAmountChange(cust.group_subscriber_id, e.target.value)}  // ✅ Use group_subscriber_id
                                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                      min="0"
                                      step="0.01"
                                    />
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {selectedSubscriberIds.length > 0 && !isLoadingSubscribers && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-green-800">
                              Total Amount: ₹ {getTotalAmount().toFixed(2)}
                            </span>
                            <span className="text-sm text-green-600">
                              {selectedSubscriberIds.length} entries
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Amount and Description - Only show for non-Groups */}
                {formData.category !== "Groups" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                        Amount *
                      </label>
                      <input
                        id="amount"
                        type="number"
                        name="amount"
                        value={formData.amount}
                        min="0"
                        step="0.01"
                        onChange={handleInputChange}
                        required
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-medium"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <input
                        id="description"
                        type="text"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        placeholder="Enter description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Description for Groups */}
                {formData.category === "Groups" && (
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <input
                      id="description"
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter description (will be added to each subscriber entry)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Action Buttons - Sticky at bottom */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 mt-6">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                    >
                      Save Entry
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddEntryModal;