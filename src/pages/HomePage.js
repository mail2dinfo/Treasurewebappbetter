// import React, { useState, useEffect } from 'react';
// import { TabsNavbar, ReadyGroups, NewGroups, ClosedGroups, User, UserDetails } from '../components';
// import { API_BASE_URL } from '../utils/apiConfig'; // Import API_BASE_URL
// import { useUserContext } from '../context/user_context';
// import { useCompanySubscriberContext } from '../context/companysubscriber_context';
// import styled from 'styled-components';
// import { useHistory } from 'react-router-dom';
// import GroupDataInNavbar from '../components/GroupDataInNavbar';
// import loadingImage from '../images/preloader.gif';
// //for ledger account
// import { useLedgerAccountContext } from "../context/ledgerAccount_context";
// import { useLedgerEntryContext } from "../context/ledgerEntry_context";
// import { useAobContext } from "../context/aob_context";

// import { useGroupsDetailsContext } from "../context/groups_context";


// const HomePage = () => {
//   const history = useHistory();
//   const [selectedTab, setSelectedTab] = useState('ready');
//   // const [groups, setGroups] = useState([]);

//   // const [premium, setPremium] = useState([]);
//   // const [profits, setProfits] = useState([]);

//   const { isLoggedIn, user } = useUserContext();
//   //const [membershipId, setMembershipId] = useState('');
//   // const { state, dispatch } = useCompanySubscriberContext();
//   // const { state, dispatch } = useGroupDetailsContext();

//   // Use distinct variable names for state and dispatch from different contexts
//   const { fetchCompanySubscribers } = useCompanySubscriberContext();
//   const { fetchLedgerAccounts } = useLedgerAccountContext();
//   const { fetchLedgerEntries } = useLedgerEntryContext();
//   const { fetchAobs } = useAobContext();
//   const { state, fetchAllGroups } = useGroupsDetailsContext();
//   const { groups, premium, profits, isLoading } = state;


//   // const fetchGroups = async () => {
//   //   try {
//   //     setIsLoading(true);
//   //     const apiUrl = `${API_BASE_URL}/users/groups`; // Construct the API URL using API_BASE_URL

//   //     const response = await fetch(apiUrl, {
//   //       method: 'GET',
//   //       headers: {
//   //         'Authorization': `Bearer ${user?.results?.token}`,
//   //         'Content-Type': 'application/json',
//   //       },
//   //     });

//   //     if (!response.ok) {
//   //       throw new Error('Failed to fetch groups');
//   //     }

//   //     const data = await response.json();
//   //     console.log('mani into home page');
//   //     console.log(data);



//   //     // if (data.results.groups && data.results.groups.length > 0) {
//   //     //   console.log('came into if condition');
//   //     //   console.log(data.results.groups);
//   //     //   setGroups(data.results.groups); // Set the data.results array into groups

//   //     // }
//   //     // if (data.results.earnedPremium && data.results.earnedPremium.length > 0) {
//   //     //   console.log('came into if condition');
//   //     //   console.log(data.results.earnedPremium);
//   //     //   setPremium(data.results.earnedPremium); // Set the data.results array into groups

//   //     // }
//   //     // if (data.results.subscribers && data.results.subscribers.length > 0) {
//   //     //   setSubscribers(data.results.subscribers); // Set the data.results array into groups
//   //     //   companySubscriberDispatch({ type: 'SET_SUBSCRIBERS', payload: data.results.subscribers });

//   //     // }





//   //   } catch (error) {
//   //     console.error(error);
//   //   } finally {
//   //     setIsLoading(false);
//   //   }
//   // };

//   useEffect(() => {
//     fetchAllGroups();
//     //fetchGroups();
//     fetchCompanySubscribers();
//     fetchLedgerAccounts();
//     fetchLedgerEntries();
//     fetchAobs();

//   }, [user]); // Include user as a dependency

//   // Log groups in a useEffect with a dependency on groups
//   useEffect(() => {
//     console.log('Manidiya');
//     console.log(groups);
//   }, [groups]);

//   // useEffect(() => {
//   //   if (user.results.userAccounts && user.results.userAccounts.length > 0) {

//   //     const membership = user.results.userAccounts[0];
//   //     console.log(membership.membershipId);
//   //     setMembershipId(membership.membershipId);
//   //   }
//   // }, [user]);

//   const handleStartGroup = () => {
//     history.push('/chit-fund/user/startagroup');

//   };

//   if (isLoading) {
//     return (
//       <>
//         <img src={loadingImage} className='loading-img' alt='loding' />
//         <div className="placeholder" style={{ height: '50vh' }}></div>
//       </>
//     );
//   }

//   return (<section className='section'>
//     <Wrapper className='section-center'>

//       <div class="list-container">
//         <div >
//           {localStorage.getItem('unauthenticatedGroup') && <GroupDataInNavbar />}
//         </div>

//         <UserDetails groups={groups} premium={premium} />



