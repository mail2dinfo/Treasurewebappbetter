// import React from "react";
// import { useHistory } from "react-router-dom";
// import styled from "styled-components";
// import { API_BASE_URL } from '../utils/apiConfig';
// import { useUserContext } from '../context/user_context';
// import moment from "moment";

// const NewGroups = ({ groups, selectedTab, refreshGroups }) => {
//     const { user, userRole } = useUserContext();

//     const newGroups = Array.isArray(groups) ? groups.filter((group) => group.Status === "New") : [];
//     const history = useHistory();

//     const handleStartAuction = (groupId) => {
//         history.push(`/addgroupsubscriber/${groupId}`);
//     };

//     const handleDeleteGroup = async (id) => {
//         if (!window.confirm("Are you sure you want to delete this group?")) return;

//         const apiUrl = `${API_BASE_URL}/groups/${id}`;

//         try {
//             const response = await fetch(apiUrl, {
//                 method: 'DELETE',
//                 headers: {
//                     'Authorization': `Bearer ${user?.results?.token}`,
//                     'Content-Type': 'application/json',
//                 },
//             });

//             const result = await response.json();

//             if (response.ok) {
//                 alert(result.message || "Group deleted successfully");
//                 refreshGroups(); // Trigger parent to re-fetch the list
//             } else {
//                 alert(result.message || "Failed to delete group");
//             }
//         } catch (error) {
//             console.error('An error occurred while deleting the group:', error);
//         }
//     };

//     return (
//         <Wrapper>
//             {selectedTab === "new" && (
//                 <ul className="list">
//                     {newGroups.map((group, index) => (
//                         <li key={group.id} className={`listItem ${index === 0 ? "firstItem" : ""}`}>
//                             <div className="column">
//                                 <div className="groupInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                     <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                         Group Name
//                                     </span>
//                                     <span className="value" style={{ fontSize: "14px" }}>
//                                         : {group?.group_name}
//                                     </span>
//                                 </div>
//                                 <div className="groupInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                     <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                         Amount
//                                     </span>
//                                     <span className="value" style={{ fontSize: "14px" }}>
//                                         : {group.amount}
//                                     </span>
//                                 </div>
//                                 <div className="groupInfo" style={{ marginTop: "6px", display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                     <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                         Outstanding Subscribers
//                                     </span>
//                                     <span className="value" style={{ fontSize: "14px" }}>
//                                         : {group.PendingSubscribers} out of {group.no_of_subscribers_required}
//                                     </span>
//                                 </div>


//                             </div>
//                             <div className="column">
//                                 <div className="groupInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                     <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                         Next Auction Date
//                                     </span>
//                                     <span className="value" style={{ fontSize: "14px" }}>
//                                         : {moment(group?.next_auct_date).format("DD-MM-YYYY")}
//                                     </span>
//                                 </div>
//                                 <div className="groupInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                     <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                         Auction Time
//                                     </span>
//                                     <span className="value" style={{ fontSize: "14px" }}>
//                                         : {moment(group.auct_start_time, "HH:mm:ss").format("hh:mm A")} - {moment(group.auct_end_time, "HH:mm:ss").format("hh:mm A")}

//                                     </span>
//                                 </div>
//                             </div>
//                             <div className="column">
//                                 <div className="groupInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                     <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                         Start Date
//                                     </span>
//                                     <span className="value" style={{ fontSize: "14px" }}>
//                                         : {moment(group?.start_date).format("DD-MM-YYYY")}
//                                     </span>
//                                 </div>
//                                 <div className="groupInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                     <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                         Closing Date
//                                     </span>
//                                     <span className="value" style={{ fontSize: "14px" }}>
//                                         : {moment(group?.end_date).format("DD-MM-YYYY")}
//                                     </span>
//                                 </div>
//                             </div>
//                             <div>
//                                 <button className="button" style={{ marginTop: "12px", fontSize: "13px", width: "128px" }} onClick={() => handleStartAuction(group.id)}>
//                                     Add Subscribers
//                                 </button>
//                             </div>
//                             <div>
//                                 <button
//                                     className="button delete-button"
//                                     onClick={() => handleDeleteGroup(group.id)}
//                                 >
//                                     🗑
//                                 </button>
//                             </div>
//                         </li>
//                     ))}
//                 </ul>
//             )}
//         </Wrapper>
//     );
// };

// const Wrapper = styled.article`
//     background: var(--clr-white);
//     border-radius: var(--radius);
//     position: relative;
//     box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
//     padding: 10px;

//     .list {
//         list-style: none;
//         padding: 0;
//     }

//     .listItem {
//         border: 1px solid #e0e0e0;
//         margin: 1rem;
//         padding: 1.5rem;
//         border-radius: 5px;
//         background-color: #fff;
//         display: flex;
//         justify-content: space-between;
//         &.firstItem {
//             padding-top: 20px;
//         }
//     }

//     .column {
//         flex: 1;
//     }

