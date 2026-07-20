import React, { useState } from 'react';

// Subcomponent to show subscribers going to bid
const BidSubscriberList = ({ people, onBidClick, onFilteredCount }) => {
    const [searchText, setSearchText] = useState('');

    const filteredPeople = people.filter(
        (person) =>
            person.group_won === 0 && person.name.toLowerCase().includes(searchText.toLowerCase())
    );

    onFilteredCount(filteredPeople.length);

    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    return (
        <>
            <div>
                <label htmlFor="search">Search by Name: </label>
                <input
                    type="text"
                    id="search"
                    value={searchText}
                    onChange={handleSearchChange}
                    className="search-bar"
                    placeholder="Enter name to search"
                />
            </div>
            {filteredPeople.map((person) => {
                // Debug: Log the person object to see available fields
                console.log("BidSubscriberList - person object:", person);
                const { group_subscriber_id, subscriber_id, id, name, phone, user_image_from_s3 } = person;
                // Use subscriber_user_id if available, otherwise fall back to id
                const subscriberId = subscriber_id || id;
                console.log("BidSubscriberList - subscriberId:", subscriberId, "from subscriber_user_id:", subscriber_id, "or id:", id);
                return (
                    <article
                        key={group_subscriber_id}
                        className="person"
                        onClick={() =>
                            onBidClick(group_subscriber_id, user_image_from_s3, name, phone, subscriberId)
                        }
                    >
                        <img
                            src={user_image_from_s3}
                            alt={name || 'Subscriber'}
                            onError={(e) => (e.target.src = "default-image.jpg")}
                        />
                        <div>
                            <h4>{name}</h4>
                            <p>{phone}</p>
                        </div>
                    </article>
                );
            })}
        </>
    );
};

export default BidSubscriberList;
