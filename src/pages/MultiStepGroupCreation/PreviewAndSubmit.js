// PreviewAndSubmit.js
import React, { useContext, useState, useEffect } from 'react';
import AppContext from './Context';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';
import styled from 'styled-components';
import productJson from '../../assets/product.json';



// Function to generate a unique key
function generateUniqueKey() {
    // Implement your own key generation logic here
    // You can use libraries like uuid or generate a random string
    // For example, using uuid:
    const uuid = require('uuid');
    return uuid.v4();
}
const PreviewAndSubmit = () => {
    const { groupDetails } = useContext(AppContext);
    const myContext = useContext(AppContext);
    const updateContext = myContext.groupDetails;
    const history = useHistory();
    const { isLoggedIn, user, userRole } = useUserContext();
    const [isLoading, setIsLoading] = useState(false);
    const [membershipId, setMembershipId] = useState('');
    useEffect(() => {
        if (user.results.userAccounts && user.results.userAccounts.length > 0) {

            const membership = user.results.userAccounts[0];
            console.log(membership.membershipId);
            setMembershipId(membership.membershipId);
        }
    }, [user]);

    const formatDate = (dateString) => {
        console.log('formatDate');
        console.log(dateString);
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const formattedDate = new Date(dateString).toLocaleDateString(undefined, options);
        return formattedDate;
    };
    const fixedGroupAccounts = React.useMemo(() => {
        if (groupDetails.groupType !== 'Fixed') return [];

        const matchingProduct = productJson.find(
            (entry) =>
                entry.product === Number(groupDetails.groupAmt) &&
                entry.noofmonths === Number(groupDetails.groupNoOfMonths) &&
                entry.membershipid ===Number( membershipId)
        );

        if (!matchingProduct) return [];

        const startDate = new Date(groupDetails.firstAuctDate);
        const months = groupDetails.groupNoOfMonths;

        const generatedDates = Array.from({ length: months }, (_, i) => {
            const date = new Date(startDate.getTime());
            date.setMonth(date.getMonth() + i);
            return date.toISOString().split('T')[0];
        });

        return matchingProduct.groupAccounts.map((acc, idx) => ({
            ...acc,
            auctDate: generatedDates[idx] || '',
        }));
    }, [groupDetails, membershipId, productJson]);




    const handleGroupSubmit = async () => {
        setIsLoading(true); // Show loading bar when data fetching starts
        if (isLoggedIn) {


            // Construct the group data object
            const groupData = {


                groupId: null,
                groupName: groupDetails.groupName,
                amount: groupDetails.groupAmt,
                type: groupDetails.groupType,

                noOfSubscribers: groupDetails.groupNoOfSub,
                tenure: groupDetails.groupType === 'Fixed' ? groupDetails.groupNoOfMonths : groupDetails.groupNoOfSub,
                groupProgress: 'FUTURE',
                auctDate: groupDetails.firstAuctDate,
                auctStartTime: groupDetails.auctStartTime,
                auctEndTime: groupDetails.auctEndTime,
                emi: groupDetails.groupType === 'Fixed'
                    ? (groupDetails.groupNoOfMonths !== 0 ? groupDetails.groupAmt / groupDetails.groupNoOfMonths : 0)
                    : (groupDetails.groupNoOfSub !== 0 ? groupDetails.groupAmt / groupDetails.groupNoOfSub : 0),
                collectedBy: user.results.userId,
                commissionType: groupDetails.commType,
                commissionMonth: 0,
                commissionPercentage: groupDetails.commPercentage,
                commissionAmount: groupDetails.commAmt,
                auctionPlace: groupDetails.auctPlace,
                nextAuctDate: groupDetails.firstAuctDate,
                auctionMode: groupDetails.auctFreq,
                sourceSystem: 'WEB',
                stepper: 0,
                isAuctionReady: false,
                isDrafted: 0,
                groupAccounts: fixedGroupAccounts,

            };



            console.log(groupData);
            // Construct the URL for the API endpoint

            const apiUrl = `${API_BASE_URL}/groups`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${user.results.token}`, // Include the Bearer token
                        'Content-Type': 'application/json',
                        'X-User-Role': userRole,
                    },
                    body: JSON.stringify(groupData),
                });

                if (response.ok) {

                    const grpJsonObject = await response.json(); //

                    groupDetails.setGroupId(grpJsonObject.results.id);

                    updateContext.setStep(updateContext.currentPage + 1)
                    localStorage.removeItem('unauthenticatedGroup');
                } else {
                    console.log(response);
                    console.error('Failed to submit group details');
                    // Handle error, maybe show an error message to the user
                }
            } catch (error) {
                console.error('An error occurred while submitting group details:', error);
                // Handle the error, e.g., show an error message to the user
            }




        } else {
            const generatedKey = generateUniqueKey(); // Implement your own key generation logic

            // Construct the group data object with the generated key
            const groupData = {
                step: groupDetails.currentPage,
                groupId: generatedKey,
                groupName: groupDetails.groupName,
                groupAmt: groupDetails.groupAmt,
                groupType: groupDetails.groupType,
                groupNoOfSub: groupDetails.groupNoOfSub,
                groupNoOfMonths: groupDetails.groupNoOfMonths,
                groupProgress: 'FUTURE', // Fixed a typo here (changed 'FURURE' to 'FUTURE')
                firstAuctDate: groupDetails.firstAuctDate,
                auctStartTime: groupDetails.auctStartTime,
                auctEndTime: groupDetails.auctEndTime,

                commAmt: groupDetails.commAmt,
                collectedBy: null, // You may set this to an appropriate value
                commissionType: groupDetails.commType,
                commissionMonth: 0,
                commissionAmount: groupDetails.commAmt,
                auctionPlace: groupDetails.auctPlace,
                auctionMode: groupDetails.auctFreq,
                sourceSystem: 'WEB',
                stepper: 0,
                isAuctionReady: false,
                isDrafted: 0
            };
            console.log(groupData);
            // Store the group details with the generated key in local storage
            localStorage.setItem('unauthenticatedGroup', JSON.stringify(groupData));

            console.log('User is not authenticated. Redirecting to sign-in.');
            history.push('/login'); // Redirect to the sign-in page// Redirect to the sign-in page
        }
        // Check if the user is authenticated (e.g., by accessing the authentication state)
        //const isAuthenticated = ;

        // if (isAuthenticated) {
        //     // You can implement the submission logic here
        //     // For example, you can send the formData to a servx er or perform any required actions
        //     // Then, navigate to a success page or do something else
        //     console.log('Group details submitted successfully');
        //     history.push('/success'); // Redirect to a success page
        // } else {
        //     // User is not authenticated, redirect to sign-in page
        //     console.log('User is not authenticated. Redirecting to sign-in.');
        //     history.push('/sign-in'); // Redirect to the sign-in page
        // }
    };

    return (<section className='section'>
        <Wrapper className='section-center' >
            <div>

                <div className="multipleButtons">
                    <button className="multipleButton" value="Previous" type="button" onClick={() => updateContext.setStep(updateContext.currentPage - 1)}>Previous </button>
                    <button className="multipleButton" value="Next" type="button" onClick={handleGroupSubmit} disabled={isLoading} // Disable the button when isLoading is true
                    >
                        {isLoading ? 'Submitting...' : 'Submit'} </button>
                </div>
                {/* <h4>Preview and Submit</h4> */}
                <p>Review the captured data:</p>

                <ul>
                    <li>
                        <span>Group Name:</span>
                        {groupDetails.groupName}
                    </li>
                    <li>
                        <span>Group Amount:</span>
                        {groupDetails.groupAmt}
                    </li>
                    <li>
                        <span>{groupDetails.groupType === 'Fixed' ? 'No of Months:' : 'No of Subscribers:'}</span>
                        {groupDetails.groupType === 'Fixed' ? groupDetails.groupNoOfMonths : groupDetails.groupNoOfSub}
                    </li>
                    <li>
                        <span>Group Type:</span>
                        {groupDetails.groupType}
                    </li>

                    <li>
                        <span>Commision Type:</span>
                        {groupDetails.commType}
                    </li>
                    <li>
                        <span>Commision Percent:</span>
                        {groupDetails.commPercentage}
                    </li>
                    <li>
                        <span>Commision Amount:</span>
                        {groupDetails.commAmt}
                    </li>
                    <li>
                        <span>Auction Mode:</span>
                        {groupDetails.auctFreq}
                    </li>
                    <li>
                        <span>Auction Date:</span>
                        {groupDetails.firstAuctDate}
                    </li>
                    <li>
                        <span>Auction Start Time:</span>
                        {groupDetails.auctStartTime}
                    </li>
                    <li>
                        <span>Auction End Time:</span>
                        {groupDetails.auctEndTime}
                    </li>
                    <li>
                        <span>Auction Place:</span>
                        {groupDetails.auctPlace}
                    </li>
                </ul>


            </div>

            <div className='subcriber-list'>
                <article className='subcriber-header' style={{ padding: "4px 16px" }}>
                    <p>AuctDate</p>
                    <p>Bid</p>
                    <p>Prize</p>
                    <p>Comm</p>
                    <p>Bal</p>
                    <p>Due</p>

                </article>
                {fixedGroupAccounts?.map((item, index) => {
                    const { auctDate, bid, prize, comm, bal, due } = item;
                    const formattedAuctionDate = formatDate(auctDate);
                    const formattedBid = bid ?? 0;
                    const formattedPrize = prize ?? 0;
                    const formattedCommision = comm ?? 0;
                    const formattedCustomerBal = bal ?? 0;
                    const formattedCustomerDue = due ?? 0;

                    return (

                        <article className='subcriber-item' key={index}
                        >
                            <p className='title'>{formattedAuctionDate}</p>
                            <p className='title'>{formattedBid}</p>
                            <p className='title'>{formattedPrize}</p>
                            <p className='title'>{formattedCommision}</p>
                            <p className='title'>{formattedCustomerBal}</p>
                            <p className='title'>{formattedCustomerDue}</p>
                        </article>

                    );
                })}
            </div>




        </Wrapper>
    </section>);
};
const Wrapper = styled.section`
min-height: 300vh;


  padding-top: 2rem;
  display: grid;
  gap: 3rem 2rem;
  @media (min-width: 992px) {
    grid-template-columns: 1fr 1fr;
  }
  /* align-items: start; */

  .subcriber-container {
    
    margin-top: 2rem;
  
     background-color: #ffffff;
     border-radius: 10px;
     padding: 15px;
     box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
     text-align: center;
     margin: 10px;
  }
  .subcriber-item {
    margin-top:12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    transition: var(--transition);
    padding: 0.25rem 1rem;
    border-radius: var(--radius);
    text-transform: capitalize;
    img {
      height: 100%;
      width: 45px;
      border-radius: 50%;
      object-fit: cover;
    }
  }
  
  .subcriber-item:hover {
    color: var(--clr-grey-5);
    background: var(--clr-grey-10);
  }
  
  .subcriber-item:hover .title {
    color: var(--clr-grey-5);
  }
  .subcriber-header {
    
    background-color: #cd3240;
    color: #fff;
    display: flex;
    padding:4px 16px;
    align-items: center; /* Vertical alignment */
    justify-content: center; /* Horizontal alignment */
    justify-content: space-between;     
}
.subcriber-header p {
  
  color: #fff;
  align-items: center; /* Vertical alignment */
    justify-content: center; /* Horizontal alignment */
}
`;

export default PreviewAndSubmit;