//     .groupInfo,
//     .timeInfo,
//     .subscribersInfo {
//         margin-bottom: 0.5rem;
//         font-size: 1.2em;
//         flex-direction: column;
//     }

//     .heading {
//         color: black;
//         font-weight: bold;
//     }

//     .value {
//         color: #8b4513;
//     }

//     .timeInfo {
//         font-size: 1.1em;
//         color: #007bff;
//     }

//     .button {
//         background-color: #007bff;
//         color: #fff;
//         border: none;
//         border-radius: 3px;
//         padding: 0.5rem 1rem;
//         cursor: pointer;
//         font-size: 1rem;
//     }
//         .delete-button {
//     background-color: #dc3545;
//     border: none;
//     border-radius: 50%;
//     width: 40px;
//     height: 40px;
//     color: white;
//     font-size: 18px;
//     font-weight: bold;
//     box-shadow: inset 2px 2px 5px rgba(0,0,0,0.2), inset -2px -2px 5px rgba(255,255,255,0.1);
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     margin-top: 12px;
//     transition: all 0.2s ease;
//     cursor: pointer;
// }

// .delete-button:hover {
//     background-color: #c82333;
//     transform: scale(1.05);
// }

//     @media (min-width: 992px) {
//         .listItem {
//             display: flex; /* Display items in a row for larger screens */
//             /* Adjust other styles for larger screens if needed */
//             justify-content: space-between;
//         }

//         .groupInfo {
//             display: block; /* Display each item on a new line */
//         }
//     }

//     @media (max-width: 991px) {
//         .listItem {
//             flex-direction: column; /* Display items as a list for smaller screens */
//             justify-content: space-between;
//         }
//     }
// `;

// export default NewGroups;

// src/components/NewGroups.js

import { useHistory } from "react-router-dom";
import moment from "moment";
import { API_BASE_URL } from "../utils/apiConfig";
import { useUserContext } from "../context/user_context";

const NewGroups = ({
  groups,
  selectedTab,
  refreshGroups,
  basePath = '/chit-fund/user',
  canAddSubscriber = true,
  canDeleteGroup = true,
}) => {
  const { user } = useUserContext();
  const history = useHistory();

  const newGroups = Array.isArray(groups)
    ? groups.filter((group) => group.Status === "New")
    : [];

  const handleStartAuction = (groupId) => {
    history.push(`${basePath}/addgroupsubscriber/${groupId}`);
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;

    const apiUrl = `${API_BASE_URL}/groups/${id}`;

    try {
      const response = await fetch(apiUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user?.results?.token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "Group deleted successfully");
        refreshGroups();
      } else {
        alert(result.message || "Failed to delete group");
      }
    } catch (error) {
      console.error("An error occurred while deleting the group:", error);
    }
  };

  return (
    <div className="group-wrapper">
      {selectedTab === "new" && (
        <>
          {newGroups.length === 0 ? (
            <div className="progressInfo">No new groups found</div>
          ) : (
            newGroups.map((group) => (
              <div key={group.id} className="group-card">
                {/* Grid for details */}
                <div className="group-details-grid">
                  <div className="group-detail">
                    <span className="group-detail-label">Group Name</span>
                    <span className="group-detail-value">
                      {group.group_name}
                    </span>
                  </div>
                  <div className="group-detail">
                    <span className="group-detail-label">Amount</span>
                    <span className="group-detail-value">{group.amount}</span>
                  </div>
                  <div className="group-detail">
                    <span className="group-detail-label">
                      Outstanding Subscribers
                    </span>
                    <span className="group-detail-value">
                      {group.PendingSubscribers} out of{" "}
                      {group.no_of_subscribers_required}
                    </span>
                  </div>
                  <div className="group-detail">
                    <span className="group-detail-label">Next Auction Date</span>
                    <span className="group-detail-value">
                      {moment(group?.next_auct_date).format("DD-MM-YYYY")}
                    </span>
                  </div>
                  <div className="group-detail">
                    <span className="group-detail-label">Auction Time</span>
                    <span className="group-detail-value">
                      {moment(group.auct_start_time, "HH:mm:ss").format(
                        "hh:mm A"
                      )}{" "}
                      -{" "}
                      {moment(group.auct_end_time, "HH:mm:ss").format("hh:mm A")}
                    </span>
                  </div>
                  <div className="group-detail">
                    <span className="group-detail-label">Start Date</span>
                    <span className="group-detail-value">
                      {moment(group?.start_date).format("DD-MM-YYYY")}
                    </span>
                  </div>
                  <div className="group-detail">
                    <span className="group-detail-label">Closing Date</span>
                    <span className="group-detail-value">
                      {moment(group?.end_date).format("DD-MM-YYYY")}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="group-actions">
                  {canAddSubscriber && (
                    <button
                      className="group-button"
                      onClick={() => handleStartAuction(group.id)}
                    >
                      Add Subscribers
                    </button>
                  )}
                  {canDeleteGroup && (
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      🗑
                    </button>
                  )}
                </div>

              </div>
            ))
          )}
        </>
      )}
    </div>
  );
};

export default NewGroups;



