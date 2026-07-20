// AddNewPopup.js
import React, { useState, useEffect } from 'react';
import { useUserContext } from '../context/user_context';
import { API_BASE_URL } from '../utils/apiConfig'


const popupStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
    zIndex: '1001', // Ensure it's above other elements
    width: '500px', // Adjust the width as needed
};

const inputStyle = {
    marginBottom: '10px',
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
};

const buttonStyle = {
    marginRight: '10px',
    padding: '8px 16px',
    borderRadius: '4px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
};

const countries = [
    { name: 'India', code: '+91' },
    { name: 'United States', code: '+1' },
    // Add more countries as needed
];

const AddNewPopup = ({ groupId, onClose, onRefresh }) => {
    const [name, setName] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('India');
    const [countryCode, setCountryCode] = useState('+91');
    const [mobile, setMobile] = useState('');
    const { user } = useUserContext();
    useEffect(() => {
        // Update the country code when the selected country changes
        const selectedCountryData = countries.find((country) => country.name === selectedCountry);
        if (selectedCountryData) {
            setCountryCode(selectedCountryData.code);
        }
    }, [selectedCountry]);

    const handleAddSubscriber = async () => {

        const subData = {

            phoneOrEmail: mobile,
            referredBy: user.results.userId,
            name: name,
            country: selectedCountry,
            countryCode: countryCode,
            sourceSystem: 'WEB',
            groupId: groupId,

        };
        console.log('man checking')
        console.log(subData);
        console.log(groupId);
        // Construct the URL for the API endpoint

        const apiUrl = `${API_BASE_URL}/subscribers`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.results.token}`, // Include the Bearer token
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subData),
            });

            if (response.ok) {

                const subJsonObject = await response.json(); //
                console.log(subJsonObject);
                onRefresh();
            } else {
                console.log(response.status, response.statusText);
                const errorResponse = await response.json(); // Parse the response body for more details
                console.error('Subscriber details not added:', errorResponse);
                // Handle error, maybe show an error message to the user
            }
        } catch (error) {
            console.error('An error occurred while submitting group details:', error);
            // Handle the error, e.g., show an error message to the user
        }
        // Add logic to send the subscriber data to the database.
        // You can use fetch or an API library for this purpose.

        // After successfully sending data, you can clear the input fields
        setName('');
        setMobile('');

        // Close the popup
        onClose();
    };

    return (
            <div style={popupStyle}>
                <h2>Add New Subscriber</h2>
                <div>
                    <label>Name:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label>Country:</label>
                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        style={inputStyle}
                    >
                        {countries.map((country) => (
                            <option key={country.name} value={country.name}>
                                {country.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Country Code:</label>
                    <input
                        type="text"
                        value={countryCode}
                        readOnly
                        style={inputStyle}
                    />
                </div>
                <div>
                    <label>Mobile Number:</label>
                    <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        style={inputStyle}
                    />
                </div>
                <button onClick={handleAddSubscriber} style={buttonStyle}>
                    Add
                </button>
                <button onClick={onClose} style={buttonStyle}>
                    Close
                </button>
            </div>
   
    );
};

export default AddNewPopup;
