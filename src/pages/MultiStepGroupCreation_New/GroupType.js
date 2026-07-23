import React, { useContext, useRef, useEffect } from "react";
import { FaVideo } from "react-icons/fa";
import AppContext from "./Context";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


export default function GroupType() {
  const { groupDetails: updateContext } = useContext(AppContext);
  const firstInputRef = useRef(null);

  const next = () => {
    if (!updateContext.groupType) {
      toast.error("Please select a group type");
    } else {
      updateContext.setStep(updateContext.currentPage + 1);
    }
  };

  const videoLinks = {
    Accumulative: "https://example.com/accumulative-video",
    Deductive: "https://example.com/deductive-video",
    Fixed: "https://example.com/fixed-video",
    Adaptive: "https://example.com/adaptive-video",
  };

  // Auto-focus first input when component mounts
  useEffect(() => {
    if (firstInputRef.current && updateContext.focusTrigger) {
      const timer = setTimeout(() => {
        firstInputRef.current.focus();
      }, 200); // Delay to ensure smooth scroll completes first

      return () => clearTimeout(timer);
    }
  }, [updateContext.focusTrigger]);

  const groupTypeOptions = [
    {
      type: "Accumulative",
      description: "Members contribute increasing amounts over time",
    },
    {
      type: "Deductive",
      description: "Members contribute decreasing amounts over time",
    },
    {
      type: "Fixed",
      description: "Members contribute fixed amounts throughout the period",
    },
    {
      type: "Adaptive",
      description: "Skip live auction — allot winner and settle dues manually each month",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto my-6 bg-white rounded-3xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden border border-gray-100">
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white p-8 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
            <span className="text-2xl">🏢</span>
          </div>
          <h2 className="text-3xl font-bold font-['Poppins'] mb-2">Choose Your Group Type</h2>
          <p className="text-red-100 text-sm">Select the type of group you want to create</p>
        </div>
      </div>
      <div className="p-8">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            {groupTypeOptions.map(({ type, description }, index) => (
              <label key={type} className="relative cursor-pointer block">
                <input
                  ref={index === 0 ? firstInputRef : null}
                  type="radio"
                  name="groupType"
                  value={type}
                  checked={updateContext.groupType === type}
                  onChange={() => updateContext.setGroupType(type)}
                  className="sr-only"
                />
                <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${updateContext.groupType === type
                    ? 'border-red-500 bg-red-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${updateContext.groupType === type
                          ? 'border-red-500 bg-red-500'
                          : 'border-gray-300'
                        }`}>
                        {updateContext.groupType === type && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 font-['Poppins']">
                          {type}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {description}
                        </p>
                      </div>
                    </div>
                    <a
                      href={videoLinks[type]}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Watch video about ${type}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-red-50"
                    >
                      <FaVideo className="text-xl" />
                    </a>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-4 pt-6">
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
