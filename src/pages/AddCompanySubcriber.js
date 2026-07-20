import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useUserContext } from '../context/user_context';
import ReactFlagsSelect from "react-flags-select";
import "../components/flags.css"
import { API_BASE_URL } from '../utils/apiConfig';
import Alert from '../components/Alert';
import List from '../components/List';
import { useHistory } from 'react-router-dom';
import AvatarGenerator from '../components/AvatarGenerator';
import ImageUploader from '../components/ImageUploader';



const AddCompanySubcriber = () => {
    const [avatarImage, setAvatarImage] = useState('');
    const [image, setImage] = useState('');
    const [previewImage, setPreviewImage] = useState('https://github.com/OlgaKoplik/CodePen/blob/master/profile.jpg?raw=true');
    const [altText, setAltText] = useState('');
    // const [userImageUrl, setUserImageUrl] = useState('');

    const [name, setName] = useState('');
    const [showList, setShowList] = useState(false);
    const { user } = useUserContext();

    //membershipId - since api is not ready at thos moment, we are not using this membership id but based on need we can change 
    const [membershipId, setMembershipId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const searchable = true;
    const showSelectedLabel = true;
    const [selectedCountry, setSelectedCountry] = useState('auto');
    const [alert, setAlert] = useState({ show: false, msg: '', type: '' });
    const [list, setList] = useState([]);
    const history = useHistory();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        country: 'Auto-detect', // Default to Auto-detect
        countryCode: 'auto',  // Default to 'auto'
        sourceSystem: 'WEB',
    });
    const showAlert = (show = false, type = '', msg = '') => {

        setAlert({ show, type, msg });
    };
    const countries = [
        { value: "IN", label: "India", countryCode: "+91" },
        { value: "GB", label: "United Kingdom", countryCode: "+44" },
        { value: "LK", label: "Srilanka", countryCode: "+94" },
        { value: "NP", label: "Nepal", countryCode: "+977" },
        { value: "MY", label: "Malaysia", countryCode: "+60" },
        { value: "AE", label: "United Arab Emirates", countryCode: "+971" },
        { value: "SG", label: "Singapore", countryCode: "+65" },
        { value: "PK", label: "Pakistan", countryCode: "+92" }, // Corrected country code to PK
        { value: "NG", label: "Nigeria", countryCode: "+234" }, // Corrected country code to NG
        { value: "GH", label: "Ghana", countryCode: "+233" }, // Corrected country code to GH
        { value: "TT", label: "Trinidad and Tobago", countryCode: "+1-868" }, // Corrected country code to TT
        { value: "KE", label: "Kenya", countryCode: "+254" }, // Corrected country code to KE
        { value: "ZA", label: "South Africa", countryCode: "+27" }
    ];
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };
    useEffect(() => {
        if (user.results?.userAccounts && user.results?.userAccounts.length > 0) {
            const membership = user.results.userAccounts[0];

            setMembershipId(membership.parent_membership_id);
        }
    }, [user]);

    const handleCountryChange = (value) => {
        setSelectedCountry(value);

        // Find the selected country object from the countries array
        const selectedCountryObj = countries.find((country) => country.value === value);

        if (selectedCountryObj) {
            // Reset the formData state with the country code and label from the selected country
            setFormData((prevData) => ({
                ...prevData,
                country: selectedCountryObj.label,
                countryCode: selectedCountryObj.countryCode,

            }));

        }
    };
    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                const apiUrl = `${API_BASE_URL}/subscribers/all`;

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
                console.log(data);
                setList(data?.results);
                setIsLoading(false);
                console.log('data retrived successfully');
            } catch (error) {
                console.error(error);
                setIsLoading(false);
            }
        };

        fetchSubscribers();
    }, [user, isLoading]);
    //need to update 
    const removeItem = (id) => {

    };
    const editItem = (id) => {

    };
    const handleImageChange = (e) => {
        console.log('check');

        const selectedImage = e.target.files[0];

        if (selectedImage) {
            setImage(selectedImage);
            console.log('mini');
            console.log(image);
            console.log('miniature');
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(selectedImage);
            setAltText(selectedImage.name);
        }

    };

    const uploadImageToServer = async () => {
        console.log('trap');

        const formData = new FormData();
        console.log(formData);
        console.log(image);
        if (image) {
            console.log(image);
            formData.append('file', image);
        } else {
            console.log(avatarImage);
            const avatarImageBlob = await fetch(avatarImage).then((response) => response.blob());
            formData.append('file', avatarImageBlob);
        }
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
            console.log(error);
            throw new Error('Error uploading image to the server');
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); // Show loading bar when data fetching starts
        const imageUrlFromS3Bucket = await uploadImageToServer();
        // Include membershipId in the formData
        const updatedFormData = {
            membershipId: membershipId,
            phoneOrEmail: formData.phone,
            referredBy: user?.results?.userId,
            name: name,
            country: formData.country,
            countryCode: formData.countryCode,
            sourceSystem: 'WEB',
            groupId: '',
            //userImage: userImageUrl,
            userImage: imageUrlFromS3Bucket,
        };
        console.log('check form data');
        console.log(updatedFormData);

        const apiUrl = `${API_BASE_URL}/subscribers`;
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.results?.token}`, // Include the Bearer token
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedFormData),
            });
            console.log(response);
            if (response.ok) {
                const responseData = await response.json();
                console.log(responseData);
                showAlert(true, 'success', responseData.message);
            } else {
                const eresponseData = await response.json();
                console.log(eresponseData);

                showAlert(true, 'danger', eresponseData.message);

            }
        } catch (error) {
            // Handle network or fetch error, update the message state
            showAlert(true, 'danger', error?.message || 'Something went wrong');

        } finally {
            setIsLoading(false); // Hide loading bar when data fetching is complete
        }

    };
    const detectUserCountry = async () => {
        try {
            const response = await fetch('http://ip-api.com/json/');
            if (response.ok) {
                const data = await response.json();
                console.log('Detected Country Data:', data);
                // Find the corresponding country object in the countries array
                const detectedCountry = countries.find(
                    (country) => country.value === data.countryCode
                );

                if (detectedCountry) {
                    // Update the selectedCountry state with the detected country code
                    setSelectedCountry(detectedCountry.value);
                    // Update the formData with the detected country details
                    setFormData((prevData) => ({
                        ...prevData,
                        country: detectedCountry.label,
                        countryCode: detectedCountry.countryCode,

                    }));

                }
            }
        } catch (error) {
            console.error('Error detecting user country:', error);
        }
    };

    useEffect(() => {
        // Detect user's country if not auto-detected
        if (selectedCountry === 'auto') {
            detectUserCountry();
        }
    }, [selectedCountry]);

    const isButtonDisabled = (

        !formData.phone ||
        !name
    );
    // Function to toggle the showList state
    const toggleList = () => {
        setShowList(!showList);
    };
    const handleBackButtonClick = () => {
        history.push('/chit-fund/user/home'); // Replace '/' with the actual URL of your home page
    };
    const imgStyles = {

        width: '250px',
        marginBottom: 0,
    };
    const handleClearImage = () => {
        setImage(null);
        setPreviewImage('https://github.com/OlgaKoplik/CodePen/blob/master/profile.jpg?raw=true');
        setAltText('');
    };
    return (<Wrapper className='section-center'>
        <section className='container'>
            <div className='button-container'>
                <button className='back-button' onClick={handleBackButtonClick}>
                    &#8592; {/* Unicode character for a left arrow */}
                </button>
                <button className='show-list-btn' onClick={toggleList}>
                    Show List
                </button>
            </div>
            {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}
            <h3>Add Subscriber details</h3>
            <form className="form" onSubmit={handleSubmit} >
                <ReactFlagsSelect
                    selected={selectedCountry}
                    onSelect={handleCountryChange}
                    countries={countries.map((country) => country.value)}
                    showSelectedLabel={showSelectedLabel}
                    searchable={searchable}
                />
                <ImageUploader
                    onChange={handleImageChange}
                    previewImage={previewImage}
                    altText={altText}
                    id="photo-upload"
                />
                <button
                    className="clear-image-btn"
                    type="button"
                    onClick={handleClearImage}
                    disabled={isLoading}
                >
                    Clear Image
                </button>
                <div className="name-container">
                    <input className="formInput" type="text" placeholder="Subscriber Name"
                        name="name"
                        onChange={(e) => setName(e.target.value)}
                        style={imgStyles}
                    />
                    <AvatarGenerator seed={name || 'Default'} width="50" height="50" setUserImageUrl={setAvatarImage} />

                </div>

                <input type="text" className="formInput" placeholder="Subcriber Phone" name="phone" onChange={handleChange} />



                <button
                    className={`formSubmitSub ${isButtonDisabled || isLoading ? 'disabled' : ''}`}
                    type="submit"
                    disabled={isButtonDisabled || isLoading}
                >
                    {isLoading ? 'Adding subscriber...' : 'Add'}
                </button>

            </form>
            {list?.length > 0 && (
                <div className='subcriber-container'>
                    {/* <List items={list} removeItem={removeItem} editItem={editItem} /> */}
                    {/* <AvatarGroup avatars={avatars} /> */}
                    {/* Button to open the List component */}

                    {/* Conditionally render the List component based on showList state */}
                    {showList && (
                        <div className='list-modal'>
                            {/* Create your modal/pop-up component here */}
                            <button className='close-list-btn' onClick={toggleList}>
                                Close
                            </button>
                            <List items={list} removeItem={removeItem} editItem={editItem} />
                        </div>
                    )}

                </div>
            )}
        </section>
    </Wrapper>)
}

const Wrapper = styled.main`
.container{
    width: 90vw;
    height: 600px;
    margin: 0 auto;
    max-width: 35rem;
    margin-top: 2rem;
    margin-bottom: 4rem;
    background: var(--clr-white);
    border-radius: var(--radius);
    box-shadow: var(--light-shadow);
    transition: var(--transition);
    padding: 2rem;
    position:relative;
    align-items: center;
}
.container:hover {
    box-shadow: var(--dark-shadow);
  }

  .form {
    display: flex;
    flex-direction: column;
    padding: 20px;    
  width:500px;
  height:500px;
  align-items:center; 
  }
