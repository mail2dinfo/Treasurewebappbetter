import React, { useState, useEffect } from 'react';
import { FaMoneyBillWave, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const GroupWiseOverallDue = ({ GroupWiseOverallDuedata }) => {
  const [total_supposed_to_pay, setTotal_supposed_to_pay] = useState('');
  const [total_paid_amount, setTotal_paid_amount] = useState('');
  const [total_outstanding_balance, setTotal_outstanding_balance] = useState('');

  useEffect(() => {
    // console.log('GroupWiseOverallDue:', GroupWiseOverallDuedata);

    if (GroupWiseOverallDuedata) {
      const {
        group_id,
        total_supposed_to_pay,
        total_paid_amount,
        total_outstanding_balance,
      } = GroupWiseOverallDuedata;

      // console.log('Received data:', {
      //     group_id,
      //     total_supposed_to_pay,
      //     total_paid_amount,
      //     total_outstanding_balance,
      // });

      if (
        group_id !== undefined &&
        total_supposed_to_pay !== undefined &&
        total_paid_amount !== undefined &&
        total_outstanding_balance !== undefined
      ) {
        // console.log('Setting state:', {
        //     group_id,
        //     total_supposed_to_pay,
        //     total_paid_amount,
        //     total_outstanding_balance,
        // });

        setTotal_supposed_to_pay(total_supposed_to_pay || 0);
        setTotal_paid_amount(total_paid_amount || 0);
        setTotal_outstanding_balance(total_outstanding_balance || 0);
      }
    }
  }, [GroupWiseOverallDuedata]);



  const summaryItems = [
    {
      id: 1,
      icon: <FaMoneyBillWave className="w-6 h-6" />,
      label: 'Total Amount',
      value: total_supposed_to_pay,
      color: 'pink',
    },
    {
      id: 2,
      icon: <FaCheckCircle className="w-6 h-6" />,
      label: 'Total Paid',
      value: total_paid_amount,
      color: 'green',
    },
    {
      id: 3,
      icon: <FaExclamationCircle className="w-6 h-6" />,
      label: 'Total Outstanding',
      value: total_outstanding_balance,
      color: 'purple',
    },
  ];

  console.log('Rendered with state:', {
    total_supposed_to_pay,
    total_paid_amount,
    total_outstanding_balance,
  });


  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg relative">
      {/* Header */}
      <div className="absolute -top-4 left-6 bg-custom-red text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
        Financial Summary
      </div>

      {/* Summary Cards */}
      <div className="p-6 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryItems.map(({ id, icon, label, value, color }) => (
            <div key={id} className="bg-gradient-to-br from-white to-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${color === 'pink' ? 'bg-pink-100 text-pink-600' : color === 'green' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">₹{value ?? 0}</h3>
                  <p className="text-sm text-gray-600 font-medium">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};



export default GroupWiseOverallDue;
