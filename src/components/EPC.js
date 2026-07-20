
import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';
import loadingImage from '../images/preloader.gif';
import Alert from '../components/Alert';


const EmployeeProfilecard = ({ employeeId }) => {

    const [list] = useState([]);
    const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

    const [previewImage, setPreviewImage] = useState('https://github.com/OlgaKoplik/CodePen/blob/master/profile.jpg?raw=true');
    const [, setError] = useState(null);

    const [employeeData, setEmployeeData] = useState(null);
    const [, setFutureGrpData] = useState(null);


    const { user } = useUserContext();
    const [showModal, setShowModal] = useState(false);

    const [areasOfBusiness, setAreasOfBusiness] = useState([]);
    const [, setEmployeeRegionData] = useState([]);
    const [, setEmployeeCollectionRegion] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');

    const [totAmnt, setTotAmnt] = useState('0');
    const [totCollected, setTotCollected] = useState('0');
    const [due, setDue] = useState('0');
    const [collectedByOther, setOtherCollected] = useState('0');

    const [loading, setLoading] = useState(true);





    //region popup 
    const openModal = () => {
        setShowModal(true);
        loadAreasOfBusiness();
    };
    const closeModal = () => {
        setShowModal(false);
        setSearchQuery(''); // Clear search query when closing modal
    };

    useEffect(() => {
        if (showModal) {
            loadAreasOfBusiness();

        }
    }, [showModal]);

    const loadAreasOfBusiness = async () => {
        try {
            setLoading(true);
            const apiUrl = `${API_BASE_URL}/aob/all`;

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch areas of business');
            }
            const data = await response.json();
            setAreasOfBusiness(data?.results);
            console.log(areasOfBusiness);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const fetchEmployeeData = async () => {
        try {
            setLoading(true);
            const apiUrl = `${API_BASE_URL}/employee/${employeeId}`;
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch subscriber data');
            }

            const data = await response.json();
            console.log(data);

            if (data.results.employeeDetailsResult && data.results.employeeDetailsResult.length > 0) {


                setEmployeeData(data.results.employeeDetailsResult[0]);
                console.log('mani-subscriberData');

                console.log(data.results.employeeDetailsResult[0]);


            }

            if (data.results.subscriberFutureGroupResult && data.results.subscriberFutureGroupResult.length > 0) {
                console.log('came into if condition');
                console.log(data.results.groups);
                setFutureGrpData(data.results.subscriberFutureGroupResult[0].count);
            }

            console.log(data?.results?.employeeRegionResult);

            setEmployeeCollectionRegion(
                data?.results?.employeeRegionResult
            )

            if (data.results.employeeRegionResult && data.results.employeeRegionResult.length > 0) {
                setEmployeeRegionData(data.results.employeeRegionResult);
            }
            // Call fetchCompanyLogoUrl after subscriberData has been updated
            if (data.results.employeeDetailsResult && data.results.employeeDetailsResult.length > 0) {
                const userImage = data.results.employeeDetailsResult[0].user_image;
                fetchCompanyLogoUrl(userImage);
            }
            setTotAmnt(data.results.employeeTotalAmtResult[0].amount_assigned);
            setTotCollected(data.results.employeeTotalAmtResult[0].amount_collected_by_me);
            setDue(data.results.employeeTotalAmtResult[0].due);
            setOtherCollected(data.results.employeeTotalAmtResult[0].amount_collected_by_others);


        } catch (error) {
            console.error(error);
            setLoading(false);
        }
        finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch data when the component mounts
        fetchEmployeeData();
    }, [employeeId]);

    const handleAddButtonClick = async (area) => {
        try {
            const apiUrl = `${API_BASE_URL}/addSubscriberArea`;
            const requestBody = {
                membershipId: user?.results?.userAccounts[0]?.membershipId, // Assuming membershipId is available in user context
                subscriberId: employeeId, // Assuming subscriberId is already defined
                aobId: area.id, // Assuming area has an id property
                sourceSystem: 'WEB', // Assuming source system is 'WEB'
            };
            console.log(requestBody);
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.results?.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (response.ok) {
                const responseData = await response.json();
                showAlert(true, 'success', responseData.message);
            } else {
                const errorData = await response.json();
                showAlert(true, 'danger', errorData.message);
            }


            // Optionally, you can fetch subscriber data again to update the UI
            fetchEmployeeData();


        } catch (error) {
            console.error(error);
            // Optionally, you can show an error message or perform any other action
        }
    };

    const handleSearchRegionChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const filteredAreasOfBusiness = areasOfBusiness.filter(area =>
        area.aob.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const fetchCompanyLogoUrl = async (logoKey) => {
        setLoading(true);
        console.log('logoKey');
        console.log(logoKey);
        // setLoading(true);
        setError(null);

        try {
            // Fetch the signed URL for the company logo using a GET request
            const response = await fetch(`${API_BASE_URL}/get-signed-url?key=${encodeURIComponent(logoKey)}`, {
                method: 'GET',
                headers: {
                    // Include any headers if needed
                    // 'Authorization': 'Bearer YourAccessToken',
                },
            });
            console.log(response);
            if (response.ok) {
                const responseBody = await response.json();
                const signedUrl = responseBody.results;
                console.log(responseBody.results);

                // setFormData({
                //     companyLogo: signedUrl,
                // })
                setPreviewImage(
                    signedUrl
                )
                console.log(previewImage);

                console.log('data check');

                console.log(signedUrl);

            } else {
                // Handle error if needed based on the HTTP status code
                console.error(`Failed to fetch signed URL for company logo: ${logoKey}`);
            }
        } catch (error) {
            setLoading(false);
            // Handle fetch error
            console.error('Error fetching signed URL for company logo:', error);
            setError('Error fetching signed URL for company logo');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <img src={loadingImage} className='loading-img' alt='loding' />
                <div className="placeholder" style={{ height: '50vh' }}></div>
            </>
        );
    }

    const showAlert = (show = false, type = '', msg = '') => {
        setAlert({ show, type, msg });
    };

    return (<section className='section'>
        <Wrapper className='section-center' >
            <div className='empInfo'>
                <div className="img">
                    <img src={previewImage} alt="User" />
                </div>
                <div className="persona">
                    <div className="name">
                        <h2>{employeeData.name}</h2>
                        <h4>{employeeData.phone}</h4>
                        <h4>{employeeData.aob}</h4>
                        <h4><strong>Joined Date:</strong> {new Date(employeeData.created_at).toLocaleDateString()}</h4>

                    </div>
                    <div className="links">
                        <button className="view" onClick={openModal}>Add Collecton Area</button>
                    </div>
                </div>
            </div>
            <div className='empDashboard'>
                <ul className="stats">
                    <li>
                        <h3>{totAmnt}</h3>
                        <h4>Total Amt</h4>
                    </li>
                    <li>
                        <h3>{totCollected}</h3>
                        <h4>Collected</h4>
                    </li>
                    <li>
                        <h3>{due}</h3>
                        <h4>Due</h4>
                    </li>
                    <li>
                        <h3>{collectedByOther}</h3>
                        <h4>Collected by other</h4>
                    </li>
                </ul>
            </div>
        </Wrapper>

        {showModal && (
            <div className="modal-wrapper">
                <div className="modal-content">
                    <button className="close-button" onClick={closeModal}>x</button>
                    {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}
                    <input
                        type="text"
                        placeholder="Search Areas of Business"
                        value={searchQuery}
                        onChange={handleSearchRegionChange}
                    />
                    <h2>Areas of Business</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        areasOfBusiness && areasOfBusiness.length > 0 ? (
                            <ul>
                                {filteredAreasOfBusiness.map(area => (
                                    <li key={area.id}>
                                        {area.aob}
                                        <button onClick={() => handleAddButtonClick(area)}>Add</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No areas of business found.</p>
                        )
                    )}
                </div>
            </div>
        )}
    </section>

    );
};
const Wrapper = styled.div`
  padding-top: 0.5rem;
  display: grid;
  gap: 1rem 1rem;
  position: relative;
  @media (min-width: 992px) {
    grid-template-columns: 1fr 1fr;
  }
  .empInfo{
    padding: 2.5rem 2rem;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, .5); 
  box-shadow: 0 0 30px rgba(0, 0, 0, .15);
  margin: 0.5rem;
  display: grid;
  gap: 1rem 1rem;
  grid-template-columns: 1fr 1fr;
  }
  
  .empDashboard {
    padding: 1.5rem 2rem;
    border-radius: 10px;
    background-color: rgba(255, 255, 255, .5); 
    box-shadow: 0 0 30px rgba(0, 0, 0, .15);
    margin: 0.5rem;
  }
  
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* Items will adjust based on container width */
    gap: 1rem; /* Add some space between items */
  }
  
  .stats li {
    list-style: none; /* Remove default list styles */
    padding: 1rem; /* Add padding to each item */
    text-align: center; /* Center-align text */
    border: 1px solid #ccc; /* Add border for better separation */
  }

  /* Modal Styles */
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: top;
  justify-content: center;
}

.modal-content {
  position: relative;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
}

.close-button {
  
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
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
  
`;

export default EmployeeProfilecard;