.formInput {
    border-radius: 5px;
    border-color: #e5e5e5;
    border-style: solid;
    border-width: 0.5px;
    margin-bottom: 10px;
    padding: 10px;
    width:300px;
}
.formSubmitSub {
    background: var(--clr-red-dark);
    border-color: transparent;
         display: grid;
    align-items: center;
    padding: 0.25rem;
    text-transform: capitalize;
    letter-spacing: 2px;
    border-top-right-radius: var(--radius);
    border-bottom-right-radius: var(--radius);
    border-top-left-radius: var(--radius);
    border-bottom-left-radius: var(--radius);    
    cursor: pointer;
    content: var(--clr-primary-5);
    transition: var(--transition);
    font-size: 0.85rem;
    margin-top:0.5rem;
    width:300px;
    color: white;

}
/* Disabled button style */
.formSubmitSub.disabled {
    background-color: #ccc; /* Change the background color when disabled */
    cursor: not-allowed; /* Change cursor to not-allowed when disabled */
}
.country-code {
    padding: 0.25rem;
    padding-left: 1rem;
    background: var(--clr-grey-10);
    border-top-left-radius: var(--radius);
    border-bottom-left-radius: var(--radius);
    border-top-Right-radius: var(--radius);
    border-bottom-Right-radius: var(--radius);
    border-color: transparent;
    font-size: 1rem;
    flex: 0 0 5rem; /* Adjust width as needed */
    color: var(--clr-grey-5);
  }
  
  .country-code::placeholder {
    font-family: var(--ff-secondary);
    color: var(--clr-grey-5);
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
  .button-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 1rem;   
    
  }
  .show-list-btn {
    
    bottom: 20px; /* Adjust as needed */
    right: 20px; /* Adjust as needed */
    padding: 0.5rem 1rem;
    background: var(--clr-red-dark); /* Use your application's primary color */
    border: none;
    color: var(--clr-white); /* Use an appropriate text color for readability */
    border-radius: var(--radius);
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .show-list-btn:hover {
    background: var(--clr-primary-5); /* Change color on hover to match your theme */
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
  .title {
    margin-bottom: 0;
    color: var(--clr-grey-1);
    letter-spacing: 2px;
    transition: var(--transition);
  }
  
  .edit-btn,
  .delete-btn {
    background: transparent;
    border-color: transparent;
    cursor: pointer;
    font-size: 0.7rem;
    margin: 0 0.15rem;
    transition: var(--transition);
  }
  
  .edit-btn {
    color: var(--clr-green-light);
  }
  
  .edit-btn:hover {
    color: var(--clr-green-dark);
  }
  
  .delete-btn {
    color: var(--clr-red-light);
  }
  
  .delete-btn:hover {
    color: var(--clr-red-dark);
  }
  .list-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 600px;
    background: var(--clr-white);
    border-radius: var(--radius);
    box-shadow: var(--light-shadow);
    overflow-y: scroll;
    padding: 1rem;
    z-index: 1000; /* Ensure it appears above other elements */
    @media (max-width: 768px) {
        width: 90%; /* Adjust the width for screens with a max-width of 768px */
        height: 90vh; /* Adjust the height for smaller screens */
        padding: 0.5rem; /* Reduce padding for smaller screens */
      }
    
      @media (max-width: 480px) {
        width: 95%; /* Further adjust the width for screens with a max-width of 480px */
        height: 85vh; /* Further adjust the height for smaller screens */
        padding: 0.25rem; /* Reduce padding for smaller screens */
      }
  }
  
  .close-list-btn {
    position: absolute;
    top: 0;
    right: 0;
    padding: 0.5rem;
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    color: var(--clr-grey-1);
    transition: color 0.2s;
  }
  .name-container{
    display: flex;
    align-items: center;
    flex-direction: row;
    margin-bottom: 10px;
  }
  .close-list-btn:hover {
    color: var(--clr-grey-5);
  }
`

export default AddCompanySubcriber


