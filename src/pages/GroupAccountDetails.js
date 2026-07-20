import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';
import styled from 'styled-components';
import { RecevableReceiptList } from '../components';


const GroupAccountDetails = () => {
  const history = useHistory();
  const { group_id, grpAccountId } = useParams();
  console.log(group_id);
  console.log(grpAccountId);
  const [, setIsLoading] = useState(true);
  const { user } = useUserContext();
  const [subscribers, setData] = useState([]); // Initialize data as null


  // Define the fetchGroups function
  const fetchGroups = async () => {
    try {
      const apiUrl = `${API_BASE_URL}/group-accounts/${grpAccountId}/receivables-receipts`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.results?.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const fetchedData = await response.json();
      setData(fetchedData.results);
      console.log('*******Fetched Data****************');
      console.log(fetchedData);
      console.log(subscribers);
      console.log('***********Fetched Data************');
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoading(false);
    }
  };




  useEffect(() => {
    const apiUrls = `${API_BASE_URL}/group-accounts/${grpAccountId}/receivables-receipts`;
    console.log(apiUrls);
    // Check if group_id and grpAccountId are defined
    if (!group_id || !grpAccountId) {
      // Handle the case where the parameters are undefined
      setIsLoading(false);
      return;
    }
    const fetchGroups = async () => {
      try {
        const apiUrl = `${API_BASE_URL}/group-accounts/${grpAccountId}/receivables-receipts`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user?.results?.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch groups');
        }
        const fetchedData = await response.json();
        setData(fetchedData.results);
        console.log('*******Fetched Data****************')
        console.log(fetchedData);
        console.log(subscribers);
        console.log('***********Fetched Data************')

      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGroups();
  }, [group_id, grpAccountId]); // Fetch data whenever the groupId or groupAccountId changes

  // Callback function to refresh subscribers after a successful payment
  const refreshSubscribers = () => {
    fetchGroups();
  };

  return (
    <Wrapper className='section-center'>

      <div className="contain">
        <div className="close-button" onClick={() => history.goBack()}>
          &#x2716; {/* Close symbol (cross) */}
        </div>
        {/* <h3>{subscribers.length} Payment Status</h3> */}
        <h3> Payment Status</h3>
        <RecevableReceiptList subscribers={subscribers} refreshSubscribers={refreshSubscribers} />
        {/* <button onClick={() => setPeople([])}>clear all</button> */}
      </div>
    </Wrapper>

  );
}
const Wrapper = styled.section`
display: flex;
flex-direction: column;
align-items: center;
.contain {  
    max-width: 40rem;
      margin-top: 2rem;
      margin-bottom: 4rem;
  padding-top: 35px;
  display: flex;
  flex-direction: column;
  background: var(--clr-white);
  border-radius: var(--radius);
  box-shadow: var(--light-shadow);
  transition: var(--transition);
  padding: 2rem;
  width: 90vw;
  min-height: 500px; /* Change from 'height' to 'min-height' */
  margin: 10px auto;
  margin: 10 auto;
  align-items: center;
  position: relative;
  }  
  
  .contain:hover {
      box-shadow: var(--dark-shadow);
    }
  
.person {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 0.75rem;
  margin-bottom: 1.5rem;
  align-items: center;
  
}
.person img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 50%;
  box-shadow: var(--light-shadow);
}
.person h4 {
  margin-bottom: 0.35rem;
}
.person p {
  margin-bottom: 0;
}
.containe button {
  color: var(--clr-white);
  display: block;
  width: 100%;
  border-color: transparent;
  background: red;
  margin: 2rem auto 0 auto;
  text-transform: capitalize;
  font-size: 1.2rem;
  padding: 0.5rem 0;
  letter-spacing: var(--spacing);
  border-radius: var(--radius);
  outline: 1px solid rgba(242, 138, 178, 0.8);
  cursor: pointer;
}
/* styles.css */
.paid-button {
  background-color: green;
  color: white;
}

* For Paid status button */
.paid-button {
  margin-top:8px;
  border:none;
  padding:4px 6px 3px;
  border-radius: 4px;
  font-size:12px;
  background-color: green; /* Green color for Paid status */
  color: white; /* Text color */
  /* Add any other styles you want for Paid status */
}

/* For Due status button */
.due-button {
  margin-top:8px;
  border:none;
  padding:4px 6px 3px;
  border-radius: 4px;
  font-size:12px;
  background-color: green; /* Red color for Due status */
  color: white; /* Text color */
  /* Add any other styles you want for Due status */
}
.close-button {
  position: absolute;
  top: 10px; /* Adjust the top position as needed */
  right: 10px; /* Adjust the right position as needed */
  cursor: pointer;
  font-size: 24px; /* Adjust the font size as needed */
  color: #555; /* Adjust the color as needed */
}

.alert {
  margin-bottom: 1rem;
  height: 1.25rem;
  display: grid;
  align-items: center;
  text-align: center;
  font-size: 0.7rem;
  border-radius: 0.25rem;
  letter-spacing: var(--spacing);
  text-transform: capitalize;
}

.alert-danger {
  color: #721c24;
  background: #f8d7da;
}

.alert-success {
  color: #155724;
  background: #d4edda;
}
`
export default GroupAccountDetails
