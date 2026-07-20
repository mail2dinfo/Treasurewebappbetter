import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';

const SubscriberContainer = styled.div`
  /* Add any styling for the container here */
`;

const SubscriberButton = styled.button`
  /* Add styling for the circular button here */
  display: inline-block;
  border: none;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  width: 50px;
  height: 50px;
  margin-right: 10px;
`;

const RemoveButton = styled.button`
  /* Add styling for the remove button here */
  display: inline-block;
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 5px 10px;
  margin-top: 5px;
`;

const HorizontalSubscriberContainer = styled.div`
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
`;

const SubscriberList = ({ groupId, refresh }) => {
  const [subscribers, setSubscribers] = useState([]);
  const [, setTotalSubscribers] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUserContext();

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const apiUrl = `${API_BASE_URL}/groups/${groupId}/subscribers`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user?.results?.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch subscribers');
        }

        const data = await response.json();

        setSubscribers(data?.results);
        setTotalSubscribers(data?.total);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };

    fetchSubscribers();
  }, [groupId, refresh]);

  const removeSubscriber = (subscriberIdToRemove) => {
    const updatedSubscribers = subscribers.filter(
      (subscriber) => subscriber.id !== subscriberIdToRemove
    );

    setSubscribers(updatedSubscribers);
  };

  return (
    <SubscriberContainer>
      <h3>List of Subscribers ({isLoading ? 'Loading...' : `${subscribers?.length || 0} out of ${20}`})</h3>
      {isLoading ? (
        <p>Loading subscribers...</p>
      ) : (
        subscribers?.length === 0 ? (
          <p>0 subscribers</p>
        ) : (
          <div>
            <HorizontalSubscriberContainer>
              {subscribers.map((subscriber) => (
                <div key={subscriber.id} className="subscriber-button">
                  <SubscriberButton>{subscriber.name}</SubscriberButton>
                  <RemoveButton onClick={() => removeSubscriber(subscriber.id)}>
                    Remove
                  </RemoveButton>
                </div>
              ))}
            </HorizontalSubscriberContainer>
          </div>
        )
      )}
    </SubscriberContainer>
  );
};

export default SubscriberList;
