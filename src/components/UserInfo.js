import React, { useState, useEffect } from 'react';
import { GoRepo, GoArrowBoth } from 'react-icons/go';
import { FiUsers, FiUserPlus } from 'react-icons/fi';

const UserInfo = ({ data }) => {
  const [groupName, setGroupName] = useState([]);
  const [amount, setAmount] = useState([]);
  const [type, setType] = useState([]);
  //  const [type, setType] = useState([]);
  const [commisionType, setCommisionType] = useState([]);
  const [commissionAmount, setCommisionAmt] = useState([]);


  useEffect(() => {
    if (data && data.results) {
      // Set groupTransactionInfo when data is available
      const { amount, type, commisionType, commissionAmount, groupName } = data.results;
      setAmount(amount);
      setType(type);
      setCommisionType(commisionType);
      setCommisionAmt(commissionAmount);
      setGroupName(groupName);

    }
  }, [data]);




  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Compact Group Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">{groupName}</h1>
        </div>

        {/* Compact Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Group Amount */}
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-3 border border-pink-200">
            <div className="flex items-center gap-2 mb-1">
              <GoRepo className="text-pink-600 text-sm" />
              <span className="text-xs font-medium text-gray-600">Amount</span>
            </div>
            <div className="text-lg font-bold text-gray-900">₹{amount?.toLocaleString()}</div>
          </div>

          {/* Group Type */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <FiUsers className="text-green-600 text-sm" />
              <span className="text-xs font-medium text-gray-600">Type</span>
            </div>
            <div className="text-lg font-bold text-gray-900 capitalize">{type}</div>
          </div>

          {/* Commission Type */}
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <FiUserPlus className="text-purple-600 text-sm" />
              <span className="text-xs font-medium text-gray-600">Commission</span>
            </div>
            <div className="text-lg font-bold text-gray-900 capitalize">{commisionType}</div>
          </div>

          {/* Commission Amount */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <GoArrowBoth className="text-amber-600 text-sm" />
              <span className="text-xs font-medium text-gray-600">Comm. Amount</span>
            </div>
            <div className="text-lg font-bold text-gray-900">₹{commissionAmount?.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default UserInfo;
