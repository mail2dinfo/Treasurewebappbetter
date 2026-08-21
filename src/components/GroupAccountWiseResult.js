import React from 'react';
import GroupAccountWiseDataList from './GroupAccountWiseDataList'

const GroupAccountWiseResult = ({ accountWiseData }) => {

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg relative min-w-0 mt-4">
      <div className="absolute -top-4 left-6 z-10 bg-custom-red text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
        Auction Wise Payment Status
      </div>

      {accountWiseData?.length > 0 ? (
        <div className="p-4 pt-8 min-w-0">
          <GroupAccountWiseDataList items={accountWiseData} />
        </div>
      ) : (
        <div className="p-6 pt-10 text-sm text-gray-500">No auction data available.</div>
      )}
    </div>
  );
};





export default GroupAccountWiseResult;
