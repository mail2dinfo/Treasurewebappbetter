import React from 'react';
import GroupSubscriberWiseDataList from './GroupSubscriberWiseDataList'

const GroupSubscriberWiseResult = ({ subscriberWiseData }) => {


  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg relative min-w-0 mt-4">
      <div className="absolute -top-4 left-6 z-10 bg-custom-red text-white px-4 py-1 rounded-full text-sm font-medium shadow-md">
        Subscriber Wise Payment Status
      </div>

      {subscriberWiseData?.length > 0 ? (
        <div className="p-4 pt-8 min-w-0">
          <GroupSubscriberWiseDataList items={subscriberWiseData} />
        </div>
      ) : (
        <div className="p-6 pt-10 text-sm text-gray-500">No subscriber data available.</div>
      )}
    </div>
  );
};



export default GroupSubscriberWiseResult;
