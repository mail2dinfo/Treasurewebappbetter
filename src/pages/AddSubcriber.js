import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import { useUserContext } from '../context/user_context';
import { API_BASE_URL } from '../utils/apiConfig';
// import AvatarGenerator from '../components/AvatarGenerator';
import AvatarUploader from '../components/AvatarUploader';
import AssignGroupAmountPopup from "../components/AssignGroupAmountPopup";
import ReactFlagsSelect from "react-flags-select";
import { useGroupDetailsContext } from '../context/group_context'

// Define countries array
const countries = [
  { value: "IN", label: "India", countryCode: "+91" },
  { value: "GB", label: "United Kingdom", countryCode: "+44" },
  { value: "LK", label: "Srilanka", countryCode: "+94" },
  { value: "NP", label: "Nepal", countryCode: "+977" },
  { value: "MY", label: "Malaysia", countryCode: "+60" },
  { value: "AE", label: "United Arab Emirates", countryCode: "+971" },
  { value: "SG", label: "Singapore", countryCode: "+65" },
  { value: "PK", label: "Pakistan", countryCode: "+92" },
  { value: "NG", label: "Nigeria", countryCode: "+234" },
  { value: "GH", label: "Ghana", countryCode: "+233" },
  { value: "TT", label: "Trinidad and Tobago", countryCode: "+1-868" },
  { value: "KE", label: "Kenya", countryCode: "+254" },
  { value: "ZA", label: "South Africa", countryCode: "+27" },
];


