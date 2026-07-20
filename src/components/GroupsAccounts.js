import React, { useState, useEffect } from 'react';
import GroupAccountList from './GroupAccountList';
import { ArrowUp, Database } from 'lucide-react';

const GroupsAccounts = ({ groupTransactionInfo, type }) => {
  //console.log(groupTransactionInfo);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeItem = (id) => {

  };

  const editItem = (id) => {

  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg relative mt-6">
      {/* Header */}
      <div className="absolute -top-4 left-6 bg-custom-red text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
        Group Accounts
      </div>

      <div className="p-6 pt-8">
        {groupTransactionInfo?.length > 0 ? (
          <div className="space-y-4">
            {/* Account List */}
            <GroupAccountList items={groupTransactionInfo} removeItem={removeItem} editItem={editItem} type={type} />
          </div>
        ) : (
          /* No Data State */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Database className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No auctions done</h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
              There are currently no group account transactions available. Data will appear here once group accounts are created or imported.
            </p>
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center z-50 group"
        >
          <ArrowUp size={20} className="group-hover:animate-bounce" />
        </button>
      )}
    </div>
  );
};

export default GroupsAccounts;