//         < div class="grid-2" >
//           <h3>My Groups ({groups.length})</h3>
//           <div style={{ marginTop: "24px" }}>
//             {groups.length === 0 ? (
//               <>
//                 <button className="start-group-button" onClick={handleStartGroup}>
//                   Start a group
//                 </button>
//               </>
//             ) : (
//               <>
//                 <TabsNavbar
//                   selectedTab={selectedTab}
//                   onSelectTab={(tab) => setSelectedTab(tab)}
//                   groups={groups}
//                 />
//                 {selectedTab === 'ready' ? (
//                   <ReadyGroups groups={groups} selectedTab={selectedTab} />
//                 ) : selectedTab === 'new' ? (
//                   <NewGroups groups={groups} selectedTab={selectedTab} refreshGroups={fetchAllGroups} />
//                 ) : (
//                   <ClosedGroups groups={groups} /> // 👈 Add this for closed
//                 )}
//               </>
//             )}
//           </div>
//         </div >

//       </div >
//     </Wrapper >
//   </section >
//   );
// }
// // const Wrapper = styled.section`
// // min-height: 300vh;
// //  display: list;    
// // padding-top:20px;

// //    .list-container {
// //     display: list; 


// //   }

// //   .grid-1 {


// //     padding-top: 2rem;
// // display: grid;
// // gap: 3rem 2rem;
// // @media (min-width: 992px) {
// //   grid-template-columns: 1fr 1fr;
// // }

// //   }

// //   .fraction-1 {
// //    display:flex;

// //     text-align: center;
// //     flex-direction: column;

// //   }

// //   /* Add styling for the dashboard boxes */
// //   .dashboard-box {
// //     background-color: #ffffff;
// //     border-radius: 10px;
// //     padding: 15px;
// //     box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
// //     text-align: center;
// //     margin: 10px;
// //     width:10rem;
// //   }

// //   .dashboard-box h4 {
// //     font-size: 18px;
// //     color: #333;
// //   }

// //   .dashboard-box p {
// //     font-size: 24px;
// //     font-weight: bold;
// //     color: #007bff; /* Change the color to your preference */
// //   }

// //   /* Additional styles for .fraction-2 */
// //   .fraction-2 {

// //     display: grid;
// //     grid-template-columns: auto auto auto;
// //     align-items: center;
// //     justify-content: left;
// //     column-gap: 1rem;
// //     row-gap: 2px;
// //     margin-bottom: 3rem;


// //   }

// //   .mini-dashboard {
// //     display: flex;
// //     flex-direction: row;
// //     padding-left:8rem;

// //   }

// //   .grid-2,
// //   .grid-3 {
// //     background-color: #f0f0f0;
// //   padding: 20px; /* Adjust padding as needed */
// //   text-align: left;
// //   margin-top: 20px; /* Add margin at the top as needed */
// //   border-radius: 10px; /* Add border radius for rounded corners */

// // }
// //   }


// //   /* Additional styles for the button and victory cup image */
// // .start-group-button { 
// //   background-color: var(--clr-red-dark);
// //   color: #fff; /* Button text color */
// //   border: none;
// //   border-radius: 10px;
// //   padding: 10px 50px;
// //   width:200px;
// //   margin: 10px 60px; /* Adjust the margin as needed */
// //   cursor: pointer;
// //   display: flex;
// //   align-items: center;
// // }

// // .add-customer-button {
// //     background: transparent;
// //     border-color: transparent;
// //     width: 4rem;
// //     height: 4rem;
// //     background: var(--clr-red-dark);
// //     display: flex;
// //     align-items: center;
// //     justify-content: center;
// //     border-radius: 50%;
// //     color: var(--clr-white);
// //     cursor: pointer;
// //     margin-left: 2rem;
// //     margin-top: 1px;
// //     align-self: center;
// //     min-width: 2rem;

// // }

// // .start-group-button img {
// //   width: 20px; /* Adjust the width of the victory cup image */
// //   margin-left: 10px; /* Add spacing between text and image */
// // }
// //   @media (min-width: 992px) 
// //   {
// //     height: calc(100vh - 5rem);

// //   }

// //   .start-group-button {
// //     background-color: var(--clr-red-dark);
// //     color: #fff;
// //     border: none;
// //     border-radius: 10px;
// //     padding: 10px 50px;
// //     width: 200px;
// //     margin: 10px auto; /* Center horizontally */
// //     display: flex;
// //     align-items: center;
// //     justify-content: center; /* Center vertically */
// //     cursor: pointer;
// //   }
// // `
// const Wrapper = styled.section`
//   min-height: 100vh;
//   padding: 2rem 1rem;

//   .list-container {
//     max-width: 1200px;
//     margin: auto;
//   }

//   .grid-2 {
//     background-color: #ffffff;
//     padding: 2rem;
//     margin-top: 2rem;
//     border-radius: 12px;
//     box-shadow: 0 0 10px rgba(0,0,0,0.05);
//   }

//   h3 {
//     font-size: 1.5rem;
//     color: #333;
//     margin-bottom: 1.5rem;
//   }

//   .start-group-button {
//     background-color: var(--clr-red-dark);
//     color: #fff;
//     border: none;
//     border-radius: 8px;
//     padding: 12px 24px;
//     font-size: 1rem;
//     cursor: pointer;
//     transition: background 0.3s ease;
//     display: block;
//     margin: 2rem auto;
//   }

