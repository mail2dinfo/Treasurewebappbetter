
import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import { API_BASE_URL } from '../utils/apiConfig';
import { useUserContext } from '../context/user_context';
//import './ProfileCard.css';
import Alert from '../components/Alert';
import loadingImage from '../images/preloader.gif';
import moment from 'moment';
import ImageUploader from '../components/ImageUploader';

const ProfileCard = ({ subscriberId }) => {


  const [list] = useState([]);
  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });
  const [loading, setLoading] = useState(true);

  const [image, setImage] = useState('');
  const [previewImage, setPreviewImage] = useState('https://github.com/OlgaKoplik/CodePen/blob/master/profile.jpg?raw=true');
  const [altText, setAltText] = useState('');

  const [, setError] = useState(null);
  const [subscriberData, setSubscriberData] = useState(null);
  const [futureGrpData, setFutureGrpData] = useState(0);
  const [closed, setClosed] = useState(0);
  const [inProgress, setInProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [paid, setPaid] = useState(0);
  const [due, setDue] = useState(0);


  const { user } = useUserContext();
  const [showModal, setShowModal] = useState(false);
  const [areasOfBusiness, setAreasOfBusiness] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData] = useState({
    // firstname: '',
    // lastname: '',
    // dob: '',
    // gender: '',
    id: '',
    user_image: ''
  });

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
      setIsLoading(true);
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
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };


  const fetchSubscriberData = async () => {
    try {
      setLoading(true);
      const apiUrl = `${API_BASE_URL}/subscribers/${subscriberId}`;
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

      if (data.results.subscriberDetailsResult && data.results.subscriberDetailsResult.length > 0) {

        setSubscriberData(data.results.subscriberDetailsResult[0]);
        console.log('mani-subscriberData');

      }

      if (data.results.subscriberFutureGroupResult && data.results.subscriberFutureGroupResult.length > 0) {

        setFutureGrpData(data.results.subscriberFutureGroupResult[0].group_count);
      }
      if (data.results.subscriberInprogressGroupResult && data.results.subscriberInprogressGroupResult.length > 0) {

        setInProgress(data.results.subscriberInprogressGroupResult[0].group_count);
      }
      if (data.results.subscriberClosedGroupResult && data.results.subscriberClosedGroupResult.length > 0) {

        setClosed(data.results.subscriberClosedGroupResult[0].group_count);
      }


      setTotal(data.results.subscriberOutstandingResult?.[0]?.total);
      setPaid(data.results.subscriberOutstandingResult?.[0]?.paid);
      setDue(data.results.subscriberOutstandingResult?.[0]?.due);


      // Call fetchCompanyLogoUrl after subscriberData has been updated
      if (data.results.subscriberDetailsResult && data.results.subscriberDetailsResult.length > 0) {
        const userImage = data.results.subscriberDetailsResult[0].user_image;
        fetchCompanyLogoUrl(userImage);
      }
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
    fetchSubscriberData();
  }, [subscriberId]);

  const showAlert = (show = false, type = '', msg = '') => {
    setAlert({ show, type, msg });
  };
  const handleAddButtonClick = async (area) => {
    try {
      const apiUrl = `${API_BASE_URL}/addSubscriberArea`;
      const requestBody = {
        membershipId: user?.results?.userAccounts[0]?.membershipId, // Assuming membershipId is available in user context
        subscriberId: subscriberId, // Assuming subscriberId is already defined
        aobId: area.id, // Assuming area has an id property
        sourceSystem: 'WEB', // Assuming source system is 'WEB'
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.results?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      console.log(response);
      if (response.ok) {
        const responseData = await response.json();
        showAlert(true, 'success', responseData.message);
      } else {
        const errorData = await response.json();
        showAlert(true, 'danger', errorData.message);
      }

      // Optionally, you can fetch subscriber data again to update the UI
      fetchSubscriberData();


    } catch (error) {
      console.error(error);
      showAlert(true, 'danger', error.message);
    }
  };

  const removeSubscriberArea = async () => {

    const apiUrl = `${API_BASE_URL}/deleteSubscriberArea/${subscriberData.id}`;
    console.log('came to deltee');
    console.log(apiUrl);
    try {
      setIsLoading(true); // Show loading indicator while deleting
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.results?.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {

        showAlert(true, 'success', 'Region removed from subscriber');
        fetchSubscriberData(); // Refresh the list of subscribers after deleting one.
      } else {
        const errorResponse = await response.json();
        showAlert(true, 'danger', errorResponse.message);
      }
    } catch (error) {
      console.error('An error occurred while deleting the group subscriber:', error);
      showAlert(true, 'danger', 'An error occurred while deleting the group subscriber');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredAreasOfBusiness = areasOfBusiness.filter(area =>
    area.aob.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchCompanyLogoUrl = async (logoKey) => {

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

      } else {
        // Handle error if needed based on the HTTP status code
        console.error(`Failed to fetch signed URL for company logo: ${logoKey}`);
      }
    } catch (error) {
      // Handle fetch error
      console.error('Error fetching signed URL for company logo:', error);
      setError('Error fetching signed URL for company logo');
    } finally {
      //   setLoading(false);
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

  const handleImageChange = (e) => {

    const selectedImage = e.target.files[0];
    if (selectedImage) {
      setImage(selectedImage);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(selectedImage);
      setAltText(selectedImage.name);
    }
  };

  const uploadImageToServer = async () => {

    const formData = new FormData();

    formData.append('file', image);

    try {
      const response = await fetch(`${API_BASE_URL}/file-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image to the server');
      }

      const responseData = await response.json();

      return responseData.results.key; // Replace with the actual key where the image is stored

    } catch (error) {
      throw new Error('Error uploading image to the server');
    }
  };

  //update subscriber details based on subscriber id
  const handleSubmit = async (e) => {
    const apiUrl = `${API_BASE_URL}/subscriber`;
    e.preventDefault();
    setIsLoading(true); // Show loading bar when data fetching starts

    const isLogoChanged = image !== '';



    try {
      let imageUrlFromS3Bucket = '';

      if (isLogoChanged) {
        // Upload the new image to the S3 bucket
        imageUrlFromS3Bucket = await uploadImageToServer();
      }


      const updatedFormData = {
        ...formData,

        // Use the new image URL if changed, otherwise use the existing one
        id: subscriberId,
        user_image: isLogoChanged ? imageUrlFromS3Bucket : previewImage,
      };
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.results?.token}`, // Include the Bearer token
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFormData),
      });
      console.log(response);
      if (response.ok) {
        const responseData = await response.json();
        showAlert(true, 'success', responseData.message);



      } else {
        const errorResponse = await response.json();
        showAlert(true, 'danger', errorResponse.message);

      }
    } catch (error) {

      showAlert(true, 'danger', 'ErrorOccured while submitting');
      // Handle network or fetch error, update the 
    } finally {
      setIsLoading(false);

    }
  };

  return (
    <Wrapper>
      {subscriberData && (
        <div className="card">
          <div>
            <div className="img">
              <ImageUploader
                onChange={handleImageChange}
                previewImage={previewImage}
                altText={altText}
                id="photo-upload"
              />
              {/* <img src={previewImage} alt="User" /> */}
            </div>
            <div className="infos">
              <div className="name">
                <h2>{subscriberData.name}</h2>
                <h4>{subscriberData.phone}</h4>
                <div>
                  <h4>{subscriberData.aob}</h4>

                </div>
                {subscriberData.created_at && (
                  <h4>Joined Date: {moment(subscriberData.created_at).format('DD/MM/YY')}</h4>
                )}
              </div>
              <p className="text">
                Customer Dashboard
              </p>
              <ul className="stats">
                <li>
                  <h3>{closed}</h3>
                  <h4>Closed</h4>
                </li>
                <li>
                  <h3>{inProgress}</h3>
                  <h4>Inprogress</h4>
                </li>
                <li>
                  <h3>{futureGrpData}</h3>
                  <h4>Future</h4>
                </li>
                <li>
                  <h3>{total || 0}</h3>
                  <h4>Total</h4>
                </li>
                <li>
                  <h3>{paid || 0}</h3>
                  <h4>Paid</h4>
                </li>
                <li>
                  <h3>{due || 0}</h3>
                  <h4>Due</h4>
                </li>
              </ul>
              <div className="links">
                {/* <button className="follow">Follow</button> */}
                <button className="view" onClick={handleSubmit} >Update Subscriber</button>
                <button className="view" onClick={openModal}>Add Region</button>
                <button className="view" onClick={removeSubscriberArea}>Delete Region</button>

              </div>
              {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}
            </div>
          </div>
          {showModal && (
            <div className="modal-wrapper">
              <div className="modal-content">
                <button className="close-button" onClick={closeModal}>x</button>

                <input
                  type="text"
                  placeholder="Search Areas of Business"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {/* {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />} */}
                <h2>Areas of Business</h2>
                {isLoading ? (
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
        </div>
      )}
    </Wrapper>
  );
};
const Wrapper = styled.section`

display:flex;
font-family: 'Poppins', sans-serif;
   align-items: center;
  justify-content: center;
  position: relative;
  
img {
  max-width: 100%;
  display: block;
}
ul {
  list-style: none;
}

/* Utilities */
.card::after,
.card img {
  border-radius: 50%;
}

.card,
.stats {
  display: flex;
  position: relative;
  
 
}

.card {
  padding: 2.5rem 2rem;
  border-radius: 10px;
  background-color: rgba(255, 255, 255, .5);
  max-width: 800px;
  box-shadow: 0 0 30px rgba(0, 0, 0, .15);
  margin: 0.5rem;  
  transform-style: preserve-3d;
  overflow: hidden;
  
}
.card::before,
.card::after {
  content: '';
  position: absolute;
  z-index: -1;
}
.card::before {
  width: 100%;
  height: 100%;
  border: 1px solid #FFF;
  border-radius: 10px;
  top: -.7rem;
  left: -.7rem;
}
.card::after {
  height: 15rem;
  width: 15rem;
  background-color:var(--clr-red-dark);
  top: -8rem;
  right: -8rem;
  box-shadow: 2rem 6rem 0 -3rem #FFF
}

.card img {
  width: 8rem;
  min-width: 80px;
  box-shadow: 0 0 0 5px #FFF;
}

.infos {
  margin-left: 1.5rem;
}

.name {
  margin-bottom: 1rem;
}
.name h2 {
  font-size: 1.3rem;
}
.name h4 {
  font-size: .8rem;
  color: #333
}

.text {
  font-size: .9rem;
  margin-bottom: 1rem;
}

.stats {
  margin-bottom: 1rem;
}
.stats li {
    display:flex;
    flex-direction:column;
  min-width: 5rem;
}
.stats li h3 {
  font-size: .99rem;
}
.stats li h4 {
  font-size: .75rem;
}

.links button {
  font-family: 'Poppins', sans-serif;
  min-width: 120px;
  padding: .5rem;
  border: 1px solid #222;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
  transition: all .25s linear;
}
.links .follow,
.links .view:hover {
  background-color: #222;
  color: #FFF;
}
.view {
    margin-left:5px;
}
.links .view,
.links .follow:hover{
  background-color: transparent;
  color: #222;
}

@media screen and (max-width: 450px) {
  .card {
    display: block;
  }
  .infos {
    margin-left: 0;
    margin-top: 1.5rem;
  }
  .links button {
    min-width: 100px;
  }
}

// /* Modal Styles */
// .modal-wrapper {
//   position:fixed;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
//   background: rgba(0, 0, 0, 0.5);
//   display: flex;
//   align-items: center;
//   justify-content: center;
// }

// .modal-content {
 
//   background: white;
//   padding: 20px;
//   border-radius: 8px;
//   box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
// }

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

export default ProfileCard;
