import React, { useState, useEffect } from 'react';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { API_BASE_URL } from '../utils/apiConfig';
import loadingImage from '../images/preloader.gif';
import { useUserContext } from '../context/user_context';
import { usePlatformAccess } from '../context/platformAccess_context';
//To generate PDF need 3 imports
import { PDFDownloadLink } from '@react-pdf/renderer';
import { FiDownload } from 'react-icons/fi';
import SubscriberProfilePdf from '../components/PDF/SubscriberProfilePdf';
import AvatarUploader from '../components/AvatarUploader';
import Alert from '../components/Alert';
import EditableField from '../components/EditableField'
import Select from 'react-select';
import FixedMapPicker from '../components/FixedMapPicker';
import SimpleLocationPicker from '../components/SimpleLocationPicker';
import "../style/SubscriberProfile.css";

const SubscriberProfile = () => {
  const { user, userRole } = useUserContext();
  const platform = usePlatformAccess();
  const enforceSubscriberAccess = platform?.isAvailable && !platform.isOwner;
  const canChangeSubscriberPassword = !enforceSubscriberAccess
    || platform.hasPermission('chit_subscriber_change_password');
  const history = useHistory();
  const location = useLocation();
  const [visibleSection, setVisibleSection] = useState("metrics");
  const [subscriberOutstanding, setSubscriberOutstanding] = useState(null);
  const [inprogress, setInprogress] = useState(null);
  const [future, setFuture] = useState(null);
  const [closed, setClosed] = useState(null);


  const { id: subscriberId } = useParams();
  const [loading, setLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [subscriberData, setSubscriberData] = useState(formatSubscriberData({}));
  const [areasOfBusiness, setAreasOfBusiness] = useState([]);
  const [editState, setEditState] = useState({
    personalDetails: false,
    imageDetails: false,
    regionDetails: false,
    financials: false,
    addressDetails: false,
    bankDetails: false,
    financeDetails: false,
    nomineeDetails: false,
    businessDetails: false,
    dependents: false,
  });
  //start of PDF generation code
  const userCompany = user?.results?.userCompany;

  //show Alert button
  const [list, setList] = useState([]);
  const [alert, setAlert] = useState({ show: false, msg: '', type: '' });

  const showAlert = (show = false, type = '', msg = '') => {
    setAlert({ show, type, msg });
  };
  // image upload
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);

  // Map picker state
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [useSimplePicker, setUseSimplePicker] = useState(false);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  const handleSetImage = (file) => {
    setSelectedImage(file);
  };

  const handleImageSaveAndUserUpdate = async () => {
    if (!selectedImage) {
      alert("Please select an image before saving.");
      return false;
    }

    // Step 1: Upload image and get new URL
    const newImageUrl = await handleImageUpdate();
    console.log(newImageUrl);
    if (!newImageUrl) {
      alert("Image upload failed.");
      return false;
    }

    // Step 2: Prepare data to update user DB
    const updatedData = {

      imageKey: newImageUrl,

    };

    console.log('updatedData')
    console.log(updatedData)
    try {
      const response = await fetch(`${API_BASE_URL}/subscribers/${subscriberId}/section`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.results?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section: "imageDetails", data: updatedData }),
      });

      const responseData = await response.json();
      console.log(responseData)
      if (!response.ok) {
        showAlert(true, 'danger', responseData.errors || responseData.message || "An error occurred");
        return false;
      }

      showAlert(true, 'success', responseData.message);
      setPdfGenerating(true);
      return true;

    } catch (error) {
      console.error("Error updating user:", error);
      showAlert(true, 'danger', "Failed to update user profile.");
      return false;
    }
  };


  const handleImageUpdate = async () => {
    if (!selectedImage) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedImage);
    formData.append("imageKey", subscriberData.imageDetails.imageKey);

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









  const generateFileName = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `SubscriberProfile-${subscriberData.personalDetails.name}-${timestamp}.pdf`;
  };

  //end of PDF generation

  // To load region master data 
  const loadAreasOfBusiness = async () => {
    try {

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
      console.log(data);
      setAreasOfBusiness(data?.results);

    } catch (error) {
      console.error(error);

    }
  };

  useEffect(() => {
    loadAreasOfBusiness(); // ← Load AOB list on component mount
  }, []);


  function formatSubscriberData(res) {
    return {
      imageDetails: {
        subscriberId: res.id,
        imageKey: res.user_image,// this is image url
        imageFromS3: res.user_image_from_s3 || '',
        image: res.user_image_base64format || '',
      },
      personalDetails: {
        subscriberId: res.id,
        name: res.name || '',
        firstname: res.firstname || '',
        lastname: res.lastname || '',
        email: res.email || '',
        phone: res.phone || '',
        dob: res.dob || '',
        age: res.age || '',
        gender: res.gender || '',
        maritalStatus: res.marital_status || '',
        education: res.education || '',
        nationality: res.nationality || '',
        dateofjoining: res.created_at || '',
        source_system: res.source_system || ''
      },
      regionDetails: {
        region: res.aob_id || ''
      },
      addressDetails: {
        street: res.street_name || '',
        village: res.village_name || '',
        pincode: res.pincode || '',
        taluk: res.taluk || '',
        district: res.district || '',
        latitude: res.latitude || '',
        longitude: res.longitude || '',
      },
      bankDetails: {
        accountNumber: res.bank_account_number || '',
        bankName: res.bank_name || '',
        branch: res.bank_branch || '',
        ifsc: res.bank_ifsc || '',
      },
      financials: {
        totalPaid: res.total_paid ?? 0,
        totalDue: res.total_due ?? 0,
        totalAdvance: res.total_advance ?? 0,
      },
      financeDetails: {
        occupation: res.occupation || '',
        annualIncome: res.annual_income || '',
        adhar: res.aadhar || '',
        pan: res.pan || '',
      },
      nomineeDetails: {
        nominee: res.nominee || '',
        relationship: res.relationship_nominee || '',
      },
      businessDetails: {
        businessType: res.business_type || '',
        annualTurnover: res.annual_turnover || '',
      },
      dependents: {
        spouse_age: res.spouse_age || '',
        spouse_dob: res.spouse_dob || '',
        spouse_name: res.spouse_name || '',
      },
    };
  }



  // Fetch subscriber details form user table
  const fetchSubscriberData = async () => {
    try {
      console.log('Mandiayia');
      setLoading(true);
      const apiUrl = `${API_BASE_URL}/subscribers/${subscriberId}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.results?.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch subscriber data');

      const data = await response.json();
      console.log('kandippa');
      console.log(data);
      if (data.results?.subscriberDetailsResult?.length > 0) {
        const formatted = formatSubscriberData(data.results.subscriberDetailsResult[0]);
        setSubscriberData(formatted);
        setPdfGenerating(true);
        console.log('Hindustan')
        console.log(formatted)
        console.log('end of Hindustan')
      }

      if (data.results?.subscriberOutstandingResult?.length > 0) {
        setSubscriberOutstanding(data.results.subscriberOutstandingResult[0]);
      }

      if (data.results?.subscriberInprogressGroupResult?.length > 0) {
        setInprogress(data.results.subscriberInprogressGroupResult[0].group_count);
      }

      if (data.results?.subscriberFutureGroupResult?.length > 0) {
        setFuture(data.results.subscriberFutureGroupResult[0].group_count);
      } else {
        setFuture(0); // fallback to 0 if no future groups
      }

      if (data.results?.subscriberClosedGroupResult?.length > 0) {
        setClosed(data.results.subscriberClosedGroupResult[0].group_count);
      }
    } catch (error) {
      console.error('Error fetching subscriber data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriberData();
  }, []);

  useEffect(() => {
    if (subscriberData?.imageDetails?.imageFromS3) {
      setCurrentImage(subscriberData.imageDetails.imageFromS3);
    }
  }, [subscriberData]);



  // to load other fileds
  const toggleSectionEdit = async (section) => {
    if (editState[section]) {
      // Edit mode is active → attempt to save
      try {
        const updatedData = extractSectionData(section);
        console.log('mattu')
        console.log(updatedData)
        const response = await fetch(`${API_BASE_URL}/subscribers/${subscriberId}/section`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user?.results?.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ section, data: updatedData }),
        });
        const responseData = await response.json();
        if (!response.ok) {


          showAlert(true, 'danger', responseData.errors || responseData.message || "An error occurred");
        }

        showAlert(true, 'success', responseData.message);
        setPdfGenerating(true);
        // Optionally, refresh subscriber data here
      } catch (error) {
        console.error(`❌ Error updating ${section}:`, error.message || error);
        // Optionally show toast: toast.error(`Error updating ${section}`)
      }
    }

    // Toggle the section's edit mode
    setEditState((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  // To load only region
  const saveRegionDetails = async () => {
    const selected = areasOfBusiness.find(
      (area) => area.id === subscriberData.regionDetails.region
    );
    if (!selected) {
      showAlert(true, 'danger', 'Please select a valid region.');
      return;
    }

    try {
      const apiUrl = `${API_BASE_URL}/addSubscriberArea`;
      const requestBody = {
        membershipId: user?.results?.userAccounts[0]?.membershipId,
        subscriberId: subscriberId,
        aobId: selected.id,
        sourceSystem: 'WEB',
      };

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
        showAlert(responseData.message);

      } else {
        const errorData = await response.json();
        showAlert(true, 'danger', errorData.message);
      }
    } catch (error) {
      console.error(error);
      showAlert(true, 'danger', error.message);
    }
  };


  // Helper: extract only the specific section's data to send to the backend
  const extractSectionData = (section) => {
    if (section && subscriberData[section]) {
      return subscriberData[section];
    }
    return {};
  };

  const handleChange = (section, field, value) => {
    setSubscriberData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Map picker handlers
  const openMapPicker = () => {
    setIsMapOpen(true);
    setUseSimplePicker(false);
  };

  const openSimplePicker = () => {
    setIsMapOpen(true);
    setUseSimplePicker(true);
  };

  const closeMapPicker = () => {
    setIsMapOpen(false);
    setUseSimplePicker(false);
  };

  const handleLocationSelect = (lat, lng) => {
    setSubscriberData((prev) => ({
      ...prev,
      addressDetails: {
        ...prev.addressDetails,
        latitude: lat.toString(),
        longitude: lng.toString(),
      },
    }));
  };

  // Geocoding: Convert address to coordinates
  const geocodeAddress = async () => {
    const { street, village, taluk, district, pincode } = subscriberData.addressDetails;
    const addressParts = [street, village, taluk, district, pincode].filter(Boolean);

    if (addressParts.length === 0) {
      alert('Please enter at least some address details to locate on map');
      return;
    }

    const fullAddress = addressParts.join(', ');
    setIsGeocodingLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TreasureApp/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setSubscriberData((prev) => ({
          ...prev,
          addressDetails: {
            ...prev.addressDetails,
            latitude: lat,
            longitude: lon,
          },
        }));
        alert(`✅ Location found!\n\nAddress: ${fullAddress}\nCoordinates: ${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`);
      } else {
        alert('❌ Location not found. Please try:\n- Adding more address details\n- Checking spelling\n- Using the map picker to select manually');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('❌ Unable to locate address. Please use the map picker to select location manually.');
    } finally {
      setIsGeocodingLoading(false);
    }
  };
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
        <img
          src={loadingImage}
          alt="Loading..."
          style={{ maxWidth: '100px', maxHeight: '100px' }}
        />
      </div>
    );
  }



  const personalFields = [
    { label: 'Name', key: 'name' },
    { label: 'First Name', key: 'firstname' },
    { label: 'Last Name', key: 'lastname' },
    { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' },
    { label: 'Date of Birth', key: 'dob' },
    { label: 'Age', key: 'age' },
    { label: 'Gender', key: 'gender' },
    { label: 'Marital Status', key: 'maritalStatus' },
    { label: 'Education', key: 'education' },
    { label: 'Nationality', key: 'nationality' },

    { label: 'Date of Joining', key: 'dateofjoining', readOnly: true },
    { label: 'Source System', key: 'source_system' },
  ];

  const openModal = (section) => {
    setVisibleSection(section);
  };
  // return (
  //   <Container>
  //     <section style={{ textAlign: 'center', marginTop: '2rem' }}>

  //       <AvatarUploader handleSetImage={handleSetImage} currentImage={currentImage} />
  //       <


  //         onClick={handleImageSaveAndUserUpdate}
  //       >
  //         Upload Image
  //       </EditButton>

  //       <div style={{ marginBottom: '1rem' }}>
  //         <PDFDownloadLink
  //           document={
  //             <SubscriberProfilePdf
  //               subcriberData={subscriberData}
  //               companyData={userCompany}
  //             />
  //           }
  //           fileName={generateFileName()}
  //         >
  //           {({ pdfGenerating }) =>
  //             pdfGenerating ? (
  //               'Loading document...'
  //             ) : (
  //               <button
  //                 style={{
  //                   backgroundColor: '#28a745',
  //                   color: '#fff',
  //                   padding: '10px 20px',
  //                   border: 'none',
  //                   borderRadius: '5px',
  //                   cursor: 'pointer'
  //                 }}
  //               >
  //                 <FiDownload style={{ marginRight: '8px' }} />
  //                 Download PDF
  //               </button>
  //             )
  //           }
  //         </PDFDownloadLink>
  //       </div>
  //     </section>


  //     <Section>
  //       <h2>Personal Details</h2>
  //       <EditButton onClick={() => toggleSectionEdit('personalDetails')}>
  //         {editState.personalDetails ? 'Save' : 'Edit'}
  //       </EditButton>

  //       {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}

  //       {personalFields.map(({ label, key, readOnly }) => (
  //         <EditableField
  //           key={key}
  //           label={label}
  //           value={subscriberData.personalDetails[key]}
  //           editable={editState.personalDetails}
  //           onChange={(val) => handleChange('personalDetails', key, val)}
  //           placeholder={label}
  //           readOnly={readOnly}
  //         />
  //       ))}
  //     </Section>

  //     <Section>
  //       <h2>Region Details</h2>
  //       <EditButton
  //         onClick={() => {
  //           if (editState.regionDetails) {
  //             saveRegionDetails(); // Save only when switching from edit to view
  //           }
  //           toggleSectionEdit('regionDetails');
  //         }}
  //       >
  //         {editState.regionDetails ? 'Save' : 'Edit'}
  //       </EditButton>

  //       {editState.regionDetails ? (
  //         <Select
  //           value={
  //             areasOfBusiness
  //               .map((area) => ({ label: area.aob, value: area.id }))
  //               .find((option) => option.value === subscriberData.regionDetails.region) || null
  //           }
  //           onChange={(selected) =>
  //             handleChange('regionDetails', 'region', selected ? selected.value : null)
  //           }
  //           options={areasOfBusiness.map((area) => ({
  //             label: area.aob,
  //             value: area.id,
  //           }))}
  //           placeholder="Select Region"
  //           isClearable
  //         />
  //       ) : (
  //         <p>
  //           {
  //             areasOfBusiness.find(
  //               (area) => area.id === subscriberData.regionDetails.region
  //             )?.aob || '—'
  //           }
  //         </p>
  //       )}
  //     </Section>

  //     <Section>
  //       <h2>Address</h2>
  //       <EditButton onClick={() => toggleSectionEdit('addressDetails')}>
  //         {editState.addressDetails ? 'Save' : 'Edit'}
  //       </EditButton>
  //       {editState.addressDetails ? (
  //         <>
  //           <Input
  //             value={subscriberData.addressDetails.street}
  //             onChange={(e) => handleChange('addressDetails', 'street', e.target.value)}
  //             placeholder="Street"
  //           />
  //           <Input
  //             value={subscriberData.addressDetails.village}
  //             onChange={(e) => handleChange('addressDetails', 'village', e.target.value)}
  //             placeholder="Village"
  //           />
  //           <Input
  //             value={subscriberData.addressDetails.pincode}
  //             onChange={(e) => handleChange('addressDetails', 'pincode', e.target.value)}
  //             placeholder="Pincode"
  //           />
  //           <Input
  //             value={subscriberData.addressDetails.taluk}
  //             onChange={(e) => handleChange('addressDetails', 'taluk', e.target.value)}
  //             placeholder="Taluk"
  //           />
  //           <Input
  //             value={subscriberData.addressDetails.district}
  //             onChange={(e) => handleChange('addressDetails', 'district', e.target.value)}
  //             placeholder="District"
  //           />
  //         </>
  //       ) : (
  //         <p>
  //           Street: {subscriberData.addressDetails.street} <br />
  //           Village: {subscriberData.addressDetails.village} <br />
  //           Pincode: {subscriberData.addressDetails.pincode} <br />
  //           Taluk: {subscriberData.addressDetails.taluk} <br />
  //           District: {subscriberData.addressDetails.district}
  //         </p>
  //       )}
  //     </Section>


  //     <Section>
  //       <h2>Bank</h2>
  //       <EditButton onClick={() => toggleSectionEdit('bankDetails')}>
  //         {editState.bankDetails ? 'Save' : 'Edit'}
  //       </EditButton>
  //       {editState.bankDetails ? (
  //         <>
  //           <Input
  //             value={subscriberData.bankDetails.accountNumber}
  //             onChange={(e) => handleChange('bankDetails', 'accountNumber', e.target.value)}
  //             placeholder="Account Number"
  //           />
  //           <Input
  //             value={subscriberData.bankDetails.bankName}
  //             onChange={(e) => handleChange('bankDetails', 'bankName', e.target.value)}
  //             placeholder="Bank Name"
  //           />
  //           <Input
  //             value={subscriberData.bankDetails.branch}
  //             onChange={(e) => handleChange('bankDetails', 'branch', e.target.value)}
  //             placeholder="Branch"
  //           />
  //           <Input
  //             value={subscriberData.bankDetails.ifsc}
  //             onChange={(e) => handleChange('bankDetails', 'ifsc', e.target.value)}
  //             placeholder="IFSC"
  //           />
  //         </>
  //       ) : (
  //         <p>
  //           Account Number: {subscriberData.bankDetails.accountNumber} <br />
  //           Bank Name: {subscriberData.bankDetails.bankName} <br />
  //           Branch: {subscriberData.bankDetails.branch} <br />
  //           IFSC: {subscriberData.bankDetails.ifsc}
  //         </p>
  //       )}
  //     </Section>
  //     <Section>
  //       <h2>Finance</h2>
  //       <EditButton onClick={() => toggleSectionEdit('financeDetails')}>
  //         {editState.financeDetails ? 'Save' : 'Edit'}
  //       </EditButton>
  //       {editState.financeDetails ? (
  //         <>
  //           <Input
  //             value={subscriberData.financeDetails.occupation}
  //             onChange={(e) => handleChange('financeDetails', 'occupation', e.target.value)}
  //             placeholder="Occupation"
  //           />
  //           <Input
  //             value={subscriberData.financeDetails.annualIncome}
  //             onChange={(e) => handleChange('financeDetails', 'annualIncome', e.target.value)}
  //             placeholder="Annual Income"
  //           />
  //           <Input
  //             value={subscriberData.financeDetails.adhar}
  //             onChange={(e) => handleChange('financeDetails', 'adhar', e.target.value)}
  //             placeholder="Aadhar"
  //           />
  //           <Input
  //             value={subscriberData.financeDetails.pan}
  //             onChange={(e) => handleChange('financeDetails', 'pan', e.target.value)}
  //             placeholder="PAN"
  //           />
  //         </>
  //       ) : (
  //         <p>
  //           Occupation: {subscriberData.financeDetails.occupation} <br />
  //           Annual Income: {subscriberData.financeDetails.annualIncome} <br />
  //           Aadhar: {subscriberData.financeDetails.adhar} <br />
  //           PAN: {subscriberData.financeDetails.pan}
  //         </p>
  //       )}
  //     </Section>

  //     <Section>
  //       <h2>Nominee</h2>
  //       <EditButton onClick={() => toggleSectionEdit('nomineeDetails')}>
  //         {editState.nomineeDetails ? 'Save' : 'Edit'}
  //       </EditButton>
  //       {editState.nomineeDetails ? (
  //         <>
  //           <Input
  //             value={subscriberData.nomineeDetails.nominee}
  //             onChange={(e) => handleChange('nomineeDetails', 'nominee', e.target.value)}
  //             placeholder="Nominee"
  //           />
  //           <Input
  //             value={subscriberData.nomineeDetails.relationship}
  //             onChange={(e) => handleChange('nomineeDetails', 'relationship', e.target.value)}
  //             placeholder="Relationship"
  //           />
  //         </>
  //       ) : (
  //         <p>
  //           Nominee: {subscriberData.nomineeDetails.nominee} <br />
  //           Relationship: {subscriberData.nomineeDetails.relationship}
  //         </p>
  //       )}
  //     </Section>

  //     <Section>
  //       <h2>Business</h2>
  //       <EditButton onClick={() => toggleSectionEdit('businessDetails')}>
  //         {editState.businessDetails ? 'Save' : 'Edit'}
  //       </EditButton>
  //       {editState.businessDetails ? (
  //         <>
  //           <Input
  //             value={subscriberData.businessDetails.businessType}
  //             onChange={(e) => handleChange('businessDetails', 'businessType', e.target.value)}
  //             placeholder="Business Type"
  //           />
  //           <Input
  //             value={subscriberData.businessDetails.annualTurnover}
  //             onChange={(e) => handleChange('businessDetails', 'annualTurnover', e.target.value)}
  //             placeholder="Annual Turnover"
  //           />
  //         </>
  //       ) : (
  //         <p>
  //           Business Type: {subscriberData.businessDetails.businessType} <br />
  //           Annual Turnover: {subscriberData.businessDetails.annualTurnover}
  //         </p>
  //       )}
  //     </Section>

  //     <Section>
  //       <h2>Dependents</h2>
  //       <EditButton onClick={() => toggleSectionEdit('dependents')}>
  //         {editState.dependents ? 'Save' : 'Edit'}
  //       </EditButton>
  //       {editState.dependents ? (
  //         <>
  //           <Input
  //             value={subscriberData.dependents.spouse_name}
  //             onChange={(e) => handleChange('dependents', 'spouse_name', e.target.value)}
  //             placeholder="Spouse Name"
  //           />
  //           <Input
  //             value={subscriberData.dependents.spouse_age}
  //             onChange={(e) => handleChange('dependents', 'spouse_age', e.target.value)}
  //             placeholder="Spouse Age"
  //           />
  //           <input
  //             type="date"
  //             value={subscriberData.dependents.spouse_dob}
  //             onChange={(e) => handleChange('dependents', 'spouse_dob', e.target.value)}
  //             placeholder="Spouse DOB"
  //             style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginTop: '8px' }}
  //           />
  //         </>
  //       ) : (
  //         <p>
  //           Spouse: {subscriberData.dependents.spouse_name} <br />
  //           Spouse Age: {subscriberData.dependents.spouse_age} <br />
  //           Spouse DOB: {
  //             subscriberData.dependents.spouse_dob
  //               ? new Date(subscriberData.dependents.spouse_dob).toLocaleDateString('en-GB')
  //               : ''
  //           }
  //         </p>
  //       )}
  //     </Section>



  //   </Container>
  // );

  return (
    <div className="subscriber-profile-container">
      <div className="subscriber-profile-sidebar">
        {/* Upload Image & Download PDF */}
        <section className="sidebar-top">
          <AvatarUploader handleSetImage={handleSetImage} currentImage={currentImage} />

          <button className="sidebar-upload-button" onClick={handleImageSaveAndUserUpdate}>
            Upload Image
          </button>

          <PDFDownloadLink
            document={
              <SubscriberProfilePdf
                subcriberData={subscriberData}
                companyData={userCompany}
              />
            }
            fileName={generateFileName()}
          >
            {({ pdfGenerating }) =>
              pdfGenerating ? (
                'Loading document...'
              ) : (
                <button className="sidebar-download-button">
                  <FiDownload style={{ marginRight: '8px' }} />
                  Download PDF
                </button>
              )
            }
          </PDFDownloadLink>
        </section>

        {/* Sidebar Menu */}
        <h2 className="sidebar-title">Sections</h2>
        <ul className="sidebar-nav">
          <li
            className={visibleSection === 'metrics' ? 'active' : ''}
            onClick={() => setVisibleSection('metrics')}
          >
            Dashboard
          </li>
          <li
            className={visibleSection === 'personal' ? 'active' : ''}
            onClick={() => setVisibleSection('personal')}
          >
            Profile
          </li>
          <li
            className={visibleSection === 'address' ? 'active' : ''}
            onClick={() => setVisibleSection('address')}
          >
            Address
          </li>
          <li
            className={visibleSection === 'region' ? 'active' : ''}
            onClick={() => setVisibleSection('region')}
          >
            Region
          </li>
          <li
            className={visibleSection === 'bank' ? 'active' : ''}
            onClick={() => setVisibleSection('bank')}
          >
            Bank Info
          </li>
          <li
            className={visibleSection === 'finance' ? 'active' : ''}
            onClick={() => setVisibleSection('finance')}
          >
            Finance
          </li>
          <li
            className={visibleSection === 'nominee' ? 'active' : ''}
            onClick={() => setVisibleSection('nominee')}
          >
            Nominee
          </li>
          <li
            className={visibleSection === 'business' ? 'active' : ''}
            onClick={() => setVisibleSection('business')}
          >
            Business
          </li>
          <li
            className={visibleSection === 'dependents' ? 'active' : ''}
            onClick={() => setVisibleSection('dependents')}
          >
            Dependents
          </li>
          {canChangeSubscriberPassword && (
            <li
              onClick={() => history.push(`${location.pathname.replace(/\/$/, '')}/update-password`)}
              className="change-password-link"
            >
              Change Password
            </li>
          )}
        </ul>
      </div>

      <div className="profile-content">
        {visibleSection === 'metrics' && (
          <>
            <div className="metrics">
              <div className="card yellow" onClick={() => openModal("Running Groups: 3")}>
                <h3>Inprogress </h3>
                <p className="big-number">{inprogress}</p>
              </div>
              <div className="card yellow" onClick={() => openModal("Running Groups: 3")}>
                <h3>Future </h3>
                <p className="big-number">{future}</p>
              </div>
              <div className="card yellow" onClick={() => openModal("Closed Groups: 2")}>
                <h3>Closed </h3>
                <p className="big-number">{closed}</p>
              </div>
              <div className="card yellow" onClick={() => openModal("Score: 87")}>
                <h3>Score</h3>
                <p className="big-number">87</p>
              </div>
              {subscriberOutstanding && (
                <>
                  <div
                    className="card yellow"
                    onClick={() => openModal(`Total : ₹${subscriberOutstanding.total}`)}
                  >
                    <h3>Total </h3>
                    <p className="big-number">₹{subscriberOutstanding.total}</p>
                  </div>

                  <div
                    className="card yellow"
                    onClick={() => openModal(`Total Paid: ₹${subscriberOutstanding.paid}`)}
                  >
                    <h3>Total Paid</h3>
                    <p className="big-number">₹{subscriberOutstanding.paid}</p>
                  </div>

                  <div
                    className="card yellow"
                    onClick={() => openModal(`Total due: ₹${subscriberOutstanding.due}`)}
                  >
                    <h3>Total due</h3>
                    <p className="big-number">₹{subscriberOutstanding.due}</p>
                  </div>
                </>
              )}


            </div>


            <div className="wish-container">
              <h2>Customer Wishes</h2>
              <div className="wish-card">
                <h3>₹1,00,000 Group</h3>
                <p><strong>Start Date:</strong> 01-July-2025</p>
                <p><strong>Interest:</strong> Yes</p>
                <p><strong>Comment:</strong> Looking for early auction options and lower commission.</p>
              </div>
              <div className="wish-card green-border">
                <h3>₹2,00,000 Group</h3>
                <p><strong>Start Date:</strong> 15-July-2025</p>
                <p><strong>Interest:</strong> Yes</p>
                <p><strong>Comment:</strong> Prefer weekend bidding and digital participation.</p>
              </div>
            </div>
          </>
        )}

        {visibleSection === 'personal' && (
          <div className="sections">
            <h2>Personal Details</h2>
            <button className="edit-button" onClick={() => toggleSectionEdit('personalDetails')}>
              {editState.personalDetails ? 'Save' : 'Edit'}
            </button>
            {alert.show && <Alert {...alert} removeAlert={showAlert} list={list} />}
            {personalFields.map(({ label, key, readOnly }) => (
              <EditableField
                key={key}
                label={label}
                value={subscriberData.personalDetails[key]}
                editable={editState.personalDetails}
                onChange={(val) => handleChange('personalDetails', key, val)}
                placeholder={label}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}

        {/* Region */}
        {visibleSection === 'region' && (
          <div className="sections">
            <h2>Region Details</h2>
            <button className="edit-button" onClick={() => {
              if (editState.regionDetails) saveRegionDetails();
              toggleSectionEdit('regionDetails');
            }}>
              {editState.regionDetails ? 'Save' : 'Edit'}
            </button>
            {editState.regionDetails ? (
              <Select
                value={
                  areasOfBusiness
                    .map((area) => ({ label: area.aob, value: area.id }))
                    .find((option) => option.value === subscriberData.regionDetails.region) || null
                }
                onChange={(selected) =>
                  handleChange('regionDetails', 'region', selected ? selected.value : null)
                }
                options={areasOfBusiness.map((area) => ({
                  label: area.aob,
                  value: area.id,
                }))}
                placeholder="Select Region"
                isClearable
              />
            ) : (
              <p>
                {
                  areasOfBusiness.find(
                    (area) => area.id === subscriberData.regionDetails.region
                  )?.aob || '—'
                }
              </p>
            )}
          </div>
        )}

        {/* Address */}
        {visibleSection === 'address' && (
          <div className="sections">
            <h2>Address</h2>
            <button className="edit-button" onClick={() => toggleSectionEdit('addressDetails')}>
              {editState.addressDetails ? 'Save' : 'Edit'}
            </button>
            {editState.addressDetails ? (
              <>
                <input
                  value={subscriberData.addressDetails.street}
                  onChange={(e) => handleChange('addressDetails', 'street', e.target.value)}
                  placeholder="Street"
                />
                <input
                  value={subscriberData.addressDetails.village}
                  onChange={(e) => handleChange('addressDetails', 'village', e.target.value)}
                  placeholder="Village"
                />
                <input
                  value={subscriberData.addressDetails.pincode}
                  onChange={(e) => handleChange('addressDetails', 'pincode', e.target.value)}
                  placeholder="Pincode"
                />
                <input
                  value={subscriberData.addressDetails.taluk}
                  onChange={(e) => handleChange('addressDetails', 'taluk', e.target.value)}
                  placeholder="Taluk"
                />
                <input
                  value={subscriberData.addressDetails.district}
                  onChange={(e) => handleChange('addressDetails', 'district', e.target.value)}
                  placeholder="District"
                />

                {/* Location Coordinates Section */}
                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f0f7ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#2563eb', fontSize: '16px' }}>📍 Location Coordinates</h4>

                  {/* Auto-Locate Button */}
                  <button
                    type="button"
                    onClick={geocodeAddress}
                    disabled={isGeocodingLoading}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '10px',
                      backgroundColor: isGeocodingLoading ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isGeocodingLoading ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isGeocodingLoading ? (
                      <>
                        <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                        Searching...
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        Find Location from Address
                      </>
                    )}
                  </button>

                  {/* Map Picker Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={openMapPicker}
                      style={{
                        padding: '10px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>🗺️</span>
                      Select on Map
                    </button>
                    <button
                      type="button"
                      onClick={openSimplePicker}
                      style={{
                        padding: '10px',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>📍</span>
                      Enter Manually
                    </button>
                  </div>

                  {/* Coordinate Input Fields */}
                  <input
                    type="number"
                    step="any"
                    value={subscriberData.addressDetails.latitude}
                    onChange={(e) => handleChange('addressDetails', 'latitude', e.target.value)}
                    placeholder="Latitude (e.g., 12.9716)"
                    style={{ marginBottom: '8px', width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                  <input
                    type="number"
                    step="any"
                    value={subscriberData.addressDetails.longitude}
                    onChange={(e) => handleChange('addressDetails', 'longitude', e.target.value)}
                    placeholder="Longitude (e.g., 77.5946)"
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />

                  {/* Current Coordinates Display */}
                  {(subscriberData.addressDetails.latitude && subscriberData.addressDetails.longitude) && (
                    <div style={{ marginTop: '10px', padding: '8px', backgroundColor: 'white', borderRadius: '6px', fontSize: '13px' }}>
                      <strong>Current Location:</strong><br />
                      📍 {subscriberData.addressDetails.latitude}, {subscriberData.addressDetails.longitude}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p>
                Street: {subscriberData.addressDetails.street} <br />
                Village: {subscriberData.addressDetails.village} <br />
                Pincode: {subscriberData.addressDetails.pincode} <br />
                Taluk: {subscriberData.addressDetails.taluk} <br />
                District: {subscriberData.addressDetails.district}
                {(subscriberData.addressDetails.latitude && subscriberData.addressDetails.longitude) && (
                  <>
                    <br /><br />
                    <strong>📍 Location:</strong><br />
                    Latitude: {subscriberData.addressDetails.latitude} <br />
                    Longitude: {subscriberData.addressDetails.longitude}
                    <br />
                    <a
                      href={`https://www.google.com/maps?q=${subscriberData.addressDetails.latitude},${subscriberData.addressDetails.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#2563eb', textDecoration: 'underline', marginTop: '5px', display: 'inline-block' }}
                    >
                      🗺️ View on Google Maps
                    </a>
                  </>
                )}
              </p>
            )}
          </div>
        )}

        {/* Bank */}
        {visibleSection === 'bank' && (
          <div className="sections">
            <h2>Bank</h2>
            <button className="edit-button" onClick={() => toggleSectionEdit('bankDetails')}>
              {editState.bankDetails ? 'Save' : 'Edit'}
            </button>
            {editState.bankDetails ? (
              <>
                <input
                  value={subscriberData.bankDetails.accountNumber}
                  onChange={(e) => handleChange('bankDetails', 'accountNumber', e.target.value)}
                  placeholder="Account Number"
                />
                <input
                  value={subscriberData.bankDetails.bankName}
                  onChange={(e) => handleChange('bankDetails', 'bankName', e.target.value)}
                  placeholder="Bank Name"
                />
                <input
                  value={subscriberData.bankDetails.branch}
                  onChange={(e) => handleChange('bankDetails', 'branch', e.target.value)}
                  placeholder="Branch"
                />
                <input
                  value={subscriberData.bankDetails.ifsc}
                  onChange={(e) => handleChange('bankDetails', 'ifsc', e.target.value)}
                  placeholder="IFSC"
                />
              </>
            ) : (
              <p>
                Account Number: {subscriberData.bankDetails.accountNumber} <br />
                Bank Name: {subscriberData.bankDetails.bankName} <br />
                Branch: {subscriberData.bankDetails.branch} <br />
                IFSC: {subscriberData.bankDetails.ifsc}
              </p>
            )}
          </div>
        )}

        {/* Finance */}
        {visibleSection === 'finance' && (
          <div className="sections">
            <h2>Finance</h2>
            <button className="edit-button" onClick={() => toggleSectionEdit('financeDetails')}>
              {editState.financeDetails ? 'Save' : 'Edit'}
            </button>
            {editState.financeDetails ? (
              <>
                <input
                  value={subscriberData.financeDetails.occupation}
                  onChange={(e) => handleChange('financeDetails', 'occupation', e.target.value)}
                  placeholder="Occupation"
                />
                <input
                  value={subscriberData.financeDetails.annualIncome}
                  onChange={(e) => handleChange('financeDetails', 'annualIncome', e.target.value)}
                  placeholder="Annual Income"
                />
                <input
                  value={subscriberData.financeDetails.adhar}
                  onChange={(e) => handleChange('financeDetails', 'adhar', e.target.value)}
                  placeholder="Aadhar"
                />
                <input
                  value={subscriberData.financeDetails.pan}
                  onChange={(e) => handleChange('financeDetails', 'pan', e.target.value)}
                  placeholder="PAN"
                />
              </>
            ) : (
              <p>
                Occupation: {subscriberData.financeDetails.occupation} <br />
                Annual Income: {subscriberData.financeDetails.annualIncome} <br />
                Aadhar: {subscriberData.financeDetails.adhar} <br />
                PAN: {subscriberData.financeDetails.pan}
              </p>
            )}
          </div>
        )}

        {/* Nominee */}
        {visibleSection === 'nominee' && (
          <div className="sections">
            <h2>Nominee</h2>
            <button className="edit-button" onClick={() => toggleSectionEdit('nomineeDetails')}>
              {editState.nomineeDetails ? 'Save' : 'Edit'}
            </button>
            {editState.nomineeDetails ? (
              <>
                <input
                  value={subscriberData.nomineeDetails.nominee}
                  onChange={(e) => handleChange('nomineeDetails', 'nominee', e.target.value)}
                  placeholder="Nominee"
                />
                <input
                  value={subscriberData.nomineeDetails.relationship}
                  onChange={(e) => handleChange('nomineeDetails', 'relationship', e.target.value)}
                  placeholder="Relationship"
                />
              </>
            ) : (
              <p>
                Nominee: {subscriberData.nomineeDetails.nominee} <br />
                Relationship: {subscriberData.nomineeDetails.relationship}
              </p>
            )}
          </div>
        )}

        {/* Business */}
        {visibleSection === 'business' && (
          <div className="sections">
            <h2>Business</h2>
            <button className="edit-button" onClick={() => toggleSectionEdit('businessDetails')}>
              {editState.businessDetails ? 'Save' : 'Edit'}
            </button>
            {editState.businessDetails ? (
              <>
                <input
                  value={subscriberData.businessDetails.businessType}
                  onChange={(e) => handleChange('businessDetails', 'businessType', e.target.value)}
                  placeholder="Business Type"
                />
                <input
                  value={subscriberData.businessDetails.annualTurnover}
                  onChange={(e) => handleChange('businessDetails', 'annualTurnover', e.target.value)}
                  placeholder="Annual Turnover"
                />
              </>
            ) : (
              <p>
                Business Type: {subscriberData.businessDetails.businessType} <br />
                Annual Turnover: {subscriberData.businessDetails.annualTurnover}
              </p>
            )}
          </div>
        )}

        {/* Dependents */}
        {visibleSection === 'dependents' && (
          <div className="sections">
            <h2>Dependents</h2>
            <button className="edit-button" onClick={() => toggleSectionEdit('dependents')}>
              {editState.dependents ? 'Save' : 'Edit'}
            </button>
            {editState.dependents ? (
              <>
                <input
                  value={subscriberData.dependents.spouse_name}
                  onChange={(e) => handleChange('dependents', 'spouse_name', e.target.value)}
                  placeholder="Spouse Name"
                />
                <input
                  value={subscriberData.dependents.spouse_age}
                  onChange={(e) => handleChange('dependents', 'spouse_age', e.target.value)}
                  placeholder="Spouse Age"
                />
                <input
                  type="date"
                  value={subscriberData.dependents.spouse_dob}
                  onChange={(e) => handleChange('dependents', 'spouse_dob', e.target.value)}
                  placeholder="Spouse DOB"
                />
              </>
            ) : (
              <p>
                Spouse: {subscriberData.dependents.spouse_name} <br />
                Spouse Age: {subscriberData.dependents.spouse_age} <br />
                Spouse DOB:{' '}
                {subscriberData.dependents.spouse_dob
                  ? new Date(subscriberData.dependents.spouse_dob).toLocaleDateString('en-GB')
                  : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Map Picker Modals */}
      {isMapOpen && (
        <div>
          {useSimplePicker ? (
            <SimpleLocationPicker
              latitude={subscriberData.addressDetails.latitude}
              longitude={subscriberData.addressDetails.longitude}
              onLocationSelect={handleLocationSelect}
              isOpen={isMapOpen}
              onClose={closeMapPicker}
            />
          ) : (
            <FixedMapPicker
              latitude={subscriberData.addressDetails.latitude}
              longitude={subscriberData.addressDetails.longitude}
              onLocationSelect={handleLocationSelect}
              isOpen={isMapOpen}
              onClose={closeMapPicker}
            />
          )}
        </div>
      )}
    </div>
  );


};

export default SubscriberProfile;

// // Styled Components
// const Container = styled.div`
//   max-width: 700px;
//   margin: 0 auto;
//   padding: 2rem;
// `;

// const Section = styled.div`
//   margin-bottom: 2rem;
//   border: 1px solid #ddd;
//   padding: 1rem;
//   border-radius: 8px;
// `;

// const EditButton = styled.button`
//   float: right;
//   margin-top: -2rem;
//   background-color: #007bff;
//   color: white;
//   border: none;
//   padding: 6px 12px;
//   border-radius: 4px;
//   cursor: pointer;
// `;

// const Input = styled.input`
//   display: block;
//   margin: 0.5rem 0;
//   padding: 8px;
//   width: 100%;
//   border: 1px solid #ccc;
//   border-radius: 4px;
// `;

// const Centered = styled.div`
//   text-align: center;
//   margin-top: 100px;
// `;

