import React from "react";
import "./Popup.css";
import { useHistory, useLocation } from 'react-router-dom';
const Popup = ({ text, closePopup, groupId, noofCompanySubscriber, noofSubscriber }) => {
  const history = useHistory();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/chit-fund/manager')
    ? '/chit-fund/manager'
    : '/chit-fund/user';
  // export const Popup = ({ text, closePopup }) => {
  const handleAddNewClick = () => {
    // Navigate to the specific URL when "Add New" is clicked
    history.push(`${basePath}/addgroupsubscriber/${groupId}/addnew`);
    // Close the popup
    closePopup();
  };
  const handleCompanySubscriberClick = () => {
    // Navigate to the Company Subscribers page when the button is clicked
    history.push(`${basePath}/addgroupsubscriber/${groupId}/addcompanysubcriber`);
    // history.push(`/subscribers`); // Replace with the actual URL
    closePopup();
  };
  return (
    <div className="popup-container">
      <div className="popup-body">
        <h3>Add {noofSubscriber} Subscribers </h3>
        <button style={{ width: "30px", height: "30px", border: "none", position: "absolute", top: "-4px", right: "3px", borderRadius: "4px" }} onClick={closePopup}>X</button>
        {/* <button className="popupclose" onClick={closePopup}> X</button> */}
        <div className="popupbuttons">

          <div className="hidden-avatars-container">
            <div className="hidden-avatars" onClick={handleAddNewClick}> + </div>
            <div className="hidden-avatar-label"> New</div>
          </div>
          <div className="hidden-avatars-container">
            <div className="hidden-avatars" onClick={handleCompanySubscriberClick}> + </div>
            <div className="hidden-avatar-label">Company Subscribers ({noofCompanySubscriber ?? 0}) </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Popup;