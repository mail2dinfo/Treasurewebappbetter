// import React, { useState, useEffect } from 'react';
// import styled from 'styled-components';
// import DashboardAreaWiseAccounts from './DashboardAreaWiseAccounts';
// import DashboardSubscriberGroupWiseAccounts from './DashboardSubscriberGroupWiseAccounts';


// const DashboardAreaWiseGroups = () => {
//     return (<section className='section'>
//         <Wrapper className='section-center' >
//             <DashboardAreaWiseAccounts />
//             <DashboardSubscriberGroupWiseAccounts />
//         </Wrapper>
//     </section>

//     );
// };
// const Wrapper = styled.div`
//   padding-top: 2rem;
//   display: grid;
//   gap: 3rem 2rem;
//   @media (min-width: 992px) {
//     grid-template-columns: 1fr 1fr;
//   }
//   /* align-items: start; */
// `;

// export default DashboardAreaWiseGroups;

import React, { useState } from 'react';
import DashboardAreaWiseAccounts from './DashboardAreaWiseAccounts';
import DashboardSubscriberGroupWiseAccounts from './DashboardSubscriberGroupWiseAccounts';

const DashboardAreaWiseGroups = () => {
  const [showAreaWise, setShowAreaWise] = useState(false);
  const [showSubscriberWise, setShowSubscriberWise] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-white sm:text-xl">Detailed Analytics</h2>
        <p className="text-blue-100 text-sm">Area-wise and subscriber-wise receivables breakdown</p>
      </div>
      
      <div className="p-3 sm:p-6">
        <div className="space-y-4">
          {/* Area Wise Receivables */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button 
              className="w-full px-4 py-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between text-left sm:px-6"
              onClick={() => setShowAreaWise(!showAreaWise)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 shrink-0 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📍</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">Area Wise Receivables</h3>
                  <p className="text-sm text-gray-600">Breakdown by geographical areas</p>
                </div>
              </div>
              <span className="text-gray-400 text-xl shrink-0">{showAreaWise ? '−' : '+'}</span>
            </button>
            {showAreaWise && (
              <div className="border-t border-gray-200 p-3 bg-white sm:p-6 overflow-x-hidden">
                <DashboardAreaWiseAccounts />
              </div>
            )}
          </div>

          {/* Subscriber Group Wise Receivables */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button 
              className="w-full px-4 py-4 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between text-left sm:px-6"
              onClick={() => setShowSubscriberWise(!showSubscriberWise)}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 shrink-0 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">👥</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">Subscriber Group Wise Receivables</h3>
                  <p className="text-sm text-gray-600">Breakdown by subscriber groups</p>
                </div>
              </div>
              <span className="text-gray-400 text-xl shrink-0">{showSubscriberWise ? '−' : '+'}</span>
            </button>
            {showSubscriberWise && (
              <div className="border-t border-gray-200 p-3 bg-white sm:p-6 overflow-x-hidden">
                <DashboardSubscriberGroupWiseAccounts />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAreaWiseGroups;



