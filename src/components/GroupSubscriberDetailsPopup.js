import React, { useState } from 'react';
import { useGroupDetailsContext } from '../context/group_context';
import BidSubscriberList from './BidSubscriberList'
import Modal from './Modal';
import "../style/GroupSubscriberDetailsPopup.css";

//data 

//sub compoent while submitting bid need to show the subscribers going to bid
// const GroupSubscriberDetailsPopup = ({ onClose, onCloseRightSide }) => {

//     const { state: groupDetailsState } = useGroupDetailsContext();
//     const { data: groups } = groupDetailsState;
//     console.log(groups.results.groupSubcriberResult);
//     const [people, setPeople] = useState(groups.results.groupSubcriberResult)
//     const [filteredCount, setFilteredCount] = useState(0);

//     useEffect(() => {

//         // Access 'groups' data here
//         // Extract the 'subscribers' array from 'groups' data
//         console.log(groups);

//         // const items = groups ? groups.results.subscribers || [] : [];

//         // Add your logic here using 'groups' data
//     }, [groups]);

//     // Rest of your component code...
//     const handleBidClick = (grpSubid, user_image_from_s3, name, phone, id) => {

//         console.log('Clicked on bid with ID:', grpSubid);
//         if (grpSubid) {
//             onClose(grpSubid, user_image_from_s3, name, phone, id);
//         }
//         else {
//             onClose(null, null, null, null, null);
//         }
//     };
//     const handleFilteredCount = (count) => {
//         setFilteredCount(count); // Update the count of filtered items
//     };

//     return (
//         <div>

//             <section className='bidcontainer'>
//                 <h3>{filteredCount} Group Subscribers</h3>
//                 <BidSubscriberList people={people} onBidClick={handleBidClick} onFilteredCount={handleFilteredCount} />
//                 <button onClick={() => setPeople([])}>clear all</button>
//                 <div className='close-button' onClick={onCloseRightSide}>
//                     X
//                 </div>
//             </section>


//         </div>

//     );
// };
const GroupSubscriberDetailsPopup = ({ onClose, onCloseRightSide }) => {
    const { data } = useGroupDetailsContext();

    const people = data?.results?.groupSubcriberResult || [];

    const [filteredCount, setFilteredCount] = useState(0);

    const handleBidClick = (grpSubid, user_image_from_s3, name, phone, id) => {
        onClose(grpSubid, user_image_from_s3, name, phone, id);
    };

    const handleFilteredCount = (count) => setFilteredCount(count);

    return (
        <Modal isOpen={true} onClose={onCloseRightSide}>
            <div className="subscriber-popup-container">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                        Select Subscriber ({filteredCount} available)
                    </h3>
                    <button
                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                        onClick={onCloseRightSide}
                    >
                        ×
                    </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {people && people.length > 0 ? (
                        <BidSubscriberList
                            people={people}
                            onBidClick={handleBidClick}
                            onFilteredCount={handleFilteredCount}
                        />
                    ) : (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-6xl mb-4">👥</div>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">No Subscribers Available</h4>
                            <p className="text-gray-600">There are no subscribers in this group to select from.</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                        onClick={onCloseRightSide}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
};


export default GroupSubscriberDetailsPopup;
