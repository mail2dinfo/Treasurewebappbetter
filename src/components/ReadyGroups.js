// import React from "react";
// import { useHistory } from "react-router-dom";
// import styled from "styled-components";
// import moment from "moment";

// const ReadyGroups = ({ groups, selectedTab }) => {
//     const readyGroups = groups?.filter((group) => group.Status === "Ready");
//     const history = useHistory();
//     // Function to calculate remaining days
//     const calculateRemainingDays = (nextAuctDate) => {
//         const nextAuctDateMoment = moment(nextAuctDate);
//         const currentDate = moment();
//         const remainingDays = nextAuctDateMoment.diff(currentDate, "days");
//         return remainingDays;
//     };
//     const handleStartAuction = (groupId) => {
//         history.push(`/groups/${groupId}`);
//     };

//     return (
//         <Wrapper>
//             {selectedTab === "ready" && (
//                 <>
//                     {readyGroups.length === 0 ? (
//                         <div className="progressInfo">Group preparation is in progress</div>
//                     ) : (
//                         <ul className="list">
//                             {readyGroups.map((group, index) => (
//                                 <li key={group.id} className={`listItem ${index === 0 ? "firstItem" : ""}`}>
//                                     <div className="column">
//                                         <div className="groupInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                             <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                                 Group Name
//                                             </span>
//                                             <span className="value" style={{ fontSize: "14px" }}>
//                                                 : {group?.group_name}
//                                             </span>
//                                         </div>
//                                         <div className="groupInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                             <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                                 Amount
//                                             </span>
//                                             <span className="value" style={{ fontSize: "14px" }}>
//                                                 : {group.amount}
//                                             </span>
//                                         </div>
//                                     </div>
//                                     <div className="column">
//                                         <div className="groupInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                             <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                                 Start Date
//                                             </span>
//                                             <span className="value" style={{ fontSize: "14px" }}>
//                                                 : {moment(group?.start_date).format("DD-MM-YYYY")}
//                                             </span>
//                                         </div>
//                                         <div className="groupInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                             <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                                 Closing Date
//                                             </span>
//                                             <span className="value" style={{ fontSize: "14px" }}>
//                                                 : {moment(group?.end_date).format("DD-MM-YYYY")}
//                                             </span>
//                                         </div>
//                                     </div>
//                                     <div className="column">
//                                         <div className="groupInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                             <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                                 Next Auction Date
//                                             </span>
//                                             {/* Calculate remaining days and display */}
//                                             <span className="value" style={{ fontSize: "14px" }}>
//                                                 : {calculateRemainingDays(group.next_auct_date)} days to go
//                                             </span>
//                                         </div>
//                                         <div className="timeInfo" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}>
//                                             <span className="heading" style={{ fontSize: "14px", minWidth: "160px" }}>
//                                                 Auction Time
//                                             </span>
//                                             <span className="value" style={{ fontSize: "14px" }}>
//                                                 : {moment(group.auct_start_time, "HH:mm:ss").format("hh:mm A")} - {moment(group.auct_end_time, "HH:mm:ss").format("hh:mm A")}

//                                             </span>
//                                         </div>
//                                     </div>
//                                     <div>
//                                         {/* <div className='subscribersInfo'>
//                       <span className='heading'>Pending Subscribers:</span> <span className='value'>{group.PendingSubscribers} out of {group.no_of_subscribers_required}</span>
//                     </div> */}
//                                         <button className="button" style={{ marginTop: "12px", fontSize: "13px", width: "128px" }} onClick={() => handleStartAuction(group.id)}>
//                                             Group Details
//                                         </button>
//                                     </div>
//                                 </li>
//                             ))}
//                         </ul>
//                     )}
//                 </>
//             )}
//         </Wrapper>
//     );
// };

// const Wrapper = styled.article`
//     background: var(--clr-red);
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

// export default ReadyGroups;

// src/components/ReadyGroups.js


import { useHistory } from "react-router-dom";
import moment from "moment";

const ReadyGroups = ({ groups, selectedTab, basePath = '/chit-fund/user' }) => {
    const readyGroups = groups?.filter((group) => group.Status === "Ready");
    const history = useHistory();

    const calculateRemainingDays = (nextAuctDate) => {
        const nextAuctDateMoment = moment(nextAuctDate);
        const currentDate = moment();
        return nextAuctDateMoment.diff(currentDate, "days");
    };

    const handleStartAuction = (groupId) => {
        history.push(`${basePath}/groups/${groupId}`);
    };

    return (
        <>
            {selectedTab === "ready" && (
                <>
                    {readyGroups.length === 0 ? (
                        <div className="group-wrapper">
                            <div className="progressInfo">
                                Group preparation is in progress
                            </div>
                        </div>
                    ) : (
                        <div className="group-wrapper">
                            {readyGroups.map((group) => (
                                <div key={group.id} className="group-card">
                                    <div className="group-details-grid">
                                        <div className="group-detail">
                                            <span className="group-detail-label">Group Name</span>
                                            <span className="group-detail-value">{group.group_name}</span>
                                        </div>
                                        <div className="group-detail">
                                            <span className="group-detail-label">Amount</span>
                                            <span className="group-detail-value">{group.amount}</span>
                                        </div>
                                        <div className="group-detail">
                                            <span className="group-detail-label">Start Date</span>
                                            <span className="group-detail-value">
                                                {moment(group.start_date).format("DD-MM-YYYY")}
                                            </span>
                                        </div>
                                        <div className="group-detail">
                                            <span className="group-detail-label">Closing Date</span>
                                            <span className="group-detail-value">
                                                {moment(group.end_date).format("DD-MM-YYYY")}
                                            </span>
                                        </div>
                                        <div className="group-detail">
                                            <span className="group-detail-label">Next Auction Date</span>
                                            <span className="group-detail-value">
                                                {calculateRemainingDays(group.next_auct_date)} days to go
                                            </span>
                                        </div>
                                        <div className="group-detail">
                                            <span className="group-detail-label">Auction Time</span>
                                            <span className="group-detail-value">
                                                {moment(group.auct_start_time, "HH:mm:ss").format("hh:mm A")} -{" "}
                                                {moment(group.auct_end_time, "HH:mm:ss").format("hh:mm A")}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        className="group-button"
                                        onClick={() => handleStartAuction(group.id)}
                                    >
                                        Group Details
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default ReadyGroups;