//   .start-group-button:hover {
//     background-color: #b30000;
//   }

//   @media (max-width: 768px) {
//     padding: 1rem;

//     .grid-2 {
//       padding: 1rem;
//     }
//   }
// `;


// export default HomePage;

import { useState, useEffect } from 'react';
import { ReadyGroups, NewGroups, ClosedGroups, UserDetails, ScrollToTop } from '../components';
import { useHistory } from 'react-router-dom';
import GroupDataInNavbar from '../components/GroupDataInNavbar';
import loadingImage from '../images/preloader.gif';
import { useUserContext } from '../context/user_context';
import { useCompanySubscriberContext } from '../context/companysubscriber_context';
import { useLedgerAccountContext } from "../context/ledgerAccount_context";
import { useLedgerEntryContext } from "../context/ledgerEntry_context";
import { useAobContext } from "../context/aob_context";
import { useGroupsDetailsContext } from "../context/groups_context";
import '../style/home.css'; // Make sure this path is correct

const HomePage = ({
  basePath = '/chit-fund/user',
  canCreateGroup = true,
  groupsOnly = false,
  alwaysShowCreateGroup = false,
  canAddSubscriber = true,
  canDeleteGroup = true,
}) => {
  const history = useHistory();
  const [selectedTab, setSelectedTab] = useState('ready');
  const { user } = useUserContext();
  const { fetchCompanySubscribers } = useCompanySubscriberContext();
  const { fetchLedgerAccounts } = useLedgerAccountContext();
  const { fetchLedgerEntries } = useLedgerEntryContext();
  const { fetchAobs } = useAobContext();
  const { state, fetchAllGroups } = useGroupsDetailsContext();
  const { groups, premium, isLoading } = state;

  useEffect(() => {
    fetchAllGroups();
    fetchCompanySubscribers();
    fetchLedgerAccounts();
    fetchLedgerEntries();
    fetchAobs();
    // Only re-fetch when the auth session changes — not on every user object identity change.
  }, [user?.results?.token]);

  const handleStartGroup = () => {
    history.push(`${basePath}/startagroup`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-4">
        <div className="flex items-center justify-center min-h-[40vh] w-full">
          <div className="text-center">
            <img src={loadingImage} className="loading-img w-20 h-20 mx-auto mb-4" alt="" style={{ marginTop: 0 }} />
            {groupsOnly && <p className="text-gray-600 font-medium">Loading groups...</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 md:p-4">
      <div className={groupsOnly ? 'max-w-7xl mx-auto' : 'list-container max-w-7xl mx-auto'}>
        {!groupsOnly && localStorage.getItem('unauthenticatedGroup') && <GroupDataInNavbar />}

        {!groupsOnly && <UserDetails groups={groups} premium={premium} />}

        <div className="group-container">
          <div className={`my-groups-container ${alwaysShowCreateGroup ? 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3' : ''}`}>
            <h3 className="my-groups-title">My Groups ({groups.length})</h3>
            {canCreateGroup && alwaysShowCreateGroup && (
              <button
                className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm"
                onClick={handleStartGroup}
              >
                Start a group
              </button>
            )}
          </div>

          {groups.length === 0 ? (
            canCreateGroup && !alwaysShowCreateGroup ? (
              <button className="start-group-button" onClick={handleStartGroup}>
                Start a group
              </button>
            ) : (
              <p className="text-center text-gray-500 py-8">No groups created yet.</p>
            )
          ) : (
            <>
              <div className="tabs-wrapper">
                <ul className="tabs-grid">
                  <li
                    className={selectedTab === 'ready' ? 'active' : ''}
                    onClick={() => setSelectedTab('ready')}
                  >
                    {groupsOnly ? 'Ready' : 'Ready Groups'} ({groups.filter(group => group.Status === 'Ready').length})
                  </li>
                  <li
                    className={selectedTab === 'new' ? 'active' : ''}
                    onClick={() => setSelectedTab('new')}
                  >
                    {groupsOnly ? 'New' : 'New Groups'} ({groups.filter(group => group.Status === 'New').length})
                  </li>
                  <li
                    className={selectedTab === 'closed' ? 'active' : ''}
                    onClick={() => setSelectedTab('closed')}
                  >
                    {groupsOnly ? 'Closed' : 'Closed Groups'} ({groups.filter(group => group.Status === 'Closed').length})
                  </li>
                </ul>

              </div>

              {selectedTab === 'ready' && (
                <ReadyGroups groups={groups} selectedTab={selectedTab} basePath={basePath} />
              )}
              {selectedTab === 'new' && (
                <NewGroups
                  groups={groups}
                  selectedTab={selectedTab}
                  refreshGroups={fetchAllGroups}
                  basePath={basePath}
                  canAddSubscriber={canAddSubscriber}
                  canDeleteGroup={canDeleteGroup}
                />
              )}
              {selectedTab === 'closed' && <ClosedGroups groups={groups} basePath={basePath} />}
            </>
          )}
        </div>
      </div>
      <ScrollToTop />
    </div>
  );
};

export default HomePage;
