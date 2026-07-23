import React, { useContext, useEffect, useRef } from "react";
import AppContext from "./Context";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Yellow bulb SVG icon
const BulbIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f1c40f"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 3-3 5-3 5H8s-3-2-3-5a7 7 0 0 1 7-7z" />
  </svg>
);

function InputWithHelp({ placeholder, value, onChange, required, helpText, inputRef }) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full px-4 py-4 text-base border-2 border-gray-200 rounded-xl transition-all duration-300 bg-white focus:outline-none focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20 hover:border-gray-300"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          <div className="relative group cursor-pointer">
            <BulbIcon />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-[180px] bg-gray-800 text-white text-xs rounded-lg px-3 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
              {helpText}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GroupDetails() {
  const { groupDetails: updateContext } = useContext(AppContext);
  const firstInputRef = useRef(null);

  useEffect(() => {
    updateContext.setGroupName(updateContext.groupName || "");
    updateContext.setGroupAmt(updateContext.groupAmt || "");
    updateContext.setNoOfSub(updateContext.groupNoOfSub || "");
    updateContext.setNoOfMonths(updateContext.groupNoOfMonths || "");
  }, []);

  // Auto-focus first input when component mounts
  useEffect(() => {
    if (firstInputRef.current && updateContext.focusTrigger) {
      const timer = setTimeout(() => {
        firstInputRef.current.focus();
      }, 200); // Delay to ensure smooth scroll completes first

      return () => clearTimeout(timer);
    }
  }, [updateContext.focusTrigger]);

  const next = () => {
    if (!updateContext.groupName) {
      toast.error("Please enter Group Name");
    } else if (!updateContext.groupAmt) {
      toast.error("Please enter Group Amount");
    } else if (
      updateContext.groupType === "Fixed" &&
      !updateContext.groupNoOfMonths
    ) {
      toast.error("Please enter No of Months");
    } else if (
      updateContext.groupType !== "Fixed" &&
      !updateContext.groupNoOfSub
    ) {
      toast.error(
        updateContext.groupType === "Adaptive"
          ? "Please enter No of Shares"
          : "Please enter No of Subscribers"
      );
    } else {
      updateContext.setStep(updateContext.currentPage + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white rounded-3xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white p-8 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
            <span className="text-2xl">📝</span>
          </div>
          <h2 className="text-3xl font-bold font-['Poppins'] mb-2">Enter Group Details</h2>
          <p className="text-red-100 text-sm">Provide the basic information for your group</p>
        </div>
      </div>
      <div className="p-8">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <InputWithHelp
            placeholder="Group name"
            value={updateContext.groupName}
            onChange={(e) => updateContext.setGroupName(e.target.value)}
            required
            helpText="Sample: 1LackA1"
            inputRef={firstInputRef}
          />

          <InputWithHelp
            placeholder="Group amount"
            value={updateContext.groupAmt}
            onChange={(e) => updateContext.setGroupAmt(e.target.value)}
            required
            helpText="For eg 50000, 100000,500000 "
          />

          {updateContext.groupType === "Fixed" ? (
            <InputWithHelp
              placeholder="No of Months"
              value={updateContext.groupNoOfMonths}
              onChange={(e) => updateContext.setNoOfMonths(e.target.value)}
              required
              helpText="No of months"
            />
          ) : (
            <InputWithHelp
              placeholder={updateContext.groupType === "Adaptive" ? "No of Shares" : "No of Subscribers"}
              value={updateContext.groupNoOfSub}
              onChange={(e) => updateContext.setNoOfSub(e.target.value)}
              required
              helpText={
                updateContext.groupType === "Adaptive"
                  ? "Number of 100% shares (can later split a share across subscribers)"
                  : "Total subscribers in group"
              }
            />
          )}

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:from-gray-600 hover:to-gray-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-500/30 flex items-center justify-center gap-2"
              onClick={() => updateContext.setStep(updateContext.currentPage - 1)}
            >
              <span>←</span>
              Previous
            </button>
            <button
              type="button"
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:from-red-700 hover:to-red-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-600/30 flex items-center justify-center gap-2"
              onClick={next}
            >
              Next
              <span>→</span>
            </button>
          </div>
        </form>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        toastStyle={{
          textAlign: 'center'
        }}
      />
    </div>
  );
}