function AddSubcriber() {

  const { user } = useUserContext();
  const { groupId } = useParams();
  const [isLoading, setIsLoading] = useState(false);

  // const [image, setImage] = useState('');
  // const [previewImage, setPreviewImage] = useState('https://github.com/OlgaKoplik/CodePen/blob/master/profile.jpg?raw=true');


  const history = useHistory();
  const [mob, setMob] = useState('');
  const [name, setName] = useState('');
  const [, setList] = useState([]);
  const [isEditing] = useState(false);

  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const [, setAvatars] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubscriberAdded, setIsSubscriberAdded] = useState(false);


  // image upload
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null || "https://i.imgur.com/ndu6pfe.png");

  //country dropdown
  const [selectedCountry, setSelectedCountry] = useState("IN");

  const handleCountryChange = (countryCode) => {
    setSelectedCountry(countryCode);

  };

  const handleSetImage = (file) => {
    setSelectedImage(file);
  };
  //  const { state } = useGroupDetailsContext();
  //  const groupSubcriberResult = state?.data?.results?.groupSubcriberResult;


  const { data } = useGroupDetailsContext();

  console.log('Manikandan');
  console.log(data);

  const groupSubcriberResult = data?.results?.groupSubcriberResult || [];

  useEffect(() => {
    console.log("Group Subscriber Result from context:", groupSubcriberResult);

    setList(groupSubcriberResult);
    setAvatars(groupSubcriberResult);
    setIsLoading(false);

  }, [groupSubcriberResult]);

  // const fetchSubscribers = async () => {

  //   try {
  //     const apiUrl = `${API_BASE_URL}/groups/${groupId}/subscribers`;

  //     const response = await fetch(apiUrl, {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Bearer ${user?.results?.token}`,
  //         'Content-Type': 'application/json',
  //       },
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to fetch subscribers');
  //     }

  //     const data = await response.json();

  //     setList(data?.results?.subscriberList);
  //     setAvatars(data?.results?.subscriberList);
  //     // setTotalSubscribers(data?.total);
  //     setIsLoading(false);
  //   } catch (error) {
  //     console.error(error);
  //     setIsLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   const fetchSubscribers = async () => {
  //     try {
  //       const apiUrl = `${API_BASE_URL}/groups/${groupId}/subscribers`;

  //       const response = await fetch(apiUrl, {
  //         method: 'GET',
  //         headers: {
  //           'Authorization': `Bearer ${user?.results?.token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       });

  //       if (!response.ok) {
  //         throw new Error('Failed to fetch subscribers');
  //       }

  //       const data = await response.json();

  //       setList(data?.results?.subscriberList);
  //       setAvatars(data?.results?.subscriberList);
  //       // setTotalSubscribers(data?.total);
  //       setIsLoading(false);

  //     } catch (error) {
  //       console.error(error);
  //       setIsLoading(false);
  //     }
  //   };

  //   fetchSubscribers();
  // }, [groupId, isLoading]);

  const selectedCountryObj = countries.find((c) => c.value === selectedCountry);
  const countryCode = selectedCountryObj?.countryCode || '';
  const country = selectedCountryObj?.label || '';

  const handleAddSubscriber = (e) => {
    e.preventDefault();

    if (!mob) {
      showAlert(true, 'danger', 'Please enter a mobile number');
    } else if (!name) {
      showAlert(true, 'danger', 'Please enter a name');
    } else {
      setShowConfirmation(true); // Show confirmation modal
    }
  };

  // Confirm the addition of a subscriber
  const confirmAddSubscriber = (contributionAmount, contributionPercentage) => {

    postSubscriberData(contributionAmount, contributionPercentage);
  };

  // Submit subscriber data to the server
  const postSubscriberData = async (contributionAmount, contributionPercentage) => {
    setIsLoading(true);
    setShowConfirmation(false); // Close the confirmation modal
    let newImageUrl = '';

    if (selectedImage) {
      newImageUrl = await handleImageUpdate();
      console.log("Image URL:", newImageUrl);

      if (!newImageUrl) {
        setIsLoading(false);
        alert("Image upload failed.");
        return;
      }
    }
    const subData = {
      phoneOrEmail: mob,
      referredBy: user.results.userId,
      name: name,
      country: country,
      countryCode: countryCode,
      sourceSystem: 'WEB',
      groupId: groupId,
      userImage: newImageUrl || '', // Placeholder for image URL
      shareAmount: contributionAmount,  // Include contribution amount
      sharePercentage: contributionPercentage,
    };

    try {
      const apiUrl = `${API_BASE_URL}/subscribers`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.results?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subData),
      });

      if (response.ok) {
        const subJsonObject = await response.json();
        showAlert(true, 'success', subJsonObject.message);
        setIsSubscriberAdded(true);
        //fetchSubscribers(); // Refresh the subscriber list
      } else {
        const errorResponse = await response.json();
        showAlert(true, 'danger', errorResponse.message);
      }
    } catch (error) {
      console.error('An error occurred while adding the subscriber:', error);
      showAlert(true, 'danger', 'Failed to add the subscriber');
    } finally {
      setIsLoading(false);
    }
  };



  // const confirmAddSubscriber = async () => {

  // };
  useEffect(() => {
    if (isSubscriberAdded) {
      setMob('');
      setName('');
      setSelectedImage(null);
      setCurrentImage("https://i.imgur.com/ndu6pfe.png?" + new Date().getTime()); // Prevent caching
      setSelectedCountry("IN");
      setIsSubscriberAdded(false); // Reset flag after clearing
    }
  }, [isSubscriberAdded]);


  const showAlert = (show = false, type = '', msg = '') => {
    setAlert({ show, type, msg });
  };


  // const editItem = (id) => {
  //   const specificItem = list.find((item) => item.id === id);
  //   setIsEditing(true);
  //   setEditID(id);
  //   setMob(specificItem.title);
  // };
  const cancelAddSubscriber = () => {
    setShowConfirmation(false); // Close modal if user cancels
  };

  const handleBackButtonClick = () => {
    history.push(`/chit-fund/user/addgroupsubscriber/${groupId}`); // Use backticks (`) for template literals
  };
  const handleImageUpdate = async () => {
    if (!selectedImage) {
      return null;
    }

    const formData = new FormData();
    formData.append("image", selectedImage);


    try {
      const res = await fetch(`${API_BASE_URL}/images/update`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.imageUrl) {
        console.log('Pallam');
        console.log(data.imageUrl);
        setSelectedImage(null);
        return data.imageUrl; // ✅ return the actual imageUrl
      } else {
        alert(data.message || "Failed to update image");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating image.");
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBackButtonClick}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Add New Subscriber</h1>
            <p className="text-gray-600">Join a member to your group</p>
          </div>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Form Header */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Subscriber Information</h2>
                <p className="text-red-100">Fill in the details below</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <form onSubmit={handleAddSubscriber} className="space-y-6">
              {/* Country Selection */}
              <div className="space-y-2">
                <label htmlFor="country-select" className="block text-sm font-semibold text-gray-700">
                  Select Nationality
                </label>
                <div className="relative">
                  <ReactFlagsSelect
                    id="country-select"
                    selected={selectedCountry}
                    onSelect={handleCountryChange}
                    countries={countries.map((country) => country.value)}
                    showSelectedLabel={true}
                    searchable={true}
                    className="w-full"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Selected:</span> {countries.find((c) => c.value === selectedCountry)?.label}
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {countries.find((c) => c.value === selectedCountry)?.countryCode}
                    </span>
                  </p>
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Profile Picture
                </label>
                <div className="flex justify-center">
                  <AvatarUploader handleSetImage={handleSetImage} currentImage={currentImage} />
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="name"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Mobile Number Input */}
              <div className="space-y-2">
                <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="mobile"
                    placeholder="e.g. 9942393237"
                    value={mob}
                    onChange={(e) => setMob(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  />
                </div>
                <p className="text-xs text-gray-500">Enter mobile number without country code</p>
              </div>

              {/* Alert Messages */}
              {alert.show && (
                <div className="pt-2">
                  <div className={`p-4 rounded-lg border ${alert.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : alert.type === 'danger'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                    <div className="flex items-center gap-2">
                      {alert.type === 'success' && (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {alert.type === 'danger' && (
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className="font-medium">{alert.msg}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding Subscriber...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {isEditing ? "Update Subscriber" : "Add Subscriber"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <AssignGroupAmountPopup
            confirmAddSubscriber={confirmAddSubscriber}
            cancelAddSubscriber={cancelAddSubscriber}
          />
        )}
      </div>
    </div>
  );
}

export default AddSubcriber;
